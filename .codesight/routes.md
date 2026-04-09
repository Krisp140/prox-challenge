# Routes

- `POST` `/api/artifacts/image-pass` → out: { enabled, error } [auth, payment, upload] ✓
- `POST` `/api/chat` [auth, ai] ✓
- `GET` `/api/chats/[id]` params(id) → out: { error } [auth] ✓
- `DELETE` `/api/chats/[id]` params(id) → out: { error } [auth] ✓
- `GET` `/api/chats` → out: { error } [auth] ✓
- `POST` `/api/chats` → out: { error } [auth] ✓
- `POST` `/api/test/chat-mock` [payment] ✓
