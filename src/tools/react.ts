import { z } from "zod";
import { Api } from "telegram";
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
      "Chat containing the message: numeric chat id (as a string), @username, phone, or 'me'.",
    ),
  messageId: z.number().int().describe("Id of the message to react to."),
  emoji: z.string().min(1).describe("Reaction emoji, e.g. 👍 ❤️ 🔥."),
  big: z.boolean().optional().describe("Play the big/animated reaction effect (default false)."),
};

const argsSchema = z.object(inputShape);
export type ReactArgs = z.infer<typeof argsSchema>;

export async function handler(args: ReactArgs, ctx: ToolContext) {
  const client = await ctx.getClient(args.account);
  await client.invoke(
    new Api.messages.SendReaction({
      peer: resolveEntity(args.chatId),
      msgId: args.messageId,
      reaction: [new Api.ReactionEmoji({ emoticon: args.emoji })],
      big: args.big,
    }),
  );
  return {
    reacted: true,
    chatId: args.chatId,
    messageId: args.messageId,
    emoji: args.emoji,
  };
}

export const reactTool: ToolDefinition = {
  name: "react",
  description:
    "Add an emoji reaction to a message as the logged-in user. Reuse a message id from " +
    "get_messages or search_messages.",
  inputShape,
  handler: handler as ToolDefinition["handler"],
};
