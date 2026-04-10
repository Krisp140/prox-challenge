import { describe, expect, it } from "vitest";

import {
  createArtifactDocument,
  normalizeArtifactSource,
} from "@/components/artifacts/react-artifact";

describe("normalizeArtifactSource", () => {
  it("rewrites common react and recharts imports into sandbox locals", () => {
    const normalized = normalizeArtifactSource([
      'import React, { useMemo as useMemoHook, useState } from "react";',
      'import { LineChart, Line, XAxis } from "recharts";',
      'import { createRoot } from "react-dom/client";',
      "export function Artifact() {",
      "  const [count] = useState(1);",
      "  const value = useMemoHook(() => count, [count]);",
      "  return <LineChart><Line dataKey=\"value\" /><XAxis dataKey=\"label\" /></LineChart>;",
      "}",
    ].join("\n"));

    expect(normalized).toContain("const React = __ReactLib;");
    expect(normalized).toContain("const { useMemo: useMemoHook, useState } = __ReactLib;");
    expect(normalized).toContain("const { LineChart, Line, XAxis } = __RechartsLib;");
    expect(normalized).toContain("const { createRoot } = __ReactDomClientLib;");
    expect(normalized).toContain("function Artifact() {");
    expect(normalized).not.toContain('import React');
    expect(normalized).not.toContain("export function Artifact");
  });

  it("removes export default Artifact lines after normalization", () => {
    const normalized = normalizeArtifactSource([
      "const helper = 1;",
      "function Artifact() {",
      "  return <div>{helper}</div>;",
      "}",
      "export default Artifact;",
    ].join("\n"));

    expect(normalized).toContain("function Artifact()");
    expect(normalized).not.toContain("export default Artifact");
  });

  it("normalizes async default Artifact exports", () => {
    const normalized = normalizeArtifactSource([
      "export default async function Artifact() {",
      "  return <div>Async artifact</div>;",
      "}",
    ].join("\n"));

    expect(normalized).toContain("async function Artifact()");
    expect(normalized).not.toContain("export default async function Artifact");
  });

  it("turns unsupported imports into a clear runtime error", () => {
    const normalized = normalizeArtifactSource([
      'import { motion } from "framer-motion";',
      "function Artifact() {",
      "  return <div>Unsupported import</div>;",
      "}",
    ].join("\n"));

    expect(normalized).toContain('throw new Error("Unsupported import from \\"framer-motion\\".');
    expect(normalized).not.toContain('import { motion } from "framer-motion";');
  });

  it("can evaluate normalized react imports without colliding with JSX React scope", () => {
    const originalReact = (globalThis as { React?: unknown }).React;
    const reactStub = { createElement: () => null };
    (globalThis as { React?: unknown }).React = reactStub;

    try {
      const normalized = normalizeArtifactSource([
        'import React from "react";',
        "function Artifact() {",
        "  return React.createElement('div', null, 'ok');",
        "}",
      ].join("\n"));

      const Artifact = new Function(
        "__ReactLib",
        "__RechartsLib",
        "__ReactDomClientLib",
        `${normalized}; return typeof Artifact !== "undefined" ? Artifact : null;`,
      )(reactStub, {}, {});

      expect(typeof Artifact).toBe("function");
    } finally {
      (globalThis as { React?: unknown }).React = originalReact;
    }
  });

  it("uses a shared browser runtime for React and Recharts", () => {
    const doc = createArtifactDocument({
      identifier: "artifact-1",
      type: "react",
      title: "Runtime Check",
      content: "function Artifact() { return <div>ok</div>; }",
      attributes: {},
    });

    expect(doc).toContain("https://unpkg.com/react@18.3.1/umd/react.development.js");
    expect(doc).toContain("https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js");
    expect(doc).toContain("https://unpkg.com/react-is@18.3.1/umd/react-is.development.js");
    expect(doc).toContain("https://unpkg.com/prop-types@15.8.1/prop-types.js");
    expect(doc).toContain("https://unpkg.com/recharts@2.15.4/umd/Recharts.js");
    expect(doc).not.toContain("https://esm.sh/");
  });
});
