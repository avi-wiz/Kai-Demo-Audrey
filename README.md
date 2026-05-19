# Kai 2.0 — POC

A working prototype of **Kai 2.0**, WizCommerce's AI assistant for the WizOrder platform. Built for a CEO and Head of Engineering demo. Every widget renders live from streaming JSON frames — no slides, no screenshots.

---

## What Is Kai?

Kai is a conversational AI layer on top of WizOrder. It does three things most AI assistants can't:

1. **Surface** — understands a plain-English question and composes a multi-widget intelligence panel from live CRM/Reports data in a single response.
2. **Act** — parses natural language into a structured workflow (e.g. task creation), pre-fills a form, and waits for explicit user consent before touching any data.
3. **Extend** — an Agent Store lets teams discover, purchase, and configure specialized AI agents (e.g. Ella for order ops) that plug into Kai's capability layer.

The POC demonstrates all three pillars across 3 chat use cases, a full Agent Store, and an Analytics Dashboard.

---

## The 3 Demo Use Cases

| # | Query | What It Shows |
|---|-------|---------------|
| **UC-1** | *"How's Acme Corp doing?"* | One sentence replaces 4 screen navigations. Kai resolves the entity, pulls CRM + revenue + tasks, and renders a 5-widget panel progressively. |
| **UC-2** | *"Create a high-priority task titled Send Catalogue for Shaw N Solutions, due March 27, assigned to Heman Bhullar"* | Kai parses free text into a pre-filled form, stages it for review, and waits for Confirm / Edit / Cancel before creating anything. |
| **UC-3** | *"Show me Acme Corp's revenue this quarter, and also create a follow-up task for them due next Friday"* | Two intents, one sentence. Kai splits them into parallel branches (Surface + Act), streams results progressively, and handles consent per-branch. |

Each use case is independently demoable — if one breaks, the other two still land.

---

## Architecture

### Chat Engine

```
User query
  → Query matcher (keyword in demo mode, Anthropic API in AI mode)
    → Fixture JSON (mock frames with widget arrays)
      → FrameParser     — extracts widgets from frame JSON
        → ComponentRegistry — maps widgetType string → React component
          → CompositionEngine — renders widgets vertically with staggered animation
```

### Agent Store

```
AgentStoreContext (React state + sessionStorage cart)
  → AgentStoreLayout (sub-nav router)
    → AgentLibraryView (PLP: filter + paginate)
    → AgentDetailView  (PDP: capabilities, permissions, connectors)
    → MyAgentsView     (purchased + included agents)
    → MyAgentConfigView (editable permissions, connectors, deactivate)
    → PaymentView      (validated card form + order summary)
    → CheckoutConfirmationView (confetti + activated list)
```

### Analytics Dashboard

```
DashboardLayout (tab router + date range filter + skeleton loading)
  → DashboardOverviewTab   (KPI grid, AreaChart, DonutChart)
  → DashboardPerformanceTab (latency BarChart, TTFF LineChart, accuracy breakdown)
  → DashboardUsageTab      (token cards, stacked AreaChart, pattern list, peak hours)
  → DashboardAgentsTab     (agent status cards, query/action BarCharts, capabilities table)
```

### Key Concepts

**Frames** — the atomic unit of a Kai response. Each frame is a JSON object with a `frameType` and a `widgets` array. UC-1 and UC-2 are single-frame. UC-3 is a 3-frame bundle that streams progressively.

**Widgets** — every widget is a React component that accepts exactly `{ data, config }`. The FrameParser passes these straight from the JSON — no transformation layer.

**ComponentRegistry** — a single `Map<string, React.ComponentType>` that maps widget IDs like `"UW-014"` to their components. Adding a new widget is one line.

**ConsentFlow** — a state machine (`staged → confirmed | editing | cancelled`) that gates all Act-pillar widgets. The user must explicitly confirm before any write operation executes.

**AI mode** — toggled via `?ai=true` URL param or the header switch. In AI mode, queries are sent to `/api/kai` which calls Claude (`claude-sonnet-4-6`) for intent classification. The result injects a live confidence score and latency into the AgentReasoningCard. In demo mode, a fast keyword matcher routes queries to fixtures locally.

**Agent Store** — self-contained module with its own context (`AgentStoreContext`). Cart state persists in `sessionStorage` across navigation. `deactivateAgent()` restores agent status to `'available'` in real time — no page refresh needed.

**Dashboard** — 4-tab analytics view driven by fixture data keyed by date range (`7days`/`30days`/`90days`). Tab and range switches show a 220ms skeleton shimmer before rendering charts.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Charts | Recharts |
| AI | Anthropic Messages API (`claude-sonnet-4-6`) |
| Data | Mock JSON fixtures — no database |

---

## Widgets Built (13 total)

| ID | Component | Used In |
|----|-----------|---------|
| UW-014 | AgentReasoningCard | UC-1, UC-2, UC-3 |
| UW-007 | Customer360Card | UC-1 |
| UW-003 | EntityDetailCard | UC-2, UC-3 |
| UW-004 | DataTable | UC-1 follow-up |
| UW-002 | MetricCardRow | UC-3 |
| UW-001 | MetricCard *(sub-component)* | UC-3 |
| UW-011 | CompactList | UC-1 |
| CH-001 | LineChart | UC-1, UC-3 |
| AW-001 | DeepLinkButton | UC-1 |
| AW-004 | MultiStepFormWizard | UC-2, UC-3 |
| AW-005 | FormField *(sub-component)* | UC-2, UC-3 |
| AW-012 | ConsentBanner | UC-2, UC-3 |
| AW-003 | ConfirmationDialog | UC-2 |

