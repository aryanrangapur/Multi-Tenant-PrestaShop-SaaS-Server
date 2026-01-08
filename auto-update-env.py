#!/usr/bin/env python3
import os
import re
import requests

def get_instance_ip():
    """Get public IP with multiple fallbacks."""
    services = [
        "https://icanhazip.com",
        "https://api.ipify.org",
        "https://checkip.amazonaws.com",
        "https://ipinfo.io/ip",
    ]

    for service in services:
        try:
            response = requests.get(service, timeout=5)
            ip = response.text.strip()
            if ip and 6 < len(ip) < 16:
                print(f"✅ Using public IP: {ip}")
                return ip
        except Exception as e:
            print(f"⚠️ Failed to get IP from {service}: {e}")

    print("🚨 No public IP found, using localhost")
    return "127.0.0.1"


def update_env_file(file_path, key, value):
    """
    Create .env if missing.
    Update key if exists.
    Append key if missing.
    """
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    if not os.path.exists(file_path):
        print(f"📄 Creating {file_path}")
        content = ""
    else:
        with open(file_path, "r") as f:
            content = f.read()

    pattern = rf"^{key}=.*$"
    replacement = f"{key}={value}"

    new_content, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)

    if count == 0:
        if content and not content.endswith("\n"):
            new_content += "\n"
        new_content += replacement + "\n"

    with open(file_path, "w") as f:
        f.write(new_content)

    print(f"✅ Updated {file_path}: {key}={value}")


def read_env_value(file_path, key):
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

    update_env_file(
        frontend_env,
        "NEXT_PUBLIC_BACKEND_URL",
        f"http://{ip}:5000",
    )

    update_env_file(
        backend_env,
        "SERVER_IP",
        ip,
    )

    print("\n📦 Final .env values:")
    print(
        f"Frontend → NEXT_PUBLIC_BACKEND_URL={read_env_value(frontend_env, 'NEXT_PUBLIC_BACKEND_URL')}"
    )
    print(
        f"Backend  → SERVER_IP={read_env_value(backend_env, 'SERVER_IP')}"
    )

    print("\n🎉 Environment files created/updated successfully!")
