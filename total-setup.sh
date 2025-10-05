#!/bin/bash
set -e  # Exit immediately on any error

echo " Starting full setup process for Multi-Tenant PrestaShop SaaS Server"
echo "====================================================================="

# Step 0: Auto-update environment files with instance IP
echo "🌐 Step 0: Auto-updating .env files with current EC2 IP..."
python3 auto-update-env.py
echo

# Step 1: Clean disk
echo " Step 1: Cleaning up disk space..."
bash clean-disk-step1.sh
echo " Disk cleanup complete."
echo

# Step 2: Remove tenant containers, volumes, and networks
echo " Step 2: Cleaning up tenant-specific Docker resources..."
bash clean-containers-step2.sh
echo " Tenant cleanup complete."
echo

# Step 3: Rebuild and start Docker containers fresh
echo "  Step 3: Rebuilding and starting Docker services..."
bash start-setup-step3.sh
echo " Services are up and running."
echo

echo "🎉 All setup steps completed successfully!"
echo "====================================================================="
docker ps

