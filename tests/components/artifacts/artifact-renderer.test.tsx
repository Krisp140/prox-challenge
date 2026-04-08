import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockDynamicArtifactChild() {
      return <div data-testid="dynamic-artifact-child" />;
    },
}));

import { ArtifactRenderer } from "@/components/artifacts/artifact-renderer";

describe("ArtifactRenderer", () => {
  it("renders manual-image artifacts with their caption", () => {
    render(
      <ArtifactRenderer
        artifact={{
          identifier: "page-24",
          type: "manual-image",
          title: "TIG Setup",
          content: "/manual-pages/owner-manual-p24.png",
          attributes: {
            src: "/manual-pages/owner-manual-p24.png",
            page: "Owner manual page 24",
          },
        }}
      />,
    );

    expect(screen.getByText("MANUAL")).toBeInTheDocument();
    expect(screen.getByText("TIG Setup")).toBeInTheDocument();
    expect(screen.getByAltText("TIG Setup")).toHaveAttribute(
      "src",
      "/manual-pages/owner-manual-p24.png",
    );
    expect(screen.getByText("Owner manual page 24")).toBeInTheDocument();
  });

  it("falls back to raw content for unsupported artifact types", () => {
    render(
      <ArtifactRenderer
        artifact={{
          identifier: "code-1",
          type: "application/json",
          title: "Debug Payload",
          content: '{"ok":true}',
          attributes: {},
        }}
      />,
    );

    expect(screen.getByText("CODE")).toBeInTheDocument();
    expect(screen.getByText("Debug Payload")).toBeInTheDocument();
    expect(screen.getByText('{"ok":true}')).toBeInTheDocument();
  });
});
