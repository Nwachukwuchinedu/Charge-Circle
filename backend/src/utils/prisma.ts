import dotenv from 'dotenv';
import path from 'path';

// Force load the .env file explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
