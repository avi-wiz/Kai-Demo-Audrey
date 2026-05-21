# Kai 2.0 POC v2.1 — Battle-Test QA Plan

**Purpose:** End-to-end test sweep before declaring v2.1 done. Run top-to-bottom; any phrase that doesn't behave as documented is a bug to file.

**How to use:** Each section maps to source files. Tables list copy-paste triggers, the mode to test in, the expected result, and the source ref. "Verify:" bullets cover behavioural assertions that don't fit a table (animations, persistence, focus). Test in **Demo mode** (default URL) first, then re-test critical paths in **AI mode** (`?ai=true`).

---

## 0. Pre-flight

| Check                                                                                     | Expected                                                                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit` from repo root                                                       | 0 errors                                                                                                                              |
| `.env.local` has `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | All 3 set                                                                                                                             |
| Dev server:`pnpm dev` (or `npm run dev`)                                              | Boots on `http://localhost:3000`                                                                                                    |
| Production:`https://kaidemov0.vercel.app`                                               | Loads the same UI                                                                                                                     |
| Browsers                                                                                  | Test in**Chromium** + **Safari** (autoplay policy differs)                                                                |
| Demo vs AI mode toggle                                                                    | Header switch + ⌘+Shift+D shortcut both work; URL `?ai=true` reflects state                                                        |
| Onboarding cleared for fresh tests                                                        | DevTools → Application → Local Storage → remove `kai_onboarding_v1`, `kai-persona-id`, `kai_user_prefs_v1`, `kai_prefs_v1` |

---

## 1. Core query → use-case routing

**Source:** [`src/lib/queryMatcher.ts`](src/lib/queryMatcher.ts) `matchQuery`, `getUnknownReply`; [`src/components/chat/ChatShell.tsx`](src/components/chat/ChatShell.tsx) email pre-router (lines ~1223–1233).

The general matcher runs **after** dashboard, page-context, and email routers. Triggers are case-insensitive `String.includes` checks.

| #    | Trigger (paste exactly)                                      | Expected useCase                            | Expected widgets                                                                          |
| ---- | ------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1.1  | `How's Acme Corp doing?`                                   | uc1                                         | UW-014 reasoning, UW-007 Customer360Card, UW-011 CompactList of open tasks                |
| 1.2  | `Tell me about Acme`                                       | uc1                                         | Same as 1.1                                                                               |
| 1.3  | `hows acme doing` (no apostrophe)                          | uc1                                         | Same as 1.1                                                                               |
| 1.4  | `Show me Acme Corp Q2 revenue and create a follow-up task` | uc3                                         | UC-3 multi-intent (revenue chart + task form)                                             |
| 1.5  | `Acme Corp revenue plus a follow-up task`                  | uc3                                         | Same as 1.4                                                                               |
| 1.6  | `Create a task for Heman to call Acme Friday`              | uc2                                         | UW-014 reasoning + AW-004 multi-step form + AW-012 consent banner                         |
| 1.7  | `Create a follow-up task for Acme`                         | uc2                                         | Same as 1.6                                                                               |
| 1.8  | `Draft a follow-up email to Acme`                          | email-draft (intercepted before matchQuery) | Email widgets + T2 narrative                                                              |
| 1.9  | `Make the email shorter`                                   | email-shorter                               | T6 rewrite with shorter body                                                              |
| 1.10 | `Shorten this draft to 3 sentences`                        | email-shorter                               | Same as 1.9                                                                               |
| 1.11 | `Concise email to Acme`                                    | email-shorter                               | Same as 1.9                                                                               |
| 1.12 | `What is NetSuite integration like?`                       | unknown —**NetSuite reply**          | Inline text: "NetSuite integration is on our roadmap…" — NO suggested chips             |
| 1.13 | `Connect to ERP`                                           | unknown — NetSuite reply                   | Same as 1.12                                                                              |
| 1.14 | `What's for lunch?`                                        | unknown — generic reply                    | "I don't have that capability yet — but here's what I can help with:" + SuggestedQueries |

**Verify:**

- Email queries are excluded from `uc3` even when they contain `acme + revenue/follow/task` (see `isEmailQuery` guard in `matchQuery`).
- Demo-mode thinking delays: uc1/uc2/uc3 = 2000ms, unknown = 800ms, email/dashboard/page-context = 800ms, dashboard-builder = 1200ms.
- AI mode (`?ai=true`): "Classifying your intent…" appears in the thinking indicator; classification timeout = 15s; 1 retry on non-timeout error after 500ms; on retry failure, silent fallback to keyword matcher.
- Empty input → input shakes (`.kai-shake` class) + retains focus, no send.
- Sending while busy → toast: "Kai is still thinking…".

---

## 2. Page-context queries (15 total)

**Source:** `matchPageContextQuery` + `src/fixtures/page-context-{orders,customers,products,crm,dashboard}.json`. Only fires when on the matching WizOrder page AND the query contains a keyword.

### 2.A Orders page (`wizorder/orders`)

| #     | Trigger                                 | Frame ID     | Expected                                                   |
| ----- | --------------------------------------- | ------------ | ---------------------------------------------------------- |
| 2.A.1 | `Which orders are awaiting shipment?` | f-pc-ord-001 | Table of orders awaiting shipment with days-pending column |
| 2.A.2 | `Show me overdue deliveries`          | f-pc-ord-001 | Same as 2.A.1                                              |
| 2.A.3 | `pending shipment`                    | f-pc-ord-001 | Same as 2.A.1                                              |
| 2.A.4 | `Show me flagged order ORD-2839`      | f-pc-ord-002 | EntityDetailCard for ORD-2839 exceeding approval threshold |
| 2.A.5 | `Anything for review?`                | f-pc-ord-002 | Same as 2.A.4                                              |
| 2.A.6 | `Approval threshold`                  | f-pc-ord-002 | Same as 2.A.4                                              |
| 2.A.7 | `Show me today's orders`              | f-pc-ord-003 | Today's orders summary table                               |
| 2.A.8 | `new orders`                          | f-pc-ord-003 | Same as 2.A.7                                              |

### 2.B Customers page (`wizorder/customers`)

| #     | Trigger                                 | Frame ID      | Expected                          |
| ----- | --------------------------------------- | ------------- | --------------------------------- |
| 2.B.1 | `Show me dormant VIP customers`       | f-pc-cust-001 | Dormant VIP accounts table        |
| 2.B.2 | `inactive accounts`                   | f-pc-cust-001 | Same as 2.B.1                     |
| 2.B.3 | `Who are my top 5 buyers this month?` | f-pc-cust-002 | Top 5 customers ranked by revenue |
| 2.B.4 | `best customers`                      | f-pc-cust-002 | Same as 2.B.3                     |
| 2.B.5 | `most revenue`                        | f-pc-cust-002 | Same as 2.B.3                     |
| 2.B.6 | `Show me leads needing follow-up`     | f-pc-cust-003 | Leads requiring follow-up         |
| 2.B.7 | `new leads`                           | f-pc-cust-003 | Same as 2.B.6                     |

