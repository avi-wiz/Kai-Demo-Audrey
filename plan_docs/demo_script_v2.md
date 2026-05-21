# Kai 2.0 — P0 Demo Script (v2)

**Audience:** WizCommerce leadership, CXOs, investors
**Goal:** Show that Kai is not a chatbot — it's an intelligence layer fused into WizOrder. Hit **breadth** across Surface → Act → Extend in 5 minutes.
**Runtime:** 5:00 sharp. 30 sec Q&A buffer.

> **What changed from v1:** Kai Add-ons (Agent Store), Models (Settings), Agents tab (Analytics), and all Workflow creation entry points are hidden for this build. This script reflects the current UI exactly — no references to hidden features.

---

## Pre-Flight (T-5 min before anyone walks in)

- [ ] Chrome, full-screen, zoom 110%, DevTools closed
- [ ] Hard-refresh the app (`Cmd+Shift+R`) — clears prior chat state
- [ ] Confirm **AI mode = ON** (top-right toggle, green halo). `Cmd+Shift+D` flips it.
- [ ] Settings → Persona = **Professional**
- [ ] User Preferences:
  - "Proactive assistance" = **ON**
  - "Auto-expand Agent Reasoning" = **OFF** (expand on demand for drama)
  - "Read responses aloud" = **OFF** (avoid audio surprises)
  - "Show confidence scores" = **ON**
- [ ] Custom Instructions field contains:
  > *"Lead with the headline number. Keep insights under 2 sentences. Use bar charts, not pie."*
- [ ] **Two browser tabs pre-positioned:**
  - Tab 1: Kai chat (cleared, proactive brief already showing)
  - Tab 2: WizOrder → CRM page (for the shared-state handoff moment)
- [ ] Phone silent. Slack notifications off.

---

## The Spine (memorize — deliver once at the top)

> "B2B reps navigate six to eight screens to answer one question about one customer. Kai collapses that into a sentence. But it's not a chatbot — it's three things: **Surface** what matters, **Act** with your consent, and **Trace** every decision. And it's wired natively into every page of WizOrder. Five minutes. Watch."

---

## THE ARC

| Time | Beat | What You're Proving |
|---|---|---|
| 0:00–0:40 | Proactive Brief | Kai works before you type |
| 0:40–1:50 | "How's Acme Corp doing?" | 360° in one sentence; highlights; auditable reasoning |
| 1:50–2:20 | Widget-swap follow-up | The rendering layer is fluid |
| 2:20–3:20 | Chip → staged task → confirm → WizOrder handoff | NL to structured action with consent; shared state |
| 3:20–4:00 | "Build me a sales performance dashboard" | BI without BI tools; custom instructions proof |
| 4:00–4:30 | My Artifacts + ⌘K | Platform depth; everything one keystroke away |
| 4:30–5:00 | Close | The investor line |

---

## BEAT 1 — Proactive Brief (0:00 – 0:40)

**You're on:** Tab 1 (Kai chat). The Proactive Brief is already rendered as the first message.

### What's on screen
A brief titled *"Good morning, Heman. Here's what needs your attention today."*
- 🚨 URGENT: quote QT-1192 expiring tomorrow ($8,200 at risk), 2 approvals stuck 48h
- ⚠️ ATTENTION: a claim aging out, 3 stale leads
- ℹ️ TODAY: 12 open tasks, 4 deals in this week's pipeline
- Action chips below each item

### What you say (~30 sec)
> "I haven't typed anything. Kai opened — and it already knows my day. Quote expiring tomorrow. Two approvals stuck. A claim aging out. And every item has a one-click action wired to it. Not a link to a screen — an action."

