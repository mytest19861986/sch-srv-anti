FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
