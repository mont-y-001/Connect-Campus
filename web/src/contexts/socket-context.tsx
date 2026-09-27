"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";
import { getClientSocketUrl } from "@/lib/socket-url";

type SocketContextType = {
  socket: Socket | null;
  connected: boolean;
  joinConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  onNewMessage: (callback: (data: any) => void) => () => void;
  onTyping: (callback: (data: any) => void) => () => void;
  onStoppedTyping: (callback: (data: any) => void) => () => void;
};

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  joinConversation: () => {},
  sendMessage: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  onNewMessage: () => () => {},
  onTyping: () => () => {},
  onStoppedTyping: () => () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      return;
    }

    let active = true;

    async function connect() {
      const socketUrl = getClientSocketUrl();
      if (!socketUrl) {
        setConnected(false);
        return;
      }

      const tokenRes = await fetch("/api/auth/socket-token", {
        credentials: "include",
      });
      if (!active) return;

      if (!tokenRes.ok) {
        setConnected(false);
        return;
      }

      const { token } = await tokenRes.json();
      const socketInstance = io(socketUrl, {
        auth: { token },
        withCredentials: true,
      });

      socketInstance.on("connect", () => setConnected(true));
      socketInstance.on("disconnect", () => setConnected(false));
      socketInstance.on("connect_error", () => setConnected(false));

      socketRef.current = socketInstance;
      setSocket(socketInstance);
    }

    connect();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [userId]);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("join_conversation", { conversationId });
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit("send_message", { conversationId, content });
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing_start", { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing_stop", { conversationId });
  }, []);

  const onNewMessage = useCallback((callback: (data: any) => void) => {
    const handler = (data: any) => callback(data);
    socketRef.current?.on("new_message", handler);
    return () => {
      socketRef.current?.off("new_message", handler);
    };
  }, []);

  const onTyping = useCallback((callback: (data: any) => void) => {
    const handler = (data: any) => callback(data);
    socketRef.current?.on("user_typing", handler);
    return () => {
      socketRef.current?.off("user_typing", handler);
    };
  }, []);

  const onStoppedTyping = useCallback((callback: (data: any) => void) => {
    const handler = (data: any) => callback(data);
    socketRef.current?.on("user_stopped_typing", handler);
    return () => {
      socketRef.current?.off("user_stopped_typing", handler);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinConversation,
        sendMessage,
        startTyping,
        stopTyping,
        onNewMessage,
        onTyping,
        onStoppedTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }

  return context;
}
