# Prestashop-SaaS in AWS

To deploy your application (`index.html` and `myserver.py`) on AWS, here are the step-by-step instructions and the necessary code changes.

### Step-by-Step Guide to Deploying the App on AWS

#### 1. **Set up an AWS EC2 Instance:**
   - Log into your AWS console and go to **EC2**.
   - Click on **Launch Instance**.
   - Choose an Amazon Machine Image (AMI) — you can use **Ubuntu** or **Amazon Linux**.
   - Select an instance type, e.g., **t2.micro** (free tier eligible).
   - Configure instance details, like network and subnet.
   - Add storage (8 GB is sufficient for testing).
   - Add a security group that allows inbound traffic on the following ports:
     - **22** (for SSH access).
     - **80** (HTTP).
     - **443** (HTTPS).
     - **5000** (to access your Flask app).
     - **8081-9000** (for tenants).
   - Review and launch the instance. Make sure to generate a key pair for SSH access.

#### 2. **Connect to your EC2 Instance:**
   - Once the EC2 instance is running, connect to it using SSH:
     ```bash
     ssh -i /path/to/your-key.pem ubuntu@<your-ec2-ip-address>
     ```

#### 3. **Install Dependencies on EC2:**
   - After connecting to your EC2 instance, you'll need to install the necessary dependencies.

   - **Update the package list and install prerequisites:**
     ```bash
     sudo apt update
     sudo apt install -y python3-pip python3-dev nginx docker.io docker-compose git
     sudo systemctl enable docker
     sudo systemctl start docker
     ```

 

   - **Verify Docker installation:**
     ```bash
     sudo docker --version
     ```

   - **Verify Docker Compose installation:**
     ```bash
     sudo docker-compose --version
     ```

#### 4. **Set up Your Application on the EC2 Instance:**
   - Clone your project repository or upload your code files to the EC2 instance. If you're using `git`:
     ```bash
     git clone https://your-repository-url.git
     cd your-project-directory
     ```

   - If you're manually uploading, you can use `scp` or any file transfer method.



#### 6. **Ensure that AWS Security Groups Allow Access to Ports:**
   - Make sure the security group associated with your EC2 instance allows inbound traffic on port 5000, as your Flask app will run on that port.
   
   - You can do this by editing your security group in the AWS console and adding an inbound rule for TCP on port 5000.

#### 7. **Set up Nginx to Reverse Proxy to Flask App:**
   - Nginx is a popular web server that can be used to proxy traffic to your Flask app, especially for production.

   - **Configure Nginx:**
     1. Open the Nginx config file:
        ```bash
        sudo vim /etc/nginx/sites-available/default
        ```

     2. Update the server block to proxy requests to your Flask app:
        ```nginx
        server {
            listen 80;

            server_name <your-ec2-ip-address>;

            location / {
                proxy_pass http://127.0.0.1:5000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
        ```

     3. Restart Nginx to apply changes:
        ```bash
        sudo systemctl restart nginx
        ```


     ### **Install Flask and other Python dependencies:**
     ```bash
     # Make sure you have Python and venv tools
     
        sudo apt update
        sudo apt install python3-venv python3-pip -y
     
     # Create and activate a virtual environment
     
        python3 -m venv venv
        source venv/bin/activate
     
     sudo pip3 install flask requests
     ```

     
### FOR FINAL RUN:
``` bash
  python3 myserver.py &
```

Then visit:
```
  http://<your-ec2-ip>:5000
