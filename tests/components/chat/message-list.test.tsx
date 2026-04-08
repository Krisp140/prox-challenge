import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { MessageList } from "@/components/chat/message-list";

describe("MessageList", () => {
  it("keeps the last streaming assistant artifact pending until the artifact closes", () => {
    render(
      <MessageList
        status="streaming"
        messages={[
          {
            id: "assistant-streaming",
            role: "assistant",
            parts: [
              {
                type: "text",
                text: [
                  "Building your calculator.",
                  '<antArtifact type="react" title="Duty Cycle Calculator">',
                  "function Artifact() {",
                  "  return <div>Enough generated code to cross the parser threshold before the artifact closes.</div>;",
                  "}",
                ].join(""),
              },
            ],
          } as never,
        ]}
      />,
    );

    expect(screen.getByText("Generating artifact…")).toBeInTheDocument();
    expect(screen.getByText("Duty Cycle Calculator")).toBeInTheDocument();
    expect(screen.queryByText("View artifact source")).not.toBeInTheDocument();
  });
});
