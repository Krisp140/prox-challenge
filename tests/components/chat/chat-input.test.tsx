import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChatInput } from "@/components/chat/chat-input";

describe("ChatInput", () => {
  it("sends the trimmed prompt on Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);

    render(React.createElement(ChatInput, { onSend, onStop: vi.fn(), status: "ready" }));

    const textbox = screen.getByLabelText("Ask the Vulcan OmniPro 220 support agent a question");
    await user.type(textbox, "  What polarity setup do I need for TIG?{enter}");

    expect(onSend).toHaveBeenCalledWith("What polarity setup do I need for TIG?");
  });

  it("keeps the send button disabled for blank input", () => {
    render(React.createElement(ChatInput, { onSend: vi.fn(), onStop: vi.fn(), status: "ready" }));

    expect(
      screen.getByRole("button", {
        name: "TRANSMIT →",
      }),
    ).toBeDisabled();
  });

  it("switches to a stop action while streaming", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();

    render(React.createElement(ChatInput, { onSend: vi.fn(), onStop, status: "streaming" }));

    const stopButton = screen.getByRole("button", {
      name: "■ STOP",
    });

    expect(stopButton).toBeInTheDocument();
    await user.click(stopButton);
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
