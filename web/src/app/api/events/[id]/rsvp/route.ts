import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const existing = await prisma.rSVP.findUnique({
    where: { userId_eventId: { userId: user.id, eventId: id } },
  });

  if (existing) {
    await prisma.rSVP.delete({ where: { id: existing.id } });
    return NextResponse.json({ rsvpd: false });
  }

  await prisma.rSVP.create({
    data: { userId: user.id, eventId: id },
  });

  return NextResponse.json({ rsvpd: true });
}
