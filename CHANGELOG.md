# Aretee Changelog

> Personal learning OS — gamified, AI-powered, multi-modal
> Repo: `datonedoe/aretee` | Stack: Expo + TypeScript + Python (FastAPI)

---

## 2026-02-12 — Research Roadmap, Security, X Bookmarks Pipeline

### Sprint Plan (Sprints 8-17) ✅
- Created comprehensive sprint roadmap mapping learning science research to features
- Sprint 8: FSRS algorithm (replacing SM-2)
- Sprint 9: Error pattern analysis engine
- Sprint 10: Interleaving + microlearning notifications
- Sprint 11: Immersion feed (TikTok-style, AI-generated content)
- Sprint 12: Deep conversation scenarios
- Sprints 13-17: Shadow learning, social, contextual vocab, AI video, X bookmarks integration
- **Commit:** `59a0540`

### Security Hardening ✅
- `.gitignore` updated: blocks `.env`, `venv/`, `__pycache__/`, secrets dirs
- `.env.example` added with placeholder keys
- Pre-commit hook scans for API keys, AWS keys, phone numbers, passwords
- Verified no secrets in git history
- **Commit:** `ce97324`

### X Bookmarks → Knowledge Pipeline ✅
- Autonomous export of 283 X/Twitter bookmarks across 17 folders via GraphQL API
- Obsidian Second Brain: 18 organized notes in `50 Resources/X Bookmarks/`
- Aretee flashcard decks: 54 cards across 5 decks (Quant, Crypto, Finance, MSTR, Investing)
- Article summaries: 39 fetched & summarized articles
- Bookmark search utility script
- Auto-fetch cron (every 3 days) + weekly digest cron (Sundays 10am)
- Podcast generation from bookmark content (5 episodes)

### Sprint 8 — FSRS Algorithm Upgrade ✅
- Replaced SM-2 with FSRS-5 (three-component memory model: Difficulty, Stability, Retrievability)
- 19 default parameters, 20-30% fewer reviews for same retention
- Response latency tracking (hesitation = weaker encoding)
- Configurable retention target (0.7-0.97, default 0.9)
- SM-2 → FSRS migration utility (preserves history)
- Review Analytics dashboard (14-day forecast, retention rate, maturity distribution)
- New Analytics tab
- Extended markdown format (backward compatible)
- **Commit:** `3eaeda9`

### Sprint 11 — Immersion Feed ✅
- TikTok-style vertical scroll feed UI
- 5 AI content types: dialogue, news, cultural, overheard, street slang
- Difficulty auto-calibration via interaction feedback (moving average)
- Long-press any word → Claude translates → add to flashcard deck
- Edge TTS audio per feed item
- 9 languages, regional Spanish variants (Mexico, Spain, Argentina, Colombia)
- Profanity warnings + regional tags
- New "Immerse" tab
- **Commit:** `9fb402e`

### Still In Progress
- [ ] 5 podcast episodes from X bookmarks (sub-agent building)

---

## 2026-02-11 — Project Launch & Sprints 1-6

### Sprint 1 — Foundation + Flash Mode ✅
- Initialized Expo project with TypeScript + Expo Router
- NativeWind (Tailwind) configured for dark theme
- Platform adapters: iOS (native file system) + Web (File System Access API)
- Ported SRS engine, card parser, card writer from Graybox legacy app
- Flash Mode: deck list → card review → results
- Card flip animation, keyboard shortcuts (web)
- Zustand stores (deck, review, settings)
- **Commit:** `3d00aa8` — ~14k lines

### Sprint 2 — Gamification ✅
- XP system (earn from reviews, streaks, sessions)
- Level progression: Novice → Student → Scholar → ... → Aretee Master
- Streak tracking with fire animation 🔥
- 12 achievements (First Flame, Brain Worm, Week Warrior, etc.)
- Daily quest generation (3/day)
- Profile/stats screen with XP bar
- Level-up celebration animation + achievement toasts + sound effects
- **Commit:** `f9e345a` — ~2.1k lines

### Sprint 3 — Socratic Mode ✅
- Claude API client (using Haiku for cost efficiency)
- Socratic dialogue engine with streaming responses
- Chat-style UI (user right, Socrates left)
- Session history tracking
- XP integration
- Insight moment detection + celebration
- Difficulty adaptation based on card ease
- **Commit:** `1364edf` — ~1.4k lines

### Sprint 4 — Feynman Mode ✅
- "Explain it like I'm 12" text input
- AI grading rubric: accuracy, simplicity, completeness, analogies
- Score visualization with color-coded bars
- Gap identification + follow-up questions
- Feynman score history tracking
- Voice input option (speech-to-text)
- XP integration
- **Commit:** `0163058` — ~1.5k lines

### Sprint 5 — Audio Mode ✅
- Python backend (FastAPI) for AI content generation
- Claude script generation (podcast-style conversations)
- Edge TTS integration (free)
- Audio file generation pipeline
- Episode listing UI + mini-player
- Playback speed controls
- XP for listening
- **Commit:** `ae5df00` — ~1.8k lines

### Sprint 6 — SkinUP ✅
- Pool management (deposit, drain, pause, resume)
- Drain timer with grace period support
- Mock Every.org integration (8 real orgs, search, donate)
- SkinUP dashboard (pool balance, drain timer, emergency pause)
- 5-step setup wizard (amount → speed → grace → charity → confirm)
- Animated balance bar with pulse on critical state
- Zustand store wired to all services
- **Commit:** `e2a309f` — ~1.9k lines

### Remaining
- [ ] Sprint 7 — Polish (onboarding, widgets, App Store prep)
- [ ] Xcode install for iOS simulator testing
- [ ] Wire up real Supabase/Stripe/Every.org APIs
