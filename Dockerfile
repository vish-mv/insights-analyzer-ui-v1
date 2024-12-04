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

# Set permissions for user 10001
RUN chown -R 10001:0 /app && \
    chmod -R 755 /app && \
    chown -R 10001:0 /var/cache/nginx && \
    chown -R 10001:0 /var/log/nginx && \
    chown -R 10001:0 /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R 10001:0 /var/run/nginx.pid && \
    # Fix common nginx permission issues
    chmod -R 755 /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    # Create nginx temp directories and set permissions
    mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    chown -R 10001:0 /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx

# Switch to user 10001
USER 10001

# Expose port 8080 (Choreo requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]