/**
 * Normalize GramJS entities/messages into compact, stable JSON for tool output.
 * Inputs are typed loosely (`any`) on purpose: this is the boundary between GramJS's
 * rich runtime objects and the plain data we hand back to the MCP client, and it must
 * tolerate partially-populated objects.
 */

export interface FormattedMessage {
  messageId: number | null;
  senderId: string | null;
  senderName: string | null;
  text: string;
  date: string | null;
  replyToId: number | null;
  mediaType: string | null;
}

export interface FormattedDialog {
  chatId: string | null;
  title: string | null;
  type: "user" | "group" | "channel" | "unknown";
  unreadCount: number;
  lastMessage: string | null;
}

const MEDIA_LABELS: Record<string, string> = {
  MessageMediaPhoto: "photo",
  MessageMediaDocument: "document",
  MessageMediaWebPage: "webpage",
  MessageMediaGeo: "geo",
  MessageMediaGeoLive: "geo_live",
  MessageMediaContact: "contact",
  MessageMediaPoll: "poll",
  MessageMediaDice: "dice",
  MessageMediaVenue: "venue",
  MessageMediaInvoice: "invoice",
  MessageMediaGame: "game",
};

function idToString(id: unknown): string | null {
  if (id === undefined || id === null) return null;
  if (typeof id === "object" && typeof (id as { toString?: unknown }).toString === "function") {
    return (id as { toString(): string }).toString();
  }
  return String(id);
}

function unixToIso(date: unknown): string | null {
  if (typeof date !== "number" || !Number.isFinite(date) || date <= 0) return null;
  return new Date(date * 1000).toISOString();
}

function truncate(text: unknown, max = 120): string | null {
  if (typeof text !== "string" || text.length === 0) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Best-effort display name for a sender/peer entity. */
function entityName(entity: any): string | null {
  if (!entity) return null;
  if (entity.title) return entity.title;
  const parts = [entity.firstName, entity.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (entity.username) return `@${entity.username}`;
  return null;
}

export function formatMessage(msg: any): FormattedMessage {
  const media = msg?.media;
  const mediaType = media?.className
    ? MEDIA_LABELS[media.className] ?? media.className
    : null;
  return {
    messageId: typeof msg?.id === "number" ? msg.id : null,
    senderId: idToString(msg?.senderId),
    senderName: entityName(msg?.sender),
    text: typeof msg?.message === "string" ? msg.message : "",
    date: unixToIso(msg?.date),
    replyToId:
      typeof msg?.replyTo?.replyToMsgId === "number" ? msg.replyTo.replyToMsgId : null,
    mediaType,
  };
}

export function formatDialog(d: any): FormattedDialog {
  const type: FormattedDialog["type"] = d?.isUser
    ? "user"
    : d?.isChannel
      ? "channel"
      : d?.isGroup
        ? "group"
        : "unknown";
  return {
    chatId: idToString(d?.id),
    title: d?.title ?? d?.name ?? entityName(d?.entity) ?? null,
    type,
    unreadCount: typeof d?.unreadCount === "number" ? d.unreadCount : 0,
    lastMessage: truncate(d?.message?.message),
  };
}
