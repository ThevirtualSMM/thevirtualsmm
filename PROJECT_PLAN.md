# SMM Audit Platform — Project Plan

## What This Is

A multi-client web platform where social media managers (or their clients) connect their Instagram account, trigger a 90-day audit with one click, and receive a detailed visual report of their performance metrics. The report is displayed in-browser and is downloadable as a PDF.

Phase 1 covers Instagram only. Phase 2 will extend to TikTok and Pinterest.

---

## How the System Works — Full User Flow

### 1. Client Onboarding
A client signs up or receives a login link. After logging in, they land on a clean dashboard that shows their connected accounts and any previous audits.

### 2. Connecting Their Instagram Account
The client clicks "Connect Instagram." This opens a Meta OAuth flow — they authorize your platform to read their Instagram Business or Creator account insights. You store their access token and Instagram account ID securely. This token gives your backend access to their private analytics (watch time, reach, skip rate, etc.) through the official Instagram Graph API.

> **Why OAuth and not scraping:** The metrics you specified (accounts reached, watch time, skip rate, follows from video) are private Insights data. Instagram only exposes them through their API to authorized apps. No scraper, including Apify, can access them — they do not appear in the public-facing UI or page source.

### 3. Triggering an Audit
From the dashboard, the client clicks "Run Audit." The system:
1. Fetches all media objects posted in the last 90 days (posts, reels, carousels)
2. For each piece of content, pulls the full Insights data (all the metrics you listed)
3. Extracts caption text, hashtags, post type, post time, duration, collab status
4. Pulls the top 20 comments per post
5. Parses which comments contain questions

This process runs server-side. A loading state is shown to the user while it completes.

### 4. Claude Analysis
Once the raw data is collected, it is passed to Claude, which:
- Identifies the best and worst performing content (split by: most followers gained, highest engagement rate, highest views)
- Surfaces patterns (best posting times, content formats that outperform, recurring top sources of views)
- Writes a plain-language summary of the account's 90-day performance
- Flags notable observations (e.g., "Your reels have 3x more reach than carousels")

Claude's output is structured JSON so it can be rendered as distinct sections of the report.

### 5. Storing the Data in Airtable
All raw metrics, Claude's analysis, and report metadata are written to Airtable. This means:
- Every audit is permanently stored and can be re-referenced
- Future phases (content strategy, scripts, captions) can pull from this stored audit
- You can visually inspect the data in Airtable without touching the code

### 6. Displaying the Report
As soon as data is ready, the client sees the audit report in-browser. The report includes:
- A 90-day line chart showing views or engagement over time
- Summary metric boxes (total reach, average watch time, overall engagement rate, etc.)
- Best/worst performing posts split by follower gains, engagement, and views
- Top sources of views breakdown
- Recurring questions found in comments
- Claude's written summary

### 7. PDF Download
A "Download PDF" button on the report page generates a styled PDF version of the full audit. The PDF is generated server-side (same data, rendered to PDF format) and downloaded directly.

### 8. Email Notification (Optional — Phase 1.5)
When the audit completes, Resend sends the client an email with a link to view their report. The PDF can optionally be attached.

---

## Airtable Data Architecture

### Table: Clients
Stores one row per client account.

| Field | Description |
|---|---|
| Client ID | Auto-generated unique ID |
| Name | Client full name or brand name |
| Email | Login email |
| Created At | Signup date |
| Instagram Account ID | From Meta OAuth |
| Instagram Username | Display handle |
| Instagram Access Token | Stored encrypted |
| Token Expiry | Long-lived tokens expire after 60 days; must be refreshed |

### Table: Audits
One row per audit run.

| Field | Description |
|---|---|
| Audit ID | Unique ID |
| Client ID | Linked to Clients table |
| Triggered At | Timestamp of "Run Audit" click |
| Completed At | Timestamp when fully processed |
| Status | pending / scraping / analyzing / complete / failed |
| Date Range Start | Start of 90-day window |
| Date Range End | End of 90-day window |
| Claude Summary | Full text of Claude's written analysis |
| Claude JSON Output | Structured analysis (best/worst posts, patterns) |
| Total Posts Scraped | Count |
| PDF URL | Link to generated PDF (if stored) |

### Table: Posts
One row per Instagram post within an audit.

| Field | Description |
|---|---|
| Post ID | Instagram media ID |
| Audit ID | Linked to Audits table |
| Client ID | Linked to Clients table |
| Post Type | image / carousel / reel |
| Posted At | Date and time with timezone |
| Caption | Full caption text |
| Hashtags | Full list |
| Is Collab | Boolean |
| Duration Seconds | Reels only |
| Views | Total views |
| Accounts Reached | Unique accounts reached |
| Avg Watch Time | Seconds |
| Follows From Post | Number |
| Skip Rate | Percentage |
| Share Rate | Percentage |
| Like Rate | Percentage |
| Save Rate | Percentage |
| Repost Rate | Percentage |
| Comment Rate | Percentage |
| Source: Home | % of views from Home feed |
| Source: Explore | % of views from Explore |
| Source: Profile | % of views from Profile |
| Source: Hashtags | % of views from Hashtags |
| Source: Other | % of views from Other |
| Top 20 Comments | JSON array of comment text |
| Questions in Comments | Extracted question strings |
| Performance Tier | best_followers / best_engagement / best_views / worst_* |

---

## Instagram API — Important Constraints

- **Account type required:** The client must have an Instagram **Business** or **Creator** account. Personal accounts do not have access to Insights via the API.
- **Token lifespan:** Long-lived access tokens last 60 days. The platform must prompt clients to re-authorize before their token expires.
- **Historical limit:** Instagram's API returns Insights for posts up to approximately 2 years old, but rate limits apply. 90 days is well within range.
- **Rate limits:** The API has call limits per user token. Audits with many posts (200+) will need to be paginated carefully with small delays.
- **Meta App Review:** To access Insights beyond basic fields in production, your Meta Developer App must go through App Review. Plan for 1–2 weeks for this approval process.

---

## Phase Breakdown

### Phase 1 — Instagram Audit (Current Scope)
- Client auth and dashboard
- Instagram OAuth connection
- 90-day data fetch via Graph API
- Claude analysis
- In-browser report with charts and metric boxes
- PDF download
- Airtable storage

### Phase 2 — TikTok and Pinterest
- Apify actors for TikTok and Pinterest scraping (public data)
- Extend report to cover all three platforms
- Cross-platform comparison view

### Phase 3 — Strategy and Content Generation
- Content strategy generator (pulls from stored audit data)
- Reel script generator
- Carousel brief generator
- Caption suggestions
- All powered by Claude, seeded by the Airtable audit data

---

## Security Considerations

- Instagram access tokens must be stored encrypted (not plain text in Airtable)
- Client sessions must be scoped so users can only see their own data
- The Meta app must go through proper App Review before going live with real clients
- PDF generation must be scoped per user — never expose another client's data
