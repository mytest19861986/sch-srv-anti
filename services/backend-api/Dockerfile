FROM oven/bun:1-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl

COPY package.json bun.lock* tsconfig.json ./
RUN bun install --frozen-lockfile || bun install

COPY . .

EXPOSE 3000
CMD ["bun", "run", "src/server.ts"]
