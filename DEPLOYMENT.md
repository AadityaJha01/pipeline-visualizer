# 🚀 Pipeline Visualizer 2.0 - Complete Deployment Guide

This guide will walk you through deploying the Pipeline Visualizer to AWS EC2 using Docker Hub, AWS Session Manager, and Jenkins.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Setup](#aws-setup)
3. [Docker Hub Setup](#docker-hub-setup)
4. [EC2 Instance Setup](#ec2-instance-setup)
5. [Jenkins Setup](#jenkins-setup)
6. [Building and Pushing Docker Images](#building-and-pushing-docker-images)
7. [Application Deployment](#application-deployment)
8. [Handling Secrets & Placeholders](#handling-secrets--placeholders)
9. [Verification & Testing](#verification--testing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools & Accounts
- ✅ AWS Account with appropriate permissions
- ✅ Docker Hub account (free tier works)
- ✅ GitHub account (for repository)
- ✅ AWS CLI installed locally
- ✅ Docker Desktop installed locally
- ✅ Terraform >= 1.0 installed locally

### Required AWS Permissions
- EC2 (create, modify, terminate instances)
- IAM (create roles and policies)
- Systems Manager (Session Manager access)
- VPC (network configuration)

---

## 1. AWS Setup

### Step 1.1: Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

### Step 1.2: Create IAM Role for EC2 Instance

This role allows EC2 to use Session Manager and access ECR.

```bash
# Create trust policy
cat > ec2-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name PipelineVisualizerEC2Role \
  --assume-role-policy-document file://ec2-trust-policy.json

# Attach AWS managed policies
aws iam attach-role-policy \
  --role-name PipelineVisualizerEC2Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

aws iam attach-role-policy \
  --role-name PipelineVisualizerEC2Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name PipelineVisualizerEC2Profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name PipelineVisualizerEC2Profile \
  --role-name PipelineVisualizerEC2Role
```

### Step 1.3: Create Security Group

```bash
# Get your IP address
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Create security group
aws ec2 create-security-group \
  --group-name pipeline-visualizer-sg \
  --description "Security group for Pipeline Visualizer" \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=PipelineVisualizerSG}]"

# Note the GroupId from output, then use it below
SG_ID="sg-xxxxxxxxx"  # Replace with your security group ID

# Allow HTTP (80)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS (443)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow Jenkins (8080)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 8080 \
  --cidr $MY_IP/32

# Allow Backend API (5000)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5000 \
  --cidr 0.0.0.0/0

# Allow SSH for Session Manager (only if needed)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr $MY_IP/32
```

---

## 2. Docker Hub Setup

### Step 2.1: Create Docker Hub Account

1. Go to [https://hub.docker.com](https://hub.docker.com)
2. Sign up for a free account
3. Create two repositories:
   - `pipeline-visualizer-frontend`
   - `pipeline-visualizer-backend`

### Step 2.2: Login to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password.

### Step 2.3: Note Your Docker Hub Credentials

You'll need these later:
- **Docker Hub Username**: `your-username`
- **Docker Hub Password/Token**: (save securely)

---

## 3. EC2 Instance Setup

### Step 3.1: Launch EC2 Instance

```bash
# Get latest Ubuntu 22.04 AMI
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hubble-22.04-amd64-server-*" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text)

# Get your instance profile ARN (from Step 1.2)
INSTANCE_PROFILE_ARN="arn:aws:iam::YOUR_ACCOUNT_ID:instance-profile/PipelineVisualizerEC2Profile"

# Launch instance
aws ec2 run-instances \
  --image-id $AMI_ID \
  --count 1 \
  --instance-type t3.medium \
  --key-name YOUR_KEY_PAIR_NAME \
  --security-group-ids $SG_ID \
  --iam-instance-profile Name=PipelineVisualizerEC2Profile \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=PipelineVisualizer}]" \
  --user-data file://ec2-user-data.sh

# Note the InstanceId from output
```

Create `ec2-user-data.sh`:

```bash
#!/bin/bash
# Install SSM Agent (should be pre-installed, but ensuring it's running)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js (for Jenkins pipelines if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Jenkins
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | apt-key add -
sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
apt-get update
apt-get install -y jenkins

# Configure Jenkins to run Docker
usermod -aG docker jenkins

# Start services
systemctl enable docker
systemctl start docker
systemctl enable jenkins
systemctl start jenkins

# Create application directory
mkdir -p /opt/pipeline-visualizer
chown -R ubuntu:ubuntu /opt/pipeline-visualizer
```

**Important**: Replace `YOUR_KEY_PAIR_NAME` with your actual key pair name (even though we'll use Session Manager, AWS requires a key pair for instance launch).

### Step 3.2: Wait for Instance to be Ready

```bash
INSTANCE_ID="i-xxxxxxxxxxxxx"  # Replace with your instance ID

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Wait a bit more for user data script to complete
echo "Waiting for user-data script to complete (2 minutes)..."
sleep 120
```

### Step 3.3: Connect via AWS Session Manager

```bash
# Connect to instance
aws ssm start-session --target $INSTANCE_ID
```

Once connected, you'll be in an interactive shell on the EC2 instance.

---

## 4. Jenkins Setup

### Step 4.1: Get Jenkins Initial Admin Password

From your Session Manager session on EC2:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Copy this password.

### Step 4.2: Access Jenkins Web UI

1. Get your EC2 instance public IP:
   ```bash
   aws ec2 describe-instances \
     --instance-ids $INSTANCE_ID \
     --query 'Reservations[0].Instances[0].PublicIpAddress' \
     --output text
   ```

2. Open browser: `http://EC2_PUBLIC_IP:8080`

3. Enter the initial admin password

4. Install suggested plugins

5. Create admin user (save credentials securely)

### Step 4.3: Configure Jenkins for Docker Hub

1. **Install Docker Pipeline Plugin**:
   - Manage Jenkins → Manage Plugins → Available
   - Search "Docker Pipeline"
   - Install without restart

2. **Configure Docker Hub Credentials**:
   - Manage Jenkins → Manage Credentials
   - Add Credentials:
     - Kind: Username with password
     - Username: Your Docker Hub username
     - Password: Your Docker Hub password/token
     - ID: `dockerhub-credentials`
     - Description: Docker Hub Credentials

3. **Configure Jenkins GitHub Webhook** (optional):
   - Install "GitHub plugin"
   - Manage Jenkins → Configure System
   - Add GitHub server
   - Configure credentials for GitHub

### Step 4.4: Create Jenkins Pipeline Job

1. New Item → Pipeline → Name: `pipeline-visualizer`
2. Configure:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your GitHub repo URL
   - Credentials: Add if private repo
   - Branch: `*/main` or `*/master`
   - Script Path: `jenkins/Jenkinsfile`
3. Save

---

## 5. Building and Pushing Docker Images

### Step 5.1: Build Docker Images Locally

From your local machine:

```bash
# Build frontend
cd frontend
docker build -t your-dockerhub-username/pipeline-visualizer-frontend:latest .

# Build backend
cd ../backend
docker build -t your-dockerhub-username/pipeline-visualizer-backend:latest .
```

### Step 5.2: Push to Docker Hub

```bash
# Login (if not already)
docker login

# Push images
docker push your-dockerhub-username/pipeline-visualizer-frontend:latest
docker push your-dockerhub-username/pipeline-visualizer-backend:latest
```

### Step 5.3: Update Docker Compose File

On your EC2 instance (via Session Manager), create the production docker-compose file:

```bash
# Navigate to application directory
cd /opt/pipeline-visualizer

# Create docker-compose.yml (see next section)
```

---

## 6. Application Deployment

### Step 6.1: Create Production Docker Compose File

Connect via Session Manager and create `/opt/pipeline-visualizer/docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: your-dockerhub-username/pipeline-visualizer-backend:latest
    container_name: pipeline-visualizer-api
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - JENKINS_URL=http://localhost:8080
      - JENKINS_USER=${JENKINS_USER}
      - JENKINS_TOKEN=${JENKINS_TOKEN}
    restart: unless-stopped
    networks:
      - pipeline-network
    depends_on:
      - frontend

  frontend:
    image: your-dockerhub-username/pipeline-visualizer-frontend:latest
    container_name: pipeline-visualizer-ui
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://EC2_PUBLIC_IP:5000
    restart: unless-stopped
    networks:
      - pipeline-network

networks:
  pipeline-network:
    driver: bridge
```

**Replace placeholders**:
- `your-dockerhub-username` with your actual Docker Hub username
- `EC2_PUBLIC_IP` with your EC2 instance public IP

### Step 6.2: Create Environment File

Create `/opt/pipeline-visualizer/.env` on EC2:

```bash
sudo nano /opt/pipeline-visualizer/.env
```

Add:
```
JENKINS_USER=admin
JENKINS_TOKEN=your-jenkins-api-token
```

### Step 6.3: Get Jenkins API Token

1. Jenkins → Your Username (top right) → Configure
2. API Token section → Add new token
3. Copy the token
4. Update `.env` file with token

### Step 6.4: Deploy Application

On EC2 via Session Manager:

```bash
cd /opt/pipeline-visualizer

# Pull latest images
docker-compose pull

# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 6.5: Configure Nginx (Optional - for better routing)

Install Nginx:

```bash
sudo apt-get install -y nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/pipeline-visualizer
```

Add:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/pipeline-visualizer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. Handling Secrets & Placeholders

### Step 7.1: Create Secrets Template File

Create `secrets/` directory in your repo (this directory is gitignored):

```bash
mkdir -p secrets
```

### Step 7.2: Create Template Files

**`secrets/backend.env.template`**:
```bash
# Jenkins Configuration
JENKINS_URL=http://localhost:8080
JENKINS_USER=your-username
JENKINS_TOKEN=your-api-token

# Server Configuration
PORT=5000
NODE_ENV=production
```

**`secrets/docker-compose.prod.template`**:
```yaml
version: '3.8'
services:
  backend:
    image: YOUR_DOCKERHUB_USERNAME/pipeline-visualizer-backend:latest
    # ... rest of config
```

### Step 7.3: Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Load secrets (you'll create this manually on EC2)
if [ ! -f secrets/.env.production ]; then
    echo "❌ Error: secrets/.env.production not found"
    echo "📝 Create this file from secrets/.env.template"
    exit 1
fi

# Build images
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Push to Docker Hub
echo "⬆️  Pushing to Docker Hub..."
docker-compose -f docker-compose.prod.yml push

echo "✅ Deployment complete!"
```

### Step 7.4: Manual Secret Creation on EC2

**Option A: Via Session Manager (Recommended)**

1. Connect via Session Manager:
   ```bash
   aws ssm start-session --target $INSTANCE_ID
   ```

2. Create secrets file:
   ```bash
   sudo nano /opt/pipeline-visualizer/.env
   ```

3. Paste your actual secrets (they won't be committed to git)

**Option B: Use AWS Systems Manager Parameter Store**

Store secrets in AWS Parameter Store:

```bash
# Store Jenkins token
aws ssm put-parameter \
  --name "/pipeline-visualizer/jenkins/token" \
  --value "your-actual-token" \
  --type "SecureString"

# Retrieve on EC2
aws ssm get-parameter \
  --name "/pipeline-visualizer/jenkins/token" \
  --with-decryption \
  --query Parameter.Value \
  --output text
```

Update your docker-compose to use Parameter Store values.

### Step 7.5: Update Jenkinsfile for Secrets

Update `jenkins/Jenkinsfile` to handle secrets securely:

```groovy
pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        JENKINS_URL = 'http://localhost:8080'
    }
    
    stages {
        stage('Build') {
            steps {
                sh '''
                    docker build -t ${DOCKERHUB_USERNAME}/pipeline-visualizer-frontend:latest ./frontend
                    docker build -t ${DOCKERHUB_USERNAME}/pipeline-visualizer-backend:latest ./backend
                '''
            }
        }
        
        stage('Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
                    sh '''
                        echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin
                        docker push ${DOCKERHUB_USERNAME}/pipeline-visualizer-frontend:latest
                        docker push ${DOCKERHUB_USERNAME}/pipeline-visualizer-backend:latest
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} '
                        cd /opt/pipeline-visualizer
                        docker-compose pull
                        docker-compose up -d
                    '
                '''
            }
        }
    }
}
```

---

## 8. Verification & Testing

### Step 8.1: Test Backend API

```bash
# From your local machine
curl http://EC2_PUBLIC_IP:5000/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Step 8.2: Test Frontend

1. Open browser: `http://EC2_PUBLIC_IP`
2. Verify dashboard loads
3. Check pipeline visualization displays

### Step 8.3: Test Jenkins Integration

1. Go to Jenkins: `http://EC2_PUBLIC_IP:8080`
2. Create a test pipeline job
3. Verify it appears in the visualizer

### Step 8.4: Monitor Logs

```bash
# On EC2 via Session Manager
docker-compose -f /opt/pipeline-visualizer/docker-compose.yml logs -f
```

---

## 9. Ongoing Operations

### Update Application

```bash
# Via Session Manager
aws ssm start-session --target $INSTANCE_ID

# On EC2
cd /opt/pipeline-visualizer
docker-compose pull
docker-compose up -d --force-recreate
```

### View Application Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services

```bash
docker-compose restart
```

### Backup Jenkins Data

```bash
sudo tar -czf jenkins-backup-$(date +%Y%m%d).tar.gz /var/lib/jenkins
```

---

## 10. Troubleshooting

### Issue: Can't connect via Session Manager

**Solution**:
- Ensure IAM role is attached to instance
- Check SSM agent is running: `sudo systemctl status amazon-ssm-agent`
- Verify security group allows outbound HTTPS (port 443)

### Issue: Docker images not pulling

**Solution**:
- Check Docker Hub credentials
- Verify network connectivity: `docker pull hello-world`
- Check docker-compose file image names

### Issue: Frontend can't connect to backend

**Solution**:
- Verify `REACT_APP_API_URL` in docker-compose
- Check backend is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`

### Issue: Jenkins API authentication fails

**Solution**:
- Verify JENKINS_TOKEN in .env file
- Regenerate API token in Jenkins
- Check Jenkins URL is correct

---

## 📝 Quick Reference Commands

```bash
# Connect to EC2
aws ssm start-session --target i-xxxxxxxxxxxxx

# Get EC2 IP
aws ec2 describe-instances --instance-ids i-xxxxxxxxxxxxx --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

# Deploy updates
cd /opt/pipeline-visualizer && docker-compose pull && docker-compose up -d

# View logs
docker-compose logs -f

# Check container status
docker-compose ps

# Restart services
docker-compose restart
```

---

## ✅ Deployment Checklist

- [ ] AWS CLI configured
- [ ] IAM role created and attached
- [ ] EC2 instance launched with Session Manager
- [ ] Docker Hub account created and images pushed
- [ ] Jenkins installed and configured
- [ ] Docker Compose file created on EC2
- [ ] Environment variables set (not committed)
- [ ] Application deployed and running
- [ ] Health checks passing
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] Jenkins integration working

---

**🎉 Congratulations! Your Pipeline Visualizer is now deployed!**

For questions or issues, refer to the troubleshooting section or check the logs.

