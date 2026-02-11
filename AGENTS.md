# AGENTS.md — Aretee

## Project
**Aretee** — Personal learning OS. Gamified, AI-powered, multi-modal.

## Repos
- **Main:** `datonedoe/aretee` (this repo)
- **Legacy Desktop:** `/Users/darweeniel/work/1Projects/graybox/graybox-flashcard-desktop`
- **Legacy iOS:** `/Users/darweeniel/work/1Projects/graybox/graybox-flashcard-ios`

## Tech Stack
- **Frontend:** Expo (React Native) + TypeScript + NativeWind (Tailwind)
- **State:** Zustand
- **Navigation:** Expo Router
- **AI:** Claude API (Anthropic)
- **TTS:** Edge TTS (free tier)
- **Backend:** Python (FastAPI) — only for AI/audio generation
- **Local DB:** expo-sqlite

## Conventions
- TypeScript strict mode
- Functional components only (no classes)
- Zustand for all state management
- Platform-specific code behind adapter interfaces (`services/platform/`)
- All AI prompts in `services/ai/prompts.ts`
- File naming: kebab-case for files, PascalCase for components
- Test files: `__tests__/` directories or `*.test.ts`

## Flashcard Source
Obsidian vault at: `/Users/darweeniel/Library/Mobile Documents/iCloud~md~obsidian/Documents/weebrain/30 Projects/GRAYBOX/_learning/`

Cards use Obsidian Spaced Repetition format:
- `::` single-line basic
- `:::` single-line reversed
- `?` / `??` multi-line
- `==text==` / `{{text}}` cloze
- Metadata: `<!--SR:!YYYY-MM-DD,interval,ease-->`

## Port From Legacy
These files should be ported from the existing desktop app:
- SRS Engine: `graybox-flashcard-desktop/src/shared/services/srsEngine.ts`
- Card Parser: `graybox-flashcard-desktop/src/shared/services/cardParser.ts`
- Card Writer: `graybox-flashcard-desktop/src/shared/services/cardWriter.ts`
- Types: `graybox-flashcard-desktop/src/shared/types/`

## Commands
```bash
# Development
npx expo start              # Start dev server
npx expo start --web        # Web only
npx expo start --ios        # iOS simulator

# Build
npx expo export --platform web   # Web build
npx eas build --platform ios     # iOS build

# Lint/Type check
npx tsc --noEmit
npx eslint .

# Backend
cd backend && uvicorn main:app --reload
```

## Design
- Dark theme only (for now)
- Primary: #6C3CE1 (deep purple)
- Accent: #00E5FF (electric cyan)
- Background: #0D0D1A
- Cards: #1A1A2E
- Spring animations (react-native-reanimated)
- 16px border radius on cards

## Who
- **Dee** (@datonedoe) — Product owner, human
- **Darweenie** (@darweeniel) — Developer, AI collaborator
