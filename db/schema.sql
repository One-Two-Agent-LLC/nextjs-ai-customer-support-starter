-- Only starter-owned schema. Never run against a production customer database.
CREATE SCHEMA IF NOT EXISTS ota_starter;
CREATE TABLE IF NOT EXISTS ota_starter.schema_version (version integer PRIMARY KEY);
INSERT INTO ota_starter.schema_version VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS ota_starter.visitors (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, disabled_at timestamptz
);
CREATE TABLE IF NOT EXISTS ota_starter.workspaces (
 id uuid PRIMARY KEY, visitor_id uuid NOT NULL REFERENCES ota_starter.visitors(id) ON DELETE CASCADE,
 slot text NOT NULL CHECK(slot IN ('primary','sandbox')), name text NOT NULL, plan text NOT NULL,
 UNIQUE(visitor_id,slot)
);
CREATE TABLE IF NOT EXISTS ota_starter.memberships (
 user_id uuid NOT NULL REFERENCES ota_starter.visitors(id) ON DELETE CASCADE,
 workspace_id uuid NOT NULL REFERENCES ota_starter.workspaces(id) ON DELETE CASCADE,
 role text NOT NULL, PRIMARY KEY(user_id,workspace_id)
);
CREATE TABLE IF NOT EXISTS ota_starter.sessions (
 id uuid PRIMARY KEY, token_hash text NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES ota_starter.visitors(id) ON DELETE CASCADE,
 workspace_id uuid NOT NULL REFERENCES ota_starter.workspaces(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS ota_starter.usage (
 workspace_id uuid PRIMARY KEY REFERENCES ota_starter.workspaces(id) ON DELETE CASCADE,
 used integer NOT NULL CHECK(used >= 0), quota integer NOT NULL CHECK(quota >= used)
);
CREATE TABLE IF NOT EXISTS ota_starter.projects (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ota_starter.workspaces(id) ON DELETE CASCADE,
 name text NOT NULL, status text NOT NULL, open_tasks integer NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(), description text NOT NULL, internal_note text NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON ota_starter.sessions(user_id);
CREATE INDEX IF NOT EXISTS projects_workspace_idx ON ota_starter.projects(workspace_id);
