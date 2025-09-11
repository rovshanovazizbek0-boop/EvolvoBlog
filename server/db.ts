import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  console.error("Available environment variables:", Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES')));
  console.error("NODE_ENV:", process.env.NODE_ENV);
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log database connection info for debugging
console.log("Connecting to database...");
console.log("DATABASE_URL is set:", !!process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Enhanced pool configuration for production stability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: process.env.NODE_ENV === 'production' ? 20 : 10,
  min: process.env.NODE_ENV === 'production' ? 2 : 1,
});

// Database connection error handling
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});

pool.on('connect', () => {
  console.log('🔗 New database connection established');
});

// Connection retry logic
async function connectWithRetry(retries = 5): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Database connection successful');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error instanceof Error ? error.message : String(error));
      
      if (i === retries - 1) {
        console.error('🚨 Failed to connect to database after all retries');
        throw new Error(`Database connection failed after ${retries} attempts`);
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Health check function for database
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string; latency?: number }> {
  const start = Date.now();
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : String(error),
      latency: Date.now() - start
    };
  }
}

// Initialize connection with retry
connectWithRetry().catch((error) => {
  console.error('🚨 Critical: Failed to establish database connection:', error);
  process.exit(1);
});

export const db = drizzle(pool, { schema });