FROM php:8.4-cli-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    zip \
    unzip \
    curl \
    libpng-dev \
    libxml2-dev \
    oniguruma-dev \
    openssl-dev \
    && docker-php-ext-install pdo pdo_mysql gd xml bcmath mbstring

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy all backend files
COPY . .

# Install PHP dependencies (no dev)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions for Laravel storage and cache
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 8000

# Start Laravel server on Render's dynamic PORT
CMD php artisan config:clear && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
