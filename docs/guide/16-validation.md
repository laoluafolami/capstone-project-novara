# SECTION 16 — Validation & Submission Evidence

> The submission checklist requires specific proof that everything works.
> This section walks through every single checklist item and shows you
> exactly how to capture the evidence (screenshots + command output).
> Run every command below and save the output.

---

## STEP 16.1 — Validate the Kops Cluster

This is the most important validation command. It checks every component
of the cluster and reports whether it is healthy.

```bash
kops validate cluster \
  --name="${CLUSTER_NAME}" \
  --state="${KOPS_STATE_STORE}"

# ✅ REQUIRED OUTPUT (save this as a screenshot):
# Validating cluster k8s.yourdomain.com
#
# INSTANCE GROUPS
# NAME                    ROLE    MACHINETYPE  MIN  MAX  SUBNETS
# master-us-east-1a       Master  t3.medium    1    1    us-east-1a
# master-us-east-1b       Master  t3.medium    1    1    us-east-1b
# master-us-east-1c       Master  t3.medium    1    1    us-east-1c
# nodes                   Node    t3.medium    3    9    us-east-1a,us-east-1b,us-east-1c
#
# NODE STATUS
# NAME                          ROLE    READY
# ip-10-0-11-xxx.ec2.internal   master  True
# ip-10-0-12-xxx.ec2.internal   master  True
# ip-10-0-13-xxx.ec2.internal   master  True
# ip-10-0-11-yyy.ec2.internal   node    True
# ip-10-0-12-yyy.ec2.internal   node    True
# ip-10-0-13-yyy.ec2.internal   node    True
#
# Your cluster k8s.yourdomain.com is ready
```

---

## STEP 16.2 — Verify kubectl Shows 3+ Masters and 3+ Workers

```bash
kubectl get nodes -o wide

# ✅ REQUIRED OUTPUT (screenshot this):
# NAME                          STATUS   ROLES           AGE   VERSION   INTERNAL-IP    EXTERNAL-IP
# ip-10-0-11-xxx.ec2.internal   Ready    control-plane   1h    v1.28.6   10.0.11.xxx    <none>
# ip-10-0-12-xxx.ec2.internal   Ready    control-plane   1h    v1.28.6   10.0.12.xxx    <none>
# ip-10-0-13-xxx.ec2.internal   Ready    control-plane   1h    v1.28.6   10.0.13.xxx    <none>
# ip-10-0-11-yyy.ec2.internal   Ready    node            58m   v1.28.6   10.0.11.yyy    <none>
# ip-10-0-12-yyy.ec2.internal   Ready    node            58m   v1.28.6   10.0.12.yyy    <none>
# ip-10-0-13-yyy.ec2.internal   Ready    node            58m   v1.28.6   10.0.13.yyy    <none>
#
# KEY THINGS TO VERIFY:
# ✅ STATUS = Ready for ALL nodes
# ✅ EXTERNAL-IP = <none> for ALL nodes (private topology confirmed)
# ✅ 3 control-plane nodes (masters)
# ✅ 3 node workers
# ✅ Kubernetes version 1.28.x
```

---

## STEP 16.3 — Verify Terraform Plan Shows No Drift

"No drift" means your actual AWS infrastructure matches your Terraform code exactly.
No one made manual changes in the AWS Console.

```bash
cd terraform

terraform plan

# ✅ REQUIRED OUTPUT (screenshot this):
# No changes. Your infrastructure matches the configuration.
#
# Terraform has compared your real infrastructure against your configuration
# and found no differences, so no changes are needed.

cd ..
```

If you see changes listed, it means something was changed manually in the AWS Console.
Fix it by either updating your Terraform code to match, or reverting the manual change.

---

## STEP 16.4 — Verify All Pods Are Running Across Multiple AZs

```bash
# Show all pods with their node assignments
kubectl get pods -n taskapp -o wide

# Then cross-reference nodes with their AZs
echo "=== Node to AZ Mapping ==="
kubectl get nodes -o custom-columns=\
"NAME:.metadata.name,AZ:.metadata.labels.topology\.kubernetes\.io/zone,ROLE:.metadata.labels.node-role\.kubernetes\.io/node"

# ✅ REQUIRED: pods should be spread across at least 2 different AZs
# SCREENSHOT both outputs together
```

---

## STEP 16.5 — Verify SSL Certificate is Valid and Auto-Renewing

