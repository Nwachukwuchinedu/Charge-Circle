FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json prisma.config.ts ./
COPY prisma/ prisma/
RUN npx prisma generate
COPY src/ src/
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist/ dist/
COPY --from=builder /app/node_modules/ node_modules/
COPY --from=builder /app/prisma/ prisma/
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./
EXPOSE 4000
CMD npx prisma migrate deploy && node dist/app.js
