# Brain Assistant — UI Style Guide

## 1. Purpose

This document defines the visual and UX rules for Brain Assistant.

It is intended for both developers and AI coding agents.

The goal is to keep every screen visually consistent regardless of who or what implements it.

For exact colors, spacing, typography, radii, and other design tokens, always use:

`docs/design/design-system.json`

Do not invent new design values when an appropriate token already exists.

Do not keep a third “visual language” note as a separate source of truth. The summary below is that note.

---

## 2. Visual Language Summary

**Dark, minimal, technical.**
Dense enough to feel productive, but not cramped.
No decorative gradients.
No glassmorphism.
No excessive shadows.
No bright multicolor UI.
No excessive rounded corners.

**Color**

- Near-black navigation.
- Dark blue-gray surfaces.
- Off-white primary text.
- Muted gray secondary information.
- Teal is the primary and dominant accent.

**Spacing**

- 4px base grid.
- 16px standard screen padding.
- 24px between major sections.
- Consistent vertical rhythm.

**Shape**

- 8px standard radius.
- 12px large containers.
- Avoid pill shapes except tags/statuses.

**Icons**

- Single icon family.
- Simple geometric/outline icons.
- 24px standard size.
- Teal only for active/primary actions.

**Typography**

- Clean sans-serif.
- Strong size/weight hierarchy rather than many colors.

**Surfaces**

- Use subtle contrast between background and cards.
- Borders preferred over heavy shadows.
- Cards should exist only when grouping information is useful.

**Interaction**

- Primary action = teal.
- Secondary actions = neutral.
- Danger actions = muted red.
- Selected/active state should always be immediately visible.

---

## 3. Sources of truth

These files describe different layers. Do not duplicate values across them.

| File | Layer | Contains |
|---|---|---|
| `docs/design/design-system.json` | WHAT | Exact tokens: colors, spacing, type, radii, component recipes |
| `docs/design/UI_STYLE_GUIDE.md` | HOW | Principles, allowed/forbidden patterns, how to design a new screen |
| `docs/design/screens/*.json` | SCREEN | Approved composition of a specific screen. No screen-specific colors or radii |

`design-system.json` is product-wide. It is not a Home-page stylesheet.

Create a `screens/<name>.json` only after that screen’s design is approved. Do not invent screen JSON as part of implementing a feature.

When generating a **new mockup** (outside this repo or with an image model), attach:

1. `design-system.json`
2. `UI_STYLE_GUIDE.md`
3. Optionally a screenshot of the approved Home screen

Do not also attach a separate Visual Language paragraph. It already lives in section 2.

Inside Cursor, read the files from disk. The user does not need to paste them.

---

## 4. Design Direction

Brain Assistant uses:

**Dark Technical Minimalism**

The interface should feel:

- focused
- productive
- modern
- technical
- restrained
- calm

Functionality takes priority over decoration.

The UI should feel like a serious productivity tool rather than a marketing website.

---

## 5. Core Design Principles

### Functional first

Every visual element must have a purpose.

Do not add decoration simply to make a screen look more interesting.

Empty space is acceptable.

### Strong hierarchy

Create hierarchy using:

1. typography
2. spacing
3. surface contrast
4. borders
5. accent color

Do not rely on shadows, gradients, or many colors to establish hierarchy.

### One primary accent

Teal is the primary product accent.

Use it for:

- primary actions
- active navigation
- selected states
- focus states
- success states when appropriate

Do not use teal simply as decoration.

### Dark surfaces

The application uses several closely related dark surfaces.

Typical hierarchy:

    Navigation
        ↓
    App background
        ↓
    Surface
        ↓
    Elevated surface

Differences between surfaces should remain subtle.

Avoid large contrast jumps between dark containers.

---

## 6. Design Tokens

All exact values must come from:

`docs/design/design-system.json`

Examples include:

- colors
- spacing
- typography
- icon sizes
- border radius
- navigation dimensions
- control heights

Never introduce arbitrary values such as:

    padding: 17px;
    border-radius: 13px;
    color: #16a78f;

when an existing design token can be used.

Prefer:

    var(--spacing-lg)
    var(--radius-default)
    var(--color-accent-primary)

CSS custom property names follow `--{category}-{path-kebab}` from `design-system.json` → `tokenNaming`.

### Angular implementation

Component SCSS must not hard-code hex, rgba, or one-off px values.

