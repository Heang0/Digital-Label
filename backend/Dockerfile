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

# Install PHP dependencies (production only)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions for Laravel storage and cache
RUN chmod -R 775 storage bootstrap/cache

# Make startup script executable
RUN chmod +x /app/start.sh

EXPOSE 8000

# Run startup script (generates .env from env vars, then starts server)
CMD ["/app/start.sh"]
