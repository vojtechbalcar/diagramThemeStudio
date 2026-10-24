# Linework — Graphics Standards Manual

> Working name: **Linework**. Rename freely; the name appears in only one place (the system band, §3.1).
>
> This manual is the single source of truth for how Linework looks and behaves. It is written in the spirit of the 1970 NYC Transit Authority Graphics Standards Manual (Unimark International / Massimo Vignelli & Bob Noorda): a small set of basic elements, applied with total consistency. **It is an homage to a method, not a reproduction of a brand.** Never use MTA/NYCT names, logos, route letters, or the official route-line colour/letter pairings anywhere in the product.

---

## Section 0 — Introduction

### 0.1 Purpose of the product
Linework turns a brand's design tokens into a Mermaid diagram theme. The user pastes or edits tokens, maps them to diagram roles, sees every diagram type re-themed live, gets a contrast verdict for every text/fill pair, and exports a ready-to-paste theme config.

### 0.2 Purpose of this manual
Every screen, component, and state in Linework must be buildable from the elements in Section 1 alone. If something you are building needs a new colour, a new type size, a new radius, or a new kind of decoration, the answer is no — use what exists, or change this manual first.

### 0.3 Governing principles
1. **Information first.** A transit sign exists to get someone to the right platform. Every element in Linework exists to help the user judge or export a theme. Decoration that carries no information is removed.
2. **The user's colours are the only colours.** The interface is black, white and greys. The single signal red is reserved for failures and destructive actions. Anything chromatic on screen came from the user's tokens.
3. **One module, everywhere.** All sizes derive from the base unit and the band module (§1.1). Nothing is placed "by eye".
4. **Consistency over cleverness.** A component looks and behaves the same in every location. A band is always a band.
5. **Mixed case, plain words.** Vignelli's signs use upper- and lowercase because it reads faster. Labels are short, concrete nouns or verbs: "Export", "Tokens", "Contrast". No all-caps sentences, no jokes in UI copy.

---

## Section 1 — Basic elements

### 1.1 Unit, module and grid

| Name | Value | Use |
|---|---|---|
| Base unit `u` | 4px | All spacing is a multiple of `u`. |
| Band module `M` | 48px (12u) | Height of every band (§1.4), standard control height for primary actions, row height in the token list. |
| Half module `M/2` | 24px | Compact control height, icon tile size, gutter. |
| Rule | 1px | Hairline dividers between rows and panels. |
| Heavy rule | 2px | Outer frame of a sign panel; focus ring width. |

**Spacing scale (only these values):** 4, 8, 12, 16, 24, 32, 48, 64, 96.

**Layout grid (desktop ≥ 1280px):**
- 12 columns, 24px gutters, 24px outer margins.
- The token panel occupies columns 1–3 (min 320px, max 384px).
- The canvas occupies columns 4–12.
- The export drawer overlays columns 9–12 when open.

**Vertical rhythm:** baseline of 4px. All text line-heights are multiples of 4.

**Visible grid:** the grid is *not* drawn on screen as decoration. Structure is shown by bands and rules, the way a sign system shows it with panels and mounting rails.

### 1.2 Colour

#### 1.2.1 Interface palette
The interface uses an achromatic palette. These are the only colours the chrome may use.

| Token | Hex | Use |
|---|---|---|
| `--lw-black` | `#0B0B0B` | Light-mode interface ink (§1.2.5) and band fill. Never pure #000 — it vibrates against white at large sizes. |
| `--lw-white` | `#FFFFFF` | Light-mode page, dark-mode interface ink, text on bands. |
| `--lw-grey-50` | `#F4F4F4` | Recessed areas: input fields, inactive tabs, canvas "gutter" between panels. |
| `--lw-grey-200` | `#D6D6D6` | Hairline rules, disabled borders. Ink hover in dark mode and inside bands; muted text inside bands. |
| `--lw-grey-500` | `#6B6B6B` | Secondary text, placeholders, metadata. 5.3:1 on white, 4.8:1 on `--lw-grey-50` — both pass AA. |
| `--lw-grey-800` | `#2E2E2E` | Ink hover in light mode; secondary band fill in light mode. |
| `--lw-signal` | `#D7261E` | **Failure and destruction only**: a contrast fail mark, an invalid token, "Delete set". Never for emphasis, branding, or selection. |

Components never name these hexes directly; they use the semantic tokens in §1.2.5 and §7, which carry the dark-mode values.

**Selection, focus and active state use ink, not a colour.** A selected row is inverted (`--lw-ink` fill, `--lw-on-ink` text). Focus rings follow §1.2.6.

#### 1.2.2 The user's colours
- User tokens appear in exactly three places: token bullets (§1.6), the rendered diagrams, and the colour strip (§3.6).
- The chrome never tints itself with user colours (no themed buttons, no coloured scrollbars, no gradients from the palette).

#### 1.2.3 Preview surfaces
The canvas background behind diagrams is switchable, because judging a theme requires it:
- **Paper** `#FFFFFF`
- **Ink** `#0B0B0B`
- **Brand** — the user's own background token

The switch lives in the canvas toolbar (§3.3). The default is the user's `background` token if mapped, otherwise Paper.

The Ink surface is a fixed preview colour. It does not follow the interface mode and is not the same thing as the `--lw-ink` token (§1.2.5).

#### 1.2.4 Dark interface
Transit signage is white on black; the manual pages are black on white. Linework uses both:
- **Light mode (default):** white page, black bands — the manual page.
- **Dark mode:** black page `#0B0B0B`, bands become `#1E1E1E` with a 1px `#3A3A3A` bottom rule (`--lw-band-rule`), secondary bands `#262626`, text and interface ink white, rules `#2E2E2E`, secondary text `#9A9A9A`, signal `#FF4B3E` (raised for contrast on dark).
- Mode follows `prefers-color-scheme`, with a manual toggle in the system band. The preview surface (§1.2.3) is independent of the interface mode.

