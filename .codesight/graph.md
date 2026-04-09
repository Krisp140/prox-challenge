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
