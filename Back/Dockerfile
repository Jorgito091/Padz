FROM node:22-bullseye AS builder
WORKDIR /app

# Install dependencies (using lock file for reproducibility)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files
COPY . .

# Generate Prisma client (required for runtime)
RUN npx prisma generate

# Build TypeScript (if any)
RUN npm run build || echo "No build script defined"

# Runtime image
FROM node:22-bullseye
WORKDIR /app

# Copy only production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Expose port (adjust if needed)
EXPOSE 4000

# Start the server
ENTRYPOINT ["./entrypoint.sh"]
