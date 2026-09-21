import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * top.gg API version, which is also the name of the signature scheme: the `x-topgg-signature`
 * header reads `t=<unix timestamp>,v1=<hmac hex>`.
 */
const SIGNATURE_VERSION = "v1";

/** Accepted window for the signed timestamp, against the replay of a captured delivery. */
const TIMESTAMP_WINDOW_MS = 30_000;

export type SignatureResult =
  { valid: true } | { valid: false; status: 401 | 403 | 422; reason: string };

/**
 * Checks a top.gg delivery: HMAC-SHA256 of `<timestamp>.<raw body>` with the integration secret.
 * The body must be the one received byte for byte, as re-serialising the JSON would break it.
 * Reasons stay in English: they are read by top.gg, never by a human.
 */
export function verifyTopggSignature(
  rawBody: Buffer,
  signatureHeader: string | string[] | undefined,
  secret: string,
  now: number = Date.now(),
): SignatureResult {
  const header = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!header) {
    return { valid: false, status: 401, reason: "Missing signature" };
  }

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const separator = part.indexOf("=");
      return separator === -1
        ? [part.trim(), ""]
        : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }),
  );

  const timestamp = parts.t;
  const signature = parts[SIGNATURE_VERSION];
  if (!timestamp || !signature || !/^[0-9a-f]+$/i.test(signature)) {
    return { valid: false, status: 422, reason: "Malformed signature" };
  }

  const timestampMs = Number.parseInt(timestamp, 10) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > TIMESTAMP_WINDOW_MS) {
    return { valid: false, status: 403, reason: "Timestamp outside the accepted window" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest();
  const received = Buffer.from(signature, "hex");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { valid: false, status: 403, reason: "Invalid signature" };
  }

  return { valid: true };
}
