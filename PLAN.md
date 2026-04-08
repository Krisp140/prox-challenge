# Vulcan OmniPro 220 Multimodal Support Agent — Implementation Plan

## Context

Build a multimodal reasoning agent for the Vulcan OmniPro 220 welder as the Prox founding engineer challenge. The agent must answer deep technical questions from 3 PDFs (48-page owner manual, quick-start guide, selection chart), produce **visual/interactive responses** (not just text), and run as a polished web app. The #1 evaluation criterion is multimodal response quality — diagrams, interactive calculators, surfaced manual images.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15** (App Router) | Single codebase, instant Vercel deploy, streaming SSR |
| AI | **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) | First-class streaming, tool use, `useChat` hook |
| Model | `claude-sonnet-4-20250514` | Best coding+reasoning for artifact generation |
| Styling | **Tailwind CSS 4** | Fast, matches artifact sandbox environment |
| Artifacts | **Sandboxed iframe** + `react-runner` | Renders React/Mermaid/SVG artifacts safely |
| Knowledge | **Full-context system prompt** with prompt caching | 48 pages fits in context; no RAG retrieval errors |
| PDF extraction | **Claude Vision** (page-as-image) | Captures diagrams + tables + text together |

---

## Architecture

```
User → ChatInput → POST /api/chat → streamText(claude-sonnet-4)
                                        ├── System prompt (full knowledge base, cached)
                                        ├── Tools (specs, polarity, duty cycle, troubleshoot, manual images)
                                        └── Artifact instructions (when to generate React/SVG/Mermaid)
                                              ↓
                                     Streaming response with <antArtifact> tags
                                              ↓
                              Frontend parses → text + artifacts
                                              ↓
                              ArtifactRenderer routes by type:
                                ├── ReactArtifact (sandboxed iframe)
                                ├── MermaidArtifact (mermaid.js → SVG)
                                ├── SvgArtifact (inline SVG)
                                └── ManualImage (page PNG from /public)
```

---

## File Structure

```
prox-challenge/
├── app/
│   ├── layout.tsx                    # Root layout, fonts, metadata
│   ├── page.tsx                      # Main chat page
│   ├── globals.css                   # Tailwind
│   └── api/chat/route.ts            # Streaming API endpoint (core)
├── components/
│   ├── chat/
│   │   ├── chat-container.tsx        # useChat orchestrator
│   │   ├── message-list.tsx          # Scrollable messages
│   │   ├── message-bubble.tsx        # Text + artifact rendering per message
│   │   ├── chat-input.tsx            # Input bar
│   │   └── welcome-screen.tsx        # Starter questions + product image
│   └── artifacts/
│       ├── artifact-renderer.tsx     # Routes artifact type → renderer
│       ├── react-artifact.tsx        # Sandboxed iframe for React components
│       ├── mermaid-artifact.tsx      # Mermaid diagram renderer
│       └── svg-artifact.tsx          # Inline SVG renderer
├── lib/
│   ├── agent/
│   │   ├── system-prompt.ts          # System prompt + knowledge base assembly
│   │   ├── tools.ts                  # Agent tool definitions
│   │   └── artifact-parser.ts        # Parse <antArtifact> from stream
│   └── knowledge/
│       └── knowledge-base.json       # Pre-extracted structured content
├── scripts/
│   └── extract-knowledge.ts          # One-time PDF → JSON extraction
├── public/
│   └── manual-pages/                 # Page PNGs from PDFs
├── files/                            # Source PDFs (existing)
├── .env.example
├── package.json
└── next.config.ts
```

---

## Implementation Phases

### Phase 1: Scaffolding (~15 min)
- `npx create-next-app@latest` with App Router, TypeScript, Tailwind
- Install: `ai`, `@ai-sdk/anthropic`, `lucide-react`, `zod`
- Configure `.env.example` → `ANTHROPIC_API_KEY=your-api-key-here`
- Copy product images to `public/`

### Phase 2: Knowledge Extraction (~2 hrs)
**Script: `scripts/extract-knowledge.ts`**
1. Convert each PDF page to PNG using `pdf-to-img`
2. Send each page image to Claude Vision with structured extraction prompt
3. Output `lib/knowledge/knowledge-base.json` with structured chunks:
   - Specifications (p7): MIG/TIG/Stick tables with exact numbers
   - Duty cycles: MIG (40%@100A/120V, 25%@200A/240V), TIG (40%@125A/120V, 30%@175A/240V), Stick (40%@80A/120V, 25%@175A/240V)
   - Polarity setups: MIG=DCEP, Flux=swap ground+wire feed, TIG=DCEN, Stick=DCEP
   - Cable routing per process (from quick-start guide p2)
   - Setup procedures (p10-17 wire, p24-26 TIG, p27 stick)
   - Troubleshooting matrices (p42-44)
   - Weld diagnosis (p35-40)
   - LCD/synergic settings (p20-21, p30, p32)
   - Parts list (p46)
4. Save page PNGs to `public/manual-pages/`
5. **Manual validation pass** against PDF to verify critical numbers

