FROM node:20-alpine AS builder

WORKDIR /app/socket-server

COPY socket-server/package.json socket-server/package-lock.json* ./
RUN npm ci

COPY socket-server/ ./
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/socket-server/package.json ./
COPY --from=builder /app/socket-server/node_modules ./node_modules
COPY --from=builder /app/socket-server/dist ./dist
COPY --from=builder /app/socket-server/prisma ./prisma
COPY --from=builder /app/socket-server/prisma.config.ts ./prisma.config.ts

EXPOSE 4000

CMD ["node", "dist/index.js"]
