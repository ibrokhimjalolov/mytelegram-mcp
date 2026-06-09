import { describe, expect, it } from "vitest";
import { resolveConfig, selectAccount } from "./config.js";

const base = {
  apiId: 111,
  apiHash: "tophash",
  accounts: [
    { label: "personal", phone: "+1", sessionFile: "sessions/personal.session" },
    { label: "work", phone: "+2", sessionFile: "/abs/work.session", apiId: 222, apiHash: "h2" },
  ],
};

describe("resolveConfig", () => {
  it("applies top-level creds as defaults and resolves relative session paths", () => {
    const cfg = resolveConfig(base, "/cfgdir");
    expect(cfg.defaultAccount).toBe("personal");

    const personal = cfg.accounts[0];
    expect(personal.apiId).toBe(111);
    expect(personal.apiHash).toBe("tophash");
    expect(personal.sessionFile).toBe("/cfgdir/sessions/personal.session");
  });

  it("honours per-account credential overrides and absolute session paths", () => {
    const work = resolveConfig(base, "/cfgdir").accounts[1];
    expect(work.apiId).toBe(222);
    expect(work.apiHash).toBe("h2");
    expect(work.sessionFile).toBe("/abs/work.session");
  });

  it("honours an explicit defaultAccount", () => {
    expect(resolveConfig({ ...base, defaultAccount: "work" }, "/x").defaultAccount).toBe("work");
  });

  it("throws on an unknown defaultAccount", () => {
    expect(() => resolveConfig({ ...base, defaultAccount: "nope" }, "/x")).toThrow(/defaultAccount/);
  });

  it("throws when api credentials are missing entirely", () => {
    expect(() =>
      resolveConfig({ accounts: [{ label: "a", phone: "+1", sessionFile: "a.session" }] }, "/x"),
    ).toThrow(/apiId\/apiHash/);
  });

  it("throws on duplicate account labels", () => {
    expect(() =>
      resolveConfig({ ...base, accounts: [base.accounts[0], base.accounts[0]] }, "/x"),
    ).toThrow(/Duplicate account label/);
  });

  it("throws on an invalid shape (no accounts)", () => {
    expect(() => resolveConfig({ apiId: 1, apiHash: "h", accounts: [] }, "/x")).toThrow(/Invalid config/);
  });
});

describe("selectAccount", () => {
  const cfg = resolveConfig(base, "/x");
  it("returns the default account when no label is given", () => {
    expect(selectAccount(cfg).label).toBe("personal");
  });
  it("returns a named account", () => {
    expect(selectAccount(cfg, "work").label).toBe("work");
  });
  it("throws for an unknown label", () => {
    expect(() => selectAccount(cfg, "zzz")).toThrow(/Unknown account/);
  });
});
