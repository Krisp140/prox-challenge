import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockDynamicArtifactRenderer(props: {
      artifact: { title: string; type: string; content: string };
    }) {
      return (
        <div data-testid="artifact-renderer">
          <span>{props.artifact.title}</span>
          <span>{props.artifact.type}</span>
          <span>{props.artifact.content}</span>
        </div>
      );
    },
}));

import { MessageBubble } from "@/components/chat/message-bubble";

describe("MessageBubble", () => {
  it("renders assistant artifact segments through the artifact renderer", () => {
    render(
      <MessageBubble
        message={
          {
            id: "assistant-1",
            role: "assistant",
            parts: [
              {
                type: "text",
                text: [
                  "Use the manual callout below.",
                  '<antArtifact identifier="page-24" type="manual-image" title="TIG Setup" src="/manual-pages/owner-manual-p24.png" page="Owner manual page 24">',
                  "/manual-pages/owner-manual-p24.png",
                  "</antArtifact>",
                ].join(""),
              },
            ],
          } as never
        }
      />,
    );

    expect(screen.getByText("Use the manual callout below.")).toBeInTheDocument();
    expect(screen.getByTestId("artifact-renderer")).toHaveTextContent("TIG Setup");
    expect(screen.getByTestId("artifact-renderer")).toHaveTextContent("manual-image");
    expect(screen.getByTestId("artifact-renderer")).toHaveTextContent(
      "/manual-pages/owner-manual-p24.png",
    );
  });

  it("renders manual page tool output as an image card", () => {
    render(
      <MessageBubble
        message={
          {
            id: "assistant-2",
            role: "assistant",
            parts: [
              {
                type: "tool-getManualPage",
                state: "output-available",
                toolCallId: "tool-1",
                input: { page: 24, source: "owner-manual" },
                output: {
                  source: "owner-manual",
                  page: 24,
                  label: "TIG setup and cable routing",
                  imagePath: "/manual-pages/owner-manual-p24.png",
                },
              },
            ],
          } as never
        }
      />,
    );

    expect(screen.getByText("TIG setup and cable routing")).toBeInTheDocument();
    expect(screen.getByAltText("TIG setup and cable routing")).toHaveAttribute(
      "src",
      "/manual-pages/owner-manual-p24.png",
    );
  });

  it("renders generic tool output details for non-image tools", () => {
    render(
      <MessageBubble
        message={
          {
            id: "assistant-3",
            role: "assistant",
            parts: [
              {
                type: "tool-getPolaritySetup",
                state: "output-available",
                toolCallId: "tool-2",
                input: { process: "tig" },
                output: {
                  polarity: "DCEN",
                  groundClampSocket: "positive",
                  leadSocket: "negative",
                },
              },
            ],
          } as never
        }
      />,
    );

    expect(screen.getByText("Tool result: getPolaritySetup")).toBeInTheDocument();
    expect(screen.getByText(/"polarity": "DCEN"/)).toBeInTheDocument();
    expect(screen.getByText(/"groundClampSocket": "positive"/)).toBeInTheDocument();
  });

  it("keeps a streaming react artifact pending until the closing tag arrives", () => {
    render(
      <MessageBubble
        isStreaming
        message={
          {
            id: "assistant-4",
            role: "assistant",
            parts: [
              {
                type: "text",
                text: [
                  "I am building the calculator now.",
                  '<antArtifact type="react" title="Duty Cycle Calculator">',
                  "function Artifact() {",
                  "  return <div>Enough generated code to exceed the incomplete artifact threshold while still streaming.</div>;",
                  "}",
                ].join(""),
              },
            ],
          } as never
        }
      />,
    );

    expect(screen.getByText("Generating artifact…")).toBeInTheDocument();
    expect(screen.getByText("Duty Cycle Calculator")).toBeInTheDocument();
    expect(screen.queryByTestId("artifact-renderer")).not.toBeInTheDocument();
  });
});
