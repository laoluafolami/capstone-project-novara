# SECTION 4 — Docker Images: Build, Tag & Push to ECR

> ECR = Elastic Container Registry. It is AWS's private Docker image registry.
> Instead of using Docker Hub (public), you store your images privately in ECR.
> Kubernetes will pull images from ECR when starting your pods.
>
> IMPORTANT: Never use the `latest` tag in production. Always use a specific
> version tag (e.g., v1.0.0). This is a graded requirement.

---

## STEP 4.1 — Create ECR Repositories

You need one repository for the backend and one for the frontend.

```bash
# Create backend repository
aws ecr create-repository \
  --repository-name taskapp/backend \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Create frontend repository
aws ecr create-repository \
  --repository-name taskapp/frontend \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Save the ECR registry URL (same for both repos, only the name differs)
export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
echo "ECR Registry: $ECR_REGISTRY"
echo "export ECR_REGISTRY=${ECR_REGISTRY}" >> ~/.bashrc
```

---

## STEP 4.2 — Write the Backend Dockerfile

OPEN VS Code. NAVIGATE to the `taskapp_backend/` folder.
CREATE a new file called `Dockerfile`.

PASTE this content:

```dockerfile
# taskapp_backend/Dockerfile

# Use a specific Python version — never use 'latest'
FROM python:3.11-slim

# Security: run as non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Install dependencies first (Docker layer caching optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port Gunicorn will listen on
EXPOSE 5000

# Health check — Kubernetes uses this to know if the container is alive
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" || exit 1

# Start with Gunicorn (production WSGI server — NOT Flask dev server)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "run:app"]
```

CREATE a `.dockerignore` file in `taskapp_backend/`:

```
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
.env
.env.*
venv/
.venv/
*.egg-info/
dist/
build/
.git/
.gitignore
tests/
*.md
```

---

## STEP 4.3 — Write the Frontend Dockerfile

NAVIGATE to the `taskapp_frontend/` folder.
CREATE a new file called `Dockerfile`.

PASTE this content:

```dockerfile
# taskapp_frontend/Dockerfile

# ---- Stage 1: Build the React app ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build argument for the API URL — injected at build time
ARG VITE_API_URL=https://api.yourdomain.com/api
ENV VITE_API_URL=$VITE_API_URL

# Build the production React bundle
RUN npm run build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:1.25-alpine

# Security: remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

CREATE `taskapp_frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Serve React app — all routes fall back to index.html (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

CREATE `taskapp_frontend/.dockerignore`:

```
node_modules/
dist/
.env
.env.*
!.env.example
.git/
*.md
```

---

## STEP 4.4 — Authenticate Docker to ECR

Before pushing images, Docker must log in to your private ECR registry.

```bash
# Log Docker into ECR (token expires after 12 hours)
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Expected output: Login Succeeded
```

---

## STEP 4.5 — Build and Push the Backend Image

```bash
# Set your image version tag — use semantic versioning, never 'latest'
export IMAGE_TAG="v1.0.0"

# Navigate to the backend directory
cd taskapp_backend

# Build the backend Docker image
docker build -t taskapp/backend:${IMAGE_TAG} .

# Tag it for ECR
docker tag taskapp/backend:${IMAGE_TAG} \
  ${ECR_REGISTRY}/taskapp/backend:${IMAGE_TAG}

# Push to ECR
docker push ${ECR_REGISTRY}/taskapp/backend:${IMAGE_TAG}

echo "✅ Backend image pushed: ${ECR_REGISTRY}/taskapp/backend:${IMAGE_TAG}"

# Go back to project root
cd ..
```

---

## STEP 4.6 — Build and Push the Frontend Image

```bash
cd taskapp_frontend

# Build the frontend Docker image
# Pass your actual API domain as a build argument
docker build \
  --build-arg VITE_API_URL=https://api.${DOMAIN_NAME}/api \
  -t taskapp/frontend:${IMAGE_TAG} .

# Tag it for ECR
docker tag taskapp/frontend:${IMAGE_TAG} \
  ${ECR_REGISTRY}/taskapp/frontend:${IMAGE_TAG}

# Push to ECR
docker push ${ECR_REGISTRY}/taskapp/frontend:${IMAGE_TAG}

echo "✅ Frontend image pushed: ${ECR_REGISTRY}/taskapp/frontend:${IMAGE_TAG}"

cd ..
```

---

## STEP 4.7 — Verify Images Are in ECR

```bash
# List backend images
aws ecr list-images \
  --repository-name taskapp/backend \
  --region $AWS_REGION \
  --output table

# List frontend images
aws ecr list-images \
  --repository-name taskapp/frontend \
  --region $AWS_REGION \
  --output table
```

You should see your `v1.0.0` tag listed for both repositories.
