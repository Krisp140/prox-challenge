import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createChat, getUserChats } from "@/lib/db/chat-repository";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatList = await getUserChats(session.user.id);
  return NextResponse.json(chatList);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string };
  const title = body.title || "New chat";
  const chat = await createChat(session.user.id, title);
  return NextResponse.json(chat);
}
