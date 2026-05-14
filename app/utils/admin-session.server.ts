import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "hb_admin_session";
const MAX_AGE = 60 * 60 * 12;

function getAdminPassword() {
  return process.env.ADMIN_PORTAL_PASSWORD ?? "";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function buildToken() {
  const ts = Date.now().toString();
  return `${ts}.${sign(ts)}`;
}

function verifyToken(token: string) {
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;

  const expected = sign(ts);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isAdminPasswordValid(password: string) {
  const expected = getAdminPassword();
  if (!expected) return false;
  return password === expected;
}

export function createAdminCookie() {
  const token = buildToken();
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearAdminCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isAdminAuthenticated(request: Request) {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return false;
  const token = cookie.split("=")[1] ?? "";
  return verifyToken(token);
}
