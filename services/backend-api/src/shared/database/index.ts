import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

export interface DatabaseAdapter {
  query: (text: string, params?: any[]) => Promise<any>;
  transaction: <T>(callback: (tx: any) => Promise<T>) => Promise<T>;
}

export function createDatabaseClient(connectionString?: string) {
  if (connectionString) {
    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });
    return { db, pool };
  }
  return null;
}
