"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  Shield,
  Sun,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { useEffect, useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  if (!user) return null;

  const initials = user.handle.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/feed" className="font-bold text-lg text-brand">
          Campus Connect
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/feed" aria-label="Feed">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/messages" aria-label="Messages">
              <MessageCircle className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/events" aria-label="Events">
              <Calendar className="h-5 w-5" />
            </Link>
          </Button>
          {(user.role === "MODERATOR" || user.role === "ADMIN") && (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin" aria-label="Admin">
                <Shield className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2 ml-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-brand/10 text-brand">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium">
              {user.handle}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
