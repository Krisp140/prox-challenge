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