### 2.C Products page (`wizorder/products`)

| #     | Trigger                                          | Frame ID      | Expected                             |
| ----- | ------------------------------------------------ | ------------- | ------------------------------------ |
| 2.C.1 | `Which products are running low on stock?`     | f-pc-prod-001 | Low-stock products with highlights   |
| 2.C.2 | `reorder`                                      | f-pc-prod-001 | Same as 2.C.1                        |
| 2.C.3 | `stock alert`                                  | f-pc-prod-001 | Same as 2.C.1                        |
| 2.C.4 | `out of stock with pending orders`             | f-pc-prod-002 | OOS products + pending orders detail |
| 2.C.5 | `backorder`                                    | f-pc-prod-002 | Same as 2.C.4                        |
| 2.C.6 | `What are the top selling products this week?` | f-pc-prod-003 | Top 5 products by units sold         |
| 2.C.7 | `most sold`                                    | f-pc-prod-003 | Same as 2.C.6                        |

### 2.D CRM page (`wizorder/crm`)

| #     | Trigger                                            | Frame ID     | Expected                                  |
| ----- | -------------------------------------------------- | ------------ | ----------------------------------------- |
| 2.D.1 | `Show me my overdue tasks`                       | f-pc-crm-001 | Overdue tasks list with reassignment chip |
| 2.D.2 | `past due tasks`                                 | f-pc-crm-001 | Same as 2.D.1                             |
| 2.D.3 | `Which leads haven't been contacted in 7+ days?` | f-pc-crm-002 | Stale leads list                          |
| 2.D.4 | `cold leads`                                     | f-pc-crm-002 | Same as 2.D.3                             |
| 2.D.5 | `Show me deals closing this week`                | f-pc-crm-003 | Deals closing this week                   |
| 2.D.6 | `pipeline`                                       | f-pc-crm-003 | Same as 2.D.5                             |

### 2.E Dashboard page (`wizorder/dashboard`)

| #     | Trigger                                     | Frame ID      | Expected                                   |
| ----- | ------------------------------------------- | ------------- | ------------------------------------------ |
| 2.E.1 | `How are sales looking this week?`        | f-pc-dash-001 | Weekly metric cards (revenue, orders, AOV) |
| 2.E.2 | `weekly sales`                            | f-pc-dash-001 | Same as 2.E.1                              |
| 2.E.3 | `Compare this month to last month`        | f-pc-dash-002 | MoM comparison table                       |
| 2.E.4 | `month over month`                        | f-pc-dash-002 | Same as 2.E.3                              |
| 2.E.5 | `Show me performance by rep this quarter` | f-pc-dash-003 | Performance-by-rep table with totals       |
| 2.E.6 | `team performance`                        | f-pc-dash-003 | Same as 2.E.5                              |

**Verify:** From any other view (e.g. Kai chat, Customers page) issuing an Orders-only trigger like "pending shipment" should NOT fire the page-context match — fall through to `matchQuery` → `unknown`.

---

## 3. Dashboard builder triggers

**Source:** `matchDashboardQuery` (runs before page-context). Match on lower-cased `String.includes`.

| #    | Trigger                                          | Dashboard fixture                | Capability key    |
| ---- | ------------------------------------------------ | -------------------------------- | ----------------- |
| 3.1  | `Build me a sales performance dashboard`       | dashboard-sales-performance.json | sales-performance |
| 3.2  | `create a sales dashboard`                     | sales-performance                | sales-performance |
| 3.3  | `revenue dashboard`                            | sales-performance                | sales-performance |
| 3.4  | `rep performance` (when NOT on dashboard page) | sales-performance                | sales-performance |
| 3.5  | `Show me a customer health dashboard`          | dashboard-customer-health.json   | customer-health   |
| 3.6  | `dormant customer dashboard`                   | customer-health                  | customer-health   |
| 3.7  | `retention dashboard`                          | customer-health                  | customer-health   |
| 3.8  | `Build me an order analytics dashboard`        | dashboard-order-analytics.json   | order-analytics   |
| 3.9  | `fulfillment dashboard`                        | order-analytics                  | order-analytics   |
| 3.10 | `Show me a pipeline dashboard`                 | dashboard-pipeline.json          | pipeline          |
| 3.11 | `open quotes`                                  | pipeline                         | pipeline          |
| 3.12 | `quote pipeline`                               | pipeline                         | pipeline          |

**Verify:**

- Renders UW-030 DashboardCompositeWidget + AW-012 ConsentBanner with three actions: **Save**, **Edit**, **Cancel**.
- Click **Save** → SaveArtifactModal opens → save → toast "Dashboard saved to My Artifacts" → artifact appears in My Artifacts under category "Dashboards and Reports".
- Click **Edit** → marks the chat turn stale + opens DashboardFullView with Kai sidebar; can edit cells.
- Click **Cancel** → dims the response (opacity 0.4) without saving.
- The action chips below the dashboard come from `dashboard-edit` capability group (see §7).

---

## 4. Docs Q&A pairs (10 total)

**Source:** [`src/fixtures/docs-qa-pairs.json`](src/fixtures/docs-qa-pairs.json) + [`src/hooks/useDocsQA.ts`](src/hooks/useDocsQA.ts). Triggered when `matchQuery` returns `unknown` and at least one keyword in a Q&A pair matches. Best match wins by keyword count.

| #    | Trigger (or any keyword variant)                | ID     | Expected source label            | Expected confidence |
| ---- | ----------------------------------------------- | ------ | -------------------------------- | ------------------- |
| 4.1  | `What is WizOrder?`                           | qa-001 | Platform Overview                | ≥ 80% (green bar)  |
| 4.2  | `What are AI Co-Workers?`                     | qa-002 | Explore AI Co-Workers            | ≥ 80%              |
| 4.3  | `How does customer-specific pricing work?`    | qa-003 | Key Buying & Pricing Concepts    | ≥ 80%              |
| 4.4  | `Can buyers have multiple carts?`             | qa-004 | Create & Manage Carts on WizShop | ≥ 80%              |
| 4.5  | `How does the AI Order Entry Assistant work?` | qa-005 | Explore AI Co-Workers            | ≥ 80%              |
| 4.6  | `What can Kai do for sales reps?`             | qa-006 | Key Terms for AI Co-Workers      | ≥ 80%              |
| 4.7  | `How do I search for products using a photo?` | qa-007 | Universal Smart Search           | ≥ 80%              |
| 4.8  | `What does the Sales Report show?`            | qa-008 | Sales Report                     | ≥ 80%              |
| 4.9  | `How do I filter products in WizOrder?`       | qa-009 | Filtering Products               | ≥ 80%              |
| 4.10 | `What is WizStudio?`                          | qa-010 | Lifestyle Generator              | ≥ 80%              |

**Verify:**

- Renders UW-014 reasoning card with steps: search KB → match → generate.
- Confidence bar fills to the % value, color-coded (≥80% green `#16a34a`, else amber `#d97706`).
- Source pill appears below the answer.
- In AI mode the answer text streams (T8 reformulation), in Demo mode it's the static fixture answer.

