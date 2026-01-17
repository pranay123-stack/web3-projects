# Backend Dockerfile for Pump.fun Clone
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./

# Install dependencies based on lockfile
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile --production=false; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript if tsconfig exists
RUN \
  if [ -f tsconfig.json ]; then \
    npm run build || echo "No build script, skipping..."; \
  fi

# Prune dev dependencies
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile --production; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm prune --prod; \
  elif [ -f package-lock.json ]; then npm ci --only=production; \
  else npm prune --production; \
  fi

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

# Install production utilities
RUN apk add --no-cache wget curl dumb-init

# Copy built application
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/package.json ./package.json

# Copy source if no build step (JavaScript)
COPY --from=builder --chown=backend:nodejs /app/src ./src

# Create logs directory
RUN mkdir -p /app/logs && chown -R backend:nodejs /app/logs

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
