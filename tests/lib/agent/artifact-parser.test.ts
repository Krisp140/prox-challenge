import { describe, expect, it } from "vitest";

import { parseArtifacts } from "@/lib/agent/artifact-parser";

describe("parseArtifacts", () => {
  it("returns a single text segment when no artifact tags exist", () => {
    expect(parseArtifacts("Plain answer only.")).toEqual([
      {
        kind: "text",
        content: "Plain answer only.",
      },
    ]);
  });

  it("splits text and artifact segments in order", () => {
    const segments = parseArtifacts(
      [
        "Use DCEN for TIG.",
        '<antArtifact type="svg" title="TIG Setup">',
        "<svg><text>TIG</text></svg>",
        "</antArtifact>",
        "Always secure the gas cylinder.",
      ].join(""),
    );

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({
      kind: "text",
      content: "Use DCEN for TIG.",
    });
    expect(segments[1]).toMatchObject({
      kind: "artifact",
      artifact: {
        type: "svg",
        title: "TIG Setup",
        content: "<svg><text>TIG</text></svg>",
      },
    });
    expect(segments[2]).toEqual({
      kind: "text",
      content: "Always secure the gas cylinder.",
    });
  });

  it("preserves arbitrary artifact attributes for downstream renderers", () => {
    const segments = parseArtifacts(
      '<antArtifact identifier="page-24" type="manual-image" title="TIG Setup" src="/manual-pages/owner-manual-p24.png" page="Owner manual page 24">/manual-pages/owner-manual-p24.png</antArtifact>',
    );

    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      kind: "artifact",
      artifact: {
        identifier: "page-24",
        type: "manual-image",
        title: "TIG Setup",
        attributes: {
          src: "/manual-pages/owner-manual-p24.png",
          page: "Owner manual page 24",
        },
      },
    });
  });

  it("keeps an unclosed artifact pending while incomplete artifacts are disallowed", () => {
    const segments = parseArtifacts(
      [
        'Before the calculator.',
        '<antArtifact type="react" title="Duty Cycle Calculator">',
        "function Artifact() {",
        "  return <div>Chart with enough generated code to exceed the parser threshold while streaming.</div>;",
        "}",
      ].join(""),
      { allowIncompleteArtifacts: false },
    );

    expect(segments).toEqual([
      {
        kind: "text",
        content: "Before the calculator.",
      },
      {
        kind: "pending",
        title: "Duty Cycle Calculator",
        type: "react",
      },
    ]);
  });
});
