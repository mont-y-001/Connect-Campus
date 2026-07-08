import { prisma } from "@/lib/prisma";
import { getAccessTokenFromCookies } from "./cookies";
import { verifyAccessToken } from "./tokens";
import type { PublicUser } from "@/lib/types";

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      handle: true,
      college: true,
      role: true,
      isBanned: true,
    },
  });

  if (!user || user.isBanned) return null;

  return {
    id: user.id,
    handle: user.handle,
    college: user.college,
    role: user.role,
  };
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireModerator(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "MODERATOR" && user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
