"use client";

import Link from "next/link";
import type { ConversationItem } from "@/lib/types";
import { formatTime } from "@/lib/format-time";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ChatListProps = {
  conversations: ConversationItem[];
  activeId?: string;
};

export function ChatList({ conversations, activeId }: ChatListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-muted-foreground mb-2">No conversations yet</p>
        <p className="text-sm text-muted-foreground">
          Start a chat by entering someone&apos;s handle below
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {conversations.map((conv) => (
        <li key={conv.id}>
          <Link
            href={`/messages/${conv.id}`}
            className={cn(
              "flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors",
              activeId === conv.id && "bg-accent"
            )}
          >
            <Avatar>
              <AvatarFallback>
                {conv.otherHandle.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{conv.otherHandle}</span>
                {conv.lastMessageAt && (
                  <span className="text-xs text-muted-foreground">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conv.lastMessage ?? "No messages yet"}
              </p>
            </div>
            {conv.unreadCount > 0 && (
              <Badge className="shrink-0">{conv.unreadCount}</Badge>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
