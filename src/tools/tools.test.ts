import { expect, it, vi } from "vitest";
import bigInt from "big-integer";
import { Api } from "telegram";
import type { ToolContext } from "../tool-context.js";
import { handler as listChats } from "./list-chats.js";
import { handler as getMessages } from "./get-messages.js";
import { handler as searchMessages } from "./search-messages.js";
import { handler as react } from "./react.js";

function ctxWith(client: unknown): ToolContext & { getClient: ReturnType<typeof vi.fn> } {
  return { getClient: vi.fn(async () => client) } as never;
}

it("list_chats selects the account and forwards limit/archived", async () => {
  const client = {
    getDialogs: vi.fn(async () => [
      { id: { toString: () => "1" }, title: "T", unreadCount: 0, isUser: true },
    ]),
  };
  const ctx = ctxWith(client);
  const res = (await listChats({ account: "work", limit: 5, archived: true }, ctx)) as any;

  expect(ctx.getClient).toHaveBeenCalledWith("work");
  expect(client.getDialogs).toHaveBeenCalledWith({ limit: 5, archived: true });
  expect(res.chats[0].chatId).toBe("1");
});

it("get_messages resolves the entity and maps results", async () => {
  const client = { getMessages: vi.fn(async () => [{ id: 7, message: "hi", date: 0 }]) };
  const res = (await getMessages({ chatId: "me", limit: 3 }, ctxWith(client))) as any;

  expect(client.getMessages).toHaveBeenCalledWith("me", { limit: 3, offsetId: undefined });
  expect(res.messages[0].messageId).toBe(7);
});

it("get_messages converts a numeric chatId to a big integer entity", async () => {
  const client = { getMessages: vi.fn(async () => []) };
  await getMessages({ chatId: "-1001234567890" }, ctxWith(client));

  const passedEntity = client.getMessages.mock.calls[0][0];
  expect(bigInt.isInstance(passedEntity)).toBe(true);
  expect(passedEntity.toString()).toBe("-1001234567890");
});

it("search_messages searches globally when no chatId is given", async () => {
  const client = { getMessages: vi.fn(async () => []) };
  await searchMessages({ query: "foo", limit: 10 }, ctxWith(client));

  expect(client.getMessages).toHaveBeenCalledWith(undefined, { search: "foo", limit: 10 });
});

it("react invokes messages.SendReaction with the emoji", async () => {
  const invoke = vi.fn(async () => ({}));
  const res = (await react(
    { chatId: "me", messageId: 9, emoji: "👍" },
    ctxWith({ invoke }),
  )) as any;

  expect(invoke).toHaveBeenCalledTimes(1);
  const request = invoke.mock.calls[0][0];
  expect(request).toBeInstanceOf(Api.messages.SendReaction);
  expect(request.msgId).toBe(9);
  expect(request.reaction[0]).toBeInstanceOf(Api.ReactionEmoji);
  expect(request.reaction[0].emoticon).toBe("👍");
  expect(res.reacted).toBe(true);
});
