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
