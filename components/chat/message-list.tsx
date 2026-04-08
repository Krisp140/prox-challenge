"use client";

import type { UIMessage } from "ai";

import { MessageBubble } from "./message-bubble";

type MessageListProps = {
  messages: UIMessage[];
  status: string;
};

export function MessageList({ messages, status }: MessageListProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl">
        <div
          className="border-b mb-0"
          style={{ borderColor: 'var(--border)', height: '1px' }}
        />

        <div className="divide-y" style={{ '--tw-divide-opacity': '1' } as React.CSSProperties}>
          <style>{`.divide-y > * + * { border-top: 1px solid var(--border-muted); }`}</style>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={status === "streaming" && index === messages.length - 1 && message.role === "assistant"}
            />
          ))}
        </div>

        <div style={{ height: '48px' }} />
      </div>
    </div>
  );
}
