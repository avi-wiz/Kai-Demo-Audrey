# Agent Store Module — Architecture Plan

## Context

The Agent Store module is the v2 marketplace surface where users browse, purchase, configure, and manage AI agents. The scaffolding is already in place: `AgentStoreContext` is fully built with cart/purchase/sub-view state, the `'agent-store'` ViewRoute is registered, the sidebar nav (with `library` / `my-agents` sub-menu) wires into `setAgentStoreView`, and the catalog fixture has 10 agents with all required fields. What's missing is the entire UI — [AgentStoreLayout.tsx](src/components/agent-store/AgentStoreLayout.tsx) is a 10-line "coming soon" stub.

This plan maps the interaction graph, resolves the AgentCard / AgentDetailView shared-component questions, and flags the cart-drawer + payment-view risks before any code is written.

---

## 1. Interaction Graph

### Context surface (from [AgentStoreContext.tsx](src/contexts/AgentStoreContext.tsx))

| State                  | Read by                                            | Written by                                |
| ---------------------- | -------------------------------------------------- | ----------------------------------------- |
| `agents`               | LibraryView, MyAgentsView, AgentDetailView, MyAgentConfigView | (init from fixture; updated on purchase/deactivate) |
| `purchasedAgentIds`    | AgentCard (badge), MyAgentsView (filter), CTA logic | `purchaseCart`, `deactivateAgent`         |
| `cart` / `cartCount` / `cartTotal` | CartIcon (TopNav), CartDrawer, PaymentView       | `addToCart`, `removeFromCart`, `clearCart`, `purchaseCart` |
| `cartOpen`             | CartDrawer (visibility), CartIcon (active state)   | `toggleCart`                              |
| `agentStoreView`       | AgentStoreLayout (router)                          | `setAgentStoreView` (every nav action)    |
| `selectedAgentId`      | AgentDetailView, MyAgentConfigView, PaymentView (deep-link) | `setAgentStoreView(view, agentId)`        |

### View transition triggers (who calls `setAgentStoreView`)

