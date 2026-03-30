# 🚀 CAPSTONE PROJECT: Cloud-Native TaskApp Deployment on AWS
## Complete Step-by-Step Implementation Guide for Beginners

---

> **Who this guide is for**: Someone who has never used Terraform, Kops, Kubernetes on AWS,
> or Ansible in production. Every concept is explained. Every command is shown. Nothing is skipped.

> **What you will build**: A production-grade, highly available Kubernetes cluster on AWS
> running the TaskApp (React frontend + Flask backend + PostgreSQL), secured with HTTPS,
> managed entirely with Infrastructure as Code.

---

## WHAT IS EACH TOOL? (Plain English)

| Tool | What it does | Analogy |
|------|-------------|---------|
| **Terraform** | Writes AWS resources as code (VPC, S3, IAM, DNS) | Blueprint for a building |
| **Kops** | Creates and manages Kubernetes clusters on AWS | Foreman who builds the server farm |
| **Kubernetes** | Runs and manages your containers (app, backend, DB) | Operating system for containers |
| **Ansible** | Configures Linux servers automatically | Remote control for servers |
| **Docker** | Packages your app into portable containers | Shipping container for software |
| **ECR** | AWS private Docker image registry | Private DockerHub on AWS |
| **Route53** | AWS DNS service — maps domain names to IPs | Phone book for the internet |
| **cert-manager** | Automatically gets and renews SSL certificates | Auto-renewing HTTPS padlock |
| **Sealed Secrets** | Encrypts Kubernetes secrets so they are safe in Git | Locked safe for passwords |

---

## FINAL ARCHITECTURE DIAGRAM

```
Internet
    │
    ▼
Route53 (yourdomain.com)
    │
    ▼
AWS Application Load Balancer  ◄── NGINX Ingress Controller
    │                                      │
    ├── taskapp.yourdomain.com ────► Frontend Pods (2 replicas, React/Nginx)
    │                                      │
    └── api.yourdomain.com ──────► Backend Pods (2 replicas, Flask/Gunicorn)
                                           │
                                    PostgreSQL Pod
                                    (EBS Persistent Volume)

All nodes live in PRIVATE subnets across 3 Availability Zones.
NAT Gateways in PUBLIC subnets allow outbound internet.
No worker node has a public IP address.
```

---

## REPOSITORY STRUCTURE YOU WILL CREATE

```
capstone-taskapp/
├── terraform/
│   ├── backend.tf              # Remote state config
│   ├── main.tf                 # Root module
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/
│       ├── vpc/                # VPC, subnets, NAT, IGW
│       ├── iam/                # IAM roles and policies
│       └── dns/                # Route53 hosted zone
├── kops/
│   ├── cluster.yaml            # Full cluster spec
│   └── instance-groups.yaml    # Master + worker node groups
├── k8s/
│   ├── base/
│   │   ├── namespace.yaml
│   │   ├── postgres/
│   │   ├── backend/
│   │   └── frontend/
│   └── production/
│       ├── kustomization.yaml
│       └── patches/
├── ansible/
│   ├── inventory/
│   ├── playbooks/
│   └── roles/
├── scripts/
│   ├── bootstrap.sh
│   ├── deploy.sh
│   ├── validate.sh
│   └── destroy.sh
└── docs/
    ├── architecture.md
    ├── runbook.md
    └── cost-analysis.md
```