#### 1.2.5 Interface ink
Where this manual says an element is "black", it means **interface ink**, not the hex `#0B0B0B`. Ink is the foreground of the surface an element sits on, so the chrome inverts cleanly in dark mode.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--lw-ink` | `#0B0B0B` | `#FFFFFF` | Primary text, primary button fill, heavy rules and frames, selected-row fill, arrow tiles, index and step bullets, Pass and Large-only symbols, toggle on, loading bar, focus ring. |
| `--lw-on-ink` | `#FFFFFF` | `#0B0B0B` | Text and glyphs on an ink fill. |
| `--lw-ink-hover` | `#2E2E2E` | `#D6D6D6` | Hover fill of ink elements. |

**Ink scopes.** Some surfaces redefine ink for everything inside them, so a component never has to ask where it is:
- **Page** — the values above, following the interface mode.
- **Band** (primary and secondary, §1.4) — ink becomes `--lw-band-text`, on-ink becomes the band's fill, ink hover and muted text become `--lw-grey-200`. An index bullet in a card band is therefore a white circle with a dark numeral, and the Export button is the one white object on the system band.
- **Inverted** (selected row, selected segment) — ink and on-ink swap for the element's contents.
- **Preview surface** (§1.2.3) — ink is `#0B0B0B` on Paper, `#FFFFFF` on Ink, and whichever of the two has the higher contrast on Brand; on-ink is the other one. Leader lines and label tiles (§3.5) use these, so they follow the preview surface, not the interface mode.

#### 1.2.6 Focus ring
- 2px solid. Never removed.
- The ring always contrasts with the surface it is drawn on: `--lw-ink` on the page, `--lw-on-ink` on an ink fill, `--lw-band-text` on bands. (In light mode `--lw-band-text` and `--lw-on-ink` are the same white; in dark mode the band is `#1E1E1E`, so the ring stays white rather than taking on-ink `#0B0B0B`.)
- Free-standing controls draw the ring outside, offset 2px. Text buttons carry 4px of invisible side padding (cancelled by an equal negative margin) so the ring clears the glyphs.
- Full-width rows and joined segments draw it **inset**: offset −4px, so the 2px ring sits 2px inside the edge with the element's own fill on both sides. A panel edge never clips it and a neighbouring frame never swallows it. Because it sits on the element's fill, a selected (inverted) row gets an `--lw-on-ink` ring.

### 1.3 Typography

#### 1.3.1 Typefaces
| Role | Typeface | Fallback | Notes |
|---|---|---|---|
| Interface (everything) | **Inter** (variable, self-hosted via `next/font`) | `Helvetica Neue, Helvetica, Arial, sans-serif` | Stands in for Helvetica / Standard Medium. If a licence for Helvetica Now is ever available, it replaces Inter with no other changes. |
| Values (hex, token paths, ratios, code) | **JetBrains Mono** | `ui-monospace, SFMono-Regular, Menlo, monospace` | Only for machine values. Never for labels or headings. |

Inter settings: `font-feature-settings: "tnum" 1, "cv11" 1;` for tabular figures wherever numbers align (ratios, counts). Default UI weight is **500 (Medium)** — the manual's signs are set in a medium weight, not regular.

#### 1.3.2 Type scale
Only these styles exist.

| Style | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 64 / 64 | 700 | −0.03em | Empty-state numerals, landing hero only. |
| `title` | 28 / 32 | 700 | −0.02em | Page title on landing/about. |
| `band` | 20 / 24 | 700 | −0.01em | Text inside bands. |
| `heading` | 15 / 20 | 700 | 0 | Section headings inside panels. |
| `body` | 15 / 20 | 500 | 0 | Default interface text. |
| `small` | 13 / 16 | 500 | 0 | Metadata, helper text, table cells. |
| `micro` | 11 / 16 | 600 | +0.02em | Figure numbers, status counts. The only size allowed below 13px. |
| `mono` | 13 / 16 | 500 | 0 | Values. |
| `mono-small` | 11 / 16 | 500 | 0 | Values in dense tables. |

#### 1.3.3 Typesetting rules
- Flush left, ragged right. Never centred, except a numeral inside a bullet.
- Upper- and lowercase always. The only all-caps text allowed: hex values (`#1A2B3C`) and WCAG levels (`AA`, `AAA`).
- One space between items in a band; separate groups with an 8px gap, not with punctuation or pipes.
- Numerals that compare (ratios, counts) use tabular figures and are right-aligned in columns.
- No italics. No underlines except on inline text links (1px, offset 3px).

### 1.4 The band
The band is Linework's signature element, taken from the black band that carries every NYC transit sign.

**Specification:**
- Height `M` (48px). Full width of its container.
- Fill `--lw-band`; text `--lw-band-text`, style `band`, left padding 16px. In dark mode a 1px `--lw-band-rule` runs along the bottom edge, inside the 48px.
- A **pinstripe** in `--lw-band-text`, 2px high, runs the full width, inset 6px from the top edge. It is the one purely structural ornament in the system and appears only on bands.
- Content order, left to right: optional bullet (§1.6) → title → flexible space → status / actions (right-aligned, 16px right padding).
- Bands never have rounded corners, shadows, or gradients.
- A band is an ink scope (§1.2.5): bullets, buttons, symbols and focus rings inside it invert automatically.

**Where bands are used:** the system band (top of app), the header of every panel (Tokens, Mapping), the header of every diagram card, the export drawer header. Nowhere else. A band always means "this is the top of a unit".

**Secondary band:** 32px high, `--lw-band-2` fill (`#2E2E2E` light, `#262626` dark), `--lw-band-text` text, no pinstripe, `small` text weight 600. Also an ink scope. Used for sub-sections inside a panel (e.g. "Colours", "Typography" inside Tokens).

### 1.5 Rules and frames
- Panels are separated by a 1px `--lw-rule-color` rule, never by gaps with shadows.
- A **sign panel** (diagram card, §3.4) has a 2px ink outer frame. That is the only place the heavy rule frames an object.
- Rows in lists/tables are separated by 1px `--lw-rule-color` rules, full width, no zebra striping.
- **Corner radius is 0 everywhere**, with one exception: bullets are perfect circles.
- **No shadows anywhere.** Elevation (drawer, menu, dialog) is shown by a 2px ink frame plus a full-width band header.

### 1.6 Bullets
A bullet is a filled circle containing a short identifier — the route-bullet idea, re-purposed.

