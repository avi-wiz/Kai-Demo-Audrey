# Kai 2.0 — 5-Minute Executive Demo Script

**Audience:** WizCommerce leadership + CXOs (taking this to investors)
**Goal:** Show Kai as the AI layer that re-defines B2B Wholesale & Distributor workflows — "the interface for the post-keyboard era."
**Demo URL:** https://kaidemov0.vercel.app
**Total runtime:** 5:00 (4:30 demo + 0:30 buffer for reactions)

---

## Pre-Flight Checklist (do this 5 min before)

- [ ] Open `https://kaidemov0.vercel.app` in Chrome, full-screen, zoom 110%
- [ ] Hard-refresh (`Cmd+Shift+R`) — clears prior chat state
- [ ] Confirm **AI mode is ON** (top-right toggle — green halo). Use `Cmd+Shift+D` to flip.
- [ ] Confirm persona = **Professional** (Settings → Persona)
- [ ] Confirm "Read responses aloud" = **OFF** for the room (avoid audio surprises)
- [ ] Confirm "Proactive assistance" = **ON** (so the brief renders)
- [ ] Open these tabs in parallel and pre-position:
  - Main demo tab on **"Kai chat"** (cleared)
  - A second tab on **WizOrder → CRM page** (to show shared-context handoff)
- [ ] Have a sip of water. You're going to talk for 5 minutes.

---

## The Narrative Arc (memorize this — it's the spine)

> "Today, a B2B rep navigates 6–8 screens to answer one question about one customer. Kai collapses that into a sentence. But it's not a chatbot — it's an **intelligence layer** with three powers: **Surface** (it tells you what matters), **Act** (it does things, with your consent), and **Trace** (you see exactly how it decided). Let me show you."

You'll demo three beats — Surface, Act, Extend — each ~80 seconds.

---

## ACT 1 — The Proactive Brief (0:00 – 0:45)

**Setup:** Land on the cleared Kai chat. The Proactive Brief is already rendered.

### What's on screen
A morning brief card titled *"Good morning, Heman. Here's what needs your attention today."* with three sections — 🚨 URGENT, ⚠️ ATTENTION, ℹ️ TODAY — each with action chips below.

### What you say (verbatim, ~30 sec)
> "I haven't typed anything. Kai opened, and it already knows my day. Quote QT-1192 expires tomorrow — $8,200 at risk. Two approvals stuck 48 hours. A claim aging out. And my 11am meeting prep, one click away."
>
> *(point to the chips)*
>
> "Every one of these is a one-click action. Not a link to a screen — an **action**."

### What you do
- **Hover** (do NOT click) the "Draft a follow-up email to Acme about quote QT-1192" chip
- Pause 2 seconds for impact

### The takeaway (say it out loud)
> "Before the rep types anything, Kai has prioritized the day."

---

## ACT 2 — Surface: 360° in One Sentence (0:45 – 2:00)

This is the WOW moment. The single most important 60 seconds of the demo.

### What you do
In the chat input, type exactly:
```
How's Acme Corp doing?
```
Press Enter.

### What happens on screen (narrate as it renders)
The response streams in over ~2 seconds:

1. **AgentReasoningCard** appears (collapsed) — *"Resolved 'Acme Corp' → C-4201. 4 MCPs called in parallel. Total: 630ms."*
2. **Customer360Card** — profile, $482K LTR, last order, **credit-balance warning highlighted in red**
3. **Revenue trend line chart** — 12 months, clearly trending up
4. **Open Tasks list** — 4 tasks, with one **overdue task highlighted in red**, one **due-tomorrow task in amber**
5. **Insight text streams in** — *"Acme Corp is trending up — revenue +12% QoQ. Consider scheduling a renewal check-in before Q3."*
6. **Action chips** appear below: *Create follow-up · Draft email · Show recent orders · Prep for meeting*

### What you say (verbatim, ~60 sec — pace yourself to the renders)
> "One sentence. Watch what Kai does."
>
> *(reasoning card renders)*
> "First — Kai shows its work. It resolved 'Acme Corp' to the actual customer record, called four data sources in parallel — CRM, revenue, tasks, claims — in 630 milliseconds. That's the **Trace** pillar. Auditable AI."
>
> *(Customer360 + chart + tasks render)*
> "Now look at what it surfaced. The full customer record, 12-month revenue trend, open tasks — but more importantly, **look at the colors**. Red on the balance: this customer is at 24% of credit limit. Red on task T-1001: it's overdue. Amber on T-1004: due tomorrow."
>
> *(point to the chip inside the red highlight tooltip — hover it)*
> "Kai isn't just *showing* data. It's **flagging what matters** and offering the next action right there. One click sends a payment reminder."
>
> *(point to the streaming closing text)*
> "And the insight: revenue up 12% quarter over quarter, all tasks on track, time to talk renewal. That's **Surface**."
>
> *(land it)*
> "**Six screens of WizOrder, replaced by one sentence and two seconds.**"

---

## ACT 3 — Act: Natural Language → Structured Action (2:00 – 3:15)

### What you do
Click the **"Create follow-up task for Acme Corp"** action chip directly below the previous response.
*(Do not type. The whole point is that chips chain capabilities.)*

### What happens on screen
1. Reasoning card — *"Intent: Task Creation. Resolved customer, resolved assignee 'Heman Bhullar', validated config."*
2. **EntityDetailCard** — staged task preview (title, customer, priority High, assignee, due date pre-filled)
3. **Multi-step form** below — every field pre-populated
4. **Consent banner** — three buttons: **Confirm & Create / Edit / Cancel**

