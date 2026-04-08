import { and, desc, eq } from "drizzle-orm";

import { db } from "./index";
import { chats, messages, type Chat, type Message } from "./schema";

export type ChatSummary = Pick<Chat, "id" | "title" | "updatedAt">;

export type ChatWithMessages = Chat & {
  messages: Message[];
};

export async function createChat(
  userId: string,
  title: string,
): Promise<Chat> {
  const [chat] = await db
    .insert(chats)
    .values({ userId, title })
    .returning();
  return chat;
}

export async function getUserChats(userId: string): Promise<ChatSummary[]> {
  return db
    .select({
      id: chats.id,
      title: chats.title,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

export async function getChatWithMessages(
  chatId: string,
  userId: string,
): Promise<ChatWithMessages | null> {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

  if (!chat) return null;

  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);

  return { ...chat, messages: chatMessages };
}

export async function saveMessages(
  chatId: string,
  newMessages: Array<{ role: string; parts: unknown }>,
): Promise<void> {
  if (newMessages.length === 0) return;

  await db.insert(messages).values(
    newMessages.map((msg) => ({
      chatId,
      role: msg.role,
      parts: msg.parts,
    })),
  );

  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId));
}

export async function updateChatTitle(
  chatId: string,
  title: string,
): Promise<void> {
  await db.update(chats).set({ title }).where(eq(chats.id, chatId));
}

export async function deleteChat(
  chatId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .returning({ id: chats.id });

  return result.length > 0;
}

export async function getChatMessageCount(chatId: string): Promise<number> {
  const result = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.chatId, chatId));

  return result.length;
}
