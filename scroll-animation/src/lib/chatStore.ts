import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const CHATS = "chats";

export async function createChat(userId: string, title: string, messages: ChatMessage[]) {
  const ref = await addDoc(collection(db, CHATS), {
    userId,
    title,
    messages,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChat(chatId: string, messages: ChatMessage[]) {
  await updateDoc(doc(db, CHATS, chatId), {
    messages,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserChats(userId: string): Promise<ChatSession[]> {
  const q = query(
    collection(db, CHATS),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatSession));
}
