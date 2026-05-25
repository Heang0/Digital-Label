# ⚡ Digital Label: Daily Development Workflow Guide

Use this guide every time you start or finish working on the project. It shows you the exact, simple steps to run for daily development, whether you want to code on your **Fast Local Database** or connect to the **Shared Aiven Cloud Database**.

---

## 🔌 Part 1: How to Switch Databases (in `.env`)

Before running your server, decide which database you want to use. Open your **`backend/.env`** file and ensure the correct block is active (uncommented). 

Only **one block** should be active at any time!

### 🟢 Choice A: Fast Local Database (Recommended for Daily Coding)
*Super fast response times, completely offline-capable.*

```env
# 👉 BLOCK A: LOCAL DATABASE (Super Fast - Recommended for daily coding!)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=digital_label
DB_USERNAME=laravel_user
DB_PASSWORD=kitzulabel@@99!
MYSQL_ATTR_SSL_CA=
```

### 🔵 Choice B: Aiven Cloud Database (For Sharing & Shared Testing)
*Shares data in real-time with your teammate, but has minor internet lag.*

```env
# 👉 BLOCK B: AIVEN CLOUD DATABASE (For sharing data & production testing)
DB_CONNECTION=mysql
DB_HOST=digital-label-digital-label.a.aivencloud.com
DB_PORT=22014
DB_DATABASE=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=ASK_TEAMMATE_FOR_PASSWORD
MYSQL_ATTR_SSL_CA=/var/www/digital-label/backend/ca.pem
```

---

## 🚀 Part 2: Starting Your Daily Environment

Follow these 3 simple steps to start coding every day:

### Step 1: Open Your Ubuntu WSL Terminal
Press the **Windows Key**, type `Ubuntu`, and open your terminal (or type `wsl` in Windows CMD/PowerShell).

### Step 2: Start Background Services
Paste the command below into your **Ubuntu terminal** depending on which database mode is active:

* **If using Local Database Mode (Choice A):**
  *Starts Nginx, PHP-FPM, and local MySQL:*
  ```bash
  sudo service nginx start && sudo service php8.4-fpm start && sudo service mysql start
  ```

* **If using Aiven Cloud Database Mode (Choice B):**
  *Starts Nginx and PHP-FPM only (saves memory/battery by keeping local MySQL off):*
  ```bash
  sudo service nginx start && sudo service php8.4-fpm start
  ```

> [!NOTE]
> Enter your Ubuntu user password blindly if prompted.

### Step 3: Start Your Frontend
Open a standard **Windows terminal** (CMD or VS Code Terminal) in the `frontend` folder and run:
```cmd
cd frontend
npm run dev
```

🎉 **All Done!** Open your browser and visit: **[http://localhost:3000](http://localhost:3000)**

---

## 🛑 Part 3: Stopping Your Daily Environment

When you finish working for the day, turn off the services to save your laptop's battery, CPU, and RAM.

### Step 1: Stop Your Frontend
Go to your Windows terminal where `npm run dev` is running, and press:
`Ctrl + C` (then type `Y` and press Enter).

### Step 2: Stop Ubuntu WSL Services
In your **Ubuntu terminal**, paste the corresponding command to stop background services:

* **If using Local Database Mode (Choice A):**
  ```bash
  sudo service nginx stop && sudo service php8.4-fpm stop && sudo service mysql stop
  ```

* **If using Aiven Cloud Database Mode (Choice B):**
  ```bash
  sudo service nginx stop && sudo service php8.4-fpm stop
  ```

### Step 3: Complete WSL Shutdown (Highly Recommended at End of Day)
To release **100% of memory and CPU** from Ubuntu back to your laptop, open any **Windows Command Prompt (CMD)** or PowerShell and run:
```cmd
wsl --shutdown
```

---

## 💡 Quick Tips for Daily Development
* **Local Credentials**: The default login account for local database testing is:
  * **Email**: `kitzuadmin@gmail.com`
  * **Password**: `kitzuadmin9080@@`
* **Performance Check**: If the website ever feels stuck or sluggish, run `wsl -u root service php8.4-fpm restart` to instantly refresh your FastCGI cache.
