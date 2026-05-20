# UI Overhaul — Change Log

## 1. Design Token & Font Bridge (`src/app/globals.css`)
- Replaced fontshare CDN with local Satoshi `@font-face` declarations
- Added `@import "tailwindcss"` and `@import "./tokens.css"` at the top
- Added a `:root` bridge block mapping legacy v2 token names (`--surface`, `--text`, `--primary-80`, etc.) to the new `--color-*` palette from `tokens.css`
- Preserved all existing v2 keyframe animations

## 2. Layout (`src/app/layout.tsx`)
- Removed fontshare CDN `<link>` tag (Satoshi now loaded locally)
- Kept JetBrains Mono Google Fonts link for monospace

## 3. Sidebar — Full Rewrite (`src/components/layout/UnifiedSidebar.tsx`)
- Converted from a 220px sectioned sidebar to a single **56px icon rail**
- Replaced all old SVG icon map references with inline Tabler SVG glyphs:
  - `DashboardGlyph` — tabler-layout-dashboard
  - `ProductsGlyph` — tabler-layout-list
  - `OrdersGlyph` — tabler-file-text
  - `CustomersGlyph` — tabler-user
  - `CrmGlyph` — tabler-heart (CRM heart with inner path)
  - `LogoutGlyph` — tabler-logout
  - `KaiSparkleIcon` — ✦ sparkle character
- `glyphColor(active)` helper: `#FFFFFF` when active, `var(--text3)` when inactive
- **Active state**: `rgb(9, 102, 69)` background pill, `border-radius: 8px`, white glyph
- **Hover state** (inactive): `#F2F6E8` background
- **Hover label pill**: rendered via `createPortal` to `document.body` using `position: fixed` + `getBoundingClientRect()` — avoids clipping by any ancestor overflow or stacking context
- **Kai entry**: single rail icon (✦) with recursive flyout menu on hover covering: Chat (New Chat, History), My Artifacts, Reports & Dashboards, Knowledge Store, User Preferences, Admin
- `FlyoutMenu` + `FlyoutRow` components for arbitrary-depth recursive flyouts, all rendered `position: fixed` via portals
- Removed: section labels, expanded text labels, section dividers, footer user block, `openGroups` state, App Store, Settings, Manage, Reports, Files, Leads, Deals, Tasks, In-person visits, Discounts nav items
- Logo: WizCommerce SVG (`/icons/WizCommerce.svg`) shown when expanded; hamburger icon when collapsed
- Logout button always visible at the bottom of the rail
- Exported `SIDEBAR_TOTAL_WIDTH = 56` constant

## 4. Top Bar — Rewrite (`src/components/layout/LayoutShell.tsx`)
- **Breadcrumb**: single segment for Kai views; `Dashboard / Leaf` pattern for WizOrder sub-pages (`wizorder/products` → `Dashboard / Products`, etc.)
- **Ask Kai pill**: `#096645` background, white text and sparkle icon, hover darkens to `#0b7a52`
- **Notification bell**: icon button with outside-click popover ("You're all caught up")
- **HB avatar**: standalone 32px circle button, `rgb(69, 120, 196)` background, white `#FFFFFF` text — placed after the bell
- Removed: ⌘K button, `AiModeToggle`, `CommandPalette` mount, `paletteOpen` state, `keydown` listener for Cmd+K
- `paddingLeft` set to `SIDEBAR_TOTAL_WIDTH` (56px) imported from `UnifiedSidebar`
- `<main>` changed from `min-h-screen` to `h-screen overflow-hidden` to enable page scrolling

## 5. Scroll Fix (`src/components/layout/MainContent.tsx`, `src/components/layout/LayoutShell.tsx`)
- `<main>`: changed `min-h-screen` → `h-screen overflow-hidden` (bounds layout to viewport)
- `MainContent` wrapper: changed `overflow-hidden` → `overflow-y-auto` (makes page content scrollable)

## 6. Export Dropdown Fix (`src/components/dashboard-builder/DashboardFullView.tsx`)
- Rewrote `ExportMenu` to render the dropdown via `createPortal` to `document.body`
- Used `position: fixed` + `getBoundingClientRect()` for positioning — fixes chart bleed-through caused by stacking context at `z-index: 30`

## 7. Product Cards — Full Redesign (`src/components/wizorder/ProductsPage.tsx`)
- Replaced old `ProductCard` with new design matching WizShop reference:
  - **Container**: `border-radius: 1.3rem`, `border: 1px solid rgba(0,0,0,0.12)`, white background
  - **Image area**: square `aspect-ratio: 1/1`, `object-fit: cover`
  - **Heart button**: top-right, circular white button, toggles red fill on click
  - **Featured / New Launch ribbon**: top-left, amber for Featured, indigo for New Launch — only shown for `is_hero: true` products
  - **View similar chip**: bottom-right of image, tabler-cards SVG icon + bold "View similar" label
  - **Available row**: centered, `rgb(247, 248, 250)` background, shows real `available_qty` from product data
  - **Product name**: 2-line clamp, 13px
  - **SKU**: monospace, `var(--text3)`
  - **Price**: 14px semibold
  - **Add to cart button**: full-width, `#096645` green, white text, darkens to `#0b7a52` on hover
- Removed: `StockBadge`, `ProductImage`, `Ribbon` (ribbon inlined into new card), `stockKind`, `STOCK_BADGE`
- All products now use the new card design (previously only the first card was upgraded)
