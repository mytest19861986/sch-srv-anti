FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS builder
WORKDIR /app

COPY package.json ./
COPY packages ./packages
COPY apps/school-web ./apps/school-web

WORKDIR /app/apps/school-web
RUN npm install ../../packages/i18n ../../packages/auth ../../packages/api-client ../../packages/ui --legacy-peer-deps || true
RUN npm install --legacy-peer-deps
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM base AS runner
WORKDIR /app/apps/school-web
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/apps/school-web /app/apps/school-web

EXPOSE 3001
CMD ["npm", "run", "start"]
