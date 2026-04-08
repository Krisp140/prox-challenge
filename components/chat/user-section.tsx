"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

type UserSectionProps = {
  session: Session;
};

export function UserSection({ session }: UserSectionProps) {
  const user = session.user;

  return (
    <div className="flex items-center gap-3">
      {user?.image ? (
        <img
          src={user.image}
          alt=""
          width={32}
          height={32}
          className="shrink-0 rounded-full"
          style={{ border: "1px solid var(--border)" }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono-display text-[11px] font-medium uppercase"
          style={{ background: "var(--accent)", color: "var(--bg)" }}
        >
          {user?.name?.charAt(0) || "?"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="truncate font-mono-display text-[11px] font-medium"
          style={{ color: "var(--text)" }}
        >
          {user?.name || "User"}
        </p>
        <button
          onClick={() => signOut()}
          className="font-mono-display text-[9px] tracking-[0.12em] uppercase transition-colors hover:underline"
          style={{ color: "var(--text-dim)" }}
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
