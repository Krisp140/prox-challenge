# prox-challenge — Overview

> **Navigation aid.** This article shows WHERE things live (routes, models, files). Read actual source files before implementing new features or making changes.

**prox-challenge** is a typescript project built with next-app, using drizzle for data persistence.

## Scale

7 API routes · 6 database models · 17 UI components · 1 middleware layers · 9 environment variables

## Subsystems

- **[Route](./route.md)** — 7 routes — touches: auth, payment, upload, ai

**Database:** drizzle, 6 models — see [database.md](./database.md)

**UI:** 17 components (react) — see [ui.md](./ui.md)

## High-Impact Files

Changes to these files have the widest blast radius across the codebase:

- `lib/db/schema.ts` — imported by **2** files
- `components/artifacts/svg-artifact.tsx` — imported by **1** files
- `components/artifacts/react-artifact.tsx` — imported by **1** files
- `components/artifacts/mermaid-artifact.tsx` — imported by **1** files
- `components/chat/sidebar.tsx` — imported by **1** files
- `components/chat/chat-input.tsx` — imported by **1** files

## Required Environment Variables

- `CI` — `playwright.config.ts`
- `IMAGE_MODEL` — `app/api/artifacts/image-pass/route.ts`
- `NODE_ENV` — `app/api/test/chat-mock/route.ts`

---
_Back to [index.md](./index.md) · Generated 2026-04-09_