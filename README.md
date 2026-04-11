# TaskApp - Cloud-Native Task Management Platform

[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.28-blue?logo=kubernetes)](https://kubernetes.io)
[![SSL](https://img.shields.io/badge/SSL-Let's%20Encrypt-green)](https://letsencrypt.org)
[![HA](https://img.shields.io/badge/High%20Availability-Multi--AZ-orange)]()

**Capstone Project: Production-Grade AWS Kubernetes Infrastructure**

A production-grade, cloud-native task management application deployed on AWS with Infrastructure as Code, automated SSL certificates, multi-AZ resilience, and enterprise-grade security.


<img width="1710" height="772" alt="image" src="https://github.com/user-attachments/assets/df0e4fbc-b1f4-4985-84d2-3620e1727655" />
<img width="1789" height="721" alt="image" src="https://github.com/user-attachments/assets/11de5565-37d3-418b-90be-e96b034d7f6f" />

*Figure 1: TaskApp frontend with HTTPS (SSL certificate) at https://task-app.online*

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Live Application](#live-application)
- [Architecture Summary](#architecture-summary)
- [Quick Start](#quick-start)
- [Validation Evidence](#validation-evidence)
- [Documentation](#documentation)
- [Cost Analysis](#cost-analysis)
- [Submission Checklist](#submission-checklist)

---

## 🎯 Project Overview

### Challenge Statement

Design, build, and deploy a highly available, secure, and scalable Kubernetes cluster on AWS that hosts TaskApp with zero single points of failure, automated SSL/TLS, and Infrastructure as Code practices.

### Solution Summary

| Attribute | Implementation |
|-----------|----------------|
| **Application** | TaskApp - Team Task Manager (React + Flask + PostgreSQL) |
| **Frontend** | React 18 + Vite + TypeScript |
| **Backend** | Python 3.11 + Flask + SQLAlchemy |
| **Database** | PostgreSQL 15 (StatefulSet + PVC) |
| **Orchestration** | Kubernetes 1.28 via kops |
| **IaC Tool** | Terraform (planned) / kops (implemented) |
| **Cloud Provider** | AWS (us-east-1) |
| **SSL/TLS** | Let's Encrypt via cert-manager |
| **Ingress** | NGINX Ingress Controller |
| **Domain** | task-app.online |

### Key Features Achieved

✅ **High Availability**
- 3 master nodes across 3 AZs (us-east-1a/b/c)
- 3 worker nodes across 3 AZs
- Multi-replica backend deployment
- Pod anti-affinity for AZ distribution

✅ **Production Security**
- Let's Encrypt SSL certificates with auto-renewal
- HTTPS enforcement with HTTP→HTTPS redirect
- IAM least-privilege roles
- Secrets management via Kubernetes Secrets

✅ **Scalability**
- Horizontal Pod Autoscaling ready
- Stateless backend design
- EBS gp3 persistent storage

✅ **Observability**
- Health check endpoints (`/api/health`)
- Kubernetes readiness/liveness probes
- Structured logging

---

## 🌐 Live Application

### Endpoints

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://task-app.online | ✅ Live |
| **Backend API** | https://api.task-app.online/api/health | ✅ Live |

### Screenshot Gallery

**Figure 2: Frontend with valid SSL Certificate**
<img width="1710" height="772" alt="image" src="https://github.com/user-attachments/assets/df0e4fbc-b1f4-4985-84d2-3620e1727655" />
*TaskApp frontend accessible via HTTPS with valid SSL certificate*

**Figure 3: Backend API Health Check**
<img width="629" height="167" alt="image" src="https://github.com/user-attachments/assets/ad380976-0e9f-43ee-bfe9-e79916b86a54" />
*Backend API returning healthy status with database connection*

---

## 🏗️ Architecture Summary

### High-Level Architecture

<img width="1650" height="870" alt="image" src="https://github.com/user-attachments/assets/32dc205b-5343-45d8-8356-0c9625fe94be" />
**Figure 4: System Architecture Diagram**
Complete system architecture showing component interactions*

For detailed architecture, see [docs/architecture.md](docs/architecture.md).

**Network Flow:**
1. User accesses `https://task-app.online`
2. DNS resolves via Route53 to AWS Network Load Balancer
3. NLB routes to NGINX Ingress Controller
4. Ingress routes `/api/*` to backend-service, `/` to frontend-service
5. Backend connects to PostgreSQL via ClusterIP service



*Complete system architecture showing component interactions*

For detailed architecture, see [docs/architecture.md](docs/architecture.md).

---

## 🚀 Quick Start

### Prerequisites

- AWS account with IAM permissions
- kops 1.28+ installed
- kubectl configured
- Docker installed
- Domain name registered (task-app.online)

### Deployment Steps

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/capstone-taskapp.git
cd capstone-taskapp
```

### 2. Configure Environment
### Create environment configuration
```
cat > scripts/export-env.sh << 'EOF'
export KOPS_CLUSTER_NAME=k8s.task-app.online
export KOPS_STATE_STORE=s3://taskapp-kops-state-755077304796
export AWS_REGION=us-east-1
export DOMAIN_NAME=task-app.online
export ECR_REGISTRY=755077304796.dkr.ecr.us-east-1.amazonaws.com
EOF

source scripts/export-env.sh
```
### 3. Create Kubernetes Cluster
### Create cluster with kops
```
kops create cluster \
  --name=${KOPS_CLUSTER_NAME} \
  --state=${KOPS_STATE_STORE} \
  --zones=us-east-1a,us-east-1b,us-east-1c \
  --master-zones=us-east-1a,us-east-1b,us-east-1c \
  --node-count=3 \
  --node-size=t3.medium \
  --master-size=t3.medium \
  --networking=calico \
  --topology=public \
  --ssh-public-key=~/.ssh/id_rsa.pub

# Apply cluster configuration
kops update cluster --name=${KOPS_CLUSTER_NAME} --state=${KOPS_STATE_STORE} --yes

# Validate cluster
kops validate cluster --wait 300s
```
<img width="748" height="443" alt="image" src="https://github.com/user-attachments/assets/b1015262-597a-4290-bce2-7ebaa1ba0bf4" />

 
Figure 5: Kops validate cluster showing all nodes ready

### 4. Deploy Application
#### Create ECR repositories
```
aws ecr create-repository --repository-name taskapp/frontend --region $AWS_REGION
aws ecr create-repository --repository-name taskapp/backend --region $AWS_REGION

# Build and push images
cd taskapp_frontend
docker build -t ${ECR_REGISTRY}/taskapp/frontend:v1.0 .
docker push ${ECR_REGISTRY}/taskapp/frontend:v1.0

cd ../taskapp_backend
docker build -t ${ECR_REGISTRY}/taskapp/backend:v1.0 .
docker push ${ECR_REGISTRY}/taskapp/backend:v1.0

# Deploy to Kubernetes
cd ../k8s/base
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
```
<img width="1664" height="385" alt="image" src="https://github.com/user-attachments/assets/79110a1b-374d-4dc8-a70c-2d4ec795fe09" />

<img width="1706" height="634" alt="image" src="https://github.com/user-attachments/assets/fc392768-dcc6-43a1-a7c1-ecf466db7783" />

Figure 6: Pod Deployment Across AZs
All pods running across multiple availability zones

### 5. Configure DNS
### Get ingress ELB address
```
INGRESS_ELB=$(kubectl get ingress taskapp-ingress -n taskapp -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
```
# Create Route53 records 
```
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_HOSTED_ZONE_ID \
  --change-batch file://dns-records.json
```
<img width="1361" height="750" alt="image" src="https://github.com/user-attachments/assets/873e3e5f-7fd9-42c1-9b20-e1f5ae66a2e8" />


<img width="1342" height="727" alt="image" src="https://github.com/user-attachments/assets/4845e035-9fd5-4453-a0f0-c0bbf8754436" />

### 6. Verify Deployment
```
# Check all pods running
kubectl get pods -n taskapp -o wide

# Test frontend
curl -I https://task-app.online

# Test backend API
curl https://api.task-app.online/api/health
```
<img width="1488" height="361" alt="image" src="https://github.com/user-attachments/assets/5763b106-2215-4b0d-b7c3-826e05898cc1" />

### 7. Database Persistence


### 8. Terraform Executes without Errors

<img width="1265" height="967" alt="image" src="https://github.com/user-attachments/assets/19c61dfe-b048-4983-bea0-fb98793cdaa1" />

<img width="905" height="955" alt="image" src="https://github.com/user-attachments/assets/5da1861c-a735-4073-8540-29e6608a1d88" />

### 9. All sensitive values encrypted or externalized (no plaintext passwords in repo)
<img width="1898" height="784" alt="image" src="https://github.com/user-attachments/assets/430996b4-7031-45e5-bc9d-658096384f79" />

### 10. SSL Certificate Valid and Auto-Renewing
<img width="986" height="127" alt="image" src="https://github.com/user-attachments/assets/e241041e-a644-466c-b4cc-7ef2642650a4" />

Figure 10: SSL Certificates Valid
 
 ### 11. Database Persists Data Through Pod Deletion
 
 <img width="1146" height="162" alt="image" src="https://github.com/user-attachments/assets/a4d6994a-c132-41e0-8c2e-ad822d728d2e" />

 Figure 11: PostgreSQL Persistent Storage

 ### 12. Cost Estimate.

<img width="892" height="498" alt="image" src="https://github.com/user-attachments/assets/c376686e-08df-4b6e-b857-aec809871d86" />

<img width="836" height="587" alt="image" src="https://github.com/user-attachments/assets/c375654b-167a-42d0-9bf6-8f37605a87a8" />


📄 License:
MIT License 
👤 Author
Olaoluwa Afolami
Capstone Project - Cloud Engineering
April 2026

