# WizCommerce Admin — Design System

A reusable design specification extracted from the WizCommerce Admin frontend (`ultron-feat-keystone-demo`). Use this as the source of truth when scaffolding any new prototype that should look and feel like the WizCommerce admin app.

The system is **MUI-based** under the hood (`@mui/material` + a custom `lightTheme`), with **Satoshi** as the brand font, **forest-green** as the primary accent, and a **white / off-white** neutral surface palette.

---

## 1. Foundations

### 1.1 Font stack

The brand font is **Satoshi** (4 weights). Fallback to system sans.

```css
font-family: 'Satoshi', system-ui, -apple-system, sans-serif;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

Available weights:

| Weight | Usage                  |
|--------|------------------------|
| 300    | Light captions         |
| 400    | Body / regular         |
| 500    | Medium / emphasized    |
| 700    | Bold / headings        |

Self-host the OTF/WOFF2 files (Satoshi is not free on Google Fonts). Files live at `src/assets/fonts/Satoshi-{Light,Regular,Medium,Bold}.{otf,woff2}` in this repo.

```css
@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Regular.woff2') format('woff2');
  font-weight: 400;
}
/* repeat for 300 / 500 / 700 */
```

### 1.2 Root font size — **10px base**

The whole app uses `html { font-size: 10px; }` so that **1rem = 10px**. Every `rem` value below assumes this base. If you don't want to fight this convention, keep the same 10px base in your prototype.

```css
html { font-size: 10px; height: 100%; width: 100%; }
body { height: 100%; font-family: 'Satoshi'; }
* { margin: 0; padding: 0; box-sizing: border-box; }
p, span { font-size: 1.4rem; }   /* = 14px */
```

### 1.3 Typography scale (MUI variants)

| Variant      | Size           | Weight | Line height | Use                                  |
|--------------|----------------|--------|-------------|--------------------------------------|
| `h1`         | 4.8rem (48px)  | 700    | 6.4rem      | Marketing-tier titles                |
| `h2`         | 3.6rem (36px)  | 700    | 4.8rem      | Page hero                            |
| `h3`         | 2.8rem (28px)  | 700    | 3.6rem      | Section title                        |
| `h4`         | 2.4rem (24px)  | 700    | 3.2rem      | Subsection                           |
| `h5`         | 2.0rem (20px)  | 700    | 2.8rem      | Card title                           |
| `h6`         | 1.6rem (16px)  | 700    | 2.4rem      | Strong inline header                 |
| `body1`      | 1.6rem (16px)  | 400    | —           | Default body                         |
| `body2`      | 1.4rem (14px)  | 400    | —           | Secondary text                       |
| `subtitle1`  | 1.6rem         | —      | —           | Subtitle large                       |
| `subtitle2`  | 1.4rem         | —      | —           | Subtitle small                       |

**`CustomText` semantic types** (the app's preferred wrapper — pixel values, not rems):

| `type`        | Size | Weight   |
|---------------|------|----------|
| `H1`          | 20px | bold     |
| `H2`          | 18px | bold     |
| `H3` / `H6`   | 16px | bold     |
| `Title`       | 16px | normal   |
| `Subtitle`    | 14px | bold     |
| `Body`        | 14px | normal   |
| `Body2`       | 14px | 500      |
| `BodyLarge`   | 24px | 500      |
| `Caption`     | 12px | normal   |
| `CaptionBold` | 12px | 700      |
| `Micro`       | 10px | normal   |
| `MicroBold`   | 10px | 500      |

### 1.4 Color palette

The palette is exported from `src/utils/light.theme.ts`. Each role exposes a `main` + 50–900 ramp.

#### Primary — **Forest Green** (brand)
```
50   #E8F3EF
100  #D0E7DF
200  #A2CFBF
300  #73B89F
400  #6AB399
500  #16885F  ← main
600  #096645
700  #01442C
800  #01442C
900  #002D1D
```

#### Secondary — Neutral / Grey
```
50   #FAFAFA
100  #F2F4F7
200  #F2F4F7
300  #EEF1F6
400  #D1D6DD
500  #B5BBC3
600  #9AA0AA
700  #676D77
800  #4F555D
900  #25282D  ← main
```

#### Error — Rust Orange
```
50   #FBEDE7
100  #F7DBCF
200  #EFB79F
300  #E79470
400  #DF7040
500  #D74C10  ← main
600  #AE3500
700  #852800
800  #5D1C00
900  #481702
```

#### Warning — Amber
```
50   #FEF7EA
100  #FCEFD6
200  #F9DFAC
300  #F6CF83
400  #F3BF59
500  #F0AF30  ← main
600  #CE921E
700  #AC7710
800  #8A5D05
900  #684500
```

#### Info — Sky Blue
```
50   #F0F6FF
100  #E1EDFF
200  #C4DBFF
300  #A6C9FE
400  #88B8FE
500  #6BA6FE  ← main
600  #4578C4
700  #3563A6
800  #284F89
900  #1C3C6C
```

#### Success — Olive Green (distinct from primary; for "increase" indicators)
```
50   #F2F6E7
100  #E5EDCF
200  #CBDB9F
300  #B1C96E
400  #97B73E
500  #7DA50E  ← main
600  #5B7C00
700  #3D5300
800  #2C3C01
900  #212D01
```

#### Kai / AI accent — Purple (used for AI features e.g. Kai assistant, MCP chat)
```
primary:        #8155D9
dark:           #6240C8
deeper:         #4A2FA0
secondary bg:   #F6F3FD
border:         #DDD4F5
text on light:  #4A2FA0
header fg:      #FFFFFF
```

#### Semantic surface tokens
```
background.primary    #FFFFFF
background.secondary  #F7F8FA   ← page background
background.alice_blue rgba(240, 246, 255, 0.70)
background.accordion  #EFF3E1
background.radiant    #EFF7E0
chip_bg_1             rgba(0,0,0,0.6)
chip_bg_2             #F2ECFF
divider               rgba(0,0,0,0.12)
```

#### Text colors (rgba over white)
```
primary    rgba(0,0,0,0.6)
black      rgba(0,0,0,0.87)
disabled   rgba(0,0,0,0.3)
light_grey rgba(0,0,0,0.08)
dark_grey  rgba(103,109,119,1)   // = #676D77
green      #16885F
grey       #A9ACB2
white      #FFFFFF
```

### 1.5 Spacing & sizing

The app does **not** use a tight token system; it leans on MUI's 8-px spacing prop. Practical conventions seen in the codebase:

| Token / value     | Use                                  |
|-------------------|--------------------------------------|
| `4px` / `8px`     | Tight inline gaps (icons, chips)     |
| `12px` / `16px`   | Card / drawer padding                |
| `20px` / `24px`   | Section gap                          |
| `32px` / `40px`   | Page-level gutter                    |

Common helpers:
- Drawer container: `padding: 16px 20px; gap: 16px;`
- Drawer body: `gap: 24px;`
- Drawer divider extends `width: calc(100% + 40px); margin-left: -20px;`

### 1.6 Layout chrome

| Region         | Size               | Notes                                         |
|----------------|--------------------|-----------------------------------------------|
| Sidebar        | `width: 85px` (rendered) / `left: 70px` content offset | Fixed, dark/light icon rail                   |
| Topbar         | sticky, `top: 0`, `zIndex: 999`, `bg: #FFFFFF` | Above content, below modals                  |
| Page background| `#F7F8FA`          | Use on `body` / outer container               |
| Card surface   | `#FFFFFF`          | All content sits on white cards               |
| Sticky filter  | `top: 7rem` mobile / `top: 59px` desktop, `z-index: 100` | Below the breadcrumb header                 |
| Breadcrumb hdr | sticky `top: 0`, `z-index: 6`, `bg: #F7F8FA`, padding `1.6rem 0 0.8rem` | Width is `calc(100% + 16px)` to bleed gutter |

