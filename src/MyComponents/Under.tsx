import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  onSendTo: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  onOpenBlocks?: () => void;
};

export const Under = ({
  onSendTo,
  onStop,
  isGenerating,
  onOpenBlocks,
}: ChatInputProps) => {
  return (
    <div className="flex shrink-0 flex-row items-center justify-center gap-2 p-4">
      <ChatInput
        onSend={onSendTo}
        onStop={onStop}
        isGenerating={isGenerating}
      />

      {/*tombol yang ini*/}
      <Button
        className="
          size-14 rounded-full text-2xl font-bold

          bg-slate-200 text-slate-900
          hover:bg-slate-300

          dark:bg-slate-900 dark:text-white
          dark:hover:bg-slate-800
        "
        onClick={onOpenBlocks}
      >
        +
      </Button>
    </div>
  );
};