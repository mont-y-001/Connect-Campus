"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import type { EventItem } from "@/lib/types";
import { authFetch } from "@/lib/auth-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type EventCardProps = {
  event: EventItem;
  onRsvpChange?: (event: EventItem) => void;
};

export function EventCard({ event, onRsvpChange }: EventCardProps) {
  const [local, setLocal] = useState(event);
  const [loading, setLoading] = useState(false);

  async function toggleRsvp() {
    setLoading(true);
    try {
      const res = await authFetch(`/api/events/${event.id}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const updated = {
        ...local,
        rsvpedByMe: data.rsvped,
        rsvpCount: data.rsvped ? local.rsvpCount + 1 : Math.max(0, local.rsvpCount - 1),
      };
      setLocal(updated);
      onRsvpChange?.(updated);
    } catch {
      toast({ title: "RSVP failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const startDate = new Date(local.startsAt);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            <Link href={`/events/${local.id}`} className="hover:underline">
              {local.title}
            </Link>
          </CardTitle>
          {local.college && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {local.college}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">by {local.creatorHandle}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {local.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {local.description}
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {startDate.toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {local.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {local.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {local.rsvpCount} going
          </span>
        </div>
        <Button
          size="sm"
          variant={local.rsvpedByMe ? "secondary" : "default"}
          onClick={toggleRsvp}
          disabled={loading}
        >
          {local.rsvpedByMe ? "Going ✓" : "RSVP"}
        </Button>
      </CardContent>
    </Card>
  );
}
