import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "affiliatepilot_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return secret;
}

function createSignature(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = createSignature(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return false;

  const [expiresAt, signature] = token.split(".");

  if (!expiresAt || !signature) return false;

  const expiresAtNumber = Number(expiresAt);

  if (!Number.isFinite(expiresAtNumber)) return false;
  if (Date.now() > expiresAtNumber) return false;

  const expectedSignature = createSignature(expiresAt);

  return safeEqual(signature, expectedSignature);
}

export function verifyAdminPassword(password: string) {
  const expectedPassword = process.env.AUTH_PASSWORD;

  if (!expectedPassword) {
    throw new Error("AUTH_PASSWORD is not configured.");
  }

  return safeEqual(password, expectedPassword);
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}