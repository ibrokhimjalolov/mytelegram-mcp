import type { TelegramClient } from "telegram";
import type { ZodRawShape } from "zod";

/**
 * The only capability a tool handler needs: obtain a connected client for an account.
 * Decoupling tools from AccountManager keeps handlers trivially unit-testable with a
 * fake client.
 */
export interface ToolContext {
  getClient(account?: string): Promise<TelegramClient>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputShape: ZodRawShape;
  handler: (args: any, ctx: ToolContext) => Promise<unknown>;
}

/** Shared schema fragment: the optional account selector present on every tool. */
export const accountField = {
  describe: "Account label from the config; omit to use the configured default account.",
};
