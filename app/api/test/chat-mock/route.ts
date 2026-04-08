import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  const scenario = url.searchParams.get("scenario");

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      switch (scenario) {
        case "tool-transition": {
          writer.write({
            type: "start",
            messageId: "assistant-tool-transition",
          });
          writer.write({
            type: "text-start",
            id: "text-1",
          });
          writer.write({
            type: "text-delta",
            id: "text-1",
            delta: "Checking the TIG polarity setup now.",
          });
          writer.write({
            type: "text-end",
            id: "text-1",
          });
          writer.write({
            type: "tool-input-available",
            toolCallId: "tool-1",
            toolName: "getPolaritySetup",
            providerExecuted: true,
            input: {
              process: "tig",
            },
          });
          await wait(1500);
          writer.write({
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
          });
          writer.write({
            type: "finish",
            finishReason: "stop",
          });
          break;
        }
        default: {
          writer.write({
            type: "start",
            messageId: "assistant-default",
          });
          writer.write({
            type: "text-start",
            id: "text-1",
          });
          writer.write({
            type: "text-delta",
            id: "text-1",
            delta: "No test scenario matched this request.",
          });
          writer.write({
            type: "text-end",
            id: "text-1",
          });
          writer.write({
            type: "finish",
            finishReason: "stop",
          });
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
