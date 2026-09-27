"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatHandler;
const prisma_1 = require("../lib/prisma");
// Presence tracking is handled in separate handler
function chatHandler(io, socket) {
    const user = socket.user; // set by auth middleware
    // Join a conversation room
    socket.on("join_conversation", async (data) => {
        const { conversationId } = data;
        // Verify that the user is a participant of the conversation
        const conv = await prisma_1.prisma.conversation.findUnique({
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
    socket.on("send_message", async (data) => {
        const { conversationId, content } = data;
        // Persist message
        const message = await prisma_1.prisma.message.create({
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
        const conv = await prisma_1.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { participantAId: true, participantBId: true },
        });
        const recipientId = conv?.participantAId === user.userId ? conv?.participantBId : conv?.participantAId;
        if (recipientId) {
            await prisma_1.prisma.notification.create({
                data: {
                    type: "MESSAGE",
                    message: `${user.handle} sent you a message`,
                    recipientId,
                },
            });
        }
    });
    // Typing indicators
    socket.on("typing_start", (data) => {
        io.to(`conv_${data.conversationId}`).emit("user_typing", {
            handle: user.handle,
            conversationId: data.conversationId,
        });
    });
    socket.on("typing_stop", (data) => {
        io.to(`conv_${data.conversationId}`).emit("user_stopped_typing", {
            handle: user.handle,
            conversationId: data.conversationId,
        });
    });
}
