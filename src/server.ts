import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { errors } from "telegram";
import { loadConfig } from "./config.js";
import { AccountManager, NotAuthenticatedError } from "./account-manager.js";
import type { ToolContext } from "./tool-context.js";
import { allTools } from "./tools/index.js";

const SERVER_NAME = "mytelegram-mcp";
const SERVER_VERSION = "0.1.0";

/** Turn an arbitrary thrown value into a concise, user-actionable string. */
function formatError(err: unknown): string {
  if (err instanceof errors.FloodWaitError) {
    return `Telegram rate limit (FLOOD_WAIT): wait ${err.seconds}s before retrying this action.`;
  }
  if (err instanceof NotAuthenticatedError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Build (but do not start) the MCP server with all tools registered. */
export function buildServer(ctx: ToolContext): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  for (const def of allTools) {
    server.registerTool(
      def.name,
      { description: def.description, inputSchema: def.inputShape },
      async (args: unknown) => {
        try {
          const result = await def.handler(args, ctx);
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text" as const, text: formatError(err) }],
            isError: true,
          };
        }
      },
    );
  }

  return server;
}

/** Load config, wire up the account pool, and serve over stdio until terminated. */
export async function runServer(configPath: string): Promise<void> {
  const config = loadConfig(configPath);
  const accounts = new AccountManager(config, configPath);
  const ctx: ToolContext = { getClient: (account) => accounts.getClient(account) };

  const server = buildServer(ctx);

  const shutdown = async () => {
    await accounts.disconnectAll();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await server.connect(new StdioServerTransport());
  // stderr only — stdout is the MCP protocol channel.
  process.stderr.write(
    `${SERVER_NAME} v${SERVER_VERSION} ready — accounts: ${config.accounts
      .map((a) => a.label)
      .join(", ")} (default: ${config.defaultAccount})\n`,
  );
}
