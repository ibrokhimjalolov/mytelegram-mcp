import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AccountManager, NotAuthenticatedError } from "./account-manager.js";
import { resolveConfig } from "./config.js";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "mtg-am-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function makeConfig() {
  return resolveConfig(
    {
      apiId: 1,
      apiHash: "h",
      accounts: [
        { label: "a", phone: "+1", sessionFile: "a.session" },
        { label: "b", phone: "+2", sessionFile: "b.session" },
      ],
    },
    dir,
  );
}

it("getAccount resolves the default and named accounts and rejects unknowns", () => {
  const am = new AccountManager(makeConfig());
  expect(am.getAccount().label).toBe("a");
  expect(am.getAccount("b").label).toBe("b");
  expect(() => am.getAccount("zzz")).toThrow(/Unknown account/);
});

it("getClient throws an actionable NotAuthenticatedError when no session exists", async () => {
  const am = new AccountManager(makeConfig(), "/cfg/config.json");
  await expect(am.getClient("a")).rejects.toBeInstanceOf(NotAuthenticatedError);
  await expect(am.getClient("a")).rejects.toThrow(/login --account a --config \/cfg\/config\.json/);
});
