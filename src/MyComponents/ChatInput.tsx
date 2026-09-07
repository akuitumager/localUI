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