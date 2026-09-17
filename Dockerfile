# ──────────────────────────────────────────────────
# Stage 1: Dependencies (cached layer)
# ──────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy only package files first (Docker layer caching trick)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# ──────────────────────────────────────────────────
# Stage 2: Builder (install all deps + lint/test)
# ──────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source
COPY src/ ./src/

# ──────────────────────────────────────────────────
# Stage 3: Production Runner (smallest final image)
# ──────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Security: Don't run as root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001

WORKDIR /app

# Copy only prod deps from deps stage
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules

# Copy source from builder stage
COPY --from=builder --chown=nodeapp:nodejs /app/src ./src
COPY --chown=nodeapp:nodejs package*.json ./

# Use non-root user
USER nodeapp

# Expose port
EXPOSE 3000

# Health check (Docker will use this to monitor container health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Production entry point
CMD ["node", "src/app.js"]
