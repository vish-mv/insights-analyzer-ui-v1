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

# Create startup script
RUN echo $'#!/bin/sh\n\
mkdir -p /tmp/client_temp \
         /tmp/proxy_temp \
         /tmp/fastcgi_temp \
         /tmp/uwsgi_temp \
         /tmp/scgi_temp \
         /tmp/nginx\n\
chmod 755 /tmp/*_temp /tmp/nginx\n\
nginx -g "daemon off;"' > /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Copy modified nginx.conf
RUN echo $'\
pid /tmp/nginx/nginx.pid;\n\
worker_processes auto;\n\
error_log /dev/stdout info;\n\
\n\
events {\n\
    worker_connections 1024;\n\
}\n\
\n\
http {\n\
    include       /etc/nginx/mime.types;\n\
    default_type  application/octet-stream;\n\
    access_log    /dev/stdout;\n\
\n\
    client_body_temp_path /tmp/client_temp;\n\
    proxy_temp_path       /tmp/proxy_temp;\n\
    fastcgi_temp_path    /tmp/fastcgi_temp;\n\
    uwsgi_temp_path      /tmp/uwsgi_temp;\n\
    scgi_temp_path       /tmp/scgi_temp;\n\
\n\
    include /etc/nginx/conf.d/*.conf;\n\
}' > /etc/nginx/nginx.conf

# Switch to user 10001
USER 10001

# Expose port 8080 (Choreo requirement)
EXPOSE 8080

# Start nginx with our custom entrypoint
CMD ["/docker-entrypoint.sh"]