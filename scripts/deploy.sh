#!/bin/bash
# Deployment script for Pipeline Visualizer
# Run this from your local machine or CI/CD pipeline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-your-username}"
EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-i-xxxxxxxxxxxxx}"
REGION="${AWS_REGION:-us-east-1}"

echo -e "${GREEN}🚀 Starting Pipeline Visualizer Deployment${NC}"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Build images
echo -e "${YELLOW}📦 Building Docker images...${NC}"

cd frontend
docker build -t ${DOCKERHUB_USERNAME}/pipeline-visualizer-frontend:latest .
cd ../backend
docker build -t ${DOCKERHUB_USERNAME}/pipeline-visualizer-backend:latest .
cd ..

echo -e "${GREEN}✅ Docker images built successfully${NC}"

# Login to Docker Hub
echo -e "${YELLOW}🔐 Logging into Docker Hub...${NC}"
if [ -z "$DOCKERHUB_PASSWORD" ]; then
    echo "Enter Docker Hub password:"
    docker login -u ${DOCKERHUB_USERNAME}
else
    echo "$DOCKERHUB_PASSWORD" | docker login -u ${DOCKERHUB_USERNAME} --password-stdin
fi

# Push images
echo -e "${YELLOW}⬆️  Pushing images to Docker Hub...${NC}"
docker push ${DOCKERHUB_USERNAME}/pipeline-visualizer-frontend:latest
docker push ${DOCKERHUB_USERNAME}/pipeline-visualizer-backend:latest

echo -e "${GREEN}✅ Images pushed successfully${NC}"

# Deploy to EC2
echo -e "${YELLOW}🚀 Deploying to EC2...${NC}"

# Get EC2 public IP
EC2_IP=$(aws ec2 describe-instances \
    --instance-ids ${EC2_INSTANCE_ID} \
    --region ${REGION} \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "EC2 IP: ${EC2_IP}"

# Deploy via Session Manager
aws ssm send-command \
    --instance-ids ${EC2_INSTANCE_ID} \
    --region ${REGION} \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[
        'cd /opt/pipeline-visualizer',
        'docker-compose pull',
        'docker-compose up -d --force-recreate',
        'docker-compose ps'
    ]" \
    --output text \
    --query "Command.CommandId"

echo -e "${GREEN}✅ Deployment command sent to EC2${NC}"
echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"

# Wait a bit for deployment
sleep 30

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

# Check if containers are running
aws ssm send-command \
    --instance-ids ${EC2_INSTANCE_ID} \
    --region ${REGION} \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[
        'docker-compose -f /opt/pipeline-visualizer/docker-compose.yml ps'
    ]" \
    --output text \
    --query "Command.CommandId"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Frontend: http://${EC2_IP}${NC}"
echo -e "${GREEN}🔌 Backend API: http://${EC2_IP}:5000${NC}"
echo -e "${GREEN}⚙️  Jenkins: http://${EC2_IP}:8080${NC}"

