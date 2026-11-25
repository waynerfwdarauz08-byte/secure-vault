CREATE SCHEMA IF NOT EXISTS securevault;
REVOKE ALL ON SCHEMA securevault FROM PUBLIC;
CREATE TABLE securevault.users (
 id uuid PRIMARY KEY, name varchar(100) NOT NULL, email varchar(254) NOT NULL UNIQUE CHECK(email=lower(trim(email))), "passwordHash" text NOT NULL,
 role varchar(20) NOT NULL DEFAULT 'usuario' CHECK(role IN ('usuario','administrador')), "isActive" boolean NOT NULL DEFAULT true,
 "sensitivePhoneEncrypted" jsonb, "authVersion" integer NOT NULL DEFAULT 0,
 "createdAt" timestamptz NOT NULL, "updatedAt" timestamptz NOT NULL);
CREATE TABLE securevault.notes (id uuid PRIMARY KEY, "ownerId" uuid NOT NULL REFERENCES securevault.users(id) ON DELETE CASCADE, "encryptedPayload" jsonb NOT NULL,
 "createdAt" timestamptz NOT NULL,"updatedAt" timestamptz NOT NULL);
CREATE INDEX notes_owner ON securevault.notes("ownerId");
CREATE TABLE securevault.sessions(id varchar(64) PRIMARY KEY,"userId" uuid REFERENCES securevault.users(id) ON DELETE CASCADE,"authVersion" integer,csrf varchar(64) NOT NULL,
 "expiresAt" timestamptz NOT NULL,"absoluteExpiresAt" timestamptz NOT NULL,"createdAt" timestamptz NOT NULL,"updatedAt" timestamptz NOT NULL);
CREATE INDEX sessions_user ON securevault.sessions("userId");CREATE INDEX sessions_expiry ON securevault.sessions("expiresAt");
CREATE TABLE securevault.password_reset_tokens(id uuid PRIMARY KEY,"userId" uuid NOT NULL REFERENCES securevault.users(id) ON DELETE CASCADE,"tokenHash" varchar(64) NOT NULL UNIQUE,
 "expiresAt" timestamptz NOT NULL,"usedAt" timestamptz,"createdAt" timestamptz NOT NULL);
CREATE INDEX resets_user ON securevault.password_reset_tokens("userId");
CREATE TABLE securevault.security_events(id uuid PRIMARY KEY,"actorId" uuid REFERENCES securevault.users(id) ON DELETE SET NULL,"eventType" varchar(80) NOT NULL,outcome varchar(20) NOT NULL,
 "targetType" varchar(40),"targetId" uuid,"requestId" uuid,"createdAt" timestamptz NOT NULL);
CREATE INDEX events_date ON securevault.security_events("createdAt");CREATE INDEX events_type ON securevault.security_events("eventType",outcome);
CREATE TABLE securevault.auth_attempts(key varchar(64) PRIMARY KEY,failures integer NOT NULL DEFAULT 0,"blockedUntil" timestamptz,"windowStart" timestamptz NOT NULL,
 "createdAt" timestamptz NOT NULL,"updatedAt" timestamptz NOT NULL);
