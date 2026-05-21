# Kai — WizCommerce's AI Co-Worker
### A Vision for Internal Leadership

---

## What Problem Are We Solving?

Sales reps and CS teams using WizOrder today navigate across multiple screens to answer a single customer question. To prep for a call with a buyer, a rep might open the customer profile, switch to the reports tab for revenue trends, check the task list, and then manually copy information into their notes — all before the conversation starts. A CS rep fielding a "how do I do X?" question has to dig through internal wikis or ask a colleague.

This is the status quo for enterprise B2B software: powerful data and knowledge, buried behind menus and documents.

**Kai replaces navigation with conversation.**

Instead of clicking through four screens, a rep types: *"How's Acme Corp doing?"* — and Kai responds in seconds with a complete intelligence panel: customer health, revenue trends, open tasks, and a direct link to the full profile.

---

## The Core Idea: An AI Co-Worker, Not a Chatbot

Kai is not a search bar with a natural language skin. It is a **co-worker that can both surface information and take action** — and it never acts without your explicit approval.

There are three fundamental pillars to how Kai operates:

### 1. Surface — Answer Questions Instantly

Kai pulls from multiple data sources in a single response and presents findings as structured, visual intelligence panels — not walls of text.

> *"How's Acme Corp doing?"*

Kai resolves the entity, pulls customer data from CRM, revenue data from Reports, and open tasks from the task system — all at once. The rep sees a 360° view in one place, in under a second.

### 2. Act — Execute Workflows on Your Behalf

Kai can parse natural language into structured workflows, pre-fill forms, and stage them for review before touching any data.

> *"Create a high-priority task for Shaw N Solutions, due March 27, assigned to Heman Bhullar, title: Send Catalogue"*

Kai resolves the customer entity, resolves the assignee, pre-fills the full task form, and presents it for confirmation. The user reviews, edits if needed, and hits Confirm. Kai creates the task. Nothing happens without consent.

**This is the fundamental trust contract with Kai: it stages, you confirm.**

### 3. Trace — Show Its Work, Always

Every Kai response is fully transparent. Before delivering results, Kai shows an **execution trace** — every data source queried, every entity resolved, every step taken, and how long each took. For complex queries, Kai visualises its execution plan as a directed graph showing parallel branches.

This is not just a transparency feature — it is the mechanism through which users build trust in Kai's outputs and understand where answers come from.

---

## The Three Core Capabilities (Demonstrated in the POC)

### Use Case 1 — Customer Intelligence
One question. A complete picture.

- Entity resolution: "Acme Corp" → customer record C-4201
- Customer 360° card: profile, contacts, lifetime value, payment standing
- Revenue trend chart: 12 months of monthly revenue
- Open tasks: due dates, priorities, assignees
- Direct link to full CRM profile

**What this replaces:** 4 separate screen navigations and manual information gathering before every customer call.

---

### Use Case 2 — Task Automation with Consent
Natural language → structured workflow → human approval.

- Kai extracts: customer name, task title, assignee, due date, priority, type, status
- Entity resolution: resolves customer and assignee from partial names
- Pre-fills a full task creation form for review
- Consent flow: the user can **Confirm**, **Edit fields**, or **Cancel** — no action until confirmed
- On confirmation: task is created, confirmation shown

**What this replaces:** Navigating to task creation, manually searching for the customer, filling out the form field by field.

---

### Use Case 3 — Multi-Intent Processing
Two requests in one sentence. Kai handles both in parallel.

> *"Show me Acme Corp's revenue this quarter, and create a follow-up task for them due next Friday"*

- Intent A (Surface): Pulls quarterly revenue metrics + weekly chart
- Intent B (Act): Stages a follow-up task for consent
- Both branches execute in parallel — Kai shows its full execution plan so the user can see exactly what it's doing
- Each action gets its own consent flow

**What this replaces:** Two separate workflows that a user would normally do sequentially. Kai does them simultaneously.

---

## How Kai Thinks: The Reasoning Layer

Every Kai response includes a full execution trace:

- Which data sources were queried and the latency of each call
- How entities were resolved (e.g., "Shaw N Solutions" → Lead L-5678)
- For multi-intent queries: a visual plan with parallel execution branches
- Intent classification confidence score (when using the live AI backend)

Tracing is present in every phase of the rollout. It is the foundation of user trust and the primary mechanism for QA and debugging by the WizCommerce team.

