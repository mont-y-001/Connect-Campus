"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { ChatList } from "@/components/chat-list";
import { authFetch } from "@/lib/auth-fetch";
import type { ConversationItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [handle, setHandle] = useState("");
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim() || starting) return;

    setStarting(true);
    try {
      const res = await authFetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantHandle: handle.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      router.push(`/messages/${data.conversation.id}`);
    } catch (err) {
      toast({
        title: "Could not start chat",
        description: err instanceof Error ? err.message : "User not found?",
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl w-full flex-1">
        <div className="border-b p-4">
          <h1 className="font-semibold text-lg mb-3">Messages</h1>
          <form onSubmit={startConversation} className="flex gap-2">
            <Input
              placeholder="Enter handle to message (e.g. QuietFalcon482)"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
            <Button type="submit" disabled={!handle.trim() || starting}>
              Chat
            </Button>
          </form>
        </div>
        {loading ? (
          <p className="p-4 text-muted-foreground text-sm">Loading...</p>
        ) : (
          <ChatList conversations={conversations} />
        )}
      </main>
    </>
  );
}
