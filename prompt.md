# project ku sekarang
tech stack:TS(typescript),tailwind,next.js,express,SQLite,better-sqlite3,shadcn/ui untuk ui.
semua project ada di folder src.
app/page.tsx:
"use client";

import { AppSidebar, ChatSession } from "@/MyComponents/appSidebar";
import { MainLayer } from "@/MyComponents/Main";
import { Under } from "@/MyComponents/Under";
import { useState, useEffect, useRef } from "react";
import { chatWithOllama, getOllamaModels, OllamaModel, ThinkingMode } from "@/lib/ollama";
import { Message } from "@/lib/types";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/MyComponents/ThemeToggle";
import { SetButton } from "@/MyComponents/setButton";
import { ThinkingToggle } from "@/MyComponents/ThinkToggle";
import { PromptBlock } from "@/lib/promptBlock";

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
      title: "Perkenalan",
      content: "halo namaku Ren",
      enabled: true,
    },
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>("auto");

  const abortControllerRef = useRef<AbortController | null>(null);
  const { state } = useSidebar();
  const isSidebarOpen = state === "expanded";


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
        thinkingMode,
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
          <div className="gap-3">
            <ThemeToggle />
            <SetButton />
            <ThinkingToggle
              value={thinkingMode}
              onChange={setThinkingMode}
            />
          </div>
        </aside>
      )}

      <main className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <MainLayer messages={messages} />

        <Under
          onSendTo={handleSend}
          onStop={stopGeneration}
          isGenerating={isGenerating}
        />
      </main>
    </div>
  );
}

lib/ollama.ts:
const BACKEND_URL = "http://localhost:3001/api/ollama";
import { Message } from "./types";

export type OllamaModel = {

  name: string;

  supportsThinking: boolean;

};

export type ThinkingMode = "auto" | "on" | "off";

export async function getOllamaModels(): Promise<OllamaModel[]> {
  const response = await fetch(`${BACKEND_URL}/models`);

  if (!response.ok) {
    throw new Error("Failed to fetch Ollama models");
  }

  const data = await response.json();
  return data.models;
}

export async function chatWithOllama(
  model: string,
  messages: Message[],
  thinkingMode: ThinkingMode,
  onChunk: (chunk: string, thinking?: string) => void,
  signal?: AbortSignal,
) {
  const payload = {
    model,
    messages,
    stream: true,
    thinkingMode,
  };

  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to connect to Ollama");
  }

  if (!response.body) {
    throw new Error("Ollama response body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    if (signal?.aborted) {
      await reader.cancel();
      break;
    }

    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");

    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);

        if (data.message?.thinking) {
          onChunk("", data.message.thinking);
        }

        if (data.message?.content) {
          onChunk(data.message.content);
        }
      } catch (err) {

      }
    }
  }
}

