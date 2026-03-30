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
