# 💻 Digital Label: Teammate's Laptop Setup Guide (Local Database Setup)

Follow this guide step-by-step to set up your laptop from scratch. This gets the exact same Next.js frontend, WSL Ubuntu 24.04 backend, Nginx, PHP 8.4, Local MySQL Database, and Domain Mapping environment running and 100% identical to mine!

---

## 📂 Phase 1: Clone & Prepare Windows Code Folder

Before doing anything in Ubuntu/WSL, we must clone the project and prepare our files on Windows.

### 1. Clone the Repository
You should already be in the **`D:\Project`** folder. Open a standard Windows terminal (CMD or PowerShell) there and run:
```cmd
git clone https://github.com/Heang0/Digital-Label
```
This creates your project at exactly **`D:\Project\Digital-Label`**, which all Nginx and Ubuntu paths in this guide depend on.

> **📥 Getting Future Updates** — Whenever your teammate pushes new code, just open a terminal in `D:\Project\Digital-Label` and run:
> ```cmd
> git pull
> ```
> That's it! Your local code will be up to date.

### 2. Install Node.js on Windows
Before running `npm`, you need **Node.js** installed on your Windows machine.

1. Go to **[https://nodejs.org](https://nodejs.org)** and download the **LTS** version (the big green button).
2. Run the installer and click **Next** through all steps (keep all defaults).
3. **Restart your terminal** after installing.
4. Verify it worked — open a new CMD window and run:
   ```cmd
   node -v
   npm -v
   ```
   You should see version numbers printed (e.g. `v20.x.x`). ✅

### 3. Install Frontend Dependencies
From your Windows terminal, enter the `frontend` folder and install packages:
```cmd
cd D:\Project\Digital-Label\frontend
npm install
```

### 3. Create Frontend Environment File (`frontend/.env`)
Create a new file named **`.env`** inside the `frontend/` directory, and paste this Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCfgE3QkbaBoMZCBmU_twXH2lQu192bJH0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=digital-label-8620b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=digital-label-8620b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=digital-label-8620b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=342078286952
NEXT_PUBLIC_FIREBASE_APP_ID=1:342078286952:web:c125a1ae12edac51029fdd
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-QHGBZ7RD29
```

### 4. Create Backend Environment File (`backend/.env`)
Go to the `backend/` folder on Windows, duplicate/copy **`.env.example`**, rename the copy to **`.env`**, and make sure it has the local database block active:
```env
# Ensure this block is uncommented in backend/.env:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=digital_label
DB_USERNAME=laravel_user
DB_PASSWORD=kitzulabel@@99!
MYSQL_ATTR_SSL_CA=
```

---

## 🐧 Phase 2: Install Ubuntu 24.04 on Windows (WSL 2)

We run the Laravel PHP backend inside a super-fast Ubuntu Linux environment.

1. Press the **Windows Key**, type **`cmd`**, right-click **Command Prompt**, and select **"Run as Administrator"**.
2. Enable Windows virtualization features:
   ```cmd
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   ```
   ```cmd
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```
3. **Restart your laptop.**
4. Once logged back in, open **Command Prompt (CMD) as Administrator** again and install Ubuntu:
   ```cmd
   wsl --install -d Ubuntu-24.04
   ```
5. A new terminal window will pop up to initialize Ubuntu:
   * **Username:** Enter `kitzu` (or your name).
   * **Password:** Enter a simple password (e.g., `password123`). *Note: When typing passwords in Linux, the screen stays blank. Just type blindly and press Enter.*

---

## 🛑 Phase 3: Stop XAMPP on Windows (If Installed)

If you have XAMPP installed on Windows, open the **XAMPP Control Panel** and click **Stop** next to both **Apache** and **MySQL**. WSL 2 needs port 80 and port 3306 to be completely free!

---

## 🛠️ Phase 4: Install PHP 8.4, Nginx & MySQL in WSL

Open your **Ubuntu WSL terminal** and run these commands one-by-one:

### 1. Update the packages list:
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Add the PHP repository:
```bash
sudo add-apt-repository ppa:ondrej/php -y && sudo apt update
```

### 3. Install PHP 8.4, Nginx, MySQL, and Composer:
```bash
sudo apt install -y php8.4-fpm php8.4-mysql php8.4-xml php8.4-curl php8.4-gd php8.4-mbstring php8.4-zip php8.4-bcmath nginx mysql-server certbot python3-certbot-nginx composer
```

---

## 💾 Phase 5: Configure the Local MySQL Database

Inside your **Ubuntu WSL terminal**:

1. Log into MySQL as root:
   ```bash
   sudo mysql
   ```
2. Paste these commands **one by one** to create the database, the user, and grant privileges with native password hashing (crucial for PHP compatibility):
   ```sql
   CREATE DATABASE IF NOT EXISTS digital_label CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   CREATE USER IF NOT EXISTS 'laravel_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'kitzulabel@@99!';
   
   GRANT ALL PRIVILEGES ON digital_label.* TO 'laravel_user'@'localhost';
   
   FLUSH PRIVILEGES;
   
   EXIT;
   ```

---

## 🔗 Phase 6: Link Windows Folder & Apply Permissions

We must mount the Windows folder in Ubuntu so that Nginx and PHP can run it directly.

Inside your **Ubuntu terminal**, run:

### 1. Create a symlink to your project folder:
```bash
sudo ln -sf "/mnt/d/Project/Digital-Label" /var/www/digital-label
```

### 2. Apply full permission keys for Laravel storage and cache directories:
```bash
sudo chmod -R 777 "/mnt/d/Project/Digital-Label/backend/storage"
sudo chmod -R 777 "/mnt/d/Project/Digital-Label/backend/bootstrap/cache"
```

---

## 🐘 Phase 7: Install Backend Dependencies & Seed Database

Now, we install Laravel's PHP dependencies and set up the database tables and admin users.

Inside your **Ubuntu terminal**:

### 1. Move to the backend folder:
```bash
cd /var/www/digital-label/backend
```

### 2. Install Composer Dependencies:
```bash
composer install
```

### 3. Generate Laravel Application Key:
```bash
php artisan key:generate
```

### 4. Build Database Schema & Seed Local Data:
```bash
php artisan migrate:fresh --seed
```
*This seeds the local database with pre-configured accounts: Admin (`kitzuadmin@gmail.com` with password `kitzuadmin9080@@`) and Vendor (`test@example.com` with password `password`).*

---

## 🌐 Phase 8: Configure Nginx Virtual Host

Inside your **Ubuntu terminal**, run this command to copy our server configuration directly:

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

### Activate the Nginx Configuration:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/digital-label.conf /etc/nginx/sites-enabled/
sudo mkdir -p /run && sudo touch /run/nginx.pid
sudo service nginx restart
sudo service php8.4-fpm restart
```

---

## 📝 Phase 9: Domain Mapping on Windows

To make `http://digital.label` load in your Windows browser:

1. Switch back to your **Windows Command Prompt (Run as Administrator)**.
2. Run this command to map the local domain:
   ```cmd
   echo 127.0.0.1 digital.label >> C:\Windows\System32\drivers\etc\hosts
   ```

---

## 🔄 Daily Development: How to Start & Stop

Follow this checklist every time you work to save your laptop's battery and RAM!

### 🚀 How to START the Server:
1. **Open your Ubuntu WSL terminal** (Search for "Ubuntu" in Windows Start Menu).
2. Run this command to launch the background servers:
   ```bash
   sudo service nginx start && sudo service php8.4-fpm start && sudo service mysql start
   ```
3. Open a **Windows terminal** inside the `frontend` folder and start the Next.js dev server:
   ```cmd
   cd D:\Project\Digital-Label\frontend
   npm run dev
   ```
4. Open your browser and go to **`http://localhost:3000`** to view your beautiful website!

### 🛑 How to STOP the Server:
1. In your **Windows terminal**, press **`Ctrl + C`** to stop Next.js.
2. In your **Ubuntu terminal**, stop all WSL services:
   ```bash
   sudo service nginx stop && sudo service php8.4-fpm stop && sudo service mysql stop
   ```
3. (Highly Recommended) To release 100% of memory from WSL back to Windows, run this in any **Windows terminal**:
   ```cmd
   wsl --shutdown
   ```

---

### 🎉 Congratulations!
Your local setup is now 100% identical and mirrors mine perfectly. Enjoy coding!
