import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, TokenPayload } from "@/lib/auth/tokens";
import { setCookie } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  const newPayload: TokenPayload = {
    userId: payload.userId,
    handle: payload.handle,
    role: payload.role,
  };

  const newAccessToken = signAccessToken(newPayload);

  const response = NextResponse.json({ success: true });
  
  // Update the access token cookie
  response.cookies.set("access_token", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  return response;
}
