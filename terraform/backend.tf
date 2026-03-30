# terraform/backend.tf
# This tells Terraform WHERE to store its state file.

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
    bucket         = "taskapp-terraform-state-755077304796"
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
