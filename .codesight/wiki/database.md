# Database

> **Navigation aid.** Schema shapes and field types extracted via AST. Read the actual schema source files before writing migrations or query logic.

**drizzle** — 6 models

### users

pk: `id` (uuid)

- `id`: uuid _(pk)_
- `name`: text
- `email`: text _(required, unique)_
- `emailVerified`: timestamp
- `image`: text

### accounts

fk: userId, providerAccountId

- `userId`: uuid _(fk, required)_
- `type`: text _(required)_
- `provider`: text _(required)_
- `providerAccountId`: text _(required, fk)_
- `refresh_token`: text
- `access_token`: text
- `expires_at`: integer
- `token_type`: text
- `scope`: text
- `id_token`: text
- `session_state`: text
- _relations_: userId -> users.id

### sessions

pk: `sessionToken` (text) · fk: userId

- `sessionToken`: text _(pk)_
- `userId`: uuid _(fk, required)_
- `expires`: timestamp _(required)_
- _relations_: userId -> users.id

### verification_tokens

- `identifier`: text _(required)_
- `token`: text _(required)_
- `expires`: timestamp _(required)_

### chats

pk: `id` (uuid) · fk: userId

- `id`: uuid _(pk)_
- `userId`: uuid _(fk, required)_
- `title`: text _(required)_
- _relations_: userId -> users.id

### messages

pk: `id` (uuid) · fk: chatId

- `id`: uuid _(pk)_
- `chatId`: uuid _(fk, required)_
- `role`: text _(required)_
- `parts`: jsonb _(required)_
- _relations_: chatId -> chats.id

## Schema Source Files

Read and edit these files when adding columns, creating migrations, or changing relations:

- `lib/db/schema.ts` — imported by **2** files
- `lib/db/index.ts` — imported by **1** files

---
_Back to [overview.md](./overview.md)_