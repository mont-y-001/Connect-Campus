"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import type { CommentItem } from "@/lib/types";
import { formatTime } from "@/lib/format-time";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReportDialog } from "@/components/report-dialog";
import { toast } from "@/hooks/use-toast";

type CommentSectionProps = {
  postId: string;
  onCommentAdded?: () => void;
};

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await authFetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await authFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      setComments((prev) => [...prev, data.comment]);
      setContent("");
      onCommentAdded?.();
    } catch (err) {
      toast({
        title: "Comment failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t pt-3 space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="min-h-[60px]"
        />
        <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
          Reply
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {c.authorHandle.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{c.authorHandle}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(c.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReportTarget(c.id)}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <Flag className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-sm mt-0.5">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onOpenChange={(open) => !open && setReportTarget(null)}
          targetType="comment"
          targetId={reportTarget}
        />
      )}
    </div>
  );
}
