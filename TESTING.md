# Testing Guide

This app has four distinct layers worth testing:

1. `POST /api/chat` orchestration
2. The six agent tools in `lib/agent/tools.ts`
3. UI behavior that sends prompts and renders streamed content
4. Browser behavior that submits a query and consumes the AI SDK UI-message stream

## Workflow Under Test

The runtime flow is:

1. The user submits a prompt from `ChatInput`.
2. `useChat()` posts UI messages to `POST /api/chat`.
3. The route converts UI messages into model messages.
4. `streamText()` runs with:
   - `systemPrompt`
   - Anthropic model selection
   - the full `tools` registry
   - `stepCountIs(5)` as the tool-step cap
5. The model chooses a tool when it needs exact data.
6. Each tool validates its input with Zod and returns a structured payload.
7. The UI renders normal text, tool cards, and parsed `<antArtifact>` blocks.

## How To Call Each Tool In Tests

In production, the model calls the tools automatically through `streamText()`.
In tests, call the tool directly:

```ts
const result = await tools.lookupSpecifications.execute?.({
  process: "mig",
  voltage: "240V",
});
```

Then validate the payload with the matching contract in `tests/contracts/tool-contracts.ts`:

```ts
toolContracts.lookupSpecifications.output.parse(result);
```

That gives you two checks:

- the sample input is valid for the real tool schema
- the returned payload still matches the app's expected shape

## Current Test Files

- `tests/app/api/chat/route.test.ts`: verifies route wiring, env guardrails, and stream configuration
- `tests/lib/agent/tools.test.ts`: validates the six tools plus key edge cases
- `tests/lib/agent/artifact-parser.test.ts`: verifies `<antArtifact>` parsing
- `tests/components/chat/chat-input.test.tsx`: verifies prompt submission and stop behavior
- `tests/components/chat/message-bubble.test.tsx`: verifies tool output cards and artifact handoff from assistant messages
- `tests/components/artifacts/artifact-renderer.test.tsx`: verifies manual-image and fallback artifact rendering
- `tests/components/artifacts/svg-artifact.test.tsx`: verifies SVG sanitization and image-pass success/disabled states
- `tests/e2e/chat-tool-rendering.spec.ts`: submits a known TIG polarity question and verifies the rendered tool result in the browser
- `tests/e2e/chat-artifact-rendering.spec.ts`: submits a manual-page request and verifies the assistant-rendered artifact in the browser
- `tests/e2e/chat-tool-streaming.spec.ts`: verifies a streamed tool state transition from `input-available` to `output-available`
- `tests/contracts/tool-contracts.ts`: reusable input/output contracts for each tool
- `playwright.config.ts`: browser test config with a local Next.js dev server

## Commands

```bash
npx playwright install chromium # first-time browser setup
npm test
npm run test:run
npm run test:coverage
npm run test:e2e
```

## E2E Strategy

The browser test intercepts `POST /api/chat` and returns a real AI SDK UI-message SSE stream.
That keeps the test deterministic and offline while still exercising:

1. prompt submission from the browser
2. `useChat()` request wiring
3. SSE stream parsing on the client
4. `MessageBubble` rendering for assistant text, tool parts, and artifacts
5. streamed UI state transitions using `app/api/test/chat-mock/route.ts` for deterministic delayed chunks
