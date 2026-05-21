# Wire 6 dead user preference toggles end-to-end

## Context

A prior audit found that the **User Preferences** view exposes 12 controls, but only 6 are actually consumed by Kai's runtime. The other 6 toggles persist to a parallel `localStorage` store (`kai_prefs_v1`) maintained by component-local state inside `UserPreferencesView.tsx` and **never read by any downstream code** — they're UI scaffolding that flips visually but produces no behavioural change.

The 6 dead toggles are:
1. **Show confidence scores** — docs-qa confidence bar renders unconditionally.
2. **Auto-send after speaking** — voice silence timeout always auto-submits.
3. **Notification sounds** — no audio fires on stream end.
4. **Show contact information** — `Customer360Card` doesn't render email/phone at all today.
5. **Require confirmation for all actions** — `AW-012` consent banner is always shown for uc2/sr2/ad29 turns.
6. **Auto-save artifacts** — no code auto-calls `addArtifact` when widgets render.

The fix is to (a) promote all 6 toggles into the real `UserPreferencesContext`, (b) collapse the parallel `kai_prefs_v1` store into the canonical `kai_user_prefs_v1`, and (c) wire each toggle's effect into the right consumer.

The intended outcome: every visible toggle in User Preferences changes Kai's behavior immediately, persists across reloads, and the test plan items in [Testing.md §13.A](Testing.md) all pass.

## Approach

### Step 1 — Promote the 6 dead toggles into `UserPreferencesContext`

**File:** [src/contexts/UserPreferencesContext.tsx](src/contexts/UserPreferencesContext.tsx)

Add 6 new fields (and setters) to the state interface + `DEFAULTS`:

```ts
showConfidence: boolean;          // default true
autoSendVoice: boolean;           // default true  (matches today's auto-submit)
notificationSounds: boolean;      // default true
showContactInfo: boolean;         // default true
requireConfirmation: boolean;     // default true  (recommended-safe default)
autoSaveArtifacts: boolean;       // default false
```

Persist them under the existing `kai_user_prefs_v1` localStorage key alongside the 5 fields already there.

**File:** [src/components/views/UserPreferencesView.tsx](src/components/views/UserPreferencesView.tsx)

Remove the component-local `useState(prefs)` / `kai_prefs_v1` / `loadPrefs` / `PrefsState` / `DEFAULT_PREFS` block (lines ~170–326). Replace every `prefs.X` / `set('X', v)` reference with the context-backed getter/setter destructured from `useUserPreferences()`. After this, the view is a pure consumer.

### Step 2 — Wire each behavior

