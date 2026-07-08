import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const college = request.nextUrl.searchParams.get("college");

  const events = await prisma.event.findMany({
    where: {
      ...(college ? { college } : {}),
      startsAt: { gte: new Date() }, // Only upcoming events
    },
    orderBy: { startsAt: "asc" },
    include: {
      creator: { select: { handle: true } },
      _count: { select: { rsvps: true } },
    },
  });

  // check if current user RSVP'd
  const myRsvps = await prisma.rSVP.findMany({
    where: {
      userId: user.id,
      eventId: { in: events.map((e: any) => e.id) },
    },
  });

  const rsvpSet = new Set(myRsvps.map((r: any) => r.eventId));

  const items = events.map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString() ?? null,
    college: e.college,
    creatorHandle: e.creator.handle,
    rsvpCount: e._count.rsvps,
    hasRsvpd: rsvpSet.has(e.id),
  }));

  return NextResponse.json({ events: items });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, location, startsAt, endsAt, college } = body;

    if (!title || !startsAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        location,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        college: college || null,
        creatorId: user.id,
      },
    });

    return NextResponse.json({ event });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
