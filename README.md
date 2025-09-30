# PrestaShop Multi-Tenant SaaS Platform

A scalable infrastructure that dynamically provisions isolated PrestaShop e-commerce instances with automated deployment, containerization, and database management.

## Features

- **Multi-tenant Architecture**: Each store runs in isolated Docker containers with dedicated databases
- **Automated Deployment**: Deploy fully functional PrestaShop instances in under 2 minutes
- **Dynamic Port Allocation**: Automatic port discovery starting from 8081
- **Containerized Isolation**: Dedicated MySQL database for each tenant
- **Scalable Design**: Support for hundreds of isolated stores
- **Simple Management**: Clean web interface for store creation

## Architecture

```
Frontend (Next.js) → Backend (Flask) → Docker Engine → PrestaShop + MySQL Containers
```

Each tenant gets:
- Dedicated PrestaShop container
- Isolated MySQL database
- Unique port assignment
- Separate Docker network

## Tech Stack

- **Backend**: Flask, Python
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Containerization**: Docker, Docker Compose
- **Database**: MySQL 5.7
- **E-commerce**: PrestaShop 8.1.6

## Prerequisites

- Docker & Docker Compose
- Python 3.8+
- Node.js 18+

## Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/aryanrangapur/Multi-Tenant-PrestaShop-SaaS-Server.git
cd Multi-Tenant-PrestaShop-SaaS-Server
```

2. **Start the Backend**
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

3. **Start the Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☁️ AWS Deployment

### Simple EC2 Deployment

1. **Launch EC2 Instance**
   - AMI: Amazon Linux 2023
   - Instance Type: t3.medium (minimum)
   - Storage: 30GB+ 
   - Security Group: Open ports 22, 3000, 5000, 8081-8100

2. **Deploy with One Command**
```bash
# Connect to your EC2 instance
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Install Docker and deploy
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone https://github.com/aryanrangapur/Multi-Tenant-PrestaShop-SaaS-Server.git
cd Multi-Tenant-PrestaShop-SaaS-Server
docker-compose up -d
```

3. **Access Your Application**
- Frontend: http://YOUR_EC2_IP:3000
- Backend API: http://YOUR_EC2_IP:5000
- Stores: http://YOUR_EC2_IP:8081, http://YOUR_EC2_IP:8082, etc.

## Usage

1. **Access the frontend** at http://localhost:3000
2. **Enter admin credentials** (email and password) for your new store
3. **Click "Deploy Store"** - the system will:
   - Create isolated Docker containers
   - Setup MySQL database
   - Configure PrestaShop
   - Return store URLs

4. **Access your store** using the provided URLs:
   - Store Frontend: `http://localhost:8081` (or assigned port)
   - Admin Panel: `http://localhost:8081/admin-xxxx`

## 🔧 API Endpoints

### Create Store
```http
POST /create-store
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "url": "http://localhost:8081",
  "admin_url": "http://localhost:8081/admin123",
  "admin_email": "admin@example.com",
  "admin_password": "securepassword"
}
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy"
}
```

## Project Structure

```
Multi-Tenant-PrestaShop-SaaS-Server/
├── backend/
│   ├── app.py                 # Flask backend server
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Backend container definition
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Main page component
│   │   └── globals.css       # Global styles
│   ├── package.json          # Node.js dependencies
│   ├── Dockerfile            # Frontend container definition
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── .env.example          # Environment variables template
├── docker-compose.yml        # Multi-container setup
├── README.md                 # This file
└── .gitignore               # Git ignore rules
```

## Docker Configuration

### Backend Service
- **Port**: 5000
- **Environment**: BASE_PORT, TENANTS_DIR
- **Volumes**: Docker socket, tenants directory

### Frontend Service  
- **Port**: 3000
- **Environment**: BACKEND_URL
- **Depends on**: Backend service

### Store Containers (Auto-created)
- **Port Range**: 8081-8100+
- **Services**: PrestaShop + MySQL per store
- **Networks**: Isolated per tenant

## Environment Variables

### Backend (.env)
```env
BASE_PORT=8081
TENANTS_DIR=./tenants
```

### Frontend (.env)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Maintenance

### Stop and Cleanup
```bash
# Stop all services (preserves data)
docker-compose down

# Stop and remove all data (⚠️ Destructive)
docker-compose down -v

# Clean up individual tenant
cd backend/tenants/tenantX
docker-compose down -v
```

### View Logs
```bash
# Application logs
docker-compose logs -f

# Individual store logs
docker logs tenant1_shop
docker logs tenant1_db
```

## Important Notes

- **Docker must be running** before creating stores
- **Ports 8081-8100** should be available for store instances
- **Admin credentials** are stored in the database - use strong passwords
- **Data persistence** uses Docker volumes - backup regularly
- **For production**: Add SSL, authentication, and monitoring

##  Troubleshooting

### Store not accessible?
- Wait 1-2 minutes for full initialization
- Check Docker container status: `docker ps`
- View container logs: `docker logs container_name`

### Port already in use?
- The system automatically finds the next available port
- Ensure ports 8081-8100 are not occupied by other services

### Docker compose errors?
- Ensure Docker and Docker Compose are properly installed
- Check permissions for Docker socket

##  License

MIT License - see repository for details.

