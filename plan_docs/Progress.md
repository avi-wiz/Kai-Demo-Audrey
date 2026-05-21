# Kai v2.1 — Progress Tracker

**Last updated:** 2026-05-08
**Last completed block:** —
**Next immediate task:** Block 1 — Proactive Brief + Contextual Starters

---

## Current Build Status

Phase: NOT STARTED
Last completed: V2 (fully working)
Next target: Block 1 — Proactive Brief + Contextual Starters

---

## V2 Carry-Forward Status
| Feature | Status | Notes |
|---------|--------|-------|
| UC-1 Customer 360 | ✅ Untouched | |
| UC-2 Task Creation | ✅ Untouched | |
| UC-3 Multi-Intent | ✅ Untouched | |
| Widget swap follow-up | ✅ Untouched | |
| Form re-staging follow-up | ✅ Untouched | |
| Text-only mode | ✅ Untouched | |
| Voice STT + TTS | ✅ Untouched | |
| Agent Store (full) | ✅ Untouched | |
| Docs view + QA | ✅ Untouched | |
| History view | ✅ Untouched | |
| Personas (personality + voice) | ✅ Untouched | Enhanced with rename in B1 |
| My Artifacts | ✅ Enhanced | New "Dashboards and Reports" category |
| Demo/AI mode toggle | ✅ Untouched | |

---

## Block 1: Proactive Brief + Contextual Starters
| Component | Status | Tested? | Notes |
|-----------|--------|---------|-------|
| proactive-brief-general.json | ✅ | | |
| proactive-brief-orders.json | ✅ | | |
| proactive-brief-customers.json | ✅ | | |
| proactive-brief-products.json | ✅ | | |
| proactive-brief-crm.json | ✅ | | |
| action-chips-map.json | ✅ | | |
| ProactiveBriefCard.tsx | ✅ | | |
| ActionChipsBar.tsx | ✅ | | |
| ActionChip.tsx | ✅ | | |
| Wiring: brief on new chat | ✅ | | |
| Wiring: chips after response | ✅ | | |
| Wiring: chips auto-send | ✅ | | |

## Block 2: WizOrder Shell + Page Context
| Component | Status | Tested? | Notes |
|-----------|--------|---------|-------|
| UnifiedSidebar.tsx | ✅ | | |
| WizOrderPage.tsx (shell) | ✅ | | |
| OrdersPage.tsx | ✅ | | Reads SharedOrdersContext |
| CustomersPage.tsx | ✅ | | Reads SharedCustomersContext |
| ProductsPage.tsx | ✅ | | |
| CRMPage.tsx | ✅ | | Reads SharedCRMContext |
| WizDashboardPage.tsx | ✅ | | |
| KaiBadge.tsx | ✅ | | |
| PageContext wiring | ✅ | | |
| SharedContexts (6) | ✅ | | |
| wizorder-orders.json | ✅ | | |
| wizorder-customers.json | ✅ | | |
| wizorder-products.json | ✅ | | |
| wizorder-crm.json | ✅ | | |

## Block 3: Actions via Context
| Component | Status | Tested? | Notes |
|-----------|--------|---------|-------|
| Action chip → auto-send chain | ✅ | | Max depth: 3 |
| Page-level action wiring | ✅ | | |
| Page context fixtures (15) | ✅ | | 3 per page × 5 pages |
| LLM page context injection | ✅ | | |

## Block 4: Insights Highlighting
| Component | Status | Tested? | Notes |
|-----------|--------|---------|-------|
| highlights prop on Customer360Card | ✅ | | |
| highlights prop on CompactList | ✅ | | |
| highlights prop on DataTable | ✅ | | |
| highlights prop on EntityDetailCard | ✅ | | |
| highlights prop on MetricCardRow | ✅ | | |
| Highlight data in UC-1 fixture | ✅ | | |
| Highlight data in SR-11 fixture | ✅ | | |
| Highlight data in dashboard fixtures | ✅ | | |
| generateHighlights() utility | ✅ | | |

## Block 5: Dashboard Builder
| Component | Status | Tested? | Notes |
|-----------|--------|---------|-------|
| DashboardCompositeWidget (UW-030) | ✅ | | |
| Dashboard creation flow in chat | ✅ | | |
| SaveArtifactModal → "Dashboards" | ✅ | | |
| DashboardFullView.tsx | ✅ | | |
| DashboardKaiSidebar.tsx | ✅ | | |
| DashboardBuilderContext | ✅ | | |
| Route: artifacts/dashboard/:id | ✅ | | |
| dashboard-sales-performance.json | ✅ | | |
| dashboard-customer-health.json | ✅ | | |
| dashboard-pipeline.json | ✅ | | |
| dashboard-order-analytics.json | ✅ | | |

## Block 6: User-Managed Behavior
| Component | Status | Tested? | Notes |
|-----------|--------|---------|-------|
| Custom Instructions textarea | ✅| | |
| Wire: instructions → LLM prompt | ✅ | | |
| Wire: auto-expand reasoning pref | ✅ | | |
| Wire: proactive toggle | ✅ | | |
| Wire: financial data toggle | ✅ | | |

## Block 7: GTM + Adoption
| Component | Status | Tested? | Notes |
|-----------|--------|---------|-------|
| OnboardingFlow.tsx | ✅ | | |
| GuidedTourOverlay.tsx | ✅ | | |
| UsageNudge.tsx | ✅ | | |
| ShareSnapshotButton.tsx | ✅ | | |
| CommandPalette.tsx | ✅ | | |

## Block 8: LLM Wiring + Voice
| Touchpoint | Status | Tested? | Notes |
|------------|--------|---------|-------|
| /api/kai/generate route | ✅ | | |
| T1: CanvasTextBlock streaming | ✅ | | |
| T2: Email body generation | ✅ | | |
| T3: Talking points generation | X | | |
| T4: Queue prioritization | X | | |
| T5: Report narrative | X | | |
| T6: Tone change follow-up | X | | |
| T7: Modification description | X | | |
| T8: Docs QA augmentation | 🔲 | | |
| T9: Text-only full narrative | 🔲 | | |
| T10: Workflow impact | 🔲 | | |
| Custom instructions in prompt | 🔲 | | |
| Page context in prompt | 🔲 | | |
| Voice STT + TTS | 🔲 | | |

---

## Key Decisions (v2.1)
1. Only 1 new widget (UW-030 DashboardCompositeWidget). Everything else is composition.
2. V2 features untouched — Agent Store, Docs, History, all use cases, follow-ups.
3. ProactiveBriefCard is a chat component, NOT a registered widget.
4. Action chips max chain depth = 3 before Kai requests explicit input.
5. Page context: 5 WizOrder pages (Orders, Customers, Products, CRM, Dashboard).
6. Saved dashboards open via ViewRoute 'dashboard-view:{artifactId}' and pass data via DashboardBuilderContext.
7. Custom instructions: single textarea, max 500 chars, injected between persona and capability prompt.
8. SharedContext merge: Kai items prepended to existing mock data, sorted by createdAt desc, KaiBadge shown for 1 hour.
9. Highlights are optional — widgets render normally if highlights prop is undefined.
10. Onboarding shows once (localStorage flag), skippable at every step.
