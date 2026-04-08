import { ChatContainer } from "@/components/chat/chat-container";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-3 py-3 sm:px-5 sm:py-5">
      <ChatContainer />
    </main>
  );
}
