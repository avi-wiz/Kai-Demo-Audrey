# Kai 2.0 — 5-Minute Executive Demo Script (v1)

**Audience:** WizCommerce leadership + CXOs (taking this to investors)
**Goal:** Show — in 5 minutes — that Kai isn't a chatbot; it's a re-architecture of the B2B distributor sales stack. Hit BREADTH, not just one party trick.
**Demo URL:** https://kaidemov0.vercel.app
**Runtime:** 5:00 sharp. 30 sec Q&A buffer.

---

## Why this script exists

The earlier demo script hit ~5 features. Kai actually ships **48 distinct demo-able capabilities** across 9 pillars:

1. **Proactive Intelligence** (page-aware briefs)
2. **Surface** (UC-1 Customer 360, highlights, reasoning trace)
3. **Act** (UC-2 staged forms, consent, shared-state handoff)
4. **Multi-Intent** (UC-3 parallel DAG)
5. **Specialized Capabilities** (8 SR/AD touchpoints — reorder, invoice, brief, outreach, approvals, handoff, reports, workflows)
6. **Dashboards-as-Conversation** (4 dashboards + live editing + PDF/CSV export)
7. **Platform** (Agent Store, Docs Q&A, Artifacts library, History)
8. **Personalization** (3 personas × 8 prefs × custom instructions × voice)
9. **Delight** (onboarding, guided tour, ⌘K palette, nudges, voice I/O, shared `✦ Kai` badge handoff)

We can't show all 48 in 5 minutes. But we **can** show ~20 by **chaining clicks instead of typing**, and by letting **breadth itself be the wow**.

This script is built around one rule: **the audience should think "what else can it do?" not "okay, what's next."**

---

## Pre-Flight (T-5 min)

