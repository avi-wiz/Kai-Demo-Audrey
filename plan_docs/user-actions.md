# Kai 2.0 — User Actions Reference

An exhaustive, structured catalog of every action a user can perform on/in Kai.

---

## 1. Chat & Messaging

- **Send a text message** — Type into the chat input and press Enter (or click submit).
- **Send a voice message** — Tap the mic; speech-to-text transcribes and (optionally) auto-submits.
- **Manually submit a voice transcript** — When auto-send is off, review the transcript and submit.
- **Clear voice transcript** — Discard the in-progress transcript before sending.
- **Start a new chat** — "New Chat" button saves the current session and opens a fresh thread.
- **Restore a previous chat** — Open a saved session from History to resume context.
- **Ask Kai (header button)** — Jump straight to the chat and focus the input.
- **View streaming response** — Watch Kai's text stream in while widgets render from fixtures.

---

## 2. Voice (STT + TTS)

- **Start/stop voice listening** — Toggle the mic icon to begin/end speech capture.
- **Unlock browser audio** — One-time gesture to enable TTS playback.
- **Have Kai read responses aloud** — Toggle "Read aloud" in preferences.
- **Toggle auto-send voice** — Auto-submit transcripts on speech end vs. hold for review.

---

## 3. Navigation & Views

- **Open Chat** view from sidebar.
- **Open History** view from sidebar.
- **Open My Artifacts** view from sidebar.
- **Open Docs / Knowledge Base** view from sidebar.
- **Open Settings** (persona + voice) view.
- **Open Agent Store** view.
- **Open User Preferences** view.
- **Navigate to a WizOrder page** — Orders, Customers, Products, CRM, Dashboard.
- **Collapse / expand the left sidebar** — Toggle between full and icon-only mode.
- **Open the Command Palette** — Cmd+K for fuzzy nav and query launch.
- **Run a query from the Command Palette** — Type and Enter to auto-submit to Kai.

---

## 4. Keyboard Shortcuts

- **Cmd+K** — Open Command Palette.
- **Cmd+Shift+D** — Toggle AI Mode vs. Demo Mode.
- **Cmd+Shift+L** — Toggle sidebar collapse.
- **Esc** — Close modals, dialogs, command palette.
- **↑ / ↓ / Enter** — Navigate and select within the Command Palette.

---

## 5. Response Mode

- **Switch to Text + Widgets** — Rich responses with charts, tables, forms, dashboards.
- **Switch to Text Only** — Plain-text responses, no inline UI.

---

## 6. Personas & Voice Persona

- **Select a persona** — Professional, Friendly, or Executive.
- **Rename a persona** — Edit the custom display name.
- **Confirm / cancel persona rename** — Enter / Esc.
- **Select a TTS voice** — Pick from available voice options.
- **Preview voice description** — Hover voice options to see descriptions.

---

## 7. Custom Instructions

- **Edit custom instructions** — Up to 500 characters, injected into every system prompt.
- **Auto-save** — Debounced save after typing pauses.
- **Manual save** — Force-persist via Save button.
- **Clear instructions** — Empty the textarea and save.

---

## 8. User Preferences (Toggles)

- **Auto-expand reasoning** — Show Kai's reasoning by default.
- **Proactive assistance** — Enable/disable proactive briefs and suggestions.
- **Financial data** — Include/exclude financial figures in responses.
- **Read aloud** — TTS on/off.
- **Show confidence** — Show/hide confidence scores.
- **Auto-send voice** — Auto-submit on speech end.
- **Notification sounds** — Audio cues on/off.
- **Show contact info** — Include contact info in results.
- **Require confirmation** — Confirm before destructive/external actions (warning when disabling).
- **Auto-save artifacts** — Persist generated artifacts automatically.

---

## 9. Action Chips

- **Click an action chip** — Auto-submits the chip's query, continuing the chain (max depth 3).
- **Follow chained chips** — Each response renders its own chips; build multi-step workflows.
- **Use brief chips** — Action chips embedded inside a Proactive Brief.

---

## 10. Proactive Briefs

- **View page-tailored brief** — First message on a new chat when opened from a WizOrder page.
- **Act on brief insights** — Click embedded action chips to execute suggestions.
- **Dismiss / acknowledge** — Brief is consumed by interaction or scroll-past.

---

