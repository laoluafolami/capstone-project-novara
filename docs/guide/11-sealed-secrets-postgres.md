# SECTION 11 — Sealed Secrets & PostgreSQL Deployment

---

## PART A — SEALED SECRETS: ENCRYPT YOUR PASSWORDS

> A Kubernetes Secret is just base64-encoded text — NOT encrypted.
> Anyone with Git access can decode it instantly with: echo "abc" | base64 -d
> Sealed Secrets fixes this: it encrypts the secret with the cluster's public key.
> Only the controller INSIDE your cluster can decrypt it.
> The encrypted SealedSecret YAML is 100% safe to commit to Git.

---

## STEP 11.1 — Generate Strong Passwords

OPEN your terminal. RUN:

```bash
# Generate a strong random password for PostgreSQL
export POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
export POSTGRES_USER="taskapp_user"
export POSTGRES_DB="taskapp"

# Generate a strong JWT secret key for the Flask backend
export JWT_SECRET_KEY=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 48)

echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "JWT_SECRET_KEY: $JWT_SECRET_KEY"

# SAVE THESE SOMEWHERE SAFE (password manager, not in Git)
# You will need them if you ever need to manually access the database
```

---

## STEP 11.2 — Create the Raw Kubernetes Secret (Temporary — Never Committed)

```bash
# Create a plain Kubernetes secret YAML in a temp location
# This file will be DELETED after sealing — never committed to Git
cat > /tmp/postgres-secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
  namespace: taskapp
type: Opaque
stringData:
  POSTGRES_USER: "${POSTGRES_USER}"
  POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"
  POSTGRES_DB: "${POSTGRES_DB}"
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "${POSTGRES_DB}"
  DATABASE_USER: "${POSTGRES_USER}"
  DATABASE_PASSWORD: "${POSTGRES_PASSWORD}"
EOF

cat > /tmp/backend-secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
  namespace: taskapp
type: Opaque
stringData:
  SECRET_KEY: "${JWT_SECRET_KEY}"
EOF
```

---

## STEP 11.3 — Seal the Secrets with kubeseal

```bash
# Seal the PostgreSQL credentials secret
kubeseal \
  --cert sealed-secrets-public-key.pem \
  --format yaml \
  < /tmp/postgres-secret.yaml \
  > k8s/base/postgres/sealed-postgres-credentials.yaml

# Seal the backend secret
kubeseal \
  --cert sealed-secrets-public-key.pem \
  --format yaml \
  < /tmp/backend-secret.yaml \
  > k8s/base/backend/sealed-backend-secrets.yaml

# Delete the plaintext secret files immediately
rm /tmp/postgres-secret.yaml /tmp/backend-secret.yaml

echo "✅ Secrets sealed. Plaintext files deleted."
echo "✅ Sealed files are safe to commit to Git."
```

OPEN `k8s/base/postgres/sealed-postgres-credentials.yaml` in VS Code.
You will see something like this — the `encryptedData` values are unreadable ciphertext:

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: postgres-credentials
  namespace: taskapp
spec:
  encryptedData:
    POSTGRES_PASSWORD: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...
    POSTGRES_USER: AgCH7YHqnMd8KZQW...
    # ... more encrypted values
  template:
    metadata:
      name: postgres-credentials
      namespace: taskapp
    type: Opaque
```

```bash
# Apply the sealed secrets to the cluster
# The controller will decrypt them and create real Kubernetes Secrets
kubectl apply -f k8s/base/postgres/sealed-postgres-credentials.yaml
kubectl apply -f k8s/base/backend/sealed-backend-secrets.yaml

# Verify the controller decrypted them into real secrets
kubectl get secrets -n taskapp
# Expected:
# NAME                    TYPE     DATA   AGE
# postgres-credentials    Opaque   8      10s
# backend-secrets         Opaque   1      10s

# Commit the SEALED (encrypted) files — safe to commit
git add k8s/base/postgres/sealed-postgres-credentials.yaml
git add k8s/base/backend/sealed-backend-secrets.yaml
git commit -m "feat: add sealed secrets for postgres and backend credentials

Secrets encrypted with cluster public key via Sealed Secrets.
Plaintext values never stored in Git."
```

---

## PART B — POSTGRESQL DEPLOYMENT

> PostgreSQL is your database. In Kubernetes, databases need special care:
>   - They need PERSISTENT storage (data survives pod restarts)
>   - They should run as a StatefulSet (not Deployment) for stable network identity
>   - The EBS volume must have reclaimPolicy: Retain so data is never lost

---

## STEP 11.4 — Create the PostgreSQL Namespace Resources

CREATE `k8s/base/postgres/postgres-pvc.yaml`:

```yaml
# k8s/base/postgres/postgres-pvc.yaml
# PVC = PersistentVolumeClaim
# This requests an EBS volume from AWS. Kubernetes will create a 20GB gp3
# encrypted EBS volume and attach it to the PostgreSQL pod automatically.

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: taskapp
  labels:
    app: postgres
spec:
  accessModes:
    - ReadWriteOnce        # EBS volumes can only be attached to ONE node at a time
  storageClassName: gp3-encrypted   # Uses the StorageClass we created in Section 10
  resources:
    requests:
      storage: 20Gi        # 20GB is plenty for this project
