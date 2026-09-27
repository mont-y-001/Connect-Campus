import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const explicitDatabaseUrl = process.env.DATABASE_URL;
dotenv.config();

if (process.env.NODE_ENV !== 'production' && !explicitDatabaseUrl) {
  const webEnvPath = resolve(__dirname, '../../../web/.env');
  if (existsSync(webEnvPath)) {
    const webEnv = dotenv.parse(readFileSync(webEnvPath));
    if (webEnv.DATABASE_URL) {
      process.env.DATABASE_URL = webEnv.DATABASE_URL;
    }
  }
}

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (global.prisma) {
  prisma = global.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  prisma = new PrismaClient({ adapter });
  
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
  }
}

export { prisma };
