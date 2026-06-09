import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { LogLevel } from "telegram/extensions/Logger.js";
import { type Config, loadConfig, selectAccount } from "./config.js";
import { clearSession, hasSession, writeSession } from "./session-store.js";

/** Prompt for a line of visible input. */
async function promptText(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Prompt for input while suppressing echo (used for the 2FA password). */
async function promptHidden(question: string): Promise<string> {
  let muted = false;
  const mutedOut = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output: mutedOut, terminal: true });
  const answer = rl.question(question);
  muted = true; // hide keystrokes typed after the prompt is shown
  try {
    return (await answer).trim();
  } finally {
    muted = false;
    rl.close();
    process.stdout.write("\n");
  }
}

/** Interactive login for one account; writes the resulting session to its file. */
export async function login(configPath: string, label?: string): Promise<void> {
  const config = loadConfig(configPath);
  const account = selectAccount(config, label);

  console.log(`Logging in account '${account.label}' (${account.phone})…`);

  const client = new TelegramClient(
    new StringSession(""),
    account.apiId,
    account.apiHash,
    { connectionRetries: 3 },
  );
  client.setLogLevel(LogLevel.NONE);

  await client.start({
    phoneNumber: account.phone,
    phoneCode: async () => promptText(`  Code sent to ${account.phone}: `),
    password: async (hint) =>
      promptHidden(`  2FA password${hint ? ` (hint: ${hint})` : ""}: `),
    onError: async (err) => {
      console.error(`  Login error: ${err.message}`);
      return false;
    },
  });

  const session = client.session.save() as unknown as string;
  writeSession(account.sessionFile, session);
  await client.disconnect();

  console.log(`✓ Logged in as '${account.label}'. Session saved to ${account.sessionFile}`);
}

/** Clear a stored session. */
export async function logout(configPath: string, label?: string): Promise<void> {
  const config = loadConfig(configPath);
  const account = selectAccount(config, label);
  clearSession(account.sessionFile);
  console.log(`✓ Logged out '${account.label}'. Session at ${account.sessionFile} cleared.`);
}

/** Report which accounts currently have a stored session. */
export async function status(configPath: string): Promise<void> {
  const config: Config = loadConfig(configPath);
  console.log("Account status:");
  for (const account of config.accounts) {
    const mark = hasSession(account.sessionFile) ? "✓ authenticated" : "✗ not logged in";
    const isDefault = account.label === config.defaultAccount ? " (default)" : "";
    console.log(`  ${account.label}${isDefault}: ${mark}  [${account.sessionFile}]`);
  }
}
