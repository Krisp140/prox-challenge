"use client";

import { useCallback, useEffect, useState } from "react";

export type ChatListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export function useChatList(enabled: boolean) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = (await response.json()) as ChatListItem[];
        setChats(data);
      }
    } catch (err) {
      console.error("[use-chat-list] Failed to fetch chats", err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { chats, isLoading, refresh };
}
