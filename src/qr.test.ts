import { expect, it } from "vitest";
import { buildQrLoginUrl } from "./qr.js";

it("encodes the token as base64url in a tg:// login URL", () => {
  expect(buildQrLoginUrl(Buffer.from("hello"))).toBe("tg://login?token=aGVsbG8");
});

it("uses url-safe base64 without padding", () => {
  // Bytes chosen so standard base64 would yield '+' and '/' (here -> "-_-_").
  const url = buildQrLoginUrl(Buffer.from([0xfb, 0xff, 0xbf]));
  expect(url).toBe("tg://login?token=-_-_");
  const token = url.split("token=")[1];
  expect(token).not.toMatch(/[+/=]/);
});
