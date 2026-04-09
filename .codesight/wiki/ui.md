# UI

> **Navigation aid.** Component inventory and prop signatures extracted via AST. Read the source files before adding props or modifying component logic.

**17 components** (react)

## Client Components

- **SignInPage** — `app/sign-in/page.tsx`
- **ArtifactRenderer** — props: artifact — `components/artifacts/artifact-renderer.tsx`
- **MermaidArtifact** — props: artifact — `components/artifacts/mermaid-artifact.tsx`
- **ReactArtifact** — props: artifact — `components/artifacts/react-artifact.tsx`
- **SvgArtifact** — props: artifact — `components/artifacts/svg-artifact.tsx`
- **ChatContainer** — props: initialChatId, initialMessages — `components/chat/chat-container.tsx`
- **ChatHistoryList** — props: chats, activeChatId, onDeleted — `components/chat/chat-history-list.tsx`
- **ChatInput** — props: onSend, onStop, status — `components/chat/chat-input.tsx`
- **MessageBubble** — props: message, isStreaming — `components/chat/message-bubble.tsx`
- **MessageList** — props: messages, status — `components/chat/message-list.tsx`
- **UserSection** — props: session — `components/chat/user-section.tsx`
- **Providers** — `components/providers.tsx`
- **ThemeToggle** — `components/theme-toggle.tsx`

## Components

- **ChatPage** — props: params — `app/chat/[id]/page.tsx`
- **RootLayout** — `app/layout.tsx`
- **HomePage** — `app/page.tsx`
- **WelcomeScreen** — props: onSelectQuestion — `components/chat/welcome-screen.tsx`

---
_Back to [overview.md](./overview.md)_