# Clean up Docker (this will free up a lot of space)
docker system prune -a -f

# Remove all unused containers, networks, images, and build cache
docker system prune --volumes -f

# Clean up apt cache
sudo apt clean

# Remove old logs
sudo journalctl --vacuum-time=1d

# Remove temporary files
sudo rm -rf /tmp/*
