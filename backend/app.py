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
    return 'localhost'

def trigger_admin_renaming(tenant, port):
    """Access the admin URL to trigger folder renaming"""
    try:
        admin_url = f"http://localhost:{port}/admin"
        print(f"Triggering admin folder renaming by accessing: {admin_url}")
        
        # Make a request to the admin URL to trigger renaming
        response = requests.get(admin_url, timeout=30, allow_redirects=True)
        print(f"Admin access response status: {response.status_code}")
        
        # Wait a moment for the renaming to complete
        time.sleep(3)
        return True
    except Exception as e:
        print(f"Error triggering admin renaming: {e}")
        return False

def get_actual_admin_folder(tenant):
    """Simple and reliable admin folder detection"""
    try:
        print(f"🔍 Simple search for admin folder in {tenant}_shop...")
        
        # Just list all directories and look for the one that starts with 'admin'
        result = subprocess.run(
            f'docker exec {tenant}_shop ls /var/www/html',
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            all_items = result.stdout.strip().split('\n')
            print(f"All items in /var/www/html: {all_items}")
            
            for item in all_items:
                if item.startswith('admin') and item != 'admin':
                    print(f"✅ Found admin folder: {item}")
                    return item
        
        # Fallback: try with find command
        result = subprocess.run(
            f'docker exec {tenant}_shop find /var/www/html -maxdepth 1 -type d -name "admin*" -exec basename {{}} \\;',
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0 and result.stdout.strip():
            folders = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
            for folder in folders:
                if folder.startswith('admin') and folder != 'admin':
                    print(f"✅ Found admin folder via find: {folder}")
                    return folder
        
        print("❌ No renamed admin folder found, using default 'admin'")
        return "admin"
        
    except Exception as e:
        print(f"❌ Error detecting admin folder: {e}")
        return "admin"

def debug_admin_folder_detection(tenant):
    """Debug function to see what's really in the container"""
    print(f"🔍 DEBUG: Checking {tenant}_shop container...")
    
    commands = [
        "ls -la /var/www/html | grep admin",
        "find /var/www/html -maxdepth 1 -name 'admin*' -type d",
        "ls -d /var/www/html/admin*/ 2>/dev/null || echo 'No admin folders found'",
        "ls /var/www/html | grep ^admin"
    ]
    
    for i, cmd in enumerate(commands, 1):
        print(f"Command {i}: {cmd}")
        result = subprocess.run(
            f'docker exec {tenant}_shop {cmd}',
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        print(f"Output: {result.stdout}")
        if result.stderr:
            print(f"Error: {result.stderr}")
        print("---")
    
def check_container_health(tenant):
    """Check if containers are running and healthy"""
    print(f"Checking health of {tenant} containers...")
    
    # Check if containers exist and are running
    result = subprocess.run(
        f'docker ps -a --filter "name={tenant}" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
        shell=True,
        capture_output=True,
        text=True
    )
    print("Container status:")
    print(result.stdout)
    
    # Check PrestaShop logs
    print(f"Checking PrestaShop logs for {tenant}_shop:")
    logs_result = subprocess.run(
        f'docker logs --tail 20 {tenant}_shop',
        shell=True,
        capture_output=True,
        text=True
    )
    print(logs_result.stdout)
    if logs_result.stderr:
        print("Errors:", logs_result.stderr)
    
    # Check MySQL logs
    print(f"Checking MySQL logs for {tenant}_db:")
    db_logs = subprocess.run(
        f'docker logs --tail 10 {tenant}_db',
        shell=True,
        capture_output=True,
        text=True
    )
    print(db_logs.stdout)

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

        # Clean up any existing containers
        print(f"Cleaning up any existing {tenant} containers...")
        subprocess.run(f'docker-compose -f {path}/docker-compose.yml down -v', shell=True, capture_output=True)
        subprocess.run(f'docker rm -f {tenant}_shop {tenant}_db', shell=True, capture_output=True)

        # Create docker-compose.yml file
        compose = f"""
services:
  db:
    image: mysql:5.7
    container_name: {tenant}_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: prestashop
      MYSQL_USER: psuser
      MYSQL_PASSWORD: pspassword
    networks:
      - {tenant}-net
    volumes:
      - db_data_{tenant}:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  prestashop:
    image: prestashop/prestashop:8.1.6-apache
    container_name: {tenant}_shop
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    networks:
      - {tenant}-net
    ports:
      - "{port}:80"
    environment:
      DB_SERVER: db
      DB_USER: psuser
      DB_PASSWD: pspassword
      PS_INSTALL_AUTO: '1'
      PS_DEV_MODE: '0'
      PS_HOST_MODE: '1'
      PS_ENABLE_SSL: '0'
      PS_HANDLE_DYNAMIC_DOMAIN: '0'
      PS_DOMAIN: {ip_address}:{port}
      PS_LANGUAGE: en
      PS_COUNTRY: US
      PS_FOLDER_ADMIN: {admin_folder}
      PS_FOLDER_INSTALL: install
      ADMIN_MAIL: {admin_email}
      ADMIN_PASSWD: {admin_password}
    volumes:
      - ps_data_{tenant}:/var/www/html
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      timeout: 10s
      retries: 20
      start_period: 60s

volumes:
  db_data_{tenant}:
  ps_data_{tenant}:

networks:
  {tenant}-net:
    driver: bridge
"""

        with open(os.path.join(path, "docker-compose.yml"), "w") as f:
            f.write(compose)

        # Start Docker containers
        print(f"Starting Docker Compose for {tenant} on port {port}...")
        
        result = subprocess.run(
            f'docker-compose -f docker-compose.yml up -d',
            cwd=path,
            shell=True,
            capture_output=True,
            text=True,
            timeout=180
        )
        
        print("Docker Compose output:", result.stdout)
        if result.stderr:
            print("Docker Compose errors:", result.stderr)
        
        if result.returncode != 0:
            check_container_health(tenant)
            return jsonify({'error': f'Docker failed: {result.stderr}'}), 500

        print("Docker Compose started, waiting for services...")
        
        # Wait for MySQL to be healthy first
        print("Waiting for MySQL to be healthy...")
        for i in range(60):
            db_health = subprocess.run(
                f'docker inspect --format="{{{{.State.Health.Status}}}}" {tenant}_db',
                shell=True,
                capture_output=True,
                text=True
            )
            if db_health.stdout.strip() == 'healthy':
                print("MySQL is healthy!")
                break
            print(f"MySQL health: {db_health.stdout.strip()} (attempt {i+1}/60)")
            time.sleep(2)
        else:
            check_container_health(tenant)
            return jsonify({'error': 'MySQL failed to become healthy'}), 500

        # Now wait for PrestaShop
        print("Waiting for PrestaShop to be healthy...")
        shop_url = f"http://{ip_address}:{port}"
        
        for i in range(120):
            # Check container health status
            shop_health = subprocess.run(
                f'docker inspect --format="{{{{.State.Health.Status}}}}" {tenant}_shop',
                shell=True,
                capture_output=True,
                text=True
            )
            health_status = shop_health.stdout.strip()
            print(f"PrestaShop health: {health_status} (attempt {i+1}/120)")
            
            if health_status == 'healthy':
                print("PrestaShop is healthy!")
                break
                
            # Also try direct HTTP check
            try:
                r = requests.get(shop_url, timeout=5)
                if r.status_code == 200:
                    print("Store is accessible via HTTP!")
                    break
            except:
                pass
                
            time.sleep(2)
        else:
            check_container_health(tenant)
            return jsonify({
                'error': 'PrestaShop took too long to start',
                'url': shop_url,
                'admin_email': admin_email,
                'admin_password': admin_password,
                'message': 'Store deployment started but may need more time. Check the URL in a few minutes.'
            }), 202

        # TRIGGER THE ADMIN RENAMING
        print("🚀 Triggering admin folder renaming...")
        trigger_admin_renaming(tenant, port)
        
        # Debug what's actually there
        debug_admin_folder_detection(tenant)
        
        # Wait a bit more to ensure renaming is complete
        time.sleep(5)
        
        # Now detect the actual admin folder
        print("🔍 Detecting renamed admin folder...")
        actual_admin_folder = get_actual_admin_folder(tenant)
        
        # If we still only found 'admin', try one more time with delay
        if actual_admin_folder == "admin":
            print("🔄 Retrying admin folder detection with longer delay...")
            time.sleep(10)
            actual_admin_folder = get_actual_admin_folder(tenant)
        
        admin_url = f"{shop_url}/{actual_admin_folder}"
        
        print(f"🎯 Final Admin URL: {admin_url}")

        check_container_health(tenant)
        return jsonify({
            'url': shop_url,
            'admin_url': admin_url,
            'admin_folder': actual_admin_folder,
            'admin_email': admin_email,
            'admin_password': admin_password,
            'message': 'Store created successfully! Use the Admin URL below to access your dashboard.'
        })

    except Exception as e:
        check_container_health(tenant)
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/debug/containers', methods=['GET'])
def debug_containers():
    """Debug endpoint to see all containers"""
    result = subprocess.run('docker ps -a', shell=True, capture_output=True, text=True)
    return f"<pre>{result.stdout}</pre>"

if __name__ == '__main__':
    print(f"Tenants directory: {TENANTS_DIR}")
    print("Starting Flask server on http://0.0.0.0:5000")
    app.run('0.0.0.0', 5000, debug=True)