### 1.7 Radii, shadows, borders

```
border-radius (default): 8px      // theme.shape.borderRadius
card / modal:            10–12px  // .error_screen, .add-details-card, modals
chip / button:           pill (full) or 8px

divider: 2px dotted rgba(0,0,0,0.12)        // hr / MuiDivider override

shadow.dark_1: #0000001F
shadow.dark_2: rgba(0,0,0,0.15)
list dropdown shadow: 0 4px 30px rgba(0,0,0,0.1)
accordion shadow:      0 2px 1px -1px rgba(0,0,0,0.2),
                       0 1px 1px rgba(0,0,0,0.14),
                       0 1px 3px rgba(0,0,0,0.12)
error screen card:     0 0 15px 2px #EDEDED
```

### 1.8 Z-index scale (observed)

| Z   | Use                                |
|-----|-----------------------------------|
| 2   | Sticky breadcrumb header (legacy) |
| 3   | Filter chips header               |
| 6   | Breadcrumb / order / invoice hdr  |
| 100 | Filter header                     |
| 999 | Topbar (sticky chrome)            |
| MUI `drawer` | Sidebar (fixed rail)     |

---

## 2. Components

All atoms live under `src/common/@the-source/atoms/`. They wrap MUI and lock in our defaults (typography, casing, shadows). Re-create equivalents in your prototype or import the originals.