---

## 5. Email-draft and Email-shorter routing

**Source:** ChatShell `handleSend` (lines ~1223–1233). Runs **before** general matcher; intercepts any message containing `email` OR `draft`. If it also contains `shorter`/`shorten`/`concise` → `email-shorter`, else `email-draft`.

| #   | Trigger                              | useCase                          |
| --- | ------------------------------------ | -------------------------------- |
| 5.1 | `Draft a follow-up email to Acme`  | email-draft                      |
| 5.2 | `Email Acme about quote QT-1192`   | email-draft                      |
| 5.3 | `Create an email for the customer` | email-draft                      |
| 5.4 | `Make this email more casual`      | email-draft (no shorten keyword) |
| 5.5 | `Make the email shorter`           | email-shorter                    |
| 5.6 | `Shorten this draft`               | email-shorter                    |
| 5.7 | `Concise email please`             | email-shorter                    |

**Verify:** Action chips below email turns come from the `email` capability group (§7.A) — `Make it shorter`, `Make it more casual`, `Copy to clipboard`.

---

## 6. Follow-up detection

**Source:** [`src/hooks/useFollowUp.ts`](src/hooks/useFollowUp.ts) — only triggers when the previous turn was `uc1` (widget-swap) or `uc2` (form-restage).

### 6.A Widget-swap (after a `uc1` turn)

| #     | Prior turn                  | Trigger                   | Expected                                                                    |
| ----- | --------------------------- | ------------------------- | --------------------------------------------------------------------------- |
| 6.A.1 | uc1 (`How's Acme doing?`) | `Show as table instead` | Previous turn dims/staled, new turn re-renders the same data as a DataTable |
| 6.A.2 | uc1                         | `Don't show chart`      | Same as 6.A.1                                                               |
| 6.A.3 | uc1                         | `Show me a table`       | Same as 6.A.1                                                               |
| 6.A.4 | uc1                         | `Switch to table`       | Same as 6.A.1                                                               |

### 6.B Form-restage (after a `uc2` turn)

| #     | Prior turn                                            | Trigger                                           | Expected                                                                                                                                          |
| ----- | ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.B.1 | uc2 (`Create a task for Heman to call Acme Friday`) | `Change the title to Catalogue for Canton Fair` | "Applying your changes…" → form re-renders with new title; this exact phrase is**hardcoded in /api/kai/restage** so works without API key |
| 6.B.2 | uc2                                                   | `Update priority to high`                       | API parses → form re-stages with patched priority                                                                                                |
| 6.B.3 | uc2                                                   | `Set assignee to Avi`                           | Form re-stages with assignee patched                                                                                                              |
| 6.B.4 | uc2                                                   | `Modify due date to Friday`                     | Form re-stages with date patched                                                                                                                  |

**Verify:**

- Re-staged turn shows AgentReasoningCard summary listing the changes (`"Applied N change(s): …"`).
- AW-003 ConfirmationDialog offers "Confirm & Create / Edit / Cancel" again on the new staged form.
- T7 ModificationDescription text streams in AI mode summarising the diff.

---

## 7. Action chips (capability + page)

**Source:** [`src/fixtures/action-chips-map.json`](src/fixtures/action-chips-map.json). Each chip has `label`, `query` (with `{templateVars}`), `icon`, `category`. Template vars resolved from last turn's widget data via `extractTemplateVars` + `resolveChipQuery`.

### 7.A Capability chips (rendered below specific turn types)

**`email` (after email-draft / email-shorter turns):**

| #     | Label               | Query                                     |
| ----- | ------------------- | ----------------------------------------- |
| 7.A.1 | Make it shorter     | "Shorten this email to 3 sentences"       |
| 7.A.2 | Make it more casual | "Rewrite the email in a more casual tone" |
| 7.A.3 | Copy to clipboard   | "Copy this email draft"                   |

**`sr-13` (after uc1):**

| #     | Label                 | Query                                             |
| ----- | --------------------- | ------------------------------------------------- |
| 7.A.4 | Create follow-up task | "Create a follow-up task for {customerName}"      |
| 7.A.5 | Draft an email        | "Draft a follow-up email to {customerName}"       |
| 7.A.6 | Show order history    | "Show me {customerName}'s recent orders"          |
| 7.A.7 | Prep for meeting      | "Prep me for my next meeting with {customerName}" |

**`sr-1` (after uc2 order):**

| #      | Label                | Query                                  |
| ------ | -------------------- | -------------------------------------- |
| 7.A.8  | Add more items       | "Add more items to this order"         |
| 7.A.9  | Apply discount       | "Apply a 10% discount to this order"   |
| 7.A.10 | Create another order | "Create an order for another customer" |

**`sr-2` (after `sr2-reorder` turn) — trigger: "Reorder for Acme Corp" / "Restock Acme":**

| #      | Label                 | Query                                            | Resolves to            |
| ------ | --------------------- | ------------------------------------------------ | ---------------------- |
| 7.A.17 | Modify quantities     | "Change the quantities on this reorder"          | form-restage (AI path) |
| 7.A.18 | Compare with original | "Show me a side-by-side with the original order" | sr2-compare            |

**`sr-11` (after `sr11-invoice` turn) — trigger: "Show me overdue invoice for Acme" / "Payment due":**

| #      | Label                | Query                                             | Resolves to |
| ------ | -------------------- | ------------------------------------------------- | ----------- |
| 7.A.19 | Create task for this | "Create a follow-up task about this invoice"      | uc2 task    |
| 7.A.20 | Email the customer   | "Draft a payment reminder email for this invoice" | email-draft |

**`sr-14` (after `sr14-brief` turn) — trigger: "Meeting brief" / "Action items from meeting":**

| #      | Label                   | Query                                                    | Resolves to |
| ------ | ----------------------- | -------------------------------------------------------- | ----------- |
| 7.A.21 | Draft pre-meeting email | "Draft an email to {contactName} confirming our meeting" | email-draft |
| 7.A.22 | Create meeting tasks    | "Create tasks for the action items from this brief"      | uc2 task    |

**`sr-20` (after `sr20-outreach` turn) — trigger: "Outreach email" / "Campaign message":**

| #      | Label                | Query                                            | Resolves to   |
| ------ | -------------------- | ------------------------------------------------ | ------------- |
| 7.A.23 | Make it more casual  | "Rewrite the email in a more casual tone"        | email-shorter |
| 7.A.24 | Make it shorter      | "Shorten this email to 3 sentences"              | email-shorter |
| 7.A.25 | Add a discount offer | "Add a mention of our 10% early-access discount" | email-shorter |

**`ad-1` (after `ad1-approval` turn) — trigger: "Approval queue" / "Pending approvals":**

| #      | Label                   | Query                                               | Resolves to  |
| ------ | ----------------------- | --------------------------------------------------- | ------------ |
| 7.A.26 | Approve all standard    | "Approve all items that are within standard policy" | ad1-approved |
| 7.A.27 | Show details on flagged | "Give me more details on the flagged items"         | ad1-flagged  |

