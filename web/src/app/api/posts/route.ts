import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createPostSchema } from "@/lib/validation";
import { moderateContent } from "@/lib/moderation";
import type { PostFeedItem } from "@/lib/types";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const college = searchParams.get("college");
  const q = searchParams.get("q");

  const where: {
    isRemoved: boolean;
    college?: { contains: string; mode: "insensitive" };
    content?: { contains: string; mode: "insensitive" };
  } = { isRemoved: false };

  if (college) {
    where.college = { contains: college, mode: "insensitive" };
  }
  if (q) {
    where.content = { contains: q, mode: "insensitive" };
  }

  const posts = await prisma.post.findMany({
    where,
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { handle: true } },
      _count: { select: { likes: true, comments: true } },
      likes: user ? { where: { userId: user.id }, select: { id: true } } : false,
    },
  });

  const hasMore = posts.length > PAGE_SIZE;
  const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

  const feedItems: PostFeedItem[] = page.map((post) => ({
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    college: post.college,
    createdAt: post.createdAt.toISOString(),
    authorHandle: post.author.handle,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: user ? post.likes.length > 0 : false,
  }));

  return NextResponse.json({
    posts: feedItems,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);

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

    const post = await prisma.post.create({
      data: {
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl ?? null,
        college: parsed.data.college ?? user.college,
        isFlagged: moderation.isFlagged,
        authorId: user.id,
      },
      include: {
        author: { select: { handle: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        college: post.college,
        createdAt: post.createdAt.toISOString(),
        authorHandle: post.author.handle,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        likedByMe: false,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
