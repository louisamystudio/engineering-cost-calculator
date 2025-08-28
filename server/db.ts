import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using Neon (contains neon.tech) or local PostgreSQL
const isNeonDb = process.env.DATABASE_URL.includes('neon.tech');

let db: any;
let pool: any;

if (isNeonDb) {
  // Use Neon serverless driver for cloud deployment
  const { Pool: NeonPool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle: neonDrizzle } = await import('drizzle-orm/neon-serverless');
  const ws = await import('ws');
  
  neonConfig.webSocketConstructor = ws.default;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = neonDrizzle({ client: pool, schema });
} else {
  // Use standard pg driver for local PostgreSQL
  const pg = await import('pg');
  const { drizzle: pgDrizzle } = await import('drizzle-orm/node-postgres');
  
  const { Pool: PgPool } = pg.default;
  pool = new PgPool({ 
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  db = pgDrizzle(pool, { schema });
}

export { db, pool };