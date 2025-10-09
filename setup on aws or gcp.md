
# Multi-Tenant PrestaShop SaaS Server Setup



## Prerequisites

- Ubuntu server (18.04+ recommended)
- SSH access
- `git` installed
- Internet connection



## 1. Update System

Update your package lists and upgrade all packages:

```bash
sudo apt update && sudo apt upgrade -y
````



## 2. Install Docker

Download and install Docker:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Add your user to the `docker` group so you can run Docker without `sudo`:

```bash
sudo usermod -aG docker $USER
```

> ⚠️ After this, log out and log back in for group changes to take effect.



## 3. Install Docker Compose (Legacy)

Download and install Docker Compose v2.24.6:

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```



## 4. Re-login via SSH

Exit your current session and log in again for Docker group changes to apply:

```bash
exit
```

Then SSH back into your server.



## 5. Verify Installations

Check Docker and Docker Compose versions:

```bash
docker --version
docker-compose --version
```



## 6. Clone the Repository

Clone your PrestaShop SaaS server repository:

```bash
git clone https://github.com/aryanrangapur/Multi-Tenant-PrestaShop-SaaS-Server.git
cd Multi-Tenant-PrestaShop-SaaS-Server
```



## 7. Set Server IP

Export your server's public IP to an environment variable and store it in `.env`:

```bash
export SERVER_IP=$(curl -4 icanhazip.com)
echo "SERVER_IP=$SERVER_IP" > .env
```



## 8. Run Setup Script

Run the total setup script to start the application:

```bash
./total-setup.sh
```


make sure your ports mentioned in Readme.md are open.

you can add your custom domain and experiment with the code.
