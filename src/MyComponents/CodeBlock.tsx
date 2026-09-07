"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockProps = {
  language: string;
  code: string;
};

export function CodeBlock({
  language,
  code,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-700">
      
      <div
        className="
          flex items-center justify-between
          bg-slate-800 px-3 py-2
          text-sm text-slate-300
        "
      >
        <span className="font-mono text-xs">
          {language || "text"}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="
            h-8 gap-2
            text-slate-300
            hover:bg-slate-700
            hover:text-white
          "
        >
          {copied ? (
            <>
              <Check size={15} />
              Copied
            </>
          ) : (
            <>
              <Copy size={15} />
              Copy
            </>
          )}
        </Button>
      </div>

      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          padding: "16px",
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>

    </div>
  );
}