| Size | Diameter | Text |
|---|---|---|
| Large | 32px | `heading` 700, 15px |
| Standard | 24px | `small` 700, 13px |
| Small | 16px | `micro` 700, 11px |

**Three uses, and only three:**
1. **Diagram index** — ink circle, on-ink numeral: `1` Flowchart, `2` Sequence, `3` Entity relationship, `4` Gantt, (`5` State, `6` Class, `7` Pie, `8` Timeline in v2). The numbers are fixed; a diagram type keeps its number everywhere. Inside a band it inverts through the band's ink scope (§1.2.5).
2. **Token bullet** — filled with the token's own colour; the glyph is the first letter of the token's role (`P` primary, `S` secondary, `T` tertiary, `L` line, `B` background, `N` note). Glyph colour is chosen automatically: `#0B0B0B` or `#FFFFFF`, whichever has higher contrast against the fill. This depends on the user's colour, not the interface mode, so these two stay fixed. If the fill is within 1.1:1 of the page background, add a 1px ring so the bullet does not disappear: `--lw-grey-500` in light mode, `--lw-text-muted` in dark.
3. **Step numbers** — outline circle (2px ink ring, ink numeral) for the three-step flow on the landing page and empty state: `1` Add tokens, `2` Map roles, `3` Export.

Never put words in bullets. Never use letters A–Z in an index bullet (that reads as a subway route).

### 1.7 Arrows
One arrow shape, drawn once as an SVG component, rotated in 45° increments only.
- Construction: on a 24×24 grid, a 3px stroke shaft and a 90° head whose arms are 9px long, square line caps, mitred join. Stroke weight matches `band` text weight.
- **Arrow tile:** the arrow centred in an ink square, on-ink arrow. A 48×48 tile holds the arrow at 24px. A 24×24 tile holds it at 16px, so the stroke scales to 2px and matches the symbols (§1.8). Used for primary directional actions: "Export", "Open in Mermaid Live", "Next step".
- **Inverted tile:** on-ink square, ink arrow, framed by a 2px ink rule drawn inside its edge. Used at the right edge of a primary button; the frame takes the button's hover fill. Without the frame the tile is the colour of the surface around the button and reads as a stray arrow.
- Bare arrows (no tile) in ink for inline links: "Read the docs →" uses the component, never the `→` character.

### 1.8 Symbols
Linework has a closed symbol set. Each is drawn on a 24px grid with the same 2px stroke, square caps, no fills except where stated. Do not add an icon library.

| Symbol | Meaning | Construction |
|---|---|---|
| Pass | Contrast pass | Filled ink circle 16px with an on-ink check (2px stroke). |
| Large-only | Passes AA for large text only | 2px ink ring 16px, ink check inside. |
| Fail | Contrast fail | Filled `--lw-signal` circle 16px with a `#FFFFFF` ✕ (2px). White stays white in both modes: 5.0:1 on the light signal, 3.3:1 on the dark one, so it clears 3:1 for non-text either way. |
| Copy | Copy to clipboard | Two offset squares, 12px. |
| Plus / Minus | Add / remove token | 12px cross / bar, 2px. |
| Close | Close a dialog or drawer | 12px ✕, 2px. |
| Swap | Swap surface | Two opposed arrows (§1.7 construction, scaled). |
| Sun / Moon | Interface mode | Circle with 8 ticks / crescent from two circles. |
| Warning | Parse warning | Equilateral triangle outline with a 2px bar and dot. |

Symbols are drawn in the current ink unless the table names another colour, so they invert with their scope (§1.2.5).

Pass/fail must never rely on colour alone: the glyph shape (check vs ✕) and the ratio number always accompany it.

---

## Section 2 — Voice and content

### 2.1 Labels
- Nouns for places: "Tokens", "Mapping", "Canvas", "Export".
- Verbs for actions: "Import", "Copy", "Reset", "Share link".
- Never "Click here", "Oops", "Awesome", emoji, or exclamation marks.

### 2.2 Numbers and values
- Contrast ratios: one decimal, colon notation, mono: `4.8:1`. Truncate, never round, so a displayed `4.5:1` always passes AA (4.48 shows as `4.4:1`).
- Hex: uppercase, six digits, mono: `#1F6FEB`. Accept 3- and 8-digit input but display normalised 6-digit (alpha shown separately as `80%`).
- Token paths: as written by the user, mono: `color.brand.primary`.

### 2.3 Messages
Messages read like a sign: what is happening, then what to do.
- Parse error: "Line 14 is not valid JSON. Check for a missing comma."
- Contrast fail: "Text on primary fails: 2.9:1. Needs 4.5:1."
- Empty canvas: "No tokens yet. Paste a token file or start from a preset."

---

## Section 3 — Application of the system

