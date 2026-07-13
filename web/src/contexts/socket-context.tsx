"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";

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
  const { user } = useAuth(); // Assuming auth-context exists

  useEffect(() => {
    if (!user) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      setConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const joinConversation = (conversationId: string) => {
    socket?.emit("join_conversation", { conversationId });
  };

  const sendMessage = (conversationId: string, content: string) => {
    socket?.emit("send_message", { conversationId, content });
  };

  const startTyping = (conversationId: string) => {
    socket?.emit("typing_start", { conversationId });
  };

  const stopTyping = (conversationId: string) => {
    socket?.emit("typing_stop", { conversationId });
  };

  const onNewMessage = (callback: (data: any) => void) => {
    const handler = (data: any) => callback(data);
    socket?.on("new_message", handler);
    return () => {
      socket?.off("new_message", handler);
    };
  };

  const onTyping = (callback: (data: any) => void) => {
    const handler = (data: any) => callback(data);
    socket?.on("user_typing", handler);
    return () => {
      socket?.off("user_typing", handler);
    };
  };

  const onStoppedTyping = (callback: (data: any) => void) => {
    const handler = (data: any) => callback(data);
    socket?.on("user_stopped_typing", handler);
    return () => {
      socket?.off("user_stopped_typing", handler);
    };
  };

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


