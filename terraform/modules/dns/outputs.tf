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
