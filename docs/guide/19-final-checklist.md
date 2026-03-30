# SECTION 19 — Final Submission Checklist & Git Hygiene

> Before you submit, go through every item below. Each one maps directly
> to a graded requirement in the evaluation rubric. Do not skip any.

---

## STEP 19.1 — Final Git Commit History Check

Your commit history is reviewed as part of the rubric. It must show
meaningful, incremental progress — not one giant commit at the end.

```bash
# Review your commit history
git log --oneline

# You should see something like:
# a1b2c3d docs: add architecture, runbook, cost analysis
# e4f5g6h feat: add Ingress with SSL termination
# i7j8k9l feat: add React frontend Kubernetes deployment
# m1n2o3p feat: add Flask backend Kubernetes deployment
# q4r5s6t feat: add PostgreSQL StatefulSet with EBS storage
# u7v8w9x feat: add sealed secrets for credentials
# y1z2a3b feat: add Kubernetes core add-ons (EBS CSI, NGINX, cert-manager)
# c4d5e6f feat: add kops cluster spec with 3-master HA configuration
# g7h8i9j feat: apply terraform VPC, IAM, DNS modules
# k1l2m3n feat: add terraform IAM and DNS modules
# o4p5q6r feat: add terraform VPC networking module
# s7t8u9v feat: add terraform remote state bootstrap
# w1x2y3z feat: add Docker images for backend and frontend
# a4b5c6d feat: configure Route53 DNS delegation
# e7f8g9h chore: initial project structure and .gitignore

# Count your commits — aim for 15+ meaningful commits
git log --oneline | wc -l
```

---

## STEP 19.2 — Verify .gitignore is Protecting Sensitive Files

```bash
# Confirm these files are NOT tracked by Git
echo "=== Files that must NOT be in Git ==="

git ls-files terraform/*.tfstate 2>/dev/null && echo "❌ tfstate in Git!" || echo "✅ tfstate not in Git"
git ls-files terraform/.terraform/ 2>/dev/null && echo "❌ .terraform/ in Git!" || echo "✅ .terraform/ not in Git"
git ls-files "**/.env" 2>/dev/null && echo "❌ .env in Git!" || echo "✅ .env not in Git"
git ls-files "*.pem" 2>/dev/null && echo "❌ .pem key in Git!" || echo "✅ .pem not in Git"
git ls-files kubeconfig 2>/dev/null && echo "❌ kubeconfig in Git!" || echo "✅ kubeconfig not in Git"

# Confirm sealed secrets ARE in Git (they are safe — encrypted)
git ls-files k8s/base/postgres/sealed-postgres-credentials.yaml && \
  echo "✅ Sealed postgres secret in Git" || echo "❌ Missing sealed postgres secret"
git ls-files k8s/base/backend/sealed-backend-secrets.yaml && \
  echo "✅ Sealed backend secret in Git" || echo "❌ Missing sealed backend secret"
```

---

## STEP 19.3 — Complete Submission Checklist

Work through every item. Do not submit until all boxes are checked.

