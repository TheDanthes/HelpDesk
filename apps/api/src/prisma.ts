import { PrismaClient } from "@prisma/client";
import type { Role, User } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma: PrismaClient = new PrismaClient({
  adapter,
});
export type { Role, User };
