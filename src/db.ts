import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type Db = Database.Database;

const DEFAULT_DB_PATH = 'data/openspec-builder.sqlite';

export function openDatabase(path = process.env.DATABASE_URL ?? DEFAULT_DB_PATH): Db {
  const dbPath = path.startsWith('file:') ? path.slice('file:'.length) : path;
  mkdirSync(dirname(resolve(dbPath)), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  db.exec(schema);
  const columns = db.prepare('PRAGMA table_info(projects)').all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === 'details_json')) {
    db.exec("ALTER TABLE projects ADD COLUMN details_json TEXT NOT NULL DEFAULT '{}'");
  }

  return db;
}
