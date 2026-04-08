// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  anthropicMock,
  convertToModelMessagesMock,
  stepCountIsMock,
  streamTextMock,
} = vi.hoisted(() => ({
  anthropicMock: vi.fn(),
  convertToModelMessagesMock: vi.fn(),
  stepCountIsMock: vi.fn(),
  streamTextMock: vi.fn(),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: anthropicMock,
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    convertToModelMessages: convertToModelMessagesMock,
    stepCountIs: stepCountIsMock,
    streamText: streamTextMock,
  };
});

import { POST } from "@/app/api/chat/route";
import { systemPrompt } from "@/lib/agent/system-prompt";
import { tools } from "@/lib/agent/tools";

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns 500 when the Anthropic API key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Missing ANTHROPIC_API_KEY"),
    });
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON request bodies", async () => {
    await expect(
      POST(
        new Request("http://localhost/api/chat", {
          method: "POST",
          body: "{",
          headers: {
            "content-type": "application/json",
          },
        }),
      ),
    ).rejects.toThrow();

    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("wires the system prompt, tools, and stop condition into streamText", async () => {
    const uiResponse = new Response("stream ok");
    const toUIMessageStreamResponse = vi.fn().mockReturnValue(uiResponse);
    const stopWhen = Symbol("stopWhen");

    const messages = [
      {
        id: "user-1",
        role: "user",
        parts: [{ type: "text", text: "What polarity do I need for TIG?" }],
      },
    ];
    const modelMessages = [{ role: "user", content: [{ type: "text", text: "What polarity do I need for TIG?" }] }];

    anthropicMock.mockReturnValue("anthropic-model");
    convertToModelMessagesMock.mockResolvedValue(modelMessages);
    stepCountIsMock.mockReturnValue(stopWhen);
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse,
    });

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
      }),
    );

    expect(convertToModelMessagesMock).toHaveBeenCalledWith(messages);
    expect(anthropicMock).toHaveBeenCalledWith("claude-sonnet-4-20250514");
    expect(stepCountIsMock).toHaveBeenCalledWith(5);
    expect(streamTextMock).toHaveBeenCalledTimes(1);
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "anthropic-model",
        system: systemPrompt,
        messages: modelMessages,
        tools,
        stopWhen,
        temperature: 0.3,
        onStepFinish: expect.any(Function),
        onFinish: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(toUIMessageStreamResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        onError: expect.any(Function),
      }),
    );
    expect(response).toBe(uiResponse);
  });

  it("exposes an error serializer for UI stream failures", async () => {
    const uiResponse = new Response("stream ok");
    const toUIMessageStreamResponse = vi.fn().mockReturnValue(uiResponse);

    anthropicMock.mockReturnValue("anthropic-model");
    convertToModelMessagesMock.mockResolvedValue([]);
    stepCountIsMock.mockReturnValue(Symbol("stopWhen"));
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse,
    });

    await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      }),
    );

    const options = toUIMessageStreamResponse.mock.calls[0]?.[0] as {
      onError: (error: unknown) => string;
    };

    expect(options.onError(new Error("boom"))).toBe("boom");
    expect(options.onError("plain failure")).toBe("Unknown chat stream error");
  });
});