### 3.1 App shell (desktop)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│ ← pinstripe
│ Linework   Untitled set                         Import  Share link  [→ Export]│ ← system band (black, 48)
├──────────────────────┬───────────────────────────────────────────────────────┤
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│ Surface: Paper  Ink  Brand     7 pairs · 6 ● · 1 ✕   │ ← canvas toolbar (white, 48)
│ Tokens            ⊕  ├───────────────────────────┬───────────────────────────┤
├──────────────────────┤▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ Colours              │ (1) Flowchart        ● 3  │ (2) Sequence         ● 2  │ ← card bands
│ (P) primary  #1F6FEB │                           │                           │
│ (S) secondary #F2C94C│      [rendered diagram]   │      [rendered diagram]   │
│ (L) line     #0B0B0B │                           │                           │
│ ...                  ├───────────────────────────┼───────────────────────────┤
│ Typography           │ (3) Entity relationship ✕1│ (4) Gantt            ● 2  │
│ font  Inter          │                           │                           │
│ size  14             │      [rendered diagram]   │      [rendered diagram]   │
├──────────────────────┤                           │                           │
│ Mapping              │                           │                           │
├──────────────────────┴───────────────────────────┴───────────────────────────┤
│ ███ ███ ███ ███ ███ ███   colour strip                                        │ ← §3.6 (48)
└──────────────────────────────────────────────────────────────────────────────┘
```

- **System band:** product name (`band` 700) left; set name (`body` 500, muted band text `--lw-grey-200`) editable inline; right side: Import (text button), Share link (text button), Export (primary button with arrow tile; through the band's ink scope it is white with a dark label — the one white object on the band). Mode toggle at the far right: an icon button (§3.9) showing the current mode (Sun in light, Moon in dark), named "Dark mode" and marked pressed when dark is on. Choosing the mode the system already prefers clears the stored choice, so the interface follows `prefers-color-scheme` again.
- **Token panel:** band "Tokens" with Plus symbol; secondary bands per group; scrolls independently.
- **Mapping panel:** below Tokens on the same column, band "Mapping"; can be collapsed to its band.
- **Canvas:** toolbar + 2×2 grid of sign panels; grid becomes 1 column below 1024px of canvas width. Cards are equal height (min 360px).
- **Colour strip:** fixed bottom, 48px.

The editor exposes Import, Share link, Export and the mode toggle in the system band, with the set name edited in the token panel. Below 768px, Import moves into the Tokens view, sharing is available in the Export view's Share link tab, and the system band keeps only the name and mode toggle. A joined Tokens / Canvas / Export control follows the band.

### 3.2 Token panel
**Token row** (height `M`):
`[bullet 24] [token name, body] ........ [hex, mono] [swatch-edit]`
- Hover: row fill `--lw-recess`.
- Selected/editing: row inverted (`--lw-ink` fill, `--lw-on-ink` text; an inverted scope, §1.2.5); an inline editor opens below the row: hex input, native colour picker trigger (styled as a 24px square swatch with 1px ink frame), and the token path.
- Focus: inset ring (§1.2.6).
- An unmapped colour token has an empty colour bullet until it has a role; no placeholder letter is invented.
- Invalid value: hex text in `--lw-signal` + Warning symbol + message on the following line in `small`.
- Rows are separated by 1px rules. No cards, no pills.

**Import:** a dialog (§3.7) with three tabs — "Token file (JSON)", "CSS variables", "Figma variables" — each a monospace textarea with line numbers. Parse on paste; show detected token count in `micro` ("24 colours, 2 fonts found").

**Presets:** a list of 4 neutral presets (e.g. "Ink & paper", "Signal", "Forest", "Night") shown as rows of bullets. Presets are originals, never real-company palettes.

### 3.3 Mapping panel
A two-column table: **Role** (Mermaid role, `body`) → **Token** (select showing the token bullet + name).
- Roles (v1): Primary fill, Primary text, Primary border, Secondary fill, Tertiary fill, Line, Background, Note fill, Note text, Font family, Font size.
- Each row has a contrast symbol at the far right when the role is a text/fill pair.
- "Auto-map" text button in the band: guesses mappings by token name (`primary`, `bg`, `text`, `border`…). Its guesses are marked with a 6px outline dot until the user confirms them.

### 3.4 Diagram card (the sign panel)
- 2px ink frame.
- Band: index bullet (numeral; inverted by the band's ink scope) + diagram name + right side contrast summary: worst result symbol + count, e.g. `✕ 1` or `● 3`.
- Body: the rendered SVG on the chosen preview surface, padding 24px, centred **within the card** (the only centred object in the system — a diagram is a picture, not text). The body is a preview-surface ink scope (§1.2.5).
- Footer (32px, `--lw-page` fill, top 1px rule): `micro` text "Fig. 1 — Flowchart" left; "Copy SVG" and "Open in Mermaid Live" right.
- The footer may grow by one text row when its actions cannot fit beside the figure label. All actions keep a 24px minimum hit target.
- Hover on the diagram: no zoom, no shadow. Click opens the card full-canvas (focus mode) with the source text editable in a mono panel on the right half.
- Focus mode is a framed, inset-24px dialog with a band, a proofing pane on the left and source on the right. Below 768px it fills the viewport and stacks proofing above source. Escape/Close returns focus to the diagram trigger. Each diagram can be reset independently.
- Source edits change structure and labels and persist for this session only; the theme share format remains unchanged. Copy SVG and Mermaid Live use the edited source. Matching diagram headers and a 30,000-character limit are enforced; init/frontmatter, source style overrides (including sequence rect/box groups) and link/click interactions are rejected so theme contrast stays governed by tokens.

### 3.5 Contrast annotations
The proofing marks — the feature that makes Linework a designer's tool.
- Every text/fill pair in a diagram gets an annotation in the card's **contrast list**, revealed by toggling "Show contrast" in the canvas toolbar (on by default).
- Annotation = symbol (Pass / Large-only / Fail) + ratio (`mono`) + pair name (`small`): `✕ 2.9:1  Primary text on primary fill`.
- In focus mode, annotations are drawn *on* the diagram as leader lines: a 1px line in the preview surface's ink (§1.2.5) from the element to a label tile (on-ink fill, 1px ink frame, `mono-small` in ink). Leader lines run horizontal or at 45° only, never at arbitrary angles.
- Focus leaders anchor representative elements actually present in the SVG. Missing features have no leader; the complete theme-pair list remains below the proof. The annotation rail uses 176px tiles; on phones the proof scrolls horizontally within its pane. Leaders and tiles use preview-surface ink, independent of interface mode. Repeated SVG views receive separate IDs for CSS/markers.
- Thresholds: WCAG 2.x — 4.5:1 normal text (AA), 3:1 large text and non-text elements such as lines against background, 7:1 shown as AAA.
- Checks use Mermaid's resolved theme variables. Entity attributes include both alternating row fills; Gantt includes its section title and outside task text against the section fill composited at Mermaid's 20% opacity. These are separate pairs because derived fills can fail when the primary fill passes.
- State diagrams use their resolved state, note and transition colours. Transition-label backgrounds are composited at Mermaid's 50% opacity over the current surface; node and transition text have separate checks and SVG leaders.

### 3.6 Colour strip
Fixed bar along the bottom: every colour token as a 48px-high block, width proportional (equal widths). Below each block, inside it, the hex in `mono-small`, colour auto black/white. Clicking a block selects that token in the panel. It is the "line map" of the palette — the Dribbble shot lives here.

Blocks have a 96px minimum width to keep six-digit hex values readable; the strip scrolls horizontally when the palette cannot fit. The selected block has a small outline square, so selection does not depend on colour.

### 3.7 Dialogs, drawers, menus
- **Export drawer:** slides from the right, 2px ink left frame, band header "Export", body is a title block (§3.8) followed by output tabs: "Init directive", "mermaid.initialize()", "JSON", "Share link". Each tab: mono code block with a Copy button (arrow-free text button + Copy symbol) at top right.
- The export drawer is at most 640px wide and fills the viewport height, with a sticky band header. Its four tabs form a joined two-column group so the full `mermaid.initialize()` label stays readable on phones. The code block is a read-only, selectable mono field with horizontal scrolling and a 320px starting height.
- JSON contains the complete Mermaid configuration object. All config formats use the selected preview surface when compositing alpha, preserve unmapped roles as derived and match the preview's strict/base/classic/text-label settings. The init directive remains available for existing integrations; its helper text points new integrations to Mermaid's configuration API.
- Copy feedback appears within the active export panel as well as in the toast, so it stays available to screen readers inside the modal. A failed clipboard write leaves the selectable output available for manual copying.
- **Dialog:** centred, max 640px, 2px ink frame, band header with title and close (Close symbol in a 24px icon button, §3.9), page behind gets a `rgba(11,11,11,0.6)` scrim in both modes.
- **Menu/select:** 2px ink frame, rows `M/2`… `M` high, selected row inverted. No shadows.

### 3.8 Title block (export)
Borrowed from technical drawings and the manual's specimen pages. A ruled table at the top of the export drawer:

| Set | Untitled set |
|---|---|
| Tokens | 9 colours, 1 font |
| Contrast | 6 pass, 1 fail |
| Mermaid | base theme, v11+ |
| Date | 19 Oct 2026 |

1px rules between cells, labels in `small` `--lw-grey-500`, values in `body`/`mono`. If any contrast fail exists, the Contrast row value is `--lw-signal` and the drawer shows a line: "Export is allowed, but 1 pair fails contrast."

The title block shows "Checking contrast…" while a newer theme is rendering and "Unavailable" after a render error; it never presents stale results as current. Large-text-only results have a separate count. Export is allowed in all three cases. The date is the current local date.

### 3.8.1 Shared state
Share links contain the complete version-1 token set: name, tokens (including alpha and source), mappings (including auto-map confirmation), and preview surface. The public format is `/editor#lw=1.<base64url-deflate>`. The fragment is decoded and validated locally; it needs no backend. The current editor URL follows committed edits after a 200ms debounce without adding browser-history entries. Back/forward and hash navigation restore validated sets; malformed links preserve the current set and show a toast.

