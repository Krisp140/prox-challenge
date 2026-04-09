# Config

## Environment Variables

- `ANTHROPIC_API_KEY` (has default) — .env.example
- `AUTH_SECRET` (has default) — .env.example
- `CI` **required** — playwright.config.ts
- `GOOGLE_CLIENT_ID` (has default) — .env.example
- `GOOGLE_CLIENT_SECRET` (has default) — .env.example
- `IMAGE_MODEL` **required** — app/api/artifacts/image-pass/route.ts
- `NODE_ENV` **required** — app/api/test/chat-mock/route.ts
- `POSTGRES_URL` (has default) — .env.example
- `REPLICATE_API_TOKEN` (has default) — .env.example

## Config Files

- `.env.example`
- `drizzle.config.ts`
- `next.config.ts`
- `tsconfig.json`

## Key Dependencies

- ai: ^6.0.0
- drizzle-orm: ^0.45.2
- next: ^15.0.0
- next-auth: ^5.0.0-beta.30
- react: ^19.0.0
- zod: ^3.23.8
