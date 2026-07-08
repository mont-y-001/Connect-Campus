"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { PublicUser } from "@/lib/types";

type FlaggedPost = {
  id: string;
  content: string;
  isFlagged: boolean;
  author: PublicUser;
};

type Report = {
  id: string;
  reason: string;
  status: string;
  post: { id: string; content: string } | null;
  comment: { id: string; content: string } | null;
  reporter: { handle: string };
};

export default function AdminPage() {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        setFlaggedPosts(data.flaggedPosts);
        setPendingReports(data.pendingReports);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAction(action: string, payload: Record<string, string>) {
    try {
      const res = await authFetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) throw new Error("Action failed");
      toast({ title: "Success", description: `Action ${action} completed.` });
      loadData();
    } catch {
      toast({ title: "Error", description: "Could not perform action.", variant: "destructive" });
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl w-full p-4 flex-1">
        <h1 className="text-2xl font-bold mb-6">Moderator Dashboard</h1>
        
        {loading ? (
          <p className="text-muted-foreground">Loading queue...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Flagged Posts */}
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Flagged Posts ({flaggedPosts.length})</h2>
              <div className="space-y-4">
                {flaggedPosts.length === 0 && <p className="text-sm text-muted-foreground">No flagged posts.</p>}
                {flaggedPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 shadow-sm bg-card">
                    <p className="text-sm mb-2">"{post.content}"</p>
                    <p className="text-xs text-muted-foreground mb-3">Author: {post.author.handle}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleAction("remove_post", { targetId: post.id })}>
                        Remove Post
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleAction("dismiss_flag", { targetId: post.id })}>
                        Dismiss
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAction("ban_user", { userId: post.author.id })}>
                        Ban User
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Reports */}
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Pending Reports ({pendingReports.length})</h2>
              <div className="space-y-4">
                {pendingReports.length === 0 && <p className="text-sm text-muted-foreground">No pending reports.</p>}
                {pendingReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 shadow-sm bg-card border-red-100">
                    <p className="text-xs text-red-600 font-semibold mb-1">Reason: {report.reason}</p>
                    <p className="text-xs text-muted-foreground mb-2">Reported by: {report.reporter.handle}</p>
                    
                    {report.post && (
                      <div className="bg-muted p-2 rounded text-sm mb-3">
                        <span className="font-semibold text-xs uppercase mr-2">Post</span>
                        {report.post.content}
                      </div>
                    )}
                    {report.comment && (
                      <div className="bg-muted p-2 rounded text-sm mb-3">
                        <span className="font-semibold text-xs uppercase mr-2">Comment</span>
                        {report.comment.content}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {report.post && (
                        <Button size="sm" variant="destructive" onClick={() => handleAction("remove_post", { targetId: report.post!.id })}>
                          Remove Post
                        </Button>
                      )}
                      {report.comment && (
                        <Button size="sm" variant="destructive" onClick={() => handleAction("remove_comment", { targetId: report.comment!.id })}>
                          Remove Comment
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleAction("dismiss_report", { targetId: report.id })}>
                        Dismiss Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  );
}
