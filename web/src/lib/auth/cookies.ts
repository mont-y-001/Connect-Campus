import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signAccessToken, signRefreshToken, type TokenPayload } from "./tokens";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  payload: TokenPayload
): NextResponse {
  response.cookies.set(ACCESS_COOKIE, signAccessToken(payload), {
    ...cookieOptions,
    maxAge: 15 * 60,
  });
  response.cookies.set(REFRESH_COOKIE, signRefreshToken(payload), {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshTokenFromCookies(): Promise<
  string | undefined
> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
