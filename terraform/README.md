# Terraform Infrastructure

This directory contains Terraform configurations for deploying the Pipeline Visualizer infrastructure on AWS.

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured
- AWS account with appropriate permissions

## Setup

1. **Configure Variables**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Initialize Terraform**

   ```bash
   terraform init
   ```

3. **Plan Deployment**

   ```bash
   terraform plan
   ```

4. **Apply Configuration**

   ```bash
   terraform apply
   ```

## Infrastructure Components

- **VPC** - Virtual Private Cloud with public/private subnets
- **EC2** - Jenkins server instance
- **ECR** - Container registry for Docker images
- **S3** - Static asset storage
- **Security Groups** - Network security rules

## Outputs

After applying, Terraform will output:
- Jenkins URL
- ECR repository URL
- S3 bucket name

## Destroy

To tear down all resources:

```bash
terraform destroy
```

## Notes

- Make sure to configure your AWS credentials before running Terraform
- The backend S3 bucket for state should be created manually or use local state for initial setup
- Adjust instance types and regions based on your needs and budget

