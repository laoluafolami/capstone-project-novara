# SECTION 7 — Terraform: IAM Module & DNS Module

---

## PART A — IAM MODULE

> IAM Roles are like job titles with specific permissions.
> Instead of giving your EC2 instances a username/password to access AWS services,
> you attach a Role. The instance automatically gets temporary credentials.
> This is called an "Instance Profile" — it is the secure, correct way.

---

## STEP 7.1 — Create IAM Module Variables

CREATE `terraform/modules/iam/variables.tf`:

```hcl
# terraform/modules/iam/variables.tf

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
}

variable "kops_state_bucket" {
  description = "S3 bucket name for Kops state"
  type        = string
}

variable "etcd_backup_bucket" {
  description = "S3 bucket name for etcd backups"
  type        = string
}
```

---

## STEP 7.2 — Create IAM Module Main File

CREATE `terraform/modules/iam/main.tf`:

```hcl
# terraform/modules/iam/main.tf

# ── KOPS MASTER IAM ROLE ──────────────────────────────────────────────────────
# Kubernetes master nodes need these permissions to manage the cluster
resource "aws_iam_role" "kops_master" {
  name = "kops-master-${var.cluster_name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Name = "kops-master-role" }
}

resource "aws_iam_role_policy" "kops_master" {
  name = "kops-master-policy"
  role = aws_iam_role.kops_master.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "elasticloadbalancing:*",
          "autoscaling:*",
          "route53:*"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:*"]
        Resource = [
          "arn:aws:s3:::${var.kops_state_bucket}",
          "arn:aws:s3:::${var.kops_state_bucket}/*",
          "arn:aws:s3:::${var.etcd_backup_bucket}",
          "arn:aws:s3:::${var.etcd_backup_bucket}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole", "iam:GetRole", "iam:ListRoles"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "kops_master" {
  name = "kops-master-${var.cluster_name}"
  role = aws_iam_role.kops_master.name
}

# ── KOPS NODE IAM ROLE ────────────────────────────────────────────────────────
# Worker nodes need fewer permissions than masters
resource "aws_iam_role" "kops_node" {
  name = "kops-node-${var.cluster_name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Name = "kops-node-role" }
}

resource "aws_iam_role_policy" "kops_node" {
  name = "kops-node-policy"
  role = aws_iam_role.kops_node.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:AttachVolume",
          "ec2:DetachVolume",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          "arn:aws:s3:::${var.kops_state_bucket}",
          "arn:aws:s3:::${var.kops_state_bucket}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "kops_node" {
  name = "kops-node-${var.cluster_name}"
  role = aws_iam_role.kops_node.name
}
```

CREATE `terraform/modules/iam/outputs.tf`:

```hcl
# terraform/modules/iam/outputs.tf

output "master_instance_profile_arn" {
  value = aws_iam_instance_profile.kops_master.arn
}

output "node_instance_profile_arn" {
  value = aws_iam_instance_profile.kops_node.arn
}

output "master_role_arn" {
  value = aws_iam_role.kops_master.arn
}

output "node_role_arn" {
  value = aws_iam_role.kops_node.arn
}
```

---

## PART B — DNS MODULE

---

## STEP 7.3 — Create DNS Module Variables

CREATE `terraform/modules/dns/variables.tf`:

```hcl
# terraform/modules/dns/variables.tf

variable "domain_name" {
  description = "Root domain name (e.g. yourdomain.com)"
  type        = string
}

variable "cluster_name" {
  description = "Kubernetes cluster FQDN (e.g. k8s.yourdomain.com)"
  type        = string
}
```

---

## STEP 7.4 — Create DNS Module Main File

CREATE `terraform/modules/dns/main.tf`:

```hcl
# terraform/modules/dns/main.tf

# Look up the existing hosted zone (created manually in Section 3)
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# Create a subdomain hosted zone for the Kubernetes cluster
# Kops will manage DNS records inside this subdomain
resource "aws_route53_zone" "cluster" {
  name    = var.cluster_name
  comment = "Kubernetes cluster DNS zone managed by Kops"
}

# Delegate the cluster subdomain to its own hosted zone
# This creates NS records in the parent zone pointing to the cluster zone
resource "aws_route53_record" "cluster_ns" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.cluster_name
  type    = "NS"
  ttl     = 300

  records = aws_route53_zone.cluster.name_servers
}
```

CREATE `terraform/modules/dns/outputs.tf`:

```hcl
# terraform/modules/dns/outputs.tf

output "root_zone_id" {
  description = "Route53 zone ID for the root domain"
  value       = data.aws_route53_zone.main.zone_id
}

output "cluster_zone_id" {
  description = "Route53 zone ID for the cluster subdomain"
  value       = aws_route53_zone.cluster.zone_id
}

output "cluster_name_servers" {
  description = "Name servers for the cluster zone"
  value       = aws_route53_zone.cluster.name_servers
}
```

---

## STEP 7.5 — Create the Root Terraform Module

CREATE `terraform/variables.tf`:

```hcl
# terraform/variables.tf

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Your registered domain name"
  type        = string
}

variable "cluster_name" {
  description = "Kubernetes cluster FQDN — must be a subdomain of domain_name"
  type        = string
  default     = "k8s.yourdomain.com"
}

variable "kops_state_bucket" {
  description = "S3 bucket for Kops state"
  type        = string
}

variable "etcd_backup_bucket" {
  description = "S3 bucket for etcd backups"
  type        = string
}

variable "availability_zones" {
  description = "List of AZs to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

CREATE `terraform/main.tf`:

```hcl
# terraform/main.tf

module "vpc" {
  source               = "./modules/vpc"
  cluster_name         = var.cluster_name
  availability_zones   = var.availability_zones
}

module "iam" {
  source             = "./modules/iam"
  cluster_name       = var.cluster_name
  kops_state_bucket  = var.kops_state_bucket
  etcd_backup_bucket = var.etcd_backup_bucket
}

module "dns" {
  source       = "./modules/dns"
  domain_name  = var.domain_name
  cluster_name = var.cluster_name
}
```

CREATE `terraform/outputs.tf`:

```hcl
# terraform/outputs.tf

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "cluster_zone_id" {
  value = module.dns.cluster_zone_id
}

output "master_instance_profile_arn" {
  value = module.iam.master_instance_profile_arn
}

output "node_instance_profile_arn" {
  value = module.iam.node_instance_profile_arn
}
```

CREATE `terraform/terraform.tfvars`:

```hcl
# terraform/terraform.tfvars
# IMPORTANT: Add this file to .gitignore if it contains sensitive values
# For this project it only has non-sensitive config so it is safe to commit

aws_region         = "us-east-1"
domain_name        = "yourdomain.com"
cluster_name       = "k8s.yourdomain.com"
kops_state_bucket  = "taskapp-kops-state-YOUR_ACCOUNT_ID"
etcd_backup_bucket = "taskapp-etcd-backups-YOUR_ACCOUNT_ID"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
```

> REPLACE `yourdomain.com` with your actual domain.
> REPLACE `YOUR_ACCOUNT_ID` with your 12-digit AWS account ID.
