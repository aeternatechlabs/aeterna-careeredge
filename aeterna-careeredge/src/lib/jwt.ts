// src/lib/jwt.ts
// Pure Web Crypto (crypto.subtle) HS256 JWT sign/verify with spec-compliant
// base64url encoding/decoding using atob/btoa.
// Zero dependencies on jose, Buffer, or experimental Uint8Array.fromBase64/toBase64
// (which throw "Failed to base64url decode the signature" in Cloudflare Workers).

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecodeBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const mod = b64.length % 4;
  if (mod === 1) {
    throw new Error("Invalid base64url length");
  }
  const pad = mod === 0 ? "" : "=".repeat(4 - mod);
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secretBytes: Uint8Array, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    secretBytes as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function signHs256Jwt(
  payload: Record<string, unknown>,
  secretBytes: Uint8Array,
  expiresInSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const headerJson = JSON.stringify({ alg: "HS256", typ: "JWT" });
  const payloadJson = JSON.stringify({
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  });

  const headerB64 = base64UrlEncodeBytes(textEncoder.encode(headerJson));
  const payloadB64 = base64UrlEncodeBytes(textEncoder.encode(payloadJson));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importHmacKey(secretBytes, "sign");
  const sigBuffer = await crypto.subtle.sign("HMAC", key, textEncoder.encode(signingInput));
  const sigB64 = base64UrlEncodeBytes(new Uint8Array(sigBuffer));

  return `${signingInput}.${sigB64}`;
}

export async function verifyHs256Jwt(
  token: string,
  secretBytes: Uint8Array
): Promise<Record<string, unknown>> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid Compact JWS");
  }

  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) {
    throw new Error("Empty JWS segment");
  }

  const header = JSON.parse(textDecoder.decode(base64UrlDecodeBytes(headerB64))) as {
    alg?: string;
  };
  if (header.alg !== "HS256") {
    throw new Error(`Unsupported alg: ${header.alg}`);
  }

  const sigBytes = base64UrlDecodeBytes(sigB64);
  const signingInputBytes = textEncoder.encode(`${headerB64}.${payloadB64}`);

  const key = await importHmacKey(secretBytes, "verify");
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes as BufferSource,
    signingInputBytes
  );
  if (!valid) {
    throw new Error("signature verification failed");
  }

  const payload = JSON.parse(textDecoder.decode(base64UrlDecodeBytes(payloadB64))) as Record<
    string,
    unknown
  >;

  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT expired");
  }

  return payload;
}