| From → To                                  | Trigger                                          |
| ------------------------------------------ | ------------------------------------------------ |
| (sidebar) → `library` / `my-agents`        | [KaiHoverMenu.tsx#L37-41](src/components/layout/KaiHoverMenu.tsx#L37-L41) — already wired |
| `library` → `agent-detail`                 | AgentCard click (PLP variant)                    |
| `my-agents` → `my-agent-config`            | AgentCard click (My Agents variant) for purchased agent |
| `agent-detail` → `library`                 | Back button in PDP header                        |
| `agent-detail` → (cart add)                | "Add to Cart" CTA — calls `addToCart`, stays on PDP, opens drawer |
| (any) → `payment`                          | CartDrawer "Checkout" button                     |
| `payment` → `checkout-confirmation`        | PaymentView "Confirm Purchase" → `purchaseCart` then `setAgentStoreView('checkout-confirmation')` |
| `checkout-confirmation` → `my-agents`      | "View My Agents" CTA                             |
| `checkout-confirmation` → `my-agent-config` | "Configure {agent}" CTA per purchased agent     |

### Cart action call sites

| Action            | Called from                                       |
| ----------------- | ------------------------------------------------- |
| `addToCart`       | AgentCard (Library variant), AgentDetailView CTA  |
| `removeFromCart`  | CartDrawer line item, MyAgentConfigView "Deactivate" *(no — that's `deactivateAgent`)* |
| `toggleCart`      | TopNav CartIcon, CartDrawer close button, PaymentView "Back" |
| `purchaseCart`    | PaymentView "Confirm Purchase" only               |
| `clearCart`       | (defensive — not surfaced in UI per current scope) |
| `deactivateAgent` | MyAgentConfigView "Deactivate Agent" button       |

---

## 2. Component Boundaries

### 2a. AgentCard — single component, variant prop

`AgentCard` is used in **both** Library (PLP) and My Agents views, with different CTAs and badges. Recommend a single component with a `variant` prop rather than two siblings:

```ts
interface AgentCardProps {
  agent: Agent;
  variant: 'library' | 'my-agents';
  onClick: () => void;       // navigates to detail/config
  onAddToCart?: () => void;  // only used in 'library' variant
}
```

**Rationale:** the card body (image, name, tagline, category chip) is identical in both views — ~80% of the markup. Only the footer differs:

- `library` variant footer: pricing label + "Add to Cart" button (or "In Cart" / "Purchased" / "Included" state-derived label, all driven by `isInCart` / `isPurchased` / `agent.status`).
- `my-agents` variant footer: connector count + "Configure →" link, no pricing.

A single component with a small footer switch is cleaner than two near-duplicate files. The state-derived CTA label should live inside `AgentCard` so the variants don't have to recompute it.

### 2b. AgentDetailView vs MyAgentConfigView — separate, no shared layout

These views share visual rhythm (hero header, body sections), but the **content shape diverges enough** that a shared `AgentDetailLayout` would create more conditional branching than it eliminates:

| Section            | AgentDetailView (PDP)                          | MyAgentConfigView                              |
| ------------------ | ---------------------------------------------- | ---------------------------------------------- |
| Hero               | image, name, tagline, category, "Add to Cart"  | image, name, "Active" badge, "Deactivate" button |
| Capabilities       | full grid of bullets (read-only)               | omitted                                        |
| Data permissions   | read-only checklist                            | toggle list (required ones disabled)           |
| Connectors         | read-only status badges                        | editable: connect / disconnect per connector   |
| Pricing            | omitted (per CLAUDE.md rule 10)                | omitted                                        |

Recommendation: build them as **two separate components** and extract only the genuinely shared sub-pieces — `AgentHero`, `CapabilityList`, `PermissionList` (with a `mode: 'read' | 'edit'` prop), `ConnectorList` (same). This keeps each view's top-level file readable and avoids a layout component whose only job is to slot-shuffle.

---

## 3. Risk Flags

### 3a. Cart drawer vs WizOrder sidebar

**No conflict.** Both sidebars ([KaiOnlySidebar](src/components/layout/KaiOnlySidebar.tsx), [WizOrderSidebar](src/components/layout/WizOrderSidebar.tsx)) are **left-anchored** (`position: fixed; left: 0; z-50`). The cart drawer should be **right-anchored** (`position: fixed; right: 0; z-50`, width ~380px, with a backdrop overlay covering the rest of the viewport). They occupy independent screen edges.

The `MainContent` area is offset by `paddingLeft: sidebarWidth` (52/240/260px depending on mode + collapsed state) — the cart drawer doesn't need to participate in that math; it overlays the main content.

**Z-index check:** sidebars use `z-50`. Cart drawer should match (`z-50`) since both are top-level chrome. The backdrop should sit at `z-40` so the left sidebar stays interactive (or at `z-50` if we want a true modal behavior — pick one). Recommend backdrop `z-40` so the user can still click the sidebar to navigate away from the cart.

### 3b. Payment view — full page, replace store content area

**No new sub-route needed.** The `agentStoreView` enum already includes `'payment'` and `'checkout-confirmation'` — both are first-class sub-views. `AgentStoreLayout` switches on `agentStoreView` and renders the payment screen as the full content area (header + body), replacing the library/PDP entirely.

Top nav stays mounted (it lives in [LayoutShell.tsx](src/components/layout/LayoutShell.tsx#L54-L94), outside MainContent). The "Ask Kai" button and AiModeToggle remain visible during checkout — that's fine for a POC.

The `PaymentView` should:
- Read `cart`, `cartTotal`, `selectedAgentId` from context.
- On "Back to Cart" → `setAgentStoreView(previousView)` *(track via a small local state in AgentStoreLayout, or just route back to `'library'` for simplicity — POC scope).*
- On "Confirm Purchase" → call `purchaseCart()`, then `setAgentStoreView('checkout-confirmation')`.

### 3c. CartIcon placement in TopNav

[LayoutShell.tsx#L58](src/components/layout/LayoutShell.tsx#L58) renders the right-side flexbox (`gap: 12`) with "Ask Kai" button + `AiModeToggle`. **Per user decision: cart icon is always visible across all views**, not gated on `currentView`. Insert `<CartIcon />` immediately before "Ask Kai" with no conditional. The icon reads `cartCount` (badge bubble shown when > 0) and calls `toggleCart` on click. CartDrawer mounts inside `AgentStoreLayout` — but since cart can be opened from any view, the drawer must mount somewhere globally accessible. **Move CartDrawer mount to LayoutShell** (sibling of `<main>`), not AgentStoreLayout, so it overlays correctly regardless of current view.

---

## 4. Component Inventory (14 components)

Grouped by sub-view. Files live under `src/components/agent-store/`.

**Router:**
1. `AgentStoreLayout.tsx` — switches on `agentStoreView`. (CartDrawer mounts in LayoutShell, not here, so it works from any view.)

**Shared:**
2. `AgentCard.tsx` — variant-aware card.
3. `AgentHero.tsx` — image + name + tagline + status/CTA slot.
4. `CapabilityList.tsx` — read-only bullet grid.
5. `PermissionList.tsx` — `mode: 'read' | 'edit'`.
6. `ConnectorList.tsx` — `mode: 'read' | 'edit'`.
7. `CartIcon.tsx` — top-nav icon, conditional render in LayoutShell.
8. `CartDrawer.tsx` — right-anchored fixed overlay + backdrop.

**Sub-views:**
9. `LibraryView.tsx` — PLP, **multi-select** filter chips by `AgentCategory` (local `Set<AgentCategory>` state; empty set = show all; clicking chip toggles its presence in set; results = union of selected categories), grid of `AgentCard variant="library"`.
10. `MyAgentsView.tsx` — grid of `AgentCard variant="my-agents"` filtered by `isPurchased || status === 'included'`.
11. `AgentDetailView.tsx` — PDP, composes Hero + CapabilityList + PermissionList(read) + ConnectorList(read) + Add-to-Cart CTA.
12. `MyAgentConfigView.tsx` — composes Hero + PermissionList(edit) + ConnectorList(edit) + Deactivate CTA.
13. `PaymentView.tsx` — billing summary, line items from `cart`, `cartTotal`, "Confirm Purchase" → `purchaseCart` + view transition.
14. `CheckoutConfirmationView.tsx` — success state, lists newly-purchased agents with "Configure" deep links.

---

## 5. Files to Modify

| File                                                     | Change                                                  |
| -------------------------------------------------------- | ------------------------------------------------------- |
| [AgentStoreLayout.tsx](src/components/agent-store/AgentStoreLayout.tsx) | Replace stub with sub-view switch + CartDrawer mount    |
| [LayoutShell.tsx](src/components/layout/LayoutShell.tsx) | Insert `<CartIcon />` (always visible) in top-nav right cluster (~L58); mount `<CartDrawer />` as sibling of `<main>` so it overlays from any view |
| (new) `src/components/agent-store/*`                     | All 13 new components above                             |

No changes needed to `AgentStoreContext`, `types.ts`, the catalog fixture, or `KaiHoverMenu` — they're already complete.

---

## 6. Verification Plan

End-to-end smoke test (after implementation):

1. Start dev server, click sidebar **Agent Store** → sub-menu **Agent Library**. Confirm library renders 10 cards; Kai/Ella show "Included" badge, others show pricing + "Add to Cart".
2. Click any purchasable card → PDP renders with capabilities, permissions (read-only), connectors. No pricing visible.
3. Click "Add to Cart" → cart icon in top-nav shows count `1`, drawer slides in from right, backdrop dims rest of screen. Sidebar (left) remains clickable.
4. Add 2 more agents. Confirm `cartTotal` sums correctly. Refresh page → cart persists (sessionStorage).
5. Click "Checkout" → PaymentView renders with line items + total. Top-nav stays visible.
6. Click "Confirm Purchase" → CheckoutConfirmationView shows newly-purchased agents. Click "Configure" on one → MyAgentConfigView opens for that agent.
7. In MyAgentConfigView, toggle a non-required permission, connect a connector, click "Deactivate" → agent moves back to "available" in library.
8. Toggle layout mode (Cmd+Shift+L) — Agent Store should render correctly under both `kai-only` and `kai-wizorder` chrome with no overlap.
9. Switch to `chat` view via "Ask Kai" — confirm CartIcon disappears from top-nav.
10. Run `npx tsc --noEmit` — zero errors.

---

## 7. Resolved Decisions

1. **Cart icon visibility:** always visible in top-nav across all views. CartDrawer must therefore mount in LayoutShell (global), not AgentStoreLayout.
2. **Library filter chips:** multi-select. Local `Set<AgentCategory>` state in LibraryView; results union across selected categories; empty set = show all.
