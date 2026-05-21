# Plan: Persistent, LLM-summarized Chat History

Plan also mirrored to [`Plan_history.md`](Plan_history.md) at repo root.

## Context

Today the History view ([src/components/views/HistoryView.tsx](src/components/views/HistoryView.tsx)) renders a hardcoded fixture ([src/fixtures/history-items.json](src/fixtures/history-items.json)) of 5 sample sessions. Clicking a card just re-injects the original query into a fresh chat — the previous conversation, widgets, and LLM text are lost.

For the upcoming LLM-driven demo, History must behave like real production:

1. Whenever a user starts a **New Chat**, the conversation they're leaving must be summarized (LLM-inferred title + one-line subtext + tag) and persisted.
2. Clicking a saved session in History must **restore the full prior conversation verbatim** — same widgets, same LLM closing text — so the demo presenter can navigate back and forth deterministically without re-billing the LLM or risking flaky re-streams.

The save trigger is **New Chat click only**. The restore mode is **full snapshot replay** (widgets + LLM text frozen at save time). Tag taxonomy is capability-aligned. If the LLM summarize call fails or AI mode is off, a heuristic fallback fills in title/subtext/tag so the session always saves.

## Tag taxonomy

Eight tags, derived from existing capability groups:

| Tag | Maps from `useCase` |
|---|---|
| **Sales** | `uc1`, `uc1-swap`, `sr2-reorder`, `sr2-compare`, `sr11-invoice`, `sr14-brief`, `sr20-outreach` |
| **Admin Ops** | `ad1-approval`, `ad1-approved`, `ad1-flagged`, `ad3-handoff` |
| **Reports & Analytics** | `ad17-report`, `metric-clarification` |
| **Email & Outreach** | `email-draft`, `email-shorter` |
| **Workflows** | `ad29-workflow`, `ad29-test`, `workflow-clarification` |
| **Knowledge Base** | `docs-qa` |
| **Dashboards** | `dashboard-builder` |
| **Other** | `uc2`, `uc2-order`, `uc2-restage`, `uc3`, `page-context`, `unknown` |

A constant `USECASE_TO_TAG: Record<string, HistoryTag>` lives in [src/lib/historyTags.ts](src/lib/historyTags.ts) (new file). Tag inference for a session = mode of the per-turn tag across non-stale turns; ties break by recency.

## Data model

New file [src/lib/historyTypes.ts](src/lib/historyTypes.ts):

```ts
export type HistoryTag = 'Sales' | 'Admin Ops' | 'Reports & Analytics'
  | 'Email & Outreach' | 'Workflows' | 'Knowledge Base' | 'Dashboards' | 'Other';

// Serialisable widget snapshot — drops the React Component reference,
// keeps every field the renderer needs to recreate the visual.
export interface SerializedWidget {
  key: string;
  widgetType: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  highlights?: WidgetHighlight[];
  frameId?: string;
  frameType?: string;
  branchId?: string;
}

// Snapshot of a single Kai response captured at save time.
export interface SerializedTurn {
  id: string;
  useCase: string;
  userQuery?: string;
  isStale?: boolean;
  // Frozen rendered output:
  widgets: SerializedWidget[];
  closingText?: { type: string; text: string };
  llmText?: string;          // streamed text captured via onStreamComplete
  // Use-case scoped fields preserved verbatim:
  workflowId?: string;
  ad17AddedMetrics?: string[];
  docsQA?: DocsQAPair;
  unknownReply?: string;
  pageContextMatch?: PageContextMatch;
}

export interface SavedSession {
  id: string;
  title: string;          // LLM or heuristic
  subtext: string;        // LLM or heuristic
  tag: HistoryTag;
  createdAt: number;
  updatedAt: number;
  messages: Message[];    // user + greeting bubbles
  turns: SerializedTurn[];
}
```

## Persistence layer

New context [src/contexts/ChatHistoryContext.tsx](src/contexts/ChatHistoryContext.tsx) — mirrors the [UserPreferencesContext](src/contexts/UserPreferencesContext.tsx) pattern exactly:

