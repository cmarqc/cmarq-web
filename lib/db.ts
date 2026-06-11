import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null
let schemaReady: Promise<unknown> | null = null
let warnedNotConfigured = false

/**
 * True when database credentials are present. Routes short-circuit to 503
 * when they're not (e.g. local dev without MySQL) instead of attempting a
 * connection that fails with a noisy ECONNREFUSED stack trace.
 */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
}

export function warnDbNotConfigured(): void {
  if (warnedNotConfigured) return
  warnedNotConfigured = true
  console.warn(
    '[stats] DB_HOST/DB_USER/DB_NAME not set — likes/views API disabled (see .env.example)',
  )
}

/** One-line summary of a mysql2 error, instead of a multi-screen stack dump. */
export function describeDbError(err: unknown): string {
  if (err instanceof AggregateError && err.errors.length > 0) err = err.errors[0]
  if (err && typeof err === 'object' && 'code' in err) {
    const { code, message } = err as { code: string; message?: string }
    return message ? `${code}: ${message}` : code
  }
  return err instanceof Error ? err.message : String(err)
}

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      maxIdle: 5,
      enableKeepAlive: true,
    })
  }
  return pool
}

/**
 * Returns the connection pool, creating the photo_stats table on first use
 * so a fresh database (e.g. a new Hostinger MySQL instance) works without
 * running migrations by hand. See db/schema.sql for the canonical schema.
 */
export async function db(): Promise<mysql.Pool> {
  const p = getPool()
  if (!schemaReady) {
    schemaReady = p
      .query(
        `CREATE TABLE IF NOT EXISTS photo_stats (
          photo_id VARCHAR(64) NOT NULL PRIMARY KEY,
          views INT UNSIGNED NOT NULL DEFAULT 0,
          likes INT UNSIGNED NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
      )
      .catch((err) => {
        schemaReady = null
        throw err
      })
  }
  await schemaReady
  return p
}
