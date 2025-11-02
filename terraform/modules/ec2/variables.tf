variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "key_name" {
  description = "AWS key pair name"
  type        = string
}

variable "jenkins_admin_user" {
  description = "Jenkins admin username"
  type        = string
}

variable "jenkins_admin_pass" {
  description = "Jenkins admin password"
  type        = string
  sensitive   = true
}

