# Nginx Dockerfile for Pump.fun Clone
# Production-ready reverse proxy image

FROM nginx:1.25-alpine

# Install useful utilities
RUN apk add --no-cache \
    curl \
    openssl \
    tzdata

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create SSL directory for certificates
RUN mkdir -p /etc/nginx/ssl

# Create log directory with proper permissions
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# Create cache directories
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

# Validate nginx configuration
RUN nginx -t

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/nginx-health || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
