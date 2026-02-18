# Company AI Internal Assistant

A smart internal knowledge base assistant that lets employees ask questions about company documents, HR policies, SOPs, and procedures — and get instant, accurate answers powered by AI.

---

## What It Does

Employees can type any question in a chat interface — "What's our vacation policy?", "How do I submit expenses?", "What are the onboarding steps?" — and the assistant finds the relevant company documents and answers using AI.

Admins can upload documents (PDF, DOCX, TXT) or import web pages via URL, and they're instantly searchable by the assistant.

---

## Features

- **AI Chat Interface** — Streaming responses with a clean, dark-themed UI
- **Source Citations** — Every answer shows which document it came from, with an excerpt preview
- **Document Upload** — Drag and drop PDFs, Word docs, and text files
- **URL Import** — Paste any URL and Firecrawl scrapes the content automatically
- **Site Crawler** — Crawl an entire website and index all pages at once
- **Admin Panel** — Manage documents, view stats, delete entries
- **Mock Data** — Pre-loaded with sample HR, IT, and onboarding documents

---

## How It Was Built

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI Model | Llama 3.3 70B via Groq |
| Web Scraping | Firecrawl |
| Search | MiniSearch (full-text) |
| PDF Parsing | pdf-parse |
| DOCX Parsing | mammoth |
| Icons | Lucide React |

### Architecture

```
User asks a question
       ↓
Search index finds the most relevant document chunks (MiniSearch)
       ↓
Top 5 chunks are injected into the AI prompt as context
       ↓
Groq (Llama 3.3 70B) generates a streaming answer
       ↓
Response streams back to the browser with source citations
```

This pattern is called **RAG (Retrieval-Augmented Generation)** — instead of the AI relying on its training data alone, it searches your actual company documents first and uses those as the source of truth.

### Document Pipeline

```
File upload or URL import
       ↓
Text extracted (pdf-parse for PDFs, mammoth for DOCX, Firecrawl for URLs)
       ↓
Text split into 600-character overlapping chunks
       ↓
Chunks indexed in MiniSearch for fast retrieval
       ↓
Metadata + chunks saved to data/store.json
```

### Project Structure

```
app/
├── app/
│   ├── page.tsx              # Main chat interface
│   ├── layout.tsx            # Root layout + global styles
│   ├── globals.css           # Global CSS (dark theme, markdown styles)
│   ├── admin/
│   │   └── page.tsx          # Admin panel (upload, manage docs)
│   └── api/
│       ├── chat/route.ts     # Chat endpoint — RAG + Groq streaming
│       ├── upload/route.ts   # File upload endpoint
│       ├── crawl/route.ts    # URL import endpoint (Firecrawl)
│       └── documents/route.ts # List + delete documents
├── lib/
│   ├── types.ts              # Shared TypeScript types
│   ├── store.ts              # Read/write the JSON document store
│   ├── extractor.ts          # Extract text from files + chunk it
│   ├── search.ts             # MiniSearch index management
│   └── initIndex.ts          # Hydrate search index on server start
├── data/
│   ├── store.json            # Persisted documents + chunks (auto-generated)
│   └── mock/                 # Sample company documents for seeding
│       ├── hr-policy.txt
│       ├── it-sop.txt
│       └── onboarding-sop.txt
└── scripts/
    └── seed.ts               # Script to pre-load mock documents
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file:

```env
GROQ_API_KEY=your_groq_api_key       # Get free at console.groq.com
FIRECRAWL_API_KEY=your_firecrawl_key # Get free at firecrawl.dev
```

### 3. Seed mock company data (optional)

```bash
npm run seed
```

This loads sample HR policies, IT SOPs, and onboarding guides so the assistant works immediately.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Usage

### Chat (localhost:3000)
- Type any question about company policies or procedures
- Click a suggestion to try a pre-written question
- Source badges below each answer show which documents were used — click to preview the excerpt

### Admin Panel (localhost:3000/admin)
- **Upload files** — Drag and drop PDFs, DOCX, or TXT files
- **Import from URL** — Single page scrape or full site crawl
- **Manage documents** — View all indexed documents and delete any

---

## Deployment (Vercel)

```bash
npm run build   # Verify the build passes
```

Then push to GitHub and connect the repo to Vercel. Add your environment variables in the Vercel dashboard under Settings → Environment Variables.

> **Note:** The `data/store.json` file is local only. For production, replace the JSON file store with a database like Supabase or PlanetScale.

---

## API Keys

| Key | Where to get it | Cost |
|-----|----------------|------|
| `GROQ_API_KEY` | console.groq.com | Free (rate limited) |
| `FIRECRAWL_API_KEY` | firecrawl.dev | Free tier available |
