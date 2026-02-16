# Sprint Process — Aretee

## Definition of Done

Every sprint MUST deliver ALL four of these before merging to main:

### 1. Code
- Feature branch created from main
- All new code TypeScript strict (no `any`, no implicit types)
- Clean commit with descriptive message
- Pushed to remote, merged to main via `--no-ff`

### 2. New Tests
- Unit tests for all new services/utilities
- Integration tests where features cross boundaries
- Minimum: every public method has at least one test

### 3. Regression Suite
- Run `npx vitest run` BEFORE starting the sprint — record baseline count
- Run `npx vitest run` AFTER completing — ALL existing tests must pass
- Test count must only go UP, never down
- If an existing test breaks, fix it before merging — no exceptions
- Cross-feature regression: verify the review chain still works end-to-end
  (FSRS → gamification → error classification → interleaving)

### 4. Demo
- Screenshots or screen recording of the feature running in the app
- Posted to #aretee-dev (Slack) with brief description
- For backend-only features: wire up minimal UI to make it visible
- If it can't be demoed, it's not done

## Test Count Tracker

| Sprint | Date | Tests Before | Tests After | Delta |
|--------|------|-------------|-------------|-------|
| 1-6 | pre-2026-02 | 0 | 162 | +162 |
| 8 (FSRS) | 2026-02-12 | 162 | 162 | +0 |
| 11 (Immersion) | 2026-02-12 | 162 | 162 | +0 |
| 9 (Error Patterns) | 2026-02-15 | 162 | 212* | +50 |
| 10 (Interleaving) | 2026-02-16 | 212 | 230 | +18 |

*Sprint 9 included flow tests from uncommitted work (+31) plus error classifier tests (+19)

## Branch Naming
```
sprint-<number>/<feature-slug>
```
Examples: `sprint-9/error-patterns`, `sprint-10/interleaving-microlearning`

## Commit Message Format
```
feat: Sprint <N> — <Feature Name>

- bullet points of what was built
- integration points
- test coverage summary
```