### 2.1 Button

`Button` wraps `MuiButton`. Key locked-in defaults:

```ts
variant:    'contained'
size:       'medium'
color:      'primary'
fontSize:   1.4rem (14px)
fontWeight: 700
boxShadow:  none           // no MUI elevation
textTransform: none        // sentence case, never UPPERCASE
```

Variants:
- **Contained** — primary green fill, white text. Default CTA.
- **Outlined** — green border, green text.
- **Text** — green text, no chrome.
- **Tonal** (custom prop `tonal`) — `bg: #E8F3EF` (primary 50), `color: #16885F`, hover `bg: #D0E7DF`. Use as a softer secondary CTA.
- **Loading** — pass `loading={true}` to render an inline `CircularProgressBar` before children. Disables click.

```tsx
<Button variant="contained" color="primary">Save</Button>
<Button tonal startIcon={<Icon iconName="IconPlus" />}>Add product</Button>
<Button variant="outlined" loading>Saving…</Button>
```

### 2.2 Chip

`Chip` wraps `MuiChip`. Defaults:
- `bgColor: primary[400]` (#6AB399), `textColor: white`
- Accepts `bgColor` / `textColor` overrides; `icon`, `avatar`, `onDelete`, `deleteIcon`.

Common patterns:
- **Status chip** — small, filled, status-tinted. e.g. info → `bg: info[100]` `color: info.main`.
- **Tag chip** — `bg: #F2F4F7`, `color: #9AA0AA`.

### 2.3 Card

The app keeps cards simple — a white surface with `12px` radius and the standard card shadow. Use:

```tsx
<Box sx={{
  background: '#FFFFFF',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  padding: '16px',
}}>
  …
</Box>
```

There is also a domain-specific `Card` atom (payment method card) which combines title + sub-title + logo/chip — not a generic surface.

### 2.4 Inputs / Form fields

- `MuiInputBase` font size is locked to `1.6rem` (16px).
- `MuiFormLabel` is `1.6rem`.
- Helper text loses the default left margin (`MuiFormHelperText-root { margin-left: 0 !important; }`).
- Number inputs hide native spinners (Webkit + Firefox).
- Border radius follows theme `8px`.
- Placeholder: `#9AA0AA` (secondary 600).

### 2.5 Toggle button / IconButton

- ToggleButton hover: `bg: #D0E7DF`, `color: #25282D`.
- Selected: `bg: #6AB399`, `color: #FFFFFF`.
- IconButton hover: `bg: success[50]` (#F2F6E7), `color: secondary[700]`.

### 2.6 Menu / Dropdown / List

- Border radius `8px`.
- Background `white`, with `1px solid #f5f5f5` border and `0 4px 30px rgba(0,0,0,0.1)` shadow.
- Menu item hover: `rgba(0,0,0,0.04)`.

### 2.7 Accordion

- Boxshadow: `0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.12)`.
- Background `#000` (dark accordion variant) with text `#808080` is used in some surfaces; default light accordions are white.

### 2.8 Tabs

- Tab font size `1.4rem`.
- Tabs flex container gap: `2rem`.

### 2.9 Drawer (right side)

```css
.drawer-container { background: white; height: 100vh; display: flex; flex-direction: column; gap: 16px; padding: 16px 20px; }
.drawer-header    { display: flex; flex-direction: row; justify-content: space-between; align-items: center; }
.drawer-body      { height: calc(100vh - 11.5rem); overflow-y: scroll; gap: 24px; scrollbar-width: none; }
.drawer-footer    { display: flex; gap: 20px; justify-content: space-between; align-items: center; }
.drawer-divider   { width: calc(100% + 40px); margin-left: -20px !important; }
```

Hide scrollbars in drawers (`-ms-overflow-style: none; scrollbar-width: none;` + `::-webkit-scrollbar { display: none; }`).

### 2.10 Modals & dialogs

- Radius `10px` (some `12px`).
- Overlay background: `rgba(0,0,0,0.85)` for image/lightbox; lighter for confirms.
- Drop shadow: `0 0 15px 2px #EDEDED` for "error screen" / detached cards.

### 2.11 Toasts / Snackbar

The app uses a custom `Toast` + a `Toaster` from atoms. State-tinted backgrounds:
- Success → primary green
- Error → error[500] `#D74C10`
- Warning → warning[500] `#F0AF30`
- Info → info[500] `#6BA6FE`

Auto-hide ~5s. Position: top-center for buyer toasts.

### 2.12 Charts

Use **Recharts** (the Kai POC uses it). Default line color `#16885F`; secondary series should pick from primary 300 / info 500 / kai purple to keep the palette tight.

### 2.13 AI / Kai surfaces

When building anything labeled "AI", "Kai", or assistant-y, switch to the **purple accent**:
- Bubble bg: `#F6F3FD`
- Border: `#DDD4F5`
- Heading on light: `#4A2FA0`
- Primary action color: `#8155D9` (hover `#6240C8`)
- Header foreground (icon/text on purple bar): `#FFFFFF`

This visually separates AI from the green core product.

---

## 3. Page templates

### 3.1 App shell

```
┌──────┬───────────────────────────────────────────────┐
│      │  Topbar (sticky, white, z=999)               │
│      ├───────────────────────────────────────────────┤
│ Side │                                               │
│ bar  │   Content area (bg: #F7F8FA)                  │
│ 85px │   max-width container, gutter 16–24px         │
│      │   Cards on white, shadow-card                 │
│      │                                               │
└──────┴───────────────────────────────────────────────┘
```

- Sidebar: fixed, `width: 85px`, `zIndex: drawer`.
- Topbar: sticky, `top: 0`, `bg: #FFFFFF`.
- Content: offset `left: 70px` (legacy mismatch with sidebar width — keep parity if you copy the layout).
- Optional **impersonation banner** above the shell adds `30px` top margin to the grid.

### 3.2 Listing page (table)

- `breadcrumb-header` sticky on top, `bg: #F7F8FA`.
- `filter-header` sticky below it (`top: 59px` desktop), white.
- `filter-chips-header` sticky below filters (`top: 117px`).
- Table on white card, rounded `12px`, dotted dividers (`2px dotted rgba(0,0,0,0.12)`).

### 3.3 Detail page

- Page hero: H3 (28/700) + subtitle + CTA cluster (right-aligned).
- Two-column or single-column card stack with `24px` vertical rhythm.
- Sticky right-side action bar (`ReviewBottomBar` pattern) for transactional pages.

### 3.4 Empty / error states

- Centered card, radius `12px`, white, soft shadow `0 0 15px 2px #EDEDED`.
- Illustration + H3 title + Body2 description + primary `Button`.

---

## 4. Motion

The app's motion is restrained. Conventions seen in the Kai POC and broader admin:

| Token                 | Value     | Use                                           |
|-----------------------|-----------|-----------------------------------------------|
| `--stagger-delay`     | 200ms     | Between widget entrances                      |
| `--entrance-duration` | 400ms     | Fade-in / slide-in on cards & widgets         |
| Confirm button spinner| 300ms     | Showed before resolving destructive actions   |
| Thinking indicator    | 2000ms    | Before the first AI frame renders             |
| Inter-frame pauses    | 1400–1800ms | UC-3 multi-frame storytelling                |

Easing: default `ease-out` for entrances, `ease-in-out` for hovers. Avoid bounces.

---

## 5. Iconography

- Library: the `Icon` atom wraps Tabler Icons (`IconBuildingBank`, `IconPlus`, etc).
- Default size: `2rem` (`MuiSvgIcon` is overridden to `width/height: 2rem; fontSize: 2rem`).
- Color: inherits `currentColor`; pass `color={primary.main}` for branded icons.
- Inside tonal/info chips, scale to `0.75` for inline density.

---

## 6. Accessibility & resets

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

img { user-select: none; -webkit-user-select: none; }

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type='number'] { -moz-appearance: textfield; }

hr,
.MuiDivider-fullWidth {
  border: none;
  border-top: 2px dotted rgba(0,0,0,0.12);
  height: 0.1rem;
  margin: 1rem 0;
}
```

- All interactive elements should have `:focus-visible` styles. The app currently leans on MUI defaults — re-enable a clear focus ring (`outline: 2px solid #16885F; outline-offset: 2px`) in your prototype.
- Color contrast: `#16885F` on `#FFFFFF` passes AA at all sizes.

---

## 7. Quick-start CSS for a new prototype

Drop this into your prototype's global stylesheet to inherit the bones of the design system without pulling MUI:

```css
:root {
  /* Brand */
  --color-primary-50:  #E8F3EF;
  --color-primary-100: #D0E7DF;
  --color-primary-400: #6AB399;
  --color-primary-500: #16885F;
  --color-primary-600: #096645;
  --color-primary-700: #01442C;

  /* Neutrals */
  --color-secondary-100: #F2F4F7;
  --color-secondary-300: #EEF1F6;
  --color-secondary-400: #D1D6DD;
  --color-secondary-500: #B5BBC3;
  --color-secondary-700: #676D77;
  --color-secondary-800: #4F555D;
  --color-secondary-900: #25282D;

  /* Status */
  --color-error:   #D74C10;
  --color-warning: #F0AF30;
  --color-info:    #6BA6FE;
  --color-success: #7DA50E;

  /* AI / Kai */
  --color-ai-primary: #8155D9;
  --color-ai-bg:      #F6F3FD;
  --color-ai-border:  #DDD4F5;

  /* Surfaces */
  --bg-page:    #F7F8FA;
  --bg-surface: #FFFFFF;
  --bg-muted:   #F2F4F7;

  /* Text */
  --text-primary:   rgba(0,0,0,0.87);
  --text-secondary: rgba(0,0,0,0.6);
  --text-muted:     #676D77;
  --text-disabled:  rgba(0,0,0,0.3);

  /* Borders & dividers */
  --border-default: rgba(0,0,0,0.12);
  --border-subtle:  #F0F0F0;

  /* Radius */
  --radius-button: 8px;
  --radius-card:   12px;
  --radius-modal:  10px;
  --radius-chip:   999px;

  /* Shadow */
  --shadow-card:        0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-card-hover:  0 4px 12px rgba(0,0,0,0.10);
  --shadow-dropdown:    0 4px 30px rgba(0,0,0,0.10);
  --shadow-accordion:   0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.12);
  --shadow-error-card:  0 0 15px 2px #EDEDED;

  /* Motion */
  --duration-fast:    150ms;
  --duration-normal:  400ms;
  --stagger-delay:    200ms;

  /* Typography */
  --font-body: 'Satoshi', system-ui, -apple-system, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', monospace;
}

html { font-size: 10px; }
body { font-family: var(--font-body); background: var(--bg-page); color: var(--text-primary); -webkit-font-smoothing: antialiased; }

p, span { font-size: 1.4rem; }
*, body { font-family: var(--font-body); }
* { margin: 0; padding: 0; box-sizing: border-box; }
```

---

## 8. "Do / don't" cheat sheet

**Do**
- Use **Satoshi** with a **10px html base**, so `1.4rem = 14px`.
- Keep page bg **`#F7F8FA`**, content cards **white** with `12px` radius and the standard card shadow.
- Use **green `#16885F`** for the main CTA, **tonal green `#E8F3EF`** for secondary CTAs.
- Use **purple `#8155D9` + `#F6F3FD`** for any AI / Kai / agent surfaces.
- Cap headings at **700 weight**; body at 400/500.
- Sentence case all buttons and chips (`textTransform: none`).
- Use **2px dotted dividers**, not solid 1px lines.

**Don't**
- Don't use uppercase or letter-spaced labels — the app deliberately overrides MUI defaults.
- Don't use heavy MUI elevations on buttons (`boxShadow: none` is mandated).
- Don't mix the olive `#7DA50E` success ramp with the brand green `#16885F` for the same action — `success` is reserved for "increase / good" indicators (e.g. KPI deltas), not primary CTAs.
- Don't introduce new accent hues — extend an existing ramp instead.

---

_Source files referenced when extracting this system:_
- [src/App.css](src/App.css)
- [src/utils/light.theme.ts](src/utils/light.theme.ts)
- [src/common/@the-source/CustomText.tsx](src/common/@the-source/CustomText.tsx)
- [src/common/@the-source/atoms/Button/Button.tsx](src/common/@the-source/atoms/Button/Button.tsx)
- [src/common/@the-source/atoms/Chips/Chip.tsx](src/common/@the-source/atoms/Chips/Chip.tsx)
- [src/MainLayout.tsx](src/MainLayout.tsx)
- [index.html](index.html)

## Difference

Based on the provided images and the specifications in this design system, the following discrepancies have been identified:

1. **AI / Kai Headings**: In Image 3, the main heading ("Get any report you need in seconds") is rendered in black text. The design system explicitly specifies that headings on light backgrounds for AI surfaces should be purple (`#4A2FA0`).
2. **Card Surfaces**: The design system dictates that cards should have a `12px` border radius, no borders, and a standard drop shadow (`boxShadow: 0 1px 3px rgba(0,0,0,0.08)...`). In Images 1 and 2, the "Recommended", "Category", and "Collections" cards feature a clear solid 1px border and lack the specified shadow.
3. **App Shell Layout**: The design system mandates an App Shell with an `85px` fixed sidebar and a white sticky topbar. However, Images 3 and 4 completely abandon this layout shell, instead displaying a full-page interface with floating square action buttons on the left.
4. **Input Field Radius**: The chat input field in Images 3 and 4 is pill-shaped (fully rounded). The design system states that the border radius for inputs should follow the theme default of `8px`.
5. **Inline Error Banners**: Image 4 displays a static inline error banner with a light orange background and border. The design system only specifies floating Toasts/Snackbars positioned at the top-center for displaying error states.
6. **Dividers**: The design system explicitly overrides all dividers to be `2px dotted rgba(0,0,0,0.12)`. In the images (e.g., the Kai drawer header in Image 1), dividers appear as solid lines instead of dotted.
