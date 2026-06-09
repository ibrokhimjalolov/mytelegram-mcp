import { expect, it } from "vitest";
import { formatDialog, formatMessage } from "./telegram-format.js";

it("formats a fully-populated message", () => {
  const msg = {
    id: 55,
    message: "hello",
    date: 1_700_000_000,
    senderId: { toString: () => "999" },
    sender: { firstName: "Ada", lastName: "Lovelace", className: "User" },
    replyTo: { replyToMsgId: 50 },
    media: { className: "MessageMediaPhoto" },
  };
  const f = formatMessage(msg);
  expect(f.messageId).toBe(55);
  expect(f.text).toBe("hello");
  expect(f.senderId).toBe("999");
  expect(f.senderName).toBe("Ada Lovelace");
  expect(f.replyToId).toBe(50);
  expect(f.mediaType).toBe("photo");
  expect(f.date).toBe(new Date(1_700_000_000 * 1000).toISOString());
});

it("formats a minimal message without throwing", () => {
  const f = formatMessage({ id: 1, message: "", date: 0 });
  expect(f.senderId).toBeNull();
  expect(f.senderName).toBeNull();
  expect(f.mediaType).toBeNull();
  expect(f.replyToId).toBeNull();
  expect(f.date).toBeNull();
  expect(f.text).toBe("");
});

it("falls back to a @username for the sender name", () => {
  const f = formatMessage({ id: 2, message: "hi", date: 1, sender: { username: "bob" } });
  expect(f.senderName).toBe("@bob");
});

it("formats a group dialog with a last-message snippet", () => {
  const d = {
    id: { toString: () => "-100123" },
    title: "My Group",
    unreadCount: 4,
    isGroup: true,
    message: { message: "last msg here" },
  };
  const f = formatDialog(d);
  expect(f.chatId).toBe("-100123");
  expect(f.title).toBe("My Group");
  expect(f.type).toBe("group");
  expect(f.unreadCount).toBe(4);
  expect(f.lastMessage).toBe("last msg here");
});

it("classifies user and channel dialog types", () => {
  expect(formatDialog({ id: 1, isUser: true }).type).toBe("user");
  expect(formatDialog({ id: 2, isChannel: true }).type).toBe("channel");
  expect(formatDialog({ id: 3 }).type).toBe("unknown");
});
