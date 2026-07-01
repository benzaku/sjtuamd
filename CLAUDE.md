# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project: SJTUAMD

See `ARCHITECTURE.md` for the full codebase guide (Next.js static rebuild of the legacy
Drupal site; app lives in `web/`).

### Vercel

This project uses a dedicated Vercel account/config, **not** the default one. Always pass
the isolated global config to every `vercel` command:

```bash
vercel --global-config ~/.vercel-sjtuamd <command>
```

Examples:

```bash
vercel --global-config ~/.vercel-sjtuamd login
vercel --global-config ~/.vercel-sjtuamd link
vercel --global-config ~/.vercel-sjtuamd deploy --archive=tgz          # preview
vercel --global-config ~/.vercel-sjtuamd deploy --archive=tgz --prod   # production
```

#### Required deploy flags & project settings

- **Always pass `--archive=tgz`.** `web/public/legacy-files/` holds thousands of copied
  Drupal images (the `Pictures/` tree), which blows past Vercel's 15,000-file upload
  limit. Without `--archive=tgz`, deploy fails with `missing_archive`.
- **The project must keep `framework = nextjs` and `rootDirectory = web`.** The git repo
  root is *not* the app (it holds the SQL dump + legacy mirror). If these settings are
  null, Vercel builds from the repo root and every route 404s. They are set on the Vercel
  project (`sjtuamd`, org `team_B7GCn1CCp2PPmhZaJyZPqGOk`); verify with:
  ```bash
  TOKEN=$(python3 -c "import json;print(json.load(open('$HOME/.vercel-sjtuamd/auth.json'))['token'])")
  curl -s -H "Authorization: Bearer $TOKEN" \
    "https://api.vercel.com/v9/projects/sjtuamd?teamId=team_B7GCn1CCp2PPmhZaJyZPqGOk" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['framework'],d['rootDirectory'])"
  # expect: nextjs web
  ```
- A repo-root `.vercelignore` excludes the migration inputs (`files/`, `database/`,
  `*.sql`, `download_goneo_*.sh`, `node_modules`, `.next`) so uploads stay small
  (~266 MB instead of ~1.3 GB). Keep it in place.
- Preview deployments are behind **Vercel Deployment Protection** (SSO). All routes return
  `302 → vercel.com/sso-api` to unauthenticated clients — that is healthy, not a failure.
  Open preview URLs in a browser signed in to the Vercel account to view them.

You can run `vercel deploy` from either the repo root or `web/`; the project link lives at
the repo root and `rootDirectory = web` selects the app.