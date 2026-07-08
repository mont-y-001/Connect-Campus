import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createCommentSchema } from "@/lib/validation";
import { moderateContent } from "@/lib/moderation";
import type { CommentItem } from "@/lib/types";

type RouteParams = { params: Promise<{ postId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId, isRemoved: false },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comments = await prisma.comment.findMany({
    where: { postId, isRemoved: false },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { handle: true } } },
  });

  const items: CommentItem[] = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    authorHandle: c.author.handle,
  }));

  return NextResponse.json({ comments: items });
}

export async function POST(request: Request, { params }: RouteParams) {
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

  try {
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const moderation = moderateContent(parsed.data.content);
    if (moderation.action === "block") {
      return NextResponse.json({ error: moderation.reason }, { status: 422 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsed.data.content,
        authorId: user.id,
        postId,
      },
      include: { author: { select: { handle: true } } },
    });

    if (post.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          message: `${user.handle} commented on your post`,
          recipientId: post.authorId,
          postId,
        },
      });
    }

    const item: CommentItem = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      authorHandle: comment.author.handle,
    };

    return NextResponse.json({ comment: item });
  } catch {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
