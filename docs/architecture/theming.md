# Theming System

## Overview

The site supports three themes using CSS custom properties. All theme-aware styling flows through Tailwind's `skin-*` utility classes, which resolve to CSS variables at runtime.

## CSS Custom Properties

Defined in `site/src/lib/styles/app.css`:

### Light Theme (`:root` default)

| Variable | Value | Description |
|----------|-------|-------------|
| `--color-bg-page` | `250, 250, 250` | zinc-50 background |
| `--color-text-base` | `24, 24, 27` | zinc-900 text |
| `--color-text-muted` | `63, 63, 70` | zinc-700 secondary text |
| `--color-border` | `228, 228, 231` | zinc-200 borders |
| `--color-accent` | `4, 120, 87` | emerald-700 primary action |
| `--color-accent-contrast` | `255, 255, 255` | text on accent backgrounds |
| `--color-terminal-accent` | `74, 246, 38` | neon green (terminal effects) |
| `--color-terminal-black` | `12, 12, 12` | terminal background |

### Dark Theme (`html.dark`)

| Variable | Value | Description |
|----------|-------|-------------|
| `--color-bg-page` | `12, 12, 12` | near-black background |
| `--color-text-base` | `204, 204, 204` | light gray text |
| `--color-text-muted` | `113, 113, 113` | dim gray secondary |
| `--color-border` | `30, 30, 30` | subtle borders |
| `--color-accent` | `34, 197, 94` | green-500 |
| `--color-accent-contrast` | `12, 12, 12` | dark text on accent |

### Catppuccin Theme (`html[data-theme="catppuccin"]`)

| Variable | Value | Description |
|----------|-------|-------------|
| `--color-bg-page` | `30, 30, 46` | Mocha base |
| `--color-text-base` | `205, 214, 244` | Mocha text |
| `--color-text-muted` | `166, 173, 199` | Mocha subtext |
| `--color-border` | `49, 50, 68` | Mocha surface0 |
| `--color-accent` | `166, 227, 161` | Mocha green |
| `--color-accent-contrast` | `30, 30, 46` | Mocha base (for contrast) |

## Tailwind Mapping

In `site/tailwind.config.cjs`, the `withOpacity()` helper wraps CSS variables so they work with Tailwind's opacity modifiers:

```javascript
// withOpacity('--color-accent') produces:
// bg-skin-accent     → rgb(var(--color-accent))
// bg-skin-accent/50  → rgba(var(--color-accent), 0.5)
```

### Available `skin-*` Classes

| Class prefix | Variable | Usage |
|-------------|----------|-------|
| `skin-page` | `--color-bg-page` | Page/card backgrounds |
| `skin-base` | `--color-text-base` | Primary text |
| `skin-muted` | `--color-text-muted` | Secondary text, captions |
| `skin-border` | `--color-border` | Borders, dividers |
| `skin-accent` | `--color-accent` | Links, buttons, highlights |
| `skin-accent-contrast` | `--color-accent-contrast` | Text on accent backgrounds |

### Fixed `terminal-*` Classes

These do **not** change with theme (except `terminal-green` which uses the accent variable):

| Class | Value | Usage |
|-------|-------|-------|
| `terminal-black` | `var(--color-terminal-black)` | Terminal backgrounds |
| `terminal-dark` | `#1e1e1e` | Terminal chrome |
| `terminal-green` | `var(--color-terminal-accent)` | Terminal text/accents |
| `terminal-dim` | `#2d2d2d` | Terminal secondary |
| `terminal-text` | `#cccccc` | Terminal body text |

## Theme Detection Flow

1. **Before hydration** (`app.html` inline script):
   - Check `localStorage.getItem('theme')`
   - Fall back to `window.matchMedia('(prefers-color-scheme: dark)')`
   - Apply `html.dark` class and/or `data-theme` attribute
2. **Runtime** (`ThemeToggle.svelte`):
   - Cycles: light → dark → catppuccin → light
   - Persists choice to localStorage
   - Manipulates `document.documentElement` classes/attributes

## Special Effects

### Scanlines Overlay (`app.css`)

Terminal-style horizontal lines across the entire page:
- Fixed position, `z-index: 30`, `pointer-events: none`
- Opacity: 0.15 (dark/catppuccin), 0.05 (light)
- Uses repeating-linear-gradient for the line pattern

### Selection Color (`app.css`)

```css
::selection {
  background-color: rgba(var(--color-accent), 0.3);
  color: rgb(var(--color-text-base));
}
```

### Terminal Blink Animation (`tailwind.config.cjs`)

Used for cursor effects in the terminal-style navbar:
```css
animation: terminal-blink 1s step-end infinite;
```

## Typography Integration

The `@tailwindcss/typography` prose classes are fully theme-aware. All `--tw-prose-*` variables in `tailwind.config.cjs` map to the CSS custom properties, so markdown content automatically adapts to the active theme. Headings use `font-mono` for the terminal aesthetic.

## Adding a New Theme

1. Add a new CSS variable block in `app.css` with a selector (e.g., `html[data-theme="newtheme"]`)
2. Define all 8 color variables using RGB triplet format (e.g., `30, 30, 46`)
3. Update `ThemeToggle.svelte` to include the new theme in the cycle
4. Update the `app.html` inline script to handle the new theme on initial load
5. Update scanlines opacity if needed
