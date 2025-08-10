Here’s the breakdown plan for splitting this PRD into AI‑friendly implementation prompts with manual verification checkpoints:

---

## Step 1 — Initial Setup Prompts
**Prompts:**
1. *Scaffold the project repo*: Create `/frontend` (Next.js App Router + TS) and `/backend` (Fastify + Node.js) with a monorepo structure and `docker-compose.yml`.
2. *Implement base Docker config*: Backend API, frontend, SQLite DB, mounted volume, .env support.
3. *Implement YAML-based configuration loader* with schema validation.
4. *Implement observability hooks* (LangSmith/OpenLLMetry stub integration).

**Manual Verification:**
- Can run `docker compose up` and see both services running.
- Can load config from YAML and env.
- Observability API key toggles visible in config.

---

## Step 2 — Core Backend Features
**Prompts:**
1. *File upload endpoint*: Support drag-and-drop/local picker, validate MIME, enforce max size.
2. *Persist file* to volume, insert DB entry.
3. *Integrate Whisper transcription* via OpenRouter/OpenAI with silence gap segmentation.
4. *Store transcript + timestamps* in DB.

**Manual Verification:**
- Upload supported formats, verify file saved + DB row created.
- Corrupt file returns canonical FAILURE message.
- Silence gap segmentation at ~2.5s.

---

## Step 3 — LLM Post-Processing & Classification
**Prompts:**
1. *LLM integration abstraction* (OpenAI/OpenRouter adapters).
2. *Classifier*: Map transcript to projects using GPT‑5‑nano.
3. *Second pass summary & action extraction* using GPT‑5/Gemini 2.5 Pro.
4. Store structured action items + Markdown in DB.

**Manual Verification:**
- Processed transcript returns correct summary/action schema.
- Language mirroring works (EN/PL).

---

## Step 4 — Frontend MVP
**Prompts:**
1. *Library view*: List recordings, search/filter.
2. *Detail view*: Playback, transcript w/ timestamps, summary, actions.
3. *Reprocess tab*: Chat-like run history with config snapshots; allow new run.
4. *Delete function*: Remove DB record + audio.
5. Export to Markdown & Copy-to-Clipboard.

**Manual Verification:**
- All UI routes render correctly.
- Reprocessing creates a new run and shows in history.

---

## Step 5 — Testing & QA
**Prompts:**
1. *Unit tests*: Backend services, frontend utils.
2. *Integration tests*: API + DB.
3. *E2E tests*: Playwright/Puppeteer MCP scripts for upload → process → reprocess → export flow.
4. CI pipeline: run tests, build Docker image.

**Manual Verification:**
- All tests pass in CI.
- E2E covers core flows.

---

## Step 6 — Packaging & Deployment
**Prompts:**
1. *Finalize Docker image* with all dependencies.
2. *Document run instructions* in README.
3. Verify observability export works when enabled.

**Manual Verification:**
- Single `docker compose up` runs entire app.
- Logs/traces appear in observability dashboard.

---

**Final Feedback Step:**
- Human review of feature completeness vs PRD.
- Identify post-MVP backlog (Phase 2).

---

Would you like me to now embed this step-by-step plan into the PRD as an “Implementation Plan” section so the Dev AI Agent can reference both the requirements and the execution roadmap in one place?

