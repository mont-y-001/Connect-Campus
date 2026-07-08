import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ posts: [] });
  }

  const posts = await prisma.post.findMany({
    where: {
      isRemoved: false,
      content: { contains: q.trim(), mode: "insensitive" },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { handle: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({
    posts: posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      college: post.college,
      createdAt: post.createdAt.toISOString(),
      authorHandle: post.author.handle,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    })),
  });
}
