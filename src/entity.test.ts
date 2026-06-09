import { expect, it } from "vitest";
import bigInt from "big-integer";
import { resolveEntity } from "./entity.js";

it("passes 'me' and 'self' through", () => {
  expect(resolveEntity("me")).toBe("me");
  expect(resolveEntity("self")).toBe("self");
});

it("passes usernames and phones through as strings", () => {
  expect(resolveEntity("@durov")).toBe("@durov");
  expect(resolveEntity("+15551234567")).toBe("+15551234567");
});

it("converts a positive numeric string to a big integer", () => {
  const r = resolveEntity("123456789");
  expect(bigInt.isInstance(r)).toBe(true);
  expect(r.toString()).toBe("123456789");
});

it("converts a negative channel id string to a big integer", () => {
  const r = resolveEntity("-1001234567890");
  expect(bigInt.isInstance(r)).toBe(true);
  expect(r.toString()).toBe("-1001234567890");
});

it("converts a numeric argument to a big integer", () => {
  expect(resolveEntity(42).toString()).toBe("42");
});
