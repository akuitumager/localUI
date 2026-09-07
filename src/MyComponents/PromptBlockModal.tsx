"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PromptBlock } from "@/lib/promptBlock";
import { DraggableBlockItem } from "./DraggableBlockItem";
import { Plus, Blocks } from "lucide-react";

interface PromptBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: PromptBlock[];
  onAddBlock: (block: PromptBlock) => void;
}

export function PromptBlockModal({
  isOpen,
  onClose,
  blocks,
  onAddBlock,
}: PromptBlockModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const inactiveBlocks = blocks.filter((b) => !b.enabled);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    const newBlock: PromptBlock = {
      id: crypto.randomUUID(),
      title,
      content,
      enabled: false,
    };
    onAddBlock(newBlock);
    setTitle("");
    setContent("");
    setIsCreating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 pointer-events-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Blocks className="h-5 w-5 text-orange-500" />
            <span>Library Prompt Block</span>
          </DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            className="text-xs h-8 gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            {isCreating ? "Batal" : "Buat Baru"}
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pt-2 space-y-3">
          {isCreating && (
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tambah Block Baru
              </span>
              <Input
                placeholder="Judul block (misal: Bahasa Indonesia)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9"
              />
              <Textarea
                placeholder="Isi prompt block..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-xs min-h-[70px]"
              />
              <Button
                size="sm"
                onClick={handleCreate}
                className="self-end text-xs h-8 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Simpan Block
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-slate-400">
              Tarik (drag) block di bawah ini ke BlockSidebar kanan:
            </span>

            {inactiveBlocks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl dark:border-slate-800">
                Semua block sudah aktif atau belum ada block.
              </div>
            ) : (
              inactiveBlocks.map((block) => (
                <DraggableBlockItem key={block.id} block={block} />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}