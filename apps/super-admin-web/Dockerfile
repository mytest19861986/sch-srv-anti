FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS builder
WORKDIR /app

COPY package.json ./
COPY packages ./packages
COPY apps/super-admin-web ./apps/super-admin-web

WORKDIR /app/apps/super-admin-web
RUN npm install --legacy-peer-deps
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM base AS runner
WORKDIR /app/apps/super-admin-web
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=3002
ENV PATH="/app/node_modules/.bin:/app/apps/super-admin-web/node_modules/.bin:$PATH"

COPY --from=builder /app /app

EXPOSE 3002
CMD ["next", "start", "-H", "0.0.0.0", "-p", "3002"]
