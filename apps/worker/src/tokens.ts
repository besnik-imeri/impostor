export interface RoomTokenPayload {
  roomCode: string;
  playerId: string;
  isHost: boolean;
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();

export async function createRoomToken(payload: RoomTokenPayload, secret: string): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(body, secret);
  return `${body}.${signature}`;
}

export async function verifyRoomToken(
  token: string,
  secret: string,
  now = Date.now()
): Promise<RoomTokenPayload> {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    throw new Error("Malformed token.");
  }

  const expected = await sign(body, secret);

  if (!timingSafeEqual(signature, expected)) {
    throw new Error("Invalid token signature.");
  }

  const payload = JSON.parse(base64UrlDecode(body)) as RoomTokenPayload;

  if (payload.exp <= now) {
    throw new Error("Expired token.");
  }

  return payload;
}

async function sign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

export function base64UrlEncode(value: string): string {
  return base64UrlEncodeBytes(encoder.encode(value));
}

export function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}