- LS key: `kai_chat_history_v1`
- Shape: `{ sessions: SavedSession[] }`
- Hydrate on mount via `useEffect`; persist on every `addSession` / `removeSession` / `updateSession`.
- API: `sessions, addSession(s), removeSession(id), getSession(id)`.
- Provider mounted in [src/app/layout.tsx](src/app/layout.tsx) alongside the other context providers (verify ordering — needs to be inside `UserPreferencesProvider`).

## Save flow — on New Chat click

[src/components/chat/ChatShell.tsx](src/components/chat/ChatShell.tsx) holds `messages` and `kaiTurns` as local state. The save path:

1. Add an exposed handler `saveAndResetSession()` to ChatShell. It is triggered by:
   - The sidebar's existing `newChat()` (currently calls `clearMessages()` then `setView('chat')`).
   - The same logic could later be reused by other entry points, but per scope it fires **only on New Chat**.
2. The handler runs synchronously up to the moment a snapshot is captured, then triggers the LLM summarize call asynchronously (no UX blocking — the new chat opens immediately).
3. Snapshot capture pulls from refs that ChatShell already populates:
   - `messagesRef.current` — full Message[] including greeting.
   - `kaiTurnsRef.current` — KaiTurn[] with per-turn `widgets` snapshot.
   - For widgets we need a per-turn `renderedWidgets` ref. Today the rendered list is computed inside each turn renderer (`StandardTurnRenderer`, `ConsentTurnRenderer`, etc.) and reported up through the existing `onWidgetsReady` callback. Extend that callback to write into a `turnIdToWidgets: Record<string, ParsedWidget[]>` map at the ChatShell level. Strip the non-serialisable `Component` field via `serializeWidget(w)` before snapshotting.
   - For LLM closing text we already have `handleStreamComplete(text)` — extend it with `(turnId, text)` so the streamed text is keyed by turn and stored in a `turnIdToLlmText: Record<string, string>` ref.
4. **Skip-save guard:** If `messages.filter(m => m.role === 'user').length === 0`, do not save (greeting-only session).
5. After snapshot is in hand, reset state (`setMessages([greeting])`, `setKaiTurns([])`, clear refs and chip-chain depth) and call `setView('chat')`.

### Bridging sidebar → ChatShell

ChatShell has no direct callable from the sidebar. Two options; **plan picks (a)**:

(a) Add a `ChatSessionContext` (new lightweight context) that exposes `requestSaveAndReset(): Promise<void>`. ChatShell registers the implementation via `useEffect` on mount. UnifiedSidebar's `newChat()` calls it instead of `clearMessages()` + `setView('chat')` directly. Same wiring for [KaiOnlySidebar.tsx](src/components/layout/KaiOnlySidebar.tsx) + [KaiHoverMenu.tsx](src/components/layout/KaiHoverMenu.tsx) (also call `clearMessages()` today).

(b) Hoist messages/turns into ConversationContext. Larger refactor — out of scope.

## Summarize endpoint

New route [src/app/api/kai/summarize/route.ts](src/app/api/kai/summarize/route.ts), modeled on [src/app/api/kai/restage-metrics/route.ts](src/app/api/kai/restage-metrics/route.ts) (returns structured JSON, not a stream — cleanest for this use).

Request:
```ts
{ messages: Message[], turns: { useCase, userQuery, closingText? }[] }
```

System prompt (built locally — does not need to live in [src/lib/systemPrompts.ts](src/lib/systemPrompts.ts) unless we want consistency):

> You are summarizing a sales-assistant chat session for a History view. Return STRICT JSON: `{ "title": string, "subtext": string, "tag": "<one of: Sales, Admin Ops, Reports & Analytics, Email & Outreach, Workflows, Knowledge Base, Dashboards, Other>" }`. Title ≤ 60 chars, action-oriented (e.g. "Restock order for Acme Corp"). Subtext ≤ 110 chars, one-line factual recap.

Tag is sanitized server-side against the allowlist; on parse failure return `{ ok: false }` and the client falls back to heuristics.

Client wrapper: [src/hooks/useSummarizeSession.ts](src/hooks/useSummarizeSession.ts) — a single `summarizeSession(payload): Promise<{title, subtext, tag} | null>` (no React hook needed; export a function). Uses `AbortController` with a 6s timeout so a hung LLM never blocks history persistence.

## Heuristic fallback

