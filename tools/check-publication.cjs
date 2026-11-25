// Revisión local: nunca imprime valores de .env ni credenciales detectadas.
const fs = require("node:fs");
const cp = require("node:child_process");
const path = require("node:path");
const { parseEnv } = require("node:util");
const root = path.resolve(__dirname, "..");
const git = ["-c", `safe.directory=${root.replaceAll("\\", "/")}`];
const files = [
  ...new Set(
    cp
      .execFileSync(
        "git",
        [
          ...git,
          "ls-files",
          "--cached",
          "--others",
          "--exclude-standard",
          "-z",
        ],
        { cwd: root, encoding: "utf8" },
      )
      .split("\0")
      .filter(Boolean),
  ),
];
const environments = [];
try {
  for (const name of ["backend/.env", "backend/.env.production.local"]) {
    const envPath = path.join(root, name);
    if (fs.existsSync(envPath))
      environments.push(parseEnv(fs.readFileSync(envPath, "utf8")));
  }
} catch {
  console.error(
    "No se pudo revisar la configuración local. No se imprime contenido.",
  );
  process.exit(1);
}
const secrets = environments.flatMap((env) =>
  ["DATABASE_URL", "SESSION_SECRET", "SMTP_PASS", "AI_API_KEY", "BREVO_API_KEY"]
    .map((key) => env[key])
    .filter(
      (value) =>
        value && value.length >= 16 && !value.includes("APP_USER:PASSWORD"),
    ),
);
try {
  for (const env of environments) {
    for (const value of Object.values(
      JSON.parse(env.DATA_ENCRYPTION_KEYS || "{}"),
    )) {
      if (
        typeof value === "string" &&
        value.length >= 32 &&
        !value.includes("REPLACE")
      )
        secrets.push(value);
    }
  }
} catch {
  console.error(
    "No se pudo validar la estructura de llaves localmente. No se imprime contenido.",
  );
  process.exit(1);
}
const findings = [];
for (const file of files) {
  if (
    /(^|\/)\.env(?:\.|$)/.test(file) &&
    !file.endsWith("/.env.example") &&
    file !== ".env.example"
  ) {
    findings.push({ file, rule: "archivo de entorno incluido" });
    continue;
  }
  const content = fs.readFileSync(path.join(root, file), "utf8");
  if (secrets.some((value) => content.includes(value)))
    findings.push({ file, rule: "coincidencia con secreto local" });
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}|\bxkeysib-[A-Za-z0-9_-]{30,}/.test(
      content,
    )
  ) {
    findings.push({ file, rule: "patrón de credencial" });
  }
}
console.log(JSON.stringify({ filesReviewed: files.length, findings }, null, 2));
if (findings.length) process.exitCode = 1;
