import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { defineCustomElements } from 'jeep-sqlite/loader';

const DATABASE_NAME = 'cpns_nasional';
const sqlite = new SQLiteConnection(CapacitorSQLite);
let connectionPromise;

async function initializeWebStore() {
  if (Capacitor.getPlatform() !== 'web') {
    return;
  }

  defineCustomElements(window);

  if (!document.querySelector('jeep-sqlite')) {
    const jeepSqlite = document.createElement('jeep-sqlite');
    document.body.appendChild(jeepSqlite);
    await customElements.whenDefined('jeep-sqlite');
  }

  await CapacitorSQLite.initWebStore();
}

async function initializeDatabase() {
  await initializeWebStore();
  const consistency = await sqlite.checkConnectionsConsistency();
  const connection = await sqlite.isConnection(DATABASE_NAME, false);

  if (!consistency.result || !connection.result) {
    await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
  }

  const db = await sqlite.retrieveConnection(DATABASE_NAME, false);
  await db.open();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      category_name TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      thumbnail TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_materials_category_order
      ON materials(category, sort_order, title);

    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS practice_packages (
      id INTEGER PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      passing_score REAL NOT NULL,
      max_score REAL NOT NULL,
      question_count INTEGER NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_practice_packages_category
      ON practice_packages(category, title);

    CREATE TABLE IF NOT EXISTS practice_attempts (
      uuid TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      package_slug TEXT NOT NULL,
      category TEXT NOT NULL,
      package_title TEXT NOT NULL,
      score REAL NOT NULL,
      max_score REAL NOT NULL,
      passing_score REAL NOT NULL,
      correct_count INTEGER NOT NULL,
      wrong_count INTEGER NOT NULL,
      unanswered_count INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      result_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_date
      ON practice_attempts(user_id, completed_at DESC);
  `);

  return db;
}

export function getDatabase() {
  if (!connectionPromise) {
    connectionPromise = initializeDatabase().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  return connectionPromise;
}

export { DATABASE_NAME };
