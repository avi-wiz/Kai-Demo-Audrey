# Kai 2.0 POC v2.1 — Claude Code Context

## What This Is

A POC for Kai 2.0, an AI sales assistant within WizCommerce's WizOrder platform.
V2.1 builds on V2 (sidebars, views, voice, follow-ups, personas, docs, agent store)
and adds: proactive briefs, page-aware context, action chip chains, insight
highlighting, a dashboard builder, custom instructions, GTM features, and
LLM-streamed text generation.

## Tech Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Recharts for charts
- Web Speech API for voice (STT + TTS)
- Anthropic Messages API (Claude Sonnet 4.6) for dynamic text generation

## Rule:

1. Always run the command after completing the work:

```
npx tsc --noEmit 2>&1
```

## Architecture

- **Rendering Engine:** Frame JSON → FrameParser → ComponentRegistry → CompositionEngine → Widgets
- **Text Generation:** Two-pass pattern. Widgets render from fixtures (instant). LLM text streams into CanvasTextBlock (parallel).
- **Page Context:** 5 WizOrder pages inject context into Kai's system prompt, driving starter prompts, proactive briefs, and page-level actions.
- **Dashboard Builder:** DashboardCompositeWidget (UW-030) renders existing widgets in a CSS Grid. Saved dashboards open in DashboardFullView with a Kai editing sidebar.
- **Action Chips:** Contextual clickable actions below every response. Click auto-sends a query, creating capability chains.
- **Shared State:** SharedContexts (Orders, Carts, Customers, CRM, Quotes, Claims) bridge Kai-created data to WizOrder listing pages.

## Design System

Source of truth: widget_system.md (light mode)

- Primary font: Satoshi (400, 600, 700, 800)
- Mono font: JetBrains Mono (data, IDs, timestamps)
- Surface: var(--surface) #FFFFFF, var(--surface2) #f0f2f5
- Background: var(--bg) #F7F8F8
- Borders: var(--border) #DBE6F5, var(--border2) #BECADC
- Text: var(--text) #2E3643, var(--text2) #586476, var(--text3) #8895A9
- Primary: var(--primary-80) #16885F, var(--primary-70) #28AA7B
- AI accent: rgba(91, 106, 240, X) for reasoning, highlights
- Shadows: light mode values (0.06-0.08 opacity)

## The Widget Contract

Every widget: { data: SpecificDataInterface, config?: any, highlights?: WidgetHighlight[] }
FrameParser passes { data, config, highlights } from JSON frames directly. No transformation.

## Registered Widgets (19 total = 18 from V2 + UW-030)

UW-014 AgentReasoningCard, UW-007 Customer360Card, UW-003 EntityDetailCard,
UW-002 MetricCardRow, UW-011 CompactList, UW-004 DataTable,
CH-001 LineChart, AW-001 DeepLinkButton, AW-004 MultiStepFormWizard,
AW-012 ConsentBanner, AW-003 ConfirmationDialog, UW-030 DashboardCompositeWidget
Sub-components (NOT registered): UW-001 MetricCard, AW-005 FormField

## Key Patterns

- ProactiveBriefCard renders as first message on new chat (if preference ON)
- ActionChipsBar renders below CanvasTextBlock after every response
- Action chip click → auto-sends chip.query → normal pipeline → new response with its own chips
- Max action chain depth: 3 before Kai asks for explicit input
- Page context injected when Kai opened from a WizOrder page
- Custom instructions injected into every LLM system prompt
- Highlights: optional colored accents on widget fields with action tooltips
- Dashboard builder: composite widget in chat → save → reopen in full view + Kai sidebar

## V2 Features — UNCHANGED (do not modify)

- Agent Store (all views, cart, payment, checkout)
- Docs view (upload, QA)
- History view
- Voice (STT + TTS)
- Follow-ups (widget swap, form re-staging)
- Text-only mode
- UC-1, UC-2, UC-3 fixtures and flows
- Demo/AI mode toggle (Cmd+Shift+D)

## Contexts

- LayoutContext: current view, navigation
- PageContext: current WizOrder page, page data, page actions, starters, brief
- ArtifactContext: saved artifacts (now includes "Dashboards and Reports" category)
- PersonaContext: selected personality + voice
- ResponseModeContext: text-widget vs text-only
- ConversationContext: chat history, stale marking, follow-up tracking
- SharedOrdersContext, SharedCartsContext, SharedCustomersContext, SharedCRMContext,
  SharedQuotesContext, SharedClaimsContext: bridge between Kai and WizOrder pages
- DashboardBuilderContext: active dashboard data for full-view editing
- OnboardingContext: has user completed onboarding? (localStorage backed)
- UserPreferencesContext: all preferences + customInstructions string

## Current Build Status

Phase: NOT STARTED
Last completed: V2 (fully working)
Next target: Block 1 — Proactive Brief + Contextual Starters