### What you say (~45 sec)
> "I clicked the chip — no typing. Kai understood intent, resolved entities — me as the assignee, Acme as the customer — pre-filled every field, and **staged the action for my review**."
>
> *(point to the consent banner)*
> "Notice what Kai did NOT do. It didn't write to the CRM. It paused, showed me the form, and is asking permission. **Confirm. Edit. Cancel.** This is the safety contract — natural language in, structured action staged, human in the loop."

### What you do next
Click **Confirm & Create**.
- Spinner → "Task Created ✓" confirmation
- Form dims to 40% opacity

### Then switch to your WizOrder tab → CRM page → Tasks
The new task appears at the top with a small **✦ Kai** badge pulsing.

### What you say (~20 sec)
> "And — here's the magic — switch over to the actual WizOrder CRM. The task is right there, tagged with Kai's signature. **No sync delay. No second system to learn.** Kai *is* WizOrder, with an intelligence layer on top."

---

## ACT 4 — Extend: The Platform Play (3:15 – 4:30)

This is where you sell the *platform* vision. Investors care about the moat — show them the moat.

### Beat A: Dashboards on Demand (~30 sec)
Back to the Kai tab. Type:
```
Build me a sales performance dashboard
```

**On screen:** A composite dashboard renders — 4 metric cards (Revenue MTD, Active Orders, Open Quotes, Active Customers) + line chart + summary table — wrapped in a Save / Edit / Cancel consent banner.

**Say:**
> "A dashboard, generated on demand, from one sentence. Click Save — it's now a permanent artifact. Click Edit — Kai opens it in a full-screen builder and I can refine it conversationally: *change the date range to 90 days, swap the chart for a bar.* No BI tools. No tickets to data team. **Dashboards as conversation.**"

*(Click Save → quickly close the modal — don't dwell.)*

### Beat B: The Agent Store (~30 sec)
Open the left sidebar → click **"Agent Store"**. Click on **"Ella — AI Order Entry Assistant"**.

**On screen:** A polished agent detail page — capabilities, permissions, connectors, pricing ($99/mo or usage-based), Add to Cart.

**Say:**
> "And Kai is **extensible**. This is our internal app store for specialized agents. Ella reads inbound POs from PDFs and emails, validates them, and pushes them into WizOrder — fully automated order entry. Subscribe with one click, usage-based pricing. We — and eventually our partners — can ship new agents into every Kai instance overnight."
>
> *(land it)*
> "This is the **wedge into a platform business**. WizOrder becomes the OS. Kai becomes the interface. Agents become the apps."

### Beat C: Voice (optional, ~15 sec — only if time permits)
Back to Kai chat. Click the mic. Speak:
```
What's my pipeline worth this week?
```
Response renders + (if you flipped voice on) plays back.

**Say:**
> "And it works hands-free. On a sales call, walking the warehouse floor, in the car — Kai is voice-native."

---

## CLOSE — The Investor Line (4:30 – 5:00)

Pause. Look up from the screen. Address the room.

**Say (slowly, deliberately):**
> "What you just saw is not a chatbot. It's a re-architecture of how B2B sales reps work.
>
> Six clicks → one sentence. Five tools → one surface. A static CRM → a system that *tells you what matters*, *does what you ask*, and *shows you its work*.
>
> The B2B Wholesale & Distributor market spends billions on disconnected SaaS — CRM, ERP, BI, comms, order entry. **Kai is the layer that unifies them.** Built on top of WizOrder, every customer we already serve becomes a beachhead. Every agent we ship in the store deepens the moat.
>
> This is how WizCommerce becomes the system of record *and* the system of intelligence for the B2B distribution industry."
>
> *(beat)*
>
> "Questions?"

---

## Fallback / Recovery Moves

If something breaks mid-demo:

| Symptom | Recovery |
|---|---|
| AI mode hangs on a query | `Cmd+Shift+D` → flip to Demo mode → re-run the same query (fixtures render instantly) |
| Chat state polluted | Sidebar → New Chat (proactive brief re-renders) |
| Voice doesn't trigger | Skip Beat C — voice is optional |
| Browser slows during dashboard | Skip Beat A, jump to Agent Store |
| Internet flaky | Demo mode works fully offline against fixtures — flip the toggle |

---

## Sequence Cheat Card (print this, glance during demo)

```
0:00  Land on chat → narrate proactive brief         (hover, don't click)
0:45  Type: "How's Acme Corp doing?"                 (the WOW — 60 sec)
2:00  Click chip: "Create follow-up task"            (no typing — chain it)
2:45  Click Confirm & Create
2:55  Switch tab → WizOrder CRM → show task          (handoff moment)
3:15  Type: "Build me a sales performance dashboard"
3:45  Sidebar → Agent Store → click Ella
4:15  (Optional) Mic → "What's my pipeline?"
4:30  Close — 30 second investor pitch
5:00  Q&A
```

---

## What Each Beat Proves (for your own confidence)

| Beat | Pillar | Proof Point for CXO |
|---|---|---|
| Proactive Brief | Surface | "Kai works *before* you ask" |
| Acme query | Surface + Trace | 360° in 2 sec; auditable reasoning; highlight-driven attention |
| Task creation chip | Act | NL → structured action with human-in-the-loop consent |
| WizOrder handoff | Integration | One system, not two — no sync, no friction |
| Dashboard builder | Extend (data) | BI without BI tools |
| Agent Store | Extend (platform) | Marketplace moat, recurring revenue, partner ecosystem |
| Voice | Reach | Field-ready, hands-free, modality-agnostic |

---

## One Sentence You Should Be Able to Deliver Cold

> "Kai turns six screens into one sentence, with the safety of human-in-the-loop confirmation, the auditability of a visible reasoning trace, and the extensibility of an internal app store — all built natively on top of WizOrder."

Practice it. Deliver it once during the close. The investors will remember it.

---

**Good luck. You've got this.**
