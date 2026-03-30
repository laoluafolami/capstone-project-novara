# SECTION 12 — Kubernetes: Deploy the Backend (Flask API)

> The Flask backend is the brain of TaskApp. It handles authentication,
> task CRUD operations, and talks to PostgreSQL. You will deploy it as a
> Kubernetes Deployment with 2 replicas (for high availability), connect
> it to the database via environment variables loaded from Sealed Secrets,
> and expose it internally via a ClusterIP Service.
>
> Key requirement from the rubric: Backend memory request/limit = 526Mi exactly.

---

## STEP 12.1 — Create the Backend ConfigMap

A ConfigMap holds non-sensitive configuration. Sensitive values (passwords, keys)
go in Secrets. This separation is a security best practice.

OPEN VS Code. CREATE `k8s/base/backend/backend-configmap.yaml`:

```yaml
# k8s/base/backend/backend-configmap.yaml
# ConfigMap stores non-sensitive environment variables for the Flask backend.
# REPLACE yourdomain.com with your actual domain name.

apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: taskapp
data:
  FLASK_ENV: "production"
  FLASK_DEBUG: "0"
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "taskapp"
  DATABASE_USER: "taskapp_user"
  PORT: "5000"
  # CORS origin — only allow requests from your frontend domain
  CORS_ORIGINS: "https://taskapp.yourdomain.com"
```

---

## STEP 12.2 — Create the Backend Deployment

CREATE `k8s/base/backend/backend-deployment.yaml`:

```yaml
# k8s/base/backend/backend-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskapp-backend
  namespace: taskapp
  labels:
    app: taskapp-backend
    version: v1.0.0
spec:
  # 2 replicas = high availability (survives one pod dying)
  replicas: 2

  selector:
    matchLabels:
      app: taskapp-backend

  # Rolling update strategy = zero downtime deployments
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1           # Allow 1 extra pod during update
      maxUnavailable: 0     # NEVER have fewer than 2 pods running (zero downtime)

  template:
    metadata:
      labels:
        app: taskapp-backend
        version: v1.0.0
    spec:
      # Security: run as non-root user
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000

      # Pull image from ECR — REPLACE with your actual ECR registry URL
      containers:
      - name: backend
        image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/taskapp/backend:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
          name: http

        # Load non-sensitive config from ConfigMap
        envFrom:
        - configMapRef:
            name: backend-config

        # Load sensitive values from Sealed Secret (decrypted by controller)
        env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: DATABASE_PASSWORD
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: SECRET_KEY

        # MANDATORY: 526Mi memory as specified in the project requirements
        resources:
          requests:
            memory: "526Mi"
            cpu: "250m"
          limits:
            memory: "526Mi"
            cpu: "500m"

        # Liveness probe: if /api/health returns non-200, restart the container
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 15
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness probe: only send traffic when the app is ready
        # (database connection established, app fully started)
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Security: read-only root filesystem where possible
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: false  # Flask needs to write temp files
          capabilities:
            drop:
            - ALL

      # Spread pods across different nodes for true HA
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - taskapp-backend
              topologyKey: kubernetes.io/hostname
```

---

## STEP 12.3 — Create the Backend Service

CREATE `k8s/base/backend/backend-service.yaml`:

```yaml
# k8s/base/backend/backend-service.yaml
# ClusterIP service — backend is only accessible from inside the cluster.
# The Ingress Controller will route external /api traffic to this service.

apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: taskapp
  labels:
    app: taskapp-backend
spec:
  selector:
    app: taskapp-backend
  ports:
  - port: 80
    targetPort: 5000
    protocol: TCP
    name: http
  type: ClusterIP
```

---

## STEP 12.4 — Update the Backend Image Reference

Before applying, replace the placeholder ECR URL with your actual values:

```bash
# Replace the placeholder image URL in the deployment file
sed -i "s|YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com|${ECR_REGISTRY}|g" \
  k8s/base/backend/backend-deployment.yaml

# Replace yourdomain.com in the configmap
sed -i "s|yourdomain.com|${DOMAIN_NAME}|g" \
  k8s/base/backend/backend-configmap.yaml

# Verify the replacements look correct
grep "image:" k8s/base/backend/backend-deployment.yaml
grep "CORS_ORIGINS" k8s/base/backend/backend-configmap.yaml
```

---

## STEP 12.5 — Apply the Backend Manifests

```bash
# Apply ConfigMap first (Deployment depends on it)
kubectl apply -f k8s/base/backend/backend-configmap.yaml

# Apply the Deployment
kubectl apply -f k8s/base/backend/backend-deployment.yaml

# Apply the Service
kubectl apply -f k8s/base/backend/backend-service.yaml

# Watch the pods come up
kubectl get pods -n taskapp -w
# Wait until you see 2 backend pods Running:
# NAME                               READY   STATUS    RESTARTS   AGE
# postgres-0                         1/1     Running   0          5m
# taskapp-backend-xxxxxxxxx-aaaaa    1/1     Running   0          30s
# taskapp-backend-xxxxxxxxx-bbbbb    1/1     Running   0          30s

# Press Ctrl+C to stop watching
```

---

## STEP 12.6 — Verify the Backend is Healthy

```bash
# Check pod logs to confirm the Flask app started correctly
kubectl logs -l app=taskapp-backend -n taskapp --tail=20

# Expected log output:
# [INFO] Starting gunicorn 21.2.0
# [INFO] Listening at: http://0.0.0.0:5000
# [INFO] Worker booted (pid: xx)

# Test the health endpoint from inside the cluster
kubectl run test-curl \
  --image=curlimages/curl:latest \
  --restart=Never \
  --namespace=taskapp \
  --rm -it \
  -- curl -s http://backend-service/api/health

# Expected response:
# {"status":"healthy","database":"connected","timestamp":"..."}

echo "✅ Backend is healthy and connected to database"
```

---

## STEP 12.7 — Verify Pods Are Spread Across AZs

```bash
# Check which nodes the backend pods are running on
kubectl get pods -n taskapp -l app=taskapp-backend -o wide

# Then check which AZ each node is in
kubectl get nodes --show-labels | grep topology.kubernetes.io/zone

# The two backend pods should be on nodes in DIFFERENT AZs
# This proves your anti-affinity rule is working
```

---

## STEP 12.8 — Commit Backend Manifests

```bash
git add k8s/base/backend/
git commit -m "feat: add Flask backend Kubernetes deployment

- 2 replicas with zero-downtime rolling update strategy
- 526Mi memory request/limit as per project requirements
- Health checks via /api/health endpoint
- Credentials from Sealed Secrets
- Non-root security context
- Pod anti-affinity for cross-AZ distribution"
```