**`ad-3` (after `ad3-handoff` turn) — trigger: "Rep handoff" / "Reassign rep":**

| #      | Label                     | Query                                                                      | Resolves to |
| ------ | ------------------------- | -------------------------------------------------------------------------- | ----------- |
| 7.A.28 | Draft handoff email       | "Draft a handoff email from {fromRep} to {toRep} with key account details" | email-draft |
| 7.A.29 | Notify affected customers | "Draft a notification to affected customers about their new rep"           | email-draft |

**`ad-17` (after `ad17-report` turn) — trigger: "Q1 sales report" / "Quarterly report" / "Build me a report":**

| #      | Label             | Query                                                              | Resolves to            |
| ------ | ----------------- | ------------------------------------------------------------------ | ---------------------- |
| 7.A.30 | Save as dashboard | "Save this as a dashboard"                                         | dashboard-builder      |
| 7.A.31 | Add more metrics  | "Add average order value and quote conversion rate to this report" | form-restage (AI path) |
| 7.A.32 | Email this report | "Draft an email with this report summary to the leadership team"   | email-draft            |

**`ad-29` (after `ad29-workflow` turn) — trigger: "Set up a workflow" / "Dormant customer workflow":**

| #      | Label                   | Query                                                                          | Resolves to              |
| ------ | ----------------------- | ------------------------------------------------------------------------------ | ------------------------ |
| 7.A.33 | Test with sample data   | "Show me which records would have triggered this workflow in the last 30 days" | ad29-test                |
| 7.A.34 | Create another workflow | "Set up a workflow for dormant customer re-engagement"                         | ad29-workflow (re-stage) |

**Note (form-restage AI path):** sr-2 "Modify quantities" and ad-17 "Add more metrics" route through the AI restage endpoint. In Demo mode without `ANTHROPIC_API_KEY`, expect a "no changes detected" toast — this is documented behavior.

**`dashboard-edit` (after a dashboard turn):**

| #      | Label                 | Query                                               |
| ------ | --------------------- | --------------------------------------------------- |
| 7.A.11 | Change date range     | "Change the dashboard to show last 90 days"         |
| 7.A.12 | Add a metric card     | "Add average order value as a metric card"          |
| 7.A.13 | Replace chart type    | "Replace the line chart with a bar chart"           |
| 7.A.14 | Remove a widget       | "Remove the bottom-right widget from the dashboard" |
| 7.A.15 | Change layout         | "Change the dashboard layout to a 2x2 grid"         |
| 7.A.16 | Export this dashboard | "Export this dashboard as a report"                 |

### 7.B Page chips (always visible on the matching WizOrder page when chat is open)

**Orders:** `Today's orders` / `Pending shipments` / `Create new order` / `Overdue deliveries`
**Customers:** `VIP customers` / `Dormant accounts` / `New leads` / `Top buyers this month`
**Products:** `Low stock alerts` / `Top sellers` / `Out of stock` / `Find a product`
**CRM:** `My overdue tasks` / `This week's tasks` / `Stale leads` / `Create a task`
**Dashboard:** `Sales this week` / `Build a dashboard` / `Compare to last month` / `Rep performance`

### 7.C Chip-chain depth cap

**Source:** ChatShell `chipChainDepthRef`, `MAX_CHIP_CHAIN_DEPTH = 3`.

**Verify:**

1. Send a manual query → chain resets to 0.
2. Click chip #1 → depth = 1, chips render again.
3. Click chip #2 → depth = 2, chips render.
4. Click chip #3 → depth = 3.
5. Click chip #4 → instead of new chips, render text: **"What would you like to do next?"**.
6. Send any manual query → depth resets to 0; chips return.

---

## 8. Command palette (⌘K / Ctrl+K)

**Source:** [`src/components/chat/CommandPalette.tsx`](src/components/chat/CommandPalette.tsx) + [`src/fixtures/command-palette-items.json`](src/fixtures/command-palette-items.json). 20 items.

| #    | Item id | Category   | Label             | Action                            |
| ---- | ------- | ---------- | ----------------- | --------------------------------- |
| 8.1  | cmd-01  | SALES      | Customer lookup   | Sets pendingQuery → goes to chat |
| 8.2  | cmd-02  | SALES      | Create order      | Sets pendingQuery                 |
| 8.3  | cmd-03  | SALES      | Repeat last order | Sets pendingQuery                 |
| 8.4  | cmd-04  | SALES      | Meeting prep      | Sets pendingQuery                 |
| 8.5  | cmd-05  | SALES      | Draft email       | Sets pendingQuery                 |
| 8.6  | cmd-06  | SALES      | Search products   | Sets pendingQuery                 |
| 8.7  | cmd-07  | SALES      | Check invoice     | Sets pendingQuery                 |
| 8.8  | cmd-08  | SALES      | Create task       | Sets pendingQuery                 |
| 8.9  | cmd-09  | ADMIN      | Approval queue    | Sets pendingQuery                 |
| 8.10 | cmd-10  | ADMIN      | Reassign accounts | Sets pendingQuery                 |
| 8.11 | cmd-11  | ADMIN      | Build dashboard   | Sets pendingQuery                 |
| 8.12 | cmd-12  | ADMIN      | Set up workflow   | Sets pendingQuery                 |
| 8.13 | cmd-13  | NAVIGATION | Go to Orders      | Routes to `wizorder/orders`     |
| 8.14 | cmd-14  | NAVIGATION | Go to Customers   | Routes to `wizorder/customers`  |
| 8.15 | cmd-15  | NAVIGATION | Go to Products    | Routes to `wizorder/products`   |
| 8.16 | cmd-16  | NAVIGATION | Go to CRM         | Routes to `wizorder/crm`        |
| 8.17 | cmd-17  | NAVIGATION | Go to Dashboard   | Routes to `wizorder/dashboard`  |
| 8.18 | cmd-18  | SETTINGS   | Open Settings     | Routes to settings                |
| 8.19 | cmd-19  | SETTINGS   | Open Preferences  | Routes to `admin/prefs`         |
| 8.20 | cmd-20  | NAVIGATION | My Artifacts      | Routes to artifacts               |

**Verify:**

- ⌘K (Mac) and Ctrl+K (Win) both open the palette anywhere in the app.
- Categories render in fixed order: SALES → ADMIN → NAVIGATION → SETTINGS.
- Fuzzy match: every search character must appear in the title in order.
- ↑/↓ navigation; **Enter** selects; **Esc** closes.
- For `query` items (cmd-01 to cmd-12): pressing Enter clears chat, navigates to chat, sets pending query (auto-sent), focuses input.
- For `route` items: navigates to the view immediately.
- Header pill button (⌘K hint) carries `data-tour="cmd-k-hint"` for tour Step 6.

---

## 9. Proactive briefs

**Source:** [`src/components/chat/ProactiveBriefCard.tsx`](src/components/chat/ProactiveBriefCard.tsx) + `src/fixtures/proactive-brief-{general,orders,customers,products,crm}.json`. Renders only when `kaiTurns.length === 0 && !isBusy && proactiveAssistance === true` and on the matching WizOrder page.

