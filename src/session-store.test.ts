import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearSession, hasSession, readSession, writeSession } from "./session-store.js";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "mtg-store-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

it("round-trips a session, creating parent dirs with 0600 perms", () => {
  const file = join(dir, "nested", "a.session");
  expect(readSession(file)).toBeNull();
  expect(hasSession(file)).toBe(false);

  writeSession(file, "SESSIONSTR");
  expect(readSession(file)).toBe("SESSIONSTR");
  expect(hasSession(file)).toBe(true);
  expect(statSync(file).mode & 0o777).toBe(0o600);
});

it("treats whitespace-only content as empty", () => {
  const file = join(dir, "b.session");
  writeSession(file, "   \n");
  expect(readSession(file)).toBeNull();
});

it("clearSession empties an existing session", () => {
  const file = join(dir, "c.session");
  writeSession(file, "X");
  clearSession(file);
  expect(readSession(file)).toBeNull();
  expect(hasSession(file)).toBe(false);
});
