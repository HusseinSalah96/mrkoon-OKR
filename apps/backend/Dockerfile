FROM oven/bun:1-alpine AS base
WORKDIR /usr/src/app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy root workspace configs
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /usr/src/app/apps/backend
RUN bunx prisma generate

# Build
RUN bun run build

# Start
# We override the start:prod script command in CMD or rely on package.json change
CMD ["bun", "run", "start:prod"]