### 9.A General (Kai chat default, `proactive-brief-general.json`)

Greeting: **"Good morning, Heman. Here's what needs your attention today."**

| Item                                                                   | Action chip query                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| Quote QT-1192 for Acme Corp expires tomorrow ($8,200) — urgent        | `Draft a follow-up email to Acme about quote QT-1192` |
| 2 approval items pending for over 48 hours — urgent                   | `Show me everything waiting for my approval`          |
| Claim CLM-0892 (Acme Corp) — open 24 days, no resolution — attention | `What's the status of claim CLM-0892?`                |
| 3 meetings scheduled — first at 11 AM with Pinnacle Retail — info    | `Prep me for my 11am with Pinnacle Retail`            |
| Yesterday: 7 orders placed ($42,800 total), 2 quotes sent — info      | (no chip)                                               |
| Pipeline is $128K this week — 15% ahead of target — info             | (no chip)                                               |

### 9.B Orders (`proactive-brief-orders.json`)

| Item                                                             | Chip                                 |
| ---------------------------------------------------------------- | ------------------------------------ |
| 3 orders awaiting shipment — oldest 2 days pending — attention | `Show me orders awaiting shipment` |
| ORD-2839 flagged for review — urgent                            | `Show me flagged order ORD-2839`   |
| 18 orders this week, avg $5,420 (up 12%) — info                 | (no chip)                            |
| 14 of 18 shipped on time (77.8%) — info                         | (no chip)                            |

### 9.C Customers (`proactive-brief-customers.json`)

| Item                                                                               | Chip                                            |
| ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| 2 VIP accounts haven't ordered in 60+ days (Coastal Living, Summit Home) — urgent | `Show me dormant VIP customers`               |
| Bay Area Boutiques hit $100K LTR — VIP upgrade — attention                       | `Show me Bay Area Boutiques customer profile` |
| 156 active customers, 14 leads — info                                             | (no chip)                                       |
| Customer retention: 94.2% this quarter — info                                     | (no chip)                                       |

### 9.D Products (`proactive-brief-products.json`)

| Item                                                        | Chip                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| 4 SKUs OOS incl. WC-LMP-018 with 3 pending orders — urgent | `Which products are out of stock with pending orders?` |
| 12 SKUs <20 units — reorder review — attention            | `Show me products with low stock that need reordering` |
| 842 active SKUs across 14 collections — info               | (no chip)                                                |
| Top seller: Artisan Table Lamp — Brass (34 units) — info  | (no chip)                                                |

### 9.E CRM (`proactive-brief-crm.json`)

| Item                                          | Chip                            |
| --------------------------------------------- | ------------------------------- |
| 5 tasks overdue (2 high priority) — urgent   | `Show me my overdue tasks`    |
| 3 leads not contacted in 7+ days — attention | `Which leads need follow-up?` |
| 12 open tasks, 8 due this week — info        | (no chip)                       |
| 4 deals in pipeline worth $68,500 — info     | (no chip)                       |

**Verify:**

- Brief disappears as soon as the first turn renders (`kaiTurns.length > 0`).
- "Proactive assistance" toggle in Settings hides the brief on next conversation.
- Each chip click resolves any template vars and enters the regular pipeline.

---

## 10. LLM Touchpoints T1–T10

**Source:** [`src/lib/systemPrompts.ts`](src/lib/systemPrompts.ts), [`src/hooks/useKaiGenerate.ts`](src/hooks/useKaiGenerate.ts), [`src/app/api/kai/generate/route.ts`](src/app/api/kai/generate/route.ts).

System prompt assembly order: **[1] persona → [2] custom instructions → [3] page context → [4] capability prompt → [5] widget data**. Per-touchpoint `max_tokens` from `getMaxTokens(capability)`.

| T#  | Capability key(s)                                              | Trigger query                                                                         | Token budget | Format expectation                                                                          |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| T1  | `t1`, `canvas`, `uc1`, `uc3`, `general`, `handoff` | `How's Acme Corp doing?`                                                            | 300          | 2–4 sentence flowing prose, no bullets, specific names/dates/numbers                       |
| T2  | `t2`, `email-draft`                                        | `Draft a follow-up email to Acme about QT-1192`                                     | 400          | `Subject: …` line + 150–220 words body + sign-off, no `[Company Name]` placeholders   |
| T3  | `t3`, `meeting-brief`                                      | `Prep me for my next meeting with Acme Corp`                                        | 350          | Exactly 4 dash bullets, ~2 sentences each                                                   |
| T4  | `t4`, `approval`, `uc2`                                  | `Show me everything waiting for my approval`                                        | 200          | 2–3 sentences referencing specific item IDs / amounts / dates                              |
| T5  | `t5`, `dashboard`, `report`                              | `Build me a sales performance dashboard`                                            | 250          | 3–5 sentence "chief of staff" interpretation; respects custom-instruction chart-type rules |
| T6  | `t6`, `tone-change`, `email-tone`, `follow-up-email`   | `Make the email shorter` (after T2)                                                 | 400          | Rewritten text only — no preamble; same facts, only style                                  |
| T7  | `t7`, `modification`                                       | `Change the title to Catalogue for Canton Fair` (after uc2)                         | 150          | 2–3 sentences describing diff with totals                                                  |
| T8  | `t8`, `docs-qa`                                            | `What is WizOrder?`                                                                 | 250          | 3–5 sentence Kai-voice reformulation of matched KB excerpt                                 |
| T9  | `t9`, `text-only`                                          | Toggle Settings → "Show widgets alongside text" OFF, then `How's Acme Corp doing?` | 600          | Full prose narrative — NO widgets render at all                                            |
| T10 | `t10`, `workflow`                                          | `Set up a workflow for dormant customer re-engagement`                              | 150          | Exactly 2 sentences: impact + edge cases                                                    |

**Verify (Demo mode, no `?ai=true`):**

- For each touchpoint above: widgets render from fixtures, closing text is the static fixture text, NO LLM fetch fires (Network tab shows no call to `/api/kai/generate`).
- T9 still renders text-only when ResponseMode is set to `text-only`, but the text comes from the fixture, not from streaming.

**Verify (AI mode, `?ai=true`):**

- For each touchpoint: widgets still render from fixtures (same surface), AND `/api/kai/generate` is called with the right `capability` field.
- A blinking cursor (`kai-blink`, 900ms step-end) appears at the end of the streaming text.
- LLM text replaces the fixture text once first token arrives — there is **no fixture flash** before the first token (`aiModeActive` flag in CanvasTextBlock).
- Connection-only timeout = 8000ms; cleared on first chunk, so slow streams are not aborted.
- If timeout fires before first token OR network errors: `failed=true` → fixture fallback shows; cursor disappears.
- Custom instructions appear in the system prompt under the "USER CUSTOM INSTRUCTIONS — always follow these exactly…" heading.
- Persona suffix from `PersonaContext.selectedPersonality.id` reaches `/api/kai/generate` body.
- Page context is sent only when on a WizOrder page; first 20 visible data items included.

