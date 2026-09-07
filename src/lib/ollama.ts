const BACKEND_URL = "http://localhost:3001/api/ollama";
import { Message } from "./types";

export type OllamaModel = {

  name: string;

  supportsThinking: boolean;

};

export async function getOllamaModels(): Promise<OllamaModel[]> {
  const response = await fetch(`${BACKEND_URL}/models`);

  if (!response.ok) {
    throw new Error("Failed to fetch Ollama models");
  }

  const data = await response.json();
  return data.models;
}

export async function chatWithOllama(
  model: string,
  messages: Message[],
  onChunk: (chunk: string, thinking?: string) => void,
  signal?: AbortSignal,
) {

  

  const payload = {
    model,
    messages,
    stream: true,
  };

  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to connect to Ollama");
  }

  if (!response.body) {
    throw new Error("Ollama response body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    if (signal?.aborted) {
      await reader.cancel();
      break;
    }

    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");

    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);

        if (data.message?.thinking) {
          onChunk("", data.message.thinking);
        }

        if (data.message?.content) {
          onChunk(data.message.content);
        }
      } catch (err) {

      }
    }
  }
}