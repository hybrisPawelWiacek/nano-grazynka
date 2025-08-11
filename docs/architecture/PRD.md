# nano‑Grazynka — Product Requirements Document (PRD)

> **Status:** v1.1 (Updated for completeness)  
> **Owner:** Paweł  
> **Editor:** (Dev AI Agent)  
> **Date:** 2025‑08‑08  
> **Phase:** MVP (local Docker, local file upload)

---

## 1) Problem Statement
You (Paweł) create voice notes (EN/PL) and need a fast utility to: (a) transcribe, (b) summarize, and (c) extract action points in a consistent Markdown structure, following strict rules (no metadata inference; transcription is the sole source of truth). Results must be stored, browsable, manageable, and **reprocessable** with version history.

## 2) Goals & Non‑Goals
**Goals (MVP):**
- Upload audio from local disk (common formats: mp3, m4a/aac, wav, flac, ogg; validate list).  
- Transcribe with **most capable Whisper model available via OpenRouter or OpenAI API**.  
- Generate a second‑pass LLM summary per configurable **System Prompt** template + optional **User Prompt**.  
- Persist: original audio (optional), raw transcript with timestamps, summary, action points (structured), detected project(s), language.  
- Library to browse/search/filter; item detail view.  
- Manage items: **delete** recording + associated data; **rerun only post‑transcription** processing with new user prompt or modified system template variables.  
- Versioning: keep a **history of reprocessing runs** per item (chat‑like view).  
- Export/download Markdown (.md) and Copy‑to‑Clipboard.

**Non‑Goals (MVP):**
- Cloud auth/multi‑user.  
- Google Drive import/export.  
- Rerunning Whisper transcription jobs.  
- Real‑time in‑browser recording.  
- Team sharing/permissions.  
- Local Whisper runtime (kept in config for post‑MVP option).

## 3) User Stories (MVP)
1. Upload audio, optionally provide a user prompt → Process → Get transcription, summary, and actions, saved and viewable.  
2. Browse Library, search/filter by project, language, date.  
3. View item details, export to Markdown.  
4. Configure System Prompt variables without code changes.  
5. Delete items.  
6. Rerun only post-transcription LLM with a new prompt/template, viewing history in chat-like form.  
7. View and edit configuration variables (projects, teams, language policy, etc.) used in the **System Prompt** originally based on the Custom Gem proof‑of‑concept, stored in YAML.

## 4) Success Metrics (MVP)
- 95%+ valid files process successfully.
- < 60s for a 10‑minute file.
- Subjective accuracy acceptance.
- 100 consecutive uploads without crashes.

## 5) Functional Requirements
### 5.1 Upload & Validation
- Drag‑and‑drop or file picker.  
- Validate extensions/MIME; clear error messages.  
- Max file size configurable (default 200 MB; up to 2 hours audio).  
- Keep audio toggle.

### 5.2 Transcription
- Provider order (configurable): OpenRouter Whisper → OpenAI Whisper → (future) Local Whisper.  
- Always select **most powerful available model** from chosen provider.  
- Language auto‑detect.  
- Timestamps at silence gaps ≥ 2.5 seconds (configurable).  
- On failure → canonical FAILURE text.

### 5.3 Second‑Pass LLM Processing
- Transcript is the only source of truth.  
- Classifier: GPT‑5‑nano (via OpenRouter/OpenAI).  
- Summary/Actions: GPT‑5 or Gemini 2.5 Pro (via OpenRouter/OpenAI; selectable).  
- Action points schema: `title, owner?, dueDate?, priority?, project?`.  
- Language mirroring: EN/PL supported; warning banner for others.  
- **System Prompt** configuration based on POC Custom Gem: contains immutable rules (no metadata inference, language mirroring, canonical failure path, default summary/action structure) with user‑specific variables in YAML (projects, teams, preferred format, headings, etc.).

### 5.4 Classification & Tagging
- LLM classifier maps to configured projects; manual override possible.

### 5.5 Library, Item View & Versioning
- Searchable/filterable list.  
- Detail view: playback (if stored), transcript, summary, actions, metadata.  
- Reprocess tab with chat‑like history, config snapshots, new prompt/template inputs.  
- Delete removes item and optionally audio.

### 5.6 Configuration
- YAML for user, projects, teams, headings, silence gap, provider order, models, cost caps, keep‑audio flag.  
- `.env` for secrets (API keys, observability tokens).

### 5.7 UI & Design
- Light theme, minimal color palette (avoid blue/purple).  
- Apple‑like design aesthetics; To‑doist as secondary reference.  
- Clean utility layout with keyboard‑friendly navigation and ARIA basics.

### 5.8 Testing Strategy
- Unit tests (backend/frontend utils).  
- Integration tests (API + DB + transcription/LLM stubs).  
- E2E tests with Playwright/Puppeteer MCP servers for agentic test execution.

## 6) Non‑Functional Requirements
- Deploy: Docker (`docker compose up`).  
- Data: SQLite with volume; files on volume.  
- Privacy: Local‑first; redact secrets in logs.  
- Logging: Structured JSON with trace IDs; retention 7 days; rotate at 50MB/file, max 10 files.  
- Observability: Pluggable tracing (default: simple standard/free; configurable to LangSmith/OpenLLMetry).  
- Accessibility: Keyboard‑friendly, basic ARIA.

## 7) System Design (MVP)
Frontend: Next.js (App Router) + TypeScript.  
Backend: Node.js (Fastify).  
DB: SQLite via Prisma.  
Auth: None (localhost binding).  
Job queue: in‑process.

## 8) Acceptance Criteria
- 10‑min m4a/mp3 processes with EN/PL mirrored outputs.  
- Corrupted file → canonical FAILURE text.  
- Library search works.  
- Export/Copy Markdown works.  
- Reprocess creates new Run with visible config/prompt diff; history shown.  
- Config changes apply without rebuild.  
- Logs and observability integration functional.  
- MCP‑based E2E tests pass.

## 9) Post‑MVP Options
- Google Drive integration.  
- Multi‑user/auth.  
- Local Whisper runtime.  
- Notion/Slack/Email exports.  
- Vector search.

---

**Appendix A — Canonical FAILURE Message**
> "I am sorry, but I was unable to process the provided audio file. I cannot generate a transcription or a summary. Please verify that the file is in a supported format (like .mp3, .wav, .flac) and is not corrupted."

**Appendix B — System Prompt Template (parameterized)**
- User‑specific parts (projects, teams, language policy, preferred format, headings) in YAML.  
- Immutable rules: STT is single source of truth; no metadata inference; success/failure branching; output schema; language mirroring.

