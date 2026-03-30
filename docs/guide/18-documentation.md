# SECTION 18 — Required Documentation Files

> The rubric awards 5% for documentation quality. These three files are
> mandatory deliverables. Write them clearly — they show the evaluator
> you understand what you built and why you made each decision.

---

## STEP 18.1 — Create docs/architecture.md

CREATE `docs/architecture.md`:

```markdown
# Architecture Document — TaskApp Cloud-Native Deployment

## System Overview

TaskApp is a Kanban-style task management application consisting of three components:
- **Frontend**: React 18 SPA served by Nginx (2 replicas)
- **Backend**: Flask REST API with JWT authentication (2 replicas, 526Mi memory)
- **Database**: PostgreSQL 15 with EBS persistent storage (1 StatefulSet)

All components run on a production-grade Kubernetes cluster on AWS, provisioned
with Kops and managed with Terraform.

---

## Architecture Diagram

```
                         Internet
                            │
                    ┌───────▼────────┐
                    │   Route53 DNS  │
                    │ yourdomain.com │
                    └───────┬────────┘
                            │
              ┌─────────────▼──────────────┐
              │   AWS Network Load Balancer │
              │   (public subnets, 3 AZs)  │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │  NGINX Ingress Controller  │
              │  (2 replicas, kube-system) │
              └──────┬──────────────┬──────┘
                     │              │
          ┌──────────▼──┐    ┌──────▼──────────┐
          │  Frontend   │    │    Backend       │
          │  Service    │    │    Service       │
          └──────┬──────┘    └──────┬───────────┘
                 │                  │
    ┌────────────▼──┐    ┌──────────▼──────────┐
    │ React/Nginx   │    │  Flask/Gunicorn      │
    │ Pod (AZ-1)    │    │  Pod (AZ-1)          │
    │ React/Nginx   │    │  Flask/Gunicorn      │
    │ Pod (AZ-2)    │    │  Pod (AZ-2)          │
    └───────────────┘    └──────────┬───────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  PostgreSQL          │
                         │  StatefulSet (AZ-1)  │
                         │  EBS gp3 20GB        │
                         └─────────────────────┘

VPC: 10.0.0.0/16
  Public Subnets:  10.0.1-3.0/24  (NAT Gateways, Load Balancer)
  Private Subnets: 10.0.11-13.0/24 (All Kubernetes nodes)
