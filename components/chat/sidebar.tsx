"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Plus } from "lucide-react";

import { useChatList } from "@/lib/hooks/use-chat-list";
import { ChatHistoryList } from "./chat-history-list";
import { UserSection } from "./user-section";

type SidebarProps = {
  isBusy: boolean;
  activeChatId?: string;
  onNewChatCreated?: () => void;
};

export function Sidebar({ isBusy, activeChatId, onNewChatCreated }: SidebarProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated" && !!session;
  const { chats, isLoading, refresh } = useChatList(isAuthenticated);

  function handleNewChat() {
    onNewChatCreated?.();
  }

  return (
    <aside
      className="relative hidden w-[300px] shrink-0 border-r lg:flex lg:flex-col"
      style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
    >
      {/* Machine nameplate */}
      <div className="border-b px-5 pt-6 pb-5" style={{ borderColor: "var(--border)" }}>
        <p
          className="font-mono-display text-[10px] font-medium tracking-[0.22em] uppercase mb-1"
          style={{ color: "var(--accent)" }}
        >
          Vulcan
        </p>
        <h1
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}
        >
          OMNIPRO
          <br />
          <span style={{ color: "var(--accent)" }}>220</span>
        </h1>
        <p
          className="font-mono-display mt-2 text-[10px] tracking-[0.18em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          MULTIPROCESS WELDER
        </p>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2.5 border-b px-5 py-3" style={{ borderColor: "var(--border)" }}>
        <span className={`led ${isBusy ? "led-amber" : "led-green"}`} />
        <span
          className="font-mono-display text-[10px] tracking-[0.16em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          {isBusy ? "PROCESSING" : "READY"}
        </span>
        <span
          className="ml-auto font-mono-display text-[9px] tracking-wider uppercase"
          style={{ color: "var(--text-dim)" }}
        >
          CLAUDE-4
        </span>
      </div>

      {/* Auth-dependent section */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {isAuthenticated ? (
          <>
            <UserSection session={session} />

            <Link
              href="/"
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2 px-3 py-2 font-mono-display text-[10px] tracking-[0.12em] uppercase transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                borderRadius: "2px",
              }}
            >
              <Plus size={12} />
              New Chat
            </Link>

            <div>
              <div className="section-label mb-3">CHAT HISTORY</div>
              {isLoading ? (
                <p
                  className="font-mono-display text-[10px]"
                  style={{ color: "var(--text-dim)" }}
                >
                  Loading...
                </p>
              ) : (
                <ChatHistoryList
                  chats={chats}
                  activeChatId={activeChatId}
                  onDeleted={refresh}
                />
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="section-label mb-3">CHAT HISTORY</div>
              <p
                className="font-mono-display text-[10px] leading-relaxed mb-4"
                style={{ color: "var(--text-dim)" }}
              >
                Sign in to save your conversations and access them later.
              </p>
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex w-full items-center justify-center gap-2 px-3 py-2.5 font-mono-display text-[10px] tracking-[0.12em] uppercase transition-colors"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg)",
                  fontWeight: 600,
                  borderRadius: "2px",
                }}
              >
                Sign in with Google
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-5 py-3" style={{ borderColor: "var(--border)" }}>
        <p
          className="font-mono-display text-[9px] tracking-[0.14em] uppercase"
          style={{ color: "var(--text-dim)" }}
        >
          Prox Challenge Build · 2026
        </p>
      </div>
    </aside>
  );
}
