import { createPool } from '@vercel/postgres';

// The connection string is automatically read from the environment variables
// provided by Vercel when you link the project to a Vercel Postgres database.
const db = createPool();

export default db;
