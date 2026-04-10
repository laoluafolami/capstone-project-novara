# terraform/modules/iam/main.tf

# ── KOPS MASTER IAM ROLE ─────────────────────────────────────────────────────
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

# ── KOPS NODE IAM ROLE ───────────────────────────────────────────────────────
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
