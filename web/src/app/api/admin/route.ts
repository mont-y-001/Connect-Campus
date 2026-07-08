import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireModerator();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [flaggedPosts, pendingReports] = await Promise.all([
    prisma.post.findMany({
      where: { isFlagged: true, isRemoved: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { id: true, handle: true, isBanned: true } } },
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reporter: { select: { handle: true } },
        post: { select: { id: true, content: true } },
        comment: { select: { id: true, content: true } },
      },
    }),
  ]);

  return NextResponse.json({ flaggedPosts, pendingReports });
}

export async function PATCH(request: Request) {
  let moderator;
  try {
    moderator = await requireModerator();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  void moderator;

  try {
    const body = await request.json();
    const { action, targetType, targetId, userId } = body as {
      action: string;
      targetType?: string;
      targetId?: string;
      userId?: string;
    };

    if (action === "remove_post" && targetId) {
      await prisma.post.update({
        where: { id: targetId },
        data: { isRemoved: true },
      });
    } else if (action === "remove_comment" && targetId) {
      await prisma.comment.update({
        where: { id: targetId },
        data: { isRemoved: true },
      });
    } else if (action === "dismiss_flag" && targetId) {
      await prisma.post.update({
        where: { id: targetId },
        data: { isFlagged: false },
      });
    } else if (action === "ban_user" && userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: true },
      });
    } else if (action === "unban_user" && userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: false },
      });
    } else if (action === "dismiss_report" && targetId) {
      await prisma.report.update({
        where: { id: targetId },
        data: { status: "DISMISSED" },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