```

---

## CIDR Allocation Rationale

| CIDR | Purpose | Justification |
|------|---------|---------------|
| 10.0.0.0/16 | VPC | 65,536 IPs — room to grow without re-architecting |
| 10.0.1-3.0/24 | Public subnets | 256 IPs each — sufficient for NAT GWs and LBs |
| 10.0.11-13.0/24 | Private subnets | 256 IPs each — supports up to ~240 pods per AZ |

The /16 VPC was chosen to allow future expansion (additional environments,
microservices) without requiring VPC peering or re-IP.

---

## High Availability Strategy

### Control Plane HA
- 3 master nodes across 3 AZs (us-east-1a, us-east-1b, us-east-1c)
- etcd requires quorum: with 3 nodes, 1 can fail and the cluster continues
- Kops manages master replacement via Auto Scaling Groups

### Worker Node HA
- 3 worker nodes minimum, one per AZ
- Cluster Autoscaler adds nodes when pods cannot be scheduled
- Pod anti-affinity rules spread application pods across different nodes

### Network HA
- 3 NAT Gateways (one per AZ) — if one fails, only that AZ loses outbound internet
- Single NAT Gateway would be a single point of failure (prohibited)

### Application HA
- Frontend: 2 replicas with maxUnavailable=0 (zero-downtime rolling updates)
- Backend: 2 replicas with maxUnavailable=0 (zero-downtime rolling updates)
- Database: Single replica with EBS (EBS is replicated within an AZ by AWS)

---

## Security Model

### Network Security
- All Kubernetes nodes in private subnets (no public IPs)
- NAT Gateways provide outbound internet without inbound exposure
- Security groups follow least-privilege (only required ports open)
- Calico CNI enables NetworkPolicy enforcement between pods

### Identity & Access Management
- No root account usage after initial setup
- Separate IAM roles for masters vs. workers (least privilege)
- EC2 instance profiles (no hardcoded credentials anywhere)
- IAM policies scoped to specific S3 buckets, not wildcard

### Secret Management
- All secrets encrypted with Sealed Secrets (Bitnami)
- Sealed Secrets use asymmetric encryption (RSA-4096)
- Only the in-cluster controller can decrypt — public key is safe to commit
- No plaintext passwords in Git at any point

### Data Encryption
- EBS volumes encrypted at rest (AES-256)
- etcd encrypted at rest (Kops --encrypt-etcd-storage flag)
- S3 buckets encrypted at rest (AES-256 server-side encryption)
- All traffic encrypted in transit (HTTPS via Let's Encrypt)

---

## Technology Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Cluster tool | Kops | Native AWS integration, production-proven, supports private topology |
| IaC tool | Terraform | Industry standard, modular, excellent AWS provider |
| CNI | Calico | Supports NetworkPolicy, production-proven, good performance |
| Ingress | NGINX | Simple, well-documented, supports SSL termination |
| SSL | cert-manager + Let's Encrypt | Free, auto-renewing, trusted by all browsers |
| Secrets | Sealed Secrets | Git-safe encryption, no external dependencies |
| Storage | EBS gp3 | Better performance than gp2, 20% cheaper |
| Container registry | ECR | Private, integrated with IAM, no rate limits |
```

---

## STEP 18.2 — Create docs/runbook.md

CREATE `docs/runbook.md`:

```markdown
# Operational Runbook — TaskApp

## Prerequisites
- AWS CLI configured with kops-admin profile
- kubectl configured (run: kops export kubecfg --name=$CLUSTER_NAME --admin)
- Environment variables set (source ~/.bashrc)

---

## How to Deploy the Application

### Deploy a new version:
```bash
# 1. Build and push new image
docker build -t taskapp/backend:v1.0.X taskapp_backend/
docker tag taskapp/backend:v1.0.X ${ECR_REGISTRY}/taskapp/backend:v1.0.X
docker push ${ECR_REGISTRY}/taskapp/backend:v1.0.X

# 2. Update the deployment
kubectl set image deployment/taskapp-backend \
  backend=${ECR_REGISTRY}/taskapp/backend:v1.0.X -n taskapp

# 3. Watch the rollout
kubectl rollout status deployment/taskapp-backend -n taskapp

# 4. Rollback if needed
kubectl rollout undo deployment/taskapp-backend -n taskapp
```

---

## How to Scale the Cluster

### Scale worker nodes manually:
```bash
# Edit the instance group
kops edit ig nodes --name=$CLUSTER_NAME --state=$KOPS_STATE_STORE
# Change minSize and maxSize, then:
kops update cluster --name=$CLUSTER_NAME --state=$KOPS_STATE_STORE --yes
kops rolling-update cluster --name=$CLUSTER_NAME --state=$KOPS_STATE_STORE --yes
```

### Scale application pods:
```bash
kubectl scale deployment taskapp-backend --replicas=4 -n taskapp
kubectl scale deployment taskapp-frontend --replicas=4 -n taskapp
```

---

## How to Rotate Secrets

```bash
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)

# 2. Update PostgreSQL password
kubectl exec -it postgres-0 -n taskapp -- \
  psql -U taskapp_user -d taskapp -c \
  "ALTER USER taskapp_user WITH PASSWORD '${NEW_PASSWORD}';"

# 3. Create new sealed secret
cat > /tmp/new-postgres-secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
  namespace: taskapp
type: Opaque
stringData:
  DATABASE_PASSWORD: "${NEW_PASSWORD}"
  POSTGRES_PASSWORD: "${NEW_PASSWORD}"
EOF

