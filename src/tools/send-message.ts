import { z } from "zod";
import type { ToolContext, ToolDefinition } from "../tool-context.js";
import { resolveEntity } from "../entity.js";

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
  text: z.string().min(1).describe("Message text to send."),
  replyToMessageId: z
    .number()
    .int()
    .optional()
    .describe("If set, send this as a reply to the given message id."),
};

const argsSchema = z.object(inputShape);
export type SendMessageArgs = z.infer<typeof argsSchema>;

export async function handler(args: SendMessageArgs, ctx: ToolContext) {
  const client = await ctx.getClient(args.account);
  const sent = await client.sendMessage(resolveEntity(args.chatId), {
    message: args.text,
    replyTo: args.replyToMessageId,
  });
  return {
    sent: true,
    chatId: args.chatId,
    messageId: typeof sent?.id === "number" ? sent.id : null,
  };
}

export const sendMessageTool: ToolDefinition = {
  name: "send_message",
  description:
    "Send a text message to a chat as the logged-in user. Optionally reply to an " +
    "existing message via replyToMessageId. Returns the new message id.",
  inputShape,
  handler: handler as ToolDefinition["handler"],
};