The encoded fragment is limited to 64,000 characters and decompressed input to 1,000,000 bytes. Oversized sets stay editable; sharing reports that the set needs fewer tokens. Share URLs use the current origin and omit unrelated query parameters. Interface mode and transient UI state (open panels, selected token, contrast visibility) are not shared.

### 3.9 Buttons and controls
| Control | Spec |
|---|---|
| Primary button | Height `M`, `--lw-ink` fill, `--lw-on-ink` `body` 700 text, 16px padding, optional arrow tile flush at the right edge (48×48 inverted tile, §1.7; it replaces the right padding). Hover `--lw-ink-hover`. Pressed: translate 1px down, no colour change. |
| Secondary button | Height `M` (`body` 700) or `M/2` (`small` 700, because a 24px button with a 2px frame leaves 20px inside). `--lw-page` fill, 2px ink frame, ink text. Hover: `--lw-recess` fill. |
| Text button | No frame, ink text 600, underline on hover only (1px, offset 3px). Inside bands the ink scope makes it band text. Used in bands and toolbars. |
| Icon button | 24×24 hit target, no fill, the symbol in ink. Hover and pressed: inverted (ink fill, on-ink symbol). Always has an accessible name. Used for Plus in the Tokens band, Close in dialog bands and the mode toggle. |
| Destructive | Secondary button with `--lw-signal` text and frame. Always asks for confirmation in a dialog. |
| Segmented control | Joined secondary buttons sharing one 2px ink frame, selected segment inverted. Inset focus ring (§1.2.6). Used for preview surface and import tabs. |
| Input | 48px (`M`) high, or 32px in dense tables — no other heights. `--lw-recess` fill, 1px `--lw-rule-color` bottom rule only; focus → 2px ink bottom rule + focus ring. |
| Toggle | 48×24 track (`M` × `M/2`): off = `--lw-page` fill, 2px ink frame, ink thumb; on = ink fill, on-ink thumb. Thumb is a square 16px, not a circle (circles are reserved for bullets), and travels 24px. Built on a switch (`role="switch"`). |
| Disabled | 40% opacity is **not** used. Disabled = `--lw-rule-color` frame, `--lw-page` fill, `--lw-text-muted` text and glyphs, `cursor: not-allowed`. |

### 3.10 Empty, loading and error states
- **Empty canvas:** all registered sign panels are still drawn, bands and bullets intact, bodies showing a large outline numeral (`display`, `--lw-grey-200`) and one line of guidance. The structure of the system is visible before there is content.
- **Loading (Mermaid render):** the card body shows a 2px ink bar that grows left→right across the card footer rule. No spinners, no skeleton shimmer.
- **Render error:** card body shows the Warning symbol, the Mermaid error message in `mono-small`, and "Reset this diagram" text button. The band summary shows the Fail symbol.
- **Offline / failed share link:** a toast (§3.11).

### 3.11 Toasts
Bottom-left, above the colour strip. A mini-band: 48px `--lw-band` fill, `--lw-band-text` text, pinstripe included, auto-dismiss after 4s, max one at a time. "Copied init directive." / "Share link copied."

### 3.12 Landing page (single page, same system)
1. System band.
2. Hero: `title` "Diagrams in your brand's colours." + one `body` line + primary button "Open the editor" with arrow tile. Right side: a live, auto-cycling 2×2 of sign panels re-theming every 3s through the presets.
3. Three-step row with outline step bullets 1–2–3.
4. Colour strip of the current preset as the page footer.
The live preview starts with Signal and offers all four presets as named, joined controls. Its sign panels use a compact 256px minimum height and omit editor-only actions and contrast lists; their bands still show the current shape/count verdict. Below 1024px the introduction sits above the 2×2 preview; below 768px panels and steps stack, and preset controls become two columns. The palette footer is a read-only view of the current preset.

