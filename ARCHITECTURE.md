# SJTUAMD — Architecture & Codebase Guide

**What this is:** A modern, static-first rebuild of the legacy Drupal 7 website of the
**上海交通大学德国校友会** (Shanghai Jiao Tong University Alumni Association in Germany /
*SJTU Alumni Germany*). The old PHP + MySQL Drupal site is migrated into a Next.js app
that ships as static content and deploys to Vercel — no PHP, no database at runtime.

The domain of record is `sjtu-germany.de`. Content is bilingual (mostly Simplified
Chinese, with some German), covering alumni activities, news, board (Vorstand) info,
membership, historical articles, and photo galleries.

---

## Repository Layout

```
sjtuamd/
├── ARCHITECTURE.md                 # this file
├── 68970m55641_1.sql               # (gitignored) raw Drupal MySQL dump, ~57 MB
├── database/68970m55641_1.sql      # (gitignored) dump consumed by the extractor
├── files/                          # (gitignored) legacy site files pulled from goneo host
│   └── htdocs-lftp/drupal-7.12/…   #   Drupal webroot incl. sites/default/files + Pictures
├── download_goneo_files.sh         # (gitignored) SFTP pull helpers for the legacy host
├── download_goneo_lftp.sh          #   parallel/resumable mirror via lftp
├── download_goneo_archive.sh       #   tar.gz snapshot pull
└── web/                            # the Next.js application (the only committed code)
```

**Important:** everything except `web/` is migration *input* and is gitignored
(`database/`, `files/`, `*.sql`, `*.tar.gz`, `download_goneo_*.sh`). The repo's single
commit is "Initial Next.js rebuild"; only `web/` and this doc are tracked.

---

## The `web/` Application

Next.js 16 (App Router) + React 19 + TypeScript. No CSS framework — a single hand-written
`app/globals.css` (~1000 lines). No runtime data store; all content is baked in at build time.

```
web/
├── next.config.mjs                 # standalone output, unoptimized images, legacy URL rewrites
├── package.json                    # scripts: extract / dev / build / start / lint
├── scripts/extract-drupal.mjs      # ★ the migration pipeline (Drupal SQL → JSON)
├── src/data/generated/site.json    # ★ generated content bundle (committed, ~895 KB)
├── lib/
│   ├── data.ts                     # loads site.json + Markdown articles; query helpers
│   └── markdown.ts                 # minimal, dependency-free Markdown → HTML + frontmatter
├── content/
│   ├── README.md                   # publishing format for new articles
│   └── articles/_example.md        # template for new Markdown articles
├── app/                            # App Router pages
│   ├── layout.tsx                  # header/footer shell, metadata, nav data
│   ├── page.tsx                    # home: hero album, featured pages, latest news, galleries
│   ├── [slug]/page.tsx             # content detail (pages, articles, galleries) by slug
│   ├── node/[nid]/page.tsx         # legacy /node/<id> → redirect to /<slug>
│   ├── news/page.tsx               # news archive grouped by year
│   ├── gallery/page.tsx            # gallery index
│   ├── not-found.tsx               # 404
│   ├── globals.css                 # all styling
│   └── components/site-navigation.tsx  # 'use client' nav (active-state + mobile menu)
└── public/
    ├── brand/                      # committed logos + hero background
    ├── legacy-files/               # (generated, gitignored) copied Drupal files + Pictures/
    ├── cached-external/mmbiz/      # committed WeChat (mmbiz.qpic.cn) images, hashed .webp
    └── uploads/articles/           # images for new Markdown articles
```

---

## How Content Flows (the key mental model)

There are **two content sources** that merge into the same rendering pipeline:

### 1. Legacy Drupal content (bulk, historical)

`scripts/extract-drupal.mjs` is a **one-off / on-demand build-time extractor**. It:

1. Reads the raw MySQL dump at `database/68970m55641_1.sql`.
2. Hand-parses `INSERT INTO` statements for a fixed set of Drupal 7 tables
   (`node`, `field_data_body`, `field_data_field_{file,image,photo}`, `file_managed`,
   `taxonomy_*`, `url_alias`) — a bespoke SQL-value tokenizer, no MySQL client needed.
3. Joins nodes to their body, images, attachments, taxonomy terms, and URL aliases.
4. **Sanitizes & rewrites** HTML bodies:
   - strips `<script>/<object>/<embed>`, inline `on*=` handlers, `javascript:` URLs;
   - rewrites absolute `sjtu-germany.de` links to root-relative;
   - rewrites `sites/default/files/`, `public://`, `Pictures/`, `SJTUAMD-Files/` to
     `/legacy-files/…`;
   - external WeChat images (`mmbiz.qpic.cn`) → local `/cached-external/mmbiz/<sha1>.webp`;
   - fixes a few known path typos from the legacy data.
5. **Copies files** from the legacy webroot into `public/legacy-files/` (managed files +
   the `Pictures/` directory).
