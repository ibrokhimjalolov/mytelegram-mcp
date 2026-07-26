import type { ToolDefinition } from "../tool-context.js";
import { listChatsTool } from "./list-chats.js";
import { getMessagesTool } from "./get-messages.js";
import { searchMessagesTool } from "./search-messages.js";
import { reactTool } from "./react.js";

export const allTools: ToolDefinition[] = [
  listChatsTool,
  getMessagesTool,
  searchMessagesTool,
  reactTool,
];
