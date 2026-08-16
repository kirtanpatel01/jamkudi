# JAMKUDI — COMPLETE COZY AESTHETIC DESIGN SYSTEM

This document is the **single visual source of truth for Jamkudi**.

The goal is not to make Jamkudi look "modern", "AI-powered", "premium SaaS", or trendy.

The goal is to make it feel like **a cozy little music player with its own personality**.

The Jamkudi mascot/logo is the foundation of that personality.

---

# 1. CORE IDENTITY

### Jamkudi should feel like:

**Cozy · Cute · Musical · Soft · Playful · Personal · Aesthetic**

The emotional impression should be:

> **"Put your headphones on, get comfortable, and listen."**

Jamkudi should feel like a **companion for listening**, not a tool for managing music.

It must remain a serious, functional music player underneath the personality.

### Never let Jamkudi become:

- A generic AI application
- A productivity dashboard
- A SaaS dashboard
- A finance-app-style interface
- A card-heavy admin panel
- A neon cyberpunk music app
- A childish cartoon application
- A generic Spotify clone
- A purple-gradient template

---

# 2. THE LOGO IS THE PERSONALITY ANCHOR

The Jamkudi mascot communicates:

- softness
- comfort
- sleepiness
- music
- headphones
- warmth
- playfulness
- intimacy

The UI must visually belong to the same world.

Do not copy the mascot literally into every screen.

Instead, translate its personality into:

- color
- softness
- typography
- spacing
- shape
- motion
- illustrations
- empty states
- interaction feedback

The mascot should feel like a **quiet little companion**, not a marketing character.

---

# 3. DESIGN PRINCIPLE

The most important rule:

> **The UI should get out of the way of the music.**

When deciding whether to add a visual element, ask:

> Does this help the user listen, discover, control, or understand something?

If not, remove it.

Prefer:

**artwork + typography + whitespace**

over:

**card + border + shadow + gradient + badge + icon + decorative container**

---

# 4. COLOR PALETTE

Jamkudi uses a small, soft palette.

## Primary dark

Use deep navy rather than pure black.

```text
Navy 950
#111322

Navy 900
#171A2B

Navy 800
#20243A
```

Dark mode should feel like a quiet room at night.

Never use pure `#000000` as the dominant background unless technically necessary.

---

## Warm light

Avoid sterile white.

```text
Cream 50
#FCFAF7

Cream 100
#F6F2ED

Cream 200
#EEE9E3
```

The light theme should feel warm and soft.

---

## Jamkudi purple

Purple is the primary brand accent.

```text
Lavender 300
#C9B8FF

Lavender 400
#B69AFF

Lavender 500
#9B7CFF

Lavender 600
#8062E8
```

Use the middle values primarily.

Purple should communicate:

**interaction / music / selection / Jamkudi identity**

It should NOT dominate every surface.

---

## Soft pink

Pink exists only as a personality accent.

```text
Pink 200
#F5C9D8

Pink 300
#EFAFC6
```

Use sparingly.

Examples:

- subtle mascot moments
- occasional illustration accents
- tiny decorative details
- selected emotional states

Never turn the application pink.

---

## Text

Dark:

```text
Primary:   #F5F2EE
Secondary: #C8C5CD
Muted:     #92909A
```

Light:

```text
Primary:   #202033
Secondary: #5F5B69
Muted:     #92909A
```

Text hierarchy should be created through contrast, size, and weight rather than many different colors.

---

# 5. COLOR USAGE RULE

Use approximately:

**70% neutral surfaces**

**20% artwork/content**

**10% brand accent**

Purple is an accent, not a wallpaper.

Avoid:

```text
purple background
purple card
purple border
purple icon
purple button
purple chip
purple glow
```

all appearing together.

That is exactly what creates the generic "AI app" appearance.

---

# 6. LIGHT THEME

Light mode:

```text
Background
→ warm cream

Surfaces
→ slightly darker cream

Text
→ deep navy

Accent
→ soft lavender

Secondary accent
→ occasional pink
```

Light mode should feel:

**warm, airy, soft and comfortable.**

Avoid stark black-on-white contrast everywhere.

---

# 7. DARK THEME

Dark mode is especially important for Jamkudi.

Use:

```text
Background
→ deep navy

Elevated surface
→ slightly lighter navy

Text
→ warm white

Accent
→ soft lavender

Secondary accent
→ muted pink
```

The dark theme should evoke:

> **late-night listening with headphones on.**

No neon glow.

No excessive purple gradients.

No pure-black-and-purple gamer aesthetic.

---

# 8. TYPOGRAPHY

Typography has two personalities.

## Display typography

Use the existing rounded/playful personality for:

- Jamkudi branding
- screen titles
- major headings
- empty states
- occasional expressive messages

It should feel:

**friendly + rounded + slightly playful**

Do not use it everywhere.

---

## Body typography

Use a clean, highly readable font for:

- song titles
- artists
- descriptions
- metadata
- buttons
- settings
- forms
- navigation

The body font should disappear into the experience.

It should never compete with artwork.

---

## Hierarchy

Use:

```text
Display Large
Display Medium

Heading Large
Heading Medium
Heading Small

Body Large
Body Medium
Body Small

Label
Caption
```

Keep the hierarchy simple.

Do not create ten visual levels for a small mobile screen.

---

# 9. SPACING

Jamkudi should breathe.

Use a consistent spacing scale:

```text
4
8
12
16
20
24
32
40
48
```

Preferred common spacing:

- 8 → compact relationships
- 12 → related elements
- 16 → standard padding
- 20 → screen content
- 24 → section separation
- 32 → major separation
- 40+ → intentional breathing room

Avoid arbitrary one-off spacing values.

---

# 10. SCREEN MARGINS

Standard mobile content should generally use:

**16–20px horizontal padding.**

Major visual elements may use larger spacing when appropriate.

Do not squeeze content against screen edges.

Do not create enormous margins that make the application feel empty.

---

# 11. CORNER RADIUS

Jamkudi is rounded, but not everything is a pill.

Use:

```text
Small      8
Medium     12
Large      16
XL         20–24
Full       999
```

### Use full/pill radius only for:

- pills
- tags
- compact filters
- intentionally pill-shaped actions

### Use normal rounded corners for:

- artwork
- cards
- sheets
- inputs
- buttons
- surfaces

Rounded should feel organic, not excessive.

---

# 12. CARDS

Cards should be used less frequently.

Before creating a card, ask:

> Could whitespace and typography communicate this hierarchy instead?

If yes, do that.

### Preferred hierarchy

**Level 1**

Free content.

**Level 2**

Subtle surface.

**Level 3**

Featured surface.

Only Level 3 should visually demand attention.

Avoid the common pattern:

```text
border
+
shadow
+
background
+
rounded container
+
gradient
```

for every section.

---

# 13. BORDERS

Borders are functional.

Use them when needed for:

- input definition
- accessibility
- separation
- selected states
- interactive affordance

Keep them subtle.

Do not outline every component.

---

# 14. SHADOWS

Shadows should be soft and restrained.

Use them primarily for:

- floating sheets
- important floating controls
- artwork when needed

Avoid:

- giant shadows
- purple glow
- neon glow
- multiple stacked shadows

Jamkudi should feel grounded.

---

# 15. ARTWORK

Artwork is one of the most important visual elements in Jamkudi.

Treat it as content, not decoration.

Rules:

- Preserve artwork proportions.
- Give artwork breathing room.
- Use consistent corner radius.
- Avoid unnecessary borders.
- Avoid excessive effects.
- Avoid purple glow around artwork.
- Avoid decorative frames unless they genuinely serve a purpose.

Let different album covers provide the visual variety.

---

# 16. SONG ROWS

Song rows should be extremely clean.

Preferred structure:

```text
[Artwork]  Song title
           Artist

                     Duration
```

Actions should appear only where necessary.

Song rows should prioritize:

1. Artwork
2. Song title
3. Artist
4. Playback/action affordance

Avoid stuffing every possible action into every row.

When multiple actions are necessary, use compact icon controls or a contextual action menu.

---

# 17. BUTTON SYSTEM

Three main levels.

### Primary

Used for:

- Play
- Create Playlist
- Import
- Confirm important actions

Strong Jamkudi accent.

### Secondary

Used for:

- Shuffle
- Supporting actions

Quiet surface.

### Tertiary

Used for:

- Less important actions
- Text actions
- contextual controls

Minimal visual weight.

---

# 18. PLAY BUTTON

The Play action is one of the most important controls in the application.

It should be visually obvious.

Use:

**Jamkudi purple + strong contrast**

But do not make every other action look equally important.

The user should immediately understand:

> **This is the thing I press to start listening.**

---

# 19. ICON BUTTONS

Icon buttons should:

- have comfortable touch targets
- use consistent sizing
- have consistent visual weight
- avoid unnecessary backgrounds

Use filled backgrounds only when the control needs stronger emphasis.

Player controls should feel tactile and musical.

---

# 20. SEARCH

Search should feel like:

> **"What do you want to listen to?"**

not:

> "Enter your query."

Search inputs should be:

- soft
- spacious
- easy to tap
- visually calm

Avoid heavy borders.

Avoid excessive filter pills.

Use selected states sparingly.

---

# 21. LIBRARY

Library should feel like **a personal music shelf**, not a database dashboard.

Prefer:

- artwork
- song lists
- playlists
- albums
- recently played

over:

- statistics
- metadata cards
- excessive filters
- dashboard widgets

The user's music should dominate the screen.

---

# 22. PLAYLISTS

Playlist pages should feel personal.

The playlist artwork and name should have visual priority.

Controls should remain simple:

```text
Play
Shuffle
```

Management actions should remain secondary.

Avoid turning playlists into admin pages.

---

# 23. PLAYER

The player is the heart of Jamkudi.

Its visual hierarchy should be:

```text
Artwork
↓
Song
↓
Artist
↓
Progress
↓
Playback controls
↓
Secondary controls
```

The current song should receive the strongest visual attention.

Controls should be calm and tactile.

Avoid excessive panels.

---

# 24. MINI PLAYER

The mini player should feel like a continuation of the current listening experience.

It should be:

- compact
- recognizable
- artwork-first
- easy to tap
- unobtrusive

It should not look like another card floating over the application.

---

# 25. BOTTOM NAVIGATION

Keep navigation simple.

The active destination uses Jamkudi purple.

Inactive destinations are muted.

Avoid:

- giant floating navigation containers
- heavy gradients
- excessive shadows
- unnecessary badges

The navigation should disappear into the background when the user is focused on music.

---

# 26. EMPTY STATES

This is one of the best places to express Jamkudi's personality.

Instead of generic:

> "No results found."

use a small amount of personality.

Example:

> **It's a little quiet here.**  
> Go find something to listen to.

The mascot can appear here.

But keep the message concise.

Do not turn empty states into full illustrations everywhere.

---

# 27. ERROR STATES

Errors should feel calm and human.

Instead of:

> ERROR 500

prefer:

> **Something went a little wrong.**  
> Let's try that again.

Then provide:

**Try again**

The mascot can occasionally appear.

Never make errors cute to the point that the user can't understand what happened.

---

# 28. LOADING

Loading should feel gentle.

Avoid:

- flashing skeleton overload
- endless spinners
- aggressive animation
- glowing effects

Prefer subtle transitions and minimal loading indicators.

The user should feel that Jamkudi is calmly preparing their music.

---

# 29. MASCOT RULES

The mascot is:

**a companion, not decoration.**

Use it for:

- onboarding
- empty states
- occasional loading states
- errors
- special brand moments

Do not use it:

- on every page
- on every card
- beside every button
- as random decoration
- with constant animation

Its rarity makes it special.

---

# 30. MOTION

Motion should feel:

**soft + smooth + relaxed.**

Preferred:

- fade
- gentle slide
- subtle scale
- smooth transitions
- restrained spring

Avoid:

- aggressive bounce
- neon glow
- constant floating
- excessive parallax
- huge transitions
- "AI magic" effects

Jamkudi should feel like it is breathing.

---

# 31. MICRO-INTERACTIONS

Small interactions can provide personality.

Examples:

Like:

**subtle scale + soft feedback**

Play:

**gentle control response**

Queue:

**small confirmation**

Playlist creation:

**quiet success feedback**

Avoid making every interaction animated.

The personality should be felt, not announced.

---

# 32. DO NOT OVERUSE GRADIENTS

Gradients are allowed only when they provide meaningful atmosphere.

Good:

- subtle background atmosphere
- artwork-derived player backgrounds
- occasional brand moments

Bad:

- every button
- every card
- every header
- every screen

A flat surface is often better.

---

# 33. DO NOT OVERUSE PURPLE

Purple is the signature accent.

It should become recognizable because it is **selective**.

If everything is purple, nothing feels special.

Use purple where the user needs to understand:

> **This is active.**

or:

> **This is Jamkudi.**

---

# 34. RESPONSIVE DESIGN

Jamkudi is primarily a mobile music player.

Everything must work naturally on:

- small Android phones
- standard phones
- large phones

Never design only for one screenshot.

Avoid:

- fixed widths
- fixed heights that cause clipping
- content hidden behind the mini player
- text overlapping controls
- horizontal content accidentally clipped

---

# 35. ACCESSIBILITY

Cozy does not mean difficult to use.

Maintain:

- readable contrast
- sufficient touch targets
- clear selected states
- clear disabled states
- understandable icons
- readable song titles
- accessible controls

Aesthetic decisions must never compromise usability.

---

# 36. DESIGN ANTI-PATTERNS

Do NOT introduce:

- generic glassmorphism
- excessive gradients
- neon purple
- excessive pills
- card grids everywhere
- giant hero sections
- SaaS-style dashboards
- unnecessary statistics
- floating blobs
- random 3D illustrations
- generic AI sparkle icons
- excessive badges
- excessive shadows
- excessive borders
- decorative elements with no purpose

If it looks like an AI-generated Dribbble dashboard, it is probably wrong for Jamkudi.

---

# 37. THE JAMKUDI TEST

Every new screen/component must pass these questions:

### Personality

Does it feel cozy?

Does it feel musical?

Does it feel slightly playful?

Does it feel personal?

### Visual

Is there too much purple?

Are there too many cards?

Are there too many pills?

Are there too many borders?

Are there too many decorative elements?

### Music

Is artwork getting enough attention?

Is the current song/action obvious?

Is the interface helping the user listen rather than manage?

### Brand

Does this feel like it belongs with the Jamkudi mascot?

Would someone recognize this as Jamkudi without seeing the logo?

If not, redesign it.

---

# 38. FINAL DESIGN PHILOSOPHY

Jamkudi should not try to impress users by throwing visual effects at them.

It should make them feel comfortable.

The design should communicate:

> **Come in. Put your headphones on. Pick something you like. Stay for a while.**

That is the personality.

The mascot provides the charm.

The artwork provides the visual richness.

The typography provides the personality.

The colors provide the atmosphere.

The whitespace provides the calm.

The player provides the purpose.

Everything else should stay out of the way.

---

# FINAL RULE

**Do not design Jamkudi to look impressive.**

**Design Jamkudi to feel good.**