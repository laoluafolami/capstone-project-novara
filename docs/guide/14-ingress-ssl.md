# SECTION 14 — Kubernetes: Ingress, SSL & Domain Routing

> The Ingress resource is the final piece that connects the outside world to
> your application. It tells the NGINX Ingress Controller:
>   - "When someone visits taskapp.yourdomain.com → send them to frontend-service"
>   - "When someone visits api.yourdomain.com → send them to backend-service"
>   - "Redirect all HTTP traffic to HTTPS automatically"
>   - "Use a Let's Encrypt certificate for HTTPS"
>
> cert-manager watches for Ingress resources with the right annotation and
> automatically requests a certificate from Let's Encrypt. No manual steps needed.

---

## STEP 14.1 — Create the Ingress Resource

OPEN VS Code. CREATE `k8s/base/ingress.yaml`:

```yaml
# k8s/base/ingress.yaml
# This single Ingress resource handles ALL routing for the TaskApp.
# REPLACE yourdomain.com with your actual domain throughout this file.

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: taskapp-ingress
  namespace: taskapp
  annotations:
    # Tell Kubernetes which Ingress Controller handles this resource
    kubernetes.io/ingress.class: "nginx"

    # cert-manager annotation: automatically request a Let's Encrypt certificate
    # Use letsencrypt-staging FIRST to test, then switch to letsencrypt-prod
    cert-manager.io/cluster-issuer: "letsencrypt-prod"

    # Force HTTP → HTTPS redirect
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"

    # Backend protocol (backend service speaks HTTP internally)
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"

    # Increase proxy timeouts for Flask startup
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"

    # Enable CORS headers at the ingress level
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://taskapp.yourdomain.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Authorization, Content-Type"

spec:
  # TLS configuration — cert-manager will create and manage this certificate
  tls:
  - hosts:
    - taskapp.yourdomain.com
    secretName: taskapp-frontend-tls    # cert-manager stores the cert here
  - hosts:
    - api.yourdomain.com
    secretName: taskapp-backend-tls     # cert-manager stores the cert here

  rules:
  # Rule 1: taskapp.yourdomain.com → React frontend
  - host: taskapp.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80

  # Rule 2: api.yourdomain.com → Flask backend
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
```

---

## STEP 14.2 — Replace Domain Placeholders

```bash
# Replace all occurrences of yourdomain.com with your actual domain
sed -i "s|yourdomain.com|${DOMAIN_NAME}|g" k8s/base/ingress.yaml

# Verify the replacements
grep -n "yourdomain\|${DOMAIN_NAME}" k8s/base/ingress.yaml
```

---

## STEP 14.3 — Apply the Ingress

```bash
# Apply the Ingress resource
kubectl apply -f k8s/base/ingress.yaml

# Watch cert-manager request the SSL certificate
# This can take 2–5 minutes
kubectl get certificate -n taskapp -w

# Expected output after cert-manager processes it:
# NAME                    READY   SECRET                  AGE
# taskapp-frontend-tls    True    taskapp-frontend-tls    2m
# taskapp-backend-tls     True    taskapp-backend-tls     2m

# READY=True means the certificate was issued successfully
# Press Ctrl+C to stop watching
```

---

## STEP 14.4 — Verify the SSL Certificate

```bash
# Check certificate details
kubectl describe certificate taskapp-frontend-tls -n taskapp
kubectl describe certificate taskapp-backend-tls -n taskapp

# Check the CertificateRequest status
kubectl get certificaterequest -n taskapp

# Check cert-manager logs if certificate is not issuing
kubectl logs -l app=cert-manager -n cert-manager --tail=30

# Verify the certificate from the command line using openssl
echo | openssl s_client -connect taskapp.${DOMAIN_NAME}:443 -servername taskapp.${DOMAIN_NAME} 2>/dev/null | \
  openssl x509 -noout -dates -issuer

# Expected output:
# notBefore=Mar 26 00:00:00 2026 GMT
# notAfter=Jun 24 00:00:00 2026 GMT
# issuer=C=US, O=Let's Encrypt, CN=R3
# (Let's Encrypt R3 is the trusted CA — not self-signed)
```

---

## STEP 14.5 — Test the Live Application

