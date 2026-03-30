# SECTION 13 — Kubernetes: Deploy the Frontend (React)

> The React frontend is a static Single Page Application (SPA) served by Nginx.
> After `npm run build`, Vite produces a `dist/` folder of HTML, CSS, and JS files.
> The Docker image (built in Section 4) packages these files into an Nginx container.
> Kubernetes runs 2 replicas of this container for high availability.
>
> The frontend talks to the backend via the public URL (https://api.yourdomain.com)
> because the VITE_API_URL was baked into the image at build time.

---

## STEP 13.1 — Create the Frontend ConfigMap

OPEN VS Code. CREATE `k8s/base/frontend/frontend-configmap.yaml`:

```yaml
# k8s/base/frontend/frontend-configmap.yaml
# Non-sensitive frontend configuration.
# Note: VITE_API_URL is baked into the image at build time (not runtime).
# This ConfigMap is for Nginx configuration overrides if needed.

apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: taskapp
data:
  # These are informational labels — the actual API URL is in the Docker image
  APP_ENV: "production"
  API_DOMAIN: "api.yourdomain.com"
```

---

## STEP 13.2 — Create the Frontend Deployment

CREATE `k8s/base/frontend/frontend-deployment.yaml`:

```yaml
# k8s/base/frontend/frontend-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskapp-frontend
  namespace: taskapp
  labels:
    app: taskapp-frontend
    version: v1.0.0
spec:
  # 2 replicas = high availability requirement met
  replicas: 2

  selector:
    matchLabels:
      app: taskapp-frontend

  # Zero-downtime rolling update
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0     # Always keep 2 pods running during updates

  template:
    metadata:
      labels:
        app: taskapp-frontend
        version: v1.0.0
    spec:
      # Security: Nginx runs as non-root in our custom image
      securityContext:
        runAsNonRoot: false   # Nginx needs root to bind port 80 inside container
                              # The container port 80 is NOT exposed externally

      containers:
      - name: frontend
        # REPLACE with your actual ECR registry URL
        image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/taskapp/frontend:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          name: http

        # Resource limits — frontend is lightweight (static files + Nginx)
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "200m"

        # Liveness probe: restart if Nginx stops serving
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 15
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness probe: only route traffic when Nginx is ready
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3

        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
            add:
            - NET_BIND_SERVICE   # Needed to bind port 80

      # Spread frontend pods across different nodes
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
                  - taskapp-frontend
              topologyKey: kubernetes.io/hostname
```

---

## STEP 13.3 — Create the Frontend Service

CREATE `k8s/base/frontend/frontend-service.yaml`:

```yaml
# k8s/base/frontend/frontend-service.yaml
# ClusterIP service — frontend is only accessible from inside the cluster.
# The Ingress Controller routes external HTTPS traffic to this service.

apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: taskapp
  labels:
    app: taskapp-frontend
spec:
  selector:
    app: taskapp-frontend
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  type: ClusterIP
```

---

## STEP 13.4 — Update the Frontend Image Reference

```bash
# Replace the placeholder ECR URL with your actual registry
sed -i "s|YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com|${ECR_REGISTRY}|g" \
  k8s/base/frontend/frontend-deployment.yaml

# Replace domain placeholder in configmap
sed -i "s|yourdomain.com|${DOMAIN_NAME}|g" \
  k8s/base/frontend/frontend-configmap.yaml

# Verify
grep "image:" k8s/base/frontend/frontend-deployment.yaml
```

---

## STEP 13.5 — Apply the Frontend Manifests

```bash
kubectl apply -f k8s/base/frontend/frontend-configmap.yaml
kubectl apply -f k8s/base/frontend/frontend-deployment.yaml
kubectl apply -f k8s/base/frontend/frontend-service.yaml

# Watch pods come up
kubectl get pods -n taskapp -w
# Wait until you see 2 frontend pods Running:
# NAME                                READY   STATUS    RESTARTS   AGE
# taskapp-frontend-xxxxxxxxx-aaaaa    1/1     Running   0          20s
# taskapp-frontend-xxxxxxxxx-bbbbb    1/1     Running   0          20s

# Press Ctrl+C to stop watching
```

---

## STEP 13.6 — Verify the Frontend is Serving

```bash
# Test the frontend from inside the cluster
kubectl run test-curl \
  --image=curlimages/curl:latest \
  --restart=Never \
  --namespace=taskapp \
  --rm -it \
  -- curl -s -o /dev/null -w "%{http_code}" http://frontend-service/

# Expected output: 200
# This confirms Nginx is serving the React app correctly

# Check pod logs
kubectl logs -l app=taskapp-frontend -n taskapp --tail=10
# Expected: no errors, just Nginx startup messages
```

---

## STEP 13.7 — Verify All Application Pods Are Running

```bash
# Full status of all taskapp pods
kubectl get pods -n taskapp -o wide

# Expected output:
# NAME                                READY   STATUS    NODE                          AZ
# postgres-0                          1/1     Running   ip-10-0-11-xxx.ec2.internal   us-east-1a
# taskapp-backend-xxxxxxxxx-aaaaa     1/1     Running   ip-10-0-11-yyy.ec2.internal   us-east-1a
# taskapp-backend-xxxxxxxxx-bbbbb     1/1     Running   ip-10-0-12-yyy.ec2.internal   us-east-1b
# taskapp-frontend-xxxxxxxxx-ccccc    1/1     Running   ip-10-0-12-zzz.ec2.internal   us-east-1b
# taskapp-frontend-xxxxxxxxx-ddddd    1/1     Running   ip-10-0-13-zzz.ec2.internal   us-east-1c

# SCREENSHOT THIS — required for submission evidence (pods across multiple AZs)
```

---

## STEP 13.8 — Commit Frontend Manifests

```bash
git add k8s/base/frontend/
git commit -m "feat: add React frontend Kubernetes deployment

- 2 replicas with zero-downtime rolling update strategy
- Nginx serving pre-built React SPA
- Resource limits: 128Mi memory, 200m CPU
- Health checks on / endpoint
- Pod anti-affinity for cross-AZ distribution"
```
