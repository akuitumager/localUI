"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-slate-500"
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() =>
        setTheme(theme === "dark" ? "light" : "dark")
      }
      className="
        text-slate-700 hover:bg-slate-200
        dark:text-slate-300 dark:hover:bg-slate-800 rounded-full size-8
      "
    >
      {theme === "dark" ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </Button>
  );
}