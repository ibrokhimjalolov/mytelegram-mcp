import { z } from "zod";
import type { ToolContext, ToolDefinition } from "../tool-context.js";
import { resolveEntity } from "../entity.js";
import { formatMessage } from "../telegram-format.js";

const inputShape = {
  account: z
    .string()
    .optional()
    .describe("Account label from config; omit to use the default account."),
  chatId: z
    .string()
    .describe(
      "Target chat: numeric chat id (as a string), @username, phone (+...), or 'me' for Saved Messages.",
    ),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Maximum number of messages to return, newest first (default 20)."),
  offsetId: z
    .number()
    .int()
    .optional()
    .describe("Return messages older than this message id (for pagination)."),
};

const argsSchema = z.object(inputShape);
export type GetMessagesArgs = z.infer<typeof argsSchema>;

export async function handler(args: GetMessagesArgs, ctx: ToolContext) {
  const client = await ctx.getClient(args.account);
  const messages = await client.getMessages(resolveEntity(args.chatId), {
    limit: args.limit ?? 20,
    offsetId: args.offsetId,
  });
  return {
    chatId: args.chatId,
    messages: messages.map(formatMessage),
  };
}

export const getMessagesTool: ToolDefinition = {
  name: "get_messages",
  description:
    "Fetch recent messages from a chat (newest first). Returns message id, sender, " +
    "text, timestamp, reply target, and a media-type label. Use offsetId to paginate " +
    "into older messages.",
  inputShape,
  handler: handler as ToolDefinition["handler"],
};
