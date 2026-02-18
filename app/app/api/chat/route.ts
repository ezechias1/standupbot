import Groq from "groq-sdk";
import { ensureIndexLoaded } from "@/lib/initIndex";
import { search, buildSources } from "@/lib/search";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { messages } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  ensureIndexLoaded();

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUserMessage?.content ?? "";

  const relevantChunks = search(query, 5);
  const sources = buildSources(relevantChunks);

  const context =
    relevantChunks.length > 0
      ? relevantChunks
          .map((c, i) => `[Source ${i + 1} — ${c.docName}]\n${c.text}`)
          .join("\n\n---\n\n")
      : null;

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

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send sources metadata first
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`)
        );

        const groqStream = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        });

        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

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
