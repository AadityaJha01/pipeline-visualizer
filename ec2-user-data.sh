#!/bin/bash
# EC2 User Data Script for Pipeline Visualizer
# This script runs on instance launch

# Install SSM Agent (ensuring it's running)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Update system
export DEBIAN_FRONTEND=noninteractive
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

# Create log directory
mkdir -p /var/log/pipeline-visualizer
chown -R ubuntu:ubuntu /var/log/pipeline-visualizer

# Log completion
echo "EC2 initialization complete at $(date)" >> /var/log/pipeline-visualizer/init.log

