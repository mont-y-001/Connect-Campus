import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: { select: { handle: true } },
      _count: { select: { rsvps: true } },
      rsvps: user ? { where: { userId: user.id }, select: { id: true } } : false,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      college: event.college,
      creatorHandle: event.creator.handle,
      rsvpCount: event._count.rsvps,
      rsvpedByMe: user ? event.rsvps.length > 0 : false,
    },
  });
}

export async function POST(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.rSVP.findUnique({
    where: { userId_eventId: { userId: user.id, eventId: id } },
  });

  if (existing) {
    await prisma.rSVP.delete({ where: { id: existing.id } });
    return NextResponse.json({ rsvped: false });
  }

  await prisma.rSVP.create({
    data: { userId: user.id, eventId: id },
  });

  return NextResponse.json({ rsvped: true });
}
