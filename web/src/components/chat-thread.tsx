"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { MessageItem } from "@/lib/types";
import { formatTime } from "@/lib/format-time";
import { useSocket } from "@/contexts/socket-context";
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    onNewMessage,
    onTyping,
    onStoppedTyping,
    connected,
  } = useSocket();

  useEffect(() => {
    joinConversation(conversationId);
  }, [conversationId, joinConversation]);

  useEffect(() => {
    return onNewMessage((msg) => {
      if (msg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });
  }, [onNewMessage]);

  useEffect(() => {
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
  }, [conversationId, otherHandle, onTyping, onStoppedTyping]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function handleInputChange(value: string) {
    setContent(value);
    startTyping(conversationId);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage(conversationId, content.trim());
    setContent("");
    stopTyping(conversationId);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{otherHandle}</h2>
        <p className="text-xs text-muted-foreground">
          {connected ? "Online" : "Connecting..."}
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

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={content}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={!connected}
        />
        <Button type="submit" size="icon" disabled={!content.trim() || !connected}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
