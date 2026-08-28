CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_super INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'intradept',
  time_control VARCHAR(50) NOT NULL DEFAULT '10+5',
  rounds_count INTEGER NOT NULL DEFAULT 7,
  default_rating INTEGER NOT NULL DEFAULT 1200,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  admin_id INTEGER NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tournament_admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(tournament_id, admin_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(20) NOT NULL DEFAULT '',
  sex VARCHAR(10) NOT NULL DEFAULT '',
  batch VARCHAR(50) NOT NULL DEFAULT '',
  rating INTEGER NOT NULL,
  rating_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(tournament_id, name),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  number INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  UNIQUE(tournament_id, number),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pairings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL,
  board INTEGER NOT NULL,
  white_id INTEGER NULL,
  black_id INTEGER NULL,
  result VARCHAR(10) NULL,
  is_bye INTEGER NOT NULL DEFAULT 0,
  bye_for_id INTEGER NULL,
  UNIQUE(round_id, board),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (white_id) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (black_id) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (bye_for_id) REFERENCES players(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS login_limits (
  ip VARCHAR(45) PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  first_failure INTEGER NOT NULL,
  locked_until INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tournaments_admin ON tournaments(admin_id);
CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rounds_tournament ON rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_pairings_round ON pairings(round_id);

INSERT OR IGNORE INTO admins (username, password_hash, is_super, created_at) VALUES 
('admin', '$2y$12$kvym7ZWZOiuEwVUaZ29g6OdviW9aID9.cTHpHMu6yX62DzEcySVxi', 1, strftime('%s', 'now'));
