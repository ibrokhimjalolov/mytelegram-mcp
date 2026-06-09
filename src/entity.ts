import bigInt from "big-integer";

/**
 * Coerce a user-supplied chat identifier into a value GramJS accepts as an entity.
 *
 * - `me` / `self`        → passed through (Saved Messages).
 * - `@username` / phone  → passed through as a string for GramJS to resolve.
 * - numeric id string    → converted to a big integer (Telegram ids exceed the safe
 *                          JS integer range, and a bare numeric string would otherwise
 *                          be misread as a username).
 */
export function resolveEntity(chatId: string | number): string | bigInt.BigInteger {
  if (typeof chatId === "number") return bigInt(chatId);
  const value = chatId.trim();
  if (value === "me" || value === "self") return value;
  if (/^-?\d+$/.test(value)) return bigInt(value);
  return value;
}
