# Route

> **Navigation aid.** Route list and file locations extracted via AST. Read the source files listed below before implementing or modifying this subsystem.

The Route subsystem handles **7 routes** and touches: auth, payment, ai.

## Routes

- `POST` `/api/artifacts/image-pass` → out: { enabled, error } [auth, payment, upload]
  `app/api/artifacts/image-pass/route.ts`
- `POST` `/api/chat` [auth, ai]
  `app/api/chat/route.ts`
- `GET` `/api/chats/[id]` params(id) → out: { error } [auth]
  `app/api/chats/[id]/route.ts`
- `DELETE` `/api/chats/[id]` params(id) → out: { error } [auth]
  `app/api/chats/[id]/route.ts`
- `GET` `/api/chats` → out: { error } [auth]
  `app/api/chats/route.ts`
- `POST` `/api/chats` → out: { error } [auth]
  `app/api/chats/route.ts`
- `POST` `/api/test/chat-mock` [payment]
  `app/api/test/chat-mock/route.ts`

## Source Files

Read these before implementing or modifying this subsystem:
- `app/api/artifacts/image-pass/route.ts`
- `app/api/chat/route.ts`
- `app/api/chats/[id]/route.ts`
- `app/api/chats/route.ts`
- `app/api/test/chat-mock/route.ts`

---
_Back to [overview.md](./overview.md)_