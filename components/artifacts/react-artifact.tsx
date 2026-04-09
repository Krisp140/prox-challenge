"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ParsedArtifact } from "@/lib/agent/artifact-parser";

type ReactArtifactProps = {
  artifact: ParsedArtifact;
};

export function ReactArtifact({ artifact }: ReactArtifactProps) {
  const [height, setHeight] = useState(220);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.source === iframeRef.current?.contentWindow &&
        event.data &&
        typeof event.data === "object" &&
        event.data.type === "artifact-height" &&
        event.data.identifier === artifact.identifier &&
        typeof event.data.height === "number"
      ) {
        setHeight(Math.max(120, Math.min(1400, event.data.height + 8)));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [artifact.identifier]);

  const srcDoc = useMemo(() => createArtifactDocument(artifact), [artifact]);

  return (
    <div className="space-y-3">
      <iframe
        className="w-full rounded-2xl border border-white/8 bg-white"
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin"
        srcDoc={srcDoc}
        style={{ height }}
        title={artifact.title || artifact.identifier}
      />
      <details className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-100">View artifact source</summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-300">
          {artifact.content}
        </pre>
      </details>
    </div>
  );
}

function createArtifactDocument(artifact: ParsedArtifact) {
  const code = JSON.stringify(normalizeArtifactSource(artifact.content));

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
      body {
        margin: 0;
        background: linear-gradient(180deg, #fff7ed, #ffffff);
        color: #0f172a;
        font-family: ui-sans-serif, system-ui, sans-serif;
      }

      #root { display: block; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      function publishHeight() {
        try {
          const root = document.getElementById("root");
          const measuredHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            root ? root.scrollHeight : 0,
          );
          parent.postMessage({
            type: "artifact-height",
            identifier: ${JSON.stringify(artifact.identifier)},
            height: measuredHeight,
          }, "*");
        } catch(_) {}
      }

      function showError(msg) {
        document.getElementById("root").innerHTML =
          '<div style="padding:24px;font-size:13px;color:#b91c1c;font-family:monospace">' +
          '<p style="font-weight:600;margin-bottom:8px">Artifact render failed</p>' +
          '<pre style="white-space:pre-wrap;background:#fef2f2;padding:12px;border-radius:8px;font-size:11px;line-height:1.6">' +
          msg + '</pre></div>';
        publishHeight();
      }
    </script>
    <script type="module">
      const source = ${code};

      try {
        if (typeof window.Babel === "undefined") throw new Error("Babel CDN failed to load");

        const [{ default: React }, { createRoot }, Recharts] = await Promise.all([
          import("https://esm.sh/react@19.2.0?target=es2022"),
          import("https://esm.sh/react-dom@19.2.0/client?target=es2022"),
          // Bundle Recharts to avoid flaky nested CDN dependency fetches in the iframe.
          import("https://esm.sh/recharts@2.15.4?bundle&target=es2022"),
        ]);

        // Expose globals for classic JSX output and artifacts that reference these libraries directly.
        window.React = React;
        window.Recharts = Recharts;
        window.ReactDOMClient = { createRoot };

        const root = createRoot(document.getElementById("root"));

        const transformed = window.Babel.transform(source, {
          presets: ["react"],
        }).code;

        const ArtifactComponent = new Function(
          "__ReactLib",
          "__RechartsLib",
          "__ReactDomClientLib",
          \`\${transformed};
           if (typeof Artifact !== "undefined") return Artifact;
           if (typeof App !== "undefined") return App;
           if (typeof Component !== "undefined") return Component;
           return null;\`,
        )(React, Recharts, { createRoot });

        if (!ArtifactComponent) {
          throw new Error("Artifact must define a top-level Artifact, App, or Component function.");
        }

        root.render(React.createElement(ArtifactComponent));

        const observer = new ResizeObserver(() => publishHeight());
        observer.observe(document.body);
        setTimeout(publishHeight, 80);
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    </script>
  </body>
</html>`;
}

export function normalizeArtifactSource(source: string): string {
  const prelude: string[] = [];
  const body: string[] = [];

  for (const line of source.split("\n")) {
    const trimmed = line.trim();

    if (/^import\s+type\b/.test(trimmed)) {
      continue;
    }

    const importMatch = trimmed.match(
      /^import\s+(.+?)\s+from\s+["']([^"']+)["'];?$/,
    );

    if (importMatch) {
      const [, rawSpecifiers, moduleName] = importMatch;
      const moduleVar = mapModuleVariable(moduleName);

      if (moduleVar) {
        const statements = buildImportPrelude(rawSpecifiers, moduleVar);
        if (statements.length > 0) {
          prelude.push(...statements);
        }
        continue;
      }

      prelude.push(
        `throw new Error(${JSON.stringify(
          `Unsupported import from "${moduleName}". React artifacts must be self-contained and may only import from react, recharts, or react-dom/client.`,
        )});`,
      );
      continue;
    }

    if (/^import\s+["'][^"']+["'];?$/.test(trimmed)) {
      continue;
    }

    body.push(line);
  }

  const normalizedBody = body
    .join("\n")
    // Strip export keywords from known component names
    .replace(/^\s*export\s+default\s+async\s+function\s+(Artifact|App|Component)\b/m, "async function $1")
    .replace(/^\s*export\s+default\s+function\s+(Artifact|App|Component)\b/m, "function $1")
    .replace(/^\s*export\s+function\s+(Artifact|App|Component)\b/m, "function $1")
    .replace(/^\s*export\s+(const|let|var)\s+(Artifact|App|Component)\b/m, "$1 $2")
    .replace(/^\s*export\s+default\s+(Artifact|App|Component)\s*;?\s*$/m, "")
    .replace(/^\s*export\s+\{[^}]*(Artifact|App|Component)[^}]*\}\s*;?\s*$/m, "");

  return prelude.length > 0
    ? `${prelude.join("\n")}\n${normalizedBody}`.trim()
    : normalizedBody.trim();
}

function mapModuleVariable(moduleName: string): string | null {
  if (moduleName === "react") return "__ReactLib";
  if (moduleName === "recharts") return "__RechartsLib";
  if (moduleName === "react-dom/client") return "__ReactDomClientLib";
  return null;
}

function buildImportPrelude(specifiers: string, moduleVar: string): string[] {
  const statements: string[] = [];
  const normalized = specifiers.trim();

  if (!normalized) return statements;

  if (normalized.startsWith("* as ")) {
    const alias = normalized.slice(5).trim();
    if (alias) statements.push(`const ${alias} = ${moduleVar};`);
    return statements;
  }

  const namedMatch = normalized.match(/^\{([^}]+)\}$/);
  if (namedMatch) {
    statements.push(buildNamedImportStatement(namedMatch[1] ?? "", moduleVar));
    return statements;
  }

  const defaultAndNamedMatch = normalized.match(/^([^,{]+),\s*\{([^}]+)\}$/);
  if (defaultAndNamedMatch) {
    const defaultImport = defaultAndNamedMatch[1]?.trim();
    const namedImports = defaultAndNamedMatch[2] ?? "";
    if (defaultImport) statements.push(`const ${defaultImport} = ${moduleVar};`);
    statements.push(buildNamedImportStatement(namedImports, moduleVar));
    return statements;
  }

  const defaultImport = normalized.trim();
  if (defaultImport) {
    statements.push(`const ${defaultImport} = ${moduleVar};`);
  }

  return statements;
}

function buildNamedImportStatement(namedImports: string, moduleVar: string): string {
  const members = namedImports
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/\s+as\s+/g, ": "));

  return `const { ${members.join(", ")} } = ${moduleVar};`;
}

