"use client";

import { useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "@/hooks/use-toast";
import type { PostFeedItem } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

type PostComposerProps = {
  onCreated: (post: PostFeedItem) => void;
};

export function PostComposer({ onCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [college, setCollege] = useState(user?.college ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await authFetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          college: college.trim() || undefined,
          imageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to post");
      }

      onCreated(data.post);
      setContent("");
      setImageUrl(null);
      toast({ title: "Posted!", description: "Your post is live on the feed." });
    } catch (err) {
      toast({
        title: "Could not post",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 space-y-3">
      <Textarea
        placeholder="What's happening on campus?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
      />
      <div className="flex flex-wrap items-center gap-2">
        <ImageUpload onUploaded={setImageUrl} disabled={submitting} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="College tag (optional)"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          className="text-sm bg-transparent border rounded-md px-2 py-1 flex-1 max-w-xs"
        />
        <Button type="submit" disabled={!content.trim() || submitting}>
          {submitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
