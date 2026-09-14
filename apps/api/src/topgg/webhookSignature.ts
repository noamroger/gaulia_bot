import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Version de l'API top.gg, qui est aussi le nom du schéma de signature : l'en-tête
 * `x-topgg-signature` vaut `t=<timestamp unix>,v1=<hmac hex>`.
 */
const SIGNATURE_VERSION = "v1";

/** Fenêtre d'acceptation de l'horodatage signé, contre le rejeu d'une livraison interceptée. */
const TIMESTAMP_WINDOW_MS = 30_000;

export type SignatureResult =
  { valid: true } | { valid: false; status: 401 | 403 | 422; reason: string };

/**
 * Vérifie la signature d'une livraison top.gg : HMAC-SHA256 de `<timestamp>.<corps brut>` avec le
 * secret de l'intégration. Le corps doit être celui reçu octet pour octet — re-sérialiser le JSON
 * invaliderait la signature.
 */
export function verifyTopggSignature(
  rawBody: Buffer,
  signatureHeader: string | string[] | undefined,
  secret: string,
  now: number = Date.now(),
): SignatureResult {
  const header = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!header) {
    return { valid: false, status: 401, reason: "Signature absente" };
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
    return { valid: false, status: 422, reason: "Format de signature invalide" };
  }

  const timestampMs = Number.parseInt(timestamp, 10) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > TIMESTAMP_WINDOW_MS) {
    return { valid: false, status: 403, reason: "Horodatage hors de la fenêtre acceptée" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest();
  const received = Buffer.from(signature, "hex");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { valid: false, status: 403, reason: "Signature invalide" };
  }

  return { valid: true };
}
