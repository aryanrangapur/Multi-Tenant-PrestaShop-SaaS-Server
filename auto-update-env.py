#!/usr/bin/env python3
import os
import re
import requests

def get_instance_ip():
    """Get the server's public IP with simple fallback - WORKS ON ANY CLOUD"""
    try:
        # Try to get public IP from icanhazip.com
        response = requests.get('https://icanhazip.com', timeout=5)
        ip = response.text.strip()
        
        # Validate it's a proper IP address
        if ip and len(ip) > 6 and len(ip) < 16:  # Basic IP validation
            print(f"✅ Using public IP: {ip}")
            return ip
        else:
            print(f"⚠️  Invalid IP format from icanhazip: {ip}")
            raise ValueError("Invalid IP format")
            
    except Exception as e:
        print(f"⚠️  Failed to get public IP from icanhazip: {e}")
        
        # Try alternative IP services as backup
        alternative_services = [
            'https://api.ipify.org',
            'https://checkip.amazonaws.com',
            'https://ipinfo.io/ip'
        ]
        
        for service in alternative_services:
            try:
                response = requests.get(service, timeout=5)
                ip = response.text.strip()
                if ip and len(ip) > 6 and len(ip) < 16:
                    print(f"✅ Using public IP from {service}: {ip}")
                    return ip
            except Exception as alt_e:
                print(f"⚠️  Failed to get IP from {service}: {alt_e}")
                continue
    
    # Final fallback
    print("🚨 Warning: No public IP found, using localhost fallback")
    return "127.0.0.1"

def update_env_file(file_path, pattern, replacement):
    """Update or insert a variable line in an .env file."""
    if not os.path.exists(file_path):
        print(f" {file_path} not found, skipping.")
        return False

    with open(file_path, "r") as f:
        content = f.read()

    new_content, count = re.subn(pattern, replacement, content)

    if count == 0:
        new_content += f"\n{replacement}\n"

    with open(file_path, "w") as f:
        f.write(new_content)

    print(f"Updated {file_path}")
    return True

def read_env_line(file_path, key):
    """Read specific key value from .env."""
    if not os.path.exists(file_path):
        return "N/A"
    with open(file_path, "r") as f:
        for line in f:
            if line.startswith(key + "="):
                return line.strip().split("=", 1)[1]
    return "N/A"

if __name__ == "__main__":
    ip = get_instance_ip()

    frontend_env = "frontend/.env"
    backend_env = "backend/.env"

    update_env_file(frontend_env, r"^NEXT_PUBLIC_BACKEND_URL=.*", f"NEXT_PUBLIC_BACKEND_URL=http://{ip}:5000")
    update_env_file(backend_env, r"^SERVER_IP=.*", f"SERVER_IP={ip}")

    print("\n Summary of updated .env values:")
    print(f"Frontend → NEXT_PUBLIC_BACKEND_URL = {read_env_line(frontend_env, 'NEXT_PUBLIC_BACKEND_URL')}")
    print(f"Backend  → SERVER_IP               = {read_env_line(backend_env, 'SERVER_IP')}")
    print(" Environment files updated successfully!")
