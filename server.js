import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({
  path: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    ".env"
  )
});

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

console.log(
  "OpenRouter key loaded:",
  Boolean(process.env.OPENROUTER_API_KEY)
);


app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    // Prevent empty messages
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please type a message before sending."
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model =
      process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

    if (!apiKey) {
      return res.status(500).json({
        error: "OpenRouter API key is missing from .env."
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: message.trim()
            }
          ],
          max_tokens: 15000,
reasoning: {
  effort: "low"
},
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "OpenRouter request failed."
      });
    }

    const choice = data.choices?.[0];
const content = choice?.message?.content;

console.log("Model finish reason:", choice?.finish_reason);
console.log("Model response:", JSON.stringify(content));

let reply = "";

if (typeof content === "string") {
  reply = content.trim();
} else if (Array.isArray(content)) {
  reply = content
    .filter(part => part.type === "text" && part.text)
    .map(part => part.text)
    .join("\n")
    .trim();
}

if (!reply) {
  console.error("Empty model response:", JSON.stringify(data));
  return res.status(502).json({
    error: "The AI provider returned no text. Please try again or choose another free model."
  });
}

res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({
      error: "Server error. Check the PowerShell terminal."
    });
  }
});


app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Nova AI running at http://localhost:${port}`));
