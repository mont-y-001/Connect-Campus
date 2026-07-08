import Link from "next/link";
import { MessageCircle, Shield, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="font-bold text-lg text-brand">Campus Connect</span>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground mb-6">
            <Sparkles className="h-4 w-4 text-brand" />
            Anonymous · Campus-only · Real-time
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Your campus.
            <br />
            <span className="text-brand">Your voice.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Campus Connect is the anonymous social app for Indian university students.
            Share memes, find events, and chat — all under a pseudonymous handle.
            No real names. No drama.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Join your campus</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">I have an account</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-5xl px-4 grid sm:grid-cols-3 gap-8">
            <Feature
              icon={<Users className="h-6 w-6 text-brand" />}
              title="Stay anonymous"
              description="Every user gets a random handle like QuietFalcon482. Your email stays private."
            />
            <Feature
              icon={<MessageCircle className="h-6 w-6 text-brand" />}
              title="Real-time chat"
              description="DM any student on campus. Typing indicators and instant delivery."
            />
            <Feature
              icon={<Shield className="h-6 w-6 text-brand" />}
              title="Community moderation"
              description="Report harmful content. Rule-based filters keep the feed clean."
            />
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Campus Connect · Built for Indian college campuses
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="mb-3 inline-flex rounded-lg bg-brand/10 p-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
