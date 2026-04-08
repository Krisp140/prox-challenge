"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import type { ChatListItem } from "@/lib/hooks/use-chat-list";

type ChatHistoryListProps = {
  chats: ChatListItem[];
  activeChatId?: string;
  onDeleted: () => void;
};

export function ChatHistoryList({ chats, activeChatId, onDeleted }: ChatHistoryListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(chatId: string) {
    if (!confirm("Delete this chat?")) return;

    setDeletingId(chatId);
    try {
      const response = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (response.ok) {
        onDeleted();
        if (chatId === activeChatId) {
          router.push("/");
        }
      }
    } catch (err) {
      console.error("[chat-history] Delete failed", err);
    } finally {
      setDeletingId(null);
    }
  }

  if (chats.length === 0) {
    return (
      <p
        className="px-1 font-mono-display text-[10px] leading-relaxed"
        style={{ color: "var(--text-dim)" }}
      >
        No chats yet. Start a conversation and it will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {chats.map((chat) => {
        const isActive = chat.id === activeChatId;

        return (
          <div
            key={chat.id}
            className="group relative flex items-start gap-2 rounded-sm px-2.5 py-2 transition-colors"
            style={{
              background: isActive ? "var(--bg-hover)" : "transparent",
              borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            <Link
              href={`/chat/${chat.id}`}
              className="min-w-0 flex-1"
            >
              <p
                className="truncate font-mono-display text-[11px] font-medium leading-tight"
                style={{ color: isActive ? "var(--accent-light)" : "var(--text-muted)" }}
              >
                {chat.title}
              </p>
              <p
                className="mt-0.5 font-mono-display text-[9px]"
                style={{ color: "var(--text-dim)" }}
              >
                {formatRelativeDate(chat.updatedAt)}
              </p>
            </Link>
            <button
              onClick={() => handleDelete(chat.id)}
              disabled={deletingId === chat.id}
              className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: "var(--text-dim)" }}
              title="Delete chat"
            >
              <Trash2 size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