### Phase 3: System Prompt & Tools (~2 hrs)
**`lib/agent/system-prompt.ts`**
- Role: friendly expert for hobbyist in their garage
- Full knowledge base injected with `cacheControl: { type: 'ephemeral' }`
- Artifact generation instructions: when and how to produce `<antArtifact>` tags
- Safety mandate: always include relevant warnings

**`lib/agent/tools.ts`** — 6 tools:
| Tool | Purpose |
|------|---------|
| `lookup_specifications` | Exact specs by process + voltage |
| `get_polarity_setup` | Cable routing + socket assignment |
| `calculate_duty_cycle` | Weld/rest time calculation |
| `get_troubleshooting` | Problem → cause → solution lookup |
| `get_manual_page` | Return page image URL for visual reference |
| `get_weld_settings` | Recommended settings for material/thickness/process |

### Phase 4: Artifact System (~3 hrs) ← Most critical
**`lib/agent/artifact-parser.ts`**
- Streaming parser that detects `<antArtifact>` tags in real-time
- Extracts `identifier`, `type`, `title` attributes
- Buffers content between open/close tags

**`components/artifacts/react-artifact.tsx`** — The showpiece
- Creates iframe with `srcdoc` containing: React, Tailwind CDN, Recharts, Lucide
- Injects artifact code via script tag
- Error boundary with "View Source" fallback
- Auto-sizing iframe height

**Target artifacts the agent should generate:**
1. **Duty Cycle Calculator** — React + Recharts pie chart, select process/voltage/amperage
2. **Polarity Setup Diagram** — SVG showing cable routing per process
3. **Troubleshooting Flowchart** — Mermaid decision tree
4. **Settings Configurator** — React form: process + material + thickness → recommended settings
5. **Weld Diagnosis Guide** — React comparison cards (good vs bad welds)

### Phase 5: Chat Frontend (~2 hrs)
- `chat-container.tsx`: Vercel AI SDK `useChat` hook, message state, streaming
- `welcome-screen.tsx`: Product image, intro text, 5 clickable starter questions
- `message-bubble.tsx`: Markdown rendering + artifact detection + manual image display
- `chat-input.tsx`: Text input, shift+enter, disabled during streaming
- Responsive, clean design with Vulcan orange (#F47920) accent

### Phase 6: API Route (~1 hr)
**`app/api/chat/route.ts`**
```typescript
streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  system: systemPrompt,     // Full knowledge, cached
  messages,
  tools,
  maxSteps: 5,              // Multi-step tool use
  temperature: 0.3,         // Factual accuracy
})
```

### Phase 7: Polish & Deploy (~2 hrs)
- Loading states, error handling, smooth scroll
- Dark/light mode
- Artifact render failure fallbacks
- Deploy to Vercel (`vercel deploy --prod`)
- Update README with architecture, design decisions, setup instructions, screenshots

---

## Key Design Decisions

1. **Full-context over RAG**: 48 pages fits in Claude's context window. With prompt caching, subsequent messages cost 90% less. Zero retrieval errors — the agent can cross-reference any section.

2. **Tools for precision**: Even with full context, structured tools ensure exact numbers (duty cycles, specs) are returned from pre-validated data, not hallucinated.

3. **Artifact XML parsing**: Reuse Claude's existing `<antArtifact>` format rather than inventing custom markup. This aligns with how Claude naturally generates artifacts.

4. **Sandboxed iframe for React**: Security + isolation. The iframe loads React/Tailwind/Recharts from CDN, receives code via srcdoc. No access to parent page.

5. **Claude Vision for extraction**: The manual has critical info in diagrams (cable routing, front panel, weld diagnosis photos) that text extraction would miss entirely.

---

## Verification Plan

1. **Knowledge accuracy**: After extraction, manually verify these against the PDF:
   - MIG duty cycle 240V: 25% @ 200A, 100% @ 115A
   - TIG polarity: DCEN (torch → negative, ground → positive)
   - Stick welding current range 120V: 10A–80A

2. **Test questions** (from the challenge README):
   - "What's the duty cycle for MIG welding at 200A on 240V?" → Should answer 25% + generate duty cycle calculator
   - "I'm getting porosity in my flux-cored welds" → Should generate troubleshooting flowchart + check gas, technique, wire condition
   - "What polarity setup for TIG? Which socket for ground clamp?" → Should generate polarity diagram + answer: ground clamp → positive socket

3. **Artifact rendering**: Verify each artifact type renders correctly:
   - React calculator interactive and functional
   - Mermaid flowcharts render without errors
   - SVG diagrams display correctly
   - Manual page images load

4. **Setup time**: Fresh clone → running in <2 minutes:
   ```bash
   git clone <fork> && cd <fork>
   cp .env.example .env  # add key
   npm install && npm run dev
   ```

5. **Cross-reference test**: Ask a question that requires combining info from multiple manual sections (e.g., "I want to TIG weld 1/8 inch stainless steel on 240V — walk me through the complete setup")
