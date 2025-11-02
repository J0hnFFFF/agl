/**
 * SQLite Database Setup
 */

import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function initDatabase() {
  const dbPath = path.join(process.cwd(), 'agl.db');

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    -- Clients table
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      tier TEXT DEFAULT 'FREE' CHECK(tier IN ('FREE', 'STANDARD', 'PRO', 'ENTERPRISE')),
      quota_per_month INTEGER DEFAULT 10000,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- Games table
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      config TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- Players table
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL,
      character_persona TEXT DEFAULT 'cheerful',
      preferences TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(game_id, external_id)
    );

    -- Memories table
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      emotion TEXT,
      importance REAL DEFAULT 0.5,
      context TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- Game events table
    CREATE TABLE IF NOT EXISTS game_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      data TEXT NOT NULL,
      context TEXT,
      emotion TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_games_client ON games(client_id);
    CREATE INDEX IF NOT EXISTS idx_players_game ON players(game_id);
    CREATE INDEX IF NOT EXISTS idx_memories_player ON memories(player_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_player ON game_events(player_id, created_at DESC);
  `);

  console.log('✅ Database tables created');

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
