"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";
import { SearchBar } from "@/components/search-bar";
import { FeedSkeleton } from "@/components/loading-skeleton";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { authFetch } from "@/lib/auth-fetch";
import type { PostFeedItem } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function FeedPage() {
  const [posts, setPosts] = useState<PostFeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");

  const fetchPosts = useCallback(
    async (opts: {
      cursor?: string | null;
      append?: boolean;
      q?: string;
      college?: string;
    }) => {
      const params = new URLSearchParams();
      if (opts.cursor) params.set("cursor", opts.cursor);
      if (opts.q) params.set("q", opts.q);
      if (opts.college) params.set("college", opts.college);

      const res = await authFetch(`/api/posts?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      if (opts.append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setNextCursor(data.nextCursor);
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    setCursor(null);
    fetchPosts({ q: searchQuery, college: collegeFilter }).finally(() =>
      setLoading(false)
    );
  }, [searchQuery, collegeFilter, fetchPosts]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setCursor(nextCursor);
    await fetchPosts({
      cursor: nextCursor,
      append: true,
      q: searchQuery,
      college: collegeFilter,
    });
    setLoadingMore(false);
  }, [nextCursor, loadingMore, fetchPosts, searchQuery, collegeFilter]);

  const sentinelRef = useInfiniteScroll(loadMore, !!nextCursor, loadingMore);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6 flex-1 w-full">
        <SearchBar
          onSearch={setSearchQuery}
          onCollegeFilter={setCollegeFilter}
          college={collegeFilter}
        />
        <PostComposer
          onCreated={(post) => setPosts((prev) => [post, ...prev])}
        />

        {loading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-lg font-medium">Nothing here yet</p>
            <p className="text-muted-foreground text-sm">
              Be the first to post something on your campus feed!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={(updated) =>
                  setPosts((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p))
                  )
                }
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && !nextCursor && posts.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            You&apos;ve reached the end
          </p>
        )}
      </main>
    </>
  );
}
