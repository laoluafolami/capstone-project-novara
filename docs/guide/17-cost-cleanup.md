# SECTION 17 — Cost Analysis, Budget Alerts & Cleanup Script

---

## PART A — COST ANALYSIS

> The rubric requires a cost estimate with documentation. This section shows
> you exactly how to calculate and document your monthly AWS costs.

---

## STEP 17.1 — Understand What You Are Paying For

Here is a breakdown of every AWS resource this project creates and its cost:

```
COMPUTE (EC2 Instances)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3x Master nodes (t3.medium)    = 3 × $0.0416/hr × 730hr = $91.10/month
3x Worker nodes (t3.medium)    = 3 × $0.0416/hr × 730hr = $91.10/month
1x Bastion host (t3.micro)     = 1 × $0.0104/hr × 730hr = $7.59/month
Subtotal Compute:                                          $189.79/month

NETWORKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3x NAT Gateways                = 3 × $0.045/hr × 730hr  = $98.55/month
NAT data processing            = ~10GB × $0.045/GB       = $0.45/month
Network Load Balancer          = $0.008/hr × 730hr       = $5.84/month
LCU charges (NLB)              = ~$2.00/month            = $2.00/month
Subtotal Networking:                                       $106.84/month

STORAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6x EBS gp3 root volumes (64GB) = 6 × 64GB × $0.08/GB    = $30.72/month
3x EBS gp3 root volumes (50GB) = 3 × 50GB × $0.08/GB    = $12.00/month
1x PostgreSQL EBS (20GB)       = 1 × 20GB × $0.08/GB    = $1.60/month
Subtotal Storage:                                          $44.32/month

DNS & CERTIFICATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route53 Hosted Zones (2)       = 2 × $0.50/month         = $1.00/month
Route53 DNS queries            = ~$0.50/month             = $0.50/month
Let's Encrypt SSL              = FREE                     = $0.00/month
Subtotal DNS:                                              $1.50/month

S3 BUCKETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Terraform state bucket         = ~$0.023/GB               = $0.10/month
Kops state bucket              = ~$0.023/GB               = $0.10/month
etcd backup bucket             = ~1GB × $0.023/GB         = $0.02/month
Subtotal S3:                                               $0.22/month

ECR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ECR storage (2 images ~500MB)  = 0.5GB × $0.10/GB        = $0.05/month
Subtotal ECR:                                              $0.05/month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL ESTIMATED MONTHLY COST:                              ~$342.72/month
TOTAL ESTIMATED DAILY COST:                                ~$11.42/day
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTE: The biggest cost driver is NAT Gateways ($98/month for 3).
For a 3-week project, total cost ≈ $11.42 × 21 days = ~$240.
```

---

## STEP 17.2 — Generate Cost Estimate Using AWS Cost Calculator

1. OPEN https://calculator.aws/pricing/2/home
2. CLICK "Create estimate"
3. ADD each service:
   - EC2: 6x t3.medium, On-Demand, us-east-1
   - NAT Gateway: 3 gateways, 10GB data
   - Elastic Load Balancing: Network Load Balancer
   - EBS: gp3 volumes (total ~450GB)
   - Route53: 2 hosted zones
4. CLICK "Save and share" to get a shareable URL
5. SCREENSHOT the estimate summary page

CREATE `docs/cost-analysis.md`:

```markdown
# Cost Analysis — TaskApp Capstone Project

## Monthly Cost Estimate

| Service | Resource | Quantity | Unit Cost | Monthly Cost |
|---------|----------|----------|-----------|--------------|
| EC2 | t3.medium (masters) | 3 | $0.0416/hr | $91.10 |
| EC2 | t3.medium (workers) | 3 | $0.0416/hr | $91.10 |
| EC2 | t3.micro (bastion) | 1 | $0.0104/hr | $7.59 |
| NAT Gateway | Per gateway | 3 | $0.045/hr | $98.55 |
| Network LB | Per LB | 1 | $0.008/hr | $5.84 |
| EBS gp3 | Root volumes | ~450GB | $0.08/GB | $36.00 |
| EBS gp3 | PostgreSQL | 20GB | $0.08/GB | $1.60 |
| Route53 | Hosted zones | 2 | $0.50/zone | $1.00 |
| S3 | State + backups | ~1GB | $0.023/GB | $0.22 |
| ECR | Image storage | ~0.5GB | $0.10/GB | $0.05 |
| **TOTAL** | | | | **~$332.05** |

## Cost Optimization Strategies Applied

1. **gp3 over gp2**: gp3 is 20% cheaper than gp2 for the same performance
2. **Lifecycle rules on S3**: etcd backups deleted after 30 days
3. **t3.medium sizing**: Minimum viable instance type for Kubernetes
4. **Budget alert**: Set at $50 to catch runaway costs early

## Cost Optimization Opportunities (Bonus)

- **Spot instances for workers**: Could reduce worker cost by 60-70%
  - Use mixed instance policy: 30% on-demand + 70% spot
  - Estimated saving: ~$54/month
- **Single NAT Gateway**: Reduces to $32/month (but creates SPOF)
- **Smaller master instances**: t3.small saves ~$30/month (not recommended)

## AWS Cost Calculator Link
[View estimate](https://calculator.aws/pricing/2/home#/estimate?id=YOUR_ESTIMATE_ID)

## Budget Alert
A $50 budget alert is configured in AWS Billing to prevent unexpected charges.
Email notification sent to: your-email@yourdomain.com
```

---

## PART B — CLEANUP SCRIPT

> The rubric requires a cleanup script. This is critical — leaving resources
> running after the project costs real money. Run this when you are done.

