import os
import socket
import subprocess
import time
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
BASE_PORT = int(os.getenv('BASE_PORT', 8081))
TENANTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tenants')
os.makedirs(TENANTS_DIR, exist_ok=True)

def get_next_port():
    port = BASE_PORT
    while True:
        with socket.socket() as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
        port += 1

def get_instance_ip():
    """Fetch the EC2 instance's public or private IP from metadata service with IMDSv2 support."""
    import requests
    
    # Step 1: Get IMDSv2 session token (required for IMDSv2)
    try:
        token_response = requests.put(
            'http://169.254.169.254/latest/api/token',
            headers={'X-aws-ec2-metadata-token-ttl-seconds': '21600'},
            timeout=2
        )
        token = token_response.text
        if token:
            headers = {'X-aws-ec2-metadata-token': token}
        else:
            headers = {}
            print("Warning: Empty token response, falling back to IMDSv1")
    except requests.RequestException as e:
        print(f"Warning: Failed to get IMDS token: {e}, trying IMDSv1")
        headers = {}
    
    # Step 2: Try public IPv4
    try:
        ip = requests.get(
            'http://169.254.169.254/latest/meta-data/public-ipv4',
            headers=headers,
            timeout=2
        ).text.strip()
        if ip and ip != '':  # Ensure not empty
            print(f"Using public IP: {ip}")
            return ip
    except requests.RequestException as e:
        print(f"Warning: Failed to get public IPv4: {e}")
    
    # Step 3: Fallback to private IPv4
    try:
        ip = requests.get(
            'http://169.254.169.254/latest/meta-data/local-ipv4',
            headers=headers,
            timeout=2
        ).text.strip()
        if ip and ip != '':  # Ensure not empty
            print(f"Using private IP: {ip}")
            return ip
    except requests.RequestException as e:
        print(f"Warning: Failed to get private IPv4: {e}")
    
    # Step 4: Final fallback for non-EC2 (local testing)
    print("Warning: No EC2 IP found, using localhost fallback")
    return '127.0.0.1'

@app.route('/create-store', methods=['POST'])
def create_store():
    try:
        body = request.get_json(force=True)
        custom_email = body.get("email")
        custom_password = body.get("password")
        ip_address = get_instance_ip()

        existing = os.listdir(TENANTS_DIR)
        tenant = f"tenant{len(existing)+1}"
        port = get_next_port()
        path = os.path.join(TENANTS_DIR, tenant)
        os.makedirs(path, exist_ok=True)

        admin_email = custom_email 
        admin_password = custom_password 
        admin_folder = "admin"

        # Create docker-compose.yml file
        compose = f"""
services:
  db:
    image: mysql:5.7
    container_name: {tenant}_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: prestashop
      MYSQL_USER: psuser
      MYSQL_PASSWORD: pspassword
    networks:
      - ps-net
    volumes:
      - db_data_{tenant}:/var/lib/mysql

  prestashop:
    image: prestashop/prestashop:8.1.6-apache
    container_name: {tenant}_shop
    restart: always
    depends_on:
      - db
    networks:
      - ps-net
    ports:
      - "{port}:80"
    environment:
      DB_SERVER: db
      DB_USER: psuser
      DB_PASSWD: pspassword
      PS_INSTALL_AUTO: '1'
      PS_DEV_MODE: '0'
      PS_DOMAIN: {ip_address}:{port}
      PS_LANGUAGE: en
      PS_COUNTRY: US
      PS_FOLDER_ADMIN: {admin_folder}
      PS_FOLDER_INSTALL: install
      ADMIN_MAIL: {admin_email}
      ADMIN_PASSWD: {admin_password}
    volumes:
      - ps_data_{tenant}:/var/www/html

volumes:
  db_data_{tenant}:
  ps_data_{tenant}:

networks:
  ps-net:
    driver: bridge
"""

        with open(os.path.join(path, "docker-compose.yml"), "w") as f:
            f.write(compose)

        print(f"Starting Docker Compose for {tenant} on port {port}...")
        
        # Use subprocess with timeout and proper working directory
        result = subprocess.run(
            ['docker-compose', '-f', 'docker-compose.yml', 'up', '-d'],
            cwd=path,
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )
        
        if result.returncode != 0:
            print(f"Docker Compose failed: {result.stderr}")
            return jsonify({'error': f'Docker Compose failed: {result.stderr}'}), 500

        print("Docker Compose started successfully, waiting for PrestaShop...")

        # Wait for PrestaShop to be ready
        shop_url = f"http://{ip_address}:{port}"
        max_attempts = 60
        
        for i in range(max_attempts):
            try:
                print(f"Checking if store is ready... Attempt {i+1}/{max_attempts}")
                r = requests.get(shop_url, timeout=10)
                if r.status_code == 200:
                    print("Store is ready!")
                    break
            except requests.RequestException as e:
                print(f"Store not ready yet: {e}")
            
            if i < max_attempts - 1:
                time.sleep(2)

        # Get admin folder
        admin_folder = "admin"
        try:
            container_name = f"{tenant}_shop"
            # Wait a bit more for installation to complete
            time.sleep(10)
            
            command = f"docker exec {container_name} find /var/www/html -maxdepth 1 -type d -name 'admin*' -exec basename {{}} \\;"
            output = subprocess.check_output(command, shell=True, timeout=30).decode().strip()
            if output:
                admin_folder = output
                print(f"Found admin folder: {admin_folder}")
        except Exception as e:
            print(f"Could not determine admin folder, using default: {e}")

        admin_url = f"{shop_url}/{admin_folder}"
        
        return jsonify({
            'url': shop_url,
            'admin_url': admin_url,
            'admin_email': admin_email,
            'admin_password': admin_password,
            'message': 'Store created successfully! It may take a few minutes to be fully accessible.'
        })

    except subprocess.TimeoutExpired:
        print("Docker Compose command timed out")
        return jsonify({'error': 'Docker Compose command timed out. Please check Docker installation.'}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    print(f"Tenants directory: {TENANTS_DIR}")
    print("Starting Flask server on http://0.0.0.0:5000")
    app.run('0.0.0.0', 5000, debug=True)