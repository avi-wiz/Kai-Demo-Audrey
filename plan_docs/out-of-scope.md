**Out of scope (Phase 4 follow-ups):**

* Add `cap1-task-email` and `cap1-email-draft` keys to `action-chips-map.json` capabilityChips.
* Wire ChatShell switch-case for `useCase: 'cap1-task-email'` to load `cap1-task-email-voice.json` → on confirm load `cap1-task-confirmed.json` → on "Draft the email now" chip load `cap1-email-draft.json`.
* Add queryMatcher route for `draft the email now` → `useCase: 'cap1-email-draft'`.
