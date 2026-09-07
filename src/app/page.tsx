"use client";

import { AppSidebar, ChatSession } from "@/MyComponents/appSidebar";
import { MainLayer } from "@/MyComponents/Main";
import { Under } from "@/MyComponents/Under";
import { useState, useEffect, useRef } from "react";
import { chatWithOllama, getOllamaModels, OllamaModel } from "@/lib/ollama";
import { Message } from "@/lib/types";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/MyComponents/ThemeToggle";
import { SetButton } from "@/MyComponents/setButton";
import { ThinkingToggle } from "@/MyComponents/ThinkToggle";
import { PromptBlock } from "@/lib/promptBlock";
import { BlockSidebar } from "@/MyComponents/BlockSidebar";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { PromptBlockModal } from "@/MyComponents/PromptBlockModal";

const BACKEND_URL = "http://localhost:3001/api";

const buildMessages = (
  blocks: PromptBlock[],
  messages: Message[],
  userMessage: string
): Message[] => {
  const activeBlocks = blocks.filter((block) => block.enabled);

  const systemPrompt = activeBlocks
    .map(
      (block) =>
        `[${block.title}]\n${block.content}`
    )
    .join("\n\n");

  return [
    ...(systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }]
      : []),
    ...messages,
    {
      role: "user" as const,
      content: userMessage,
    },
  ];
};

export default function Home() {
  const [blocks, setBlocks] = useState<PromptBlock[]>([
    {
      id: crypto.randomUUID(),
      title: "data user",
      content: "nama user:Ren",
      enabled: false,
    },
    {
      id: crypto.randomUUID(),
      title: "bahasa",
      content: "gunakan bahasa indonesia",
      enabled: false,
    },
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isBlockSidebarOpen, setIsBlockSidebarOpen] = useState(false);
  const [showThinking, setShowThinking] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const { state } = useSidebar();
  const isSidebarOpen = state === "expanded";

  const handleOpenBlocks = () => {
    setIsModalOpen(true);
    setIsBlockSidebarOpen(true);
  };

  const handleAddBlock = (newBlock: PromptBlock) => {
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;

    if (over && over.id === "active-blocks-sidebar") {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === active.id ? { ...block, enabled: true } : block
        )
      );
    }
  };

  const handleDisableBlock = (id: number) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, enabled: false } : block
      )
    );
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Gagal mengambil daftar session:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    try {
      const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Gagal mengambil isi percakapan:", error);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
        fetchSessions();
      }
    } catch (error) {
      console.error("Gagal menghapus session:", error);
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const handleSend = async (content: string) => {
    let activeSessionId = currentSessionId;

    if (!selectedModel) {
      console.error("Belum ada Ollama model yang dipilih");
      return;
    }

    if (!activeSessionId) {
      try {
        const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        const res = await fetch(`${BACKEND_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        const newSession = await res.json();
        activeSessionId = newSession.id;
        setCurrentSessionId(activeSessionId);
        fetchSessions();
      } catch (error) {
        console.error("Gagal membuat session baru:", error);
        return;
      }
    }

    try {
      await fetch(`${BACKEND_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          role: "user",
          content,
        }),
      });
    } catch (error) {
      console.error("Gagal menyimpan pesan user:", error);
    }

    const userMessage: Message = {
      role: "user",
      content,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    const promptMessages = buildMessages(
      blocks,
      messages,
      content
    );

    setMessages([
      ...updatedMessages,
      { role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);

    let assistantResponse = "";

    try {
      await chatWithOllama(
        selectedModel,
        promptMessages,
        (chunk, thinking) => {
          if (thinking) {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                ...updated[lastIndex],
                thinking: (updated[lastIndex].thinking ?? "") + thinking,
              };
              return updated;
            });
          }

          if (chunk) {
            assistantResponse += chunk;
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: assistantResponse,
              };
              return updated;
            });
          }
        },
        controller.signal
      );

      if (assistantResponse && activeSessionId) {
        await fetch(`${BACKEND_URL}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSessionId,
            role: "assistant",
            content: assistantResponse,
          }),
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && !updated[lastIndex].content) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: "you stopped this response",
            };
          }
          return updated;
        });
      } else {
        console.error(error);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    async function loadModels() {
      try {
        const models = await getOllamaModels();
        setModels(models);
        if (models.length > 0) {
          setSelectedModel(models[0].name);
        }
      } catch (error) {
        console.error("Failed to load Ollama models:", error);
      }
    }
    loadModels();
  }, []);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        className="
      flex h-screen w-full overflow-hidden
      bg-slate-100 text-slate-900
      dark:bg-slate-950 dark:text-white
      transition-colors duration-300
    "
      >
        <AppSidebar
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />

        {!isSidebarOpen && (
          <aside className="flex w-12 items-center flex-col gap-5 pt-3">
            <div>
              <SidebarTrigger className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" />
            </div>
            <div className="gap-5">
              <ThemeToggle />
              <SetButton />
              <ThinkingToggle
                showThinking={showThinking}
                onToggle={() => setShowThinking((prev) => !prev)}
              />
            </div>
          </aside>
        )}

        <main className="flex flex-1 min-w-0 flex-col overflow-hidden">
          <MainLayer messages={messages} showThinking={showThinking} />

          <Under
            onSendTo={handleSend}
            onStop={stopGeneration}
            isGenerating={isGenerating}
            onOpenBlocks={handleOpenBlocks}
          />
        </main>

        {isBlockSidebarOpen ? (
          <BlockSidebar
            activeBlocks={blocks.filter((b) => b.enabled)}
            onDisableBlock={handleDisableBlock}
            onClose={() => setIsBlockSidebarOpen(false)} 
          />
        ) : (
          <div className="flex p-3 items-start shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsBlockSidebarOpen(true)}
              className="relative text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              title="Buka Block Sidebar"
            >
              <Layers className="h-5 w-5" />
            </Button>
          </div>
        )}
        <PromptBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        blocks={blocks}
        onAddBlock={handleAddBlock}
      />
      </div>
    </DndContext>
  );
}