Map tokens through the shared partials in `frontend/src/scss/` (`_colors`, `_spacing`, `_typography`, `_button`). If a required token is missing from those partials, add it there from `design-system.json` — do not introduce a one-off value in the component.

Older screens may still use a previous palette (purple-gray Material tokens, `#00695c` green, hardcoded avatar colors). **Do not copy those as the new convention.** New and redesigned UI follows `design-system.json`.

Existing PNG icons in `frontend/src/assets/ui/icons/` are a legacy set. New screens should use one simple geometric outline family and must not mix filled, outline, and skeuomorphic styles on the same screen.

---

## 7. Spacing

The entire interface uses a **4px base grid**.

Primary spacing values:

    4px
    8px
    12px
    16px
    24px
    32px
    48px

The normal horizontal screen padding is:

    16px

Typical component padding:

    12px or 16px

Typical gap between major sections:

    24px

Do not use arbitrary spacing values without a clear reason. If a value is on the 4px grid but missing from the named scale, use the closest named token.

---

## 8. Typography

Use one primary sans-serif font family.

Preferred stack:

    Inter
    Roboto
    system-ui
    sans-serif

Hierarchy should primarily be communicated through font size and weight.

Use:

- Page Title — strongest hierarchy
- Section Title
- Card Title
- Body
- Secondary
- Caption

Avoid excessive font sizes and font weights.

Do not create slightly different typography styles for individual screens.

---

## 9. Surfaces

Use surfaces only when they communicate grouping or interaction.

Preferred hierarchy:

    App Background
      └── Surface
            └── Content

Cards should not exist simply because content can technically be placed inside a card.

Use cards when multiple pieces of information form a logical unit.

---

## 10. Cards

Standard cards use:

- dark surface
- subtle border
- 8px radius
- no visible drop shadow
- consistent internal padding

Cards should feel lightweight.

Avoid:

- thick borders
- strong shadows
- gradients
- excessive rounding
- colored backgrounds

Media cards should allow the image or video to remain the strongest visual element.

Typical hierarchy:

    Media

    Title
    Secondary information
    Metadata / actions

Metadata must never visually compete with the title.

---

## 11. Images and Video

User media should preserve its natural appearance.

Use:

    object-fit: cover

Do not apply:

- decorative filters
- color grading
- artificial gradients
- heavy overlays

Use rounded corners according to the design tokens.

Images should normally occupy the full available width of their media container.

---

## 12. Icons

Use **one icon family throughout the application**.

Icon style:

**Simple geometric outline**

Standard size:

    24px

Navigation:

    26px

Small contextual icons:

    18px

Icons should normally use neutral gray.

Use teal for:

- active state
- selected state
- primary action

Do not mix:

- filled icons
- outline icons
- 3D icons
- skeuomorphic icons

unless explicitly required by the component.

---

## 13. Buttons

### Primary

Use for the main action of the current context.

Example:

    Create task
    Save
    Continue

Primary buttons use the teal accent.

There should normally be only one visually dominant primary action in a local context.

### Secondary

Use dark elevated surfaces and subtle borders.

Secondary buttons should not compete with the primary action.

### Ghost

Use for low-priority actions.

Examples:

    Cancel
    More
    Back

---

## 14. Floating Action Button

The Floating Action Button represents the primary creation action.

Typical use:

    + Create

It should:

- use the teal accent
- be circular
- float above bottom navigation
- remain visually dominant without being oversized

Do not add multiple floating buttons to the same screen.

---

## 15. Inputs

Inputs should use:

- dark surface
- subtle border
- 8px radius
- clear primary text
- muted placeholder text

Focus state uses teal.

Avoid glowing focus effects.

---

## 16. Navigation

Navigation uses the darkest surface in the application.

Bottom navigation should remain visually stable between screens.

Inactive destination:

    gray icon
    gray text

Active destination:

    teal icon
    teal text

Do not add a colored container behind the active navigation item.

Do not animate navigation excessively.

---

## 17. Header

The header establishes page context.

Typical structure:

    Page title
    Optional secondary information

                     actions
                     avatar

Actions should remain visually secondary to the title.

Avoid oversized app bars unless the screen specifically requires them.

---

## 18. Content Layout

Brain Assistant is mobile-first.

Default screen structure:

    Header

    Main Content

    Floating Primary Action

    Bottom Navigation

Use consistent alignment across screens.

For grid layouts:

    2 columns
    12px gap

Cards may have different heights when their content requires it.

Do not artificially force all cards to the same height.

---

## 19. Interaction States

