# Deferred Items — Phase 03

## Pre-existing Issues (Out of Scope)

### 1. TokenPreview.tsx has 142 `bg-gray-800` lint errors
- **File:** `src/src/components/dev/TokenPreview.tsx`
- **Issue:** The file disables `loom/no-banned-inline-style` but NOT `loom/no-hardcoded-colors`. Tailwind v4 treats `bg-gray-800` as a utility class, and the hardcoded-colors ESLint rule flags it.
- **Impact:** `eslint src/ --max-warnings=0` fails on this file. Pre-commit hook only runs on staged files, so it does not block commits of other files.
- **Recommendation:** Add `/* eslint-disable loom/no-hardcoded-colors */` to TokenPreview.tsx, or replace `bg-gray-800` with a semantic token class. This is a Phase 1 artifact.
- **Discovered during:** Plan 03-01, Task 2 verification
