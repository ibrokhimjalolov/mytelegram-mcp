#!/usr/bin/env node
import { resolve } from "node:path";
import { runServer } from "./server.js";
import { login, logout, status } from "./login-cli.js";

const USAGE = `mytelegram-mcp — Telegram (user account / MTProto) MCP server

Usage:
  mytelegram-mcp --config <path>                 Run the MCP server over stdio
  mytelegram-mcp login   --config <path> [--account <label>] [--qr]  Interactive login
  mytelegram-mcp logout  --config <path> [--account <label>]   Clear a session
  mytelegram-mcp status  --config <path>                       Show auth status

Login flags:
  --qr      Log in by scanning a QR code from another Telegram app (device login),
            instead of entering a phone code.

The --config path may also be supplied via the MYTELEGRAM_CONFIG env var.`;

const CLI_COMMANDS = new Set(["login", "logout", "status"]);

function getFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return;
  }

  const command = argv[0] && !argv[0].startsWith("-") ? argv[0] : undefined;
  const configPath = getFlag(argv, "config") ?? process.env.MYTELEGRAM_CONFIG;
  if (!configPath) {
    process.stderr.write("Error: no config provided. Use --config <path> or MYTELEGRAM_CONFIG.\n\n");
    process.stderr.write(`${USAGE}\n`);
    process.exit(1);
  }
  const absConfig = resolve(configPath);
  const account = getFlag(argv, "account");
  const qr = argv.includes("--qr");

  switch (command) {
    case "login":
      await login(absConfig, account, { qr });
      break;
    case "logout":
      await logout(absConfig, account);
      break;
    case "status":
      await status(absConfig);
      break;
    default:
      if (command && CLI_COMMANDS.has(command)) break; // unreachable; keeps types happy
      await runServer(absConfig);
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
