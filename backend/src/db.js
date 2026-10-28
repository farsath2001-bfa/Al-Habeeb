import pg from 'pg'

// One shared "pool" of database connections for the whole app.
// DATABASE_URL looks like: postgres://user:password@host:5432/database
// Cloud databases (Neon, Supabase...) need SSL, so set DATABASE_SSL=true for them.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 5, // free databases only allow a few connections
})

export const query = (text, params) => pool.query(text, params)