## 11. Suggested Starter Queries

- **Click a starter** — Auto-submits the suggested query.
- **Page-specific starters** — 4 starters tailored to current WizOrder page.
- **Generic starters** — Default set when no page context.

---

## 12. Agent Store

- **Browse agents** — View available capability agents.
- **Filter by category** — All, Sales, Support, Analytics, Operations, Management, General.
- **View My Agents** — See activated agents.
- **View agent details** — Capabilities, permissions, required connectors.
- **Activate / deactivate an agent**.
- **Configure an agent** — Open agent-specific configuration page.
- **Add agent to cart** — For paid agents.
- **Checkout / pay** — Complete agent purchase flow.

---

## 13. History

- **Open a saved session** — Restore the conversation state.
- **Delete a session** — Hover → delete → confirm.
- **Read session summary** — Auto-generated title, subtext, tags, and last-update time.
- **See category tags** — Sales, Support, etc., colored chips.

---

## 14. Artifacts ("My Artifacts")

- **Save a widget as an artifact** — From any response widget.
- **Browse artifacts** — Grid of thumbnails (charts, tables, dashboards, etc.).
- **Open an artifact** — View full detail / re-open dashboard.
- **Delete an artifact** — Hover → delete → confirm.
- **View artifact metadata** — Title, description, save date, category.

---

## 15. Dashboard Builder

- **Ask Kai to build a dashboard** — Generates a DashboardCompositeWidget in chat.
- **Open dashboard in full view** — From the artifact or inline widget.
- **Edit via Kai sidebar** — Add / modify / remove cells through conversation.
- **Add a dashboard cell** — Metric card, chart, table.
- **Remove a dashboard cell**.
- **Reorder cells**.
- **Save dashboard** — Persist as an artifact ("Unsaved" indicator until saved).
- **Export as PDF**.
- **Export as CSV**.
- **Exit dashboard view** — Back to previous view.

---

## 16. Knowledge Base / Docs

- **Upload a document** — Click or drag-drop (.pdf, .docx, .txt, .md).
- **Track upload → processing → indexed states**.
- **Remove a document** — Triggers re-index.
- **Watch re-index progress toast**.
- **Ask Kai about uploaded docs** — Document-grounded QA in chat.
- **View document metadata** — Filename, type badge, page count.

---

## 17. AI Mode vs. Demo Mode

- **Toggle AI Mode** — Cmd+Shift+D or header toggle.
- **AI Mode** — Live Claude Sonnet 4.6 generation.
- **Demo Mode** — Deterministic fixture responses.
- **See mode-switch toast** confirmation.

---

## 18. WizOrder Page Integration

- **Trigger page context injection** — Opening Kai from a WizOrder page wires its data into the system prompt.
- **Get page-specific action chips, starters, and briefs**.
- **Deep-link back to WizOrder records** from widgets / chips.
- **Shared state bridging** — Kai-created Orders, Carts, Customers, CRM, Quotes, Claims appear on their WizOrder listing pages.

---

## 19. Inline Widget Interactions

- **Click a widget action button** (DeepLinkButton, ConfirmationDialog, etc.).
- **Fill a multi-step form wizard** — Edit fields, navigate steps, submit.
- **Edit a Kai-staged form** — Modify before submitting.
- **Confirm / cancel a Confirmation Dialog**.
- **Accept / decline a Consent Banner**.
- **Open an entity detail link** — Navigate to the underlying WizOrder record.
- **Save a widget result** as an artifact.

---

## 20. Follow-ups

- **Continue a follow-up** — Kai swaps the active widget or re-stages the active form rather than appending a new message.
- **Chain follow-up turns** — Iteratively refine a result (filter, drill down, edit).

---

## 21. Onboarding

- **Step through onboarding** — Meet Kai → choose persona → enable voice → set preferences → finish.
- **Skip optional steps**.
- **Re-trigger onboarding** (if reset).

---

## 22. Feedback / System UX

- **See toast notifications** — Confirmations, warnings, errors (auto-dismiss).
- **See "Thinking…" indicator** while Kai processes.
- **See loading spinners** for async ops (export, upload, re-index, summary generation).

---

## 23. Accessibility

- **Tab through interactive elements**.
- **Activate via Enter/Space**.
- **Esc to close modals/dialogs**.
- **Screen-reader labels** on all key controls.
