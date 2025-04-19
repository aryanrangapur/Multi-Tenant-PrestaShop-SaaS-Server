

# Multi-Tenant PrestaShop SaaS Server

This project implements a Flask-based backend server to dynamically deploy and manage isolated PrestaShop instances using Docker Compose. Each tenant runs in its own container with its own database, on a unique port, allowing for a scalable Software-as-a-Service (SaaS) architecture.



## Project Overview

This backend system allows users to create PrestaShop stores dynamically by sending a POST request with custom admin credentials. The server provisions a new Docker Compose stack for each tenant, assigns it an available port, and updates the admin credentials directly in the MySQL database.



## Architecture

### Components:

- **Flask Server** (`myserver.py`): Handles HTTP requests, creates tenant directories, generates docker-compose files, and manages the lifecycle of tenant containers.
- **Docker Compose**: Each tenant is deployed as a Docker Compose stack with its own PrestaShop and MySQL service.
- **Tenants Directory**: Each tenant has a folder containing its specific `docker-compose.yml`.



## Directory Structure

```
.
├── myserver.py             # Flask backend server
├── tenants/                # Directory for tenant docker-compose setups
│   └── tenant1/
│       └── docker-compose.yml
└── static/
    └── index.html          # Default landing page
```



## Prerequisites

- Python 3.8+
- Docker
- Docker Compose
- pip packages:
  - Flask
  - requests

Install Python packages:

```bash
pip install flask requests
```


## Environment Variables (Optional)

You can override default behavior using the following environment variables:

| Variable      | Description                    | Default   |
|---------------|--------------------------------|-----------|
| `BASE_PORT`   | Starting port for tenants      | `8081`    |
| `TENANTS_DIR` | Directory for tenant folders   | `tenants` |



## How to Run

### 1. Start the Flask Server

```bash
python myserver.py
```

This starts the server at `http://localhost:5000`



### 2. Create a Store

Send a `POST` request to:

```
http://localhost:5000/create-store
```

With JSON body:

```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

The server will:

- Provision a new tenant (e.g., `tenant1`)
- Start PrestaShop on the next available port (e.g., `http://localhost:8081`)
- Update admin credentials inside the MySQL DB
- Return:

```json
{
  "url": "http://localhost:8081",
  "admin_url": "http://localhost:8081/admin1234",
  "admin_email": "admin@example.com",
  "admin_password": "securepassword"
}
```


##  **How It Works**

![Architecture Diagram](/saas-arch.png)


1. **User Input**  
   The user enters an email and password in the frontend.

2. **Backend Request**  
   The browser sends a POST request to the Flask backend with this info.

3. **Port & Folder Allocation**  
   Flask:
   - Finds the next free port starting from 8081.
   - Creates a new folder like `tenants/tenant1/`.

4. **Docker Compose File Generation**  
   Flask dynamically writes a `docker-compose.yml` inside the tenant folder with:
   - Database settings
   - PrestaShop config (including admin credentials)

5. **Start Docker Containers**  
   Flask launches the containers using `docker-compose up -d`.

6. **Wait for Setup**  
   It checks if PrestaShop is running and fetches the actual admin folder name (e.g., `admin123`).

7. **Response**  
   Once ready, it returns:
   - Store URL
   - Admin panel URL
   - Email & password




# Stopping and Cleaning Up (**Very Important**)

When you're done with a store, it's essential to **stop and completely remove** the associated containers and **volumes**, as the volumes contain **persisted admin email and password** information.

#### To stop and delete a specific tenant:

```bash
cd tenants/tenantX
docker-compose down -v
```

> **Important**: The `-v` flag ensures the associated volumes (like MySQL data and PrestaShop config) are deleted.  
> This is **critical** to avoid leaking sensitive information such as admin credentials.

#### To stop all tenant containers (without removing volumes): [Not suggested unless you have important data]

```bash
docker ps -q --filter "name=tenant" | xargs -r docker stop
```

If you also want to delete **all tenant volumes**, add this afterward:

```bash
docker volume ls --filter "name=tenant" -q | xargs -r docker volume rm
```






