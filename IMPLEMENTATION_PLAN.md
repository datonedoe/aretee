# Aretee — Implementation Plan

## Architecture

### Unified Codebase

Single Expo (React Native) project targeting the **Apple ecosystem**:

| Platform | Target | How |
|----------|--------|-----|
| iOS | Native app | `expo run:ios` / App Store |
| Web (macOS) | Safari/Chrome | `expo export:web` / deploy |
| macOS | Native (future) | Catalyst or Electron wrapper |
| Apple Watch | Companion (future) | WatchKit extension |

> **Apple-only for now.** Android/Windows/Linux may come later. This lets us leverage iOS-native features: Widgets, Live Activities, Haptics, iCloud, Shortcuts.

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Expo (React Native) + TypeScript | Cross-platform, Dee knows TS |
| **UI** | Tamagui or NativeWind (Tailwind for RN) | Consistent styling across platforms |
| **State** | Zustand | Already used in existing apps |
| **Navigation** | Expo Router | File-based routing, works on all platforms |
| **Local DB** | expo-sqlite | Fast local queries, card cache |
| **Backend** | Python (FastAPI) | AI content generation, SkinUP |
| **AI** | Anthropic Claude API | Socratic dialogue, Feynman grading, content gen |
| **TTS** | Edge TTS (free) → ElevenLabs (future) | Audio mode |
| **Auth** | Supabase Auth | SkinUP accounts, social features |
| **Cloud DB** | Supabase (PostgreSQL) | SkinUP pool, leaderboards |
| **File Sync** | Obsidian vault (iCloud/local) | Flashcard source of truth |

### Platform Adapters

Abstract platform-specific code behind interfaces:

```typescript
// src/services/platform/types.ts
interface FileService {
  pickFolder(): Promise<string | null>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  watchFolder(path: string, callback: FileChangeCallback): Unsubscribe;
  listFiles(path: string, extension: string): Promise<string[]>;
}

interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

interface AudioService {
  play(uri: string): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): Promise<AudioStatus>;
}
```

Implementations:
- `NativeFileService` — expo-file-system + expo-document-picker (iOS)
- `WebFileService` — File System Access API (Safari/Chrome on Mac)

### Apple-Specific Features (Phase 7+)
- **iOS Widgets** — Streak flame, due card count, daily quest on home screen
- **Live Activities** — Active review session on lock screen
- **Haptic Feedback** — Satisfying taps on card flip, XP gain, achievements
- **Shortcuts** — "Hey Siri, start my Aretee review"
- **Apple Watch** — Streak glances, quick True/False review
- **iCloud Sync** — Native via Obsidian vault (already working)

---

## Project Structure