Every interactive component should support appropriate states:

    default
    hover
    pressed
    focused
    selected
    disabled

Use existing design tokens.

Do not create a new visual language for individual components.

---

## 20. AI Features

AI is a capability of Brain Assistant.

It is **not a separate visual product inside the application**.

AI features must use the same components and design system as everything else.

DO NOT use generic AI aesthetics such as:

- purple gradients
- glowing borders
- neon effects
- magic stars
- sparkles
- rainbow gradients
- futuristic AI backgrounds

An AI-generated suggestion should visually belong to Brain Assistant.

Not to "an AI interface."

---

## 21. Animation

Animations should communicate state or spatial relationships.

Good examples:

- menu opening
- card insertion
- task completion
- navigation transition
- loading state

Animations should be short and subtle.

Avoid animation used purely for visual spectacle.

---

## 22. How to design a new screen

When asking for a new mockup or implementing a new screen:

1. Read this file and `design-system.json`.
2. If `docs/design/screens/<screen>.json` exists, that composition is already approved — implement it, do not restyle it.
3. Inspect existing shared UI components.
4. Inspect at least one similar existing screen **and** the Home visual reference. Prefer the approved Home language over older Material-derived screens.
5. Reuse existing components whenever possible.
6. Use existing design tokens.
7. Do not introduce new visual conventions without explicit instruction.

A good request for a new screen looks like:

> Design the Task Details screen for Brain Assistant.
> Follow `docs/design/design-system.json` and `docs/design/UI_STYLE_GUIDE.md`.
> Preserve the established visual language of the application.
>
> Requirements: title, description, images, tags, status, save action.

Optionally attach a screenshot of Home.

After a mockup is approved, save it as `docs/design/screens/<screen>.json`. That file describes structure and components. It must not repeat colors, radii, or spacing from `design-system.json`.

---

## 23. DO

DO:

- use `design-system.json`
- reuse existing components
- use the 4px spacing grid
- preserve strong visual hierarchy
- use teal intentionally
- use subtle borders
- preserve natural user media
- maintain consistent navigation
- keep screens visually calm
- leave empty space when appropriate
- prefer existing patterns over inventing new ones

---

## 24. DON'T

DON'T:

- invent arbitrary colors
- invent arbitrary spacing
- introduce a new radius without reason
- add gradients for decoration
- use glassmorphism
- use heavy shadows
- make every container a card
- overuse teal
- use multiple accent colors
- mix icon families
- use excessive rounded corners
- create AI-specific purple UI
- fill empty areas just to make the screen look busy
- redesign existing shared components for one screen
- silently extend the design system in a component file

---

## 25. AI Agent Rules

When implementing or modifying UI:

1. Read this file.
2. Read `docs/design/design-system.json`.
3. Read `docs/design/screens/<screen>.json` if one exists for the screen being changed.
4. Inspect existing shared UI components.
5. Inspect at least one similar existing screen.
6. Reuse existing components whenever possible.
7. Use existing design tokens.
8. Do not introduce new visual conventions without explicit instruction.
9. Keep the implementation mobile-first.
10. Verify all relevant interaction states.
11. Compare the finished screen against this guide before completing the task.

When uncertain between creating a new visual pattern and reusing an existing one:

**Reuse the existing pattern.**

When uncertain about a design value:

**Use the closest existing design token.**

Do not silently extend the design system.

If a genuinely new visual primitive is required, propose the addition before introducing it.

---

## 26. Reference Visual Language

The **approved** Home screen (`docs/design/screens/home.json`) is the primary visual reference.

The live Angular Home screen may still lag behind that spec. Treat the approved spec and this guide as the target language, not whichever older screen happens to be nearby.

Its important characteristics are:

- near-black navigation
- dark blue-gray content surfaces
- off-white primary typography
- muted secondary typography
- teal active states
- subtle card borders
- restrained rounding
- media-dominant cards
- generous but systematic spacing
- simple geometric icons
- floating teal create action
- minimal visual noise

New screens should feel like they belong to the same application immediately.

---

## 27. Final Check

Before completing UI work, ask:

- Does this look like Brain Assistant?
- Are all values coming from the design system?
- Is the hierarchy obvious?
- Is teal being used intentionally?
- Are spacing and alignment consistent?
- Did I reuse existing components?
- Did I introduce unnecessary decoration?
- Did I introduce a new visual convention?
- Does the screen remain usable on mobile?

If a new screen looks visually more elaborate than the Home screen without a functional reason, simplify it.
