/** Socket URL for the browser. Never use localhost on a deployed site. */
export function getClientSocketUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return null;
  }

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:4000";
  }

  return null;
}

export function isSocketConfiguredForClient(): boolean {
  return getClientSocketUrl() !== null;
}
