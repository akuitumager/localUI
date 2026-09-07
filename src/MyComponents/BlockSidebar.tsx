"use client";

import { PromptBlock } from "@/lib/promptBlock";
import { Button } from "@/components/ui/button";
import { Layers, X, Plus, PanelRightClose } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

interface BlockSidebarProps {
  activeBlocks: PromptBlock[];
  onDisableBlock: (id: number) => void;
  onOpenLibrary?: () => void;
  onClose: () => void;
}

export function BlockSidebar({
  activeBlocks,
  onDisableBlock,
  onOpenLibrary,
  onClose,
}: BlockSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "active-blocks-sidebar",
  });
  return (
    <aside
      className="flex h-full w-72 flex-col border-l border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-300 shrink-0"
    >
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Layers className="h-4 w-4 text-orange-600 dark:text-orange-500" />
          <span>Active Blocks</span>
        </div>
        <div className="flex items-center gap-1">
          {onOpenLibrary && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenLibrary}
              className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              title="Tambah Block"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            title="Tutup Sidebar"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 transition-colors ${isOver ? "bg-orange-500/10 border-2 border-dashed border-orange-500/50" : ""
          }`}
      >
        {activeBlocks.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-800 p-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Drag block ke sini untuk mengaktifkan.
            </p>
          </div>
        ) : (
          activeBlocks.map((block) => (
            <div
              key={block.id}
              className="
                group relative flex flex-col gap-1.5 rounded-xl border border-slate-200
                bg-slate-50 p-3 text-xs transition-all hover:border-orange-500/50
                dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-orange-500/50
              "
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                  {block.title}
                </span>
                <button
                  onClick={() => onDisableBlock(block.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded"
                  title="Nonaktifkan Block"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                {block.content}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-200 p-3 text-center text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
        {activeBlocks.length} block aktif disertakan ke prompt
      </div>
    </aside>
  );
}