"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";
import { formatTime } from "@/lib/format-time";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  college: string | null;
  creatorHandle: string;
  rsvpCount: number;
  hasRsvpd: boolean;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await authFetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function toggleRsvp(eventId: string) {
    try {
      // Optimistic update
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === eventId) {
            return {
              ...e,
              hasRsvpd: !e.hasRsvpd,
              rsvpCount: e.hasRsvpd ? e.rsvpCount - 1 : e.rsvpCount + 1,
            };
          }
          return e;
        })
      );

      const res = await authFetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to RSVP");
    } catch (err) {
      toast({ title: "Error", description: "Failed to update RSVP.", variant: "destructive" });
      fetchEvents(); // Revert on failure
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl w-full flex-1 p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Upcoming Events</h1>
          <Button variant="outline">Create Event</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-card">
            <h3 className="font-semibold mb-1">No events yet</h3>
            <p className="text-sm text-muted-foreground">Be the first to host an event on campus!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((e) => (
              <div key={e.id} className="border rounded-lg bg-card p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-semibold text-lg">{e.title}</h3>
                  {e.college && (
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground font-medium mt-1 inline-block">
                      {e.college}
                    </span>
                  )}
                </div>

                {e.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatTime(e.startsAt)}</span>
                  </div>
                  {e.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{e.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{e.rsvpCount} Attending</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t mt-1">
                  <span className="text-xs text-muted-foreground">Hosted by {e.creatorHandle}</span>
                  <Button
                    size="sm"
                    variant={e.hasRsvpd ? "secondary" : "default"}
                    onClick={() => toggleRsvp(e.id)}
                  >
                    {e.hasRsvpd ? "Cancel RSVP" : "RSVP"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
