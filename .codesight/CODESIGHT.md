# prox-challenge — AI Context Map

> **Stack:** next-app | drizzle | react | typescript

> 7 routes | 6 models | 17 components | 5 lib files | 9 env vars | 1 middleware | 62% test coverage
> **Token savings:** this file is ~1,900 tokens. Without it, AI exploration would cost ~22,000 tokens. **Saves ~20,000 tokens per conversation.**

---

# Routes

- `POST` `/api/artifacts/image-pass` → out: { enabled, error } [auth, payment, upload] ✓
- `POST` `/api/chat` [auth, ai] ✓
- `GET` `/api/chats/[id]` params(id) → out: { error } [auth] ✓
- `DELETE` `/api/chats/[id]` params(id) → out: { error } [auth] ✓
- `GET` `/api/chats` → out: { error } [auth] ✓
- `POST` `/api/chats` → out: { error } [auth] ✓
- `POST` `/api/test/chat-mock` [payment] ✓

---

# Schema

### users
- id: uuid (pk)
- name: text
- email: text (required, unique)
- emailVerified: timestamp
- image: text

### accounts
- userId: uuid (fk, required)
- type: text (required)
- provider: text (required)
- providerAccountId: text (required, fk)
- refresh_token: text
- access_token: text
- expires_at: integer
- token_type: text
- scope: text
- id_token: text
- session_state: text
- _relations_: userId -> users.id

### sessions
- sessionToken: text (pk)
- userId: uuid (fk, required)
- expires: timestamp (required)
- _relations_: userId -> users.id

### verification_tokens
- identifier: text (required)
- token: text (required)
- expires: timestamp (required)

### chats
- id: uuid (pk)
- userId: uuid (fk, required)
- title: text (required)
- _relations_: userId -> users.id

### messages
- id: uuid (pk)
- chatId: uuid (fk, required)
- role: text (required)
- parts: jsonb (required)
- _relations_: chatId -> chats.id

---

# Components

- **ChatPage** — props: params — `app/chat/[id]/page.tsx`
- **RootLayout** — `app/layout.tsx`
- **HomePage** — `app/page.tsx`
- **SignInPage** [client] — `app/sign-in/page.tsx`
- **ArtifactRenderer** [client] — props: artifact — `components/artifacts/artifact-renderer.tsx`
- **MermaidArtifact** [client] — props: artifact — `components/artifacts/mermaid-artifact.tsx`
- **ReactArtifact** [client] — props: artifact — `components/artifacts/react-artifact.tsx`
- **SvgArtifact** [client] — props: artifact — `components/artifacts/svg-artifact.tsx`
- **ChatContainer** [client] — props: initialChatId, initialMessages — `components/chat/chat-container.tsx`
- **ChatHistoryList** [client] — props: chats, activeChatId, onDeleted — `components/chat/chat-history-list.tsx`
- **ChatInput** [client] — props: onSend, onStop, status — `components/chat/chat-input.tsx`
- **MessageBubble** [client] — props: message, isStreaming — `components/chat/message-bubble.tsx`
- **MessageList** [client] — props: messages, status — `components/chat/message-list.tsx`
- **UserSection** [client] — props: session — `components/chat/user-section.tsx`
- **WelcomeScreen** — props: onSelectQuestion — `components/chat/welcome-screen.tsx`
- **Providers** [client] — `components/providers.tsx`
- **ThemeToggle** [client] — `components/theme-toggle.tsx`

---

# Libraries

- `lib/agent/artifact-parser.ts`
  - function parseArtifacts: (source, options) => void
  - type ParsedArtifact
  - type ArtifactSegment
- `lib/agent/weld-settings.ts`
  - function lookupWeldSettings: (entries, query) => WeldSettingsLookupResult
  - type WeldSettingsFallback
  - type ValidatedWeldSetting
  - type WeldSettingEntry
  - type WeldSettingsLookupInput
  - type WeldSettingsLookupResult
- `lib/chat-transport.ts` — function createPersistentTransport: (options) => void
- `lib/db/chat-repository.ts`
  - function createChat: (userId, title) => Promise<Chat>
  - function getUserChats: (userId) => Promise<ChatSummary[]>
  - function getChatWithMessages: (chatId, userId) => Promise<ChatWithMessages | null>
  - function saveMessages: (chatId, newMessages) => Promise<void>
  - function updateChatTitle: (chatId, title) => Promise<void>
  - function deleteChat: (chatId, userId) => Promise<boolean>
  - _...3 more_
- `lib/hooks/use-chat-list.ts` — function useChatList: (enabled) => void, type ChatListItem

---

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

---

# Middleware

## auth
- auth — `lib/auth.ts`

---

# Dependency Graph

## Most Imported Files (change these carefully)

- `lib/db/schema.ts` — imported by **2** files
- `components/artifacts/svg-artifact.tsx` — imported by **1** files
- `components/artifacts/react-artifact.tsx` — imported by **1** files
- `components/artifacts/mermaid-artifact.tsx` — imported by **1** files
- `components/chat/sidebar.tsx` — imported by **1** files
- `components/chat/chat-input.tsx` — imported by **1** files
- `components/chat/message-list.tsx` — imported by **1** files
- `components/chat/welcome-screen.tsx` — imported by **1** files
- `components/chat/message-bubble.tsx` — imported by **1** files
- `components/chat/chat-history-list.tsx` — imported by **1** files
- `components/chat/user-section.tsx` — imported by **1** files
- `lib/agent/weld-settings.ts` — imported by **1** files
- `lib/db/index.ts` — imported by **1** files

## Import Map (who imports what)

- `lib/db/schema.ts` ← `lib/db/chat-repository.ts`, `lib/db/index.ts`
- `components/artifacts/svg-artifact.tsx` ← `components/artifacts/artifact-renderer.tsx`
- `components/artifacts/react-artifact.tsx` ← `components/artifacts/artifact-renderer.tsx`
- `components/artifacts/mermaid-artifact.tsx` ← `components/artifacts/artifact-renderer.tsx`
- `components/chat/sidebar.tsx` ← `components/chat/chat-container.tsx`
- `components/chat/chat-input.tsx` ← `components/chat/chat-container.tsx`
- `components/chat/message-list.tsx` ← `components/chat/chat-container.tsx`
- `components/chat/welcome-screen.tsx` ← `components/chat/chat-container.tsx`
- `components/chat/message-bubble.tsx` ← `components/chat/message-list.tsx`
- `components/chat/chat-history-list.tsx` ← `components/chat/sidebar.tsx`

---

# Test Coverage

> **62%** of routes and models are covered by tests
> 15 test files found

## Covered Routes

- POST:/api/artifacts/image-pass
- POST:/api/chat
- GET:/api/chats/[id]
- DELETE:/api/chats/[id]
- GET:/api/chats
- POST:/api/chats
- POST:/api/test/chat-mock

## Covered Models

- messages

---

_Generated by [codesight](https://github.com/Houseofmvps/codesight) — see your codebase clearly_