---
name: frontend-dev
description: |
  Frontend development expert for React 19, TypeScript, Vite, and modern web.
  Use when building UI components, implementing features, or debugging frontend issues.
  Specializes in: React hooks, performance optimization, accessibility, responsive design.
authors:
  - Agent Teams
version: 1.0.0
tags:
  - react
  - typescript
  - frontend
  - vite
  - web
---

# Frontend Developer Agent Skill

Expert in modern React frontend development with a focus on quality and performance.

## Expertise

### Core Technologies
- React 19 (Server Components, use() hook, new hooks)
- TypeScript 5.x (strict mode, inference)
- Vite 6 (fast builds, HMR)
- CSS Modules / CSS Variables

### Specializations
- Voice UI / Audio handling (Web Speech API, MediaRecorder, Web Audio)
- Real-time features (WebSocket, SSE)
- Performance (lazy loading, memo, virtualization)
- Accessibility (ARIA, keyboard nav, screen readers)
- Responsive design (mobile-first)

## Code Standards

### File Structure
```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── utils/          # Pure utility functions
├── types/          # TypeScript types
├── styles/          # Global CSS / variables
└── pages/          # Route-level components
```

### Component Template
```typescript
import { useCallback, useState } from 'react';
import type { ComponentProps } from './types';

interface Props extends ComponentProps {
  title: string;
  onAction?: (id: string) => void;
}

export function MyComponent({ title, onAction, className }: Props) {
  const [state, setState] = useState<string>('');
  
  const handleClick = useCallback(() => {
    onAction?.('clicked');
  }, [onAction]);
  
  return (
    <div className={className} role="button" tabIndex={0}>
      <h2>{title}</h2>
    </div>
  );
}
```

### Hooks Rules
1. One responsibility per hook
2. Use `use` prefix for custom hooks
3. Return stable references for callbacks
4. Handle cleanup in useEffect return

## Performance Checklist

- [ ] `React.memo()` where needed
- [ ] `useMemo` for expensive computations
- [ ] `useCallback` for stable references
- [ ] Lazy load components with `React.lazy()`
- [ ] Virtualized lists for large datasets
- [ ] Optimistic UI updates

## Accessibility Checklist

- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast ratio ≥ 4.5:1

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Quality
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm test                 # Run tests

# Tools
/claude frontend-dev analyze-performance   # Analyze bundle size
/claude frontend-dev check-accessibility   # Audit a11y
/claude frontend-dev optimize-assets        # Optimize images/CSS
```

## Voice Chat Specific

When working on voice features:
1. Use `navigator.mediaDevices.getUserMedia` for mic access
2. Handle permission denied gracefully
3. Implement push-to-talk pattern
4. Use `SpeechRecognition` for STT
5. Use `speechSynthesis` for TTS
6. Show clear recording state
