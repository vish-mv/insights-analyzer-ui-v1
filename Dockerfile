# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
WORKDIR /app

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Create required directories with correct permissions
RUN mkdir -p /tmp/nginx/cache && \
    mkdir -p /tmp/nginx/run && \
    # Set permissions for user 10001
    chown -R 10001:0 /app && \
    chmod -R 755 /app && \
    chown -R 10001:0 /var/cache/nginx && \
    chown -R 10001:0 /var/log/nginx && \
    chown -R 10001:0 /etc/nginx/conf.d && \
    chown -R 10001:0 /tmp/nginx && \
    # Fix common nginx permission issues
    chmod -R 755 /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /tmp/nginx && \
    # Create nginx temp directories and set permissions
    mkdir -p /tmp/nginx/client_temp && \
    mkdir -p /tmp/nginx/proxy_temp && \
    mkdir -p /tmp/nginx/fastcgi_temp && \
    mkdir -p /tmp/nginx/uwsgi_temp && \
    mkdir -p /tmp/nginx/scgi_temp && \
    chown -R 10001:0 /tmp/nginx && \
    chmod -R 755 /tmp/nginx

# Copy modified nginx.conf that uses /tmp for pid and other files
COPY <<EOF /etc/nginx/nginx.conf
pid /tmp/nginx/nginx.pid;
worker_processes auto;
error_log /dev/stdout info;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    access_log    /dev/stdout;

    client_body_temp_path /tmp/nginx/client_temp;
    proxy_temp_path       /tmp/nginx/proxy_temp;
    fastcgi_temp_path    /tmp/nginx/fastcgi_temp;
    uwsgi_temp_path      /tmp/nginx/uwsgi_temp;
    scgi_temp_path       /tmp/nginx/scgi_temp;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# Switch to user 10001
USER 10001

# Expose port 8080 (Choreo requirement)
EXPOSE 8080

# Start nginx with custom config
CMD ["nginx", "-g", "daemon off;"]