```bash
echo "=============================================="
echo "  SUBMISSION CHECKLIST"
echo "=============================================="

# ── INFRASTRUCTURE DESIGN (30%) ───────────────────────────────────────────
echo ""
echo "INFRASTRUCTURE DESIGN (30%)"
echo "-----------------------------"

echo -n "[ ] terraform plan shows no changes: "
cd terraform && terraform plan 2>&1 | grep -q "No changes" && echo "✅ PASS" || echo "❌ FAIL"
cd ..

echo -n "[ ] Remote state in S3 with DynamoDB locking: "
aws s3 ls s3://${TF_STATE_BUCKET}/production/terraform.tfstate &>/dev/null && \
  echo "✅ PASS" || echo "❌ FAIL"

echo -n "[ ] Terraform modules exist (vpc, iam, dns): "
[ -d terraform/modules/vpc ] && [ -d terraform/modules/iam ] && [ -d terraform/modules/dns ] && \
  echo "✅ PASS" || echo "❌ FAIL"

echo -n "[ ] 3 public + 3 private subnets across 3 AZs: "
SUBNET_COUNT=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" \
  --query 'length(Subnets)' --output text)
[ "$SUBNET_COUNT" -eq 6 ] && echo "✅ PASS ($SUBNET_COUNT subnets)" || echo "❌ FAIL ($SUBNET_COUNT subnets)"

echo -n "[ ] 3 NAT Gateways (one per AZ): "
NAT_COUNT=$(aws ec2 describe-nat-gateways \
  --filter "Name=vpc-id,Values=${VPC_ID}" "Name=state,Values=available" \
  --query 'length(NatGateways)' --output text)
[ "$NAT_COUNT" -eq 3 ] && echo "✅ PASS" || echo "❌ FAIL ($NAT_COUNT NAT GWs)"

echo -n "[ ] etcd backups in S3: "
aws s3 ls s3://${ETCD_BACKUP_BUCKET}/ --recursive | grep -q ".tar.gz" && \
  echo "✅ PASS" || echo "❌ FAIL (no backup files found)"

# ── KUBERNETES OPERATIONS (25%) ────────────────────────────────────────────
echo ""
echo "KUBERNETES OPERATIONS (25%)"
echo "-----------------------------"

echo -n "[ ] kops validate cluster passes: "
kops validate cluster --name="${CLUSTER_NAME}" --state="${KOPS_STATE_STORE}" 2>&1 | \
  grep -q "is ready" && echo "✅ PASS" || echo "❌ FAIL"

echo -n "[ ] 3+ master nodes Ready: "
MASTER_COUNT=$(kubectl get nodes --selector=node-role.kubernetes.io/control-plane \
  --no-headers | grep -c "Ready")
[ "$MASTER_COUNT" -ge 3 ] && echo "✅ PASS ($MASTER_COUNT masters)" || echo "❌ FAIL"

echo -n "[ ] 3+ worker nodes Ready: "
WORKER_COUNT=$(kubectl get nodes --selector='!node-role.kubernetes.io/control-plane' \
  --no-headers | grep -c "Ready")
[ "$WORKER_COUNT" -ge 3 ] && echo "✅ PASS ($WORKER_COUNT workers)" || echo "❌ FAIL"

echo -n "[ ] No nodes have public IPs: "
PUBLIC_IPS=$(kubectl get nodes -o wide --no-headers | awk '{print $7}' | grep -v "<none>" | wc -l)
[ "$PUBLIC_IPS" -eq 0 ] && echo "✅ PASS (private topology confirmed)" || echo "❌ FAIL ($PUBLIC_IPS nodes have public IPs)"

echo -n "[ ] Cluster Autoscaler running: "
kubectl get pods -n kube-system -l app.kubernetes.io/name=cluster-autoscaler \
  --no-headers | grep -q "Running" && echo "✅ PASS" || echo "❌ FAIL"

# ── APPLICATION DELIVERY (25%) ─────────────────────────────────────────────
echo ""
echo "APPLICATION DELIVERY (25%)"
echo "-----------------------------"

echo -n "[ ] Frontend HTTPS accessible: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://taskapp.${DOMAIN_NAME})
[ "$HTTP_CODE" -eq 200 ] && echo "✅ PASS (HTTP $HTTP_CODE)" || echo "❌ FAIL (HTTP $HTTP_CODE)"

echo -n "[ ] Backend API health check: "
HEALTH=$(curl -s https://api.${DOMAIN_NAME}/api/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null)
[ "$HEALTH" = "healthy" ] && echo "✅ PASS" || echo "❌ FAIL (status: $HEALTH)"

echo -n "[ ] HTTP redirects to HTTPS: "
REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" http://taskapp.${DOMAIN_NAME})
[ "$REDIRECT" -eq 308 ] || [ "$REDIRECT" -eq 301 ] && echo "✅ PASS" || echo "❌ FAIL (HTTP $REDIRECT)"

echo -n "[ ] SSL certificate valid (Let's Encrypt): "
ISSUER=$(echo | openssl s_client -connect taskapp.${DOMAIN_NAME}:443 \
  -servername taskapp.${DOMAIN_NAME} 2>/dev/null | \
  openssl x509 -noout -issuer 2>/dev/null | grep -o "Let's Encrypt")
[ "$ISSUER" = "Let's Encrypt" ] && echo "✅ PASS" || echo "❌ FAIL (issuer: $ISSUER)"

echo -n "[ ] Backend memory limit = 526Mi: "
MEM_LIMIT=$(kubectl get deployment taskapp-backend -n taskapp \
  -o jsonpath='{.spec.template.spec.containers[0].resources.limits.memory}')
[ "$MEM_LIMIT" = "526Mi" ] && echo "✅ PASS" || echo "❌ FAIL (limit: $MEM_LIMIT)"

echo -n "[ ] 2+ frontend replicas: "
FRONTEND_REPLICAS=$(kubectl get deployment taskapp-frontend -n taskapp \
  -o jsonpath='{.spec.replicas}')
[ "$FRONTEND_REPLICAS" -ge 2 ] && echo "✅ PASS ($FRONTEND_REPLICAS replicas)" || echo "❌ FAIL"

echo -n "[ ] 2+ backend replicas: "
BACKEND_REPLICAS=$(kubectl get deployment taskapp-backend -n taskapp \
  -o jsonpath='{.spec.replicas}')
[ "$BACKEND_REPLICAS" -ge 2 ] && echo "✅ PASS ($BACKEND_REPLICAS replicas)" || echo "❌ FAIL"

echo -n "[ ] Persistent volume bound: "
PVC_STATUS=$(kubectl get pvc postgres-pvc -n taskapp \
  -o jsonpath='{.status.phase}')
[ "$PVC_STATUS" = "Bound" ] && echo "✅ PASS" || echo "❌ FAIL (status: $PVC_STATUS)"

# ── SECURITY POSTURE (15%) ─────────────────────────────────────────────────
echo ""
echo "SECURITY POSTURE (15%)"
echo "-----------------------------"

echo -n "[ ] No plaintext secrets in Git: "
SECRET_COUNT=$(git grep -l "password\|secret\|key" -- "*.yaml" "*.yml" 2>/dev/null | \
  xargs grep -l "stringData\|data:" 2>/dev/null | \
  grep -v "sealed\|example\|configmap\|#" | wc -l)
[ "$SECRET_COUNT" -eq 0 ] && echo "✅ PASS" || echo "⚠️  CHECK MANUALLY ($SECRET_COUNT files)"

echo -n "[ ] Sealed Secrets controller running: "
kubectl get pods -n kube-system -l app.kubernetes.io/name=sealed-secrets \
  --no-headers | grep -q "Running" && echo "✅ PASS" || echo "❌ FAIL"

echo -n "[ ] EBS volumes encrypted: "
EBS_ENCRYPTED=$(aws ec2 describe-volumes \
  --filters "Name=tag:kubernetes.io/cluster/${CLUSTER_NAME},Values=owned" \
  --query 'Volumes[?Encrypted==`false`] | length(@)' --output text)
[ "$EBS_ENCRYPTED" -eq 0 ] && echo "✅ PASS (all volumes encrypted)" || echo "❌ FAIL ($EBS_ENCRYPTED unencrypted)"

# ── DOCUMENTATION (5%) ────────────────────────────────────────────────────
echo ""
echo "DOCUMENTATION (5%)"
echo "-----------------------------"

[ -f docs/architecture.md ] && echo "✅ docs/architecture.md exists" || echo "❌ MISSING"
[ -f docs/runbook.md ] && echo "✅ docs/runbook.md exists" || echo "❌ MISSING"
[ -f docs/cost-analysis.md ] && echo "✅ docs/cost-analysis.md exists" || echo "❌ MISSING"
[ -f scripts/destroy.sh ] && echo "✅ scripts/destroy.sh exists" || echo "❌ MISSING"
[ -f README.md ] && echo "✅ README.md exists" || echo "❌ MISSING"

echo ""
echo "=============================================="
echo "  CHECKLIST COMPLETE"
echo "=============================================="
```

