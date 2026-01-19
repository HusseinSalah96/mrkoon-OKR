FROM oven/bun:1-alpine AS builder
WORKDIR /usr/src/app

COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN bun install --frozen-lockfile

COPY . .
WORKDIR /usr/src/app/apps/frontend
RUN bun run build

FROM nginx:alpine
COPY --from=builder /usr/src/app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