```

---

## STEP 11.5 — Create the PostgreSQL StatefulSet

CREATE `k8s/base/postgres/postgres-statefulset.yaml`:

```yaml
# k8s/base/postgres/postgres-statefulset.yaml
# StatefulSet is used for stateful apps like databases.
# Unlike Deployments, StatefulSets give each pod a stable, predictable name.

apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: taskapp
  labels:
    app: postgres
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      # Security: run as non-root user
      securityContext:
        runAsUser: 999       # postgres user UID
        runAsGroup: 999
        fsGroup: 999

      containers:
      - name: postgres
        # Use a specific version tag — never 'latest'
        image: postgres:15.5-alpine
        ports:
        - containerPort: 5432
          name: postgres

        # Load credentials from the Sealed Secret (decrypted by controller)
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: POSTGRES_PASSWORD
        - name: POSTGRES_DB
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: POSTGRES_DB
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata

        # Resource limits — required by the rubric
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        # Mount the EBS volume
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data

        # Liveness probe: restart the pod if PostgreSQL stops responding
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - $(POSTGRES_USER)
            - -d
            - $(POSTGRES_DB)
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness probe: only send traffic when PostgreSQL is ready
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - $(POSTGRES_USER)
            - -d
            - $(POSTGRES_DB)
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3

      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

---

## STEP 11.6 — Create the PostgreSQL Service

CREATE `k8s/base/postgres/postgres-service.yaml`:

```yaml
# k8s/base/postgres/postgres-service.yaml
# A Service gives the PostgreSQL pod a stable DNS name inside the cluster.
# The backend connects to "postgres-service:5432" — not an IP address.
# If the pod restarts and gets a new IP, the Service DNS name stays the same.

apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: taskapp
  labels:
    app: postgres
spec:
  selector:
    app: postgres       # Routes traffic to pods with label app=postgres
  ports:
  - port: 5432
    targetPort: 5432
    protocol: TCP
    name: postgres
  # ClusterIP = only accessible from inside the cluster (not from internet)
  type: ClusterIP
```

---

## STEP 11.7 — Apply PostgreSQL Manifests

```bash
# Apply all PostgreSQL resources
kubectl apply -f k8s/base/postgres/postgres-pvc.yaml
kubectl apply -f k8s/base/postgres/postgres-statefulset.yaml
kubectl apply -f k8s/base/postgres/postgres-service.yaml

# Watch the pod come up (Ctrl+C to stop watching)
kubectl get pods -n taskapp -w

# Wait until you see:
# NAME         READY   STATUS    RESTARTS   AGE
# postgres-0   1/1     Running   0          60s

# Verify the EBS volume was created and bound
kubectl get pvc -n taskapp
# Expected:
# NAME           STATUS   VOLUME                                     CAPACITY   STORAGECLASS    AGE
# postgres-pvc   Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   20Gi       gp3-encrypted   90s

# Verify the service is created
kubectl get svc -n taskapp
```

---

## STEP 11.8 — Run Database Migrations

The Flask app uses SQLAlchemy with Alembic for migrations. Run them now:

```bash
# Run a one-off migration job using kubectl exec into a temporary pod
# This uses the same backend image to run alembic upgrade head

kubectl run db-migrate \
  --image="${ECR_REGISTRY}/taskapp/backend:v1.0.0" \
  --restart=Never \
  --namespace=taskapp \
  --env="DATABASE_HOST=postgres-service" \
  --env="DATABASE_PORT=5432" \
  --env="DATABASE_NAME=${POSTGRES_DB}" \
  --env="DATABASE_USER=${POSTGRES_USER}" \
  --env="DATABASE_PASSWORD=${POSTGRES_PASSWORD}" \
  --command -- python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print('Database tables created successfully')
"

# Watch the migration pod
kubectl logs db-migrate -n taskapp -f

# Clean up the migration pod after it completes
kubectl delete pod db-migrate -n taskapp

echo "✅ Database migrations complete"
```

---

## STEP 11.9 — Verify Data Persistence (Required for Submission)

This test proves your database survives pod deletion — a graded requirement.

```bash
# Step 1: Insert test data into the database
kubectl exec -it postgres-0 -n taskapp -- \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c \
  "INSERT INTO tasks (title, description, priority, status) VALUES ('Persistence Test', 'This data must survive pod deletion', 'high', 'todo');"

# Step 2: Verify the data is there
kubectl exec -it postgres-0 -n taskapp -- \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT * FROM tasks;"

# Step 3: DELETE the PostgreSQL pod (simulates a crash)
kubectl delete pod postgres-0 -n taskapp

# Step 4: Wait for Kubernetes to restart it automatically
kubectl get pods -n taskapp -w
# Wait until postgres-0 is Running again (30-60 seconds)

# Step 5: Verify the data is STILL there after pod restart
kubectl exec -it postgres-0 -n taskapp -- \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT * FROM tasks;"

# You should see the 'Persistence Test' row still present
# SCREENSHOT THIS OUTPUT — it is required for submission evidence
echo "✅ Data persistence verified"
```

```bash
# Commit all postgres manifests
git add k8s/base/postgres/
git commit -m "feat: add PostgreSQL StatefulSet with EBS persistent storage

- gp3 encrypted 20GB EBS volume with Retain policy
- Credentials loaded from Sealed Secrets
- Liveness and readiness probes configured
- Non-root security context
- ClusterIP service for internal cluster access"
```
