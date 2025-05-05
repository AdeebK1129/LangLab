// src/pages/ChatPage.tsx
import { useState, FormEvent } from "react";
import { nanoid }               from "nanoid";
import { MessageInput }         from "@/components/ui/message-input";
import { MessageList }          from "@/components/ui/message-list";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export default function ChatPage() {
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [input, setInput]             = useState("");
  const [isGenerating, setGenerating] = useState(false);

  // **1) this is your transcription function**
  // It will be handed the recorded audio Blob by MessageInput
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const form = new FormData();
    form.append("file", audioBlob, "speech.webm");

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/transcribe`,
      { method: "POST", body: form }
    );
    if (!res.ok) throw new Error("transcription failed");
    const { text } = await res.json();
    return text as string;
  };

  const handleSend = async () => {
    // nothing to do if they haven't typed or spoken anything
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setGenerating(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/conversations/text/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: "mvp-test",
            userMessage: input,
          }),
        }
      );
      const { reply } = await res.json();
      const aiMsg: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: reply,
        createdAt: new Date(),
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <MessageList messages={messages} isTyping={isGenerating} />
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          handleSend();
        }}
        className="border-t p-4"
      >
      <MessageInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        isGenerating={isGenerating}
        placeholder="Type your message… or press 🎤"
        submitOnEnter={true}
        transcribeAudio={transcribeAudio}
      />

      </form>
    </div>
  );
}
