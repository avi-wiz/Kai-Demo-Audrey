# Kai 2.0 POC — Testing Guide

## Setup
- Open the deployed URL in **Chrome** (recommended — Web Speech API works best here)
- Demo mode is default. To enable AI classification: append `?ai=true` to the URL

---

## 1. Core Use Cases (Demo Mode)

**UC-1 — Customer Intelligence**
- Click chip: *"How's Acme Corp doing?"* or type it
- Expected: 2s thinking → AgentReasoningCard streams in → Customer360 card → Line chart → Task list → Deep link button → Closing insight text below

**UC-2 — Task Creation**
- Click chip: *"Create a task for Shaw N Solutions"*
- Expected: Reasoning card → Entity card → Form (review mode) → Consent banner
- Test consent flow:
  - **Confirm** → spinner → Task Created confirmation card appears, form dims to 40% opacity
  - **Edit** → form switches to edit mode, fields become editable
  - **Cancel** → entire staged response fades to 40% opacity
- Test form re-staging: after UC-2 streams in, type *"change the due date to next Friday"* → Kai re-stages the form with the patched field

**UC-3 — Multi-Intent**
- Click chip: *"Show revenue and create a follow-up"*
- Expected: 3-frame stream with pauses (1.8s after frame 1, 1.4s after frame 2). DAG visualisation visible in the reasoning card (expand it). Both revenue data AND the staged form appear in the same response.

---

## 2. Follow-Up Flows

**Widget Swap (UC-1 → table)**
- Run UC-1, then type: *"show me that as a table"* or *"show as table"*
- Expected: old response gets a stale overlay, new turn streams UW-004 DataTable

**Form Re-staging (UC-2 edit via natural language)**
- Run UC-2 (don't confirm), then type: *"change the due date to May 15"*
- Expected: thinking → new turn with patched form fields, change summary in reasoning card

---

## 3. Docs Q&A

These should return a knowledge base answer (not the unknown reply):

| Query | Expected KB article |
|---|---|
| *"What can Kai do for sales reps?"* | Kai Sales Copilot |
| *"How does customer-specific pricing work?"* | Key Buying and Pricing Concepts |
| *"What is WizOrder?"* | Platform Overview |
| *"How does the AI Order Entry Assistant work?"* | Explore AI Co-Workers — Ella |
| *"Can buyers have multiple carts?"* | Create & Manage Carts |
| *"What is WizStudio?"* | Lifestyle Generator |

Expected for each: 2-step render — collapsed reasoning card with 3 trace steps → answer as insight closing text → source pill + confidence bar below

---

## 4. Unknown Query

- Type: *"Show me NetSuite inventory"*
- Expected: specific NetSuite reply (no chips)
- Type: *"What's the weather today?"*
- Expected: generic unknown reply + suggested query chips inline

---

## 5. Response Mode Toggle

- Find the toggle in the input bar (left of the input field)
- Switch to **Text Only**, then run UC-1, UC-2, or UC-3
- Expected: no widget cards rendered — only the closing text + (for UC-2/UC-3) consent action buttons

---

## 6. Personas

- Navigate to **Settings** in the sidebar → select a persona card
- Return to chat, run UC-1
- Expected closing text variants:
  - **Professional**: *"Revenue up 12% QoQ. 4 tasks on track. Renewal due Q3…"*
  - **Friendly**: *"Great news on Acme Corp! Revenue's climbing steadily…"*
  - **Executive**: *"Acme Corp: strong trajectory. Revenue +12% QoQ signals expansion readiness…"*

---

## 7. Save Artifact

- Run UC-1 — hover over the Line Chart
- Expected: bookmark icon appears top-right of the chart
- Click it → Save modal opens (full viewport, not over the chart)
- Enter a title → **Save to My Artifacts** → toast "Artifact saved" → auto-navigates to My Artifacts view
- Try saving with an empty title → button should be disabled/grayed; clicking should show red border on the title input

Navigate to **My Artifacts** — saved artifact appears. Hover a card → trash icon appears → click → inline delete confirm strip → confirm deletion.

---

## 8. Layout Modes

- Press **Cmd+Shift+L** to toggle between Kai-only and WizOrder chrome
- In WizOrder mode: Kai is accessible via the hover menu in the sidebar
- Sidebar collapse: click the chevron — sidebar collapses to icon rail; expand restores labels

---

## 9. History

- Run a query, then navigate to **History** in the sidebar
- Expected: the query appears as a history card with use-case badge and preview text
- Click the card → navigates to Chat and auto-submits the original query

---

## 10. Docs View

- Navigate to **Docs** in the sidebar
- Three pre-indexed documents are shown
- Drag-and-drop a file onto the upload zone → fake 3s processing animation → document added
- Hover a document → trash icon → delete → re-indexing toast with circular gauge

---

## 11. Voice (Chrome only)

- Click the **mic button** (right of Send in the input field)
- Speak a query — transcript appears in the input field in real-time
- 2s of silence → auto-sends
- After the response streams, Kai reads the closing text aloud via ElevenLabs TTS
- While Kai is streaming: mic button should be dimmed/disabled

---

## 12. AI Mode (`?ai=true`)

- Add `?ai=true` to the URL — green dot appears: *"AI Classification ON"*
- Run any of the UC-1/2/3 queries — Anthropic API classifies the intent
- Expand AgentReasoningCard → Step 0 shows classification result, confidence bar (green/yellow/red), and actual API latency
- Run a Docs Q&A query — should still intercept correctly even in AI mode
- Run an unknown query — should fall back gracefully with no error

---

## 13. Admin Views

- **Admin → API Key**: masked key field, eye toggle to reveal, Save button
- **Admin → Dashboard**: animated metric count-up cards, area chart with Daily/Weekly/Monthly filter tabs
- **Admin → Preferences**: 4 interactive toggle switches (Dark Mode toggle is disabled)

---

## Known Constraints
- Voice (STT + TTS) requires **Chrome** — Firefox and Safari are unsupported (button hidden automatically)
- AI mode requires a valid `ANTHROPIC_API_KEY` env var on the server
- All data is mocked — no real CRM/ERP calls are made
