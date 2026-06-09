import { z } from "zod";
import type { ToolContext, ToolDefinition } from "../tool-context.js";
import { resolveEntity } from "../entity.js";
import { formatMessage } from "../telegram-format.js";

const inputShape = {
  account: z
    .string()
    .optional()
    .describe("Account label from config; omit to use the default account."),
  query: z.string().min(1).describe("Text to search for."),
  chatId: z
    .string()
    .optional()
    .describe(
      "Restrict the search to this chat (numeric id as string, @username, phone, or 'me'). " +
        "Omit to search across all chats.",
    ),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Maximum number of matches to return (default 20)."),
};

const argsSchema = z.object(inputShape);
export type SearchMessagesArgs = z.infer<typeof argsSchema>;

export async function handler(args: SearchMessagesArgs, ctx: ToolContext) {
  const client = await ctx.getClient(args.account);
  const entity = args.chatId ? resolveEntity(args.chatId) : undefined;
  const messages = await client.getMessages(entity, {
    search: args.query,
    limit: args.limit ?? 20,
  });
  return {
    query: args.query,
    scope: args.chatId ?? "(global)",
    messages: messages.map(formatMessage),
  };
}

export const searchMessagesTool: ToolDefinition = {
  name: "search_messages",
  description:
    "Search messages by text. Provide chatId to search within one chat, or omit it to " +
    "search globally across all chats. Returns matching messages newest first.",
  inputShape,
  handler: handler as ToolDefinition["handler"],
};
