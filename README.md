

# Multi-Tenant PrestaShop SaaS Server

This project implements a Flask-based backend server to dynamically deploy and manage isolated PrestaShop instances using Docker Compose. Each tenant runs in its own container with its own database, on a unique port, allowing for a scalable Software-as-a-Service (SaaS) architecture.



## Project Overview

This backend system allows users to create PrestaShop stores dynamically by sending a POST request with custom admin credentials. The server provisions a new Docker Compose stack for each tenant, assigns it an available port, and updates the admin credentials directly in the MySQL database.



## Architecture

### Components:

- **Flask Server** (`myserver.py`): Handles HTTP requests, creates tenant directories, generates docker-compose files, and manages the lifecycle of tenant containers.
- **Docker Compose**: Each tenant is deployed as a Docker Compose stack with its own PrestaShop and MySQL service.
- **Tenants Directory**: Each tenant has a folder containing its specific `docker-compose.yml`.

### Flow:

1. Client sends a POST request with desired admin email and password.
2. Flask backend:
   - Assigns a unique port.
   - Creates a new directory under `/tenants`.
   - Generates a `docker-compose.yml` for the new store.
   - Launches containers using Docker Compose.
   - Detects the actual admin folder (since PrestaShop randomizes it).
   - Waits for the PrestaShop instance to become available.
   - Updates admin credentials directly in the MySQL container.
3. Returns URLs and credentials to the client.



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



## Environment Variables (Optional)

You can override default behavior using the following environment variables:

| Variable      | Description                    | Default   |
|---------------|--------------------------------|-----------|
| `BASE_PORT`   | Starting port for tenants      | `8081`    |
| `TENANTS_DIR` | Directory for tenant folders   | `tenants` |



## Stopping and Cleaning Up

To stop a specific tenant:

```bash
cd tenants/tenantX
docker-compose down -v
```

To stop all containers:

```bash
docker ps -q --filter "name=tenant" | xargs -r docker stop
```



## License

This project is licensed under the MIT License.
```



Let me know if you want a version that includes cURL or Postman examples, or a separate `docker-compose.override.yml` template for customizing deployments.