---

## Folder Structure

```
src/
├── app/
│   ├── page.tsx                    # Chat page
│   ├── layout.tsx                  # Root layout with sidebar
│   └── api/kai/route.ts            # Anthropic intent classification endpoint
├── components/
│   ├── chat/
│   │   ├── ChatShell.tsx           # Input bar + message list + turn routing
│   │   ├── MessageBubble.tsx       # User message bubble
│   │   ├── KaiResponse.tsx         # Wraps CompositionEngine for a single turn
│   │   ├── ThinkingIndicator.tsx   # Animated dots with rotating personality lines
│   │   ├── SuggestedQueries.tsx    # Clickable demo query chips
│   │   └── AiModeToggle.tsx        # Header toggle + Cmd+Shift+D shortcut
│   ├── widgets/
│   │   ├── ui/                     # UW-xxx components
│   │   ├── charts/                 # CH-xxx components
│   │   └── actions/                # AW-xxx components
│   ├── engine/
│   │   ├── FrameParser.tsx         # JSON frame → renderable widget array
│   │   ├── ComponentRegistry.ts    # widgetType string → React component
│   │   └── CompositionEngine.tsx   # Staggered render + ConsentHandlersContext
│   ├── agent-store/
│   │   ├── AgentStoreLayout.tsx    # Sub-nav router + cart sidebar
│   │   ├── AgentLibraryView.tsx    # PLP: filter pills + 3-col grid + pagination
│   │   ├── AgentDetailView.tsx     # PDP: capabilities, permissions, connectors
│   │   ├── MyAgentsView.tsx        # Purchased + included agents list
│   │   ├── MyAgentConfigView.tsx   # Editable permissions, connectors, deactivate
│   │   ├── PaymentView.tsx         # Validated card form + order summary
│   │   └── CheckoutConfirmationView.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx     # Tab nav + date range filter + skeleton loading
│   │   ├── DashboardOverviewTab.tsx
│   │   ├── DashboardPerformanceTab.tsx
│   │   ├── DashboardUsageTab.tsx
│   │   └── DashboardAgentsTab.tsx
│   ├── layout/                     # Sidebar, TopNav, MainContent
│   └── views/                      # History, Artifacts, Docs, Settings, Preferences, AddYourModels
├── contexts/
│   ├── AgentStoreContext.tsx        # Agent catalog, cart, purchased state
│   ├── LayoutContext.tsx
│   ├── ArtifactContext.tsx
│   ├── PersonaContext.tsx
│   ├── ResponseModeContext.tsx
│   └── ConversationContext.tsx
├── fixtures/
│   ├── uc1-customer-intel.json
│   ├── uc2-task-creation.json
│   ├── uc2-task-confirmed.json
│   ├── uc3-multi-intent.json
│   ├── agent-store-catalog.json    # 10 agents (Kai + Ella included, 8 available)
│   ├── dashboard-overview.json     # 7days/30days/90days keyed
│   ├── dashboard-performance.json
│   ├── dashboard-usage.json
│   └── dashboard-agents.json
├── hooks/
│   ├── useStreamSimulator.ts       # Emits frames with per-use-case timing
│   ├── useConsentFlow.ts           # staged → confirmed/editing/cancelled
│   ├── useDocsQA.ts                # Keyword scorer for Docs Q&A
│   └── useFollowUp.ts              # Follow-up intent detection
└── lib/
    ├── types.ts                    # All TypeScript interfaces
    ├── constants.ts                # Demo queries, timing constants
    └── queryMatcher.ts             # Keyword → use case routing
```

---

## Running Locally

```bash
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local (only needed for AI mode)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo mode** (default) — uses local keyword matching and mock fixtures. No API key needed.

**AI mode** — click the "AI mode" toggle in the header, or press `Cmd+Shift+D`. Requires `ANTHROPIC_API_KEY` in `.env.local`. The classification step in AgentReasoningCard will show real confidence scores and latency from the API call.

### Try These Queries

- `How's Acme Corp doing?` → UC-1
- `Create a high-priority task titled Send Catalogue for Shaw N Solutions, due March 27, assigned to Heman Bhullar` → UC-2
- `Show me Acme Corp's revenue this quarter, and also create a follow-up task for them due next Friday` → UC-3
- `Show me NetSuite inventory` → graceful unknown-query fallback

---

## Scope of This POC

**In scope:**
- Widget rendering engine with ComponentRegistry pattern
- Progressive frame streaming (simulated)
- Consent flow for Act-pillar widgets
- Multi-intent parallel branch rendering (UC-3)
- Anthropic intent classification with confidence scoring
- AI / Demo mode toggle
- Agent Store (discover, purchase, configure agents)
- Analytics Dashboard (4 tabs, date range filtering, skeleton loading)
- Voice input (Web Speech API) + Voice output (ElevenLabs TTS)
- Docs Q&A (10 keyword-matched pairs)
- Artifact save/view flow
- Persona system (Professional / Friendly / Executive)
- Follow-up interactions (widget swap, form re-staging)

**Out of scope (Phase 2+):**
- Real MCP connections to CRM, Reports, or WizPay
- Persistent chat history or user sessions
- WizShop / WizPay integrations
- Proactive / push alerts
- Mobile layout
- Real payment processing
