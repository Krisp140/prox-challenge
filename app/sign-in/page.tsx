"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
      <div
        className="mach-shell w-full max-w-sm px-8 py-10"
        style={{ borderRadius: "4px", background: "var(--bg-surface)" }}
      >
        <p
          className="font-mono-display text-[10px] font-medium tracking-[0.22em] uppercase mb-1"
          style={{ color: "var(--accent)" }}
        >
          Vulcan
        </p>
        <h1
          className="font-display leading-none tracking-tight mb-2"
          style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}
        >
          OMNIPRO <span style={{ color: "var(--accent)" }}>220</span>
        </h1>
        <p
          className="font-mono-display text-[10px] tracking-[0.18em] uppercase mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          SIGN IN TO SAVE CHAT HISTORY
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-3 px-4 py-3 font-mono-display text-[11px] tracking-[0.12em] uppercase transition-colors"
          style={{
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 600,
            borderRadius: "2px",
          }}
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <p
          className="mt-6 text-center font-mono-display text-[10px] leading-relaxed"
          style={{ color: "var(--text-dim)" }}
        >
          Sign in is optional. You can always chat without an account.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
