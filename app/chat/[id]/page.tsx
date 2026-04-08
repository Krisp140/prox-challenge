import { redirect, notFound } from "next/navigation";
import type { UIMessage } from "ai";

import { auth } from "@/lib/auth";
import { getChatWithMessages } from "@/lib/db/chat-repository";
import { ChatContainer } from "@/components/chat/chat-container";

type PageProps = { params: Promise<{ id: string }> };

export default async function ChatPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;
  const chat = await getChatWithMessages(id, session.user.id);

  if (!chat) {
    notFound();
  }

  const initialMessages: UIMessage[] = chat.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as UIMessage["role"],
    parts: msg.parts as UIMessage["parts"],
    createdAt: msg.createdAt,
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-3 py-3 sm:px-5 sm:py-5">
      <ChatContainer chatId={id} initialMessages={initialMessages} />
    </main>
  );
}
