# WizCommerce Widget Library — Design System

A reusable design specification and standard for the WizCommerce **Component Library Test-bed** widgets. Use this document as the source of truth when modifying existing widgets or creating new ones to maintain a consistent visual language.

The widget system is built with **Satoshi** as the primary brand font, **JetBrains Mono** for data/technical text, and an extensive custom color scale with support for Dark and Light themes.

---

## 1. Foundations

### 1.1 Typography

The system utilizes two typefaces for clear hierarchy and data presentation:

- **Primary Sans-Serif (`var(--sans)`, `var(--display)`)**: `Satoshi`, sans-serif. Used for all general UI text, headings, and display values.
- **Monospace (`var(--mono)`)**: `JetBrains Mono`, monospace. Used strictly for data points, IDs, timestamps, small metadata, and technical readouts.

**Font Weight Scale**:
- `400`: Regular body
- `600`: Emphasized text, sub-labels, table headers
- `700`: Component titles, standard headings
- `800`: Display metrics (e.g., Metric Card values, large data points)

### 1.2 Color Palette & Theming

Widgets respond to global CSS variables that switch between Light and Dark mode (`[data-theme="light"]`).

#### Surfaces & Borders
| Variable | Dark Mode | Light Mode | Usage |
|----------|-----------|------------|-------|
| `--bg` | `#0a0b0f` | `#F7F8F8` | Canvas background |
| `--surface` | `#111318` | `#FFFFFF` | Primary card background |
| `--surface2` | `#181b23` | `#f0f2f5` | Secondary card / inner backgrounds |
| `--border` | `#252935` | `#DBE6F5` | Default card borders, dividers |
| `--border2` | `#2e3444` | `#BECADC` | Hover borders, secondary dividers |
| `--text` | `#e8eaf0` | `#2E3643` | Primary text (Headings, Main values) |
| `--text2` | `#8b92a8` | `#586476` | Secondary text (Subtitles, Body) |
| `--text3` | `#5a6075` | `#8895A9` | Muted text (Metadata, Mono labels) |

#### Brand & Semantic Colors
The system employs scaled palettes (`10` to `100`), with `80` acting as the main semantic color in Dark Mode.

- **Primary (Brand Green)**: Main `var(--primary-80)` `#16885F`. Secondary Accent `var(--primary-70)` `#28AA7B`. Used for brand actions, active states.
- **Success (Yellow-Green)**: Main `var(--success-80)` `#7DA50E`. Used for positive trends and completed states.
- **Warning (Amber)**: Main `var(--warning-80)` `#F0AF30`. Used for warnings, running tasks, and low stock.
- **Error (Rust Orange)**: Main `var(--error-80)` `#D74C10`. Used for negative trends, errors, and out-of-stock indicators.
- **Info (Sky Blue)**: Main `var(--info-80)` `#6BA6FE`. Used for neutral info and contextual hints.

**AI / Advanced Feature Accent**: The system also utilizes a purple/indigo accent (`rgba(91, 106, 240, X)`) for AI reasoning, filters, and active highlight states.

---

## 2. Core UI Elements

### 2.1 Status Badges (`StatusBadge`)
Badges are used extensively across widgets for statuses, labels, and tags. They have a standard format:
- `border-radius: 20px` (Pill shape)
- Font: `Poppins` or fallback sans-serif, `600` weight
- Sizes: `sm` (`10px` text, `2px 7px` padding) and `md` (`11px` text, `3px 10px` padding)

**Variants**:
- `success`: Green bg (`rgba(22,136,95,.12)`), Green text/border.
- `warning`: Yellow bg (`rgba(240,175,48,.12)`), Yellow text/border.
- `danger`: Red bg (`rgba(215,76,16,.12)`), Red text/border.
- `info`: Blue bg (`rgba(107,166,254,.12)`), Blue text/border.
- `neutral`: Grey bg (`rgba(136,149,169,.1)`), Grey text/border.
- `special`: Olive/Success bg (`rgba(125,165,14,.12)`), Olive text/border (Used for system/role identifiers).

### 2.2 Borders, Radii, and Shadows
- **Standard Card Radius**: `10px` or `12px` (`.metric-card`, `.product-card`, `.cmp-card`).
- **Inner Elements**: `8px` (Inner blocks, Kanban cards).
- **Chart Wrappers (`.chart-wrap`)**: `14px` radius with an intense shadow (`0 4px 40px rgba(0, 0, 0, .4)`).
- **Default Border**: Almost all widgets use `1px solid var(--border)`.

---

## 3. Widget Specifications

When building or refactoring widgets, strictly adhere to these anatomical rules:

