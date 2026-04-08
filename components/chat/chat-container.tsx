"use client";

import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from "ai";
import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "./sidebar";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { WelcomeScreen } from "./welcome-screen";

type ChatContainerProps = {
  chatId?: string;
  initialMessages?: UIMessage[];
};

export function ChatContainer({
  chatId: initialChatId,
  initialMessages,
}: ChatContainerProps) {
  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";
  const chatIdRef = useRef(initialChatId);

  const { messages, sendMessage, status, stop, error } = useChat({
    // Only include id/messages when they exist — passing `id: undefined`
    // causes useChat to recreate the Chat instance on every render,
    // killing any active stream.
    ...(initialChatId != null ? { id: initialChatId } : {}),
    ...(initialMessages != null ? { messages: initialMessages } : {}),
    sendAutomaticallyWhen({ messages: currentMessages }) {
      return lastAssistantMessageIsCompleteWithToolCalls({ messages: currentMessages });
    },
    onToolCall({ toolCall }) {
      console.debug("[chat-ui] onToolCall", toolCall);
    },
    onFinish(event) {
      console.debug("[chat-ui] onFinish", {
        finishReason: event.finishReason,
        message: summarizeMessage(event.message),
      });
    },
    onError(chatError) {
      console.error("[chat-ui] onError", chatError);
    },
  });

  useEffect(() => {
    console.debug("[chat-ui] state", { status, error: error?.message, messageCount: messages.length });
  }, [error, messages, status]);

  const isBusy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const handleSend = useCallback(
    async (text: string) => {
      await sendMessage(
        { text },
        { body: { chatId: chatIdRef.current } },
      );
    },
    [sendMessage],
  );

  function handleNewChat() {
    chatIdRef.current = undefined;
    window.location.href = "/";
  }

  // Poll for chatId after first response (authenticated new chats)
  useEffect(() => {
    if (!isAuthenticated || chatIdRef.current) return;
    if (status !== "ready" || messages.length < 2) return;

    // First exchange done — fetch the chatId from the server
    async function fetchChatId() {
      try {
        const res = await fetch("/api/chats");
        if (!res.ok) return;
        const chats = (await res.json()) as Array<{ id: string }>;
        if (chats.length > 0) {
          chatIdRef.current = chats[0].id;
          window.history.replaceState(null, "", `/chat/${chats[0].id}`);
        }
      } catch {
        // ignore
      }
    }
    fetchChatId();
  }, [isAuthenticated, status, messages.length]);

  return (
    <div className="mach-shell flex min-h-[calc(100vh-2rem)] flex-1 overflow-hidden" style={{ borderRadius: "4px" }}>
      <Sidebar
        isBusy={isBusy}
        activeChatId={chatIdRef.current}
        onNewChatCreated={handleNewChat}
      />

      {/* Main Chat Section */}
      <section className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--bg)" }}>
        {/* Header bar */}
        <div className="border-b px-4 py-3 sm:px-6" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="font-display text-[11px] tracking-[0.2em] uppercase"
                style={{ color: "var(--accent)", fontWeight: 700, letterSpacing: "0.2em" }}
              >
                OMNIPRO 220
              </span>
              <span className="font-mono-display text-[10px]" style={{ color: "var(--text-dim)" }}>//</span>
              <span
                className="font-mono-display text-[10px] tracking-[0.14em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                SUPPORT TERMINAL
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className={`led ${isBusy ? "led-amber" : "led-green"} lg:hidden`} />
              <span
                className="font-mono-display text-[9px] tracking-[0.16em] uppercase hidden sm:block"
                style={{ color: isBusy ? "var(--amber)" : "var(--text-muted)" }}
              >
                {isBusy ? "STREAMING" : "IDLE"}
              </span>
            </div>
          </div>
        </div>

        {/* Message area */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {hasMessages ? (
            <MessageList messages={messages} status={status} />
          ) : (
            <WelcomeScreen onSelectQuestion={handleSend} />
          )}
        </div>

        {/* Input area */}
        <div className="border-t px-4 py-4 sm:px-6" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
          {error ? (
            <div
              className="mb-3 px-4 py-3 text-sm font-mono-display"
              style={{
                border: "1px solid rgba(192, 57, 43, 0.3)",
                background: "var(--red-dim)",
                color: "#E87272",
                borderRadius: "2px",
              }}
            >
              <span style={{ color: "var(--red)", fontWeight: 500 }}>ERROR</span>{" "}
              {error.message}
            </div>
          ) : null}
          <ChatInput onSend={handleSend} onStop={stop} status={status} />
        </div>
      </section>
    </div>
  );
}

/* Debug helpers */
type DebugPart = {
  type?: string;
  text?: string;
  state?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function summarizeMessage(message: { id: string; role: string; parts?: unknown[] } | undefined) {
  if (!message) return null;
  return {
    id: message.id,
    role: message.role,
    parts: (message.parts ?? []).map((part) => {
      const p = part as DebugPart;
      return { type: p.type, state: p.state, textLength: typeof p.text === "string" ? p.text.length : undefined };
    }),
  };
}