- [ ] Chrome, full-screen, zoom 110%, devtools closed
- [ ] Hard-refresh `https://kaidemov0.vercel.app` (`Cmd+Shift+R`)
- [ ] Confirm **AI mode = ON** (top-right toggle, green halo). `Cmd+Shift+D` toggles.
- [ ] Settings → Persona = **Professional**, Voice ID = default
- [ ] Preferences:
  - "Proactive assistance" = **ON**
  - "Auto-expand Agent Reasoning" = **OFF** (we'll expand on demand)
  - "Read responses aloud" = **OFF** (avoid audio surprises until we want it)
  - "Show confidence scores" = **ON**
- [ ] Custom Instructions field has this text saved (for the persona moment):
  > *"Lead with the headline number. Keep insights under 2 sentences. Use bar charts, not pie."*
- [ ] **Pre-position 3 browser tabs:**
  - Tab 1: Kai chat (cleared, brief showing)
  - Tab 2: WizOrder → CRM page (to show the `✦ Kai` handoff)
  - Tab 3: WizOrder → Customers page (backup for Act 2)
- [ ] If voice will be used: mic permission already granted; test once
- [ ] Phone on silent. Slack notifications off. Sip of water.

---

## The Spine (memorize)

> "B2B sales reps work across 6–8 disconnected screens — CRM, orders, products, claims, BI, email — to answer one question about one customer. Kai collapses that into a sentence. But it's more than collapsing screens. It's three pillars: **Surface** what matters, **Act** with consent, **Trace** every decision. And it's a **platform** — extensible by an agent marketplace, customizable per rep, wired into every page of WizOrder. Five minutes. Watch."

---

## THE 5-MINUTE ARC

| Time | Act | Beat | Pillars Demoed |
|---|---|---|---|
| 0:00–0:35 | **Open** | Proactive brief on a WizOrder page | Proactive Intelligence, Page Context |
| 0:35–1:45 | **Surface** | "How's Acme Corp doing?" → UC-1 with highlights → widget-swap → table | Surface, Trace, Highlights, Follow-ups |
| 1:45–2:50 | **Act** | Chip-chain → UC-2 task → form restage → confirm → WizOrder handoff | Act, Action Chips, Form Restage, Shared State |
| 2:50–3:50 | **Extend** | Dashboard-as-conversation → save → Custom Instructions proof | Dashboards, Personalization, Artifacts |
| 3:50–4:30 | **Platform** | Agent Store → ⌘K palette → Voice (optional) | Marketplace, Command Palette, Voice |
| 4:30–5:00 | **Close** | Investor pitch + the one-liner | Vision |

---

## ACT 1 — OPEN: Page-Aware Proactive Intelligence (0:00 – 0:35)

**Start on:** WizOrder → CRM page (Tab 2). Kai sidebar already open.

### What's on screen
- WizOrder CRM page (tasks, leads, deals) visible in background — proving Kai is *embedded*, not bolted on.
- Kai sidebar shows the **CRM-specific Proactive Brief**:
  - 🚨 URGENT: 5 overdue tasks (2 high-priority), 3 leads not contacted 7+ days
  - ℹ️ TODAY: 12 open tasks, 4 deals worth $68.5K in this week's pipeline
  - Action chips below each item

### Narration (~25 sec)
> "Notice where I am — this is the *actual* WizOrder CRM page. And Kai isn't on a separate site. It's an intelligence layer that **knows what page I'm on**. It opened with a brief tailored to my CRM context: five overdue tasks, three stale leads, $68K in this week's pipeline."
>
> *(hover — don't click — a chip)*
>
> "Every line has a one-click action. Not 'open a screen' — an action."

### Why this matters (the unsaid part)
- Proves **page context**: 5 WizOrder pages × custom briefs = 5 personalized starting points
- Proves Kai is **in** WizOrder, not next to it
- Audience now expects intelligence everywhere, which makes Act 2 feel inevitable

---

## ACT 2 — SURFACE: 360° in One Sentence + Follow-up Swap (0:35 – 1:45)

**Switch to:** Tab 1 (Kai chat, default brief).

### Step 1 — Type the headline query (5 sec)
```
How's Acme Corp doing?
```
Press Enter.

### What renders (narrate as it streams)
1. **AgentReasoningCard (UW-014)** — collapsed: *"Resolved Acme → C-4201. 4 MCPs in parallel. 630ms."*
2. **Customer360Card (UW-007)** — profile, $482K LTR, **red border on credit balance**
3. **LineChart (CH-001)** — 12-month revenue trend, area fill, clearly trending up
4. **CompactList (UW-011)** — 4 open tasks, **T-1001 red (overdue)**, **T-1004 amber (due tomorrow)**
5. **Insight text streams in** (T1 touchpoint, real LLM) — *"Acme is trending up — revenue +12% QoQ..."*
6. **Action chips** appear below: *Create follow-up · Draft email · Show order history · Prep for meeting*

### Narration (~45 sec)
> "One sentence. Watch this."
>
> *(reasoning card)* "Kai shows its work — entity resolution, 4 data sources in parallel, 630ms. **Auditable AI** — that's the Trace pillar."
>
> *(click the reasoning card to expand briefly, then collapse)*
>
> *(point to the highlights as the rest renders)* "Now look at the *colors*. Red on the credit balance — 24% of limit. Red on task T-1001 — overdue. Amber on T-1004 — due tomorrow. **Kai isn't showing data; it's flagging what matters.**"
>
> *(hover the red highlight on credit balance → tooltip with 'Send payment reminder' pill appears)*
>
> "And every red flag has a one-click resolution baked into the tooltip."

### Step 2 — The follow-up swap (15 sec)
Type:
```
Show that as a table
```

**What happens:** Previous turn dims to 40% opacity ("stale"), new turn renders **DataTable (UW-004)** with the same data restructured.

> "Same data, different lens. The previous response went stale automatically — no re-query, no roundtrip. **The widget layer is fluid.** Same intelligence, ask for it any way you want."

### Why this matters
- One query = 5 widgets + 1 streamed insight + 4 chips
- The hover-action-chip-inside-a-tooltip is a *delight moment* — that's "wow" territory
- Widget-swap proves the rendering layer is composable

---

## ACT 3 — ACT: Chip-Chain into Action + Restage + WizOrder Handoff (1:45 – 2:50)

This act has the highest density. Four micro-beats; no typing.

### Step 1 — Click a chip (the chain begins) (5 sec)
Scroll back up to the original UC-1 chips. Click **"Create follow-up task for Acme Corp"**.

**What renders:**
- AgentReasoningCard: *"Intent: Task Creation. Resolved customer, resolved assignee 'Heman Bhullar', validated config."*
- **EntityDetailCard (UW-003)** — staged task preview
- **MultiStepFormWizard (AW-004)** — every field pre-filled
- **ConsentBanner (AW-012)** — Confirm & Create / Edit / Cancel

> "I didn't type a word. I clicked a chip. Kai inferred the customer, inferred *me* as assignee, pre-filled every field, and **staged it for review**. Notice — nothing has been written to the CRM yet. That's the consent contract."

### Step 2 — Restage the form mid-flight (~15 sec)
Type:
```
Change the due date to next Friday
```

**What renders:**
- AgentReasoningCard: *"Applied 1 change: due date → May 22"*
- New form turn with the patched value highlighted
- T7 streams: *"Updated the due date to May 22. All other fields preserved."*

> "Mid-flight edit. Kai patched the form, called out exactly what changed, and re-staged for consent. **The conversation IS the form.**"

### Step 3 — Confirm (~5 sec)
Click **Confirm & Create**.
- Spinner → "Task Created ✓"
- Form dims

### Step 4 — Switch to WizOrder CRM, show the handoff (~25 sec)
Switch to Tab 2 (WizOrder CRM). Tasks tab.

**On screen:** The new task is at the top of the list with a **✦ Kai** badge pulsing.

> "And here's where it becomes real. Switch to WizOrder — the actual CRM page. The task is right here, tagged with Kai's signature, pulsing for context. **No sync. No second system.** Kai *is* WizOrder, with an intelligence layer fused on top."
>
> *(land it)* "Notice what just happened in 60 seconds. One chip-click became a stateful workflow with a consented action that's now live in production data."

### Why this matters
- Proves **action chips chain capabilities** without typing
- Proves **form restaging** — the form is *conversational*, not static
- Proves **shared state** — Kai-created data lives in WizOrder's actual surfaces
- Proves **safety** — consent before write, every time

---

## ACT 4 — EXTEND: Dashboards-as-Conversation + Personalization (2:50 – 3:50)

Back to Tab 1 (Kai chat).

### Step 1 — Dashboard from a sentence (~25 sec)
Type:
```
Build me a sales performance dashboard
```

**What renders:** **DashboardCompositeWidget (UW-030)** — a 2×3 grid:
- Row 1: Revenue MTD, Active Orders, Open Quotes (3 metric cards)
- Row 2: Monthly revenue trend chart + summary table
- Wrapped in Save / Edit / Cancel consent banner

> "BI without BI tools. A dashboard generated from one sentence — not a static template, a composition of widgets, live data, and an insight on top."

### Step 2 — Prove personalization (~20 sec)
Point at the chart.

> "And look at the chart. It's a **bar chart**, not a line chart. Why? Because in my Preferences I have a Custom Instruction: *'Use bar charts, not pie.'* Kai injected that into the LLM call. **Every Kai response, on every page, for every rep, can be tuned to their style.** Three personas — Professional, Friendly, Executive. Eight preference toggles. Free-text custom instructions. **Kai adapts to the human, not the other way around.**"

### Step 3 — Save → live editing affordance (~15 sec)
Click **Save** in the consent banner → SaveArtifactModal → title "Q2 Sales" → Save.

> "Saved to My Artifacts under 'Dashboards and Reports'. From here I can re-open it in a full-screen builder, edit it with natural language — *'change date range to 90 days,' 'add a metric,' 'export as PDF'* — and even share it. **Dashboards aren't built; they're talked into existence.**"

*(Don't navigate into the full view — too time-expensive. The audience trusts you.)*

---

## ACT 5 — PLATFORM: The Moat (3:50 – 4:30)

### Step 1 — Agent Store (~25 sec)
Left sidebar → **Agent Store**. Catalog of 10+ agents appears (PLP grid).

Click **"Ella — AI Order Entry Assistant"**.

**On screen:** Agent detail page — capabilities (PDF order parsing, validation, ERP push), required permissions, connector list (Orders, Inventory, Pricing), pricing ($99/mo or usage-based), **Add to Cart** button.

> "Kai is *extensible*. This is our internal app store for specialized agents. Ella reads inbound POs from PDFs and emails, validates them, pushes orders into WizOrder — fully automated order entry. One click subscribes a team. Usage-based pricing aligns ROI."
>
> *(land it)* "This is the **wedge into a platform business**. WizOrder is the OS. Kai is the interface. Agents are the apps. Every customer we have today is a beachhead; every agent we ship — or any partner ships — deepens the moat."

### Step 2 — ⌘K Command Palette (optional, ~10 sec)
Press `Cmd+K` (or `Ctrl+K` on Windows). Palette opens with 20 items across SALES / ADMIN / NAVIGATION / SETTINGS.

> "And every Kai capability is one keystroke away. ⌘K — the rep's command center. Customer lookup, build dashboard, approvals queue, go to any page in WizOrder. **Pure keyboard, zero mouse.**"

Press Esc.

### Step 3 — Voice (optional, only if everything is on track, ~10 sec)
Click the mic. Speak:
```
What's my pipeline worth this week?
```

> "And it works hands-free. Sales call, warehouse floor, in the car — Kai is voice-native, with persona-specific voices."

*(If voice misbehaves, skip silently — the close doesn't depend on it.)*

---

## CLOSE — The Investor Line (4:30 – 5:00)

Step back from the screen. Look up. Slower cadence.

> "What you just saw in five minutes:
>
> — A **page-aware proactive brief** before I typed a single character.
> — **One sentence** that replaced six clicks, four data sources, and a note-taking session.
> — A **chip-click** that became a stateful, restaged, consented workflow — live in WizOrder a second later.
> — A **dashboard** generated from a sentence, styled by my preferences, saved as a re-editable artifact.
> — An **agent marketplace** that turns this from a feature into a platform.
>
> The B2B Wholesale & Distributor market spends billions on disconnected SaaS — CRM, ERP, BI, comms, order entry. **Kai is the layer that unifies them.** Built on top of WizOrder, every customer we already serve becomes a beachhead. Every agent we ship in the store deepens the moat. Every rep becomes 3× more productive on day one.
>
> This is how WizCommerce becomes the **system of record AND the system of intelligence** for the B2B distribution industry."
>
> *(beat — let it land)*
>
> "Questions?"

---

## The One-Liner (memorize this — deliver it once during close)

> "Kai turns six screens into one sentence — with the safety of human-in-the-loop consent, the auditability of a visible reasoning trace, the personality of a configurable persona, and the extensibility of an internal agent store — all built natively on top of WizOrder."

---

## Sequence Cheat Card (print, glance during demo)

```
0:00  Tab 2 (WizOrder CRM)         → Narrate page-aware proactive brief
0:35  Tab 1 (Kai chat)             → Type: "How's Acme Corp doing?"
1:20  Type: "Show that as a table" → Widget-swap (stale-overlay moment)
1:45  Click chip "Create follow-up task for Acme"
2:05  Type: "Change due date to next Friday"  → Restage moment
2:20  Click Confirm & Create
2:25  Tab 2 (WizOrder CRM)         → Show ✦ Kai task at top
2:50  Tab 1                        → Type: "Build me a sales performance dashboard"
3:15  Point at bar chart           → "Why bar? Custom Instructions."
3:35  Click Save                   → Title "Q2 Sales" → Save
3:50  Sidebar → Agent Store        → Click Ella
4:15  Cmd+K (optional)             → Show palette, Esc
4:25  Mic (optional)               → "What's my pipeline?"
4:30  Step back. The close.
5:00  Q&A
```

---

## Capabilities demoed (count: ~20)

| # | Capability | Pillar | Where in demo |
|---|---|---|---|
| 1 | Page-aware Proactive Brief (CRM) | Proactive | Act 1 |
| 2 | WizOrder embedded layout | Platform | Act 1 |
| 3 | UC-1 Customer 360 | Surface | Act 2 |
| 4 | AgentReasoningCard expand/collapse | Trace | Act 2 |
| 5 | Multi-widget staggered entrance | Delight | Act 2 |
| 6 | Highlights system (red/amber) | Surface | Act 2 |
| 7 | Tooltip with action chip (on hover) | Delight | Act 2 |
| 8 | T1 LLM streaming insight | AI | Act 2 |
| 9 | Widget-swap follow-up + stale overlay | Surface | Act 2 |
| 10 | Action chip chaining (no typing) | Act | Act 3 |
| 11 | UC-2 staged task form | Act | Act 3 |
| 12 | Form restage with diff narrative (T7) | Act | Act 3 |
| 13 | Consent banner (Confirm/Edit/Cancel) | Act | Act 3 |
| 14 | Shared-state handoff to WizOrder CRM | Platform | Act 3 |
| 15 | `✦ Kai` pulsing badge | Delight | Act 3 |
| 16 | Dashboard-as-conversation (UW-030) | Extend | Act 4 |
| 17 | Custom Instructions affecting output | Personalization | Act 4 |
| 18 | Save to Artifacts (Dashboards & Reports) | Extend | Act 4 |
| 19 | Agent Store (PLP + PDP + pricing) | Platform | Act 5 |
| 20 | ⌘K Command Palette | Delight | Act 5 |
| (21) | Voice STT + TTS | Reach | Act 5 (optional) |

---

## Capabilities INTENTIONALLY skipped (and why)

We hold these in reserve for Q&A. If a CXO asks "what else?", you have ammunition:

| Capability | Why skipped | Q&A unlock |
|---|---|---|
| UC-3 multi-intent DAG | Visually similar to UC-1+UC-2 back-to-back — adds time without adding novelty | *"Yes — we also do parallel multi-intent. One sentence → two parallel workstreams with separate consent."* |
| SR-2 Reorder + side-by-side compare | Niche to repeat-order flow | *"For repeat orders, Kai stages a reorder you can edit inline, with diff-view against the original."* |
| SR-11 Invoice + context-aware chips | Specialized; AD-17 already shows specialized capability | *"Invoice chase, payment reminder, all keyword-routed with context-aware follow-ups."* |
| SR-14 Meeting brief | Niche, but a great answer for a sales-focused CXO | *"Want to see meeting prep? One sentence — 4 talking points + 3 follow-up tasks staged."* |
| SR-20 Outreach campaigns | Email shown via tone-rewrite is enough | *"Campaigns, drip sequences, tone variants — all live."* |
| AD-1 Approval queue | Admin niche | *"AP/AR approval workflows, bulk approve, exception detail — all built."* |
| AD-3 Rep handoff with merge-tag emails | Admin niche | *"Rep reassignment with auto-generated customer notifications and merge tags."* |
| AD-17 Sales report + PNG export | Dashboard already shows export | *"Reports can be downloaded as PDF or attached to email in two clicks."* |
| AD-29 Workflow setup (7-workflow catalog) | Time-expensive to demo well | *"Automation workflows — 7 pre-built, fully configurable, save to artifacts."* |
| Docs Q&A with confidence scores | Adds 30 sec; not the day-one wow | *"Your internal docs become Kai's brain. Q&A with source attribution and confidence."* |
| Guided Tour (6 steps) | Meta — would feel like a tutorial in a tutorial | *"New reps get an interactive tour the first time they open Kai."* |
| Onboarding flow (3 steps) | Demoed implicitly through the brief | *"First-time experience walks new users through persona selection in 60 seconds."* |
| History view with use-case tags | Low novelty for CXOs | *"Every interaction is logged and searchable by type — UC-1 customer queries, emails, tasks, etc."* |
| 14 other page-context queries | One CRM brief is enough proof | *"5 WizOrder pages × 3 starter queries × 1 proactive brief each — 20 page-aware experiences out of the box."* |
| 3 other dashboards (customer health, order analytics, pipeline) | One dashboard is enough | *"Four pre-built dashboard types; fully composable."* |
| 5 email variants (handoff, outreach, customer-notify, etc.) | Optional Q&A response | *"Email drafting across follow-up, handoff, outreach, and customer notification — with tone rewrites."* |
| 7 workflow catalog (VIP upgrade, etc.) | Tucked under AD-29 | *"Pre-built workflows: VIP upgrade, dormant winback, restock alerts, etc."* |
| Persona switching live | Slows demo; Custom Instructions makes the point | *"Three personas — Professional, Friendly, Executive — each with its own voice."* |
| Auto-speak on stream complete | Risky audio in CXO room | *"Responses can auto-speak via ElevenLabs in any of three persona voices."* |

You have **~30 unused capabilities** in your back pocket. That's a confident demo.

---

## Fallback / Recovery Moves

| Symptom | Recovery |
|---|---|
| AI mode hangs on a query | `Cmd+Shift+D` → flip to Demo mode → re-run (fixtures render instantly) |
| Chat state polluted | Sidebar → New Chat (proactive brief re-renders) |
| Voice doesn't trigger | Skip Act 5 voice beat — it's optional |
| Browser slows during dashboard | Skip the Save click; just narrate "saves to artifacts" |
| Internet flaky | **Cmd+Shift+D → Demo mode is fully offline**; every fixture works |
| LLM stream stalls mid-render | Demo mode shows the closing fixture text immediately — flip and re-send |
| WizOrder handoff badge doesn't appear | Refresh Tab 2 once; the shared context picks up on remount |

---

## Final pep talk

You've got 48 capabilities. You're showing 20 in 5 minutes. Every minute carries 4 features and a pillar.

**Pace yourself.** Pauses are weapons. Let the highlights *appear* before you describe them. Let the `✦ Kai` badge *pulse* before you point at it. Let the audience say "wait, did that just happen?" before you confirm.

**End on the platform line.** That's the line investors will repeat to their LPs:

> *"WizOrder is the OS. Kai is the interface. Agents are the apps."*

Now go ship the round. You've got this.
