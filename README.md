# Vulcan OmniPro 220 — AI Support Agent

<img src="product.webp" alt="Vulcan OmniPro 220" width="400" /> <img src="product-inside.webp" alt="Vulcan OmniPro 220 — inside panel" width="400" />

**Live demo:** [your-deployed-url.vercel.app](https://your-deployed-url.vercel.app)

A multimodal AI support agent for the Vulcan OmniPro 220 multiprocess welder. Ask technical questions and get back streaming responses with interactive React calculators, Mermaid diagnostic flowcharts, actual manual page images, and contextual safety guidance — not just text.

---

## Quickstart

```bash
git clone <repo-url>
cd prox-challenge
cp .env.example .env   # Add your ANTHROPIC_API_KEY
npm install
npm run dev             # http://localhost:3000
```

That's it. The agent works immediately with just an Anthropic API key. Google OAuth and Postgres are optional for chat history persistence.

---

## Try These Prompts

| Prompt | What you'll see |
|--------|-----------------|
| "What's the duty cycle for MIG welding at 200A on 240V?" | Exact spec lookup: 25% @ 24V, 2.5 min weld / 7.5 min rest |
| "Compare MIG on 120V and 240V" | Interactive React artifact with side-by-side charts |
| "I'm getting porosity in my flux-cored welds" | Diagnostic Mermaid flowchart + manual-sourced causes/fixes |
| "What polarity setup do I need for TIG?" | Cable routing steps + actual manual page diagram |
| "Build a duty cycle calculator for validated MIG points" | Interactive React calculator with adjustable inputs |
| "Make a settings configurator for process, material, and thickness" | Interactive configurator with honest fallback when data isn't validated |

---

## Architecture

### Data Flow

```
User message → POST /api/chat
  → streamText() with system prompt + full knowledge base + 6 tools
  → Claude streams response with <antArtifact> tags
  → artifact-parser.ts splits text vs artifact blocks (handles partial streaming)
  → ArtifactRenderer routes to ReactArtifact | MermaidArtifact | ManualImage
  → Display in sandboxed iframe or inline
```

### No RAG — Full Context Injection

The entire validated knowledge base (`lib/knowledge/knowledge-base.json`) is JSON-stringified into the system prompt with **prompt caching** enabled. This eliminates retrieval errors entirely — the agent always has the complete manual context available. The trade-off is a larger initial prompt, but prompt caching makes subsequent messages cheap.

### Tools Enforce Numeric Accuracy

Six Zod-validated tools handle lookups that Claude might otherwise hallucinate. The agent calls a tool to get the **exact** number from the manual, then uses it in prose or artifacts. Tools are defined with strict schemas and contract-tested.

| Tool | Purpose |
|------|---------|
| `lookupSpecifications` | Specs by process + voltage (current range, power input, duty cycle table) |
| `getPolaritySetup` | Cable routing, socket assignments, setup steps + manual page image |
| `calculateDutyCycle` | Exact duty cycle match or 2 nearest validated points with weld/rest minutes |
| `getTroubleshooting` | Ranked causes + solutions from the manual's troubleshooting matrices |
| `getManualPage` | Surface actual manual page images by topic or page number |
| `getWeldSettings` | Validated weld settings lookup with honest fallback when data is incomplete |

### Visual-First Response Strategy

The system prompt instructs the agent to **prefer visuals over text** when data is involved:

- **Comparisons** (120V vs 240V, MIG vs TIG) → interactive React artifacts with charts
- **Troubleshooting** → Mermaid diagnostic flowcharts (symptom → checkpoints → fixes)
- **Calculations** (duty cycle, heat input) → interactive calculators
- **Setup procedures** → actual manual page images when available
- **Multi-point data** → charts and visual layouts, never plain text tables

The agent decides what visual fits the question — users don't need to know about artifact types.

### Artifact System

Artifacts use Claude's native `<antArtifact>` XML format. The streaming parser (`artifact-parser.ts`) handles incomplete tags during streaming, with a 60-character threshold to detect dropped closing tags.

| Type | Renderer | How it works |
|------|----------|-------------|
| React | `ReactArtifact` | Sandboxed iframe with Tailwind CSS, React 18, and Recharts loaded from CDN. No eval() in the main page. Babel transpiles JSX at runtime. |
| Mermaid | `MermaidArtifact` | Client-side Mermaid.js render for flowcharts, decision trees, and diagrams |
| Manual Image | `ManualImageArtifact` | Displays actual extracted PNG pages from the owner's manual with captions |

React artifacts go through a normalization pipeline that rewrites imports (`react`, `recharts`, `react-dom/client`) to sandbox globals and strips all `export` keywords so the code runs inside `new Function()`.

---

## Knowledge Base

`lib/knowledge/knowledge-base.json` contains structured, manually validated data extracted from the 48-page owner's manual:

- **Specifications** — Full spec tables for all 4 processes at both voltages (current range, power input, OCV, duty cycle points)
- **Polarity** — Per-process cable routing with socket assignments, setup steps, and manual page references
- **Troubleshooting** — Issue → causes → solutions matrices from the manual's troubleshooting section
- **Manual Pages** — Page-to-image mappings for 8 extracted PNG pages
- **Weld Settings** — Partially populated from owner-manual screenshots. The agent explicitly says when an exact validated row isn't available instead of inventing settings.

The `weldSettings` key is intentionally incomplete. The agent handles this gracefully — if a user asks for settings that haven't been validated, it says so plainly and shows what data it does have rather than hallucinating values.

---

## Testing

### Test Suite Overview

31 tests across 11 test files covering tools, API, parser, components, and E2E:

```bash
npm run test        # Vitest unit + integration tests
npm run test:e2e    # Playwright E2E tests
```

### Unit & Integration Tests (8 files)

**Tool contract tests** (`tests/lib/agent/tools.test.ts`)
- All 6 tools validated against Zod contracts with sample inputs
- Flux-cored → MIG spec normalization with explanatory note
- Exact duty cycle match: 200A @ 240V MIG → 25%, 2.5 min weld, 7.5 min rest
- Nearest-point fallback: 190A returns 2 nearest validated points sorted by distance
- Troubleshooting scoring: best match ranked first with process filtering
- Manual page lookup by page number and topic keyword
- Weld settings: exact match, partial data detection, and no-match fallback messaging

**API route tests** (`tests/app/api/chat/route.test.ts`)
- Missing API key returns 500 with actionable error message
- Configuration wiring: correct model, temperature (0.3), tool count, max steps (5)
- Error serialization for both Error objects and unknown failures

**Artifact parser tests** (`tests/lib/agent/artifact-parser.test.ts`)
- Complete artifact extraction with attribute preservation
- Text/artifact segment ordering
- Pending (streaming) artifact detection with 60-char threshold
- Custom attribute passthrough (src, page, caption)

**Component tests** (4 files)
- Chat input: trimmed send, disabled when blank, stop button during streaming
- Message bubble: artifact rendering, manual-image tool output, generic tool JSON expansion
- Message list: streaming pending state for unclosed artifacts
- Artifact renderer: manual image display, unsupported type fallback
- React artifact: import rewriting, export stripping, unsupported import errors, JSX scope safety

### E2E Tests (3 Playwright specs)

- `chat-artifact-rendering.spec.ts` — Manual-image artifact rendering with SSE stream mocking
- `chat-tool-rendering.spec.ts` — TIG polarity question → tool result rendering
- `chat-tool-streaming.spec.ts` — Tool input state visibility, result expansion as collapsible summary

### Contract Testing

Tool contracts (`tests/contracts/tool-contracts.ts`) define Zod schemas for all 6 tools with expected input/output shapes. Every tool is tested against its contract to ensure the knowledge base lookup logic returns correctly typed results.

---

## AI Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Model | `claude-sonnet-4-20250514` | Best coding model for artifact generation |
| Temperature | 0.3 | Low temperature for factual technical domain |
| Max tool steps | 5 | Prevents runaway tool loops |
| Max duration | 60s | Vercel serverless function limit |
| Prompt caching | Enabled | Large system prompt (full KB) cached to reduce cost |

---

## Design Decisions

**Why no RAG?** The complete knowledge base fits in a single system prompt (~15k tokens). Prompt caching makes this efficient. RAG introduces retrieval errors — for a safety-critical domain like welding, wrong context retrieved from a vector store is worse than slightly higher token cost.

**Why tools instead of just prompting?** Claude will confidently say "the duty cycle at 200A is 30%" when it's actually 25%. Tools force exact lookups against validated data. The agent calls `calculateDutyCycle` and gets `25% @ 24V` — it can't hallucinate the number.

**Why sandboxed iframes for React artifacts?** Security. Artifact code is generated by an LLM and runs in the browser. The sandbox prevents access to the parent page's DOM, cookies, and JavaScript context. Tailwind, React, and Recharts are loaded from CDN inside the iframe.

**Why honest fallbacks for weld settings?** The weld settings data is intentionally incomplete. Rather than inventing values that could lead to bad welds (or worse, safety issues), the agent explicitly says when data hasn't been validated. This is a deliberate trust signal.

**Why light mode default?** The target user is in a garage. Light mode is easier to read in bright ambient light, which is the typical environment for someone setting up a welder.

---

## Project Structure

```
app/
  api/chat/route.ts          # Streaming AI endpoint, tool orchestration
  api/chats/                  # Chat CRUD (authenticated)
  sign-in/page.tsx            # Google OAuth sign-in
  layout.tsx                  # Root layout, theme system, fonts
  globals.css                 # Design tokens (light default, dark toggle)

lib/
  agent/
    system-prompt.ts          # System prompt + knowledge base injection
    tools.ts                  # 6 Zod-validated tool definitions
    artifact-parser.ts        # Streaming XML parser for <antArtifact> blocks
    weld-settings.ts          # Weld settings lookup with fallback logic
  knowledge/
    knowledge-base.json       # Source of truth: specs, polarity, troubleshooting
  db/
    schema.ts                 # Drizzle ORM schema (users, chats, messages)
    chat-repository.ts        # Chat persistence layer
  auth.ts                     # NextAuth + Google OAuth + Drizzle adapter

components/
  artifacts/
    artifact-renderer.tsx     # Routes artifacts to correct renderer
    react-artifact.tsx        # Sandboxed iframe with Babel + Recharts
    mermaid-artifact.tsx      # Client-side Mermaid.js
  chat/
    chat-container.tsx        # Main chat orchestration
    message-bubble.tsx        # Message rendering with artifact support
    chat-input.tsx            # Input with streaming stop button
    welcome-screen.tsx        # Suggested prompts on first load

tests/
  contracts/tool-contracts.ts # Zod schemas for all 6 tools
  lib/agent/                  # Tool + parser unit tests
  app/api/                    # Route handler tests
  components/                 # Component + artifact tests
  e2e/                        # Playwright specs

public/manual-pages/          # 8 extracted PNG pages from the owner's manual
```

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API access |
| `POSTGRES_URL` | Optional | Chat history persistence (Vercel Postgres or any PostgreSQL) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth sign-in |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth sign-in |
| `AUTH_SECRET` | Optional | NextAuth session encryption (generate with `npx auth secret`) |

The agent works fully without OAuth or Postgres — chat just won't persist across sessions.

---

## Tech Stack

- **AI:** Anthropic Claude Sonnet 4, Vercel AI SDK 6.0, Zod tool validation
- **Frontend:** Next.js 15, React 19, Tailwind CSS 4, Mermaid.js, Recharts
- **Backend:** Next.js API routes, streaming responses, 60s max duration
- **Database:** Drizzle ORM, Vercel Postgres (optional)
- **Auth:** NextAuth 5 beta, Google OAuth, Drizzle adapter
- **Testing:** Vitest, React Testing Library, Playwright