[src/lib/historyHeuristics.ts](src/lib/historyHeuristics.ts) — pure, no LLM:

```ts
heuristicSummary(messages, turns): { title, subtext, tag }
```

- **title:** first user message, trimmed + truncated to 50 chars + `…`.
- **subtext:** last non-stale turn's `closingText.text` (truncated 110), else `"${turns.length} response${...}"`.
- **tag:** mode of `USECASE_TO_TAG[turn.useCase]` across non-stale turns; default `"Other"`.

Save sequence in `saveAndResetSession`:

```ts
const heur = heuristicSummary(messages, turns);
addSession({ ...heur, ...sessionScaffold });   // save with heuristic immediately
summarizeSession(payload).then(llm => {
  if (llm) updateSession(id, { title: llm.title, subtext: llm.subtext, tag: llm.tag });
}).catch(() => {});                            // silent — heuristic stays
```

This means the History view never has empty cards, and the LLM result quietly upgrades the entry within a few seconds.

## Restore flow — clicking a History card

[src/components/views/HistoryView.tsx](src/components/views/HistoryView.tsx) is rewritten to consume `useChatHistory().sessions` (sorted by `updatedAt` desc). Card click handler:

1. Look up the `SavedSession`.
2. Push it into a new transient context value `pendingRestoreSession`, then `setView('chat')`.
3. ChatShell `useEffect` watches `pendingRestoreSession`: when set, it calls `restoreSession(savedSession)` and clears the pending ref.

`restoreSession(s)` in ChatShell:

1. `setMessages(s.messages)` — the user/assistant text bubbles.
2. `setKaiTurns(s.turns.map(rehydrateTurn))` where `rehydrateTurn` converts a `SerializedTurn` back into a runtime `KaiTurn` whose widgets are *pre-rendered* (no re-stream).
3. Each turn renderer currently calls `useStreamSimulator` to drive the widget stream. We add a short-circuit: **if the turn carries a `restoredWidgets` field**, the renderer uses that directly and skips the simulator + `useKaiGenerate` (LLM text comes from `restoredLlmText` if present, fed into `CanvasTextBlock` with `isStreaming=false`).
4. The fixture-shaped widgets are revived with `Component` filled in by [resolveWidget()](src/components/engine/ComponentRegistry.ts) — same lookup the live pipeline already uses. No need to re-run `parseFrame`.
5. Chips at the bottom of the restored last turn still work for net-new follow-ups (the chip pipeline keys off `useCase`, which is preserved).

Minimal renderer change: add an `isRestored?: boolean` + `restoredWidgets?` + `restoredLlmText?` to `KaiTurn`. In each top-level renderer (`StandardTurnRenderer`, `ConsentTurnRenderer`, `DocsQATurnRenderer`, `PageContextTurnRenderer`, etc.), branch at the top — if restored, render the pre-baked widgets / text and skip simulator/LLM hooks entirely. This is a small, additive change per renderer (~5 lines each).

## HistoryView UI rewrite

Replace the static map over the fixture with a `useChatHistory().sessions` map. Each card now shows:

- **Title** (LLM or heuristic).
- **Subtext** (1 line, truncated with ellipsis).
- **Tag badge** — coloured per tag (define a `TAG_COLORS` map in [src/lib/historyTags.ts](src/lib/historyTags.ts) using the design-system tokens).
- **Updated date** — `formatRelativeDate(updatedAt)` (today / yesterday / Nov 3).
- Trash icon on hover → `removeSession(id)` with confirm.

Empty state when `sessions.length === 0`: a card encouraging the user to start chatting.

The existing fixture import is removed.

## Critical files

