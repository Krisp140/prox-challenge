"use client";

import dynamic from "next/dynamic";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";

import {
  parseArtifacts,
  type ArtifactSegment,
} from "@/lib/agent/artifact-parser";

const ArtifactRenderer = dynamic(
  () => import("@/components/artifacts/artifact-renderer").then((mod) => mod.ArtifactRenderer),
  {
    loading: () => (
      <div
        className="px-4 py-3 text-sm font-mono-display"
        style={{
          border: '1px solid var(--border-muted)',
          background: 'var(--bg-raised)',
          color: 'var(--text-muted)',
          borderRadius: '2px',
        }}
      >
        Loading artifact renderer…
      </div>
    ),
    ssr: false,
  },
);

type MessageBubbleProps = {
  message: UIMessage;
  isStreaming?: boolean;
};

type AnyPart = {
  type?: string;
  text?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  toolCallId?: string;
};

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const parts = (message.parts ?? []) as AnyPart[];
  const textContent = parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("");
  // Deduplicate tool parts: keep only the last (most complete) part per toolCallId
  const toolParts = deduplicateToolParts(
    parts.filter((part) => typeof part.type === "string" && part.type.startsWith("tool-")),
  );
  const parsedSegments = isUser
    ? ([{ kind: "text", content: textContent }] satisfies ArtifactSegment[])
    : parseArtifacts(textContent, { allowIncompleteArtifacts: !isStreaming });

  // Collect image paths already rendered by tool results to suppress duplicate manual-image artifacts
  const toolImagePaths = new Set(
    toolParts
      .map((p) => {
        if (p.output && typeof p.output === "object" && "imagePath" in p.output) {
          return (p.output as { imagePath: string }).imagePath;
        }
        return null;
      })
      .filter(Boolean),
  );

  return (
    <article
      className={isUser ? "msg-user" : "msg-agent"}
      style={{
        padding: '0',
        marginBottom: '2px',
      }}
    >
      {/* Message header row */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b"
        style={{
          borderColor: isUser ? 'rgba(232, 132, 10, 0.12)' : 'var(--border-muted)',
        }}
      >
        <span
          className={`led ${isUser ? 'led-orange' : 'led-green'}`}
          style={isUser ? {} : { animationDelay: '0.4s' }}
        />
        <span
          className="font-mono-display text-[10px] font-medium tracking-[0.18em] uppercase"
          style={{ color: isUser ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          {isUser ? "YOU" : "OMNIPRO AGENT"}
        </span>
        {!isUser && (
          <span
            className="ml-auto font-mono-display text-[9px] tracking-wider uppercase"
            style={{ color: 'var(--text-dim)' }}
          >
            CLAUDE-4
          </span>
        )}
      </div>

      {/* DEBUG: message structure dump — remove after diagnosing duplicate */}
      {!isUser && process.env.NODE_ENV === "development" && (
        <details
          className="font-mono-display"
          style={{
            margin: '8px 16px',
            padding: '8px',
            fontSize: '10px',
            lineHeight: '1.5',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-muted)',
            borderRadius: '2px',
            color: 'var(--text-muted)',
          }}
        >
          <summary style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--accent)' }}>
            DEBUG: {parts.length} parts, {parsedSegments.length} segments, {toolParts.length} toolParts
          </summary>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '6px', overflow: 'auto', maxHeight: '400px' }}>
            {JSON.stringify(
              {
                messageId: message.id,
                allParts: parts.map((p, i) => ({
                  idx: i,
                  type: p.type,
                  state: p.state,
                  toolCallId: p.toolCallId,
                  hasOutput: p.output !== undefined,
                  hasText: typeof p.text === 'string',
                  textPreview: typeof p.text === 'string' ? p.text.slice(0, 80) : undefined,
                  outputKeys: p.output && typeof p.output === 'object' ? Object.keys(p.output as Record<string, unknown>) : undefined,
                })),
                parsedSegments: parsedSegments.map((s, i) => ({
                  idx: i,
                  kind: s.kind,
                  ...(s.kind === 'text' ? { contentPreview: s.content.slice(0, 80) } : {}),
                  ...(s.kind === 'artifact' ? { artifactType: s.artifact.type, artifactTitle: s.artifact.title } : {}),
                  ...(s.kind === 'pending' ? { pendingTitle: s.title } : {}),
                })),
                dedupedToolParts: toolParts.map((p, i) => ({
                  idx: i,
                  type: p.type,
                  state: p.state,
                  toolCallId: p.toolCallId,
                  outputKeys: p.output && typeof p.output === 'object' ? Object.keys(p.output as Record<string, unknown>) : undefined,
                  hasImagePath: p.output && typeof p.output === 'object' && 'imagePath' in (p.output as Record<string, unknown>),
                })),
              },
              null,
              2,
            )}
          </pre>
        </details>
      )}

      {/* Message body */}
      <div className="px-4 py-4 space-y-4">
        {parsedSegments.map((segment, index) => {
          if (segment.kind === "text") {
            if (!segment.content.trim()) return null;
            if (isUser) {
              return (
                <p
                  key={`${message.id}-text-${index}`}
                  className="text-[15px] leading-7 whitespace-pre-wrap"
                  style={{ color: 'var(--text)' }}
                >
                  {segment.content.trim()}
                </p>
              );
            }
            return (
              <AgentMarkdown key={`${message.id}-text-${index}`} content={segment.content.trim()} />
            );
          }

          if (segment.kind === "pending") {
            return (
              <PendingArtifactCard
                key={`${message.id}-pending-${index}`}
                title={segment.title}
                type={segment.type}
              />
            );
          }

          // Skip manual-image artifacts whose image is already rendered by a tool result
          if (segment.artifact.type === "manual-image") {
            const src = segment.artifact.attributes.src ?? segment.artifact.content.trim();
            if (toolImagePaths.has(src)) return null;
          }

          return (
            <ArtifactRenderer
              artifact={segment.artifact}
              key={`${message.id}-artifact-${segment.artifact.identifier}-${index}`}
            />
          );
        })}

        {toolParts.map((part, index) => (
          <ToolPartCard key={`${message.id}-tool-${index}`} part={part} />
        ))}
      </div>
    </article>
  );
}

