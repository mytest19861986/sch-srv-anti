FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS builder
WORKDIR /app

COPY packages ./packages
COPY apps/super-admin-web ./apps/super-admin-web

WORKDIR /app/apps/super-admin-web
RUN npm install --legacy-peer-deps || true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build || true

FROM base AS runner
WORKDIR /app/apps/super-admin-web
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=3002

COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/apps/super-admin-web /app/apps/super-admin-web

EXPOSE 3002
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3002"]
