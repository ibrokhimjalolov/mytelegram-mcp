import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Session files hold a GramJS StringSession — full account credentials. They are
 * always written with 0600 perms and never logged.
 */

/** Return the stored session string, or null if missing/empty. */
export function readSession(sessionFile: string): string | null {
  if (!existsSync(sessionFile)) return null;
  const contents = readFileSync(sessionFile, "utf8").trim();
  return contents.length > 0 ? contents : null;
}

export function hasSession(sessionFile: string): boolean {
  return readSession(sessionFile) !== null;
}

/** Persist a session string, creating parent dirs and enforcing 0600. */
export function writeSession(sessionFile: string, session: string): void {
  mkdirSync(dirname(sessionFile), { recursive: true });
  writeFileSync(sessionFile, session, { mode: 0o600 });
  chmodSync(sessionFile, 0o600);
}

/** Clear a stored session (used by `logout`). */
export function clearSession(sessionFile: string): void {
  if (!existsSync(sessionFile)) return;
  writeFileSync(sessionFile, "", { mode: 0o600 });
  chmodSync(sessionFile, 0o600);
}
