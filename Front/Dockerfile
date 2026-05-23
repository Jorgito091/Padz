# Use a lightweight node image for the build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies (including dev for build)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Vite app (produces ./dist)
RUN npm run build

# Production image
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default HTTP port
EXPOSE 80

# Start nginx (default command)
CMD ["nginx", "-g", "daemon off;"]