---

## STEP 17.3 — Create the Destroy Script

CREATE `scripts/destroy.sh`:

```bash
#!/bin/bash
# scripts/destroy.sh
# ============================================================
# TASKAPP CAPSTONE — COMPLETE INFRASTRUCTURE TEARDOWN
# ============================================================
# WARNING: This script PERMANENTLY DELETES all AWS resources.
# Run this ONLY when you are completely done with the project.
# Make sure you have submitted your project before running this.
# ============================================================

set -e  # Exit immediately if any command fails

# Load environment variables
source ~/.bashrc

echo "=============================================="
echo "  TASKAPP INFRASTRUCTURE TEARDOWN"
echo "=============================================="
echo ""
echo "⚠️  WARNING: This will DELETE all resources:"
echo "   - Kubernetes cluster (all EC2 instances)"
echo "   - VPC, subnets, NAT Gateways"
echo "   - Route53 records"
echo "   - S3 buckets (state, kops, etcd backups)"
echo "   - ECR repositories and images"
echo "   - IAM roles and policies"
echo ""
read -p "Type 'DELETE' to confirm you want to destroy everything: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
  echo "Aborted. No resources were deleted."
  exit 0
fi

echo ""
echo "Starting teardown..."

# ── STEP 1: Delete Kubernetes resources first ──────────────────────────────
echo "Step 1/7: Removing Kubernetes application resources..."
kubectl delete namespace taskapp --ignore-not-found=true
kubectl delete namespace ingress-nginx --ignore-not-found=true
kubectl delete namespace cert-manager --ignore-not-found=true
kubectl delete clusterissuer letsencrypt-prod letsencrypt-staging \
  --ignore-not-found=true

# Wait for Load Balancer to be deleted (important — must happen before VPC deletion)
echo "Waiting for AWS Load Balancer to be deleted..."
sleep 60

# ── STEP 2: Delete the Kops cluster ───────────────────────────────────────
echo "Step 2/7: Deleting Kubernetes cluster with Kops..."
kops delete cluster \
  --name="${CLUSTER_NAME}" \
  --state="${KOPS_STATE_STORE}" \
  --yes

echo "Waiting for all EC2 instances to terminate..."
sleep 120

# ── STEP 3: Destroy Terraform infrastructure ──────────────────────────────
echo "Step 3/7: Destroying Terraform infrastructure..."
cd terraform
terraform destroy -auto-approve
cd ..

# ── STEP 4: Delete ECR repositories ───────────────────────────────────────
echo "Step 4/7: Deleting ECR repositories..."
aws ecr delete-repository \
  --repository-name taskapp/backend \
  --region $AWS_REGION \
  --force 2>/dev/null || true

aws ecr delete-repository \
  --repository-name taskapp/frontend \
  --region $AWS_REGION \
  --force 2>/dev/null || true

# ── STEP 5: Empty and delete S3 buckets ───────────────────────────────────
echo "Step 5/7: Emptying and deleting S3 buckets..."

for BUCKET in $TF_STATE_BUCKET $KOPS_STATE_BUCKET $ETCD_BACKUP_BUCKET; do
  echo "  Emptying bucket: $BUCKET"
  # Delete all versions (required for versioned buckets)
  aws s3api list-object-versions \
    --bucket "$BUCKET" \
    --output json 2>/dev/null | \
    jq -r '.Versions[]? | "\(.Key) \(.VersionId)"' | \
    while read KEY VERSION; do
      aws s3api delete-object \
        --bucket "$BUCKET" \
        --key "$KEY" \
        --version-id "$VERSION" 2>/dev/null || true
    done

  # Delete all delete markers
  aws s3api list-object-versions \
    --bucket "$BUCKET" \
    --output json 2>/dev/null | \
    jq -r '.DeleteMarkers[]? | "\(.Key) \(.VersionId)"' | \
    while read KEY VERSION; do
      aws s3api delete-object \
        --bucket "$BUCKET" \
        --key "$KEY" \
        --version-id "$VERSION" 2>/dev/null || true
    done

  # Delete the bucket
  aws s3api delete-bucket \
    --bucket "$BUCKET" \
    --region $AWS_REGION 2>/dev/null || true
  echo "  ✅ Deleted: $BUCKET"
done

# ── STEP 6: Delete DynamoDB table ─────────────────────────────────────────
echo "Step 6/7: Deleting DynamoDB lock table..."
aws dynamodb delete-table \
  --table-name taskapp-terraform-locks \
  --region $AWS_REGION 2>/dev/null || true

# ── STEP 7: Terminate bastion host ────────────────────────────────────────
echo "Step 7/7: Terminating bastion host..."
if [ -n "$BASTION_ID" ]; then
  aws ec2 terminate-instances --instance-ids $BASTION_ID 2>/dev/null || true
fi

echo ""
echo "=============================================="
echo "  TEARDOWN COMPLETE"
echo "=============================================="
echo ""
echo "✅ All resources have been deleted."
echo "✅ You will no longer be charged for this project."
echo ""
echo "Final check — verify no resources remain:"
echo "  aws ec2 describe-instances --filters Name=tag:Project,Values=taskapp-capstone"
echo "  aws s3 ls | grep taskapp"
```

```bash
# Make the script executable
chmod +x scripts/destroy.sh

# Commit it
git add scripts/destroy.sh docs/cost-analysis.md
git commit -m "docs: add cost analysis and infrastructure teardown script

- Monthly cost estimate: ~$332/month
- Itemized breakdown of all AWS services
- destroy.sh safely removes all resources in correct order
- Budget alert configured at $50"
```
