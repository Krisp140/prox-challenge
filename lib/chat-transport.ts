import { DefaultChatTransport, type UIMessage } from "ai";

/**
 * Extends DefaultChatTransport to:
 * 1. Merge a dynamic `chatId` (our DB chat ID) into every request body
 * 2. Capture the `X-Chat-Id` response header from the server
 */
export function createPersistentTransport(options: {
  chatIdRef: { current: string | undefined };
  onChatId: (chatId: string) => void;
}) {
  return new DefaultChatTransport({
    body: () => ({ chatId: options.chatIdRef.current }),
    fetch: async (input, init) => {
      const response = await globalThis.fetch(input, init);

      const chatId = response.headers.get("X-Chat-Id");
      if (chatId) {
        options.onChatId(chatId);
      }

      return response;
    },
  });
}