```bash
# Test the frontend HTTPS endpoint
curl -I https://taskapp.${DOMAIN_NAME}
# Expected: HTTP/2 200

# Test the backend API health endpoint
curl -s https://api.${DOMAIN_NAME}/api/health
# Expected: {"status":"healthy","database":"connected","timestamp":"..."}

# Test HTTP → HTTPS redirect
curl -I http://taskapp.${DOMAIN_NAME}
# Expected: HTTP/1.1 308 Permanent Redirect
#           Location: https://taskapp.yourdomain.com/

# Test the login endpoint
curl -s -X POST https://api.${DOMAIN_NAME}/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPass123!"}' | python3 -m json.tool
# Expected: {"message":"User created successfully","token":"eyJ...","user":{...}}
```

---

## STEP 14.6 — Open the Application in Your Browser

OPEN your browser. NAVIGATE to `https://taskapp.yourdomain.com`

You should see:
- ✅ The padlock icon (HTTPS) in the browser address bar
- ✅ The TaskApp landing page loads
- ✅ No certificate warnings
- ✅ You can sign up, log in, and create tasks

TAKE A SCREENSHOT of the browser showing the padlock and your domain.
This is required for submission evidence.

---

## STEP 14.7 — Create the Kustomize Production Overlay

Kustomize lets you apply environment-specific patches on top of base manifests.
The production overlay is where you put AWS-specific settings.

CREATE `k8s/production/kustomization.yaml`:

```yaml
# k8s/production/kustomization.yaml
# Kustomize overlay for production environment

apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: taskapp

# Reference the base manifests
resources:
- ../base/storageclass.yaml
- ../base/cluster-issuer.yaml
- ../base/postgres/postgres-pvc.yaml
- ../base/postgres/postgres-statefulset.yaml
- ../base/postgres/postgres-service.yaml
- ../base/postgres/sealed-postgres-credentials.yaml
- ../base/backend/backend-configmap.yaml
- ../base/backend/backend-deployment.yaml
- ../base/backend/backend-service.yaml
- ../base/backend/sealed-backend-secrets.yaml
- ../base/frontend/frontend-configmap.yaml
- ../base/frontend/frontend-deployment.yaml
- ../base/frontend/frontend-service.yaml
- ../base/ingress.yaml

# Production-specific image tags
images:
- name: taskapp/backend
  newName: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/taskapp/backend
  newTag: v1.0.0
- name: taskapp/frontend
  newName: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/taskapp/frontend
  newTag: v1.0.0

# Common labels applied to all resources
commonLabels:
  environment: production
  managed-by: kustomize
```

```bash
# Replace placeholders in kustomization.yaml
sed -i "s|YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com|${ECR_REGISTRY}|g" \
  k8s/production/kustomization.yaml

# Verify the kustomize output looks correct (dry run)
kubectl kustomize k8s/production/

# Commit everything
git add k8s/
git commit -m "feat: add Ingress with SSL termination and Kustomize production overlay

- NGINX Ingress with host-based routing
- cert-manager ClusterIssuer for Let's Encrypt auto-renewal
- HTTP to HTTPS redirect enforced
- taskapp.yourdomain.com → frontend-service
- api.yourdomain.com → backend-service
- Kustomize production overlay for environment-specific config"
```

---

## STEP 14.8 — Demonstrate Zero-Downtime Deployment

This proves your rolling update strategy works — a graded requirement.

```bash
# Simulate a new deployment by updating the image tag
# First, rebuild and push a v1.0.1 image (even if code is identical)
cd taskapp_backend
docker build -t taskapp/backend:v1.0.1 .
docker tag taskapp/backend:v1.0.1 ${ECR_REGISTRY}/taskapp/backend:v1.0.1
docker push ${ECR_REGISTRY}/taskapp/backend:v1.0.1
cd ..

# In one terminal: watch the pods during the update
kubectl get pods -n taskapp -w &

# In the same terminal: trigger the rolling update
kubectl set image deployment/taskapp-backend \
  backend=${ECR_REGISTRY}/taskapp/backend:v1.0.1 \
  -n taskapp

# Watch the output — you will see:
# New pod starts (READY 0/1)
# New pod becomes ready (READY 1/1)
# Old pod terminates
# Second new pod starts
# Second new pod becomes ready
# Second old pod terminates
# At NO point are there 0 running pods — this is zero-downtime

# While the update is happening, test the API is still responding
for i in {1..20}; do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
    https://api.${DOMAIN_NAME}/api/health
  sleep 1
done
# All requests should return 200 — no downtime

echo "✅ Zero-downtime deployment verified"
```
