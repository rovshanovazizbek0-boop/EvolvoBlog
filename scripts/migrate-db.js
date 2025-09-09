#!/usr/bin/env node

/**
 * Database Migration Script for Render.com Deployment
 * 
 * This script ensures all necessary tables are created on Render PostgreSQL
 * and runs any required migrations using Drizzle Kit.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration for Render deployment...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('📊 DATABASE_URL is configured');
    
    // Run drizzle-kit push to create/update tables
    console.log('📝 Running database schema migration...');
    execSync('npx drizzle-kit push', {
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    
    console.log('✅ Database migration completed successfully!');
    console.log('🎯 All tables are now ready for production use');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    process.exit(1);
  }
}

// Only run if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}