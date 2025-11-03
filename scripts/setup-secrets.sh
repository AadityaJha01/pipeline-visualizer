#!/bin/bash
# Script to help set up secrets on EC2 instance
# Run this via Session Manager on EC2

set -e

echo "🔐 Setting up secrets for Pipeline Visualizer"

# Create secrets directory
mkdir -p /opt/pipeline-visualizer/secrets
cd /opt/pipeline-visualizer

# Create .env file template if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Jenkins Configuration
JENKINS_URL=http://localhost:8080
JENKINS_USER=admin
JENKINS_TOKEN=CHANGE_THIS_TO_YOUR_JENKINS_API_TOKEN

# Server Configuration
PORT=5000
NODE_ENV=production
EOF
    echo "✅ Created .env file template"
else
    echo "ℹ️  .env file already exists"
fi

# Get Jenkins initial admin password
if [ -f /var/lib/jenkins/secrets/initialAdminPassword ]; then
    JENKINS_PASSWORD=$(sudo cat /var/lib/jenkins/secrets/initialAdminPassword)
    echo ""
    echo "📝 Jenkins Initial Admin Password:"
    echo "   $JENKINS_PASSWORD"
    echo ""
    echo "⚠️  Please save this password and configure Jenkins:"
    echo "   1. Go to http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
    echo "   2. Enter the password above"
    echo "   3. After setup, create an API token:"
    echo "      - Click your username (top right) → Configure"
    echo "      - Add new token"
    echo "   4. Update .env file with the token:"
    echo "      sudo nano /opt/pipeline-visualizer/.env"
fi

echo ""
echo "✅ Secrets setup guide complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Get Jenkins API token (see above)"
echo "   2. Edit .env file: sudo nano /opt/pipeline-visualizer/.env"
echo "   3. Replace JENKINS_TOKEN with your actual token"
echo "   4. Save and exit"