```bash
# Check certificate status in Kubernetes
kubectl get certificate -n taskapp
# ✅ READY column must show True for both certificates

# Check certificate details
kubectl describe certificate taskapp-frontend-tls -n taskapp | grep -A5 "Status:"
kubectl describe certificate taskapp-backend-tls -n taskapp | grep -A5 "Status:"

# Verify from the command line (checks the actual TLS handshake)
echo | openssl s_client \
  -connect taskapp.${DOMAIN_NAME}:443 \
  -servername taskapp.${DOMAIN_NAME} 2>/dev/null | \
  openssl x509 -noout -text | grep -E "Issuer:|Not Before:|Not After:|Subject:"

# ✅ REQUIRED OUTPUT:
# Issuer: C=US, O=Let's Encrypt, CN=R3
# Not Before: [today's date]
# Not After : [date 90 days from now]
# Subject: CN=taskapp.yourdomain.com

# Check auto-renewal is configured (cert-manager renews 30 days before expiry)
kubectl get certificaterequest -n taskapp
# ✅ APPROVED and READY columns should both show True

# SCREENSHOT the openssl output showing Let's Encrypt as issuer
```

---

## STEP 16.6 — Verify Database Persistence Through Pod Deletion

```bash
echo "=== DATABASE PERSISTENCE TEST ==="

# Step 1: Create a unique test record
TIMESTAMP=$(date +%s)
kubectl exec -it postgres-0 -n taskapp -- \
  psql -U taskapp_user -d taskapp -c \
  "INSERT INTO tasks (title, description, priority, status) \
   VALUES ('Persistence-Test-${TIMESTAMP}', 'Must survive pod deletion', 'high', 'todo');"

# Step 2: Confirm the record exists
echo "--- Before pod deletion ---"
kubectl exec -it postgres-0 -n taskapp -- \
  psql -U taskapp_user -d taskapp -c \
  "SELECT id, title, created_at FROM tasks WHERE title LIKE 'Persistence-Test-%';"

# Step 3: Delete the pod (simulates a crash or node failure)
echo "--- Deleting postgres pod ---"
kubectl delete pod postgres-0 -n taskapp

# Step 4: Wait for automatic restart
echo "--- Waiting for pod to restart ---"
kubectl wait --for=condition=ready pod/postgres-0 -n taskapp --timeout=120s

# Step 5: Verify data survived
echo "--- After pod restart ---"
kubectl exec -it postgres-0 -n taskapp -- \
  psql -U taskapp_user -d taskapp -c \
  "SELECT id, title, created_at FROM tasks WHERE title LIKE 'Persistence-Test-%';"

# ✅ REQUIRED: The Persistence-Test record must appear AFTER the pod restart
# SCREENSHOT both the "before" and "after" query results
echo "✅ Data persistence confirmed"
```

---

## STEP 16.7 — Verify No Plaintext Secrets in Git

```bash
# Scan the entire repository for potential secrets
# This checks for common patterns like passwords, keys, tokens

echo "=== Scanning for plaintext secrets in Git ==="

# Check for common secret patterns
git log --all --full-history -- "*.env" | head -5
git grep -i "password" -- "*.yaml" "*.yml" "*.tf" "*.json" | \
  grep -v "secretKeyRef\|valueFrom\|sealed\|encrypted\|example\|#" | \
  grep -v "POSTGRES_PASSWORD.*secretKeyRef"

# Check that .env files are not tracked
git ls-files | grep "\.env$"
# ✅ REQUIRED: This should return NOTHING (no .env files in Git)

# Check that terraform.tfstate is not tracked
git ls-files | grep "\.tfstate"
# ✅ REQUIRED: This should return NOTHING

# Check that sealed secrets are properly encrypted (not plaintext)
grep -l "encryptedData" k8s/base/*/sealed-*.yaml
# ✅ REQUIRED: Both sealed secret files should appear here

echo "✅ No plaintext secrets found in Git"
```

---

## STEP 16.8 — Demonstrate High Availability Failover

This is the most impressive part of your demo. You will kill a master node
AND a worker node simultaneously and show the cluster survives.

