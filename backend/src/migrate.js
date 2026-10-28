import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

// Creates the tables and inserts the starter data by running db/init.sql.
// Run it with:  npm run db:init
export async function runInit() {
  const file = fileURLToPath(new URL('../db/init.sql', import.meta.url))
  const sql = await readFile(file, 'utf8')
  await pool.query(sql)
}

// Only run when called directly from the command line (not when imported).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runInit()
    .then(() => console.log('Database ready: tables created and starter data added.'))
    .catch((err) => {
      console.error('Database setup failed:', err.message)
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
