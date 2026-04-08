import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { auth } from "@/lib/auth";
import { systemPrompt } from "@/lib/agent/system-prompt";
import { tools } from "@/lib/agent/tools";
import {
  createChat,
  getChatMessageCount,
  saveMessages,
} from "@/lib/db/chat-repository";

export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(`[chat:${requestId}] Missing ANTHROPIC_API_KEY`);
    return new Response(
      JSON.stringify({
        error: "Missing ANTHROPIC_API_KEY. Add it to your .env file before starting the chat route.",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }

  let userId: string | undefined;
  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch (err) {
    console.warn(`[chat:${requestId}] Auth check failed, proceeding without auth`, err);
  }

  const body = (await request.json()) as {
    messages?: UIMessage[];
    chatId?: string;
  };
  const messages = body.messages ?? [];
  let chatId = body.chatId ?? null;
  const modelMessages = await convertToModelMessages(messages);

  console.log(`[chat:${requestId}] POST /api/chat`, {
    uiMessages: messages.length,
    modelMessages: modelMessages.length,
    authenticated: !!userId,
    chatId,
    lastUiMessage: summarizeUiMessage(messages.at(-1)),
  });

  // If authenticated, handle chat persistence
  if (userId) {
    try {
      // Create new chat if no chatId provided
      if (!chatId) {
        const firstUserMessage = messages.find((m) => m.role === "user");
        const textPart = firstUserMessage?.parts.find(
          (p): p is { type: "text"; text: string } => p.type === "text",
        );
        const title = textPart?.text.slice(0, 80) || "New chat";
        const chat = await createChat(userId, title);
        chatId = chat.id;
      }

      // Save the latest user message
      const existingCount = await getChatMessageCount(chatId);
      const newMessages = messages.slice(existingCount);
      if (newMessages.length > 0) {
        await saveMessages(
          chatId,
          newMessages.map((m) => ({ role: m.role, parts: m.parts })),
        );
      }
    } catch (err) {
      console.error(`[chat:${requestId}] DB persistence error (pre-stream)`, err);
      // Continue streaming even if persistence fails
    }
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    temperature: 0.3,
    onStepFinish(event) {
      console.log(`[chat:${requestId}] step finished`, {
        finishReason: event.finishReason,
        toolCalls: event.toolCalls.map((toolCall) => ({
          toolName: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
        })),
        toolResults: event.toolResults.map((toolResult) => ({
          toolName: toolResult.toolName,
          toolCallId: toolResult.toolCallId,
          outputPreview: previewValue(toolResult.output),
        })),
        textLength: event.text.length,
      });
    },
    async onFinish(event) {
      console.log(`[chat:${requestId}] stream finished`, {
        finishReason: event.finishReason,
        steps: event.steps.length,
        textLength: event.text.length,
        totalUsage: event.totalUsage,
      });

      // Save assistant response to DB
      if (userId && chatId) {
        try {
          await saveMessages(chatId, [
            { role: "assistant", parts: event.response.messages.at(-1)?.content ?? [] },
          ]);
        } catch (err) {
          console.error(`[chat:${requestId}] DB persistence error (onFinish)`, err);
        }
      }
    },
    onError(event) {
      console.error(`[chat:${requestId}] stream error`, event.error);
    },
  });

  const response = result.toUIMessageStreamResponse({
    onError(error) {
      console.error(`[chat:${requestId}] UI stream error`, error);
      return error instanceof Error ? error.message : "Unknown chat stream error";
    },
  });

  // Attach chatId header so the client can update the URL
  if (chatId) {
    response.headers.set("X-Chat-Id", chatId);
  }

  return response;
}

function summarizeUiMessage(message: UIMessage | undefined) {
  if (!message) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    parts: message.parts.map((part) => {
      const candidate = part as {
        type?: string;
        state?: string;
        text?: string;
        toolCallId?: string;
        input?: unknown;
        output?: unknown;
      };

      return {
        type: candidate.type,
        state: candidate.state,
        toolCallId: candidate.toolCallId,
        textLength: typeof candidate.text === "string" ? candidate.text.length : undefined,
        inputPreview: previewValue(candidate.input),
        outputPreview: previewValue(candidate.output),
      };
    }),
  };
}

function previewValue(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 240 ? `${serialized.slice(0, 240)}…` : serialized;
  } catch {
    return String(value);
  }
}
