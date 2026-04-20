---
name: code-review
description: |
  Comprehensive code review for React, Node.js, TypeScript projects. 
  Use when user asks to review code, audit a PR, or check for bugs.
  Automatically reviews: correctness, security, performance, best practices.
authors:
  - Agent Teams
version: 1.0.0
tags:
  - code-review
  - quality
  - security
  - react
  - typescript
  - nodejs
---

# Code Review Agent Skill

A thorough code reviewer that examines PRs, code changes, and entire files for issues.

## Review Checklist

### 1. Correctness
- Logic bugs and edge cases
- Error handling completeness
- Type safety (TypeScript strict mode)
- Async/await error handling

### 2. Security
- No secrets or API keys in code
- SQL injection prevention
- XSS prevention
- Authentication/authorization checks

### 3. Performance
- No N+1 queries
- Efficient algorithms
- Memory leak prevention
- Unnecessary re-renders (React)

### 4. Code Quality
- Clear naming conventions
- Proper documentation
- DRY principle
- Single responsibility

### 5. Best Practices
- React hooks rules
- Node.js patterns
- TypeScript strictness
- Git commit conventions

## Severity Levels

| Level | Icon | Meaning |
|-------|------|---------|
| Critical | 🔴 | Must fix before merge |
| Warning | 🟡 | Should fix before merge |
| Suggestion | 🟢 | Nice to have |

## Output Format

```markdown
## Code Review: [PR/File Name]

### Summary
[One paragraph overview]

### What's Good ✅
- [List positive findings]

### Issues Found 🔴🟡

#### 🔴 Critical
| File | Line | Issue | Suggestion |
|------|------|-------|------------|
| ... | ... | ... | ... |

#### 🟡 Warnings
| File | Line | Issue | Suggestion |
|------|------|-------|------------|

### 🟢 Suggestions
- [Optional improvements]

### Test Coverage
- [ ] Unit tests added
- [ ] Edge cases covered
- [ ] Error scenarios tested

### Final Verdict
| Status | Description |
|--------|-------------|
| ✅ LGTM | Ready to merge |
| ⚠️ Changes Requested | Address issues above |
| ❌ Blocked | Critical issues must fix |

Reviewed by: Code Review Agent 🤖
```

## Examples

See `examples/review-template.md` for a complete example.

## Scripts

- `scripts/validate-pr.sh` — Pre-commit PR validation

## Usage

```
/code-review                    # Review current changes
/code-review --pr <url>        # Review specific PR
/code-review <file>            # Review single file
/code-review --diff            # Review staged changes
```
