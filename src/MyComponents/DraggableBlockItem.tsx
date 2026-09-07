"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PromptBlock } from "@/lib/promptBlock";
import { GripVertical } from "lucide-react";

interface DraggableBlockItemProps {
  block: PromptBlock;
}

export function DraggableBlockItem({ block }: DraggableBlockItemProps) {
  // Hook dnd-kit untuk membuat elemen bisa ditarik
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: block.id,
    });

  // Menerapkan posisi transform CSS saat item ditarik
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-start gap-2.5 rounded-xl border border-slate-200
        bg-white p-3 text-xs shadow-sm transition-shadow hover:shadow-md
        dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700
        ${isDragging ? "opacity-40 border-orange-500 shadow-lg z-50" : "opacity-100"}
      `}
    >
      {/* Handle Pemicu Drag (Grip Icon) */}
      <div
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:hover:text-slate-300 shrink-0"
        title="Tarik untuk memindahkan"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Detail Block Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate">
          {block.title}
        </h4>
        <p className="text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed whitespace-pre-wrap">
          {block.content}
        </p>
      </div>
    </div>
  );
}