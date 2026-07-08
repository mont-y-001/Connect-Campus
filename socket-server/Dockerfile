FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace package json if needed, or just install locally
# For this monorepo, we'll copy the socket-server files
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Note: In production, the Prisma Client is required. Ensure that web workspace 
# node_modules are properly hoisted or accessible, or regenerate Prisma here.
# Since socket-server relies on the web/node_modules/@prisma/client, it must be included.

EXPOSE 4000

CMD ["node", "dist/index.js"]
