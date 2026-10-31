import { systemPrompt } from "@/lib/ask/brain";

/**
 * POST /api/ask  { messages: [{ role: "user" | "assistant", content: string }], hasResume?: boolean }
 * Streams the reply back as plain text. Returns 204 (no content) when no API key is configured or the
 * API is unreachable, and the client answers from its offline brain, so the site works without a key.
 *
 * Env:
 *   ANTHROPIC_API_KEY  required for live answers
 *   ASK_MODEL          optional, defaults to claude-haiku-5-5 (fast and cheap, ideal for this)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ASK_MODEL || "claude-haiku-5-5";
const MAX_INPUT = 500; // characters per message
const MAX_TURNS = 8; // messages of history sent to the model
const LIMIT = 12; // requests per IP...
const WINDOW = 60_000; // ...per minute

// Simple in-memory rate limit. Good enough for a portfolio; per server instance.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  const offline = () => new Response(null, { status: 204 });
  if (!key) return offline();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "Too many questions at once. Try again in a minute." }, { status: 429 });

  let body: { messages?: Msg[]; hasResume?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_INPUT) }));
  // The API needs the conversation to start with the visitor.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Ask a question first" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        stream: true,
        system: systemPrompt(body.hasResume !== false),
        messages,
      }),
      signal: req.signal,
    });
  } catch {
    return offline();
  }
  if (!upstream.ok || !upstream.body) {
    console.error("ask: upstream error", upstream.status, await upstream.text().catch(() => ""));
    return offline();
  }

  // Turn Anthropic's server-sent events into a plain text stream of the reply.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const event = JSON.parse(line.slice(5));
            if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          } catch {
            /* keep-alive or partial line */
          }
        }
      },
    }),
  );

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
