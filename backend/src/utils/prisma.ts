import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaNeon({ connectionString });

/**
 * Singleton Prisma client configured with the Neon serverless adapter.
 *
 * Uses WebSockets for database connections (required by Neon's serverless
 * Postgres) and reads the connection string from `DATABASE_URL` in `.env`.
 */
export const prisma = new PrismaClient({ adapter });
