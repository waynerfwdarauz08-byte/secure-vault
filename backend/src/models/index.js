import { DataTypes as D } from "sequelize";
export function models(db) {
  const id = { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 };
  const User = db.define(
    "User",
    {
      id,
      name: { type: D.STRING(100), allowNull: false },
      email: { type: D.STRING(254), unique: true, allowNull: false },
      passwordHash: { type: D.TEXT, allowNull: false },
      role: {
        type: D.ENUM("usuario", "administrador"),
        defaultValue: "usuario",
        allowNull: false,
      },
      isActive: { type: D.BOOLEAN, defaultValue: true, allowNull: false },
      sensitivePhoneEncrypted: D.JSONB,
      authVersion: { type: D.INTEGER, defaultValue: 0, allowNull: false },
    },
    { tableName: "users" },
  );
  const Note = db.define(
    "Note",
    {
      id,
      ownerId: { type: D.UUID, allowNull: false },
      encryptedPayload: { type: D.JSONB, allowNull: false },
    },
    { tableName: "notes" },
  );
  const Session = db.define(
    "Session",
    {
      id: { type: D.STRING(64), primaryKey: true },
      userId: D.UUID,
      authVersion: D.INTEGER,
      csrf: { type: D.STRING(64), allowNull: false },
      expiresAt: { type: D.DATE, allowNull: false },
      absoluteExpiresAt: { type: D.DATE, allowNull: false },
    },
    { tableName: "sessions" },
  );
  const Reset = db.define(
    "PasswordResetToken",
    {
      id,
      userId: { type: D.UUID, allowNull: false },
      tokenHash: { type: D.STRING(64), unique: true, allowNull: false },
      expiresAt: { type: D.DATE, allowNull: false },
      usedAt: D.DATE,
    },
    { tableName: "password_reset_tokens", updatedAt: false },
  );
  const Event = db.define(
    "SecurityEvent",
    {
      id,
      actorId: D.UUID,
      eventType: { type: D.STRING(80), allowNull: false },
      outcome: { type: D.STRING(20), allowNull: false },
      targetType: D.STRING(40),
      targetId: D.UUID,
      requestId: D.UUID,
    },
    { tableName: "security_events", updatedAt: false },
  );
  const Attempt = db.define(
    "AuthAttempt",
    {
      key: { type: D.STRING(64), primaryKey: true },
      failures: { type: D.INTEGER, defaultValue: 0 },
      blockedUntil: D.DATE,
      windowStart: { type: D.DATE, allowNull: false },
    },
    { tableName: "auth_attempts" },
  );
  User.hasMany(Note, { foreignKey: "ownerId", onDelete: "CASCADE" });
  Note.belongsTo(User, { foreignKey: "ownerId" });
  User.hasMany(Session, { foreignKey: "userId", onDelete: "CASCADE" });
  User.hasMany(Reset, { foreignKey: "userId", onDelete: "CASCADE" });
  Event.belongsTo(User, { foreignKey: "actorId", onDelete: "SET NULL" });
  return { User, Note, Session, Reset, Event, Attempt };
}
