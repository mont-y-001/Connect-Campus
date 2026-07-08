export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let res = await fetch(input, { ...init, credentials: "include" });

  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      res = await fetch(input, { ...init, credentials: "include" });
    } else if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return res;
}
