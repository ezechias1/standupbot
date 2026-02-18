/**
 * api/chat/route.ts — The core RAG (Retrieval-Augmented Generation) endpoint.
 *
 * How it works:
 * 1. Receive the full conversation history from the frontend
 * 2. Search the document index for chunks relevant to the latest user question
 * 3. Inject those chunks into the AI system prompt as grounding context
 * 4. Stream the AI response back using Server-Sent Events (SSE)
 * 5. Send source metadata first so the UI can show citation badges immediately
 */
import Groq from "groq-sdk";
import { ensureIndexLoaded } from "@/lib/initIndex";
import { search, buildSources } from "@/lib/search";

// Groq client — uses Llama 3.3 70B which is free, fast, and very capable for Q&A
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { messages } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  // Ensure the search index is hydrated before querying it
  ensureIndexLoaded();

  // Extract the latest user message to use as the search query
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUserMessage?.content ?? "";

  // Find the 5 most relevant document chunks for this question
  const relevantChunks = search(query, 5);

  // Build source references for the UI's citation badges
  const sources = buildSources(relevantChunks);

  // Format the retrieved chunks as numbered context blocks for the prompt
  const context =
    relevantChunks.length > 0
      ? relevantChunks
          .map((c, i) => `[Source ${i + 1} — ${c.docName}]\n${c.text}`)
          .join("\n\n---\n\n")
      : null;

  // System prompt grounds the AI in the retrieved documents.
  // If no relevant docs were found, it tells the AI to admit it honestly.
  const systemPrompt = `You are an intelligent internal company assistant. You have access to company documents including HR policies, standard operating procedures, and general company information.

${
  context
    ? `Use the following relevant document excerpts to answer the employee's question. Always base your answer on the provided context. If the answer is not in the context, say so honestly.

RELEVANT DOCUMENTS:
${context}`
    : "No relevant documents were found for this query. Let the employee know you don't have information on this topic and suggest they contact HR or their manager."
}

Guidelines:
- Be concise, helpful, and professional
- Cite which document your information comes from when relevant
- If policies or procedures apply, quote them accurately
- Use bullet points and formatting when it helps clarity`;

  const encoder = new TextEncoder();

  // Stream the response using a ReadableStream + Server-Sent Events.
  // This lets the browser display text as it arrives word-by-word.
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send source citations first — the UI shows badges before text starts
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`)
        );

        // Open a streaming connection to Groq / Llama 3.3
        const groqStream = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages, // Include full conversation history for multi-turn context
          ],
        });

        // Forward each text delta to the browser as it arrives
        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        // Signal the frontend that the stream is finished
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("Stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
