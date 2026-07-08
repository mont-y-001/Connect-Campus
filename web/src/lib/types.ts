export type PublicUser = {
  id: string;
  handle: string;
  college: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
};

export type PostFeedItem = {
  id: string;
  content: string;
  imageUrl: string | null;
  college: string | null;
  createdAt: string;
  authorHandle: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

export type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  authorHandle: string;
};

export type NotificationItem = {
  id: string;
  type: "LIKE" | "COMMENT" | "MENTION" | "MESSAGE";
  message: string;
  isRead: boolean;
  createdAt: string;
  postId: string | null;
};

export type ConversationItem = {
  id: string;
  otherHandle: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type MessageItem = {
  id: string;
  content: string;
  createdAt: string;
  senderHandle: string;
  isMine: boolean;
  readAt: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  college: string | null;
  creatorHandle: string;
  rsvpCount: number;
  rsvpedByMe: boolean;
};