| File | Change |
|---|---|
| [src/lib/historyTypes.ts](src/lib/historyTypes.ts) *(new)* | `SavedSession`, `SerializedTurn`, `SerializedWidget`, `HistoryTag`. |
| [src/lib/historyTags.ts](src/lib/historyTags.ts) *(new)* | `USECASE_TO_TAG`, `TAG_COLORS`, `HISTORY_TAGS`. |
| [src/lib/historyHeuristics.ts](src/lib/historyHeuristics.ts) *(new)* | `heuristicSummary()`. |
| [src/contexts/ChatHistoryContext.tsx](src/contexts/ChatHistoryContext.tsx) *(new)* | Provider + hook, mirrors UserPreferencesContext pattern. |
| [src/contexts/ChatSessionContext.tsx](src/contexts/ChatSessionContext.tsx) *(new)* | Tiny bridge so sidebar can invoke ChatShell.saveAndReset / restore. |
| [src/hooks/useSummarizeSession.ts](src/hooks/useSummarizeSession.ts) *(new)* | Client wrapper around `/api/kai/summarize` with timeout. |
| [src/app/api/kai/summarize/route.ts](src/app/api/kai/summarize/route.ts) *(new)* | Anthropic call returning JSON; allowlist-validated tag. |
| [src/app/layout.tsx](src/app/layout.tsx) | Wrap tree in `ChatHistoryProvider` + `ChatSessionProvider`. |
| [src/components/layout/UnifiedSidebar.tsx](src/components/layout/UnifiedSidebar.tsx) | `newChat()` calls `requestSaveAndReset()` instead of `clearMessages() + setView('chat')`. |
| [src/components/layout/KaiOnlySidebar.tsx](src/components/layout/KaiOnlySidebar.tsx) | Same. |
| [src/components/layout/KaiHoverMenu.tsx](src/components/layout/KaiHoverMenu.tsx) | Same. |
| [src/components/chat/ChatShell.tsx](src/components/chat/ChatShell.tsx) | Register save/reset + restore via ChatSessionContext. Track `turnIdToWidgets` + `turnIdToLlmText` refs. Add restore branch to each turn renderer. Extend `KaiTurn` with `isRestored`, `restoredWidgets`, `restoredLlmText`. |
| [src/components/views/HistoryView.tsx](src/components/views/HistoryView.tsx) | Rewrite to consume `useChatHistory()`. Drop fixture import. |

## Existing utilities to reuse

- [resolveWidget()](src/components/engine/ComponentRegistry.ts) — for restoring `Component` references on serialized widgets.
- [`useUserPreferences()`](src/contexts/UserPreferencesContext.tsx) pattern — verbatim model for persistence + load/save.
- [`/api/kai/restage-metrics`](src/app/api/kai/restage-metrics/route.ts) — clean reference for "small JSON-returning Anthropic endpoint with allowlist sanitization".
- [`CanvasTextBlock`](src/components/chat/CanvasTextBlock.tsx) — already supports `isStreaming=false` for static text; restored sessions just pass the saved LLM text into the same component.
- [`useConversation().clearMessages()`](src/contexts/ConversationContext.tsx) — keep wired but no longer the *only* New Chat side-effect.

## Verification

1. **Typecheck:** `npx tsc --noEmit` → 0 errors.
2. **Dev server:** `npm run dev` → `http://localhost:3000`.
3. **Save path (LLM mode):**
   - Enable AI mode (Cmd+Shift+D).
   - Run a UC-1 query (`How is Acme doing?`) → wait for response.
   - Click **New Chat** in sidebar.
   - Open History → entry appears with LLM-generated title, subtext, **Sales** tag, current date.
4. **Save path (LLM failure / demo mode):**
   - Disable AI mode.
   - Run `Show me overdue invoice for Acme` → click New Chat.
   - History entry appears immediately with heuristic title (first user message), subtext (closing text excerpt), tag `Sales` from `sr11-invoice`.
5. **Restore path:**
   - From History, click the Acme entry → chat opens.
   - Verify the user bubble, the UW-007 Customer360Card (or UW-003 invoice card), and the closing LLM text are all visible exactly as before.
   - Stream is not re-running (no thinking indicator, no chunked text).
   - Click an action chip below the restored turn → a new turn streams normally on top.
6. **Persistence:** Reload the page → History list survives. localStorage shows key `kai_chat_history_v1` with the sessions.
7. **Edge cases:**
   - New Chat with greeting-only conversation → no entry saved.
   - 20+ sessions saved → History list scrolls; no performance regression on chat view (refs are populated lazily).
   - Delete a session via trash icon → confirms, removes, persists.
   - Open a docs-qa session → confidence pill + reasoning card rehydrate correctly.
   - Open an ad17-report session → all 4 metric cards render, no re-streaming.
