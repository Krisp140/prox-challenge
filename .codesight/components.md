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
