#!/bin/bash

# Exit on any error
set -e

echo "--- Starting Smart Document Analysis Setup ---"

# 1. Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker not found. Installing Docker Engine..."
    
    # Update the apt package index
    sudo apt-get update
    
    # Install packages to allow apt to use a repository over HTTPS
    sudo apt-get install -y ca-certificates curl gnupg
    
    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update the apt package index again
    sudo apt-get update
    
    # Install Docker Engine, CLI, and Compose Plugin
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

# 2. Check for Docker Compose (modern CLI plugin)
if ! docker compose version &> /dev/null
then
    echo "Docker Compose plugin not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
else
    echo "Docker Compose plugin is available."
fi

# 3. Start and enable Docker daemon
echo "Ensuring Docker daemon is running..."
sudo systemctl start docker
sudo systemctl enable docker

# 4. Optional: Add user to docker group (requires logout to take effect)
if ! groups $USER | grep &>/dev/null "\bdocker\b"; then
    echo "Adding user $USER to the docker group..."
    sudo usermod -aG docker $USER
    echo "Note: You will need to log out and log back in for 'docker' to work without sudo."
fi

# 5. Build and run the application
echo "--- Starting Application via Docker Compose ---"
# We use sudo here to ensure it works immediately even if the group change isn't active
sudo docker compose up -d --build

echo "--- Setup Complete! ---"
echo "Frontend: http://localhost:4200"
echo "Backend:  http://localhost:8000"