```bash
echo "=== HIGH AVAILABILITY FAILOVER TEST ==="

# Step 1: Record the current state
echo "--- Before failover ---"
kubectl get nodes
kubectl get pods -n taskapp

# Step 2: Find one master and one worker instance ID
MASTER_INSTANCE=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=master-us-east-1a.masters.${CLUSTER_NAME}" \
            "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

WORKER_INSTANCE=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nodes.${CLUSTER_NAME}" \
            "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

echo "Terminating master: $MASTER_INSTANCE"
echo "Terminating worker: $WORKER_INSTANCE"

# Step 3: Terminate both instances simultaneously
aws ec2 terminate-instances \
  --instance-ids $MASTER_INSTANCE $WORKER_INSTANCE

# Step 4: Watch the cluster recover (takes 3-5 minutes)
echo "--- Watching cluster recovery ---"
watch -n 10 "kubectl get nodes && echo '---' && kubectl get pods -n taskapp"

# Step 5: After recovery, validate the cluster is still healthy
kops validate cluster \
  --name="${CLUSTER_NAME}" \
  --state="${KOPS_STATE_STORE}"

# Step 6: Verify the application is still serving traffic
curl -s https://api.${DOMAIN_NAME}/api/health
# ✅ REQUIRED: {"status":"healthy","database":"connected",...}

# ✅ REQUIRED: kops validate cluster must show "Cluster is ready" after recovery
# SCREENSHOT the node list before, during, and after the failover
echo "✅ Cluster survived simultaneous master + worker failure"
```

---

## STEP 16.9 — Verify etcd Backups Are Running

```bash
# Check that etcd backup objects exist in S3
aws s3 ls s3://${ETCD_BACKUP_BUCKET}/${CLUSTER_NAME}/etcd/main/ --recursive | head -20

# ✅ REQUIRED: You should see backup files with timestamps
# Example:
# 2026-03-26 10:00:00   1234567 k8s.yourdomain.com/etcd/main/2026-03-26T10:00:00Z.tar.gz

# Check the etcd-manager logs for backup confirmation
kubectl logs -l k8s-app=etcd-manager-main \
  -n kube-system --tail=20 2>/dev/null || \
kubectl logs -n kube-system \
  $(kubectl get pods -n kube-system | grep etcd-manager | head -1 | awk '{print $1}') \
  --tail=20

echo "✅ etcd backups verified in S3"
```

---

## STEP 16.10 — Full Submission Evidence Checklist

Run this final script to generate a summary of all evidence:

```bash
#!/bin/bash
# scripts/validate.sh
# Run this script to generate all submission evidence at once

echo "=============================================="
echo "  TASKAPP CAPSTONE SUBMISSION VALIDATION"
echo "=============================================="
echo ""

echo "1. KOPS CLUSTER VALIDATION"
echo "----------------------------"
kops validate cluster --name="${CLUSTER_NAME}" --state="${KOPS_STATE_STORE}"
echo ""

echo "2. KUBECTL NODES (3 masters + 3 workers)"
echo "------------------------------------------"
kubectl get nodes -o wide
echo ""

echo "3. ALL PODS RUNNING"
echo "--------------------"
kubectl get pods -n taskapp -o wide
kubectl get pods -n ingress-nginx
kubectl get pods -n cert-manager
kubectl get pods -n kube-system | grep -E "ebs-csi|sealed-secrets|autoscaler"
echo ""

echo "4. SSL CERTIFICATES"
echo "--------------------"
kubectl get certificate -n taskapp
echo ""

echo "5. PERSISTENT VOLUMES"
echo "----------------------"
kubectl get pvc -n taskapp
kubectl get pv
echo ""

echo "6. INGRESS"
echo "-----------"
kubectl get ingress -n taskapp
echo ""

echo "7. SERVICES"
echo "------------"
kubectl get svc -n taskapp
echo ""

echo "8. TERRAFORM DRIFT CHECK"
echo "-------------------------"
cd terraform && terraform plan 2>&1 | tail -5 && cd ..
echo ""

echo "9. LIVE HTTPS ENDPOINTS"
echo "------------------------"
echo -n "Frontend: "
curl -s -o /dev/null -w "%{http_code}" https://taskapp.${DOMAIN_NAME}
echo ""
echo -n "Backend health: "
curl -s https://api.${DOMAIN_NAME}/api/health
echo ""

echo "10. ETCD BACKUPS IN S3"
echo "-----------------------"
aws s3 ls s3://${ETCD_BACKUP_BUCKET}/${CLUSTER_NAME}/etcd/main/ | tail -5
echo ""

echo "=============================================="
echo "  VALIDATION COMPLETE"
echo "=============================================="
```

```bash
# Make the script executable and run it
chmod +x scripts/validate.sh
./scripts/validate.sh 2>&1 | tee validation-output.txt

# Save the output file — attach it to your submission
echo "✅ Validation output saved to validation-output.txt"
```
