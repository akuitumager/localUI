'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect } from 'react';
import { Message } from '@/lib/types';
import { Copy, Check } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

export const MessageBubble = ({ role, content, thinking,showThinking = true }: Message) => {
  const isUser = role === 'user';
  const [dots, setDots] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  useEffect(() => {
    if (!isUser && !content) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isUser, content]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex w-fit max-w-[70%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
          }`}
        >
          {!isUser && thinking && showThinking && (
            <div className="mb-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <div className="mb-1 font-semibold">Thinking</div>
              <div className="whitespace-pre-wrap">{thinking}</div>
            </div>
          )}
          {!isUser && !content ? (
            <span className="flex items-center gap-1 font-mono italic text-slate-500 dark:text-slate-400">
              Thinking{dots}
            </span>
          ) : (
            <div className="prose max-w-none break-words dark:prose-invert">
              <ReactMarkdown
                components={{
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const code = String(children).replace(/\n$/, '');
                    const isInline = !className;

                    if (isInline) {
                      return (
                        <code
                          className="rounded-md bg-slate-200 px-1.5 py-0.5 font-mono text-sm dark:bg-slate-800"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return <CodeBlock language={language} code={code} />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {content && (
          <div className="mt-1 flex gap-1">
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="icon"
              className="relative rounded-full bg-transparent transition-all duration-200 hover:bg-slate-200 hover:scale-110 dark:hover:bg-slate-700 active:scale-95"
            >
              <Copy
                className={`absolute size-5 transition-all duration-300 ${
                  copied ? 'scale-0 rotate-45 opacity-0' : 'scale-100 rotate-0 opacity-100'
                }`}
              />
              <Check
                className={`absolute size-5 transition-all duration-300 ${
                  copied ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-45 opacity-0'
                }`}
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
