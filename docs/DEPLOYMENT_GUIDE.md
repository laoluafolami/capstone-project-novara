# 🚀 CAPSTONE PROJECT: Cloud-Native TaskApp Deployment on AWS
## Complete Step-by-Step Implementation Guide

---

> **Who this guide is for**: A beginner in Terraform, Kops, Kubernetes, and AWS.
> Every concept is explained. Every command is shown. Nothing is assumed or skipped.

> **What you will build**: A production-grade, highly available Kubernetes cluster
> on AWS running TaskApp (React + Flask + PostgreSQL), secured with HTTPS,
> managed entirely with Infrastructure as Code, graded against the full rubric.

---

## HOW TO USE THIS GUIDE

This master file is your table of contents. Each section lives in its own
detailed file inside `docs/guide/`. Work through them in order — each section
depends on the previous one.

**REPLACE these placeholders throughout every file before running commands:**
- `yourdomain.com` → your actual registered domain
- `YOUR_ACCOUNT_ID` → your 12-digit AWS account ID (run: `aws sts get-caller-identity`)
- `your-email@yourdomain.com` → your actual email address

---

## TABLE OF CONTENTS

| # | Section | File | What You Do |
|---|---------|------|-------------|
| 0 | Overview & Architecture | `docs/guide/00-overview.md` | Understand the full picture |
| 1 | Prerequisites & Tool Installation | `docs/guide/01-prerequisites.md` | Install AWS CLI, Terraform, Kops, kubectl, Docker, Helm, kubeseal, Ansible |
| 2 | AWS Account Setup & IAM | `docs/guide/02-aws-iam-setup.md` | Create IAM user, configure AWS CLI, set budget alert |
| 3 | Domain Setup & Route53 DNS | `docs/guide/03-domain-dns.md` | Create hosted zone, delegate NS records from registrar |
| 4 | Docker Images & ECR | `docs/guide/04-docker-ecr.md` | Write Dockerfiles, build images, push to ECR |
| 5 | Terraform Remote State Bootstrap | `docs/guide/05-terraform-bootstrap.md` | Create S3 buckets for Terraform state, Kops state, etcd backups |
| 6 | Terraform VPC & Networking | `docs/guide/06-terraform-vpc.md` | Write VPC module: 3 public + 3 private subnets, 3 NAT Gateways |
| 7 | Terraform IAM & DNS Modules | `docs/guide/07-terraform-iam-dns.md` | Write IAM roles for Kops, Route53 subdomain delegation |
| 8 | Terraform Apply | `docs/guide/08-terraform-apply.md` | Run terraform init, plan, apply — create all AWS resources |
| 9 | Kops: Create Kubernetes Cluster | `docs/guide/09-kops-cluster.md` | Create 3-master HA cluster with private topology, etcd backups |
| 10 | Kubernetes Core Add-ons | `docs/guide/10-k8s-addons.md` | Install EBS CSI Driver, NGINX Ingress, cert-manager, Sealed Secrets, Autoscaler |
| 11 | Sealed Secrets & PostgreSQL | `docs/guide/11-sealed-secrets-postgres.md` | Encrypt credentials, deploy PostgreSQL StatefulSet with EBS |
| 12 | Backend Deployment (Flask) | `docs/guide/12-backend-deployment.md` | Deploy Flask API with 2 replicas, 526Mi memory, health checks |
| 13 | Frontend Deployment (React) | `docs/guide/13-frontend-deployment.md` | Deploy React/Nginx with 2 replicas, anti-affinity |
| 14 | Ingress, SSL & Domain Routing | `docs/guide/14-ingress-ssl.md` | Configure NGINX Ingress, Let's Encrypt SSL, HTTP→HTTPS redirect |
| 15 | Ansible Node Hardening | `docs/guide/15-ansible.md` | Harden nodes: OS updates, chrony, log rotation, Docker optimization |
| 16 | Validation & Submission Evidence | `docs/guide/16-validation.md` | Run all checklist commands, capture screenshots, HA failover test |
| 17 | Cost Analysis & Cleanup | `docs/guide/17-cost-cleanup.md` | Document costs (~$332/month), write destroy.sh |
| 18 | Required Documentation | `docs/guide/18-documentation.md` | Write architecture.md, runbook.md, cost-analysis.md, README |
| 19 | Final Checklist & Submission | `docs/guide/19-final-checklist.md` | Verify every rubric item, push to GitHub, submit |

---

## QUICK REFERENCE: KEY COMMANDS

```bash
# Validate cluster
kops validate cluster --name=$CLUSTER_NAME --state=$KOPS_STATE_STORE

# Check all nodes
kubectl get nodes -o wide

# Check all app pods
kubectl get pods -n taskapp -o wide

# Check Terraform drift
cd terraform && terraform plan

# Check SSL certificates
kubectl get certificate -n taskapp

# Check persistent volumes
kubectl get pvc -n taskapp

# Run full validation script
./scripts/validate.sh

# Destroy everything (ONLY when done)
./scripts/destroy.sh
```

---

## EVALUATION RUBRIC MAPPING

| Rubric Category | Weight | Key Files |
|----------------|--------|-----------|
| Infrastructure Design | 30% | `terraform/`, `kops/` |
| Kubernetes Operations | 25% | `kops/cluster.yaml`, `k8s/` |
| Application Delivery | 25% | `k8s/base/`, `k8s/production/` |
| Security Posture | 15% | Sealed Secrets, IAM, private subnets |
| Documentation | 5% | `docs/`, `README.md` |

---

## PROHIBITED PRACTICES (Automatic Deduction — Avoid These)

- ❌ Single-master Kubernetes cluster (use 3 masters)
- ❌ Worker nodes in public subnets (use private subnets)
- ❌ Hardcoded passwords in any Git file (use Sealed Secrets)
- ❌ Manual AWS Console changes not in Terraform (use IaC only)
- ❌ `latest` tag on container images (use `v1.0.0`)
- ❌ Missing resource limits on containers (set requests AND limits)
- ❌ Terraform state files in Git (use S3 backend)

---

## SUBMISSION

Once all 19 sections are complete and the checklist passes:

1. PUSH your repository to GitHub
2. RECORD a 10-minute demo video
3. SUBMIT at: https://forms.gle/8WsQDXWqDhuYPFxk9

Submit: **Git repo URL** + **Live domain URL** + **Demo video link**
