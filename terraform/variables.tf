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
  description = "Kubernetes cluster FQDN"
  type        = string
  default     = "k8s.task-app.online"
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
