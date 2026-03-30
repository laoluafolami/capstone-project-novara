# terraform/modules/dns/variables.tf

variable "domain_name" {
  description = "Root domain name (e.g. task-app.online)"
  type        = string
}

variable "cluster_name" {
  description = "Kubernetes cluster FQDN (e.g. k8s.task-app.online)"
  type        = string
}
