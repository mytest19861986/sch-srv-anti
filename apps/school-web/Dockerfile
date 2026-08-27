FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS builder
WORKDIR /app

COPY packages ./packages
COPY apps/school-web ./apps/school-web

WORKDIR /app/apps/school-web
RUN npm install --legacy-peer-deps || true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build || true

FROM base AS runner
WORKDIR /app/apps/school-web
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/apps/school-web /app/apps/school-web

EXPOSE 3001
CMD ["npm", "run", "start", "--", "-p", "3001"]