```
aretee/
├── app/                           # Expo Router screens
│   ├── _layout.tsx                # Root layout, theme, providers
│   ├── index.tsx                  # Home / dashboard
│   ├── (tabs)/                    # Tab navigator
│   │   ├── _layout.tsx
│   │   ├── flash.tsx              # Flash Mode (flashcard review)
│   │   ├── quest.tsx              # Quest Mode (daily challenges)
│   │   ├── listen.tsx             # Audio Mode (podcasts/dialogues)
│   │   └── profile.tsx            # Stats, streaks, settings
│   ├── review/
│   │   ├── [deckId].tsx           # Review specific deck
│   │   └── socratic.tsx           # Socratic dialogue session
│   ├── feynman/
│   │   └── [conceptId].tsx        # Feynman explanation session
│   ├── audio/
│   │   ├── player.tsx             # Audio player
│   │   └── generate.tsx           # Generate new audio content
│   └── settings/
│       ├── index.tsx              # Settings home
│       ├── vault.tsx              # Vault configuration
│       └── skinup.tsx             # SkinUP configuration
├── components/
│   ├── cards/
│   │   ├── FlashCard.tsx          # Card display with flip animation
│   │   ├── ResponseButtons.tsx    # Easy/Good/Hard/Again
│   │   └── CardProgress.tsx       # Session progress bar
│   ├── gamification/
│   │   ├── XPBar.tsx              # Experience bar
│   │   ├── LevelBadge.tsx         # Current level display
│   │   ├── StreakFlame.tsx        # Streak counter with fire
│   │   ├── AchievementToast.tsx   # Achievement popup
│   │   └── DailyChallenge.tsx     # Quest card
│   ├── socratic/
│   │   ├── DialogueBubble.tsx     # Chat-style dialogue
│   │   ├── ThinkingPrompt.tsx     # "What do you think?" prompt
│   │   └── InsightReveal.tsx      # Aha moment animation
│   ├── feynman/
│   │   ├── ExplainInput.tsx       # Text/voice input for explanation
│   │   ├── GradeCard.tsx          # AI grading display
│   │   └── GapHighlight.tsx       # Knowledge gap indicator
│   ├── audio/
│   │   ├── MiniPlayer.tsx         # Persistent bottom player
│   │   ├── EpisodeCard.tsx        # Audio episode listing
│   │   └── WaveformVisualizer.tsx # Audio visualization
│   └── common/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── AnimatedCounter.tsx    # XP/streak number animations
├── services/
│   ├── platform/                  # Platform adapters
│   │   ├── types.ts               # Interfaces
│   │   ├── native.ts              # iOS/Android implementation
│   │   ├── web.ts                 # Browser implementation
│   │   └── electron.ts            # Desktop implementation
│   ├── srs/
│   │   ├── engine.ts              # SM-2-OSR algorithm (from existing)
│   │   ├── parser.ts              # Card parser (from existing)
│   │   ├── writer.ts              # Card metadata writer (from existing)
│   │   └── scheduler.ts           # Due card scheduling
│   ├── ai/
│   │   ├── client.ts              # Claude API client
│   │   ├── socratic.ts            # Socratic dialogue generation
│   │   ├── feynman.ts             # Feynman grading & feedback
│   │   ├── contentGen.ts          # Audio script generation
│   │   └── prompts.ts             # System prompts for each mode
│   ├── audio/
│   │   ├── tts.ts                 # Text-to-speech service
│   │   ├── generator.ts           # Episode generation pipeline
│   │   └── player.ts              # Audio playback service
│   ├── gamification/
│   │   ├── xp.ts                  # XP calculation rules
│   │   ├── levels.ts              # Level thresholds & titles
│   │   ├── achievements.ts        # Achievement definitions & tracking
│   │   ├── streaks.ts             # Streak logic (from existing)
│   │   ├── quests.ts              # Daily quest generation
│   │   └── leaderboard.ts         # Rankings (future)
│   └── skinup/
│       ├── pool.ts                # Pool management
│       ├── drain.ts               # Drain logic
│       └── donations.ts           # Every.org API integration
├── stores/
│   ├── deckStore.ts               # Decks & cards state
│   ├── reviewStore.ts             # Active review session
│   ├── profileStore.ts            # XP, level, streaks, achievements
│   ├── audioStore.ts              # Audio playback state
│   ├── questStore.ts              # Daily quests state
│   └── settingsStore.ts           # App settings
├── types/
│   ├── card.ts                    # Card, Deck, ParsedCard
│   ├── gamification.ts            # XP, Level, Achievement, Quest
│   ├── audio.ts                   # Episode, AudioStatus
│   └── enums.ts                   # ReviewResponse, CardType, etc.
├── utils/
│   ├── dates.ts                   # Date helpers
│   ├── constants.ts               # Config constants
│   └── animations.ts              # Shared animation configs
├── assets/
│   ├── sounds/                    # Achievement sounds, UI feedback
│   ├── animations/                # Lottie animations (celebrations)
│   └── images/                    # Icons, backgrounds
├── backend/                       # Python backend (FastAPI)
│   ├── main.py                    # FastAPI app
│   ├── routers/
│   │   ├── ai.py                  # AI content generation endpoints
│   │   ├── audio.py               # TTS generation endpoints
│   │   └── skinup.py              # SkinUP pool/drain endpoints
│   ├── services/
│   │   ├── claude.py              # Claude API wrapper
│   │   ├── tts.py                 # Edge TTS wrapper
│   │   └── donations.py           # Every.org integration
│   ├── requirements.txt
│   └── Dockerfile
├── VISION.md
├── IMPLEMENTATION_PLAN.md
├── AGENTS.md                      # Instructions for Claude Code
├── app.json                       # Expo config
├── package.json
├── tsconfig.json
└── tailwind.config.js             # NativeWind config
```

---

## Gamification System

### XP Rules

| Action | XP | Multiplier |
|--------|-----|-----------|
| Review a card (any response) | 10 | — |
| Card rated Easy | +5 bonus | — |
| Complete a deck review | 50 | — |
| Daily streak maintained | 25 × streak_day | Compounds! |
| Socratic session (5+ exchanges) | 100 | — |
| Feynman explanation (≥80% score) | 150 | — |
| Feynman explanation (100% score) | 300 | — |
| Listen to full audio episode | 75 | — |
| Complete daily quest | 200 | — |
| Perfect day (all quests done) | 500 | — |
| First review after 7+ day gap | 50 | "Comeback bonus" |

### Levels

| Level | Title | XP Required | Unlock |
|-------|-------|-------------|--------|
| 1 | Novice | 0 | Basic flash mode |
| 2 | Student | 500 | Streak tracking |
| 3 | Scholar | 1,500 | Socratic mode |
| 4 | Thinker | 4,000 | Feynman mode |
| 5 | Philosopher | 10,000 | Audio mode |
| 10 | Sage | 50,000 | Custom themes |
| 15 | Oracle | 150,000 | SkinUP |
| 20 | Polymath | 500,000 | ??? |
| 25 | Aretee Master | 1,000,000 | Golden profile |