**(A) Show confidence scores** → DocsQA renderer in [ChatShell.tsx:1164–1180](src/components/chat/ChatShell.tsx#L1164)

Gate the `<div>` that holds the source pill + confidence bar on `showConfidence`. Read it via `useUserPreferences()` inside `DocsQATurnRenderer`. Also gate the `confidence` step inside the UW-014 reasoning card — search [AgentReasoningCard.tsx:316](src/components/widgets/ui/AgentReasoningCard.tsx#L316) for the `ConfidenceBar` render and wrap on the same pref.

**(B) Auto-send after speaking** → voice button in [VoiceButton.tsx:32–35](src/components/chat/VoiceButton.tsx#L32)

The current callback to `voice.startListening` fires `onSend(finalText)` directly. Add a new optional prop `autoSend: boolean` to `VoiceButtonProps`. When `autoSend === false`, change the callback body to:
```ts
voice.startListening((finalText) => {
  onTranscriptChange(finalText);   // populate input, don't fire send
});
```
Pass `autoSend={autoSendVoice}` from ChatShell's render of `<VoiceButton>` (read from `useUserPreferences()`).

**(C) Notification sounds** → shipped audio asset + `handleStreamComplete` hook

- Add a short notification sound file at `public/sounds/kai-notify.mp3` (~5KB, single soft chime).
- In [ChatShell.tsx:1931 handleStreamComplete](src/components/chat/ChatShell.tsx#L1931), when `notificationSounds === true` (and the turn wasn't already auto-speaking via `readAloud`), construct a one-shot `new Audio('/sounds/kai-notify.mp3')` and `.play()` it. Wrap in try/catch + the existing `unlockAudio()` pattern from `useVoice.ts` to dodge the autoplay-block in browsers without prior gesture. Use a module-level singleton so we don't churn `Audio` objects per turn.
- Cap the volume at `0.4` so it's a cue, not an alarm.

**(D) Show contact information** → `Customer360Card` profile section

The Customer360Card fixture data (`uc1-customer-intel.json:61–82`) already carries `email`, `phone`, `contactPerson`. The card just doesn't render them today.

In [Customer360Card.tsx:314–351](src/components/widgets/ui/Customer360Card.tsx#L314) (the profile block), append a `Contact` field group below the existing rows that renders `contactPerson · email · phone` when `showContactInfo === true`. Read the pref via the existing `useUserPreferences()` hook (already imported on line 246). Gate the entire group, not individual fields — when the toggle is OFF, the section disappears.

**LLM scope:** per the chosen approach, do NOT add a system-prompt guard. This stays UI-only.

**(E) Require confirmation for all actions** → `ConsentTurnRenderer` in [ChatShell.tsx:203](src/components/chat/ChatShell.tsx#L203)

Read `requireConfirmation` via `useUserPreferences()` inside `ConsentTurnRenderer`. Add a single `useEffect` that fires once when `requireConfirmation === false` AND the consent flow is in `staged` state AND `widgetsDone === true` (so the form has finished streaming):
```ts
useEffect(() => {
  if (!requireConfirmation && consent.consentState === 'staged' && widgetsDone) {
    consent.onConfirm();
  }
}, [requireConfirmation, consent.consentState, widgetsDone]);
```
The banner widget never gets a chance to be interacted with — `consent.onConfirm()` triggers the existing 300ms transition → `confirmedWidgets` populated → AW-003 success card appears. All downstream side-effects (`onConfirmed → addOrder/addTask/handleWorkflowActivated`) fire identically.

Also wrap the AW-012 widget render in the same condition so it doesn't briefly flash. The simplest path: in the `patchedWidgets.map`, when `requireConfirmation === false`, drop the AW-012 entry.

**(F) Auto-save artifacts** → `handleWidgetsReady` in [ChatShell.tsx:2662](src/components/chat/ChatShell.tsx#L2662)

Per the chosen approach (CH-001 + UW-030 only):
```ts
if (autoSaveArtifacts) {
  for (const w of widgets) {
    if (w.widgetType === 'CH-001' || w.widgetType === 'UW-030') {
      addArtifact({
        id: `auto-${Date.now()}-${w.key}`,
        type: w.widgetType === 'UW-030' ? 'chart' : 'chart',  // map to type
        category: w.widgetType === 'UW-030' ? 'Dashboards and Reports' : 'other',
        title: (w.data?.title as string) || w.widgetType,
        description: 'Auto-saved by Kai',
        savedAt: Date.now(),
        sourceWidget: { widgetType: w.widgetType, data: w.data, config: w.config },
        ...(w.widgetType === 'UW-030' ? { dashboardData: w.data } : {}),
      });
    }
  }
}
```
Read `autoSaveArtifacts` + `addArtifact` (already imported on line 33). Idempotency: hash by `w.key` so re-renders of the same turn don't double-save — track a `Set<string>` of auto-saved keys in a `useRef`.

Skip UW-030 cells embedded INSIDE another UW-030 — already a non-issue because the iteration is over top-level `widgets`, and cells inside UW-030 aren't in that array.

### Step 3 — Hide stale type definitions

[src/lib/types.ts:1059–1068](src/lib/types.ts) contains an old `UserPreferences` interface with mismatched field names (`autoSendVoice`, `includeFinancialData`, `showContactInfo`, etc.) that's not actually used by anything. Either delete the unused interface or align its field names with the canonical context. Quick `grep` to confirm no consumer reads it; if clean, delete.

## Critical files to modify

| File | Change |
|---|---|
| [src/contexts/UserPreferencesContext.tsx](src/contexts/UserPreferencesContext.tsx) | Add 6 fields + setters + persistence |
| [src/components/views/UserPreferencesView.tsx](src/components/views/UserPreferencesView.tsx) | Remove parallel store; consume all toggles via context |
| [src/components/chat/ChatShell.tsx](src/components/chat/ChatShell.tsx) | Read 5 new prefs; gate confidence; play notification; auto-confirm consent; auto-save widgets; pass autoSend to VoiceButton |
| [src/components/chat/VoiceButton.tsx](src/components/chat/VoiceButton.tsx) | Accept `autoSend` prop; populate input on false instead of submitting |
| [src/components/widgets/ui/Customer360Card.tsx](src/components/widgets/ui/Customer360Card.tsx) | Render contact group gated on `showContactInfo` |
| [src/components/widgets/ui/AgentReasoningCard.tsx](src/components/widgets/ui/AgentReasoningCard.tsx) | Gate inline confidence bar on `showConfidence` |
| [src/lib/types.ts](src/lib/types.ts) | Delete unused legacy `UserPreferences` interface |
| `public/sounds/kai-notify.mp3` | New asset (~5KB) |

## Existing utilities to reuse

- [`useUserPreferences()`](src/contexts/UserPreferencesContext.tsx#L97) — context hook, already exported. All consumers should subscribe here.
- [`unlockAudio()`](src/hooks/useVoice.ts) — gesture-safe audio prep, reuse for notification sound first-play.
- [`useConsentFlow`](src/hooks/useConsentFlow.ts) — its existing `onConfirm()` does everything we need for auto-confirm; we just call it programmatically.
- [`useArtifacts().addArtifact`](src/contexts/ArtifactContext.tsx) — already imported in ChatShell for the workflow-activate path.
- [`SAVEABLE_WIDGET_TYPES`](src/components/engine/CompositionEngine.tsx#L9) — reference set; we intentionally pick a subset (CH-001, UW-030).
- [`onTranscriptChange`](src/components/chat/VoiceButton.tsx#L20) — already mirrors interim transcript to input; we reuse it for non-auto-send.

## Verification

After implementation, run end-to-end:

1. `npx tsc --noEmit` from repo root → 0 errors.
2. `npm run dev` → open `http://localhost:3000`.
3. **Toggle each pref + verify behavior:**
   - **Show confidence scores OFF** → ask `What is WizOrder?` → docs-qa response renders with the source pill but no `94% match` bar.
   - **Auto-send OFF** → click mic, speak "How is Acme doing", wait 2s → transcript lands in the input but does NOT auto-send. Click Send manually → sends.
   - **Notification sounds ON, Read aloud OFF** → send any query in AI mode → soft chime plays once when stream completes. Subsequent queries also play. Toggling OFF silences subsequent ones.
   - **Show contact information OFF** → ask `How's Acme Corp doing?` → Customer360Card renders without the contact (email/phone) section. Toggle ON → reload turn or new query → contact section visible with `rachel@acmecorp.com / +1 (555) 234-5678`.
   - **Require confirmation OFF** → confirm via the red-warning banner → ask `Create a task for Heman to call Acme Friday` → no AW-012 banner appears; instead the AW-003 success card renders directly (`Task '...' created`). The task IS still written to SharedCRM (navigate to CRM → Tasks → verify ✦ Kai badge).
   - **Auto-save artifacts ON** → send `Build me a sales performance dashboard` → without clicking Save, navigate to My Artifacts → the dashboard appears under "Dashboards and Reports" automatically. Same for `How's Acme doing?` (chart) → check "Charts and Reports".
4. **Reload** the app → every toggle's state persists (localStorage `kai_user_prefs_v1`).
5. **Regression spot-checks:**
   - Toggle Show widgets alongside text OFF → text-only mode still works.
   - Toggle Read responses aloud ON → ElevenLabs voice still plays.
   - Custom Instructions textarea still saves + still injects into the system prompt (send `What can Kai do?` and confirm the LLM honors a "respond in 1 sentence" instruction).
6. **Idempotency check for auto-save:** with autoSaveArtifacts ON, re-render the same chat turn (e.g. trigger React strict-mode double-mount in dev) — verify only one artifact is created per `w.key`.
