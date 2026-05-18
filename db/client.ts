import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { env } from "@/lib/env";
import * as schema from "./schema";

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __bottomlineDb: DbClient | undefined;
  var __bottomlineSqlite: Database.Database | undefined;
}

function createDb(): { db: DbClient; sqlite: Database.Database } {
  const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

let _db: DbClient;
let _sqlite: Database.Database;

if (globalThis.__bottomlineDb && globalThis.__bottomlineSqlite) {
  _db = globalThis.__bottomlineDb;
  _sqlite = globalThis.__bottomlineSqlite;
} else {
  const created = createDb();
  _db = created.db;
  _sqlite = created.sqlite;
  globalThis.__bottomlineDb = _db;
  globalThis.__bottomlineSqlite = _sqlite;
}

export const db = _db;
export const sqlite = _sqlite;
export { schema };
