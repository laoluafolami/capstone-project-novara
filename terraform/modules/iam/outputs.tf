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
