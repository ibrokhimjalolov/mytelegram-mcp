import { z } from "zod";
import type { ToolContext, ToolDefinition } from "../tool-context.js";
import { formatDialog } from "../telegram-format.js";

const inputShape = {
  account: z
    .string()
    .optional()
    .describe("Account label from config; omit to use the default account."),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Maximum number of chats to return (default 30)."),
  archived: z.boolean().optional().describe("Include archived chats (default false)."),
};

const argsSchema = z.object(inputShape);
export type ListChatsArgs = z.infer<typeof argsSchema>;

export async function handler(args: ListChatsArgs, ctx: ToolContext) {
  const client = await ctx.getClient(args.account);
  const dialogs = await client.getDialogs({
    limit: args.limit ?? 30,
    archived: args.archived ?? false,
  });
  return {
    account: args.account ?? "(default)",
    chats: dialogs.map(formatDialog),
  };
}

export const listChatsTool: ToolDefinition = {
  name: "list_chats",
  description:
    "List recent Telegram chats (dialogs) for an account, including each chat's id, " +
    "title, type, unread count, and a snippet of the last message. Use the returned " +
    "chatId with the other tools.",
  inputShape,
  handler: handler as ToolDefinition["handler"],
};
