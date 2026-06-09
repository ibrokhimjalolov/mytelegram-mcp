# mytelegram-mcp

An MCP server that logs into Telegram **as a real user** (phone number, via the MTProto
Client API — not the Bot API) and exposes tools to read, search, send, and react to
messages. Supports **multiple accounts**, configured through a JSON file passed as an
argument.

> ⚠️ This drives a real Telegram account. Session files are full account credentials —
> keep them private. Use it for your own account(s); avoid bulk/automated patterns that
> could get an account flagged or banned.

## Tools

All tools take an optional `account` (a label from your config; defaults to
`defaultAccount`).

| Tool | Purpose | Key params |
| --- | --- | --- |
| `list_chats` | List recent chats/dialogs | `limit`, `archived` |
| `get_messages` | Fetch recent messages from a chat | `chatId`, `limit`, `offsetId` |
| `search_messages` | Search messages (per-chat or global) | `query`, `chatId?`, `limit` |
| `send_message` | Send / reply to a message | `chatId`, `text`, `replyToMessageId?` |
| `react` | Add an emoji reaction | `chatId`, `messageId`, `emoji`, `big?` |

`chatId` accepts a numeric chat id (as a string), `@username`, a phone number, or `me`
(Saved Messages). Get ids from `list_chats`.

## Setup

### 1. Install & build

```bash
npm install
npm run build
```

### 2. Get API credentials

Create an app at <https://my.telegram.org> → **API development tools** to obtain an
`api_id` and `api_hash`.

### 3. Write a config file

Copy `config.example.json` to `config.json` and fill it in:

```jsonc
{
  "apiId": 1234567,            // default credentials (used by all accounts)
  "apiHash": "abcdef…",
  "defaultAccount": "personal", // optional; defaults to the first account
  "accounts": [
    { "label": "personal", "phone": "+15551234567", "sessionFile": "./sessions/personal.session" },
    { "label": "work",     "phone": "+15557654321", "sessionFile": "./sessions/work.session" }
  ]
}
```

- `apiId`/`apiHash` may be overridden per account.
- `sessionFile` paths are resolved relative to the config file's directory.
- `config.json`, `sessions/`, and `*.session` are git-ignored — they hold secrets.

### 4. Log in (one time per account)

Login is interactive (Telegram sends a code; you may also have a 2FA password), so it
runs as a separate command — **not** inside the MCP client:

```bash
node dist/index.js login --account personal --config ./config.json
# repeat for each account, then check:
node dist/index.js status --config ./config.json
```

This writes a session string to each account's `sessionFile` (mode `0600`). After that
the server runs fully headless. To sign an account out: `logout --account <label>`.

### 5. Register the server with your MCP client (stdio)

```json
{
  "mcpServers": {
    "mytelegram": {
      "command": "node",
      "args": ["/absolute/path/to/mytelegram_mcp/dist/index.js", "--config", "/absolute/path/to/config.json"]
    }
  }
}
```

The config path can also be supplied via the `MYTELEGRAM_CONFIG` environment variable.

## Development

```bash
npm test          # run unit tests (vitest)
npm run typecheck # type-check without emitting
npm run build     # compile to dist/
```

Unit tests run against a mocked GramJS client — no network access required.

## Notes & limits

- Media download/upload is out of scope; `get_messages` only labels the media type.
- Rate limits (`FLOOD_WAIT`) are surfaced as an error telling you how long to wait; the
  server does not auto-retry.
