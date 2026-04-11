
### Step 4: Create docs/runbook.md

```bash
cat > docs/runbook.md << 'ENDOFRUNBOOK'
# TaskApp - Operational Runbook

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Purpose:** Operational procedures for deployment, scaling, maintenance, and troubleshooting

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [How to Deploy the Application](#how-to-deploy-the-application)
3. [How to Scale the Cluster](#how-to-scale-the-cluster)
4. [How to Rotate Secrets](#how-to-rotate-secrets)
5. [Backup & Recovery Procedures](#backup--recovery-procedures)
6. [Troubleshooting Common Failures](#troubleshooting-common-failures)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Cleanup Procedures](#cleanup-procedures)

---

## 🔧 Prerequisites

### Required Tools

| Tool | Version | Installation |
|------|---------|--------------|
| **kubectl** | 1.28+ | `curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"` |
| **kops** | 1.28+ | `curl -LO https://github.com/kubernetes/kops/releases/download/$(curl -s https://api.github.com/repos/kubernetes/kops/releases/latest | grep tag_name | cut -d '"' -f 4)/kops-linux-amd64` |
| **terraform** | 1.5+ | `wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip` |
| **aws-cli** | 2.x | `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"` |
| **docker** | 24+ | `curl -fsSL https://get.docker.com | sh` |

### Environment Configuration

```bash
cat > scripts/export-env.sh << 'EOF'
export KOPS_CLUSTER_NAME=k8s.task-app.online
export KOPS_STATE_STORE=s3://taskapp-kops-state-755077304796
export AWS_REGION=us-east-1
export DOMAIN_NAME=task-app.online
export ECR_REGISTRY=755077304796.dkr.ecr.us-east-1.amazonaws.com
export TF_VAR_aws_region=us-east-1
export TF_VAR_cluster_name=k8s.task-app.online
export TF_VAR_domain_name=task-app.online
EOF

source scripts/export-env.sh