---

## STEP 19.4 — Push Everything to GitHub

```bash
# Final check — make sure nothing sensitive is staged
git status
git diff --cached

# Push to your remote repository
git remote add origin https://github.com/YOUR_USERNAME/capstone-taskapp.git
git push -u origin main

# Verify the push
git log --oneline -10
echo "✅ Repository pushed to GitHub"
```

---

## STEP 19.5 — Prepare Your Submission

Gather these three items before submitting:

1. **Git Repository URL**: `https://github.com/YOUR_USERNAME/capstone-taskapp`
2. **Live Domain URL**: `https://taskapp.yourdomain.com`
3. **Demo Video**: Record a 10-minute screen recording covering:
   - Show `kops validate cluster` output
   - Show `kubectl get nodes -o wide` (3 masters + 3 workers, no public IPs)
   - Open `https://taskapp.yourdomain.com` in browser (show padlock)
   - Create a task, move it across Kanban columns
   - Show `terraform plan` with "No changes"
   - Show the HA failover (delete a master + worker, cluster recovers)
   - Show etcd backups in S3
   - Walk through your architecture diagram

NAVIGATE to https://forms.gle/8WsQDXWqDhuYPFxk9 and SUBMIT all three items.

---

## STEP 19.6 — Bonus: GitOps with ArgoCD (+10%)

If you want the +10% bonus, install ArgoCD for automated deployments:

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl rollout status deployment/argocd-server -n argocd

# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Port-forward to access the ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open https://localhost:8080 in your browser
# Login: admin / (password from above)

# Create an ArgoCD Application pointing to your Git repo
cat > argocd-app.yaml << EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: taskapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_USERNAME/capstone-taskapp.git
    targetRevision: HEAD
    path: k8s/production
  destination:
    server: https://kubernetes.default.svc
    namespace: taskapp
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
EOF

kubectl apply -f argocd-app.yaml
echo "✅ ArgoCD GitOps configured — pushes to Git now auto-deploy to cluster"
```

---

## CONGRATULATIONS

You have built a production-grade, highly available, secure Kubernetes
infrastructure on AWS from scratch. Here is what you accomplished:

- Provisioned a 6-node Kubernetes cluster across 3 AWS Availability Zones
- Wrote all infrastructure as Terraform code with remote state and locking
- Deployed a full-stack application (React + Flask + PostgreSQL) on Kubernetes
- Secured all secrets with Sealed Secrets encryption
- Automated SSL certificate management with cert-manager + Let's Encrypt
- Configured zero-downtime rolling deployments
- Proved data persistence through pod deletion
- Demonstrated cluster survival through simultaneous node failures
- Hardened all nodes with Ansible
- Documented everything for operational use

This is the same architecture used by real companies to serve production traffic.
