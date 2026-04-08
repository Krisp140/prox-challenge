import { expect, test } from "@playwright/test";

test("shows a tool input state before the tool result arrives", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);

      if (url.endsWith("/api/chat")) {
        return originalFetch("/api/test/chat-mock?scenario=tool-transition", init);
      }

      return originalFetch(input, init);
    };
  });

  const warmup = await page.request.post("/api/test/chat-mock?scenario=tool-transition", {
    data: { messages: [] },
  });
  expect(warmup.ok()).toBeTruthy();
  await warmup.body();

  await page.goto("/");

  await page.getByLabel("Ask the Vulcan OmniPro 220 support agent a question").fill(
    "Can you check the TIG polarity setup?",
  );
  await page.getByRole("button", { name: "TRANSMIT →" }).click();

  await expect(page.getByText("Checking the TIG polarity setup now.", { exact: true })).toBeVisible();
  await expect(page.getByText("Consulting manual — getPolaritySetup")).toBeVisible();
  await expect(page.getByText('"process": "tig"', { exact: false })).toBeVisible();

  const assistantMessage = page.locator("article.msg-agent").last();

  const toolSummary = assistantMessage
    .locator("summary")
    .filter({ hasText: "Tool result: getPolaritySetup" });

  await expect(toolSummary).toBeVisible();
  await expect(assistantMessage.getByText("Consulting manual — getPolaritySetup")).not.toBeVisible();

  await toolSummary.click();

  await expect(assistantMessage.getByText('"polarity": "DCEN"')).toBeVisible();
  await expect(assistantMessage.getByText('"groundClampSocket": "positive"')).toBeVisible();
});