The 3-second cycle pauses on hover, keyboard focus, an explicit Pause control, a hidden page or reduced motion. Manual preset selection remains available. Automatic changes are not live-announced; pause guidance is visible. Initial loading keeps panel structure visible, and failures offer Retry preview.

No testimonials, no logos wall, no pricing.

---

### 3.13 Accounts and private saved sets

Accounts are optional. Without service configuration the editor and public fragment sharing remain usable; `/sets` explains that accounts are unavailable and links back to the editor. When accounts are available the app band includes **Saved sets** (**Sets** on phones). The library provides sign-in and sign-out controls. Account forms use the existing type, ink and focus tokens, square corners and ruled fields; no shadows or gradients.

The library is a single column of ruled rows, with a name, token count, last-saved date, up to four token-colour bullets, **Open** and **Delete**. It loads private metadata in pages and offers **Load more**. Loading, empty, unavailable and retry states use explicit text. Changing accounts clears the previous library. Deleting requires confirmation and a matching revision; a conflict refreshes the list before another attempt. Names and actions wrap at 320px; the library headline uses `title` on phones and `display` from tablet width.

The editor offers **Save** in the desktop band and in phone Tokens/Export views. All triggers share one dialog and pending request. The dialog names the private theme and offers **Save a copy** when a saved identity exists. Updates use the opened revision. A stale update preserves the draft and offers a copy or reopening the latest saved version. Finishing a request never replaces newer edits or attaches an identity after navigation to a different draft. Share links contain a separate public snapshot without private saved IDs.

Opening `/editor?set=<id>` loads the private theme and remembers its revision. A validated fragment takes precedence as the local draft; an invalid fragment may fall back to the saved theme. Slow restores cannot overwrite newer edits or navigation. The draft's revision survives reload so another tab's newer save produces a conflict.

## Section 4 — Motion

Transit motion is the train, not the sign. Signs don't move. Motion in Linework is brief and only explains a change.

| Event | Motion | Duration / easing |
|---|---|---|
| Token value changes | Each diagram crossfades from old render to new; cards update in reading order (1→4) with a 30ms stagger. | 160ms, `cubic-bezier(0.2, 0, 0, 1)` |
| Contrast result changes | The ratio number swaps instantly; the symbol scales from 0.8 → 1 once. | 120ms, same easing |
| Drawer open/close | Slide from right, no fade. | 200ms open / 160ms close |
| Dialog | Appears instantly; scrim fades. | Scrim 120ms |
| Row select | Inversion is instant. | 0ms |
| Toast | Slides up 8px + fades in. | 160ms |

- Debounce re-rendering 120ms after the last keystroke in a hex field; colour-picker drags update at most every 50ms.
- `prefers-reduced-motion: reduce` → all durations 0, staggers removed.
- Renders crossfade within each card for 160ms, with 0/30/60/90ms delays. The outgoing picture is hidden from assistive technology and discarded after the transition; contrast numbers change immediately. Dialog scrims, drawer slides, verdict symbols and toast entrances use the finite timings above. Wrapped toasts can grow beyond 48px to keep failure guidance readable.
- Nothing loops, bounces, springs, or parallaxes in the editor. The landing hero cycle is the only repeating motion and stops on hover and under reduced motion.

---

## Section 5 — Responsive

| Breakpoint | Layout |
|---|---|
| ≥ 1280 | Full shell as §3.1. |
| 1024–1279 | Token/Mapping column 320px fixed; canvas cards 2×2 at smaller size. |
| 768–1023 | Token/Mapping become a left drawer opened from a "Tokens" button in the system band; canvas 2×2. |
| < 768 | Single column: system band → segmented control "Tokens · Canvas · Export" → one view at a time. Cards stack 1-up. Colour strip stays fixed at the bottom (scrolls horizontally if > 8 tokens). |

Bands keep 48px height at every size. Text sizes do not scale down below the scale in §1.3.2.

The final editor uses a Tokens drawer from 768–1023px and joined Tokens / Canvas / Export view segments below 768px. Canvas is the initial phone view and explains how to add tokens. Selecting a palette block switches to Tokens and focuses its value; the full-height workspace scrolls independently above the persistent palette strip. Export reuses the desktop drawer contents as a single phone view. The card grid uses two columns when the canvas has at least 640px of available width and one below that, resolving the conflict between the canvas-width condition in §3.1 and the viewport breakpoints above.

---

## Section 6 — Accessibility

- Interface text meets WCAG 2.2 AA everywhere (the palette in §1.2.1 is chosen to pass).
- Every interactive element is reachable by keyboard, in visual order: system band → tokens → mapping → canvas toolbar → cards 1–4 → colour strip.
- Focus ring: 2px solid, always contrasting with its surface; offset 2px for free-standing controls, inset for full-width rows and segments (§1.2.6). Never removed.
- Pass/Fail is conveyed by shape + number + text, never colour alone.
- Rendered diagrams get `role="img"` and an `aria-label` ("Flowchart preview, 6 nodes, themed with Untitled set").
- Token bullets have accessible names ("Primary, #1F6FEB").
- Colour picker always has a text hex input equivalent.
- Hit targets ≥ 24×24px; primary actions 48px.

---

## Section 7 — Implementation tokens

