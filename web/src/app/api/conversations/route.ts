import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createConversationSchema } from "@/lib/validation";
import type { ConversationItem } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participantAId: user.id }, { participantBId: user.id }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participantA: { select: { id: true, handle: true } },
      participantB: { select: { id: true, handle: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true, readAt: true },
      },
    },
  });

  const items: ConversationItem[] = await Promise.all(
    conversations.map(async (conv: (typeof conversations)[number]) => {
      const other =
        conv.participantAId === user.id
          ? conv.participantB
          : conv.participantA;
      const lastMsg = conv.messages[0] ?? null;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: user.id },
          readAt: null,
        },
      });

      return {
        id: conv.id,
        otherHandle: other.handle,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
        unreadCount,
      };
    })
  );

  return NextResponse.json({ conversations: items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const other = await prisma.user.findUnique({
      where: { handle: parsed.data.participantHandle },
      select: { id: true, handle: true, isBanned: true },
    });

    if (!other || other.isBanned) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (other.id === user.id) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    const [aId, bId] =
      user.id < other.id ? [user.id, other.id] : [other.id, user.id];

    const conversation = await prisma.conversation.upsert({
      where: {
        participantAId_participantBId: {
          participantAId: aId,
          participantBId: bId,
        },
      },
      create: {
        participantAId: aId,
        participantBId: bId,
      },
      update: {},
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherHandle: other.handle,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
