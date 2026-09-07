"use client";
import { MessageBubble } from "./MessageBubble";
import { Message } from "@/lib/types";

type MainLayerProps = {
  messages: Message[];
  showThinking: boolean;
};

export const MainLayer = ({ messages, showThinking }: MainLayerProps) => {
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
              showThinking={showThinking}
            />
          ))}
        </div>
      </section>
    </div>
  );
};