```css
:root {
  color-scheme: light dark;   /* follow the OS unless the toggle says otherwise */

  /* Unit & module */
  --lw-u: 4px;
  --lw-m: 48px;
  --lw-m-half: 24px;
  --lw-rule: 1px;
  --lw-rule-heavy: 2px;
  --lw-pinstripe-inset: 6px;
  --lw-pinstripe: 2px;

  /* Colour — palette (§1.2.1). Components never use these directly. */
  --lw-black: #0b0b0b;
  --lw-white: #ffffff;
  --lw-grey-50: #f4f4f4;
  --lw-grey-200: #d6d6d6;
  --lw-grey-500: #6b6b6b;
  --lw-grey-800: #2e2e2e;

  /* Semantic — light-dark(light, dark); color-scheme below picks the side */
  --lw-page: light-dark(#ffffff, #0b0b0b);
  --lw-text: light-dark(#0b0b0b, #ffffff);
  --lw-text-muted: light-dark(#6b6b6b, #9a9a9a);
  --lw-ink: light-dark(#0b0b0b, #ffffff);
  --lw-on-ink: light-dark(#ffffff, #0b0b0b);
  --lw-ink-hover: light-dark(#2e2e2e, #d6d6d6);
  --lw-band: light-dark(#0b0b0b, #1e1e1e);
  --lw-band-2: light-dark(#2e2e2e, #262626);
  --lw-band-text: light-dark(#ffffff, #ffffff);
  --lw-band-rule: light-dark(#0b0b0b, #3a3a3a);   /* invisible in light mode */
  --lw-rule-color: light-dark(#d6d6d6, #2e2e2e);
  --lw-recess: light-dark(#f4f4f4, #161616);
  --lw-signal: light-dark(#d7261e, #ff4b3e);
  --lw-focus: light-dark(#0b0b0b, #ffffff);

  /* Token-bullet ring (§1.6): which near-page fills get a ring in this mode */
  --lw-ring-near-white: light-dark(#6b6b6b, transparent);
  --lw-ring-near-black: light-dark(transparent, #9a9a9a);

  /* Type */
  --lw-font-sans: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --lw-font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Motion */
  --lw-ease: cubic-bezier(0.2, 0, 0, 1);
  --lw-dur-fast: 120ms;
  --lw-dur: 160ms;
  --lw-dur-slow: 200ms;
  --lw-stagger: 30ms;
}

/* The mode toggle (§3.1) sets data-theme; without it the OS preference applies. */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }

@media (prefers-reduced-motion: reduce) {
  :root { --lw-dur-fast: 0ms; --lw-dur: 0ms; --lw-dur-slow: 0ms; --lw-stagger: 0ms; }
}
```

Expose these to Tailwind v4 via `@theme inline` so utilities like `bg-band`, `text-muted`, `h-m` exist and resolve the variable where they are used (so ink scopes work). Remove Tailwind's default palette, radius, shadow, spacing and font-size scales in `@theme` (`--color-*: initial`, …), and lint for their class names as well (`bg-blue-500`, `rounded-lg`, `shadow-*`). Type styles are utilities named `type-*` (`type-band`, `type-body`, `type-mono`…) so they never collide with colour utilities such as `text-band`.

**Band CSS reference:**
```css
.lw-band {
  position: relative;
  box-sizing: border-box;
  height: var(--lw-m);
  display: flex;
  align-items: center;
  gap: 8px;
  padding-inline: 16px;
  background: var(--lw-band);
  color: var(--lw-band-text);
  border-bottom: var(--lw-rule) solid var(--lw-band-rule);
  font: 700 20px/24px var(--lw-font-sans);
  letter-spacing: -0.01em;
}
.lw-band::before {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: var(--lw-pinstripe-inset);
  height: var(--lw-pinstripe);
  background: var(--lw-band-text);
}
```

**Ink scopes (§1.2.5):**
```css
.lw-band,
.lw-band-2 {
  --lw-ink: var(--lw-band-text);
  --lw-text: var(--lw-band-text);
  --lw-text-muted: var(--lw-grey-200);
  --lw-ink-hover: var(--lw-grey-200);
  --lw-focus: var(--lw-band-text);
}
.lw-band   { --lw-on-ink: var(--lw-band); }
.lw-band-2 { --lw-on-ink: var(--lw-band-2); }

/* The element keeps the outer ink as its fill; its contents get the swap. */
.lw-inverted {
  --lw-focus: var(--lw-on-ink);
  --lw-swap-ink: var(--lw-on-ink);
  --lw-swap-on-ink: var(--lw-ink);
  background-color: var(--lw-ink);
  color: var(--lw-on-ink);
}
.lw-inverted > * {
  --lw-ink: var(--lw-swap-ink);
  --lw-on-ink: var(--lw-swap-on-ink);
  --lw-text: var(--lw-swap-ink);
}
```
A custom property that references another one resolves on the element that declares it, so each scope sets every token it changes; it never relies on `--lw-focus: var(--lw-ink)` being re-evaluated further down the tree.

The named classes are `.lw-band`, `.lw-band-2` and `.lw-inverted`. Nothing else in the chrome uses a hand-written class.

---

## Section 8 — Prohibited

- Rounded corners (except bullets), shadows, blurs, glassmorphism, gradients.
- Any colour in the chrome outside §1.2.1. No brand accent colour for Linework itself.
- Icon libraries (Lucide, Heroicons…). Only the symbol set in §1.8.
- All-caps labels, italic, centred text blocks.
- Default shadcn/ui or Tailwind look. Headless primitives (Radix) are fine; their styling must follow this manual.
- MTA/NYCT logos, names, route letters in coloured circles, or official line-colour pairings; real company palettes as presets.
- Decorative grids, crop marks, noise textures, or fake labels that carry no data.
- Spinners, skeleton shimmer, confetti, bouncy springs.

---

## Appendix A — Review checklist
Before a UI change is done, check:
- [ ] Every size is on the spacing scale / type scale.
- [ ] Only §1.2.1 colours in the chrome; user colours only in bullets, diagrams, strip.
- [ ] Chrome colours come from semantic tokens (`--lw-ink`, `--lw-on-ink`, `--lw-page`…), never the palette hexes or `--lw-black` directly.
- [ ] Bands used only at the top of units; pinstripe present.
- [ ] No radius, no shadow.
- [ ] Mixed-case labels; values in mono.
- [ ] Pass/fail has shape + number.
- [ ] Keyboard path works; the focus ring contrasts with its surface, and full-width rows use the inset ring.
- [ ] Reduced motion respected.
- [ ] Looks right in light, dark, and on all three preview surfaces.

---

Class proofing checks class members and relationship labels against the opaque class fill. Mermaid uses primary text for SVG class notes, so their check uses class text against note fill; the note-text role does not control those labels. Note leaders attach to the actual note label.

## Appendix B — Changelog
Every change to this manual, newest first. Say what changed and why, so later readers can tell a decision from an accident.

### 24 Oct 2026 — Accounts and private saved sets

Specified conditional account access, private library rows and recovery states, shared save controls, revision conflicts, fragment precedence and navigation-safe asynchronous results. Service configuration remains optional.

### 22 Oct 2026 — Milestone 5 focus, motion and landing

