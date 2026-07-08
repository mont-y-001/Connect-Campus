import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma";


// Presence tracking is handled in separate handler

export default function chatHandler(io: Server, socket: Socket) {
  const user = (socket as any).user; // set by auth middleware

  // Join a conversation room
  socket.on("join_conversation", async (data: { conversationId: string }) => {
    const { conversationId } = data;
    // Verify that the user is a participant of the conversation
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantAId: true, participantBId: true },
    });
    if (!conv || (conv.participantAId !== user.userId && conv.participantBId !== user.userId)) {
      socket.emit("error", { message: "Unauthorized to join this conversation" });
      return;
    }
    socket.join(`conv_${conversationId}`);
  });

  // Send a message
  socket.on("send_message", async (data: { conversationId: string; content: string }) => {
    const { conversationId, content } = data;
    // Persist message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: user.userId,
        conversationId,
      },
      include: { sender: { select: { handle: true } } }
    });

    // Emit to room
    io.to(`conv_${conversationId}`).emit("new_message", {
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        senderHandle: message.sender.handle,
        conversationId,
      },
    });

    // Create notification for the other participant
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantAId: true, participantBId: true },
    });
    const recipientId = conv?.participantAId === user.userId ? conv?.participantBId : conv?.participantAId;
    if (recipientId) {
      await prisma.notification.create({
        data: {
          type: "MESSAGE",
          message: `${user.handle} sent you a message`,
          recipientId,
        },
      });
    }
  });

  // Typing indicators
  socket.on("typing_start", (data: { conversationId: string }) => {
    io.to(`conv_${data.conversationId}`).emit("user_typing", {
      handle: user.handle,
      conversationId: data.conversationId,
    });
  });

  socket.on("typing_stop", (data: { conversationId: string }) => {
    io.to(`conv_${data.conversationId}`).emit("user_stopped_typing", {
      handle: user.handle,
      conversationId: data.conversationId,
    });
  });
}
