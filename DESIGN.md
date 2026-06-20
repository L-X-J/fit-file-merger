# DESIGN.md

## Product Overview

- **Product**: FIT File Merger
- **Surface type**: Product UI / focused utility
- **Core workflow**: upload FIT files -> review parsed results -> adjust merge options -> preview route -> merge and download

## Design Direction

- **Tone**: calm, capable, technical
- **Visual strategy**: restrained product UI with a cool neutral base and a single blue action color
- **Interaction style**: fast, explicit feedback with lightweight motion

## Color System

- **Background**: cool near-white with subtle grid and radial accent wash
- **Surface**: slightly brighter than background with soft border separation
- **Primary**: deep cobalt-blue for the main action, active states, and key route accents
- **Muted**: soft blue-gray for secondary surfaces and helper text
- **Destructive**: warm red reserved for invalid files and destructive actions

### Token Rules

- Use semantic tokens from `src/main.css` only.
- Primary color should appear on CTA buttons, active switches, route highlights, and status emphasis.
- Avoid raw Tailwind color classes in app components unless the map library requires literal values.

## Typography

- **Primary family**: Inter
- **Heading style**: compact and confident, no oversized hero typography
- **Body style**: 15-16px equivalent with high contrast and short line lengths in descriptive copy
- **Data style**: medium weight labels with tabular-feeling stat blocks where possible

## Layout

- Desktop should present a two-column workbench:
  - left: upload and file queue
  - right: merge settings and route preview
- Mobile should stack those sections in the same order and keep the primary action in a sticky bottom bar.
- Use bordered surfaces with 16-24px internal rhythm and avoid nested decorative cards.

## Components

- **Cards**: rounded `2xl-3xl`, subtle border, light shadow, optional backdrop blur
- **Buttons**: shadcn defaults with icon alignment via `data-icon`
- **Badges**: use for privacy, queue health, and ready states
- **Alerts**: use for insufficient-file and parsing-error summaries
- **Map stats**: compact metric tiles with consistent spacing and neutral surfaces

## Motion

- Keep transitions in the 150-250ms range.
- Use motion for upload feedback, status changes, and loading indicators only.
- Avoid full-screen choreography or blocking entrance animations.