Specified local source editing, theme-preserving source limits, representative SVG proofing leaders, independent reset and focus return. Finalized phone views, preview crossfades, finite feedback motion, wrapped toasts and the live landing page's compact panels, preset controls and pause conditions.

### 22 Oct 2026 — Milestone 4 export and share

Specified the right-side export drawer, responsive two-column output tabs, selectable code fields, current contrast status, clipboard feedback and phone header actions. Defined equivalent config outputs and the compressed/versioned URL format, bounds and local restore/synchronization behavior.

### 22 Oct 2026 — Milestone 3 editor

Clarified the staged editor band and phone drawer, a 640px canvas grid threshold, empty bullets for unmapped colours, wrapping card footers, readable colour-strip blocks and a shape-based selection mark. Contrast coverage now explicitly includes derived ER row fills and translucent Gantt section fills; the primary fill alone cannot establish their contrast.

### 19 Oct 2026 — Milestone 1 review

| Section | Change | Why |
|---|---|---|
| §1.6 | Bullet glyphs set to 15px `heading` (large), 13px `small` (standard) and 11px `micro` (small), all 700. | The previous 16px and 10px were not on the type scale (§1.3.2), and `micro` is the only style allowed below 13px. |
| §1.2.1, §1.2.5 (new), §7 | Added interface ink: `--lw-ink`, `--lw-on-ink`, `--lw-ink-hover` (`#2E2E2E` light, `#D6D6D6` dark). | Primary buttons, frames, selected rows, arrow tiles and the toggle were specified as black, which disappears on the `#0B0B0B` dark page. Ink inverts with the mode. |
| §1.4–§3.11, §6 | Swept the manual: every "black" that meant interface ink now names `--lw-ink` / `--lw-on-ink`. This covers index and step bullets, Pass and Large-only symbols, arrow tiles, frames, the selected row, the loading bar, leader lines and the toggle. The toast now names the band tokens. Literal `#0B0B0B` / `#FFFFFF` stay only where the colour is fixed on purpose: token-bullet glyphs and colour-strip labels (chosen against the user's colour), the Fail ✕, the Ink preview surface and the scrim. | One meaning per word. A literal hex in a spec was a dark-mode bug waiting to happen. |
| §1.2.5 | Ink scopes: bands, inverted elements and preview surfaces redefine ink for their contents. | Components never have to branch on context. An index bullet in a card band inverts on its own, and leader lines follow the preview surface rather than the interface mode. Without this, dark mode on the Paper surface would give white leader lines on white. |
| §1.2.6 (new), §6 | Focus ring generalised: it always contrasts with the surface it sits on; `--lw-on-ink` on ink fills; inset (−4px) on full-width rows and joined segments. | A black ring on a black band vanished, and an offset ring on a full-width row is clipped by the panel edge. At −2px an inset ring covers the element's outer edge and merges with the page or a neighbouring 2px frame (found on the specimen page), so it sits 2px further in. |
| §1.2.6 | On bands the ring uses `--lw-band-text` rather than `--lw-on-ink`. | They match in light mode. In dark mode the band is `#1E1E1E` and on-ink is `#0B0B0B` (about 1.2:1), so the ring has to stay white. |
| §1.2.4, §1.4, §7 | Added the `--lw-band-rule` token (`#3A3A3A` dark; equal to the band fill in light, so invisible). The rule sits inside the 48px. | §1.2.4 named the colour but §7 had no token for it. |
| §1.2.4, §1.4, §7 | Added the `--lw-band-2` token for the secondary band; dark value set to `#262626`. | §1.4 used the light-only `--lw-grey-800`. `#262626` gives the dark secondary band its own step between the band (`#1E1E1E`) and dark rules (`#2E2E2E`). |
| §1.2.1, §3 | Chrome greys are referenced through `--lw-recess`, `--lw-rule-color` and `--lw-text-muted` instead of `--lw-grey-*`. | Same reason as ink: the light hexes were named where dark mode needs other values. |
| §3.9 | Toggle track 48×24 (`M` × `M/2`), thumb travel 24px, thumb colours per state. | 40px is not on the spacing scale. |
| §3.9, CLAUDE.md | Toggle built on Radix Switch instead of Toggle. | A track and thumb is a switch (`role="switch"`), not a pressed button. Same `radix-ui` package, no new dependency. |
| §1.8 | Added the Close symbol (12px ✕). | The dialog close tile (§3.7) needed a symbol outside the closed set. |
| §3.9 | Added the icon button (24px, inverts on hover). | Plus, Close and the mode toggle needed a control that wasn't specified. |
| §3.9 | Secondary button text: `body` 700 at `M`, `small` 700 at `M/2`. | Not specified, and `body`'s 20px line-height fills the 20px inside a 24px button's 2px frame with no room left. |
| §1.7 | Inside a 24px tile the arrow is drawn at 16px (2px stroke); inverted tile defined. | A 24px arrow fills a 24px tile edge to edge, and the primary button's "inverted tile" had no definition. |
| §1.7 | The inverted tile gets a 2px ink frame inside its edge. | On the specimen page an unframed white tile on a white page made the button read as a black box with a stray arrow beside it (and a dark tile vanished into a band in the same way). |
| §1.2.6 | Text buttons get 4px of invisible side padding. | Their offset ring touched the glyphs. |
| §2.2, §1.2.1 | Ratios are truncated to one decimal, not rounded; grey-500 on grey-50 corrected from 4.9:1 to 4.8:1 (it is 4.85). | Rounding could show 4.5:1 for a pair that fails AA. |
| §3.1 | Mode toggle: shows the current mode, named "Dark mode" with a pressed state; picking the system's own mode clears the stored choice. | Not specified. |
| §7 | Dark values written once with `light-dark()`; `color-scheme` (from the OS, or `data-theme` when the toggle is used) picks the side. | The media-query block and the `data-theme` block had to repeat every value and could drift. `color-scheme` also gives native controls and scrollbars the right mode. |
| §7 | `@theme inline`; default Tailwind spacing and font-size scales removed; type styles named `type-*`; ink-scope classes listed. | `inline` is what lets scoped tokens reach utilities. `text-band` would otherwise mean both a colour and a font size. |
