# Kai v2 — Capability & Feature Summary

**POC:** Kai 2.0 — AI Sales Assistant inside WizCommerce's WizOrder platform
**Build branch:** `poc-v2.2`
**Production URL:** https://kaidemov0.vercel.app
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Recharts · Web Speech API · Anthropic Messages API (Claude Sonnet 4.6) · ElevenLabs

---

## 1. What Kai v2 Is

Kai is a sales-floor AI co-pilot embedded directly inside WizOrder. It greets users with a personalized morning briefing, understands which WizOrder page they're on, answers questions with mixed text + interactive widgets, streams natural-language insight from Claude, and chains follow-up actions through clickable chips — all while sharing state with WizOrder's own Orders / Customers / CRM pages.

The demo runs in two modes:
- **Demo mode** (default) — instant, fixture-driven responses. No LLM calls. Toggled with `Cmd+Shift+D`.
- **AI mode** (`?ai=true`) — widgets render from fixtures instantly; LLM text streams in parallel via Anthropic.

---

## 2. Live Feature Inventory

### 2.1 Conversational Surface
- **Chat shell** with streaming responses, persona-driven voice, and a contextual input bar.
- **Two-pass rendering** — widgets appear instantly from fixtures while Claude streams the accompanying narrative into the canvas text block (blinking cursor, paragraph-aware).
- **Text-only mode** — full prose narrative replacing widgets, for users who prefer reading over scanning.
- **Response modes:** text + widgets · text only.
- **Stale-turn marking** — older turns visually de-emphasize as the conversation progresses.

### 2.2 Proactive Briefs (the "morning brief")
- Personalized `ProactiveBriefCard` is the first message on every new chat when the *Proactive Assistance* preference is ON.
- Three sections: greeting · `OVERDUE / FLAGGED` (red/amber dots, inline action chips) · `TODAY` (neutral dots).
- Brief content is **page-aware** — Kai shows a different brief on the Orders page vs the Customers / Products / CRM / Dashboard pages.
- Each brief item carries a one-click action chip that auto-sends the relevant query through Kai's pipeline.

### 2.3 Page-Aware Context (5 WizOrder pages)
A single `PageContext` provider injects page state into Kai's system prompt and starter prompts. Five live pages:
- **Dashboard** — KPI tiles + recent activity feed
- **Orders** — table of orders with status filters
- **Customers** — searchable list with risk badges
- **Products** — product grid with stock indicators
- **CRM** — leads/deals pipeline

Each page exposes top-right **Ask Kai** buttons that pre-seed Kai's input with a context-aware query. The four starter prompts under the input box are also page-driven.

### 2.4 Shared State Bridges
Anything Kai creates flows into WizOrder's own pages and vice versa:
- `SharedOrdersContext` — Kai-created orders appear in the Orders list.
- `SharedCustomersContext` — Kai-created customers appear in the Customers list.
- `SharedCRMContext` — Kai-created tasks/leads appear in CRM (used by UC-2 task confirmation).
- Additional shared contexts: Carts · Quotes · Claims.

### 2.5 Action Chips & Capability Chains
- `ActionChipsBar` renders below every Kai response — up to 4 pill buttons sourced from a chip map keyed by `useCase`.
- Clicking a chip resolves template variables (`{customer}`, `{orderId}`, …) from the previous turn's widgets and auto-sends the query.
- **Chain depth tracking** — after 3 consecutive chip-driven turns, Kai asks for explicit user input.

### 2.6 Insight Highlights on Widgets
Every structured-data widget can render colored accents on individual fields, each with a tooltip and an optional follow-up chip. Four highlight types:
- `urgent` (red) · `warning` (amber) · `positive` (green) · `info` (blue)

Widgets supporting highlights: `CompactList`, `DataTable`, `EntityDetailCard`, `MetricCardRow`, `MetricCard`, `Customer360Card`.
A `generateHighlights` rule engine derives sensible defaults (overdue dates, low stock, balance-vs-credit-limit, VIP cadence drift, negative trends) when a fixture doesn't supply explicit ones.

### 2.7 Widget Library — 19 Registered Widgets
Rendering engine: **Frame JSON → FrameParser → ComponentRegistry → CompositionEngine → Widgets**

