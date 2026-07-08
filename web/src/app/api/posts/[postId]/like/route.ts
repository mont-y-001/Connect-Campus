import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

type RouteParams = { params: Promise<{ postId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId, isRemoved: false },
    select: { id: true, authorId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.like.create({
    data: { userId: user.id, postId },
  });

  if (post.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        type: "LIKE",
        message: `${user.handle} liked your post`,
        recipientId: post.authorId,
        postId,
      },
    });
  }

  return NextResponse.json({ liked: true });
}
