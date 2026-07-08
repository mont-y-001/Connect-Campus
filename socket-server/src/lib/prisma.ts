import 'dotenv/config';
import { PrismaClient } from '../../../web/node_modules/@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

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
