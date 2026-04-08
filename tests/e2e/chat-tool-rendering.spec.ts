import { expect, test } from "@playwright/test";

const UI_STREAM_HEADERS = {
  "content-type": "text/event-stream",
  "cache-control": "no-cache",
  connection: "keep-alive",
  "x-vercel-ai-ui-message-stream": "v1",
  "x-accel-buffering": "no",
};

function toSseBody(chunks: unknown[]) {
  return `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`;
}

test("submits a TIG polarity question and renders the tool result", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON() as {
      messages?: Array<{ parts?: Array<{ type?: string; text?: string }> }>;
    };
    const lastMessageText =
      body.messages
        ?.at(-1)
        ?.parts?.find((part) => part.type === "text")
        ?.text ?? "";

    expect(lastMessageText).toContain("TIG");

    await route.fulfill({
      status: 200,
      headers: UI_STREAM_HEADERS,
      body: toSseBody([
        {
          type: "start",
          messageId: "assistant-e2e-1",
        },
        {
          type: "text-start",
          id: "text-1",
        },
        {
          type: "text-delta",
          id: "text-1",
          delta:
            "Use DCEN for TIG. The torch lead goes to the negative socket and the ground clamp goes to the positive socket.",
        },
        {
          type: "text-end",
          id: "text-1",
        },
        {
          type: "tool-input-available",
          toolCallId: "tool-1",
          toolName: "getPolaritySetup",
          providerExecuted: true,
          input: {
            process: "tig",
          },
        },
        {
          type: "tool-output-available",
          toolCallId: "tool-1",
          providerExecuted: true,
          output: {
            polarity: "DCEN",
            summary: "TIG setup routes the torch negative and the ground clamp positive.",
            groundClampSocket: "positive",
            leadSocket: "negative",
            steps: [
              "Plug the ground clamp cable into the positive socket.",
              "Plug the TIG torch cable into the negative socket.",
            ],
          },
        },
        {
          type: "finish",
          finishReason: "stop",
        },
      ]),
    });
  });

  await page.goto("/");

  await page.getByLabel("Ask the Vulcan OmniPro 220 support agent a question").fill(
    "What polarity setup do I need for TIG welding?",
  );
  await page.getByRole("button", { name: "TRANSMIT →" }).click();

  const assistantMessage = page.locator("article").nth(1);

  await expect(
    assistantMessage.getByText(
      "Use DCEN for TIG. The torch lead goes to the negative socket and the ground clamp goes to the positive socket.",
    ),
  ).toBeVisible();

  const toolSummary = assistantMessage
    .locator("summary")
    .filter({ hasText: "Tool result: getPolaritySetup" });
  await expect(toolSummary).toBeVisible();
  await expect(page.getByRole("button", { name: "TRANSMIT →" })).toBeVisible();
  await toolSummary.click();

  await expect(assistantMessage.getByText('"polarity": "DCEN"')).toBeVisible();
  await expect(assistantMessage.getByText('"groundClampSocket": "positive"')).toBeVisible();
  await expect(assistantMessage.getByText('"leadSocket": "negative"')).toBeVisible();
});
