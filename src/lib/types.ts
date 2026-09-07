export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  thinking?: string;
  showThinking?: boolean;
};