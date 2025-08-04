import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { serverConfig } from '~/config/server-config';

const pool = new Pool({
  connectionString: serverConfig.db.url,
});

export const db = drizzle(pool, { schema });