function ToolPartCard({ part }: { part: AnyPart }) {
  const toolName = (part.type ?? "").replace(/^tool-/, "");
  const output = part.output;
  const state = part.state ?? null;

  const baseStyle = {
    borderRadius: '2px',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '11px',
  };

  if (state === "input-streaming") {
    return (
      <div
        style={{
          ...baseStyle,
          border: '1px solid var(--border-muted)',
          background: 'var(--bg-raised)',
          padding: '10px 14px',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ color: 'var(--accent)' }}>◈</span> Preparing{' '}
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{toolName}</span>…
      </div>
    );
  }

  if (state === "input-available") {
    return (
      <div
        style={{
          ...baseStyle,
          border: '1px solid var(--border-muted)',
          background: 'var(--bg-raised)',
          padding: '10px 14px',
          color: 'var(--text-muted)',
        }}
      >
        <div>
          <span style={{ color: 'var(--accent)' }}>◈</span> Consulting manual —{' '}
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{toolName}</span>
        </div>
        {part.input ? (
          <pre
            style={{
              marginTop: '8px',
              padding: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-muted)',
              borderRadius: '2px',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: '10px',
              lineHeight: '1.6',
              color: 'var(--text-muted)',
            }}
          >
            {JSON.stringify(part.input, null, 2)}
          </pre>
        ) : null}
      </div>
    );
  }

  if (state === "output-error") {
    return (
      <div
        style={{
          ...baseStyle,
          border: '1px solid rgba(192, 57, 43, 0.3)',
          background: 'var(--red-dim)',
          padding: '10px 14px',
          color: '#E87272',
        }}
      >
        <p style={{ fontWeight: 500 }}>
          <span style={{ color: 'var(--red)' }}>ERR</span> Tool failed: {toolName}
        </p>
        <p style={{ marginTop: '4px', opacity: 0.9 }}>
          {part.errorText ?? "The tool did not return a usable result."}
        </p>
      </div>
    );
  }

  if (state === "output-denied") {
    return (
      <div
        style={{
          ...baseStyle,
          border: '1px solid rgba(230, 126, 34, 0.25)',
          background: 'rgba(230, 126, 34, 0.07)',
          padding: '10px 14px',
          color: '#E8A456',
        }}
      >
        <span style={{ color: 'var(--amber)' }}>DENY</span> Tool denied: {toolName}
      </div>
    );
  }

  if (!state && !output) {
    return (
      <div
        style={{
          ...baseStyle,
          border: '1px solid var(--border-muted)',
          background: 'var(--bg-raised)',
          padding: '10px 14px',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ color: 'var(--accent)' }}>◈</span> Queued: {toolName}
      </div>
    );
  }

  const manualPageOutput = asManualPageOutput(output);

  if (manualPageOutput) {
    return (
      <div
        style={{
          border: '1px solid var(--border-muted)',
          background: 'var(--bg-card)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <img
          alt={manualPageOutput.label ?? "Manual reference"}
          className="block w-full object-cover"
          src={manualPageOutput.imagePath}
        />
        <div
          style={{
            borderTop: '1px solid var(--border-muted)',
            padding: '8px 12px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>▸</span>{' '}
          {manualPageOutput.label ?? "Manual reference"}
        </div>
      </div>
    );
  }

  return (
    <details
      style={{
        ...baseStyle,
        border: '1px solid var(--border-muted)',
        background: 'var(--bg-raised)',
        padding: '10px 14px',
      }}
    >
      <summary
        style={{ cursor: 'pointer', color: 'var(--text-muted)', userSelect: 'none' }}
      >
        <span style={{ color: 'var(--accent)' }}>◈</span> Tool result: {toolName}
      </summary>
      <pre
        style={{
          marginTop: '8px',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          fontSize: '10px',
          lineHeight: '1.6',
          color: 'var(--text-muted)',
        }}
      >
        {JSON.stringify(output, null, 2)}
      </pre>
    </details>
  );
}

function PendingArtifactCard({ title, type }: { title: string; type: string }) {
  const typeLabel =
    type.includes("react") ? "INTERACTIVE" :
    type.includes("mermaid") ? "DIAGRAM" :
    type.includes("svg") ? "SVG" : "ARTIFACT";

  return (
    <div
      className="font-mono-display"
      style={{
        padding: '16px',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        {/* Animated spinner */}
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            border: '2px solid var(--border-mid)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'artifact-spin 0.8s linear infinite',
          }}
        />
        <span
          style={{
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: 'var(--accent)',
            padding: '2px 6px',
            border: '1px solid var(--border-mid)',
            background: 'var(--accent-tint)',
            borderRadius: '1px',
          }}
        >
          {typeLabel}
        </span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text)', margin: '0 0 2px 0' }}>
        {title}
      </p>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.08em' }}>
        Generating artifact…
      </p>
    </div>
  );
}

/** Keep only the last tool part per toolCallId — the AI SDK emits multiple
 *  parts (invocation + result) for the same call, and we only want one. */
function deduplicateToolParts(toolParts: AnyPart[]): AnyPart[] {
  const byId = new Map<string, AnyPart>();
  for (const part of toolParts) {
    const id = part.toolCallId ?? `anon-${byId.size}`;
    byId.set(id, part); // last one wins (most complete state)
  }
  return [...byId.values()];
}

function asManualPageOutput(output: unknown) {
  if (!output || typeof output !== "object") return null;
  if (!("imagePath" in output) || typeof output.imagePath !== "string") return null;
  const label = "label" in output && typeof output.label === "string" ? output.label : null;
  return { imagePath: output.imagePath, label };
}

/* ── Markdown renderer for agent messages ── */
function AgentMarkdown({ content }: { content: string }) {
  return (
    <div className="agent-prose">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p style={{ margin: '0 0 0.9em 0', fontSize: '15px', lineHeight: '1.75', color: 'var(--text)' }}>
              {children}
            </p>
          ),
          h1: ({ children }) => (
            <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '1.2em 0 0.4em', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '1.1em 0 0.35em', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-mono-display" style={{ fontSize: '11px', fontWeight: 500, color: 'var(--accent)', margin: '1em 0 0.3em', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: '0 0 0.9em 0', paddingLeft: '1.25em', listStyleType: 'none' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: '0 0 0.9em 0', paddingLeft: '1.5em' }}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => {
            const isOrdered = 'index' in props;
            return (
              <li style={{ margin: '0.2em 0', fontSize: '15px', lineHeight: '1.7', color: 'var(--text)', position: 'relative' }}>
                {!isOrdered && (
                  <span style={{ position: 'absolute', left: '-1.1em', color: 'var(--accent)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}>▸</span>
                )}
                {children}
              </li>
            );
          },
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code
                  className="font-mono-display"
                  style={{ display: 'block', fontSize: '12px', lineHeight: '1.65', color: 'var(--text-muted)' }}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="font-mono-display"
                style={{
                  fontSize: '12px',
                  padding: '1px 6px',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: '2px',
                  color: 'var(--accent-light)',
                }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              className="font-mono-display"
              style={{
                margin: '0 0 0.9em 0',
                padding: '12px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderLeft: '2px solid var(--border-mid)',
                borderRadius: '2px',
                overflowX: 'auto',
                fontSize: '12px',
                lineHeight: '1.65',
                color: 'var(--text-muted)',
              }}
            >
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: '0 0 0.9em 0',
                paddingLeft: '14px',
                borderLeft: '2px solid var(--border-mid)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{children}</em>
          ),
          hr: () => (
            <hr style={{ margin: '1em 0', border: 'none', borderTop: '1px solid var(--border-muted)' }} />
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '0 0 0.9em 0' }}>
              <table
                className="font-mono-display"
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ borderBottom: '1px solid var(--border-mid)' }}>{children}</thead>
          ),
          th: ({ children }) => (
            <th
              style={{
                padding: '6px 12px',
                textAlign: 'left',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontSize: '10px',
                color: 'var(--text-muted)',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: '6px 12px',
                borderBottom: '1px solid var(--border-muted)',
                color: 'var(--text)',
              }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