kubeseal --cert sealed-secrets-public-key.pem \
  --format yaml < /tmp/new-postgres-secret.yaml \
  > k8s/base/postgres/sealed-postgres-credentials.yaml

rm /tmp/new-postgres-secret.yaml

# 4. Apply and restart backend
kubectl apply -f k8s/base/postgres/sealed-postgres-credentials.yaml
kubectl rollout restart deployment/taskapp-backend -n taskapp
```

---

## Troubleshooting Common Failures

### Pod stuck in Pending state:
```bash
kubectl describe pod <pod-name> -n taskapp
# Look for: "Insufficient memory" → scale up nodes
# Look for: "no nodes available" → check node status
kubectl get nodes
```

### Pod stuck in CrashLoopBackOff:
```bash
kubectl logs <pod-name> -n taskapp --previous
# Check for: database connection errors → verify postgres-service is running
# Check for: missing env vars → verify sealed secrets were applied
```

### SSL certificate not issuing:
```bash
kubectl describe certificaterequest -n taskapp
kubectl logs -l app=cert-manager -n cert-manager
# Common cause: DNS not propagated yet — wait and retry
# Common cause: Rate limit hit — use letsencrypt-staging first
```

### Database connection refused:
```bash
kubectl get pod postgres-0 -n taskapp
kubectl logs postgres-0 -n taskapp
# Check PVC is bound:
kubectl get pvc -n taskapp
```

### Cluster node NotReady:
```bash
kubectl describe node <node-name>
# Check for: disk pressure, memory pressure
# Kops will replace the node automatically via ASG
kops validate cluster --name=$CLUSTER_NAME --state=$KOPS_STATE_STORE
```
```

---

## STEP 18.3 — Create the Project README

CREATE (or update) the root `README.md` of your capstone repo:

```markdown
# TaskApp — Cloud-Native Kubernetes Deployment on AWS

A production-grade deployment of TaskApp (React + Flask + PostgreSQL) on AWS
using Kops, Terraform, and Kubernetes.

## Live URLs
- Frontend: https://taskapp.yourdomain.com
- Backend API: https://api.yourdomain.com/api/health

## Architecture
- 3-master Kubernetes cluster across 3 AWS Availability Zones
- Private subnet topology (no public node IPs)
- Automated SSL via cert-manager + Let's Encrypt
- Infrastructure as Code with Terraform (modular)
- Secrets encrypted with Sealed Secrets (Bitnami)

## Quick Start

### Prerequisites
See [docs/guide/01-prerequisites.md](docs/guide/01-prerequisites.md)

### Deploy
```bash
# 1. Bootstrap remote state
# (See Section 5 of deployment guide)

# 2. Apply Terraform
cd terraform && terraform init && terraform apply && cd ..

# 3. Create cluster
kops update cluster --name=$CLUSTER_NAME --state=$KOPS_STATE_STORE --yes --admin

# 4. Deploy application
kubectl apply -k k8s/production/
```

### Destroy
```bash
./scripts/destroy.sh
```

## Repository Structure
```
├── terraform/          # AWS infrastructure (VPC, IAM, DNS, S3)
├── kops/               # Kubernetes cluster specification
├── k8s/                # Kubernetes application manifests
├── ansible/            # Node hardening playbooks
├── scripts/            # Automation scripts
└── docs/               # Architecture, runbook, cost analysis
```

## Documentation
- [Architecture](docs/architecture.md)
- [Runbook](docs/runbook.md)
- [Cost Analysis](docs/cost-analysis.md)
- [Full Deployment Guide](docs/guide/)
```

```bash
# Commit all documentation
git add docs/ README.md
git commit -m "docs: add architecture, runbook, cost analysis, and project README

- Architecture diagram with CIDR rationale and HA strategy
- Security model documentation
- Operational runbook with deploy, scale, rotate-secrets procedures
- Troubleshooting guide for common failures
- Cost analysis: ~$332/month with optimization opportunities"
```
