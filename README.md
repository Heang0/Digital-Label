C:\xampp\php\php.exe artisan serve
Step 2: Download XAMPP
Go to the official site and download the version for Windows with PHP 8.2 or 8.3: 👉 https://www.apachefriends.org/download.html

Step 3: Download Composer
Download the manual installer here: 👉 https://getcomposer.org/Composer-Setup.exe

Tell me when you have finished installing XAMPP. (Note: When installing XAMPP, it's best to leave the folder as C:\xampp).

Restart VS Code: Close it and open it again so it sees XAMPP and Composer.
Verify: Open a terminal and run php -v and composer -v. They must both show a version now.
Create Project: Run this command in your main folder:
powershell
composer create-project laravel/laravel backend
Start Laravel: Go into the new folder and start the server:
powershell
cd backend
php artisan serve
Test: Open your browser to http://127.0.0.1:8000. You should see the Laravel welcome page!


Just click Next.

Do NOT check "Developer mode"—the standard installation is better and easier for you.

The next screen will ask where your php.exe is. It should automatically find it in C:\xampp\php\php.exe. If it doesn't, browse to that folder!_ | _

11:47 AM


If the box is empty, click Browse... and go to this exact file:

📂 C:\xampp\php\php.exe

Once you select that file, click Next!_ |

YES, check that box! ✅

Checking "Add this PHP to your path?" is the most important part—it's what makes the php command work in your VS Code terminal.

After checking it, click Next. 🚀_ 


If they both show a version, it's time for Step 3:
Run this command in your main folder (D:\Project\All backend Project\Digital-Label) to create your Laravel Backend:

powershell
composer create-project laravel/laravel backend

for backend 
nce it's open as Administrator, just copy and paste:

cmd
wsl --install -d Ubuntu-24.04