---

## 11. Voice + auto-speak

**Source:** [`src/hooks/useVoice.ts`](src/hooks/useVoice.ts), [`src/components/chat/VoiceButton.tsx`](src/components/chat/VoiceButton.tsx), [`src/app/api/kai/tts/route.ts`](src/app/api/kai/tts/route.ts), ChatShell `handleStreamComplete`, `handleToggleTTS`, `UserPreferencesContext`.

### 11.A Speech-to-text (STT — voice input)

| #      | Action                                                 | Expected                                                                                                         |
| ------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 11.A.1 | Click mic button                                       | Mic shows pulsing rings;`isListening = true`                                                                   |
| 11.A.2 | Speak: "How is Acme Corp doing"                        | Interim transcript streams into the input field                                                                  |
| 11.A.3 | Stop speaking, wait 2s (silence)                       | `SILENCE_TIMEOUT_MS` fires → mic stops → final transcript submitted via `handleSend(text, fromVoice=true)` |
| 11.A.4 | Speak query, then click mic again before silence       | Stops listening immediately; final transcript still submits                                                      |
| 11.A.5 | Browser without SpeechRecognition (Firefox/Safari old) | Mic button shows unsupported state (`isSupported = false`)                                                     |

**Verify:** `lastInputWasVoiceRef.current` is set, so when streaming ends the response is auto-spoken once via the legacy voice-driven TTS path.

### 11.B Manual TTS (volume / speaker button on each turn)

**Source:** ChatShell `handleToggleTTS` (lines ~1052–1066). Calls `unlockAudio()` (gesture-safe) before `voice.speak(text)`.

| #      | Setup                                                  | Action                                  | Expected                                                                                 |
| ------ | ------------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| 11.B.1 | Toggle "Read responses aloud" OFF                      | Click speaker icon on a Kai response    | ElevenLabs voice plays (this is the bug fix —`unlockAudio` runs in the click handler) |
| 11.B.2 | While speech is playing, click the same speaker button | Speech stops; speaker button reverts    | speech actually stops, no re-trigger                                                     |
| 11.B.3 | Click speaker on turn A, then speaker on turn B        | Speech for A stops, speech for B starts |                                                                                          |
| 11.B.4 | `ELEVENLABS_API_KEY` missing                         | Click speaker                           | Falls back to browser `speechSynthesis` (still speaks, different voice)                |

### 11.C Auto-speak (Settings toggle)

**Source:** `UserPreferencesContext.readAloud`, `UserPreferencesView` toggle, `handleStreamComplete` in ChatShell.

| #      | Setup                                                                           | Action                                                                                             | Expected                                                                                                      |
| ------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 11.C.1 | Open Settings → Preferences                                                    | Toggle "Read responses aloud" ON                                                                   | Toggle shows ON; storage `kai_user_prefs_v1.readAloud === true`; `unlockAudio()` runs (silent WAV primed) |
| 11.C.2 | Toggle ON, then send `How's Acme Corp doing?` in AI mode                      | Wait for stream to end                                                                             | ElevenLabs voice plays the final streamed text — Chromium AND Safari                                         |
| 11.C.3 | Toggle ON, refresh page                                                         | Open Preferences again                                                                             | Toggle still shows ON (persisted from `kai_user_prefs_v1`)                                                  |
| 11.C.4 | Toggle OFF                                                                      | Send a query                                                                                       | NO auto-speak fires                                                                                           |
| 11.C.5 | Toggle OFF, send query, then click speaker button manually                      | ElevenLabs still plays (manual path uses `unlockAudio` from the click)                           |                                                                                                               |
| 11.C.6 | Toggle ON, send a query, click speaker button**while it's auto-speaking** | Auto-speak stops; does NOT restart (`speakingTurnId === null` guard catches the auto-speak case) |                                                                                                               |

**Verify (regressions previously fixed):**

- Module-level `_primedAudio` is a singleton across `useVoice()` instances; `UserPreferencesView` and `ChatShell` share the same primed `Audio` element.
- `stopSpeaking()` does NOT null `.src` on the primed element (would invalidate the unlock).
- The Settings toggle reads `readAloud` directly from `UserPreferencesContext`, not from local view state — i.e. it stays in sync with what `handleStreamComplete` checks.

---

## 12. WizOrder pages

**Source:** [`src/components/wizorder/`](src/components/wizorder/) + [`src/contexts/PageContext.tsx`](src/contexts/PageContext.tsx) + Shared state contexts.

### 12.A Dashboard (`wizorder/dashboard`)

- Metric cards: Total Revenue (MTD), Active Orders, Open Quotes, Active Customers — each with trend (up/down/flat + %).
- LineChart with 11 revenue points; data points + area visible.
- Page chips visible at the bottom of chat; "Ask Kai" button in top-right opens chat.

### 12.B Orders (`wizorder/orders`)

- 6 status filters: **All / Draft / Pending Approval / Confirmed / Shipped / Delivered** — clicking each refilters and resets pagination.
- Status badges color-coded.
- Kai-created orders show **✦ Kai** badge with pulse animation (verify by creating an order in chat — see §16 Shared State).
- Pagination: 10 per page; prev/next buttons disabled at boundaries.

### 12.C Customers (`wizorder/customers`)

- Filters: **All / Active / Dormant**.
- Customer card hover increases shadow.
- Tag pills (VIP, Home Decor, etc.) color-coded.

### 12.D Products (`wizorder/products`)

- Filters: **All / In Stock / Low Stock / Out of Stock**.
- Stock badge color-coded (green / amber / red) with count.

### 12.E CRM (`wizorder/crm`)

- Tabs: **Tasks / Leads / Deals**.
- Tasks tab: priority badges (High/Medium/Low) color-coded.
- Deals tab: pipeline stages (Qualified → Proposal Sent → Negotiation → Closed Won).

**Verify:** From every page, the "Ask Kai" button (or sidebar Kai entry) clears any current chat and opens chat focused on the input.

---

## 13. Settings & preferences

**Source:** [`src/components/views/UserPreferencesView.tsx`](src/components/views/UserPreferencesView.tsx) + [`src/contexts/UserPreferencesContext.tsx`](src/contexts/UserPreferencesContext.tsx).

### 13.A Toggles (verify each: click → reload → toggle persists)

