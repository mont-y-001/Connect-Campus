"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { MessageItem } from "@/lib/types";
import { formatTime } from "@/lib/format-time";
import { useSocket } from "@/contexts/socket-context";
import { isSocketConfiguredForClient } from "@/lib/socket-url";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatThreadProps = {
  conversationId: string;
  otherHandle: string;
  initialMessages: MessageItem[];
};

export function ChatThread({
  conversationId,
  otherHandle,
  initialMessages,
}: ChatThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    joinConversation,
    startTyping,
    stopTyping,
    onNewMessage,
    onTyping,
    onStoppedTyping,
    connected,
  } = useSocket();

  useEffect(() => {
    joinConversation(conversationId);
  }, [conversationId, connected, joinConversation]);

  useEffect(() => {
    if (!connected) return;
    return onNewMessage((data) => {
      const incoming = data?.message;
      if (
        incoming?.id &&
        incoming.conversationId === conversationId &&
        incoming.content &&
        incoming.createdAt &&
        incoming.senderHandle
      ) {
        const msg: MessageItem = {
          id: incoming.id,
          content: incoming.content,
          createdAt: incoming.createdAt,
          senderHandle: incoming.senderHandle,
          isMine: incoming.senderHandle !== otherHandle,
          readAt: null,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });
  }, [conversationId, connected, onNewMessage, otherHandle]);

  useEffect(() => {
    if (!connected) return;
    const unsubTyping = onTyping((data) => {
      if (data.conversationId === conversationId && data.handle === otherHandle) {
        setTyping(true);
      }
    });
    const unsubStopped = onStoppedTyping((data) => {
      if (data.conversationId === conversationId && data.handle === otherHandle) {
        setTyping(false);
      }
    });
    return () => {
      unsubTyping();
      unsubStopped();
    };
  }, [conversationId, connected, otherHandle, onTyping, onStoppedTyping]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Production fallback when socket server is not configured yet.
  useEffect(() => {
    if (connected) return;

    let active = true;
    async function poll() {
      const res = await authFetch(
        `/api/conversations/${conversationId}/messages`
      );
      if (!active || !res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    }

    poll();
    const interval = setInterval(poll, 5_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [connected, conversationId]);

  function handleInputChange(value: string) {
    setContent(value);
    startTyping(conversationId);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text || sending) return;

    setContent("");
    stopTyping(conversationId);
    setSending(true);

    try {
      const res = await authFetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to send message");
      }

      const data = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    } catch (err) {
      setContent(text);
      toast({
        title: "Message not sent",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{otherHandle}</h2>
        <p className="text-xs text-muted-foreground">
          {connected
            ? "Online"
            : isSocketConfiguredForClient()
              ? "Connecting..."
              : "Messages refresh automatically"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.isMine ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                msg.isMine
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted"
              )}
            >
              <p>{msg.content}</p>
              <p className="text-[10px] opacity-70 mt-1">
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        {typing && (
          <p className="text-xs text-muted-foreground italic">
            {otherHandle} is typing...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2 shrink-0">
        <Input
          placeholder="Type a message..."
          value={content}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={!content.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
