#!/usr/bin/env python3
import os
import re
import requests

def get_instance_ip():
    """Fetch the EC2 instance's public or private IP from metadata service with IMDSv2 support."""
    try:
        token_response = requests.put(
            'http://169.254.169.254/latest/api/token',
            headers={'X-aws-ec2-metadata-token-ttl-seconds': '21600'},
            timeout=2
        )
        token = token_response.text
        headers = {'X-aws-ec2-metadata-token': token} if token else {}
    except requests.RequestException:
        headers = {}

    for url in [
        'http://169.254.169.254/latest/meta-data/public-ipv4',
        'http://169.254.169.254/latest/meta-data/local-ipv4'
    ]:
        try:
            ip = requests.get(url, headers=headers, timeout=2).text.strip()
            if ip:
                print(f"✅ Using IP: {ip}")
                return ip
        except requests.RequestException:
            pass

    print("⚠️  No EC2 IP found, falling back to localhost.")
    return "127.0.0.1"


def update_env_file(file_path, pattern, replacement):
    """Update or insert a variable line in an .env file."""
    if not os.path.exists(file_path):
        print(f"⚠️  {file_path} not found, skipping.")
        return False

    with open(file_path, "r") as f:
        content = f.read()

    new_content, count = re.subn(pattern, replacement, content)

    if count == 0:
        new_content += f"\n{replacement}\n"

    with open(file_path, "w") as f:
        f.write(new_content)

    print(f"✅ Updated {file_path}")
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

    print("\n📋 Summary of updated .env values:")
    print("---------------------------------------------------")
    print(f"Frontend → NEXT_PUBLIC_BACKEND_URL = {read_env_line(frontend_env, 'NEXT_PUBLIC_BACKEND_URL')}")
    print(f"Backend  → SERVER_IP               = {read_env_line(backend_env, 'SERVER_IP')}")
    print("---------------------------------------------------")
    print("🎉 Environment files updated successfully!")

