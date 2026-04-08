"use client";

import { useState } from "react";

type ChatInputProps = {
  onSend: (text: string) => Promise<void>;
  onStop: () => void;
  status: string;
};

export function ChatInput({ onSend, onStop, status }: ChatInputProps) {
  const [value, setValue] = useState("");

  const isBusy = status === "submitted" || status === "streaming";

  async function submit() {
    const text = value.trim();
    if (!text || isBusy) return;
    setValue("");
    await onSend(text);
  }

  return (
    <div className="term-input" style={{ borderRadius: '3px', padding: '0' }}>
      {/* Terminal prompt row */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          className="font-mono-display text-[11px] font-medium select-none"
          style={{ color: 'var(--accent)', letterSpacing: '0.04em' }}
        >
          {isBusy ? '◈ ' : '>> '}
        </span>
        <span
          className="font-mono-display text-[10px] tracking-[0.14em] uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          {isBusy ? 'PROCESSING QUERY...' : 'ENTER QUERY'}
        </span>
        <span
          className="ml-auto font-mono-display text-[9px] tracking-wider uppercase"
          style={{ color: 'var(--text-dim)' }}
        >
          ↵ SEND · SHIFT+↵ NEWLINE
        </span>
      </div>

      {/* Textarea */}
      <textarea
        aria-label="Ask the Vulcan OmniPro 220 support agent a question"
        className="w-full resize-none outline-none font-mono-display"
        disabled={isBusy}
        placeholder="e.g. What polarity setup do I need for TIG welding, and can you show me the cable layout?"
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void submit();
          }
        }}
        style={{
          display: 'block',
          padding: '14px 16px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: 'var(--text)',
          background: 'transparent',
          border: 'none',
          width: '100%',
          opacity: isBusy ? 0.5 : 1,
        }}
      />

      {/* Action bar */}
      <div
        className="flex items-center justify-end gap-3 border-t px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        {isBusy ? (
          <button
            className="font-mono-display text-[11px] tracking-[0.14em] uppercase transition-opacity hover:opacity-80 active:opacity-60"
            onClick={onStop}
            type="button"
            style={{
              padding: '7px 16px',
              border: '1px solid rgba(232, 132, 10, 0.32)',
              background: 'rgba(232, 132, 10, 0.08)',
              color: 'var(--accent-light)',
              borderRadius: '2px',
              cursor: 'pointer',
              letterSpacing: '0.14em',
            }}
          >
            ■ STOP
          </button>
        ) : (
          <button
            className="font-mono-display text-[11px] tracking-[0.14em] uppercase font-medium transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-30"
            disabled={!value.trim()}
            onClick={() => void submit()}
            type="button"
            style={{
              padding: '7px 20px',
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              color: '#0A0907',
              borderRadius: '2px',
              cursor: value.trim() ? 'pointer' : 'not-allowed',
              letterSpacing: '0.14em',
              fontWeight: 700,
            }}
          >
            TRANSMIT →
          </button>
        )}
      </div>
    </div>
  );
}
