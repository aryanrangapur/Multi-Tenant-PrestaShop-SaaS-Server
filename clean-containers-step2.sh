#!/bin/bash
echo "=== Cleaning up all tenant resources ==="

echo "1. Stopping tenant containers..."
docker stop $(docker ps -a | grep "tenant" | awk '{print $1}') 2>/dev/null || echo "No tenant containers to stop"

echo "2. Removing tenant containers..."
docker rm $(docker ps -a | grep "tenant" | awk '{print $1}') 2>/dev/null || echo "No tenant containers to remove"

echo "3. Removing tenant networks..."
docker network rm $(docker network ls | grep "tenant" | awk '{print $1}') 2>/dev/null || echo "No tenant networks to remove"

echo "4. Removing tenant volumes..."
docker volume rm $(docker volume ls | grep "tenant" | awk '{print $2}') 2>/dev/null || echo "No tenant volumes to remove"

echo "5. Cleaning tenant directories..."
sudo rm -rf backend/tenants/* 2>/dev/null || echo "No tenant directories to clean"

echo "6. Verifying cleanup..."
echo "Containers:" && docker ps -a | grep tenant || echo " No tenant containers"
echo "Networks:" && docker network ls | grep tenant || echo " No tenant networks"  
echo "Volumes:" && docker volume ls | grep tenant || echo " No tenant volumes"
echo "Directories:" && ls backend/tenants/ 2>/dev/null || echo " Tenant directories empty"

echo "=== Cleanup complete ==="
