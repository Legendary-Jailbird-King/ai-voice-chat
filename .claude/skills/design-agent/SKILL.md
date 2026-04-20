---
name: design-agent
description: |
  UI/UX design expert for modern web applications.
  Use when creating components, planning UI changes, or improving user experience.
  Specializes in: design systems, responsive layouts, accessibility, modern aesthetics.
authors:
  - Agent Teams
version: 1.0.0
tags:
  - design
  - ui
  - ux
  - css
  - responsive
  - a11y
---

# Design Agent Skill

Expert in UI/UX design with a focus on modern, accessible, and maintainable design.

## Design System

### Color Palette
```css
:root {
  /* Primary */
  --primary: #6366f1;      /* Indigo */
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  
  /* Semantic */
  --success: #10b981;      /* Emerald */
  --danger: #ef4444;        /* Red */
  --warning: #f59e0b;      /* Amber */
  
  /* Neutrals */
  --bg: #f8fafc;
  --surface: #ffffff;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
}
```

### Typography
```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', monospace;
  
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;  /* 18px */
  --text-xl: 1.25rem;   /* 20px */
  --text-2xl: 1.5rem;   /* 24px */
}
```

### Spacing System
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
}
```

### Border Radius
```css
:root {
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

## Component Design

### Button States
| State | Visual | CSS |
|-------|--------|-----|
| Default | Primary color, subtle shadow | `box-shadow: 0 1px 2px rgba(0,0,0,0.05)` |
| Hover | Slightly darker, enhanced shadow | `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` |
| Active | Darker, inset shadow | `box-shadow: inset 0 2px 4px rgba(0,0,0,0.1)` |
| Disabled | 50% opacity, no pointer | `opacity: 0.5; cursor: not-allowed` |
| Loading | Spinner, disabled | `position: relative; pointer-events: none` |

### Input States
- Default: `border: 2px solid var(--border)`
- Focus: `border-color: var(--primary); box-shadow: 0 0 0 4px rgba(99,102,241,0.1)`
- Error: `border-color: var(--danger); box-shadow: 0 0 0 4px rgba(239,68,68,0.1)`
- Disabled: `background: var(--bg); opacity: 0.5`

## Animation Standards

### Timing
```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Micro-interactions
1. Button hover: scale(1.02) + shadow enhancement
2. Card hover: translateY(-2px) + shadow
3. Loading: pulse animation
4. Success feedback: checkmark scale-in
5. Error shake: horizontal shake animation

## Responsive Breakpoints
```css
/* Mobile First */
@media (min-width: 480px) { /* Mobile landscape */ }
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

## Google Stitch 2.0 Integration

When working with Stitch 2.0:
1. Export from Figma with Auto Layout
2. Use Stitch to generate React components
3. Apply our design tokens (CSS Variables)
4. Add TypeScript types
5. Test responsive behavior

## Commands

```bash
/design review <component>     # Review component design
/design tokens                # Generate/verify design tokens
/design animate <element>    # Suggest animation
/design accessible <component> # Check a11y compliance
```

## Output Format

```markdown
## Design Spec: [Component Name]

### Visual
- Color: [value]
- Size: [width x height]
- Spacing: [padding/margin]

### States
- Default: [description]
- Hover: [description]
- Active: [description]
- Disabled: [description]

### Animation
- Entry: [timing + easing]
- Exit: [timing + easing]
- Interaction: [trigger + response]

### Code
```tsx
// Production-ready React component
```
```