### Achievements (Sample)

| Achievement | Condition | Rarity |
|-------------|-----------|--------|
| 🔥 First Flame | 1-day streak | Common |
| 🔥 Week Warrior | 7-day streak | Uncommon |
| 🔥 Month Master | 30-day streak | Rare |
| 🔥 Century Club | 100-day streak | Legendary |
| 🧠 Feynman's Ghost | Perfect Feynman score 10x | Epic |
| 🏛️ Socrates Would Be Proud | 50 Socratic sessions | Rare |
| 🎧 Podcast Addict | 100 audio episodes | Rare |
| 💀 Skin in the Game | Activate SkinUP | Uncommon |
| 📚 Renaissance Mind | Cards in 5+ domains | Rare |
| ⚡ Speed Demon | 50 cards in under 5 min | Uncommon |
| 🎯 Sniper | 20 Easy ratings in a row | Epic |
| 🪱 Brain Worm | Review at 3 AM | Secret |

### Daily Quests (Generated)

Each day, 3 quests are generated:

1. **Core Quest** — "Review 20 due cards" (always present)
2. **Mode Quest** — "Complete 1 Socratic session" or "Do 1 Feynman explanation"
3. **Stretch Quest** — "Get 5 Easy ratings" or "Review a card you failed last time"

---

## AI Prompts Architecture

### Socratic Mode

```
SYSTEM: You are Socrates, engaging in dialectic with a student.
Your goal is NOT to teach — it is to help them discover truth through questions.

Rules:
- Never give the answer directly
- Ask ONE question at a time
- Start from what they think they know
- Gently expose contradictions
- When they reach understanding, acknowledge it
- Keep responses under 3 sentences
- Use simple, clear language

Topic: {card.question}
Known answer: {card.answer}
Student's current mastery: {card.ease}/400
```

### Feynman Mode

```
SYSTEM: You are evaluating a student's explanation of a concept.
They are attempting the Feynman Technique — explaining {concept} 
as if to a 12-year-old.

Grade their explanation on:
1. Accuracy (0-100) — Are the facts correct?
2. Simplicity (0-100) — Would a 12-year-old understand?
3. Completeness (0-100) — Are key aspects covered?
4. Analogies (0-100) — Did they use helpful comparisons?

Identify specific gaps. Ask ONE follow-up question about 
the weakest area.
```

### Audio Content Generation

```
SYSTEM: Generate a 3-5 minute conversational podcast script 
about the following concepts. Two speakers: a curious learner 
and a knowledgeable friend.

Style: Casual, engaging, like two friends at a coffee shop.
Include: Real-world examples, analogies, "aha" moments.
End with: A thought-provoking question for the listener.

Concepts to cover:
{cards.map(c => `- ${c.question}: ${c.answer}`).join('\n')}
```

---

## Migration Plan (Existing → Aretee)

### What Carries Over

| From | To | How |
|------|-----|-----|
| SRS Engine (`srsEngine.ts`) | `services/srs/engine.ts` | Direct copy, same algorithm |
| Card Parser (`cardParser.ts`) | `services/srs/parser.ts` | Direct copy |
| Card Writer (`cardWriter.ts`) | `services/srs/writer.ts` | Direct copy |
| Streak logic | `services/gamification/streaks.ts` | Enhanced version |
| Review store | `stores/reviewStore.ts` | Enhanced with XP |
| Deck store | `stores/deckStore.ts` | Enhanced |
| Card types | `types/card.ts` | Same + new fields |

### What's New

Everything else — gamification, AI modes, audio, platform adapters, backend.

---

## Phases

### Phase 1: Foundation (Sprint 1 — Night 1-2)

**Goal:** Unified Expo project with Flash Mode working on all platforms.

- [ ] Initialize Expo project with TypeScript
- [ ] Set up Expo Router with tab navigation
- [ ] Configure NativeWind (Tailwind CSS for RN)
- [ ] Create platform adapter interfaces
- [ ] Implement NativeFileService (iOS)
- [ ] Implement WebFileService (browser)
- [ ] Port SRS engine, card parser, card writer from existing code
- [ ] Build Flash Mode screens (deck list → review → results)
- [ ] Build card flip animation
- [ ] Port keyboard shortcuts (web/desktop)
- [ ] Dark theme setup
- [ ] Verify: cards load from vault, review works, metadata writes back

### Phase 2: Gamification (Sprint 2 — Night 3-4)

**Goal:** XP, levels, streaks, achievements, daily quests.

