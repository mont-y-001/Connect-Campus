"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ChatThread } from "@/components/chat-thread";
import { authFetch } from "@/lib/auth-fetch";
import type { MessageItem } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [otherHandle, setOtherHandle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await authFetch(`/api/conversations/${id}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
          setOtherHandle(data.otherHandle);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl w-full flex-1">
        <div className="border-b px-4 py-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>
        {loading ? (
          <p className="p-4 text-muted-foreground text-sm">Loading chat...</p>
        ) : (
          <ChatThread
            conversationId={id}
            otherHandle={otherHandle}
            initialMessages={messages}
          />
        )}
      </main>
    </>
  );
}
