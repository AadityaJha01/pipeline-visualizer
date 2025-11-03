# ⚡ Quick Start - Deployment Checklist

This is a condensed checklist version. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🎯 Prerequisites Checklist

- [ ] AWS Account configured
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Docker Desktop installed
- [ ] Docker Hub account created
- [ ] GitHub repository ready

## 🚀 Deployment Steps (In Order)

### 1. AWS Setup (15 min)
```bash
# Create IAM role for EC2
aws iam create-role --role-name PipelineVisualizerEC2Role ...
aws iam attach-role-policy --role-name ... --policy-arn ...

# Create security group
aws ec2 create-security-group --group-name pipeline-visualizer-sg ...

# Launch EC2 instance
aws ec2 run-instances --image-id ... --iam-instance-profile ...
```

### 2. Docker Hub Setup (5 min)
- [ ] Login: `docker login`
- [ ] Create repositories:
  - `pipeline-visualizer-frontend`
  - `pipeline-visualizer-backend`

### 3. Build & Push Images (10 min)
```bash
# Build
cd frontend && docker build -t your-username/pipeline-visualizer-frontend:latest .
cd ../backend && docker build -t your-username/pipeline-visualizer-backend:latest .

# Push
docker push your-username/pipeline-visualizer-frontend:latest
docker push your-username/pipeline-visualizer-backend:latest
```

### 4. Connect to EC2 (2 min)
```bash
# Get instance ID
INSTANCE_ID="i-xxxxxxxxxxxxx"

# Connect via Session Manager
aws ssm start-session --target $INSTANCE_ID
```

### 5. Setup on EC2 (10 min)
```bash
# Run setup script
bash scripts/setup-secrets.sh

# Create docker-compose.yml (copy from deployment guide)
nano /opt/pipeline-visualizer/docker-compose.yml

# Create .env file with secrets
nano /opt/pipeline-visualizer/.env
```

### 6. Deploy Application (5 min)
```bash
cd /opt/pipeline-visualizer
docker-compose pull
docker-compose up -d
docker-compose ps
```

### 7. Configure Jenkins (15 min)
- [ ] Access: `http://EC2_IP:8080`
- [ ] Enter initial password (from `/var/lib/jenkins/secrets/initialAdminPassword`)
- [ ] Install plugins
- [ ] Create admin user
- [ ] Add Docker Hub credentials
- [ ] Create pipeline job

### 8. Verify (5 min)
- [ ] Frontend: `http://EC2_IP`
- [ ] Backend: `http://EC2_IP:5000/health`
- [ ] Jenkins: `http://EC2_IP:8080`

## 🔐 Secrets Management

**Never commit these files:**
- `*.env`
- `secrets/*`
- `terraform.tfvars`
- `*.pem`, `*.key`

**On EC2, create:**
- `/opt/pipeline-visualizer/.env` (with actual secrets)
- Update docker-compose.yml with your Docker Hub username

## 📝 Common Commands

```bash
# Connect to EC2
aws ssm start-session --target i-xxxxxxxxxxxxx

# Get EC2 IP
aws ec2 describe-instances --instance-ids i-xxx --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

# Deploy updates (on EC2)
cd /opt/pipeline-visualizer && docker-compose pull && docker-compose up -d

# View logs
docker-compose logs -f
```

## ⚠️ Important Notes

1. **No SSH Required**: Use AWS Session Manager instead
2. **Secrets**: Never commit actual secrets - use `.env` files on EC2 only
3. **Docker Hub**: Replace `your-username` with your actual Docker Hub username everywhere
4. **EC2 IP**: You'll need the public IP to access the application
5. **Security**: Keep security groups restrictive (only open needed ports)

## 🆘 Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Detailed step-by-step instructions
- Troubleshooting section
- Configuration examples
- Best practices

---

**Total Deployment Time: ~60 minutes** (depending on experience level)

