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

test("renders a manual-image artifact returned by the assistant", async ({ page }) => {
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
          messageId: "assistant-artifact-1",
        },
        {
          type: "text-start",
          id: "text-1",
        },
        {
          type: "text-delta",
          id: "text-1",
          delta: [
            "Here is the manual page that shows the TIG setup.",
            "",
            '<antArtifact identifier="page-24" type="manual-image" title="TIG Setup" src="/manual-pages/owner-manual-p24.png" page="Owner manual page 24">',
            "/manual-pages/owner-manual-p24.png",
            "</antArtifact>",
          ].join("\n"),
        },
        {
          type: "text-end",
          id: "text-1",
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
    "Show me the TIG setup manual page.",
  );
  await page.getByRole("button", { name: "TRANSMIT →" }).click();

  const assistantMessage = page.locator("article").nth(1);

  await expect(
    assistantMessage.getByText("Here is the manual page that shows the TIG setup.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Loading artifact renderer…")).not.toBeVisible();
  await expect(assistantMessage.getByText("MANUAL", { exact: true })).toBeVisible();

  const manualImage = assistantMessage.getByAltText("TIG Setup");
  await expect(manualImage).toBeVisible();
  await expect(manualImage).toHaveAttribute("src", "/manual-pages/owner-manual-p24.png");
  await expect(assistantMessage.getByText("Owner manual page 24")).toBeVisible();
});
