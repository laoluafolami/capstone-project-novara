# SECTION 8 — Terraform: Apply All Infrastructure

> Now you will run Terraform to actually create all the AWS resources.
> Terraform works in 3 steps:
>   1. `init`  — downloads providers and sets up the backend
>   2. `plan`  — shows you WHAT will be created (no changes yet)
>   3. `apply` — actually creates the resources

---

## STEP 8.1 — Initialize Terraform

OPEN your terminal. NAVIGATE to the `terraform/` directory:

```bash
cd terraform

# Initialize Terraform — downloads the AWS provider and connects to S3 backend
terraform init

# Expected output:
# Initializing the backend...
# Successfully configured the backend "s3"!
# Initializing provider plugins...
# - Installing hashicorp/aws v5.x.x...
# Terraform has been successfully initialized!
```

If you see an error about the S3 bucket not existing, double-check that you
completed Section 5 and that the bucket name in `backend.tf` matches exactly.

---

## STEP 8.2 — Validate the Terraform Configuration

```bash
# Check for syntax errors in all .tf files
terraform validate

# Expected output:
# Success! The configuration is valid.
```

---

## STEP 8.3 — Review the Terraform Plan

```bash
# Show what Terraform WILL create — no changes are made yet
terraform plan -out=tfplan

# Read through the output carefully. You should see:
# + aws_vpc.main (will be created)
# + aws_subnet.public[0] (will be created)
# + aws_subnet.public[1] (will be created)
# + aws_subnet.public[2] (will be created)
# + aws_subnet.private[0] (will be created)
# + aws_subnet.private[1] (will be created)
# + aws_subnet.private[2] (will be created)
# + aws_internet_gateway.main (will be created)
# + aws_eip.nat[0,1,2] (will be created)
# + aws_nat_gateway.main[0,1,2] (will be created)
# + aws_route_table.public (will be created)
# + aws_route_table.private[0,1,2] (will be created)
# + aws_iam_role.kops_master (will be created)
# + aws_iam_role.kops_node (will be created)
# + aws_route53_zone.cluster (will be created)
# + aws_route53_record.cluster_ns (will be created)
#
# Plan: ~25 to add, 0 to change, 0 to destroy.
```

> The `-out=tfplan` flag saves the plan to a file. When you apply, Terraform
> executes exactly what was planned — no surprises.

---

## STEP 8.4 — Apply the Terraform Plan

```bash
# Apply the saved plan — this creates all resources in AWS
terraform apply tfplan

# This will take 3–8 minutes (NAT Gateways take the longest to provision)
# Expected final output:
# Apply complete! Resources: 25 added, 0 changed, 0 destroyed.
#
# Outputs:
# vpc_id = "vpc-0abc123..."
# private_subnet_ids = ["subnet-0aaa...", "subnet-0bbb...", "subnet-0ccc..."]
# public_subnet_ids  = ["subnet-0ddd...", "subnet-0eee...", "subnet-0fff..."]
# cluster_zone_id    = "Z1234567890ABC"
```

---

## STEP 8.5 — Save Terraform Outputs for Later Use

```bash
# Save all outputs to environment variables
export VPC_ID=$(terraform output -raw vpc_id)
export PRIVATE_SUBNET_IDS=$(terraform output -json private_subnet_ids | jq -r 'join(",")')
export PUBLIC_SUBNET_IDS=$(terraform output -json public_subnet_ids | jq -r 'join(",")')

echo "VPC ID: $VPC_ID"
echo "Private Subnets: $PRIVATE_SUBNET_IDS"
echo "Public Subnets: $PUBLIC_SUBNET_IDS"

# Persist to shell config
echo "export VPC_ID=$VPC_ID" >> ~/.bashrc
echo "export PRIVATE_SUBNET_IDS=$PRIVATE_SUBNET_IDS" >> ~/.bashrc
echo "export PUBLIC_SUBNET_IDS=$PUBLIC_SUBNET_IDS" >> ~/.bashrc

cd ..
```

---

## STEP 8.6 — Verify Resources in AWS Console

OPEN your browser. NAVIGATE to:

1. **VPC Console** → https://console.aws.amazon.com/vpc/
   - CONFIRM you see `taskapp-vpc` with CIDR `10.0.0.0/16`
   - CONFIRM 3 public subnets and 3 private subnets
   - CONFIRM 3 NAT Gateways (status: Available)

2. **Route53 Console** → https://console.aws.amazon.com/route53/
   - CONFIRM you see two hosted zones: your root domain and `k8s.yourdomain.com`

3. **IAM Console** → https://console.aws.amazon.com/iam/
   - CONFIRM you see `kops-master-k8s.yourdomain.com` and `kops-node-k8s.yourdomain.com` roles

---

## STEP 8.7 — Commit Your Terraform Code to Git

```bash
cd ..  # Back to project root

git add terraform/
git commit -m "feat: add terraform VPC, IAM, and DNS modules

- VPC with 10.0.0.0/16 CIDR across 3 AZs
- 3 public subnets (10.0.1-3.0/24) for NAT and LB
- 3 private subnets (10.0.11-13.0/24) for Kubernetes nodes
- 3 NAT Gateways (one per AZ, no SPOF)
- IAM roles for Kops master and node instance profiles
- Route53 hosted zone for cluster subdomain"
```

> Notice: `terraform.tfstate` is NOT committed because it is in `.gitignore`.
> The state lives safely in S3.
