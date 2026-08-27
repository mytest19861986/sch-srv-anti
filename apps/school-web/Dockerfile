FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS builder
WORKDIR /app

COPY package.json ./
COPY packages ./packages
COPY apps/school-web ./apps/school-web

WORKDIR /app/apps/school-web
RUN npm install --legacy-peer-deps
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=3001
ENV PATH="/app/node_modules/.bin:/app/apps/school-web/node_modules/.bin:$PATH"

COPY --from=builder /app /app

WORKDIR /app/apps/school-web
EXPOSE 3001
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3001"]
