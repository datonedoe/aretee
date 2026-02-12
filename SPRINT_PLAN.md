# Aretee Sprint Plan — Phases 2-3
*Research-backed features mapped to buildable sprints*

---

## Completed Sprints (Phase 1)
| Sprint | Feature | Status |
|--------|---------|--------|
| 1 | Foundation + Flash Mode (SM-2 SRS) | ✅ `3d00aa8` |
| 2 | Gamification (XP, levels, streaks, achievements, quests) | ✅ `f9e345a` |
| 3 | Socratic Mode (AI dialogue) | ✅ `1364edf` |
| 4 | Feynman Mode (explain + AI grading + voice) | ✅ `0163058` |
| 5 | Audio Mode (podcast generation, Edge TTS) | ✅ `ae5df00` |
| 6 | SkinUP (money accountability) | ✅ `e2a309f` |
| 7 | Polish (onboarding, widgets, App Store) | 🔲 Pending |

---

## Sprint 7: Polish & App Store Prep
**Goal:** Ship-ready iOS app

- [ ] Onboarding flow (placement test, interest selection, goal setting)
- [ ] iOS Widgets (card of the day, streak counter, XP progress)
- [ ] Siri Shortcuts integration ("quiz me", "play podcast")
- [ ] App icon, splash screen, screenshots
- [ ] App Store metadata + submission
- [ ] Performance optimization + offline support
- [ ] Haptic feedback throughout

---

## Sprint 8: FSRS Algorithm Upgrade
**Research basis:** FSRS is 20-30% more efficient than SM-2. Three-component memory model (Difficulty, Stability, Retrievability). User-controlled retention targets.

- [ ] Replace SM-2 with FSRS-5/6 implementation
- [ ] Response latency tracking (hesitation = weak encoding)
- [ ] Per-card difficulty modeling
- [ ] User-configurable retention targets (70-97%)
- [ ] Migration path from existing SM-2 card data
- [ ] Multi-modal reinforcement tracking (which mode taught this card?)
- [ ] Semantic clustering boost (learning "correr" boosts "corredor")
- [ ] Review analytics dashboard (daily load, retention rate, forecast)

---

## Sprint 9: Error Pattern Analysis Engine
**Research basis:** L1 interference, false friends, overgeneralization. Targeted practice on specific error types. Adaptive difficulty via error taxonomy.

- [ ] Error classification system (L1 interference, false friends, overgeneralization, register mismatch, avoidance)
- [ ] Per-user error profile tracking
- [ ] Targeted practice session generator (top 3-5 error patterns)
- [ ] Error reduction tracking over time
- [ ] Pretesting / errorful generation ("guess before you learn")
- [ ] Contrastive instruction for L1 interference patterns
- [ ] Integration with Socratic + Feynman modes (use errors to guide AI dialogue)

---

## Sprint 10: Interleaving Engine + Microlearning
**Research basis:** Interleaving > blocking for long-term retention. Microlearning notifications create multiple daily touchpoints with near-zero friction.

- [ ] Interleaving scheduler (mix topics, skills, difficulty within sessions)
- [ ] Session composer (blend Flash + Socratic + Feynman in one session)
- [ ] Push notification micro-challenges (30-sec, FSRS-timed)
  - Quick recall
  - Listening snap (10-sec audio clip)
  - Fill the gap
  - Picture describe
  - "Did you know?" cultural micro-lessons
- [ ] Smart timing (calendar-aware, commute detection, respect quiet hours)
- [ ] Lock screen vocabulary widget

---

## Sprint 11: Immersion Feed
**Research basis:** Krashen's i+1, comprehensible input, TikTok-style scroll UX. The moonshot differentiator.

- [ ] Vertical scroll feed UI (TikTok/Reels-style)
- [ ] AI content generator (Claude) — calibrated to user's level
  - Short dialogues/skits
  - News summaries at your level
  - Cultural explainers
  - Meme breakdowns in target language
  - "Overheard" conversations
- [ ] Difficulty auto-calibration (i+1 targeting)
- [ ] Swipe feedback ("too easy" / "too hard" / "perfect")
- [ ] Tap-to-translate on unknown words → auto-add to SRS deck
- [ ] Audio + illustrated stills format (cheap, effective)
- [ ] Interest-based content (onboarding interests drive topics)
- [ ] Street language content packs (profanity, filler words, texting slang, regional expressions)
- [ ] Feed analytics (time spent, words learned incidentally)

---

## Sprint 12: Deep Conversation Scenarios
**Research basis:** Production > recognition. AI characters with personality and memory. Register coaching. Branching consequences.

- [ ] Character system (named AI personas with backstories, speech patterns)
- [ ] Scenario library
  - Ordering food (with complications)
  - Negotiating rent
  - Flirting at a bar
  - Job interview
  - Complaining to customer service
  - Arguing with a partner
  - Making small talk at a party
- [ ] Branching consequences (rudeness → hostility, humor → deeper convo)
- [ ] Adaptive difficulty (AI simplifies if you struggle, speeds up if you crush it)
- [ ] Post-conversation review (what you said well, alternatives, new vocab)
- [ ] Register coaching ("you used 'usted' in a casual setting — here's how a friend would say that")
- [ ] Conversation duration tracking (goal: survive 5 min → 10 min → 30 min)

---

## Future Sprints (Phase 3+)
| Sprint | Feature | Research Basis |
|--------|---------|----------------|
| 13 | Shadow Learning (ambient audio, bedtime stories, music mode) | Incidental acquisition, dual coding |
| 14 | Social & Competitive (friend groups, versus mode, eavesdrop challenges) | Social accountability, competition |
| 15 | Contextual Vocab (browser extension, photo OCR, collocation learning) | Contextual acquisition, in-the-wild learning |
| 16 | AI Video Immersion Feed v2 (synthetic speakers, short-form video) | Multi-modal encoding, video-based acquisition |
| 17 | X Bookmarks → Aretee Pipeline (auto-import bookmarks as learning material) | Personal knowledge → flashcards → podcasts |

---

## Design Principles (from Research)

1. **Production over recognition.** Bias toward generating, not choosing.
2. **Desirable difficulties.** It should feel hard. Gamify the struggle, not the ease.
3. **Interleave everything.** Never teach in isolated blocks.
4. **Real language, not textbook.** Street, slang, profanity, filler words.
5. **Context is king.** Words in isolation don't stick. Words in stories do.
6. **Multi-modal always.** Every concept: read it, hear it, say it, use it.
7. **Passive counts.** Background listening and ambient exposure accelerate acquisition.
8. **Social pressure works.** Small groups > leaderboards. Accountability > competition.