*(Hover — don't click — one chip. Pause 2 seconds.)*

> "Before the rep types a single character, Kai has prioritized the day."

---

## BEAT 2 — Surface: 360° in One Sentence (0:40 – 1:50)

This is the centrepiece. Give it room.

### What you type
```
How's Acme Corp doing?
```

### What streams in (narrate as it renders)
1. **AgentReasoningCard** (collapsed) — *"Resolved 'Acme Corp' → C-4201. 4 MCPs in parallel. 630ms."*
2. **Customer360Card** — profile, $482K LTR, last order, **credit balance highlighted red**
3. **Revenue trend LineChart** — 12 months, trending up
4. **Open Tasks CompactList** — task T-1001 **red** (overdue), T-1004 **amber** (due tomorrow)
5. **Insight text streams in** — *"Acme is trending up — revenue +12% QoQ. Consider a renewal check-in before Q3."*
6. **Action chips appear** — *Create follow-up · Draft email · Show recent orders · Prep for meeting*

### What you say (~60 sec — pace it to the renders)
> "One sentence. Watch."

*(Reasoning card)*
> "Kai shows its work. It resolved Acme to a customer record, called four data sources in parallel, done in 630ms. That's the **Trace** pillar — auditable AI."

*(Click to expand briefly, then collapse.)*

*(Customer360 + chart + tasks)*
> "Now look at the colours. Red on the credit balance — 24% of limit. Red on task T-1001 — overdue. Amber on T-1004 — due tomorrow. Kai isn't displaying data; it's **flagging what matters**."

*(Hover the red credit highlight — tooltip with 'Send payment reminder' appears)*
> "And every flag has a resolution baked right into the tooltip. One click."

*(Point at the streaming insight)*
> "Revenue up 12% quarter over quarter. Time to talk renewal. That's **Surface**."

*(Land it)*
> "Six WizOrder screens. One sentence. Two seconds."

---

## BEAT 3 — Widget-Swap Follow-Up (1:50 – 2:20)

### What you type
```
Show that as a table
```

### What happens
The previous turn dims to 40% opacity (stale overlay). A new turn renders with a **DataTable** — same data, restructured.

### What you say (~20 sec)
> "Same data, different lens. The previous response went stale automatically — no re-query, no page reload. The widget layer is composable. Ask for it any way you want."

---

## BEAT 4 — Act: Chip → Form → Consent → WizOrder Handoff (2:20 – 3:20)

No typing in this beat. Everything flows from one chip click.

### What you do
Scroll back up to the original response's action chips. Click **"Create follow-up task for Acme Corp"**.

### What renders
1. **AgentReasoningCard** — *"Intent: Task Creation. Resolved customer, assignee 'Heman Bhullar', validated config."*
2. **EntityDetailCard** — staged task preview (title, customer, priority: High, assignee, due date — all pre-filled)
3. **MultiStepFormWizard** — every field populated
4. **ConsentBanner** — **Confirm & Create / Edit / Cancel**

### What you say (~30 sec)
> "I clicked the chip — no typing. Kai understood intent, resolved entities — me as assignee, Acme as customer — pre-filled every field, and staged the action for my review."

*(Point at the consent banner)*
> "Notice what Kai did NOT do. It did not write to the CRM. It paused, showed me the form, and asked permission. Confirm. Edit. Cancel. **Natural language in, structured action staged, human in the loop.** That's the safety contract."

### What you do next
Click **Confirm & Create** → spinner → *"Task Created ✓"* → form dims.

### Switch to Tab 2 (WizOrder CRM → Tasks)
New task is at the top of the list with a **✦ Kai** badge pulsing.

### What you say (~20 sec)
> "Switch to WizOrder — the actual CRM. The task is right here, tagged with Kai's signature. No sync. No second system. Kai *is* WizOrder, with an intelligence layer on top."

*(Let the badge pulse for a beat before moving on.)*

---

## BEAT 5 — Extend: Dashboard from a Sentence (3:20 – 4:00)

Back to Tab 1 (Kai chat).

### What you type
```
Build me a sales performance dashboard
```

### What renders
**DashboardCompositeWidget** — a 2×3 grid:
- Row 1: Revenue MTD, Active Orders, Open Quotes (metric cards)
- Row 2: Monthly revenue bar chart + summary table
- Wrapped in **Save / Edit / Cancel** consent banner

### What you say (~30 sec)
> "A dashboard from one sentence. No BI tools. No tickets to a data team."

*(Point at the bar chart)*
> "And look — bar chart, not pie. Why? Because in my Custom Instructions I wrote: *'Use bar charts, not pie.'* Kai injected that into the LLM call. **Every response, on every page, for every rep, tuned to their style.** Three personas, eight preference toggles, free-text custom instructions — Kai adapts to the human, not the other way around."

*(Click Save → quick modal → title "Q2 Sales" → Save)*
> "Saved to My Artifacts. From here I can re-open it in a full-screen editor and keep refining it conversationally — change the date range, add a metric, export as PDF."

---

## BEAT 6 — Platform Depth: Artifacts + ⌘K (4:00 – 4:30)

### Beat 6A — My Artifacts (~15 sec)
Open the left sidebar → click **My Artifacts**. Show the Dashboards & Reports and Charts tabs with saved artifacts.

> "Everything Kai generates can be saved, revisited, and re-edited. Dashboards, charts, reports — a living library of intelligence, not a chat history."

### Beat 6B — ⌘K Command Palette (~15 sec)
Press `Cmd+K`. The palette opens — 20 commands across Sales / Admin / Navigation / Settings.

> "And every Kai capability is one keystroke away. Customer lookup, build a dashboard, approvals queue, navigate anywhere in WizOrder — keyboard-first, zero friction."

Press `Esc`.

---

## CLOSE — The Investor Line (4:30 – 5:00)

Step back from the screen. Look up. Slower cadence.

> "What you just saw in five minutes:
>
> — A **proactive brief** before I typed a word.
> — **One sentence** that replaced six clicks, four data sources, and a spreadsheet.
> — A **chip-click** that became a consented, staged action live in WizOrder two seconds later.
> — A **dashboard** generated on demand, styled by my preferences, saved as a re-editable artifact.
>
> The B2B Wholesale & Distributor market spends billions on disconnected SaaS — CRM, ERP, BI, comms, order entry. **Kai is the layer that unifies them.** Built on top of WizOrder, every customer we already serve is a beachhead. Every capability we ship deepens the moat.
>
> This is how WizCommerce becomes the system of record **and** the system of intelligence for the B2B distribution industry."

*(Beat. Let it land.)*

> "Questions?"

---

## The One-Liner (deliver it once during the close — memorize it)

> "Kai turns six screens into one sentence — with the safety of human-in-the-loop consent, the auditability of a visible reasoning trace, the personalization of custom instructions, and the composability of a widget-rendering layer — all built natively on top of WizOrder."

---

## Sequence Cheat Card (print this)

```
0:00  Tab 1 (Kai chat, brief showing)     → narrate proactive brief; hover a chip
0:40  Type: "How's Acme Corp doing?"      → narrate as it streams; hover red tooltip
1:50  Type: "Show that as a table"        → widget-swap moment
2:20  Click chip: "Create follow-up task" → narrate form + consent banner
2:50  Click Confirm & Create
2:55  Switch Tab 2 → WizOrder CRM         → show ✦ Kai task at top
3:20  Tab 1 → Type: "Build me a sales performance dashboard"
3:45  Point at bar chart → Custom Instructions callout
3:50  Click Save → "Q2 Sales" → Save
4:00  Sidebar → My Artifacts              → 15 sec
4:15  Cmd+K → show palette → Esc          → 15 sec
4:30  Step back. Close. Investor line.
5:00  Q&A
```

---

## Fallback / Recovery

| Symptom | Recovery |
|---|---|
| AI mode hangs on a query | `Cmd+Shift+D` → flip to Demo mode → re-send (fixtures render instantly, fully offline) |
| Chat state polluted | Sidebar → New Chat (brief re-renders) |
| Dashboard render is slow | Skip Save click; narrate "saves to artifacts" — the audience trusts you |
| Internet flaky | Demo mode is fully offline against fixtures — flip the toggle immediately |
| Widget-swap doesn't stale-mark | Just narrate it; the DataTable itself is the point |

---

## Capabilities Shown (count: 17)

| # | Capability | Beat |
|---|---|---|
| 1 | Page-aware Proactive Brief | Beat 1 |
| 2 | Contextual action chips on brief | Beat 1 |
| 3 | UC-1 Customer 360 (5 widgets) | Beat 2 |
| 4 | AgentReasoningCard expand/collapse | Beat 2 |
| 5 | Highlights system (red/amber) | Beat 2 |
| 6 | Highlight tooltip with action pill | Beat 2 |
| 7 | LLM streaming insight text | Beat 2 |
| 8 | Action chips after response | Beat 2 |
| 9 | Widget-swap follow-up + stale overlay | Beat 3 |
| 10 | Action chip chaining (no typing) | Beat 4 |
| 11 | UC-2 staged task (EntityDetail + MultiStepForm) | Beat 4 |
| 12 | ConsentBanner (Confirm/Edit/Cancel) | Beat 4 |
| 13 | Shared-state handoff to WizOrder + ✦ Kai badge | Beat 4 |
| 14 | Dashboard-as-conversation (DashboardCompositeWidget) | Beat 5 |
| 15 | Custom Instructions affecting LLM output | Beat 5 |
| 16 | Save to Artifacts (Dashboards & Reports) | Beat 5 |
| 17 | ⌘K Command Palette | Beat 6 |

---

## Hidden Features — Q&A Ammunition

These are live in the codebase but not shown in the flow. Pull them out if a CXO asks "what else?":

| Feature | Q&A unlock |
|---|---|
| UC-3 multi-intent parallel DAG | *"One sentence → two parallel workstreams, each with their own consent banner. We call it multi-intent."* |
| SR-2 Reorder + inline compare | *"For repeat orders, Kai stages the reorder with a diff view against the original PO. One click to approve."* |
| SR-14 Meeting brief | *"Meeting prep — one sentence generates four talking points and three follow-up tasks staged for consent."* |
| SR-20 Outreach + tone rewrite | *"Outreach emails, tone variants, customer notifications — all in the same pipeline."* |
| AD-17 Sales reports + PDF/CSV export | *"Full sales reports downloadable as PDF or CSV in two clicks."* |
| Docs Q&A with confidence scores | *"Your internal docs become Kai's knowledge base — Q&A with source attribution and confidence."* |
| History view with use-case tags | *"Every interaction is logged and searchable by type — customer queries, tasks, emails, reports."* |
| Guided Tour (6 steps) | *"New reps get an interactive tour their first time in Kai."* |
| Voice STT + TTS | *"Fully voice-native — reps on the warehouse floor or in the car can use Kai hands-free."* |
| 5 WizOrder page contexts | *"Every major WizOrder page — Orders, Customers, CRM, Claims, Quotes — has its own context-aware brief and starter queries."* |
| 3 Personas × voice | *"Three personas: Professional, Friendly, Executive — each with distinct tone and a dedicated voice."* |
| Form restage mid-flight | *"Mid-flight edits: change a field in natural language after the form is staged, and Kai patches it and re-stages."* |

---

## What's Hidden for P0 (do not demo or reference)

Per `Hidden_for_P0.md` — these are commented out in the codebase:

- **Kai Add-ons / Agent Store** — sidebar nav item hidden; do not navigate there
- **Models** — removed from Admin section of sidebar
- **Agents tab** — removed from Analytics dashboard
- **Workflow creation** — intent routing disabled in chat; "Set up workflow" removed from ⌘K; "Scheduled" tab removed from My Artifacts

If a question about any of these comes up, redirect:
> *"That's on the roadmap and we can walk through it in a separate session."*
