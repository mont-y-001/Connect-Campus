import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { broadcastMessage } from "@/lib/socket-broadcast";
import type { MessageItem } from "@/lib/types";

type RouteParams = { params: Promise<{ id: string }> };

const PAGE_SIZE = 50;

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const cursor = request.nextUrl.searchParams.get("cursor");

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participantA: { select: { id: true, handle: true } },
      participantB: { select: { id: true, handle: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    conversation.participantAId !== user.id &&
    conversation.participantBId !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const otherHandle =
    conversation.participantAId === user.id
      ? conversation.participantB.handle
      : conversation.participantA.handle;

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { handle: true } } },
  });

  const hasMore = messages.length > PAGE_SIZE;
  const page = hasMore ? messages.slice(0, PAGE_SIZE) : messages;

  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const items: MessageItem[] = [...page].reverse().map((m: (typeof page)[number]) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    senderHandle: m.sender.handle,
    isMine: m.senderId === user.id,
    readAt: m.readAt?.toISOString() ?? null,
  }));

  return NextResponse.json({
    messages: items,
    otherHandle,
    nextCursor: hasMore ? page[0]?.id : null,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const content =
    typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { participantAId: true, participantBId: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    conversation.participantAId !== user.id &&
    conversation.participantBId !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      content,
      senderId: user.id,
      conversationId: id,
    },
    include: { sender: { select: { handle: true } } },
  });

  const item: MessageItem = {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    senderHandle: message.sender.handle,
    isMine: true,
    readAt: null,
  };

  const recipientId =
    conversation.participantAId === user.id
      ? conversation.participantBId
      : conversation.participantAId;

  try {
    await prisma.notification.create({
      data: {
        type: "MESSAGE",
        message: `${user.handle} sent you a message`,
        recipientId,
      },
    });
  } catch {
    // Don't fail the send if notification insert fails.
  }

  broadcastMessage(id, {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    senderHandle: message.sender.handle,
    conversationId: id,
  });

  return NextResponse.json({ message: item });
}
