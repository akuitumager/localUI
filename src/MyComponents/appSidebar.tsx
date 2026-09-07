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