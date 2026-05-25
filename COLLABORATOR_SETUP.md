# 🤝 Digital Label: Collaborator's Setup & Environment Guide

Welcome to the **Digital Label** project! Follow this guide to set up your local development environment after cloning the repository.

---

## 🚀 Quick Setup Overview
We use a **Next.js (React) frontend** on Windows and a **Laravel (PHP 8.4) backend** inside **Ubuntu WSL (with Nginx)**. 
Both frontend and backend connect to a **Shared Aiven Cloud Database**, meaning we share the exact same database. You don't need to run a local database!

---

## 1. Clone & Install Dependencies

### 📂 Step A: Clone the Repository
Open your terminal (CMD or PowerShell) on Windows and run:
```bash
git clone <your-repository-url>
cd Digital-Label
```

### 💻 Step B: Install Frontend Dependencies
From the project root folder:
```cmd
cd frontend
npm install
```

### 🐘 Step C: Install Backend Dependencies
*(Make sure you have Composer installed on Windows or inside Ubuntu)*
Open your terminal inside the `backend` folder:
```cmd
cd ../backend
composer install
```

---

## 2. Environment Variables (.env) Setup

You need to create `.env` files for both the frontend and backend. These are ignored by Git, so you must create them manually.

### 📱 Frontend Environment (`frontend/.env`)
Create a file named **`.env`** inside the `frontend` folder and paste this exact Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCfgE3QkbaBoMZCBmU_twXH2lQu192bJH0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=digital-label-8620b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=digital-label-8620b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=digital-label-8620b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=342078286952
NEXT_PUBLIC_FIREBASE_APP_ID=1:342078286952:web:c125a1ae12edac51029fdd
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-QHGBZ7RD29
```

---

### 🐘 Backend Environment (`backend/.env`)
1. Create a file named **`.env`** inside the `backend` folder.
2. Copy the contents of `backend/.env.example` into your new `.env` file.
3. Replace the database lines (usually lines 23-28) with the following **Aiven Cloud Database** configurations:

```env
DB_CONNECTION=mysql
DB_HOST=digital-label-digital-label.a.aivencloud.com
DB_PORT=22014
DB_DATABASE=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=ASK_TEAMMATE_FOR_PASSWORD

MYSQL_ATTR_SSL_CA=/var/www/digital-label/backend/ca.pem
```

---

## 3. SSL CA Certificate Setup (Aiven Security)
Because the Aiven cloud database requires a secure SSL connection, you must download the **CA Certificate**:

1. Log into the **Aiven Console** and select your MySQL service.
2. In the **Connection information** panel, click **Download** next to **CA Certificate** (or click **Show**, copy the text, and save it in a new text file).
3. Save the certificate file as **`ca.pem`** inside your `backend` folder:
   * Path: `backend/ca.pem`

---

## 4. Ubuntu WSL & Nginx Setup (Backend Host)

Follow these quick commands inside your **Ubuntu terminal** to link your project and set up Nginx:

### 1. Create a link to your Windows folder:
```bash
sudo ln -sf "/mnt/d/Project/Kitzu-Label" /var/www/digital-label
```
*(⚠️ **Important:** Adjust the `/mnt/d/Project/...` path to match the exact path on your laptop!)*

### 2. Configure Nginx Virtual Host:
Run this command in Ubuntu to copy the server configuration:
```bash
sudo tee /etc/nginx/sites-available/digital-label.conf << 'EOF'
server {
    listen 80;
    server_name digital.label;
    root /var/www/digital-label/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF
```

### 3. Activate Nginx & PHP Services:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/digital-label.conf /etc/nginx/sites-enabled/
sudo service nginx restart
sudo service php8.4-fpm restart
```

### 4. Domain Mapping (Windows):
Open your **Windows Command Prompt (CMD) as Administrator** and run:
```cmd
echo 127.0.0.1 digital.label >> C:\Windows\System32\drivers\etc\hosts
```

### 5. Generate Laravel Application Key:
Inside your Windows or Ubuntu terminal, go into the `backend` folder and run:
```bash
php artisan key:generate
```

## 🏃 Daily Workflow: How to Start & Stop the Server

When you finish working on your project, you can turn off Ubuntu services to save battery and RAM. Below are the commands to start and stop services for both **Local** and **Aiven** database modes.

### 1. How to START the Server:
1. **Open your Ubuntu WSL terminal** (Search for "Ubuntu" in Windows Start Menu or type `wsl` in Windows CMD).
2. Run the command based on which database is active in your `.env`:

   * **A. If using Aiven Cloud Database Mode:**
     *No need to run local MySQL, saving your laptop's memory/battery!*
     ```bash
     sudo service nginx start && sudo service php8.4-fpm start
     ```
   
   * **B. If using Local Database Mode:**
     *Starts your local MySQL database as well:*
     ```bash
     sudo service nginx start && sudo service php8.4-fpm start && sudo service mysql start
     ```

3. Open your project on Windows and start your **frontend** (in Windows terminal):
   ```cmd
   cd frontend
   npm run dev
   ```
4. Visit **`http://localhost:3000`** in your browser!

---

### 2. How to STOP the Server (To save RAM/Battery):
When you are done working, you can stop the background services inside your **Ubuntu terminal**:

* **A. If using Aiven Cloud Database Mode:**
  ```bash
  sudo service nginx stop && sudo service php8.4-fpm stop
  ```

* **B. If using Local Database Mode:**
  ```bash
  sudo service nginx stop && sudo service php8.4-fpm stop && sudo service mysql stop
  ```

---

### 3. Complete WSL Shutdown (End of Day):
To release **100% of memory and CPU** from Ubuntu back to your laptop, run this in any **Windows CMD/PowerShell**:
```cmd
wsl --shutdown
```

---

### 🎉 All Done!
Open your browser and visit: **`http://localhost:3000`** to view your app!
