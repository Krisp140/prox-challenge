"use client";

import dynamic from "next/dynamic";

import type { ParsedArtifact } from "@/lib/agent/artifact-parser";
import { SvgArtifact } from "./svg-artifact";

const ReactArtifact = dynamic(
  () => import("./react-artifact").then((mod) => mod.ReactArtifact),
  {
    loading: () => <ArtifactLoadingCard label="Loading interactive artifact…" />,
    ssr: false,
  },
);

const MermaidArtifact = dynamic(
  () => import("./mermaid-artifact").then((mod) => mod.MermaidArtifact),
  {
    loading: () => <ArtifactLoadingCard label="Loading diagram renderer…" />,
    ssr: false,
  },
);

type ArtifactRendererProps = {
  artifact: ParsedArtifact;
};

export function ArtifactRenderer({ artifact }: ArtifactRendererProps) {
  return (
    <section
      className="artifact-shell overflow-hidden"
      style={{ borderRadius: '2px' }}
    >
      {/* Artifact header bar */}
      <header
        className="flex items-center justify-between gap-4 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--border-muted)' }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="font-mono-display text-[9px] tracking-[0.2em] uppercase"
            style={{
              color: 'var(--accent)',
              padding: '2px 6px',
              border: '1px solid var(--border-mid)',
              background: 'var(--accent-tint)',
              borderRadius: '1px',
            }}
          >
            {typeLabel(artifact.type)}
          </span>
          <span
            className="font-mono-display text-[11px] font-medium"
            style={{ color: 'var(--text)' }}
          >
            {artifact.title || "Artifact"}
          </span>
        </div>
      </header>

      <div className="p-4">
        {artifact.type === "react" ? <ReactArtifact artifact={artifact} /> : null}
        {artifact.type === "mermaid" ? <MermaidArtifact artifact={artifact} /> : null}
        {artifact.type === "svg" ? <SvgArtifact artifact={artifact} /> : null}
        {artifact.type === "manual-image" ? <ManualImageArtifact artifact={artifact} /> : null}
        {!["react", "mermaid", "svg", "manual-image"].includes(artifact.type) ? (
          <pre
            className="font-mono-display overflow-x-auto whitespace-pre-wrap text-[12px] leading-6"
            style={{
              padding: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-muted)',
              borderRadius: '2px',
              color: 'var(--text-muted)',
            }}
          >
            {artifact.content}
          </pre>
        ) : null}
      </div>
    </section>
  );
}

function typeLabel(type: string): string {
  switch (type) {
    case "react": return "REACT";
    case "mermaid": return "DIAGRAM";
    case "svg": return "SVG";
    case "manual-image": return "MANUAL";
    default: return "CODE";
  }
}

function ArtifactLoadingCard({ label }: { label: string }) {
  return (
    <div
      className="font-mono-display text-[11px] p-4"
      style={{ color: 'var(--text-muted)' }}
    >
      <span style={{ color: 'var(--accent)' }}>◈</span> {label}
    </div>
  );
}

function ManualImageArtifact({ artifact }: ArtifactRendererProps) {
  const imagePath = artifact.attributes.src ?? artifact.content.trim();
  const caption = artifact.attributes.caption ?? artifact.attributes.page ?? "Manual reference";

  return (
    <figure
      className="overflow-hidden"
      style={{
        border: '1px solid var(--border-muted)',
        borderRadius: '2px',
        margin: 0,
      }}
    >
      <img
        alt={artifact.title || "Manual reference"}
        className="block w-full object-cover"
        src={imagePath}
      />
      <figcaption
        className="border-t font-mono-display text-[10px] tracking-[0.1em] px-3 py-2"
        style={{
          borderColor: 'var(--border-muted)',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ color: 'var(--accent)' }}>▸</span> {caption}
      </figcaption>
    </figure>
  );
}