MyComponents/appSidebar.tsx:
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { OllamaModel } from "@/lib/ollama";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { SetButton } from "./setButton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  models: OllamaModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export function AppSidebar({
  models,
  selectedModel,
  onModelChange,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: AppSidebarProps) {
  return (
    <Sidebar
      className="
        border-r border-slate-200
        bg-white text-slate-900
        dark:border-slate-800
        dark:bg-slate-900 dark:text-slate-100
        transition-colors duration-300
      "
    >
      <SidebarHeader
        className="
          bg-white
          dark:bg-slate-900
          flex flex-col gap-3 p-4
        "
      >
        <div className="flex flex-row items-center justify-between">
          <div className="relative h-8 w-32">
            <Image
              src="/lightLogo.png"
              fill
              alt="Locally"
              className="block dark:hidden"
            />
            <Image
              src="/darkLogo.png"
              fill
              alt="Locally"
              className="hidden dark:block"
            />
          </div>
          <div>
            <SidebarTrigger
              className="
                text-slate-500 hover:text-slate-900
                dark:text-slate-400 dark:hover:text-white
              "
            />
          </div>
        </div>

        <Button
          onClick={onNewChat}
          className="w-full flex items-center justify-start gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-slate-900">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 dark:text-slate-400">
            Ollama Model
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Select
              value={selectedModel}
              onValueChange={(value) => {
                if (value !== null) {
                  onModelChange(value);
                }
              }}
            >
              <SelectTrigger className="w-full border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {models.map((model) => (
                  <SelectItem key={model.name} value={model.name}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 dark:text-slate-400">
            History
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.length === 0 ? (
                <div className="px-2 py-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                  Belum ada riwayat chat
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <SidebarMenuItem key={session.id} className="group relative flex items-center">
                      <SidebarMenuButton
                        onClick={() => onSelectSession(session.id)}
                        className={`w-full justify-start pr-8 ${
                          isActive
                            ? "bg-slate-200 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 mr-2 text-slate-400" />
                        <span className="truncate">{session.title}</span>
                      </SidebarMenuButton>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                        title="Hapus Chat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="flex flex-row items-center justify-between border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span>Ollama Connected</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SetButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

ChatInput.tsx:
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

type ChatInputProps = {
  onSend: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
};

export const ChatInput = ({
  onSend,
  onStop,
  isGenerating,
}: ChatInputProps) => {
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    onSend(input);
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-150">
        <div className="flex min-h-12 items-center gap-2 rounded-3xl border border-slate-300 bg-white p-2 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-950">
          <Textarea
            placeholder="Ask Locally..."
            className="min-h-12 max-h-40 resize-none overflow-y-auto box-border border-0 text-slate-900 placeholder:text-slate-400 dark:bg-transparent dark:text-white dark:placeholder:text-slate-500 focus-visible:ring-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <Button
            type={isGenerating ? "button" : "submit"}
            onClick={isGenerating ? onStop : undefined}
            className="flex size-10 items-center justify-center rounded-full bg-orange-600 hover:bg-orange-700"
          >
            {isGenerating ? (
              <Image
                src="/svgviewer-output.svg"
                alt="Stop"
                width={12}
                height={12}
              />
            ) : (
              <Image
                src="/arrow.svg"
                width={12}
                height={12}
                alt="Send"
              />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

Header.tsx:
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import type { OllamaModel } from "@/lib/ollama";

type HeaderProps = {
  models: OllamaModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  hideHeader: boolean;
};

export const Header = ({
  models,
  selectedModel,
  onModelChange,
  hideHeader,
}: HeaderProps) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-orange-500/30 bg-slate-900/80 px-5 backdrop-blur-md transition-transform duration-300 ease-in-out ${
        hideHeader ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div>
        <Image
          src="/Android Small - 1(2).svg"
          alt="Locally"
          width={200}
          height={100}
        />
      </div>
      <div className="flex flex-row gap-10">
        <Select
          value={selectedModel}
          onValueChange={(value) => {
            if (value !== null) {
              onModelChange(value);
            }
          }}
        >
          <SelectTrigger className="w-40 border-slate-900 font-sans text-lg">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>

          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.name} value={model.name}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button className="bg-orange-600 hover:bg-orange-700 size-10">
          <Image
            src="/settings-3110.svg"
            width={28}
            height={28}
            alt="setting"
          />
        </Button>
      </div>
    </header>
  );
};

Main.tsx:
"use client";
import { MessageBubble } from "./MessageBubble";
import { Message } from "@/lib/types";

type MainLayerProps = {
  messages: Message[];
};

export const MainLayer = ({ messages }: MainLayerProps) => {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <section className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              role={message.role}
              content={message.content}
              thinking={message.thinking}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

MessageBubble.tsx:
'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect } from 'react';
import { Message } from '@/lib/types';
import { Copy, Check } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

export const MessageBubble = ({ role, content, thinking }: Message) => {
  const isUser = role === 'user';
  const [dots, setDots] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  useEffect(() => {
    if (!isUser && !content) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isUser, content]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex w-fit max-w-[70%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
          }`}
        >
          {!isUser && thinking && (
            <div className="mb-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <div className="mb-1 font-semibold">Thinking</div>
              <div className="whitespace-pre-wrap">{thinking}</div>
            </div>
          )}
          {!isUser && !content ? (
            <span className="flex items-center gap-1 font-mono italic text-slate-500 dark:text-slate-400">
              Thinking{dots}
            </span>
          ) : (
            <div className="prose max-w-none break-words dark:prose-invert">
              <ReactMarkdown
                components={{
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const code = String(children).replace(/\n$/, '');
                    const isInline = !className;

                    if (isInline) {
                      return (
                        <code
                          className="rounded-md bg-slate-200 px-1.5 py-0.5 font-mono text-sm dark:bg-slate-800"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return <CodeBlock language={language} code={code} />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {content && (
          <div className="mt-1 flex gap-1">
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="icon"
              className="relative rounded-full bg-transparent transition-all duration-200 hover:bg-slate-200 hover:scale-110 dark:hover:bg-slate-700 active:scale-95"
            >
              <Copy
                className={`absolute size-5 transition-all duration-300 ${
                  copied ? 'scale-0 rotate-45 opacity-0' : 'scale-100 rotate-0 opacity-100'
                }`}
              />
              <Check
                className={`absolute size-5 transition-all duration-300 ${
                  copied ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-45 opacity-0'
                }`}
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

Under.tsx:
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  onSendTo: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
};

export const Under = ({
  onSendTo,
  onStop,
  isGenerating,
}: ChatInputProps) => {
  return (
    <div className="flex shrink-0 flex-row items-center justify-center gap-2 p-4">
      <ChatInput
        onSend={onSendTo}
        onStop={onStop}
        isGenerating={isGenerating}
      />

      <Button
        className="
          size-14 rounded-full text-2xl font-bold

          bg-slate-200 text-slate-900
          hover:bg-slate-300

          dark:bg-slate-900 dark:text-white
          dark:hover:bg-slate-800
        "
      >
        +
      </Button>
    </div>
  );
};

backend/server.ts:
import express from "express";
import cors from "cors";
import chatRouter from "./router/chat";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api", chatRouter);

// Proxy untuk mengambil daftar model Ollama
app.get("/api/ollama/models", async (req, res) => {
  try {
    const response = await fetch("http://localhost:11434/api/tags");

    if (!response.ok) {
      return res.status(500).json({
        error: "Ollama returned error status",
      });
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching Ollama models:", error);

    res.status(500).json({
      error: "Ollama service is unreachable",
    });
  }
});

app.post("/api/ollama/chat", async (req, res) => {
  try {
    const { model, messages, stream, thinkingMode } = req.body;

    const thinkingModels = [
      "qwen3",
      "deepseek-r1",
    ];

    const supportsThinking = thinkingModels.some((name) =>
      model.startsWith(name)
    );

    let think: boolean;

    if (thinkingMode === "on") {
      think = supportsThinking;
    } else if (thinkingMode === "off") {
      think = false;
    } else {
      think = supportsThinking;
    }

    const ollamaPayload = {
      model,
      messages,
      stream: stream ?? true,
      ...(think ? { think: true } : {}),
    };

    console.log("Ollama request:", {
      model,
      thinkingMode,
      supportsThinking,
      think,
    });

    const ollamaRes = await fetch(
      "http://localhost:11434/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ollamaPayload),
      }
    );

    if (!ollamaRes.ok || !ollamaRes.body) {
      const errorText = await ollamaRes.text();

      console.error(
        "Ollama Error:",
        ollamaRes.status,
        errorText
      );

      return res.status(ollamaRes.status).json({
        error: errorText || "Ollama Error",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/x-ndjson"
    );
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = ollamaRes.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      res.write(value);
    }

    res.end();
  } catch (error) {
    console.error(
      "Error streaming from Ollama:",
      error
    );

    res.status(500).json({
      error: "Failed to connect to Ollama service",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Locally backend running on http://localhost:${PORT}`
  );
});

note:sebenarnya masih ada banyak lagi file lain tapi ini yang utama,aku kasih tau kalau kita perlu aja.

inti app ini:
ini app namanya locally dan ini aku buat untuk jadi interface ai lokal