# terraform/main.tf

module "vpc" {
  source             = "./modules/vpc"
  cluster_name       = var.cluster_name
  availability_zones = var.availability_zones
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
