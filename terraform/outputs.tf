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