| #       | Section          | Toggle                               | Effect                                                                                                                                                                                                   |
| ------- | ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13.A.1  | Response Display | Show widgets alongside text          | OFF → switches to text-only response mode (T9)                                                                                                                                                          |
| 13.A.2  | Response Display | Auto-expand Agent Reasoning          | When ON, UW-014 cards open by default                                                                                                                                                                    |
| 13.A.3  | Response Display | Show confidence scores               | When OFF, confidence bar/percentage hidden in docs-qa                                                                                                                                                    |
| 13.A.4  | Voice & Audio    | Read responses aloud                 | See §11.C                                                                                                                                                                                               |
| 13.A.5  | Voice & Audio    | Auto-send after speaking             | When ON, voice transcript auto-sends after silence                                                                                                                                                       |
| 13.A.6  | Voice & Audio    | Notification sounds                  | (visual toggle present; ding behaviour stub)                                                                                                                                                             |
| 13.A.7  | Data & Privacy   | Include customer financial data      | When OFF, financial fields suppressed in Customer360Card AND `includeFinancial=false` flows to LLM system prompt                                                                                       |
| 13.A.8  | Data & Privacy   | Show contact information             | Hides email/phone in customer cards when OFF                                                                                                                                                             |
| 13.A.9  | Workflow         | Proactive assistance                 | When OFF, ProactiveBriefCard does not render                                                                                                                                                             |
| 13.A.10 | Workflow         | Require confirmation for all actions | OFF → red warning banner appears: "Disabling this allows Kai to execute actions without confirmation. Are you sure?" with Confirm/Cancel buttons. Cancel → toggle stays ON. Confirm → toggle goes OFF |
| 13.A.11 | Workflow         | Auto-save artifacts                  | When ON, generated charts/dashboards auto-add to Artifacts                                                                                                                                               |

### 13.B Custom Instructions textarea

| #      | Action                                                      | Expected                                                                          |
| ------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 13.B.1 | Type "Always use bar charts"                                | Char counter updates "X / 500 characters"                                         |
| 13.B.2 | Stop typing for 2s                                          | Auto-save fires; button flashes "Saved" (green border, 1.5s) → reverts to "Save" |
| 13.B.3 | Click "Save" before debounce                                | Immediate save                                                                    |
| 13.B.4 | Paste 600 chars                                             | Clamps at 500; counter turns red at 500/500                                       |
| 13.B.5 | Save instructions, then ask Kai a chart question in AI mode | LLM honours instruction (uses bar chart, not pie)                                 |
| 13.B.6 | Reload page                                                 | Instructions persist (from `kai_user_prefs_v1.customInstructions`)              |

---

## 14. Onboarding + Guided Tour

**Source:** [`src/components/gtm/OnboardingFlow.tsx`](src/components/gtm/OnboardingFlow.tsx), [`src/components/gtm/GuidedTourOverlay.tsx`](src/components/gtm/GuidedTourOverlay.tsx), `OnboardingContext`, `GuidedTourContext`, `PersonaContext`.

### 14.A Onboarding (3 steps, first-load only)

1. **Clear** localStorage keys `kai_onboarding_v1` + `kai-persona-id` + `kai-voice-id`.
2. Reload → modal appears (NOT before hydration; verify no flash).
3. **Step 1 — Meet Kai:** large gradient avatar, "Let's get started →".
4. **Step 2 — Choose Your Style:** Professional / Friendly / Concise cards. Click one → green border highlight; persona writes to `PersonaContext` immediately.
5. **Step 3 — Your First Briefing:** live preview of `ProactiveBriefCard`. Optional chip click stages a query for after onboarding completes.
6. Click "Get Started" → modal hides; chat view loads with the staged query (if any) auto-sending.
7. Reload → modal does NOT reappear.

### 14.B Guided Tour (6 steps, triggered from Settings → "Take a Tour")

| Step | Target (`data-tour`) | Tooltip side    | Verify                                                                                                                                                         |
| ---- | ---------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | sidebar                | right           | Sidebar lit up, rest dimmed                                                                                                                                    |
| 2    | ask-kai-button         | bottom          | "Ask Kai" pill in WizOrder page header is highlighted                                                                                                          |
| 3    | chat-input             | top             | View auto-switches to chat; input prefilled with "How's Acme Corp doing?"; "Send the query to continue →" italic text replaces Next button                    |
| 4    | action-chips           | top + offset 16 | Triggered AFTER user sends Step 3's query AND widgets finish rendering (350ms after `notifyTourWidgetsReady`); "Skip tour" or chip-click both pause the tour |
| 5    | proactive-brief        | bottom          | Resumes only when user clicks "New conversation" (resets chat → brief reappears);`pausedRef` correctly read                                                 |
| 6    | cmd-k-hint             | top             | ⌘K pill in chat header; "Done ✓" finishes the tour                                                                                                           |

**Verify regressions:**

- Tour Step 3→4: pressing Send fires `notifyTourQuerySent()` → overlay hides during widget streaming → after `handleWidgetsReady` + 350ms, `notifyTourWidgetsReady()` fires → overlay re-appears at Step 4. The two-pass `scrollIntoView({behavior:'instant'})` runs at 0ms and 300ms.
- Step 4 paused state: clicking an action chip OR "Skip tour" both call `pauseTour()`, NOT `endTour()`.
- Step 4 → 5 resume: `handleReset()` (New conversation) calls `clearTourPrefill()` then `resumeTour()`; tour advances to Step 5.

---

## 15. Misc surfaces

### 15.A Agent Store

- Browse → Agent Detail → "Add to Cart" (badge increments) → Cart sidebar → Checkout → Payment (mock form) → Confirmation → My Agents list.

### 15.B Docs view

- 3 pre-seeded docs visible (indexed).
- "Upload Document" → file picker → progress bar → marked "indexed" with page count.
- "Re-index Knowledge Base" → progress toast → "Re-index complete ✓".
- Q&A from chat references doc as source (see §4).

### 15.C History view

- List of past queries with use-case badge + relative timestamp ("Today, 14:32" / "Yesterday, 09:11" / "May 04, 18:22").
- Click row → chat opens with query prefilled and auto-sent.

### 15.D Artifacts

- Pre-seeded from `artifacts-preseeded.json`.
- Save chart from chat → SaveArtifactModal → save → appears in My Artifacts.
- Click artifact card → opens read-only.
- Click delete → removes from list (and from `localStorage` artifact list).
- With "Auto-save artifacts" ON: generated charts/dashboards add automatically.
- Dashboard artifacts open in DashboardFullView with Kai sidebar editing.

### 15.E Highlights (verified rendering)

- **UC-1 (`How's Acme Corp doing?`)** —
  - `UW-007 Customer360Card`: warning highlight on `metrics.cards[1].value` (current balance); info highlight on `recentOrders[0].status`.
  - `UW-011 CompactList`: urgent on `items[0].dueDate` (T-1001 overdue) + warning on `items[3].dueDate` (T-1004 due tomorrow).
- **UC-3 (`Acme Corp Q2 revenue and create a follow-up task`)** —
  - `UW-002 MetricCardRow`: warning highlight on `cards[2]` (avg order value down 3.1%) with chip "View top SKUs".
- Hover the highlighted field → tooltip with message renders above; pointer-events: none on tooltip.
- Clicking the highlight's action chip enters the regular pipeline as a chip-click.

### 15.F Nudges (one-time, localStorage `kai_nudges_seen_v1`)

