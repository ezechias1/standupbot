/**
 * api/crawl/route.ts — URL import endpoint powered by Firecrawl.
 *
 * Two modes:
 *
 * "scrape" (default) — Scrapes a single URL and indexes its content.
 *   Best for: a specific help page, policy doc, or article.
 *
 * "crawl" — Crawls an entire website up to a page limit and indexes each page.
 *   Best for: a full documentation site, wiki, or help center.
 *
 * Both modes run through the same pipeline as file uploads:
 *   URL → Firecrawl extracts markdown → split into chunks → save → index
 */
import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { v4 as uuidv4 } from "uuid";
import { readStore, writeStore } from "@/lib/store";
import { chunkText } from "@/lib/extractor";
import { addChunks } from "@/lib/search";
import { ensureIndexLoaded, invalidateIndex } from "@/lib/initIndex";
import type { Document } from "@/lib/types";

// Firecrawl client — handles JavaScript-rendered pages, cleans boilerplate, returns markdown
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

    // Validate that the URL is a real http/https address
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
      // ── Single page scrape ───────────────────────────────────────────────
      // Firecrawl fetches the page, strips navigation/footers, returns clean markdown
      const result = await firecrawl.scrape(url, { formats: ["markdown"] });

      const text = result.markdown?.trim() ?? "";
      if (text.length < 50) {
        return NextResponse.json(
          { error: "Firecrawl could not extract usable content from that URL" },
          { status: 422 }
        );
      }

      const docId = uuidv4();
      // Use the page's <title> tag as the document name, fall back to the URL slug
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
      // ── Multi-page site crawl ────────────────────────────────────────────
      // Firecrawl follows links from the starting URL up to `crawlLimit` pages
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

      // Process each crawled page the same way as a single scrape
      for (const page of crawlJob.data) {
        const text = (page.markdown ?? "").trim();
        if (text.length < 50) continue; // Skip pages with no useful content

        const meta = page.metadata as
          | { title?: string; url?: string; sourceURL?: string }
          | undefined;

        const pageUrl = meta?.url ?? meta?.sourceURL ?? url;
        // Combine the page title with the URL slug for a readable document name
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

    // Persist everything to disk and mark the index stale
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

/** Validates that a string is a proper http/https URL */
function isValidUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Converts a URL into a readable document name.
 * e.g. "https://docs.acme.com/hr/vacation-policy" → "vacation policy (docs.acme.com)"
 */
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
