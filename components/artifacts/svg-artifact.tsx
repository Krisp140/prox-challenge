"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { ParsedArtifact } from "@/lib/agent/artifact-parser";

type SvgArtifactProps = {
  artifact: ParsedArtifact;
};

type ImagePassState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; dataUrl: string; mediaType: string; model?: string }
  | { status: "disabled" | "error"; message: string };

export function SvgArtifact({ artifact }: SvgArtifactProps) {
  const safeSvg = useMemo(
    () =>
      artifact.content
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ""),
    [artifact.content],
  );
  const [imagePass, setImagePass] = useState<ImagePassState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  const runImagePass = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setImagePass({ status: "loading" });

    try {
      const response = await fetch("/api/artifacts/image-pass", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: artifact.title, svg: safeSvg }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as {
        enabled?: boolean;
        error?: string;
        model?: string;
        image?: { dataUrl?: string; mediaType?: string };
      };

      if (controller.signal.aborted) return;

      if (payload.enabled === false) {
        setImagePass({ status: "disabled", message: payload.error ?? "Image pass is disabled." });
        return;
      }

      if (!response.ok || payload.error || !payload.image?.dataUrl) {
        setImagePass({ status: "error", message: payload.error ?? "Image pass did not return an image." });
        return;
      }

      setImagePass({
        status: "ready",
        dataUrl: payload.image.dataUrl,
        mediaType: payload.image.mediaType ?? "image/png",
        model: payload.model,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      setImagePass({ status: "error", message: error instanceof Error ? error.message : "Image pass failed." });
    }
  }, [artifact.title, safeSvg]);

  return (
    <div className="space-y-2">
      {imagePass.status === "idle" && (
        <button
          className="font-mono-display"
          onClick={() => void runImagePass()}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: 'var(--accent-light)',
            border: '1px solid var(--border-mid)',
            background: 'var(--accent-tint)',
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
        >
          <span style={{ fontSize: '12px' }}>◈</span>
          Generate illustration via Nano Banana
        </button>
      )}

      {imagePass.status === "loading" && (
        <div
          className="font-mono-display"
          style={{
            padding: '10px 14px',
            fontSize: '11px',
            border: '1px solid var(--border)',
            background: 'var(--accent-tint)',
            color: 'var(--accent-light)',
            borderRadius: '2px',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>◈</span>{' '}
          Running Nano Banana image pass…
        </div>
      )}

      {imagePass.status === "disabled" && (
        <div
          className="font-mono-display"
          style={{
            padding: '10px 14px',
            fontSize: '11px',
            border: '1px solid var(--border-muted)',
            background: 'var(--bg-raised)',
            color: 'var(--text-muted)',
            borderRadius: '2px',
          }}
        >
          Image pass skipped: {imagePass.message}
        </div>
      )}

      {imagePass.status === "error" && (
        <div className="space-y-2">
          <div
            className="font-mono-display"
            style={{
              padding: '10px 14px',
              fontSize: '11px',
              border: '1px solid rgba(192, 57, 43, 0.25)',
              background: 'var(--red-dim)',
              color: '#E87272',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: 'var(--red)' }}>ERR</span> {imagePass.message}
          </div>
          <button
            className="font-mono-display"
            onClick={() => void runImagePass()}
            type="button"
            style={{
              padding: '5px 12px',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: 'var(--text-muted)',
              border: '1px solid var(--border-muted)',
              background: 'var(--bg-card)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {imagePass.status === "ready" && (
        <figure
          style={{
            margin: 0,
            border: '1px solid var(--border-muted)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <img alt={`${artifact.title} — enhanced`} className="block w-full" src={imagePass.dataUrl} />
          <figcaption
            className="font-mono-display"
            style={{
              padding: '8px 12px',
              fontSize: '10px',
              borderTop: '1px solid var(--border-muted)',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            <span style={{ color: 'var(--accent)' }}>▸</span>{' '}
            Generated via {imagePass.model ?? "Replicate"} ({imagePass.mediaType})
          </figcaption>
        </figure>
      )}
    </div>
  );
}
