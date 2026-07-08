"use client";

import { useState } from "react";
import { Flag, Heart, MessageCircle } from "lucide-react";
import type { PostFeedItem } from "@/lib/types";
import { formatTime } from "@/lib/format-time";
import { authFetch } from "@/lib/auth-fetch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommentSection } from "@/components/comment-section";
import { ReportDialog } from "@/components/report-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: PostFeedItem;
  onUpdate?: (post: PostFeedItem) => void;
};

export function PostCard({ post, onUpdate }: PostCardProps) {
  const [localPost, setLocalPost] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [liking, setLiking] = useState(false);

  async function toggleLike() {
    if (liking) return;
    setLiking(true);

    const prev = { ...localPost };
    const optimistic = {
      ...localPost,
      likedByMe: !localPost.likedByMe,
      likeCount: localPost.likedByMe
        ? localPost.likeCount - 1
        : localPost.likeCount + 1,
    };
    setLocalPost(optimistic);
    onUpdate?.(optimistic);

    try {
      const res = await authFetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const updated = {
        ...optimistic,
        likedByMe: data.liked,
        likeCount: data.liked
          ? prev.likeCount + 1
          : Math.max(0, prev.likeCount - 1),
      };
      setLocalPost(updated);
      onUpdate?.(updated);
    } catch {
      setLocalPost(prev);
      onUpdate?.(prev);
      toast({ title: "Failed to update like", variant: "destructive" });
    } finally {
      setLiking(false);
    }
  }

  const initials = localPost.authorHandle.slice(0, 2).toUpperCase();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-brand/10 text-brand text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{localPost.authorHandle}</p>
                <div className="text-xs text-muted-foreground">
                  {formatTime(localPost.createdAt)}
                  {localPost.college && (
                    <span className="ml-2">
                      · <Badge variant="outline" className="text-[10px] py-0">{localPost.college}</Badge>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setReportOpen(true)}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{localPost.content}</p>
          {localPost.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={localPost.imageUrl}
              alt="Post image"
              className="rounded-lg max-h-96 w-full object-cover"
            />
          )}
          <div className="flex items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(localPost.likedByMe && "text-red-500")}
              onClick={toggleLike}
              disabled={liking}
            >
              <Heart
                className={cn(
                  "h-4 w-4 mr-1",
                  localPost.likedByMe && "fill-current"
                )}
              />
              {localPost.likeCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {localPost.commentCount}
            </Button>
          </div>
          {showComments && (
            <CommentSection
              postId={localPost.id}
              onCommentAdded={() => {
                const updated = {
                  ...localPost,
                  commentCount: localPost.commentCount + 1,
                };
                setLocalPost(updated);
                onUpdate?.(updated);
              }}
            />
          )}
        </CardContent>
      </Card>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="post"
        targetId={localPost.id}
      />
    </>
  );
}