| Code | Widget |
|---|---|
| UW-014 | AgentReasoningCard |
| UW-007 | Customer360Card |
| UW-003 | EntityDetailCard |
| UW-002 | MetricCardRow |
| UW-011 | CompactList |
| UW-004 | DataTable |
| CH-001 | LineChart |
| AW-001 | DeepLinkButton |
| AW-004 | MultiStepFormWizard |
| AW-012 | ConsentBanner |
| AW-003 | ConfirmationDialog |
| UW-030 | DashboardCompositeWidget |

(plus sub-components UW-001 MetricCard and AW-005 FormField)

### 2.8 Dashboard Builder
- Kai can compose a multi-widget CSS-grid dashboard inside chat via `UW-030 DashboardCompositeWidget`.
- Saved dashboards open in a full **Dashboard View** with a dedicated Kai sidebar for editing.
- Dashboards live as an artifact under the *Dashboards and Reports* category.
- 8 pre-built dashboard fixtures (Overview, Performance, Pipeline, Customer Health, Order Analytics, Sales Performance, Agents, Usage).

### 2.9 LLM Streaming + 10 Touchpoint Prompts
- Streaming endpoint at `/api/kai/generate` streams Claude Sonnet 4.6 responses as chunked plain text.
- System prompt assembled in fixed order: **persona → custom instructions → page context → capability prompt → widget data**.
- 10 dedicated touchpoint system prompts (T1–T10) with tuned `max_tokens` budgets:

| Key | Touchpoint | Max tokens |
|---|---|---|
| T1 | Canvas text block — insight narrative | 300 |
| T2 | Email body | 400 |
| T3 | Meeting talking points (4 dashes) | 350 |
| T4 | Approval queue summary | 200 |
| T5 | Report / dashboard narrative | 250 |
| T6 | Tone-change follow-up | 400 |
| T7 | Order modification description | 150 |
| T8 | Docs QA augmentation | 250 |
| T9 | Text-only full narrative | 600 |
| T10 | Workflow impact (2 sentences) | 150 |

- **Connection-only 8s timeout** clears on the first chunk so slow completions never get aborted mid-stream.
- **Graceful fallback** — timeouts or network errors silently swap in the fixture closing text. No user-visible failure.

### 2.10 Voice (STT + TTS)
- **Push-to-talk dictation** via Web Speech API.
- **Read Responses Aloud** preference auto-speaks LLM-streamed text via ElevenLabs after each turn.
- **Module-level audio unlock** primes a silent `Audio` element on user gesture so auto-speak survives browser autoplay policy across components.
- Per-turn volume button to manually start/stop TTS on any response. Falls back to `speechSynthesis` if ElevenLabs is unavailable.

### 2.11 Personas
3 selectable personalities with matching ElevenLabs voices:
- **Professional** · **Friendly** · **Concise**
Selection persists across sessions and is injected into every LLM system prompt.

### 2.12 Custom Instructions
A free-text field in User Preferences. Injected into every LLM system prompt under a labeled block that explicitly takes precedence over default style, format, length, chart-type, and tone choices.

### 2.13 Onboarding & GTM
- **3-step Onboarding** on first load — Meet Kai · Choose Style (persona) · First Briefing preview. State persisted via `localStorage`.
- **6-step Guided Tour** from Settings → *Take a Tour*. Spotlight + animated tooltip walks through the sidebar, *Ask Kai* button, chat input, action chips, proactive brief, and ⌘K. Tour can pause on chip clicks and resume on the next conversation.
- **Command Palette (⌘K)** — fuzzy-search across SALES / ADMIN / NAVIGATION / SETTINGS. `query` items auto-send through chat; `route` items navigate.
- **Usage Nudges** — one-time inline tips on first chart, first dashboard, first email, and first action-chip click.
- **Share Snapshot** — copy a snapshot link of any Kai turn (POC stub).

### 2.14 Follow-ups
- Re-staging of forms, widget swaps, and tone-changed responses without losing turn context.
- Sub-turns reuse and refresh the previous turn's widget state (e.g. shorter email, casual rewrite, modified order).

### 2.15 Docs Workspace
- Upload and index documents, then ask Kai questions against them.
- Docs QA touchpoint (T8) reformulates the matched excerpt conversationally.

### 2.16 Agent Store
- Browseable catalog of installable Kai agents (carry-forward from V2).
- Cart · payment · checkout flow.

### 2.17 History & Artifacts
- **History view** of past Kai conversations.
- **My Artifacts** view organized by category, now including *Dashboards and Reports*.

