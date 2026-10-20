import { MODELS } from "./_models.js";

const ALLOWED_ORIGINS = [
  "https://jaybapat.github.io",
  "https://PASTE-CODEHS-ORIGIN-HERE",
];

function cors(req, res, methods) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.HACKCLUB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "HACKCLUB_API_KEY is not set in Vercel." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { model, messages } = body;

  if (!MODELS.includes(model)) {
    return res.status(400).json({ error: "Model not allowed." });
  }

  const validMessages =
    Array.isArray(messages) &&
    messages.length >= 1 &&
    messages.length <= 50 &&
    messages.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0 &&
        m.content.length <= 8000
    );

  if (!validMessages) {
    return res.status(400).json({ error: "Invalid messages." });
  }

  try {
    const r = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });
    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json(data);
  } catch {
    return res.status(502).json({ error: "Could not reach the AI service." });
  }
}
