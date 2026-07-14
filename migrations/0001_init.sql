-- NodeTunnel D1 schema.
--
-- This replaces the former PocketBase database (previously the separate `db`
-- repo). PocketBase's built-in `users` auth collection and the `apps`
-- collection are reproduced here; the `rooms` collection was deleted upstream
-- and is intentionally omitted. Apply with:
--   wrangler d1 migrations apply nodetunnel            (remote)
--   wrangler d1 migrations apply nodetunnel --local    (local dev)

CREATE TABLE users (
	id            TEXT PRIMARY KEY,
	email         TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	created       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	updated       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE apps (
	id          TEXT PRIMARY KEY,
	name        TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	dev         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	updated     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_apps_dev ON apps(dev);

-- Server-side sessions; the session id is stored in an httpOnly cookie.
CREATE TABLE sessions (
	id      TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires INTEGER NOT NULL -- unix epoch milliseconds
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
