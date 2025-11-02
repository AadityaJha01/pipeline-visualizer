terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "pipeline-visualizer-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "pipeline-visualizer"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  environment        = var.environment
}

# EC2 Instance for Jenkins
module "jenkins_ec2" {
  source = "./modules/ec2"

  vpc_id             = module.vpc.vpc_id
  subnet_id          = module.vpc.public_subnets[0]
  environment        = var.environment
  instance_type      = var.instance_type
  key_name           = var.key_name
  jenkins_admin_user = var.jenkins_admin_user
  jenkins_admin_pass = var.jenkins_admin_pass
}

# ECR Repository
resource "aws_ecr_repository" "pipeline_visualizer" {
  name                 = "pipeline-visualizer"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

# S3 Bucket for static assets
resource "aws_s3_bucket" "pipeline_visualizer_static" {
  bucket = "${var.project_name}-static-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "Pipeline Visualizer Static Assets"
    Environment = var.environment
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "pipeline_visualizer_static" {
  bucket = aws_s3_bucket.pipeline_visualizer_static.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pipeline_visualizer_static" {
  bucket = aws_s3_bucket.pipeline_visualizer_static.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Outputs
output "jenkins_url" {
  value       = "http://${module.jenkins_ec2.public_ip}:8080"
  description = "Jenkins server URL"
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.pipeline_visualizer.repository_url
  description = "ECR repository URL"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.pipeline_visualizer_static.bucket
  description = "S3 bucket name for static assets"
}

