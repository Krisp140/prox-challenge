"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

import type { ParsedArtifact } from "@/lib/agent/artifact-parser";

type MermaidArtifactProps = {
  artifact: ParsedArtifact;
};

export function MermaidArtifact({ artifact }: MermaidArtifactProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    let isMounted = true;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
    });

    mermaid
      .render(`mermaid-${id}`, artifact.content)
      .then((result) => {
        if (isMounted) {
          setSvg(result.svg);
          setError(null);
        }
      })
      .catch((renderError: unknown) => {
        if (isMounted) {
          setError(renderError instanceof Error ? renderError.message : "Mermaid render failed.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [artifact.content, id]);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4">
        <p className="mb-2 text-sm font-semibold text-rose-100">Unable to render diagram</p>
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-rose-50/90">
          {artifact.content}
        </pre>
        <p className="mt-3 text-xs text-rose-100/80">{error}</p>
      </div>
    );
  }

  if (!svg) {
    return <div className="rounded-2xl bg-white/4 p-4 text-sm text-slate-300">Rendering diagram…</div>;
  }

  return (
    <div
      className="overflow-x-auto rounded-2xl bg-white p-4 text-slate-950"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

