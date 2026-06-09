/**
 * Build the Telegram device-login deep link from a QR login token.
 *
 * Telegram's "Link Desktop Device" QR encodes a `tg://login?token=<base64url>` URL.
 * GramJS hands us the raw token as a Buffer; base64url is url-safe and unpadded, which
 * is exactly what the Telegram apps expect.
 */
export function buildQrLoginUrl(token: Buffer): string {
  return `tg://login?token=${token.toString("base64url")}`;
}
