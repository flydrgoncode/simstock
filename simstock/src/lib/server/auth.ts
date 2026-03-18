import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { getDb, getUsers, setActiveUserId, type SimstockUser } from "@/lib/server/db";

export const SESSION_COOKIE_NAME = "simstock_session";
const AUTH_CODE_TTL_MINUTES = 10;
const SESSION_TTL_HOURS = 12;

type AuthCodeRow = {
  email: string;
  codeHash: string;
  expiresAt: string;
  createdAt: string;
};

type AuthSessionRow = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
};

type AuthMagicLinkRow = {
  email: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  consumedAt: string | null;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  return getUsers().find((user) => normalizeEmail(user.email) === normalized) ?? null;
}

function findSuperuser() {
  return getUsers().find((user) => user.role === "superuser") ?? null;
}

function createSessionForUser(user: SimstockUser, metadata?: { userAgent?: string | null; ipAddress?: string | null }) {
  const token = randomBytes(32).toString("hex");
  const createdAt = nowIso();
  const expiresAt = addHours(new Date(), SESSION_TTL_HOURS).toISOString();
  getDb().prepare(
    `INSERT INTO auth_sessions (id, userId, tokenHash, createdAt, expiresAt, userAgent, ipAddress)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    user.id,
    sha256(token),
    createdAt,
    expiresAt,
    metadata?.userAgent ?? null,
    metadata?.ipAddress ?? null,
  );
  setActiveUserId(user.id);
  return { token, expiresAt };
}

function insertAuthLog(input: {
  action: string;
  entityId?: string | null;
  status: "success" | "error" | "started";
  message: string;
  details?: string;
}) {
  getDb().prepare(`
    INSERT INTO activity_logs (id, category, action, entityType, entityId, status, message, details, timestamp)
    VALUES (@id, @category, @action, @entityType, @entityId, @status, @message, @details, @timestamp)
  `).run({
    id: randomUUID(),
    category: "auth",
    action: input.action,
    entityType: "user",
    entityId: input.entityId ?? null,
    status: input.status,
    message: input.message,
    details: input.details ?? null,
    timestamp: new Date().toLocaleString("pt-PT"),
  });
}

function cleanupExpiredAuthRows() {
  const db = getDb();
  const now = nowIso();
  db.prepare("DELETE FROM auth_codes WHERE expiresAt <= ?").run(now);
  db.prepare("DELETE FROM auth_sessions WHERE expiresAt <= ?").run(now);
  db.prepare("DELETE FROM auth_magic_links WHERE expiresAt <= ? OR consumedAt IS NOT NULL").run(now);
}

function getSessionByToken(token: string | null) {
  if (!token) {
    return null;
  }
  cleanupExpiredAuthRows();
  const tokenHash = sha256(token);
  const session = getDb()
    .prepare("SELECT * FROM auth_sessions WHERE tokenHash = ?")
    .get(tokenHash) as AuthSessionRow | undefined;
  if (!session) {
    return null;
  }
  const user = getUsers().find((item) => item.id === session.userId) ?? null;
  if (!user) {
    return null;
  }
  return { session, user };
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const entry = parts.find((part) => part.startsWith(`${name}=`));
  if (!entry) {
    return null;
  }
  return decodeURIComponent(entry.slice(name.length + 1));
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  };
}

export function isSuperuserShortcutEnabled() {
  return process.env.ALLOW_SUPERUSER_SHORTCUT === "true" || process.env.NODE_ENV !== "production";
}

export function issueLoginCode(email: string) {
  cleanupExpiredAuthRows();
  const user = findUserByEmail(email);
  if (!user) {
    insertAuthLog({
      action: "request_code",
      status: "error",
      message: "Pedido de codigo falhou: utilizador nao encontrado.",
      details: `email=${normalizeEmail(email)}`,
    });
    throw new Error("Nao existe utilizador registado com esse email.");
  }
  const normalizedEmail = normalizeEmail(email);
  insertAuthLog({
    action: "request_code",
    entityId: user.id,
    status: "started",
    message: "Pedido de codigo de login iniciado.",
    details: `email=${normalizedEmail}`,
  });
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  const now = new Date();
  const expiresAt = addMinutes(now, AUTH_CODE_TTL_MINUTES).toISOString();
  const db = getDb();
  db.prepare("DELETE FROM auth_codes WHERE email = ?").run(normalizedEmail);
  db.prepare(
    "INSERT INTO auth_codes (email, codeHash, expiresAt, createdAt) VALUES (?, ?, ?, ?)",
  ).run(normalizedEmail, sha256(code), expiresAt, now.toISOString());
  insertAuthLog({
    action: "request_code",
    entityId: user.id,
    status: "success",
    message: "Codigo de login gerado com sucesso.",
    details: `email=${normalizedEmail}; expiresAt=${expiresAt}`,
  });
  return {
    email: normalizedEmail,
    expiresAt,
    delivery: "local_preview",
    codePreview: code,
  };
}

async function sendMagicLinkEmail(email: string, magicLink: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Magic link email provider is not configured for production.");
    }
    return {
      delivery: "local_preview" as const,
      preview: magicLink,
    };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "SimStock login link",
      html: `<p>Use this login link to access SimStock:</p><p><a href="${magicLink}">${magicLink}</a></p>`,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const trimmedBody = errorBody.slice(0, 1000);
    throw new Error(
      `Nao foi possivel enviar o email de login. Resend status=${response.status}${trimmedBody ? ` body=${trimmedBody}` : ""}`,
    );
  }
  return {
    delivery: "email" as const,
    preview: null,
  };
}

export async function issueMagicLink(email: string) {
  cleanupExpiredAuthRows();
  const user = findUserByEmail(email);
  if (!user) {
    insertAuthLog({
      action: "request_magic_link",
      status: "error",
      message: "Pedido de magic link falhou: utilizador nao encontrado.",
      details: `email=${normalizeEmail(email)}`,
    });
    throw new Error("Nao existe utilizador registado com esse email.");
  }
  const normalizedEmail = normalizeEmail(email);
  insertAuthLog({
    action: "request_magic_link",
    entityId: user.id,
    status: "started",
    message: "Pedido de magic link iniciado.",
    details: `email=${normalizedEmail}`,
  });
  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const now = new Date();
  const expiresAt = addMinutes(now, AUTH_CODE_TTL_MINUTES).toISOString();
  const baseUrl = process.env.AUTH_BASE_URL?.trim() || "http://localhost:3010";
  const magicLink = `${baseUrl.replace(/\/$/, "")}/api/auth/token?token=${encodeURIComponent(token)}`;
  const db = getDb();
  db.prepare("DELETE FROM auth_magic_links WHERE email = ?").run(normalizedEmail);
  db.prepare(
    "INSERT INTO auth_magic_links (email, tokenHash, expiresAt, createdAt, consumedAt) VALUES (?, ?, ?, ?, NULL)",
  ).run(normalizedEmail, tokenHash, expiresAt, now.toISOString());
  let delivery;
  try {
    delivery = await sendMagicLinkEmail(normalizedEmail, magicLink);
  } catch (error) {
    insertAuthLog({
      action: "request_magic_link",
      entityId: user.id,
      status: "error",
      message: "Envio do magic link falhou.",
      details: error instanceof Error ? error.message : "Erro desconhecido no envio do magic link.",
    });
    throw error;
  }
  insertAuthLog({
    action: "request_magic_link",
    entityId: user.id,
    status: "success",
    message: "Magic link gerado com sucesso.",
    details: `email=${normalizedEmail}; delivery=${delivery.delivery}; expiresAt=${expiresAt}`,
  });
  return {
    email: normalizedEmail,
    expiresAt,
    delivery: delivery.delivery,
    magicLinkPreview: delivery.preview,
  };
}

export function verifyLoginCode(email: string, code: string, metadata?: { userAgent?: string | null; ipAddress?: string | null }) {
  cleanupExpiredAuthRows();
  const normalizedEmail = normalizeEmail(email);
  const user = findUserByEmail(normalizedEmail);
  if (!user) {
    insertAuthLog({
      action: "verify_code",
      status: "error",
      message: "Validacao de codigo falhou: utilizador nao encontrado.",
      details: `email=${normalizedEmail}`,
    });
    throw new Error("Utilizador nao encontrado.");
  }
  const codeHash = sha256(code.trim());
  const row = getDb()
    .prepare("SELECT * FROM auth_codes WHERE email = ? AND codeHash = ?")
    .get(normalizedEmail, codeHash) as AuthCodeRow | undefined;
  if (!row || new Date(row.expiresAt).getTime() <= Date.now()) {
    insertAuthLog({
      action: "verify_code",
      entityId: user.id,
      status: "error",
      message: "Validacao de codigo falhou: codigo invalido ou expirado.",
      details: `email=${normalizedEmail}`,
    });
    throw new Error("Codigo invalido ou expirado.");
  }
  const db = getDb();
  db.prepare("DELETE FROM auth_codes WHERE email = ?").run(normalizedEmail);
  const { token, expiresAt } = createSessionForUser(user, metadata);
  insertAuthLog({
    action: "verify_code",
    entityId: user.id,
    status: "success",
    message: "Login por codigo concluido com sucesso.",
    details: `email=${normalizedEmail}; expiresAt=${expiresAt}; ip=${metadata?.ipAddress ?? ""}`,
  });
  return { token, user, expiresAt };
}

export function verifyMagicLinkToken(token: string, metadata?: { userAgent?: string | null; ipAddress?: string | null }) {
  cleanupExpiredAuthRows();
  const tokenHash = sha256(token.trim());
  const row = getDb()
    .prepare("SELECT * FROM auth_magic_links WHERE tokenHash = ?")
    .get(tokenHash) as AuthMagicLinkRow | undefined;
  if (!row || row.consumedAt || new Date(row.expiresAt).getTime() <= Date.now()) {
    insertAuthLog({
      action: "verify_magic_link",
      status: "error",
      message: "Validacao de magic link falhou: token invalido ou expirado.",
    });
    throw new Error("Token invalido ou expirado.");
  }
  const user = findUserByEmail(row.email);
  if (!user) {
    insertAuthLog({
      action: "verify_magic_link",
      status: "error",
      message: "Validacao de magic link falhou: utilizador nao encontrado.",
      details: `email=${normalizeEmail(row.email)}`,
    });
    throw new Error("Utilizador nao encontrado.");
  }
  getDb().prepare("UPDATE auth_magic_links SET consumedAt = ? WHERE tokenHash = ?").run(nowIso(), tokenHash);
  const { token: sessionToken, expiresAt } = createSessionForUser(user, metadata);
  insertAuthLog({
    action: "verify_magic_link",
    entityId: user.id,
    status: "success",
    message: "Login por magic link concluido com sucesso.",
    details: `email=${normalizeEmail(row.email)}; expiresAt=${expiresAt}; ip=${metadata?.ipAddress ?? ""}`,
  });
  return { token: sessionToken, user, expiresAt };
}

export function loginAsSuperuser(metadata?: { userAgent?: string | null; ipAddress?: string | null }) {
  if (!isSuperuserShortcutEnabled()) {
    insertAuthLog({
      action: "superuser_shortcut",
      status: "error",
      message: "Atalho de superuser bloqueado por configuracao.",
    });
    throw new Error("Atalho de superuser desativado.");
  }
  const user = findSuperuser();
  if (!user) {
    insertAuthLog({
      action: "superuser_shortcut",
      status: "error",
      message: "Atalho de superuser falhou: nenhum superuser encontrado.",
    });
    throw new Error("Nao existe superuser configurado.");
  }
  insertAuthLog({
    action: "superuser_shortcut",
    entityId: user.id,
    status: "started",
    message: "Atalho de superuser iniciado.",
    details: `email=${user.email}`,
  });
  const session = createSessionForUser(user, metadata);
  insertAuthLog({
    action: "superuser_shortcut",
    entityId: user.id,
    status: "success",
    message: "Sessao de superuser criada com sucesso.",
    details: `email=${user.email}; expiresAt=${session.expiresAt}; ip=${metadata?.ipAddress ?? ""}`,
  });
  return { ...session, user };
}

export function clearSessionByToken(token: string | null) {
  if (!token) {
    return;
  }
  const tokenHash = sha256(token);
  const session = getDb()
    .prepare("SELECT * FROM auth_sessions WHERE tokenHash = ?")
    .get(tokenHash) as AuthSessionRow | undefined;
  getDb().prepare("DELETE FROM auth_sessions WHERE tokenHash = ?").run(tokenHash);
  insertAuthLog({
    action: "logout",
    entityId: session?.userId ?? null,
    status: "success",
    message: session ? "Sessao terminada com sucesso." : "Pedido de logout recebido sem sessao ativa.",
  });
}

export function requireAuthenticatedRequest(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME);
  const resolved = getSessionByToken(token);
  if (!resolved) {
    throw new Error("AUTH_REQUIRED");
  }
  setActiveUserId(resolved.user.id);
  return resolved.user;
}

export function requireSuperuserRequest(request: Request) {
  const user = requireAuthenticatedRequest(request);
  if (user.role !== "superuser") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function getAuthenticatedUserFromCookieStore(cookieStore: Promise<CookieReader> | CookieReader) {
  const resolvedStore = await cookieStore;
  const token = resolvedStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const resolved = getSessionByToken(token);
  if (!resolved) {
    return null;
  }
  setActiveUserId(resolved.user.id);
  return resolved.user;
}

export function buildUnauthorizedResponse() {
  return Response.json({ error: "Authentication required" }, { status: 401 });
}

export function buildForbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function mapAuthError(error: unknown) {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") {
    return buildUnauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return buildForbiddenResponse();
  }
  return null;
}

export function currentAuthenticatedUserFromCookieHeader(cookieHeader: string | null): SimstockUser | null {
  const token = getCookieValue(cookieHeader, SESSION_COOKIE_NAME);
  return getSessionByToken(token)?.user ?? null;
}
type CookieReader = {
  get(name: string): { value: string } | undefined;
};
