import express from "express";
import cors from "cors";
import chatRouter from "./router/chat";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api", chatRouter);

app.get("/api/ollama/models", async (req, res) => {
  try {
    const response = await fetch("http://localhost:11434/api/tags");

    if (!response.ok) {
      return res.status(500).json({
        error: "Ollama returned error status",
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    res.status(500).json({
      error: "Ollama service is unreachable",
    });
  }
});

const modelThinkingCache = new Map<string, boolean>();

async function checkIfModelSupportsThinking(modelName: string): Promise<boolean> {
  if (modelThinkingCache.has(modelName)) {
    return modelThinkingCache.get(modelName)!;
  }

  try {
    const res = await fetch("http://localhost:11434/api/show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName }),
    });

    if (!res.ok) return false;

    const data = await res.json();

    const template = data.template || "";
    const modelfile = data.modelfile || "";
    const system = data.system || "";
    const fullMeta = `${template} ${modelfile} ${system}`.toLowerCase();

    const supportsThinking =
      fullMeta.includes("<think>") ||
      fullMeta.includes("think_mode") ||
      fullMeta.includes("reasoning") ||
      fullMeta.includes("thinking");

    modelThinkingCache.set(modelName, supportsThinking);
    return supportsThinking;
  } catch (error) {
    console.error("Gagal memeriksa metadata model:", error);
    return false;
  }
}

app.post("/api/ollama/chat", async (req, res) => {
  try {
    const { model, messages, stream, } = req.body;

    const thinkingModels = ["qwen3", "deepseek-r1"];

    const supportsThinking = await checkIfModelSupportsThinking(model);

    const ollamaPayload: Record<string, any> = {
      model,
      messages, 
      stream: stream ?? true,
      ...(supportsThinking ? { think: true } : {}),
    };

    const ollamaRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ollamaPayload),
    });

    if (!ollamaRes.ok || !ollamaRes.body) {
      const errorText = await ollamaRes.text();

      console.error("Ollama Error:", ollamaRes.status, errorText);

      return res.status(ollamaRes.status).json({
        error: errorText || "Ollama Error",
      });
    }

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = ollamaRes.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      res.write(value);
    }

    res.end();
  } catch (error) {
    console.error("Error streaming from Ollama:", error);

    res.status(500).json({
      error: "Failed to connect to Ollama service",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Locally backend running on http://localhost:${PORT}`);
});