### 3.1 Metric Cards (`UW-001`, `UW-002`)
- **Container**: `background: var(--surface2)`, `border: 1px solid var(--border)`, `border-radius: 10px`.
- **Top Accent Line**: Use an absolute positioned `3px` tall line at the top (`top: 0`). Can be a solid color or a linear gradient `linear-gradient(90deg, var(--primary-80), var(--info-80))`.
- **Label**: `10.5px`, `color: var(--text3)`.
- **Value**: `Satoshi`, `800` weight, `22px` or `26px`.
- **Trend**: Display with arrow (`▲`, `▼`, `→`), color-coded (`var(--success)` or `var(--danger)`). Period text should be `10.5px` and `400` weight.

### 3.2 Chart Wrappers (`CH-001` to `CH-011`)
- **Container (`.chart-wrap`)**: `background: var(--surface)`, `border-radius: 14px`, `padding: 24px`. Include the top transparent gradient line `linear-gradient(90deg, transparent, var(--accent), transparent)`.
- **Headers**:
  - Title: `15px`, `Satoshi`, `700` weight.
  - Subtitle: `11px`, `JetBrains Mono`, `var(--text3)`.
- **Recharts Overrides**: 
  - Grids (`.recharts-cartesian-grid-horizontal line`): `stroke: var(--border)`.
  - Tooltips: Use a custom tooltip wrapper with `background: var(--surface2)`, `border-radius: 8px`, `box-shadow: 0 8px 32px rgba(0,0,0,.2)`.

### 3.3 Data Tables (`UW-004`, `.tbl`)
- **Header (`th`)**: `background: var(--surface2)`, `color: var(--text3)`, `10.5px`, `600` weight, `uppercase` with `.4px` letter spacing.
- **Cells (`td`)**: `padding: 9px 12px`, `border-bottom: 1px solid var(--border)`.
- **Row Hover**: `background: rgba(255, 255, 255, .015)` (in Dark Mode).
- **Typography**: Force `JetBrains Mono` for currency, IDs, and numeric columns.

### 3.4 Product Cards (`UW-008`, `UW-009`)
- **Container (`.product-card`)**: `background: var(--surface2)`, `border-radius: 10px`.
- **Image/Thumbnail**: `aspect-ratio: 4/3`, `background: var(--border2)`.
- **Typography**: 
  - Name: `12px`, `600` weight.
  - SKU: `9.5px`, `JetBrains Mono`, `var(--text3)`.
  - Price: `14px` or `15px`, `Satoshi`, `800` weight.
- **Stock Status**: Explicitly color-coded (Green for In Stock, Amber for Low Stock, Red for Out of Stock).

### 3.5 Kanban Board (`UW-005`)
- **Columns (`.kb-col`)**: `background: var(--surface2)`, `min-width: 200px`, `border-radius: 10px`.
- **Cards (`.kb-card`)**: `background: var(--surface)`, `border-radius: 8px`, `padding: 10px`. Titles `12px` `600` weight. Metadata (assignee/time) uses `10px` `JetBrains Mono`.

### 3.6 Agent Reasoning (`UW-014`, `.reasoning-card`)
- **Accent Color**: AI/Agent features use an indigo accent `rgba(91, 106, 240, 0.05)`.
- **Container**: Border `1px solid rgba(91, 106, 240, 0.15)`, `border-radius: 10px`.
- **Steps**: Number icons are `20x20` circles with `rgba(91, 106, 240, 0.15)` backgrounds and `.accent2` text color.

### 3.7 Alert Banners (`UW-016`)
- **Container (`.alert-banner`)**: `border-radius: 9px`, `padding: 12px 16px`, `border-left: 4px solid`.
- **Variants**:
  - `info`: Blue border `#38bdf8`, `rgba(56, 189, 248, .07)` background.
  - `warning`: Amber border `var(--warn)`, `rgba(245, 158, 11, .07)` background.
  - `error`: Red border `var(--danger)`, `rgba(239, 68, 68, .07)` background.
  - `success`: Green border `var(--success)`, `rgba(34, 199, 138, .07)` background.

### 3.8 Timeline (`UW-010`)
- Use a left padding `20px` wrapper.
- Vertical line `1.5px` width, `background: var(--border2)`.
- Timeline dots: `10x10`, `border: 2px solid var(--accent)`.

---

## 4. General Formatting Guidelines

1. **Dates and Times**: When rendering timestamps or dates, always apply `font-family: var(--mono)` (`JetBrains Mono`). Keep font sizes small (`9.5px` to `11px`) and color muted (`var(--text3)`).
2. **Currency**: Always use `JetBrains Mono` for currency readouts inside tables or compact lists to align decimal points. Display values (like in Metric Cards) can remain `Satoshi`.
3. **Empty States**: If a widget lacks data, use `.empty-state` with a `48px` muted glyph (`opacity: .15`), a `17px` `700` weight title, and `12px` subtext.
4. **Icons**: Use native emojis or text-based icons wrapped in `<span>`. Keep icon sizes proportional (typically `18px` for general, `14px` for workflow nodes, `36px` for file previews).
5. **Interactive Elements**:
   - `cursor: pointer`
   - Transitions: `transition: all .15s` or `.2s`
   - Hover states should slightly lighten backgrounds or darken borders to `var(--border2)`.
