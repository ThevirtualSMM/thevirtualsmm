# SMM Audit Platform — Tech Stack

## Frontend & Backend Framework

### Next.js 14+ (App Router)
**Role:** Full-stack framework — handles both the React UI and the server-side API routes.  
**Why:** Eliminates the need for a separate Express server. API routes live in the same project as the UI, sharing types and utilities. The App Router enables server components (fast initial loads, no client-side data fetching overhead) and easy file-based routing for the dashboard and audit pages. Deployed easily on Vercel with zero config.

---

## UI & Styling

### Tailwind CSS
**Role:** Utility-first CSS framework for all styling.  
**Why:** Produces clean, minimalistic interfaces quickly without writing custom CSS files. Easy to maintain consistent spacing, color, and typography across the whole app.

### shadcn/ui
**Role:** Pre-built, accessible UI components (buttons, cards, modals, badges, tables).  
**Why:** Components are copied directly into your project (not a black-box npm package), so you can customize them fully. Paired with Tailwind, it produces a polished, professional look without a heavy design system.

### Recharts
**Role:** Chart library for the 90-day performance line chart and source-of-views breakdown.  
**Why:** React-native, lightweight, and composable. Works cleanly with Next.js without hydration issues. Simple API for the chart types needed (line chart, pie/bar for source breakdown).

---

## Authentication

### NextAuth.js (Auth.js)
**Role:** Manages client login sessions (email/password or magic link).  
**Why:** Handles session management, JWT tokens, and secure cookie storage out of the box. Integrates directly with Next.js and is the standard choice. Keeps client sessions scoped so each user only sees their own data.

---

## Instagram Data

### Instagram Graph API (Meta)
**Role:** The sole source of all Instagram Insights data.  
**Why:** The metrics requested (accounts reached, watch time, skip rate, follows from video, source breakdown, etc.) are **private Insights** that only exist inside Instagram's backend. They are not rendered in the public HTML — no scraper can access them. The Graph API is the only legitimate, stable way to retrieve them. Requires OAuth authorization from the account owner and a Meta Developer App.

**Key endpoints used:**
- `GET /{ig-user-id}/media` — fetch list of posts in date range
- `GET /{media-id}/insights` — fetch metrics per post
- `GET /{media-id}/comments` — fetch top comments

**Account requirement:** Client must have a Business or Creator account (not a personal account).

> **Note on Apify for Instagram:** Apify is not used for Instagram in Phase 1. Apify actors scrape publicly visible data only. Private Insights (the core metrics of this audit) require authenticated API access via OAuth. Using Apify for Instagram would either return incomplete public data or violate Meta's Terms of Service by using credential-based login scraping.

---

## AI Analysis

### Claude API (Anthropic) — claude-sonnet-4-6
**Role:** Analyzes the collected post data and generates the written audit summary, identifies best/worst performers, surfaces patterns, and extracts questions from comments.  
**Why:** Claude handles large structured data inputs (many posts' worth of metrics) well within a single prompt, produces consistently formatted JSON output for structured sections, and writes high-quality plain-language summaries. The Sonnet model balances quality and cost for this use case.

**Prompt caching** will be used on the system prompt to reduce cost on repeated audit runs.

---

## Database

### Airtable
**Role:** Primary data store for clients, audits, and post-level metrics.  
**Why:** Provides a visual spreadsheet interface so you can inspect, filter, and manually review all stored data without touching the code or a database client. The Airtable API is straightforward to integrate from Node.js. Ideal for this scale (hundreds of clients, not millions of rows).

**Library used:** `airtable` (official npm package)

**Limitations to know:**
- Airtable has a rate limit of 5 requests/second per base. Batch writes will be used for storing many posts at once.
- Long text fields cap at 100,000 characters — sufficient for captions, comments, and Claude output.
- Not suitable for very high-frequency writes or relational joins at scale. If the platform grows to thousands of daily audits, a migration to Postgres would be warranted.

---

## Social Scraping (Phase 2)

### Apify
**Role:** Scraping TikTok and Pinterest public data in Phase 2.  
**Why:** Apify maintains managed scraping actors for both platforms, handles browser automation, proxies, and anti-bot measures. Much lower maintenance overhead than building and hosting custom scrapers. Pay-per-use pricing scales with usage.

**Actors to use (Phase 2):**
- TikTok: `clockworks/free-tiktok-scraper` or `apify/tiktok-scraper`
- Pinterest: `andrei.neag/pinterest-scraper` or similar

---

## Email Delivery

### Resend
**Role:** Sends transactional emails — audit completion notifications, onboarding emails, token expiry warnings.  
**Why:** Developer-friendly API, excellent deliverability, React Email integration for building styled email templates in the same codebase. Generous free tier for low volume.

**Library used:** `resend` (official npm package)

---

## PDF Generation

### Puppeteer (via `@sparticuz/chromium` for serverless)
**Role:** Generates the downloadable PDF version of the audit report.  
**Why:** Renders the actual audit report HTML page to PDF, ensuring the PDF looks exactly like the in-browser report. Avoids maintaining a separate PDF layout. The `@sparticuz/chromium` package provides a lightweight Chromium build that runs in Vercel serverless functions.

**Alternative considered:** `react-pdf` — more predictable in serverless but requires building a completely separate layout for the PDF, doubling maintenance.

---

## Hosting & Deployment

### Vercel
**Role:** Hosting for the Next.js app.  
**Why:** Native Next.js support, automatic deployments from Git, serverless functions for API routes, zero configuration. Free tier covers development and early production usage.

---

## Environment & Config

### dotenv / Next.js environment variables
**Role:** Stores all API keys and secrets out of the codebase.  
**Key variables needed:**
- `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` — Meta Developer App credentials
- `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` — Airtable access
- `ANTHROPIC_API_KEY` — Claude API
- `RESEND_API_KEY` — Email delivery
- `NEXTAUTH_SECRET` — Session encryption
- `APIFY_TOKEN` — Phase 2

---

## Summary Table

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 | Full-stack app (UI + API) |
| Styling | Tailwind CSS + shadcn/ui | UI components and design |
| Charts | Recharts | 90-day performance chart |
| Auth | NextAuth.js | Client login and sessions |
| Instagram Data | Instagram Graph API | Private Insights via OAuth |
| AI | Claude API (Sonnet 4.6) | Audit analysis and summaries |
| Database | Airtable | Structured data storage |
| Scraping (Phase 2) | Apify | TikTok and Pinterest |
| Email | Resend | Transactional notifications |
| PDF | Puppeteer + Chromium | Report PDF export |
| Hosting | Vercel | Deployment |
