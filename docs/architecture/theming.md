# Theming System

The site has light, dark terminal, and Catppuccin themes. Components use Tailwind `skin-*` utilities
backed by CSS custom properties in `site/src/lib/styles/app.css`; changing theme never requires a
second component palette.

## Semantic tokens

Core tokens cover page, text, border, and accent roles:

| Tailwind prefix        | CSS variable              | Role                        |
| ---------------------- | ------------------------- | --------------------------- |
| `skin-page`            | `--color-bg-page`         | Page and card background    |
| `skin-base`            | `--color-text-base`       | Primary text                |
| `skin-muted`           | `--color-text-muted`      | Secondary text and captions |
| `skin-border`          | `--color-border`          | Dividers and borders        |
| `skin-accent`          | `--color-accent`          | Links and primary actions   |
| `skin-accent-contrast` | `--color-accent-contrast` | Text on filled accents      |

Status colors are separate semantic pairs:

| Tailwind prefix                          | CSS variables             | Role                       |
| ---------------------------------------- | ------------------------- | -------------------------- |
| `skin-success` / `skin-success-contrast` | `--color-status-success*` | Positive or healthy state  |
| `skin-warning` / `skin-warning-contrast` | `--color-status-warning*` | Caution or partial state   |
| `skin-error` / `skin-error-contrast`     | `--color-status-error*`   | Error or destructive state |

Each base status color must pass WCAG AA as text on the page background and as a filled background
with its paired contrast token in all three themes. `pnpm run test:theme` enforces the contrast
contract.

Tailwind's `withOpacity()` mapping supports modifiers such as `text-skin-error/70` and
`bg-skin-success/10` without bypassing the theme.

## Terminal tokens are an exception

`terminal-*` tokens define the terminal window treatment: black/dark surfaces, body text, accent,
chrome, and borders. They are appropriate for terminal chrome and decorative cues, not general
success/error meaning. Status components must use semantic `skin-*` status tokens.

The small red, yellow, and green window-control circles are intentional terminal chrome. Platform
brand badges can use documented brand colors. Other hardcoded status colors are a regression.

## Theme values

The exact RGB triplets live in `site/src/lib/styles/app.css`:

- `:root` is the light theme;
- `html.dark` is the terminal theme;
- `html[data-theme="catppuccin"]` is Catppuccin Mocha.

Keep the full token set in every block. CSS values use comma-separated RGB triplets so Tailwind can
apply opacity. Do not duplicate the numbers in components or documentation when a semantic name is
sufficient.

## Detection and persistence

The inline script in `site/src/app.html` runs before hydration to avoid a theme flash. It reads the
theme preference from `localStorage`, otherwise follows `prefers-color-scheme`. `ThemeToggle.svelte`
cycles light, dark, and Catppuccin and persists the selection.

The user theme preference is intentionally durable. That does not imply that sensitive AI content
should use durable browser storage; Chat uses `sessionStorage`.

## Typography and effects

The Tailwind Typography plugin maps its prose variables to the same page/text/accent tokens. Markdown
therefore follows the active theme without route-specific prose palettes. Headings and code retain the
monospaced identity.

The scanline overlay is fixed and ignores pointer input. It is lighter in the light theme. Selection,
focus, prose, and status-specific scanline effects also use semantic tokens. Motion and cross-page
transitions must respect `prefers-reduced-motion`, and print rules must reveal content that may not
have entered the viewport.

## Component rules

- Use `skin-*` for all theme-aware UI.
- Use the semantic status pair matching the meaning; do not use accent as a generic success color.
- When using a filled semantic background, use its matching `*-contrast` text token.
- Reserve `terminal-*` for fixed terminal surfaces and chrome.
- Prefer opacity modifiers and borders over adding one-off color variables.
- Test all three themes, focus states, and reduced motion.
- Pair terminal-flavored labels with plain-language descriptions when meaning would otherwise be
  opaque.

## Adding or changing a theme

1. Add a complete token block in `site/src/lib/styles/app.css`.
2. Confirm page, muted, accent, and all status/contrast combinations meet their contrast targets.
3. Update pre-hydration detection and `ThemeToggle.svelte` if the theme is new.
4. Review scanline opacity, selection, prose, focus, dialogs, and print behavior.
5. Run `pnpm run test:theme`, `pnpm run test:ui`, and the production build.
