import { useContext, useCallback } from "react";
import { SocketContext } from "../contexts/socket-context";

export function useSocket() {
  const { socket, connected } = useContext(SocketContext);

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (socket && connected) {
        socket.emit("join_conversation", { conversationId });
      }
    },
    [socket, connected]
  );

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      if (socket && connected) {
        socket.emit("send_message", { conversationId, content });
      }
    },
    [socket, connected]
  );

  const startTyping = useCallback(
    (conversationId: string) => {
      if (socket && connected) {
        socket.emit("typing_start", { conversationId });
      }
    },
    [socket, connected]
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      if (socket && connected) {
        socket.emit("typing_stop", { conversationId });
      }
    },
    [socket, connected]
  );

  const onNewMessage = useCallback(
    (callback: (msg: any) => void) => {
      if (!socket) return () => {};
      const wrapper = ({ message }: { message: any }) => callback(message);
      socket.on("new_message", wrapper);
      return () => {
        socket.off("new_message", wrapper);
      };
    },
    [socket]
  );

  const onTyping = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return () => {};
      socket.on("user_typing", callback);
      return () => {
        socket.off("user_typing", callback);
      };
    },
    [socket]
  );

  const onStoppedTyping = useCallback(
    (callback: (data: any) => void) => {
      if (!socket) return () => {};
      socket.on("user_stopped_typing", callback);
      return () => {
        socket.off("user_stopped_typing", callback);
      };
    },
    [socket]
  );

  return {
    socket,
    connected,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    onNewMessage,
    onTyping,
    onStoppedTyping,
  };
}
