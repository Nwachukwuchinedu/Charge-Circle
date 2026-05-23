import dotenv from 'dotenv';
import path from 'path';

// Force load the .env file explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Use process.env, or fallback directly to the provided pooler URL to guarantee connection
const connectionString = process.env.DATABASE_URL

// Pass the PoolConfig directly to PrismaNeon instead of a Pool instance!
const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
