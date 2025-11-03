# 🔐 Secrets Management Guide

This guide explains how to handle secrets and placeholders without committing them to the repository.

## ✅ What's Already Protected

Your `.gitignore` file protects:
- `*.env` files
- `secrets/` directory
- `*.pem` and `*.key` files
- `terraform.tfvars`
- Terraform state files

## 📋 Required Secrets & Placeholders

### 1. Backend Environment Variables

**File**: `/opt/pipeline-visualizer/.env` (on EC2, NOT in repo)

```bash
# Required values to replace:
JENKINS_URL=http://localhost:8080  # Keep as is
JENKINS_USER=admin                  # Change if different
JENKINS_TOKEN=REPLACE_WITH_ACTUAL_TOKEN  # ⚠️ REQUIRED
PORT=5000                           # Keep as is
NODE_ENV=production                 # Keep as is
```

**How to get Jenkins Token:**
1. Go to Jenkins: `http://EC2_IP:8080`
2. Click your username (top right) → Configure
3. API Token section → Add new token
4. Copy the token
5. Update `.env` file

### 2. Docker Hub Credentials

**Placeholders to replace in:**
- `docker-compose.yml` (on EC2)
- `jenkins/Jenkinsfile` (via Jenkins credentials)
- `scripts/deploy.sh`

**Replace:**
- `your-dockerhub-username` → Your actual Docker Hub username
- `your-username` → Your actual Docker Hub username

### 3. Docker Compose Configuration

**File**: `/opt/pipeline-visualizer/docker-compose.yml` (on EC2)

```yaml
services:
  backend:
    image: YOUR_DOCKERHUB_USERNAME/pipeline-visualizer-backend:latest  # ⚠️ REPLACE
    
  frontend:
    image: YOUR_DOCKERHUB_USERNAME/pipeline-visualizer-frontend:latest  # ⚠️ REPLACE
    environment:
      - REACT_APP_API_URL=http://YOUR_EC2_IP:5000  # ⚠️ REPLACE
```

### 4. AWS Configuration

**Placeholders in scripts:**
- `EC2_INSTANCE_ID="i-xxxxxxxxxxxxx"` → Your actual instance ID
- `YOUR_KEY_PAIR_NAME` → Your AWS key pair name
- `YOUR_ACCOUNT_ID` → Your AWS account ID

## 🛠️ Setup Process

### Step 1: Create Secrets Template Locally (Optional)

```bash
# Create local template (won't be committed)
cp backend/env.example secrets/backend.env.local
```

Edit `secrets/backend.env.local` with your local development values.

### Step 2: Create Secrets on EC2

**Via Session Manager:**

```bash
# Connect
aws ssm start-session --target i-xxxxxxxxxxxxx

# Create .env file
sudo nano /opt/pipeline-visualizer/.env
```

**Paste your actual secrets** (they won't be in git).

### Step 3: Update Docker Compose on EC2

```bash
# Edit docker-compose.yml
nano /opt/pipeline-visualizer/docker-compose.yml
```

Replace all placeholders with actual values.

### Step 4: Store Secrets in Jenkins (Optional)

For CI/CD, store secrets in Jenkins:

1. Jenkins → Manage Jenkins → Manage Credentials
2. Add Credentials:
   - **Kind**: Username with password
   - **ID**: `dockerhub-credentials`
   - **Username**: Your Docker Hub username
   - **Password**: Your Docker Hub password/token
3. Use in Jenkinsfile via `withCredentials`

## 🔒 Security Best Practices

### ✅ DO:
- Store secrets only on EC2 instance
- Use environment variables for sensitive data
- Use AWS Parameter Store for production (optional)
- Rotate secrets regularly
- Use least privilege for IAM roles

### ❌ DON'T:
- Commit `.env` files to git
- Commit `terraform.tfvars` with real values
- Share secrets in chat/email
- Hardcode secrets in application code
- Use default passwords

## 📝 Checklist

Before deployment, ensure:

- [ ] `.env` file created on EC2 (not in repo)
- [ ] Docker Hub username replaced in docker-compose.yml
- [ ] EC2 IP address updated in docker-compose.yml
- [ ] Jenkins API token obtained and added to `.env`
- [ ] All `YOUR_*` placeholders replaced
- [ ] Security group properly configured
- [ ] IAM roles have minimal required permissions

## 🔄 Updating Secrets

### To update Jenkins token:

```bash
# On EC2 via Session Manager
nano /opt/pipeline-visualizer/.env
# Update JENKINS_TOKEN
# Restart containers
docker-compose restart backend
```

### To update Docker Hub credentials:

```bash
# Update in Jenkins credentials (web UI)
# Or update docker-compose.yml and restart
docker-compose pull
docker-compose up -d
```

## 🆘 Verification

Check secrets are working:

```bash
# Test backend can connect to Jenkins
curl http://EC2_IP:5000/api/pipelines/status

# Check environment variables in container
docker-compose exec backend env | grep JENKINS
```

## 📚 Additional Resources

- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) - For production secret storage
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/) - Alternative approach
- [Jenkins Credentials](https://www.jenkins.io/doc/book/using/using-credentials/) - Managing credentials in Jenkins

