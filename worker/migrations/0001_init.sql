-- Migration number: 0001 	 2026-07-02T00:00:00.000Z

-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'guest' or 'authenticated'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Characters Table
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  scenario TEXT,
  first_message TEXT,
  appearance TEXT,
  speaking_style TEXT,
  tags_json TEXT, -- Stored as JSON string
  example_dialogues_json TEXT, -- Stored as JSON string
  avatar_url TEXT,
  metadata_json TEXT, -- Any additional metadata
  deleted_at DATETIME, -- Soft delete
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Model Profiles Table
CREATE TABLE model_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  base_url TEXT,
  api_key_encrypted TEXT, -- Nullable or encrypted string
  model_name TEXT NOT NULL,
  temperature REAL,
  max_tokens INTEGER,
  supports_streaming INTEGER DEFAULT 1, -- Boolean (0 or 1)
  supports_json_mode INTEGER DEFAULT 0, -- Boolean (0 or 1)
  is_default INTEGER DEFAULT 0, -- Boolean (0 or 1)
  deleted_at DATETIME, -- Soft delete
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for querying characters and model profiles by user
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_model_profiles_user_id ON model_profiles(user_id);
