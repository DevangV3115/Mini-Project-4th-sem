// ✅ Firebase removed – temporary in-memory store

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  reasoning?: {
    id: number;
    label: string;
    content: string;
    status: string;
  }[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

let chats: ChatSession[] = [];

export async function createChat(userId: string, title: string, messages: ChatMessage[]) {
  const newChat: ChatSession = {
    id: Date.now().toString(),
    userId,
    title,
    messages,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  chats.push(newChat);
  return newChat.id;
}

export async function updateChat(chatId: string, messages: ChatMessage[]) {
  const chat = chats.find((c) => c.id === chatId);
  if (chat) {
    chat.messages = messages;
    chat.updatedAt = Date.now();
  }
}

export async function getUserChats(userId: string): Promise<ChatSession[]> {
  return chats
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}