- [ ] XP calculation service
- [ ] Level progression system
- [ ] Streak tracking (read/write streak.md)
- [ ] Achievement system with definitions
- [ ] Achievement unlock detection
- [ ] Daily quest generation
- [ ] Profile/stats screen
- [ ] XP bar animation
- [ ] Level-up celebration animation
- [ ] Achievement toast notifications
- [ ] Streak flame UI component
- [ ] Sound effects for achievements/level-ups

### Phase 3: Socratic Mode (Sprint 3 — Night 5-6)

**Goal:** Interactive AI-powered Socratic dialogue from flashcard content.

- [ ] Claude API client service
- [ ] Socratic prompt engineering
- [ ] Chat-style dialogue UI
- [ ] Message streaming (real-time AI responses)
- [ ] Session history tracking
- [ ] XP integration (earn XP from Socratic sessions)
- [ ] "Insight moment" detection and celebration
- [ ] Difficulty adaptation based on card ease

### Phase 4: Feynman Mode (Sprint 4 — Night 7-8)

**Goal:** Explain concepts back, get AI grading.

- [ ] Feynman prompt engineering
- [ ] Text input for explanations
- [ ] AI grading with rubric (accuracy, simplicity, completeness, analogies)
- [ ] Score visualization
- [ ] Gap identification and follow-up questions
- [ ] Feynman score history tracking
- [ ] XP integration
- [ ] Voice input option (speech-to-text via Whisper)

### Phase 5: Audio Mode (Sprint 5 — Night 9-10)

**Goal:** AI-generated podcasts from flashcard content, listenable anywhere.

- [ ] Python backend setup (FastAPI)
- [ ] Audio script generation (Claude)
- [ ] Edge TTS integration
- [ ] Audio file generation pipeline
- [ ] Episode listing UI
- [ ] Audio player with mini-player
- [ ] Background playback (mobile)
- [ ] Auto-generate episodes from due/weak cards
- [ ] Playback speed controls
- [ ] XP for listening

### Phase 6: SkinUP (Sprint 6 — Night 11-12)

**Goal:** Money accountability system with real stakes.

- [ ] Supabase setup (auth + database)
- [ ] Pool deposit flow (Stripe for fiat)
- [ ] Every.org API integration (org search + donations)
- [ ] Drain timer service (server-side)
- [ ] SkinUP dashboard UI
- [ ] Push notifications for drain events
- [ ] Emergency pause with cooldown
- [ ] Pool balance tracking
- [ ] Grace period configuration

### Phase 7: Polish (Sprint 7+)

- [ ] Onboarding flow
- [ ] Knowledge graph visualization
- [ ] ElevenLabs TTS upgrade option
- [ ] Crypto SkinUP (USDC on Base)
- [ ] Social features / leaderboards
- [ ] Widget (iOS/Android)
- [ ] System tray (desktop)
- [ ] App Store / Play Store submission

---

## Sprint Execution Plan

Each sprint is designed for **overnight autonomous coding** via Claude Code:

1. **PROMPT.md** — Sprint-specific instructions
2. **AGENTS.md** — Project context, conventions, test commands
3. Claude Code runs in ralph-loop: plan → build → test → commit → repeat
4. Morning: Dee reviews commits, provides feedback
5. Next night: incorporate feedback + next sprint

### Sprint 1 Deliverable

By morning after Night 1:
- `npx expo start` launches the app
- Can select Obsidian vault folder
- Flashcards load and display
- Full review flow works (Easy/Good/Hard/Again)
- Metadata writes back to markdown files
- Works on iOS simulator + web browser
- Dark theme, clean UI
- All existing flashcard functionality preserved

---

## Design Language

| Element | Value |
|---------|-------|
| Primary color | Deep purple (#6C3CE1) |
| Accent | Electric cyan (#00E5FF) |
| Background | Near-black (#0D0D1A) |
| Card surface | Dark gray (#1A1A2E) |
| Text | Off-white (#E8E8F0) |
| Success | Emerald (#10B981) |
| Warning | Amber (#F59E0B) |
| Error | Rose (#F43F5E) |
| Font | System default (SF Pro on iOS, Roboto on Android) |
| Border radius | 16px (cards), 12px (buttons) |
| Animations | Spring-based (react-native-reanimated) |

---

## Success Criteria (v1.0)

- [ ] Single codebase runs on iOS + web + desktop
- [ ] Flash Mode feature-complete (matches existing apps)
- [ ] Gamification live (XP, levels, streaks, achievements, quests)
- [ ] Socratic Mode working with Claude API
- [ ] Feynman Mode working with AI grading
- [ ] Audio Mode generates and plays episodes
- [ ] SkinUP deposits and drains work
- [ ] Fun enough that Dee opens it daily without being reminded

---

*Built with 🏛️ by Darweenie & Dee*
