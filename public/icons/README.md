# Icon Pack

Icons extracted from this repo, plus references to the icon libraries it depends on.

## Icon libraries used (from `package.json`)

These are rendered as React components at runtime — not stored as files in the repo. Install them in the target project to use the same icons:

| Library | Version | Install |
|---|---|---|
| `@mui/icons-material` | ^5.11.16 | Material Design icon set used with MUI components |
| `@tabler/icons-react` | 2.32.0 | Tabler outline icon set |
| `react-icons` | ^4.10.1 | Multi-pack wrapper (FontAwesome, Material, Feather, etc.) |

```bash
npm i @mui/icons-material @tabler/icons-react react-icons
```

## Bundled icon/illustration assets (copied into this folder)

| Folder | Source | Count | What's in it |
|---|---|---|---|
| `svg_icons/` | `src/assets/images/*.svg` | 93 | App-level SVG icons & empty-state illustrations |
| `images_icons_subdir/` | `src/assets/images/icons/` | 29 | Curated UI icon set (cart, calendar, avatar, etc.) |
| `menu_icons/` | `src/assets/images/menu/` | 8 | Sidebar / navigation menu icons |
| `filestack_icons/` | `src/assets/fileStackIcns/` | 10 | Filestack picker source icons (local, URL, Google Drive, etc.) — paired `*.png` + `*Alt.png` for active state |

Total bundled icon files: **140**.

> Brand logos (`logo*.png`, `favicon.ico`, `splashscreen_logo.png`) live in `public/` of the source repo and were intentionally **not** copied here — copy them separately if you need branding.