| #      | Type            | Trigger                                          | Verify                                                                  |
| ------ | --------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| 15.F.1 | chart           | First time CH-001 LineChart renders in chat      | Nudge inline appears once; "Got it" dismisses; key persists             |
| 15.F.2 | dashboard       | First time UW-030 dashboard renders              | Same                                                                    |
| 15.F.3 | email           | First email-draft / email-shorter turn completes | Same                                                                    |
| 15.F.4 | action-chip     | First click of any action chip                   | Same                                                                    |
| 15.F.5 | After dismissal | Same trigger again                               | Nudge does NOT reappear; clearing `kai_nudges_seen_v1` brings it back |

### 15.G Shared state bridges

| #      | Action in chat                      | Verify on WizOrder page                                                            |
| ------ | ----------------------------------- | ---------------------------------------------------------------------------------- |
| 15.G.1 | UC-2: confirm a task creation       | CRM page → Tasks tab → new task at top with**✦ Kai** badge                      |
| 15.G.2 | Create an order via UC-2-style flow | Orders page → new order at top with**✦ Kai** badge; status filter still shows it |
| 15.G.3 | Create a customer                   | Customers page → new customer at top with**✦ Kai** badge                         |

### 15.H Demo ↔ AI toggle

- Header switch toggles `?ai=true` ↔ no `ai` param.
- ⌘+Shift+D (Mac) / Ctrl+Shift+D (Win) does the same.
- Toast confirms: "⚡ Switched to AI mode" / "🔒 Switched to Demo mode" (~2.5s).
- ModeIndicator dot: green halo + "AI Classification ON" / gray + "Demo Mode".
- Reload preserves URL state.

---

## E2E-1 — First-time user golden path

1. DevTools → clear `kai_onboarding_v1`, `kai-persona-id`, `kai-voice-id`, `kai_user_prefs_v1`, `kai_prefs_v1`, `kai_nudges_seen_v1`.
2. Reload → onboarding modal Step 1 appears.
3. Step 1 → Step 2: pick **Friendly**.
4. Step 3: click any chip → "Ready" → "Get Started".
5. Chat opens with proactive brief visible.
6. Settings → "Take a Tour" → walk all 6 steps. At Step 3 enter the prefilled "How's Acme Corp doing?" → Send → Step 4 lights up.
7. Click an action chip on Step 4 (tour pauses).
8. Click "New conversation" → tour Step 5 (proactive-brief) resumes.
9. Step 6 (⌘K hint) → "Done ✓".
10. Send `How's Acme Corp doing?` → UC-1 response with highlights (Customer360Card + CompactList tooltips).
11. Click action chip "Create follow-up task for Acme Corp" → UC-2 form → confirm.
12. Navigate to CRM → Tasks tab → see the new task with ✦ Kai badge.
13. Send `Build me a sales performance dashboard` → dashboard renders → click Save → artifact saved.
14. My Artifacts → see the dashboard.
15. Reload page → onboarding does NOT reappear; persona "Friendly" still selected.

## E2E-2 — Auto-speak across modes (Chromium + Safari)

1. Open `https://kaidemov0.vercel.app/?ai=true` in Chromium.
2. Settings → Preferences → toggle **Read responses aloud** ON.
3. Send `How's Acme Corp doing?`.
4. Wait for stream to end → ElevenLabs voice speaks.
5. Mid-speech, click the speaker button on the same response → speech stops, does NOT restart.
6. Toggle OFF → send another query → no auto-speak.
7. With toggle OFF, click the speaker button → ElevenLabs plays (manual path).
8. Repeat in Safari → confirm same behaviour (this is the audio-unlock + module-level singleton fix).

## E2E-3 — Demo ↔ AI parity

For each touchpoint trigger below, send the query in Demo mode, then in AI mode (`?ai=true`), and compare:

| Touchpoint | Trigger                                           |
| ---------- | ------------------------------------------------- |
| T1         | `How's Acme Corp doing?`                        |
| T2         | `Draft a follow-up email to Acme about QT-1192` |
| T3         | `Prep me for my next meeting with Acme Corp`    |
| T5         | `Build me a sales performance dashboard`        |
| T8         | `What is WizOrder?`                             |
| T9         | (Toggle text-only ON)`How's Acme Corp doing?`   |

**Compare:**

- Widget surface (UI cards, tables, charts) — should be identical Demo vs AI.
- Closing text: Demo = static fixture text (instant); AI = streamed Sonnet output with cursor.
- AI failure path: kill the network in DevTools after sending, observe → `failed=true` → fixture fallback shows.

---

## Failure modes / edge cases

| #    | Setup                                                   | Action                              | Expected                                                                                            |
| ---- | ------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| F-1  | AI mode                                                 | Throttle network so first byte > 8s | Cursor disappears, fixture closing text shows                                                       |
| F-2  | AI mode                                                 | Disconnect network mid-stream       | Fixture fallback; no broken UI                                                                      |
| F-3  | Remove `ANTHROPIC_API_KEY` from env, redeploy/restart | Send query in AI mode               | Classification falls back to keyword match (toast);`/api/kai/generate` errors → fixture fallback |
| F-4  | Remove `ELEVENLABS_API_KEY`                           | Click speaker / auto-speak          | Falls back to browser `speechSynthesis`                                                           |
| F-5  | Empty input + Send                                      | —                                  | Input shakes (`kai-shake`), no send, focus retained                                               |
| F-6  | Paste 5,000-char query                                  | Send                                | No crash; sends                                                                                     |
| F-7  | Custom instructions, paste 600 chars                    | —                                  | Clamped to 500 in textarea AND in persisted value                                                   |
| F-8  | Send a query while previous is streaming                | —                                  | Toast "Kai is still thinking…"                                                                     |
| F-9  | Voice input with no microphone permission               | Click mic                           | Mic shows error / no-op (`onerror` handler resets state)                                          |
| F-10 | Switch view mid-stream                                  | —                                  | Stream is cancelled by component unmount; no zombie state on return                                 |
| F-11 | Localstorage disabled (private window strict mode)      | Use any preference                  | Defaults apply; no crash                                                                            |

---

## Sign-off checklist

- [X] §0 Pre-flight clean (tsc, env vars, both browsers)
- [X] §1 Core query routing — all 14 rows
- [X] §2 Page-context — all 5 pages × triggers
- [X] §3 Dashboard builder — all 4 routes
- [X] §4 Docs Q&A — all 10 pairs
- [X] §5 Email routing — both branches
- [X] §6 Follow-up — widget-swap + form-restage
- [X] §7 Action chips — all capability + page groups + chain cap
- [X] §8 Command palette — all 20 items + keyboard nav
- [X] §9 Proactive briefs — all 5 pages
- [X] §10 Touchpoints T1–T10 — Demo + AI mode
- [X] §11 Voice + auto-speak — STT + manual + auto + regressions
- [X] §12 WizOrder pages — all 5
- [X] §13 Settings — all toggles + custom instructions
- [X] §14 Onboarding + Guided Tour — full flow incl. pause/resume
- [X] §15 Misc surfaces — Agent Store, Docs, History, Artifacts, Highlights, Nudges, Shared state, Demo↔AI
- [X] E2E-1, E2E-2, E2E-3 — all pass in Chromium AND Safari
- [X] Failure modes F-1 through F-11

When every box is ticked, v2.1 is ready to declare done.
