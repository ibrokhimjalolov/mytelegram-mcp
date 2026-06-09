import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { LogLevel } from "telegram/extensions/Logger.js";
import { type Config, type ResolvedAccount, selectAccount } from "./config.js";
import { readSession } from "./session-store.js";

/** Thrown when a tool targets an account that has no valid stored session. */
export class NotAuthenticatedError extends Error {
  constructor(
    public readonly label: string,
    configPath = "<your-config.json>",
  ) {
    super(
      `Account '${label}' is not logged in. Run:\n` +
        `  mytelegram-mcp login --account ${label} --config ${configPath}`,
    );
    this.name = "NotAuthenticatedError";
  }
}

/**
 * Lazy connection pool. One GramJS client per account, created and connected on first
 * use, kept warm for the process lifetime, and disconnected together on shutdown.
 */
export class AccountManager {
  private readonly clients = new Map<string, TelegramClient>();

  constructor(
    private readonly config: Config,
    private readonly configPath?: string,
  ) {}

  getAccount(label?: string): ResolvedAccount {
    return selectAccount(this.config, label);
  }

  async getClient(label?: string): Promise<TelegramClient> {
    const account = this.getAccount(label);

    const cached = this.clients.get(account.label);
    if (cached) return cached;

    const sessionStr = readSession(account.sessionFile);
    if (!sessionStr) {
      throw new NotAuthenticatedError(account.label, this.configPath);
    }

    const client = new TelegramClient(
      new StringSession(sessionStr),
      account.apiId,
      account.apiHash,
      { connectionRetries: 3 },
    );
    // Critical for a stdio MCP server: GramJS must never write to stdout.
    client.setLogLevel(LogLevel.NONE);

    await client.connect();
    if (!(await client.isUserAuthorized())) {
      await client.disconnect().catch(() => {});
      throw new NotAuthenticatedError(account.label, this.configPath);
    }

    this.clients.set(account.label, client);
    return client;
  }

  async disconnectAll(): Promise<void> {
    await Promise.all(
      [...this.clients.values()].map((c) => c.disconnect().catch(() => {})),
    );
    this.clients.clear();
  }
}