---

## The Phased Rollout Plan

Kai is being built and deployed in four phases. The goal is to reach **Phase 2 by August 31, 2026**.

---

### Phase 0 — Internal POC *(Current)*
**Audience:** CS and Implementation teams at WizCommerce
**Capabilities:** Surface (full) + Trace (full) + Act (limited) — no Reusability

The current working prototype. Focused on two jobs:
1. **FAQ and How-To queries** — CS and Implementation teams can ask Kai questions about the WizCommerce platform (WizOrder, WizShop, WizStudio, Ella, pricing, reports, etc.) and get instant, accurate answers — reducing internal back-and-forth and onboarding time.
2. **Saving end-customer time** — A limited set of actions (task creation, data lookups) available to reduce manual steps during customer-facing work.

No live data — all responses are powered by structured fixtures. This phase validates the interaction model, the consent flow, and the value of the reasoning trace before connecting to real systems.

---

### Phase 1 — MCP Integration for Power Users
**Audience:** Power users within WizCommerce
**Capabilities:** Surface (full) + Act (full) + Trace (full) — no Reusability

Kai connects to live WizCommerce systems via MCP (Model Context Protocol) integrations:

| System | Kai Can Now... |
|--------|---------------|
| **WizOrder** | Read and write orders, tasks, customer records |
| **CRM** | Resolve entities, pull full relationship data |
| **Reporting** | Query live revenue, order, and performance metrics |
| **WizShop** | Surface buyer storefront activity and cart data |
| **WizPay** | Read payment status, outstanding balances, payment history |
| **WizStudio** | Query product catalog and AI-generated content |

At this phase, Kai is fully live — every Surface query returns real data, every Act operation creates a real record after consent. Rolled out to a controlled group of power users for feedback, refinement, and edge case discovery before broad deployment.

---

### Phase 2 — Full Customer Deployment *(Target: August 31, 2026)*
**Audience:** All WizCommerce customers
**Capabilities:** Surface + Act + Trace + **Reusability** — full feature set

The complete Kai experience is available to all customers:

- **Reusability** unlocks: saved Artifacts (charts, tables, entity cards), conversation History, and the ability to re-invoke past intelligence in new contexts
- Personas (Professional, Friendly, Executive) and Voice I/O (speech input + spoken output) are live
- The Agent Store opens — customers can discover and activate additional agents
- Full usage analytics dashboard available to admins and team leads
- Pricing model goes live: usage-based, derived from actual token consumption per team, with WizCommerce's inference cost as the floor

---

### Phase 3 — Kai as a Standalone Product
**Audience:** WizCommerce customers + external market
**Capabilities:** All of Phase 2 + Expanded Agent Catalog + Omnichannel + Workflow Manager

Kai evolves from an embedded WizCommerce feature into a standalone AI product:

- **Expanded Agent Catalog** — Purpose-built agents for Sales, Operations, and Management beyond the core Kai + Ella pair (Quote Optimizer, Churn Predictor, Inventory Watchdog, and more)
- **Omnichannel presence** — Kai operates across Email, WhatsApp, and iMessage — not just the web UI. Reps can query and act from wherever they are
- **Workflow Manager** — Multi-step, stateful workflows that span days or weeks. Kai can monitor conditions and trigger actions automatically, with human approval gates at the right moments
- **Integration-first architecture** — Kai can be connected to external systems beyond WizCommerce's own stack (ERPs, CRMs, logistics platforms)

---

## The Agent Store: Extending Kai's Capabilities

Kai is the foundation. The Agent Store is how teams extend it with purpose-built AI co-workers for specific workflows.

### Agents Included with WizCommerce

| Agent | Role | Key Capabilities |
|-------|------|-----------------|
| **Kai** | AI Sales & CS Copilot | Customer intelligence, task automation, revenue analytics, knowledge base Q&A, multi-intent processing |
| **Ella** | AI Order Entry Assistant | Multi-format PO reading, intelligent data extraction, validation engine, ERP-ready output |

### Additional Agents (Phase 3 Catalog)

