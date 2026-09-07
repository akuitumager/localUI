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
