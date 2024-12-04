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

# Copy modified nginx.conf that uses /tmp for pid and other files
COPY <<EOF /etc/nginx/nginx.conf
pid /tmp/nginx.pid;
worker_processes auto;
error_log /dev/stdout info;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    access_log    /dev/stdout;

    client_body_temp_path /tmp/client_temp;
    proxy_temp_path       /tmp/proxy_temp;
    fastcgi_temp_path    /tmp/fastcgi_temp;
    uwsgi_temp_path      /tmp/uwsgi_temp;
    scgi_temp_path       /tmp/scgi_temp;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create startup script
COPY <<EOF /docker-entrypoint.sh
#!/bin/sh
mkdir -p /tmp/client_temp \
         /tmp/proxy_temp \
         /tmp/fastcgi_temp \
         /tmp/uwsgi_temp \
         /tmp/scgi_temp
chmod 755 /tmp/*_temp
exec nginx -g 'daemon off;'
EOF

RUN chmod +x /docker-entrypoint.sh

# Switch to user 10001
USER 10001

# Expose port 8080 (Choreo requirement)
EXPOSE 8080

# Start nginx with our custom entrypoint
CMD ["/docker-entrypoint.sh"]