| Agent | Category | Key Capability |
|-------|----------|---------------|
| **Quote Optimizer** | Sales | AI-optimized quote generation with margin analysis |
| **Customer Churn Predictor** | Sales | Early warning signals on at-risk accounts |
| **Trade Show Prep Assistant** | Sales | Pre-show buyer briefings and talking points |
| **Inventory Watchdog** | Operations | Stock alerts, reorder triggers, availability monitoring |
| **Returns & Claims Processor** | Operations | Automated returns routing and claims handling |
| **Delivery Tracker** | Operations | Shipment status with proactive exception alerts |
| **Catalog Curator** | Sales | AI-assisted product catalog management |
| **Rep Performance Coach** | Management | Performance analytics and coaching recommendations |

**Pricing model for agents:** Usage-based. Pricing for each agent will be derived from the token consumption it generates and the inference cost WizCommerce incurs — ensuring the model is sustainable and directly tied to value delivered.

### Data Permission Model

Every agent declares exactly what data it needs (required vs. optional). Admins explicitly approve what each agent can access. Nothing is assumed. This applies at the agent level, not the platform level — granting Kai access to CRM data does not grant Ella the same.

---

## Kai's Persona System

Kai ships with three communication styles to meet different users where they are:

| Persona | Style | Best For |
|---------|-------|----------|
| **Professional** | Concise, data-first, bullet points | Experienced reps, data-heavy workflows |
| **Friendly** | Warm, conversational, proactive suggestions | Onboarding, relationship-first teams |
| **Executive** | Strategic, implications-focused, recommendations-led | Leadership, high-stakes customer calls |

Each persona pairs with a voice tone for spoken output: Clear (data readouts), Warm (conversational), Direct (task confirmations).

---

## Voice: Kai in the Flow of Work

- **Voice Input (STT):** Speak a query — Kai transcribes and responds identically to typed input. Designed for reps between calls or on the move.
- **Voice Output (TTS):** Kai reads its analysis aloud — useful during commutes or when screens aren't practical.

Voice is disabled while Kai is processing to prevent confusion. Both inputs can be toggled independently in user preferences.

---

## The Analytics Dashboard

For team leads and admins, Kai includes a full usage dashboard across four tabs:

### Overview
- Total queries, active users, success rate, average latency (with week-over-week deltas)
- Daily query volume chart
- Action outcome breakdown: Confirmed vs. Edited vs. Cancelled

### Performance
- Latency by pipeline stage: ingestion → planning → execution → rendering (p50 / p90 / p99)
- Time-to-first-frame trend
- Intent classification accuracy by use case
- Entity resolution success rate and fallback rate

### Usage
- Token consumption by use case
- Estimated AI inference cost (the basis for usage-based pricing)
- Top query patterns — what users actually ask
- Peak usage hours heatmap

### Agents
- Per-agent activity: queries handled, actions executed, uptime
- Top capabilities leaderboard across all active agents

**Baseline from the POC (simulated 30-day data):**
- Intent classification accuracy: 94.2%
- Entity resolution success: 91.8%
- Average response latency (p50): 450ms
- Time-to-first-frame: 245ms–420ms

---

## Integration Architecture: What Kai Connects To

Kai is a layer on top of existing systems — it does not replace them.

| System | Role |
|--------|------|
| **WizOrder** | Orders, tasks, customer records |
| **CRM** | Customer profiles, contacts, relationships |
| **Reporting** | Revenue, order, and performance metrics |
| **WizShop** | Buyer storefront activity, cart data |
| **WizPay** | Payment status, balances, transaction history |
| **WizStudio** | Product catalog, AI-generated content |
| **Email / WhatsApp / iMessage** | Omnichannel access (Phase 3) |
| **ERP / WMS** | Order processing, inventory (via Ella and specialist agents) |

Phase 1 connects WizCommerce's own stack via MCP. Phase 3 opens the integration layer to external systems.

---

## The Business Case

Every minute a CS rep spends searching documentation is a minute not spent resolving a customer issue. Every minute a sales rep spends navigating screens is a minute not spent selling. Kai is a direct investment in team productivity — reducing the cognitive load of information gathering, eliminating manual data entry, and surfacing the right intelligence at exactly the right moment.

The phased rollout is deliberate: we validate the interaction model internally before exposing it to customers, and we build trust through full transparency (the Trace) at every stage. The Agent Store and usage-based pricing model create a sustainable, scalable expansion path — each additional agent delivers measurable value and is priced in direct proportion to its usage.

**Kai is not a feature. It is the new interface for WizCommerce.**

---

*Built by the WizCommerce product team. Target: Phase 2 deployment by August 31, 2026.*