### 2.18 User Preferences (single source of truth)
- Response mode (text+widgets / text-only)
- Read responses aloud (auto-speak)
- Proactive assistance ON/OFF (controls the morning brief)
- Persona selection
- Custom instructions
- All persisted under `kai_user_prefs_v1` and rendered live in `UserPreferencesView`.

---

## 3. Demo Flow Highlights

### UC-1 — Customer Intelligence
> *"How's Acme Corp doing?"*

Renders a `Customer360Card` (with warning highlight on current balance, info highlight on the recent-order row) and a `CompactList` of open tasks with urgent + warning highlights on overdue / due-soon items. Each highlight carries a follow-up chip (Send payment reminder, Check in with Acme, Create follow-up, Review claim).

### UC-2 — Order / Task Creation
Multi-step form wizard → confirmation dialog → shared state propagation (order or task appears in WizOrder's own Orders / CRM views).

### UC-3 — Multi-Intent Revenue + Task
> *"Show me Acme Corp Q2 revenue and create a follow-up task."*

Renders a `MetricCardRow` (warning highlight on a declining metric) alongside a task-creation flow.

### Cross-cutting demo lanes
- **AD1** approval queue (with text-only variant)
- **AD3** handoff (with text-only variant)
- **AD17** report (with text-only variant)
- **AD29** workflow (with text-only variant)
- **SR2** reorder · **SR11** invoice · **SR14** brief · **SR20** outreach (each with text-only variants)
- **Email drafting** — multiple tones (formal, casual, shorter, customer-notify, handoff, report-summary)

---

## 4. Design System (Light Mode)

- Fonts: **Satoshi** (400/600/700/800) · **JetBrains Mono** for data, IDs, timestamps
- Surface: `#FFFFFF` / `#f0f2f5` · Background: `#F7F8F8`
- Borders: `#DBE6F5` / `#BECADC`
- Text: `#2E3643` / `#586476` / `#8895A9`
- Primary: `#16885F` / `#28AA7B`
- AI accent: `rgba(91, 106, 240, X)` for reasoning + highlights
- Soft shadows (0.06–0.08 opacity)

Source of truth: [`widget_system.md`](widget_system.md).

---

## 5. Architecture Snapshot

- **Rendering Engine:** Frame JSON → FrameParser → ComponentRegistry → CompositionEngine → Widgets
- **Text Generation:** two-pass (widgets from fixtures, LLM stream in parallel)
- **Page Context:** 5 WizOrder pages feed Kai's system prompt, starter prompts, briefs, and page-level actions
- **Action Chips:** contextual chips below every response create capability chains (max depth 3)
- **Shared State:** bidirectional bridges between Kai-created entities and WizOrder pages
- **Personas + Custom Instructions:** injected into every LLM system prompt
- **Demo / AI toggle:** `Cmd+Shift+D` flips between fixture-only and LLM-streaming modes

### Contexts in Play
`LayoutContext` · `PageContext` · `ArtifactContext` · `PersonaContext` · `ResponseModeContext` · `ConversationContext` · `DashboardBuilderContext` · `OnboardingContext` · `GuidedTourContext` · `NudgeContext` · `UserPreferencesContext` · `SharedOrdersContext` · `SharedCustomersContext` · `SharedCRMContext` · `SharedStoreProvider`

---

## 6. Build Status

| Block | Title | Status |
|---|---|---|
| 0 | Type foundations | ✅ Done |
| 1 | Widget highlights UI | ✅ Done |
| 2 | `generateHighlights` utility | ✅ Done (not yet wired as render-pipeline fallback) |
| 3 | Fixture highlight data (UC-1, UC-3) | ✅ Done |
| 4 | Proactive Briefs + contextual starters | ✅ Done |
| 5 | Unified Sidebar + 5 WizOrder pages + PageContext + SharedState | ✅ Done |
| 6 | Action Chips Bar + capability chains | ✅ Done |
| 7 | GTM — Onboarding, Guided Tour, Command Palette, Nudges, Share | ✅ Done |
| 8 | LLM streaming text + voice (auto-speak via ElevenLabs) | ✅ Done |

All planned blocks of v2.1 are complete; remaining scope is frontend polish and bug fixes on the deployed POC.

---

## 7. Deployment

- Vercel project: **`kai_demo_v0`**
- Production URL: **https://kaidemov0.vercel.app**
- Required env vars: `ANTHROPIC_API_KEY` · `ELEVENLABS_API_KEY` · `ELEVENLABS_VOICE_ID`
- Deploys via `vercel --prod` from the linked repo.
