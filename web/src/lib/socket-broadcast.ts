type BroadcastMessage = {
  id: string;
  content: string;
  createdAt: string;
  senderHandle: string;
  conversationId: string;
};

function resolveSocketServerUrl(): string | null {
  const url =
    process.env.SOCKET_SERVER_URL ?? process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) return null;
  // Never call localhost from Vercel/serverless — it stalls the request.
  if (
    process.env.VERCEL &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(url)
  ) {
    return null;
  }
  return url.replace(/\/$/, "");
}

/** Fire-and-forget; must not block the messages API response. */
export function broadcastMessage(
  conversationId: string,
  message: BroadcastMessage
): void {
  const baseUrl = resolveSocketServerUrl();
  if (!baseUrl) return;

  const secret = process.env.INTERNAL_API_SECRET ?? "dev-internal-secret";

  void fetch(`${baseUrl}/internal/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": secret,
    },
    body: JSON.stringify({ conversationId, message }),
    signal: AbortSignal.timeout(3_000),
  }).catch(() => {
    // Real-time delivery is best-effort; messages are already persisted.
  });
}