6. Classifies content into **pages** (a fixed `pageSlugs` allow-list + `page` type),
   **articles** (`article` type not in pageSlugs), and **galleries** (`photo_gallery` or
   any node with photos).
7. Writes everything — content, nav, stats, file list — to `src/data/generated/site.json`.

Run it with `npm run extract`. It requires the gitignored `database/` and `files/` inputs
to be present locally; on a clean checkout without those inputs you rely on the already
committed `site.json`.

Current bundle stats (from `site.json`): 154 nodes → 148 published items = 17 pages,
121 articles, 10 galleries; 498 managed files (~210 MB) copied.

### 2. New Markdown articles (ongoing editorial workflow)

New posts are plain Markdown files in `content/articles/*.md` with frontmatter
(`title`, `date`, `slug`, `excerpt`, `image`, `published`, …). See `content/README.md`
and `content/articles/_example.md`. Files starting with `_` or named `README.md` are
skipped; `published: false` / `draft: true` hides a file.

`lib/markdown.ts` is a **small, self-contained Markdown renderer** (no `remark`/`gfm`
dependency): frontmatter parser + block/inline HTML converter with HTML-escaping and
`safeUrl()` allow-listing. Article dates can come from frontmatter or a `YYYY-MM-DD`
filename prefix.

### Merge & query layer — `lib/data.ts`

`lib/data.ts` is the single content API consumed by every page:

- Imports the generated `site.json`, loads Markdown articles at module load, and **merges**
  them into `site.articles` (Markdown articles get synthetic negative `nid`s to avoid
  collisions and sort ahead by date).
- Builds `slug → item` and `nid → item` lookup maps.
- Exposes: `site`, `allContent`, `getContentBySlug`, `getContentByNid`, `featuredPages`,
  `latestArticles`, `relatedArticles`, `bestImage` (photo → image → first inline body
  image, skipping remote mmbiz URLs), and `formatDate` (localized `zh-CN`, `Europe/Berlin`).

---

## Routing

- `/` — home (`app/page.tsx`)
- `/news`, `/gallery` — index pages
- `/<slug>` — catch-all content detail; `generateStaticParams` pre-renders every item's
  slug. Body HTML is injected via `dangerouslySetInnerHTML` (safe because the extractor
  sanitized it at build time).
- `/node/<nid>` — preserves old Drupal URLs by 301-style redirecting to the slug route.
- Path rewrites in `next.config.mjs` map old file URLs (`/sites/default/files/*`,
  `/Pictures/*`, `/SJTUAMD-Files/*`) to `/legacy-files/*` so legacy links keep working.

---

## Commands

```bash
cd web
npm install
npm run extract   # regenerate site.json from database/ + files/  (needs local inputs)
npm run dev       # local dev server
npm run build     # production build (static-first, output: 'standalone')
npm run start     # serve the production build
npm run lint      # next lint
```

**Publishing a new article:** copy `content/articles/_example.md`, rename with a
`YYYY-MM-DD-` prefix, edit frontmatter/body, drop images in `public/uploads/articles/`,
then `npm run build`. No SQL/extractor step needed for new posts.

---

## Deployment

Deploy the `web/` directory to **Vercel**. It is a static-first Next.js site with
`output: 'standalone'` and `images.unoptimized: true` (legacy images are served as-is
from `public/`, so Next's image optimizer is disabled). No PHP or MySQL at runtime.

---

## Migration Tooling (root `download_goneo_*.sh`)

Helpers (gitignored) for pulling the legacy site off the goneo shared host
(`283667.test-my-website.de`, SFTP port 2222):

- `download_goneo_lftp.sh` — resumable parallel `lftp mirror --continue` of the webroot.
- `download_goneo_archive.sh` — server-side tar.gz snapshot then download.
- `download_goneo_files.sh` — simpler file pull.

They prompt interactively for the FTP/SFTP password. These are only needed to (re)acquire
the migration inputs; day-to-day web work does not touch them.

---

## Notes / Gotchas

- **`site.json` is committed and authoritative for legacy content.** The extractor's
  inputs (`database/`, `files/`) are gitignored, so most environments will not be able to
  re-run `npm run extract` — edit legacy content by re-extracting where the inputs exist,
  or (for new content) prefer the Markdown workflow.
- **HTML is sanitized at extraction time, not render time.** Any change to what's
  considered safe belongs in `sanitizeHtml`/`rewriteLegacyUrls` in the extractor (for
  legacy content) or `escapeHtml`/`safeUrl` in `lib/markdown.ts` (for Markdown).
- **Home page hero album, featured cards, and galleries** are driven by `featuredSlugs`
  and gallery photos in `site.json`; there is no CMS.
- **Bespoke, dependency-free parsers** (SQL and Markdown) are used deliberately to keep the
  dependency surface tiny — treat them as project-specific code, not general libraries.
```

