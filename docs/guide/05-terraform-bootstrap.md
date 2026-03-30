# SECTION 5 — Terraform: Remote State Bootstrap

> Terraform "state" is a file that tracks what AWS resources Terraform has created.
> By default it saves to your local disk — dangerous because if you lose it, Terraform
> loses track of your infrastructure. The solution: store state in S3 (remote) and use
> DynamoDB to prevent two people running Terraform at the same time (state locking).
>
> This section creates the S3 bucket and DynamoDB table BEFORE writing any other
> Terraform code. We do this manually once using the AWS CLI.

---

## STEP 5.1 — Create the Terraform State S3 Bucket

```bash
# Choose a globally unique bucket name (S3 bucket names are global across all AWS accounts)
export TF_STATE_BUCKET="taskapp-terraform-state-${AWS_ACCOUNT_ID}"
echo "export TF_STATE_BUCKET=$TF_STATE_BUCKET" >> ~/.bashrc

# Create the S3 bucket
# NOTE: us-east-1 does NOT use --create-bucket-configuration
# For any other region, uncomment the LocationConstraint line
aws s3api create-bucket \
  --bucket $TF_STATE_BUCKET \
  --region $AWS_REGION
# For regions OTHER than us-east-1, use this instead:
# aws s3api create-bucket \
#   --bucket $TF_STATE_BUCKET \
#   --region $AWS_REGION \
#   --create-bucket-configuration LocationConstraint=$AWS_REGION

# Enable versioning — lets you recover from accidental state corruption
aws s3api put-bucket-versioning \
  --bucket $TF_STATE_BUCKET \
  --versioning-configuration Status=Enabled

# Enable server-side encryption — state files contain sensitive data
aws s3api put-bucket-encryption \
  --bucket $TF_STATE_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block all public access — state files must NEVER be public
aws s3api put-public-access-block \
  --bucket $TF_STATE_BUCKET \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "✅ Terraform state bucket created: $TF_STATE_BUCKET"
```

---

## STEP 5.2 — Create the DynamoDB Table for State Locking

```bash
# Create DynamoDB table for Terraform state locking
# The partition key MUST be named "LockID" — Terraform requires this exact name
aws dynamodb create-table \
  --table-name taskapp-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION

echo "✅ DynamoDB lock table created: taskapp-terraform-locks"
```

---

## STEP 5.3 — Create the Kops State S3 Bucket

Kops needs its own separate S3 bucket to store cluster configuration.
This is different from the Terraform state bucket.

```bash
export KOPS_STATE_BUCKET="taskapp-kops-state-${AWS_ACCOUNT_ID}"
echo "export KOPS_STATE_BUCKET=$KOPS_STATE_BUCKET" >> ~/.bashrc
echo "export KOPS_STATE_STORE=s3://${KOPS_STATE_BUCKET}" >> ~/.bashrc

aws s3api create-bucket \
  --bucket $KOPS_STATE_BUCKET \
  --region $AWS_REGION

aws s3api put-bucket-versioning \
  --bucket $KOPS_STATE_BUCKET \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket $KOPS_STATE_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

aws s3api put-public-access-block \
  --bucket $KOPS_STATE_BUCKET \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "✅ Kops state bucket created: $KOPS_STATE_BUCKET"
```

---

## STEP 5.4 — Create the etcd Backup S3 Bucket

etcd is the Kubernetes database. You must back it up daily to S3.

```bash
export ETCD_BACKUP_BUCKET="taskapp-etcd-backups-${AWS_ACCOUNT_ID}"
echo "export ETCD_BACKUP_BUCKET=$ETCD_BACKUP_BUCKET" >> ~/.bashrc

aws s3api create-bucket \
  --bucket $ETCD_BACKUP_BUCKET \
  --region $AWS_REGION

aws s3api put-bucket-versioning \
  --bucket $ETCD_BACKUP_BUCKET \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket $ETCD_BACKUP_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Add lifecycle rule to delete backups older than 30 days (cost control)
aws s3api put-bucket-lifecycle-configuration \
  --bucket $ETCD_BACKUP_BUCKET \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "delete-old-backups",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "Expiration": {"Days": 30}
    }]
  }'

echo "✅ etcd backup bucket created: $ETCD_BACKUP_BUCKET"
```

---

## STEP 5.5 — Write the Terraform Backend Configuration

OPEN VS Code. NAVIGATE to `terraform/`. CREATE `backend.tf`:

```hcl
# terraform/backend.tf
# This tells Terraform WHERE to store its state file.
# Replace the bucket name with your actual TF_STATE_BUCKET value.

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Replace with your actual bucket name (the value of $TF_STATE_BUCKET)
    bucket         = "taskapp-terraform-state-YOUR_ACCOUNT_ID"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "taskapp-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "taskapp-capstone"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}
```

> Why default_tags? Every AWS resource Terraform creates will automatically get
> these tags. This makes cost tracking and cleanup much easier.
