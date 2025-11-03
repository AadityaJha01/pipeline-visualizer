#!/bin/bash
# Quick script to connect to EC2 via Session Manager
# Usage: ./quick-connect.sh [instance-id]

INSTANCE_ID="${1:-${EC2_INSTANCE_ID}}"

if [ -z "$INSTANCE_ID" ]; then
    echo "❌ Error: Instance ID required"
    echo "Usage: ./quick-connect.sh i-xxxxxxxxxxxxx"
    echo "   or set EC2_INSTANCE_ID environment variable"
    exit 1
fi

echo "🔌 Connecting to EC2 instance: $INSTANCE_ID"
echo "   (Using AWS Session Manager - no SSH needed)"
echo ""

aws ssm start-session --target $INSTANCE_ID

