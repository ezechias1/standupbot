import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { v4 as uuidv4 } from "uuid";
import { readStore, writeStore } from "@/lib/store";
import { chunkText } from "@/lib/extractor";
import { addChunks } from "@/lib/search";
import { ensureIndexLoaded, invalidateIndex } from "@/lib/initIndex";
import type { Document } from "@/lib/types";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY ?? "",
});

export async function POST(req: Request) {
  try {
    ensureIndexLoaded();

    const body = (await req.json()) as {
      url: string;
      category?: string;
      mode?: "scrape" | "crawl";
      crawlLimit?: number;
    };

    const { url, category = "other", mode = "scrape", crawlLimit = 10 } = body;

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY is not set in .env.local" },
        { status: 500 }
      );
    }

    const store = readStore();
    const addedDocuments: Document[] = [];

    if (mode === "scrape") {
      // ── Single page ─────────────────────────────────────────────────────
      const result = await firecrawl.scrape(url, { formats: ["markdown"] });

      const text = result.markdown?.trim() ?? "";
      if (text.length < 50) {
        return NextResponse.json(
          { error: "Firecrawl could not extract usable content from that URL" },
          { status: 422 }
        );
      }

      const docId = uuidv4();
      const docName =
        (result.metadata as { title?: string } | undefined)?.title?.trim() ||
        titleFromUrl(url);

      const chunks = chunkText(text, docId, docName, category);
      const document: Document = {
        id: docId,
        name: docName,
        category: category as Document["category"],
        uploadedAt: new Date().toISOString(),
        size: Buffer.byteLength(text, "utf-8"),
        chunkCount: chunks.length,
      };

      store.documents.push(document);
      store.chunks.push(...chunks);
      addChunks(chunks);
      addedDocuments.push(document);
    } else {
      // ── Multi-page crawl ─────────────────────────────────────────────────
      const crawlJob = await firecrawl.crawl(url, {
        limit: crawlLimit,
        scrapeOptions: { formats: ["markdown"] },
      });

      if (!crawlJob.data?.length) {
        return NextResponse.json(
          { error: "Crawl returned no results" },
          { status: 422 }
        );
      }

      for (const page of crawlJob.data) {
        const text = (page.markdown ?? "").trim();
        if (text.length < 50) continue;

        const meta = page.metadata as
          | { title?: string; url?: string; sourceURL?: string }
          | undefined;

        const pageUrl = meta?.url ?? meta?.sourceURL ?? url;
        const docName = meta?.title?.trim()
          ? `${meta.title.trim()} — ${titleFromUrl(pageUrl)}`
          : titleFromUrl(pageUrl);

        const docId = uuidv4();
        const chunks = chunkText(text, docId, docName, category);

        const document: Document = {
          id: docId,
          name: docName,
          category: category as Document["category"],
          uploadedAt: new Date().toISOString(),
          size: Buffer.byteLength(text, "utf-8"),
          chunkCount: chunks.length,
        };

        store.documents.push(document);
        store.chunks.push(...chunks);
        addChunks(chunks);
        addedDocuments.push(document);
      }

      if (addedDocuments.length === 0) {
        return NextResponse.json(
          { error: "No pages with usable content were found" },
          { status: 422 }
        );
      }
    }

    writeStore(store);
    invalidateIndex();

    return NextResponse.json({
      success: true,
      documentsAdded: addedDocuments.length,
      documents: addedDocuments,
    });
  } catch (err) {
    console.error("Crawl error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isValidUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function titleFromUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const slug = pathname.replace(/\/$/, "").split("/").pop() ?? "";
    const readable = slug.replace(/[-_]/g, " ").replace(/\.\w+$/, "").trim();
    return readable ? `${readable} (${hostname})` : hostname;
  } catch {
    return url.slice(0, 60);
  }
}
