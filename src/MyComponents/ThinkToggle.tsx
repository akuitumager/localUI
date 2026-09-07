"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ThinkingToggleProps = {
  showThinking: boolean;
  onToggle: () => void;
};

export function ThinkingToggle({
  showThinking,
  onToggle,
}: ThinkingToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onToggle}
      title={showThinking ? "Thinking: visible" : "Thinking: hidden"}
      aria-label={showThinking ? "Thinking: visible" : "Thinking: hidden"}
      className="size-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
    >
      {showThinking ? (
        <Check className="size-5" />
      ) : (
        <X className="size-5" />
      )}
    </Button>
  );
}