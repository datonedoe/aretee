# Aretee Research Report
### Next-Generation Personalized Learning OS
*Compiled February 2026 — Reference document for 12+ months of development*

---

## Table of Contents
1. [Learning Science Breakthroughs](#section-1-learning-science-breakthroughs)
2. [What's Broken in Current Apps](#section-2-whats-broken-in-current-apps)
3. [Next-Gen Features to Build](#section-3-next-gen-features-to-build)
4. [Competitive Landscape](#section-4-competitive-landscape)
5. [Feature Roadmap Recommendations](#section-5-feature-roadmap-recommendations)

---

## Section 1: Learning Science Breakthroughs

### 1.1 Personalized & Adaptive Learning (2023–2026)

The convergence of LLMs and learning science has created a fundamentally new paradigm. Key developments:

**AI-Powered Knowledge Tracing.** Deep Knowledge Tracing (DKT) models, originally from Piech et al. (2015), have evolved significantly. By 2024–2025, transformer-based knowledge tracing models can predict learner mastery with >85% accuracy by analyzing response patterns, time-on-task, and error types. This means an app can infer *what you know* from *how you answer*, not just *whether you got it right*.

**Learner Modeling Beyond Correctness.** Modern adaptive systems track:
- **Response latency** — hesitation signals weak encoding even on correct answers
- **Error type clustering** — distinguishing typos from conceptual errors from L1 interference
- **Engagement patterns** — time of day, session length, dropout points
- **Affective state** — frustration detection through interaction patterns (rapid wrong answers, long pauses)

**Key insight for Aretee:** Don't just track right/wrong. Track *how* someone got it right or wrong. A correct answer after 15 seconds of hesitation is fundamentally different from an instant correct answer. Both should update the learner model differently.

### 1.2 Comprehensible Input Theory (Krashen) + AI

Stephen Krashen's Input Hypothesis (i+1) states learners acquire language when they receive input slightly above their current level. This was always theoretically compelling but practically impossible to implement at scale — until now.

**Why AI changes everything for comprehensible input:**
- **Dynamic i+1 calibration.** An LLM can generate text/audio at precisely the right difficulty level for each individual learner. Not "beginner/intermediate/advanced" buckets — actual continuous calibration.
- **Interest-based input.** Krashen also emphasized the Affective Filter Hypothesis: anxiety and boredom kill acquisition. AI can generate comprehensible input *about topics the learner actually cares about*. Sports, music, tech, cooking — personalized content in the target language.
- **Massive volume.** Acquisition requires enormous amounts of input. AI can generate essentially unlimited reading/listening material at the right level.

**The "narrow reading" extension:** Krashen advocates reading many texts on the same topic (narrow reading) because repeated domain vocabulary creates natural reinforcement. AI can generate a series of articles on, say, Formula 1 racing in Spanish — each slightly harder than the last, with natural vocabulary recycling.

**Critical design principle:** Aretee should feel like consuming content, not studying. The best implementation of comprehensible input is indistinguishable from scrolling interesting content that happens to be in your target language.

### 1.3 Spaced Repetition: Beyond SM-2

**SM-2 is obsolete.** Anki's default algorithm (SM-2, from 1987) uses fixed ease factors and simple interval multipliers. It has no model of memory — it's just a heuristic.

**FSRS (Free Spaced Repetition Scheduler)** — developed by Jarrett Ye at MaiMemo — is the current state-of-the-art open-source SRS algorithm. Key advances:

- **Three-component memory model (DSR):**
  - **Difficulty (D):** Inherent complexity of the item
  - **Stability (S):** Time (in days) for recall probability to drop from 100% to 90%
  - **Retrievability (R):** Current probability of successful recall
- **Machine learning optimization:** FSRS uses 21 parameters (as of FSRS-6) fitted to the user's actual review history. Even with default parameters trained on hundreds of millions of reviews from ~10k users, it outperforms SM-2.
- **20-30% fewer reviews** for the same retention level vs SM-2
- **Better handling of breaks** — FSRS correctly models what happens when you skip reviews for weeks/months
- **User-controlled retention targets** — set desired retention (70-97%) and FSRS calculates optimal intervals. This is crucial: some content needs 95% retention (core grammar), some only needs 75% (obscure vocabulary).

**For Aretee:** Don't use SM-2. Implement FSRS or a similar learner-adaptive algorithm. Better yet, extend it:
- **Context-dependent stability:** A word learned through a memorable conversation has different stability than one learned from a flashcard
- **Multi-modal reinforcement tracking:** Seeing a word in a reel, hearing it in a podcast, and using it in conversation should all update the memory model differently
- **Semantic clustering:** When you learn "correr" (to run), related words like "corredor" (runner) and "carrera" (race) should get partial stability boosts

### 1.4 Retrieval Practice Variations

Retrieval practice (testing yourself) is the single most robust finding in learning science. But not all retrieval is equal:

**Production > Recognition.** Generating an answer (free recall, speaking, writing) creates stronger memories than choosing from options (multiple choice). Duolingo over-relies on recognition. Aretee should bias heavily toward production.

**Successive Relearning.** Rawson & Dunlosky (2011, extended through 2024) show that retrieval practice spaced across multiple sessions produces near-permanent learning. The protocol: practice to criterion (get it right once), then re-test in subsequent sessions until it's automatic.

**Retrieval in varied contexts.** Testing the same knowledge in different formats (translate it, use it in a sentence, hear it and identify it, produce it in conversation) creates more flexible, accessible memories than always testing the same way.

**Pretesting / Errorful Generation.** Asking learners to guess *before* learning (even when they'll be wrong) improves subsequent learning. Aretee could show a short clip and ask "what do you think they said?" before revealing the answer.

### 1.5 Interleaving vs. Blocking

**Blocking** = studying all examples of one concept before moving to the next (all "-ar" verbs, then all "-er" verbs).
**Interleaving** = mixing different concepts within a study session.

The evidence is clear: **interleaving produces superior long-term retention and transfer**, despite feeling harder and producing worse performance during practice (Rohrer, 2012; Brunmair & Richter, 2019 meta-analysis).

**Why it works:** Interleaving forces discriminative contrast — learners must identify *which* rule/pattern applies, not just apply a known rule. This maps directly to real language use, where you're never told "now conjugate in the past tense."

**For Aretee:** Never teach grammar in isolated blocks. A single practice session should mix tenses, vocabulary domains, and skill types (reading, listening, speaking). This will feel harder to users and they'll initially rate it lower — but learning outcomes will be dramatically better. Communicate this: "It's supposed to feel hard. That's how you know it's working."

### 1.6 Desirable Difficulties (Bjork & Bjork)

Robert and Elizabeth Bjork's framework: conditions that make learning *feel* harder often make it *stick* better. Key desirable difficulties:

- **Spacing** (vs. massing): Already covered via SRS
- **Interleaving** (vs. blocking): Already covered above
- **Variability of practice:** Learning a word in multiple contexts, voices, speeds
- **Reducing feedback:** Delaying or reducing feedback forces deeper processing. Don't show the answer immediately — let the learner struggle.
- **Generation:** Making learners produce (vs. consume) information
- **Contextual interference:** Changing the context of practice (different speakers, background noise, register)

**The UX tension:** Desirable difficulties feel bad. Users will rate the app lower on "ease of use" but learn more. This is the fundamental challenge — Duolingo optimized for feeling good (streaks, hearts, easy multiple choice) at the expense of actual learning. Aretee should optimize for actual learning while making the *difficulty* feel rewarding, not punishing. Gamify the struggle, not the ease.

### 1.7 Dual Coding & Multi-Modal Learning

Paivio's Dual Coding Theory: information encoded both verbally and visually is remembered better than either alone. Extended to multi-modal:

**Multi-modal encoding creates more retrieval routes:**
- Hear "el perro" + see a dog + say "el perro" + read "el perro" = 4 encoding pathways
- Each pathway can independently trigger recall
- Cross-modal associations strengthen over time

**Recent research (2023-2025) on video-based language learning:**
- Montero Perez et al. show that captioned video (L2 audio + L2 captions) produces superior vocabulary acquisition compared to audio-only or text-only
- The key is **redundancy across modalities** — hearing and reading simultaneously creates stronger traces
- Short-form video (15-60 seconds) may be optimal for vocabulary acquisition due to attentional constraints

**For Aretee:** Every vocabulary item should be encountered across multiple modalities. Not as separate "modes" but woven naturally:
1. Encounter word in an immersion reel (audio + visual context + subtitle)
2. Hear it in a podcast segment about a topic you care about
3. Need to produce it in a conversation simulation
4. See it in a reading passage
5. Get tested on it via flashcard as a final reinforcement

---

## Section 2: What's Broken in Current Apps

### 2.1 Duolingo's Generic Curriculum Problem

Duolingo (~130M MAU, $748M revenue in 2024) has mastered gamification and habit formation. But its learning model is fundamentally flawed for serious learners:

**One-size-fits-all path.** Every Spanish learner gets essentially the same tree/path. Whether you're a Portuguese speaker (where Spanish is 80% cognate) or a Mandarin speaker (totally different language family), you get the same content in roughly the same order. This is absurd from a learning science perspective — the optimal curriculum depends entirely on what you already know.

**Over-reliance on translation and recognition.** Most Duolingo exercises are: translate this sentence, pick the right word, match pairs. These are recognition tasks, not production. You can "complete" the Duolingo tree and still not be able to form a sentence in conversation.

**Gamification that optimizes for engagement, not learning.** Streaks, hearts, leaderboards, and XP create powerful habits — but they incentivize *doing easy reviews* over *learning new hard material*. Users "practice" easy lessons to maintain streaks rather than pushing into uncomfortable new territory.

**Plateau at A2-B1.** Duolingo can take you from zero to basic tourist-level competence. But the content runs out of depth around CEFR B1. Advanced grammar, nuanced vocabulary, idiomatic expression, register variation — none of this is well-served.

**No real output practice.** You never actually *speak* in Duolingo in a meaningful way. Their "speaking exercises" are read-aloud tasks with basic pronunciation checking, not conversation.

### 2.2 Anki: Powerful but Hostile UX

Anki is the most effective flashcard tool in existence. Its SRS algorithm works (and FSRS makes it even better). Power users swear by it. But:

**The blank card problem.** New users open Anki and see... nothing. No content. You have to find or make your own decks. This is a massive cold-start problem. Compare to Duolingo where you tap "Spanish" and start learning in 30 seconds.

**Desktop-era interface.** Anki's UI is from 2006 and it looks like it. The mobile apps are marginally better. There's no delight, no visual design, no modern mobile UX patterns.

**Card creation is work.** Making good Anki cards is a skill in itself. Most people make terrible cards (too much information, poor formatting, no context). The power of Anki is locked behind a significant learning curve.

**No intelligence in content.** Anki is a scheduling engine, not a learning system. It doesn't know that "perro" and "gato" are both animals. It doesn't generate example sentences. It doesn't adapt the *content*, only the *timing*.

**No multi-modal integration.** Each card is an isolated unit. There's no narrative, no context, no connection between cards. It's brute-force memorization.

### 2.3 Gap Analysis: What NO Current App Does Well

| Gap | Description |
|-----|-------------|
| **True personalization** | No app builds a real model of *your* knowledge, *your* interests, *your* learning patterns and generates content accordingly |
| **Street language** | Every app teaches formal/textbook language. Nobody teaches you how people actually text, curse, joke, or argue |
| **Immersion simulation** | No app creates the experience of being immersed in a language environment — consuming natural content at your level |
| **Conversation depth** | AI conversation apps exist (Speak, Praktika) but they're still clearly tutoring interactions, not natural conversations |
| **Cross-modal vocabulary tracking** | No app tracks whether you learned a word from reading vs. hearing vs. speaking and optimizes review modality accordingly |
| **Content you'd actually choose to consume** | Nobody generates content that's genuinely interesting to you specifically, in your target language |
| **Output-first learning** | Apps are input-heavy. Real fluency requires massive output practice — speaking and writing — with intelligent feedback |
| **Register awareness** | No app teaches you when to use formal vs. informal vs. slang, or code-switching between registers |
| **Error pattern analysis** | No app deeply analyzes *why* you make specific errors (L1 interference, false friends, overgeneralization) and targets those patterns |

### 2.4 The "Textbook vs. Street" Language Problem

This is a massive unsolved problem. Consider Spanish:

**What Duolingo teaches:** "¿Dónde está el baño?" / "Me gustaría un café, por favor."

**What people actually say:** "Wey, no mames" / "Qué pedo?" / "Está chido" / "Me vale madre"

The gap between textbook language and street language is enormous in every language. Current apps avoid street language because:
- It varies by region (Mexican Spanish ≠ Argentine Spanish ≠ Spanish Spanish)
- It includes profanity (liability/brand concerns)
- It's hard to systematize (slang evolves constantly)
- It requires cultural context to use correctly

**But street language is what learners actually need.** If you move to Mexico City, you need to understand "no manches" on day one. Understanding formal language doesn't help you follow a conversation between friends.

**Aretee's opportunity:** Be the app that isn't afraid to teach real language. Not just sanitized slang, but actual vulgar language, regional expressions, internet slang, texting abbreviations. With appropriate context about when/where to use it.

Specific categories of "street language" no app covers:
- **Profanity and vulgar expressions** (how to curse naturally, what different intensity levels communicate)
- **Filler words** (Spanish: "pues", "o sea", "es que" — essential for sounding natural)
- **Texting/messaging language** (abbreviations, emoji usage that varies by culture)
- **Slang with cultural loading** (words that carry social/class/regional identity)
- **Code-switching patterns** (when to switch between formal and informal)
- **Humor and sarcasm** (different cultures structure jokes differently)
- **Argumentation patterns** (how people actually argue, disagree, express frustration)

---

## Section 3: Next-Gen Features to Build

### 3.1 AI-Generated Immersion Feeds

**Concept:** A TikTok/Reels-style feed of short-form content entirely in the target language, dynamically generated or curated at your exact comprehension level.

**How it works:**
- Content is generated using AI (video with AI avatars, or curated from real content with difficulty scoring)
- Each piece contains ~80-90% comprehensible content + ~10-20% new vocabulary/structures (Krashen's i+1)
- Subtitles in target language with tap-to-translate on unknown words
- Swiping = "too easy" or "too hard" feedback that refines the algorithm
- Topics match user interests (set during onboarding, refined through engagement data)

**Content types in the feed:**
- Short skits/dialogues (AI-generated with synthetic video/voice)
- Meme explanations in target language
- News summaries at your level
- Cultural explainers (why do Mexicans say X?)
- "Overheard" conversations (simulated real-world eavesdropping)
- Music clips with lyric breakdowns

**Key technical decisions:**
- AI-generated vs. curated real content: Start with AI-generated (faster iteration, perfect difficulty control), layer in real content curation as the system matures
- Video vs. audio+image: Audio with illustrated stills or simple animations is 10x cheaper than AI video and nearly as effective for learning
- Subtitle behavior: Default L2 subtitles, tap for L1 translation, long-press for grammar/usage notes

### 3.2 Conversation Simulation (AI Roleplay)

**Concept:** Voice-based conversation practice with AI characters in realistic scenarios, with real-time feedback.

**Scenarios beyond the basics:**
- 🍕 Ordering food (with realistic complications: "we're out of that")
- 🏠 Negotiating rent with a landlord
- 💬 Gossiping about a mutual friend
- 🔥 Flirting at a bar (with culturally appropriate pickup lines and responses)
- 😡 Complaining to customer service
- 🎉 Making small talk at a party where you know no one
- 💼 Job interview
- 🏥 Describing symptoms to a doctor
- 😤 Having an argument with a partner (emotional register practice)
- 🤣 Telling a joke and reacting to jokes

**What makes this different from Speak/Praktika:**
- **Characters have personality and memory.** Not generic "AI tutor" — specific characters with backstories, opinions, and conversational styles. "Diego is sarcastic and talks fast. He'll use lots of Mexico City slang."
- **Branching consequences.** If you're rude in a negotiation scenario, the landlord gets hostile. If you're funny at the bar, the conversation deepens. Choices matter.
- **Difficulty auto-adjustment.** If you're struggling, the AI character naturally simplifies their language (like a real native speaker would). If you're crushing it, they speed up and use more idioms.
- **Post-conversation review.** After each conversation: highlight what you said well, what was awkward, alternative phrasings, new vocabulary encountered. This is the learning moment.
- **Register coaching.** "You used the formal 'usted' in this casual setting — here's how a friend would actually say that."

### 3.3 Adaptive Difficulty via Error Pattern Analysis

**Concept:** Build a deep model of each learner's specific error patterns and generate targeted practice.

**Error taxonomy for language learning:**
| Error Type | Example | Intervention |
|-----------|---------|-------------|
| **L1 interference** | English speaker says "Yo soy caliente" (I'm hot/horny) instead of "Tengo calor" | Explicit contrastive instruction: "In Spanish, you HAVE heat, you don't BE hot" |
| **False friends** | "Embarazada" ≠ "embarrassed" | Mnemonic + repeated exposure in correct context |
| **Overgeneralization** | Regularizing irregular verbs ("yo sabo" instead of "yo sé") | Targeted drill on irregulars, interleaved with regulars |
| **Avoidance** | Never using subjunctive because it's hard | Scenarios that require subjunctive, with graduated support |
| **Register mismatch** | Using textbook formal in casual chat | Exposure to casual register content, feedback on appropriateness |
| **Pronunciation fossilization** | Persistent mispronunciation of specific phonemes | Focused phonetic drills with visual feedback (spectrogram comparison) |

**Implementation:**
- Tag every error with type, severity, and context
- Build per-user error profiles
- Generate practice sessions that target the top 3-5 most impactful error patterns
- Track error reduction over time as a visible metric

### 3.4 Shadow Learning (Passive Absorption)

**Concept:** Learning that happens in the background while the user does other things.

**Implementations:**
- **Ambient audio mode.** Play comprehensible-input podcasts/conversations while commuting, cooking, exercising. Not active study — just exposure. Background acquisition is real (Webb & Nation, 2017 on incidental vocabulary learning from listening).
- **Notification vocabulary.** Replace generic push notifications with target-language micro-lessons. Lock screen shows a word-of-the-moment with context.
- **Phone language integration.** Encourage (and guide) setting phone UI to target language. Aretee tracks which UI terms you've learned.
- **Music mode.** Surface popular songs in target language, with lyric explanations. Music is a powerful acquisition channel (Ludke et al., 2014 — singing in a foreign language improves vocabulary retention).
- **Dream mode.** Bedtime stories/guided relaxation in target language at i-1 level (slightly below current level for effortless comprehension). Not scientifically proven to help, but creates positive associations and is a retention feature.

### 3.5 Social & Competitive Learning (Not Cringe)

**What makes most social learning cringe:**
- Forced "language exchange" with strangers (awkward)
- Leaderboards that reward time spent, not learning (Duolingo)
- "Share your streak!" prompts (desperate)

**What could actually work:**
- **Study groups with friends.** 3-5 friends learning the same language. Shared challenges, group streaks, inside jokes. Think a WhatsApp group that generates collaborative challenges.
- **Versus mode.** Head-to-head challenges testing specific skills. Not XP-based — skills-based. "Who can survive a conversation with Diego longer?"
- **Eavesdrop challenges.** Both players listen to a conversation clip, whoever understands more wins. Tests actual comprehension.
- **Conversation recordings (opt-in).** "Listen to how your friend handled the landlord negotiation." Learn from each other's conversations.
- **Cultural challenges.** "This week: understand 3 Mexican memes." Shared cultural discovery.

### 3.6 Podcast-Style Lessons from YOUR Weak Areas

**Concept:** AI generates 5-15 minute podcast episodes tailored to what you need to learn.

**Format:**
- Two hosts (AI voices) discussing a topic in the target language
- Difficulty calibrated to your level
- Naturally embeds vocabulary and grammar you need to practice
- Pauses to explain or ask the listener to guess
- Available in "active" (with exercises) and "passive" (just listen) modes

**Example:** You keep messing up subjunctive triggers. The AI generates a podcast episode where the hosts debate "what would you do if you won the lottery?" — naturally requiring tons of subjunctive. Your weak grammar point becomes embedded in compelling content.

### 3.7 Microlearning Moments

**Concept:** 15-60 second learning interactions triggered by push notifications.

**Types:**
- **Quick recall.** "How do you say 'I'm running late' in Spanish?" Tap to answer, swipe to skip.
- **Listening snap.** 10-second audio clip. "What did they say?" Multiple choice.
- **Fill the gap.** A sentence with one word missing. Contextual vocabulary test.
- **Picture this.** An image + "describe this in Spanish" (production practice).
- **Did you know?** Cultural micro-lesson. "In Argentina, 'coger' means something very different than in Spain..."

**Timing intelligence:**
- Don't notify during meetings (calendar integration)
- Optimize for transition moments: commute times, lunch break, post-work
- Frequency adapts to engagement (more for heavy users, fewer for casual)
- Use FSRS data: notify about items approaching their optimal review time

### 3.8 Contextual Vocabulary Acquisition

**Concept:** Learn words in the contexts YOU encounter them, not from a pre-set vocabulary list.

**Implementations:**
- **Browser extension / screen reader.** Detect target-language text the user encounters in the wild (social media, websites, subtitles). Offer instant tap-to-learn with automatic addition to the user's vocabulary deck.
- **Photo vocabulary.** Take a photo of a menu, sign, or text → OCR → instant vocabulary extraction → add to personalized deck with the original photo as context.
- **Conversation vocabulary.** Words you encountered in AI conversations get automatically tracked and reviewed.
- **Interest graph vocabulary.** If you follow Formula 1, proactively teach you F1-related vocabulary in the target language.
- **Collocation learning.** Don't teach words in isolation. Teach "tomar una decisión" (make a decision), not just "decisión." Words are used in patterns; teach the patterns.

---

## Section 4: Competitive Landscape

### 4.1 Established Players

#### Duolingo
- **What it does well:** Habit formation (streaks, gamification), brand recognition, low barrier to entry, broad language coverage (42 languages), free tier. Pioneered making language learning feel like a game. $748M revenue (2024), 130M MAU.
- **What it misses:** No real conversation practice, generic curriculum, plateaus at B1, no street language, translation-heavy exercises, gamification optimizes for engagement over learning. Recent AI features (Duolingo Max with GPT-4) are bolted on, not native to the experience.

#### Anki
- **What it does well:** Best-in-class spaced repetition (especially with FSRS), infinite customizability, massive shared deck ecosystem, completely free/open-source, works offline. The gold standard for memorization.
- **What it misses:** Terrible UX, no content generation, no multi-modal learning, no conversation practice, steep learning curve, no social features, feels like homework. Desktop-era design.

#### Memrise
- **What it does well:** Native speaker video clips, community-created courses, some contextual vocabulary learning. Recently pivoted to AI conversation features.
- **What it misses:** Content quality is inconsistent (community-created), limited grammar instruction, no deep personalization, company has been struggling financially and pivoting repeatedly.

#### Busuu
- **What it does well:** Community correction features (native speakers correct your writing), CEFR-aligned curriculum, offline mode, some AI conversation.
- **What it misses:** Small user base means fewer corrections, content feels dated, limited language coverage, no speaking practice depth.

#### Babbel
- **What it does well:** Professional curriculum design (actual linguists), practical conversation focus, speech recognition, business language courses.
- **What it misses:** Static content (no AI generation), limited free tier, feels corporate/boring, no advanced content, no community.

#### Lingvist
- **What it does well:** Adaptive algorithm, contextual sentence-based learning, statistical approach to vocabulary frequency.
- **What it misses:** Very limited language coverage, no conversation, no cultural content, feels sterile, small team.

#### Clozemaster
- **What it does well:** Massive sentence databases, cloze deletion format, gamified, covers many language pairs, good for intermediate+ learners.
- **What it misses:** No audio production, no conversation, no AI personalization, feels like a single mechanic stretched thin, no content generation.

### 4.2 AI-Native Newcomers

#### Speak (speak.com)
- **What it does well:** Speaking-first approach, excellent voice AI and pronunciation feedback, curriculum designed around output, 15M+ downloads. Raised $78M+ in funding. Strongest in Korean market.
- **What it misses:** Limited language offerings (6 languages), structured curriculum (not personalized), no street language, no immersion feed, interactions still feel like tutoring not conversation, no vocabulary SRS system.

#### Praktika (praktika.ai)
- **What it does well:** AI tutor characters with personality, personalized study plans, real-time grammar/pronunciation correction, available in multiple languages, 20M+ learners, strong reviews (4.9 stars). Correction tone is adjustable (soft/balanced/strict).
- **What it misses:** Still primarily a conversation tutor — no immersion feed, no multi-modal learning, no deep error analysis, no street language focus, no SRS integration.

#### Univerbal (univerbal.app)
- **What it does well:** Swiss-made with researcher backing, natural conversation feel, 20+ languages, emphasis on building speaking confidence, judgment-free practice.
- **What it misses:** Smaller scale, limited feature depth beyond conversation, no vocabulary tracking, no curriculum, no multi-modal content.

#### Others to watch:
- **Elsa Speak** — pronunciation-focused, strong speech AI but narrow feature set
- **Langotalk** — GPT-powered chat practice, minimal features beyond chat
- **Talkpal** — AI conversation with scenario-based learning
- **Lingoda** — Live online classes with real teachers (hybrid human+AI potential)

### 4.3 Competitive Summary Matrix

| Feature | Duolingo | Anki | Speak | Praktika | Univerbal | **Aretee** |
|---------|----------|------|-------|----------|-----------|------------|
| Personalized curriculum | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Street language | ❌ | ⚠️* | ❌ | ❌ | ❌ | ✅ |
| AI conversation | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Immersion feed | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Advanced SRS | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Multi-modal learning | ⚠️ | ❌ | ⚠️ | ⚠️ | ❌ | ✅ |
| Error pattern analysis | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ✅ |
| Habit formation | ✅ | ❌ | ⚠️ | ⚠️ | ❌ | ✅ |
| Production-focused | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Passive/ambient learning | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

*Anki has community decks with slang, but no structured approach*

**Aretee's unique positioning:** No one combines deep SRS + AI conversation + immersion content + street language + true personalization. This is the gap.

---

## Section 5: Feature Roadmap Recommendations

### 5.1 Prioritized Feature List (Impact × Feasibility)

#### Phase 1: Core Engine (Months 1-3) — "Make it learn"
| Priority | Feature | Impact | Feasibility | Notes |
|----------|---------|--------|-------------|-------|
| P0 | **FSRS-based SRS engine** | 🔴 Critical | ✅ High | Open-source implementation available. Foundation for everything. |
| P0 | **Learner model / knowledge graph** | 🔴 Critical | ⚠️ Medium | Track what each user knows, how well, and how they learned it. |
| P0 | **AI conversation engine** | 🔴 Critical | ✅ High | LLM-powered, with character personas. Use existing TTS/STT APIs. |
| P1 | **Onboarding / placement test** | 🟡 High | ✅ High | Adaptive test that places users precisely on the proficiency spectrum. |
| P1 | **Core vocabulary system** | 🟡 High | ✅ High | Contextual flashcards with multi-modal reviews (text, audio, image). |

#### Phase 2: Differentiation (Months 3-6) — "Make it different"
| Priority | Feature | Impact | Feasibility | Notes |
|----------|---------|--------|-------------|-------|
| P0 | **Immersion feed (v1)** | 🔴 Critical | ⚠️ Medium | Start with AI-generated text + audio content at calibrated difficulty. |
| P0 | **Error pattern analysis** | 🔴 Critical | ⚠️ Medium | Classify errors by type, generate targeted practice. |
| P1 | **Street language content** | 🟡 High | ⚠️ Medium | Regional slang packs, profanity guides, casual register content. |
| P1 | **Conversation scenarios (deep)** | 🟡 High | ✅ High | Beyond basic tutoring — emotional scenarios, negotiations, humor. |
| P2 | **Podcast generator (v1)** | 🟢 Medium | ⚠️ Medium | AI-generated listening content targeting weak areas. |

#### Phase 3: Stickiness (Months 6-9) — "Make it addictive"
| Priority | Feature | Impact | Feasibility | Notes |
|----------|---------|--------|-------------|-------|
| P0 | **Microlearning notifications** | 🔴 Critical | ✅ High | 30-second challenges via push. Massive retention driver. |
| P1 | **Social features (v1)** | 🟡 High | ⚠️ Medium | Friend groups, shared challenges, versus mode. |
| P1 | **Progress visualization** | 🟡 High | ✅ High | Show learners their growth in compelling ways. Not XP — actual proficiency. |
| P2 | **Shadow learning / ambient mode** | 🟢 Medium | ⚠️ Medium | Background audio, lock screen vocabulary. |
| P2 | **Music integration** | 🟢 Medium | 🔴 Low | Licensing issues. Start with royalty-free/AI-generated music. |

#### Phase 4: Scale (Months 9-12) — "Make it complete"
| Priority | Feature | Impact | Feasibility | Notes |
|----------|---------|--------|-------------|-------|
| P1 | **Browser extension / screen capture** | 🟡 High | ⚠️ Medium | Learn from content users encounter in the wild. |
| P1 | **Immersion feed (v2)** | 🟡 High | 🔴 Low | AI-generated video content with synthetic speakers. |
| P2 | **Advanced social (leaderboards, clubs)** | 🟢 Medium | ✅ High | Build on v1 social features. |
| P2 | **Multi-language support** | 🟢 Medium | ⚠️ Medium | Expand beyond initial language(s). |
| P3 | **Photo vocabulary / OCR** | 🟢 Low | ✅ High | Nice-to-have, not core. |

### 5.2 Biggest Learning Acceleration Features

Ranked by expected impact on actual language acquisition speed:

1. **AI conversation with adaptive difficulty** — Output practice is the single biggest bottleneck for most learners. No amount of flashcards substitutes for speaking. If Aretee can make conversation practice genuinely compelling and available 24/7, this alone is transformative.

2. **Immersion feed at calibrated i+1** — Massive comprehensible input is the foundation of acquisition per Krashen. If users spend 20 min/day scrolling interesting target-language content at their level, vocabulary and grammar acquisition will happen almost incidentally.

3. **FSRS + error-pattern targeting** — Intelligent spaced repetition targeting your specific weaknesses eliminates wasted review time. Users study what they need, not what's easy.

4. **Multi-modal vocabulary with contextual learning** — Words learned in context, across multiple modalities, with emotional/narrative associations are dramatically more durable than isolated flashcard learning.

5. **Street language content** — Not just a "nice to have." Understanding natural speech is what separates people who "studied" a language from people who "speak" it. This unlocks real-world comprehension.

### 5.3 Strongest Retention & Addiction Loop Features

These features keep users coming back (critical for a learning app — you can't learn if you quit):

1. **Microlearning notifications.** The 30-second challenge notification is genius because it has near-zero friction. You're waiting for coffee, notification pops up, 30 seconds later you've done a mini-lesson. This creates multiple daily touchpoints without demanding "study time." CRITICAL: make these *genuinely useful* (FSRS-timed reviews, not random trivia).

2. **Immersion feed scroll behavior.** TikTok proved infinite scroll is the most addictive UX pattern ever created. If Aretee's immersion feed triggers the same dopamine loop BUT with language learning content, you've solved the retention problem. Users will "waste time" on Aretee the way they waste time on TikTok — except they're learning.

3. **Character attachment in conversations.** Give AI conversation partners personality, backstory, and memory. Users should *want* to talk to Diego or Isabela again. Parasocial relationships with AI characters drive engagement (see: Replika, Character.ai). Channel this for learning.

4. **Visible progress on real skills.** Don't show XP or arbitrary points. Show: "Last month you couldn't understand fast casual speech. Now you can catch 70% of it." Show proficiency curves for specific skills. Make growth tangible and honest.

5. **Social accountability.** Small group challenges with friends. "You and 3 friends: who can hold a 5-minute conversation with Diego first?" Social pressure that's motivating, not annoying.

6. **Streak mechanics (done right).** Duolingo's streaks work but penalize breaks harshly (lose your 300-day streak because you got sick). Better approach: "consistency score" that values regularity but forgives gaps. Freeze days built in. Celebrate consistency without creating anxiety.

---

## Appendix: Key References

### Learning Science
- Krashen, S. (1982). *Principles and Practice in Second Language Acquisition*
- Bjork, R.A. & Bjork, E.L. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning
- Roediger, H.L. & Butler, A.C. (2011). The critical role of retrieval practice in long-term retention
- Rawson, K.A. & Dunlosky, J. (2011). Optimizing schedules of retrieval practice for durable and efficient learning
- Rohrer, D. (2012). Interleaving helps students distinguish among similar concepts
- Brunmair, M. & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning
- Paivio, A. (1986). *Mental Representations: A Dual Coding Approach*
- Webb, S. & Nation, P. (2017). How is vocabulary learned?

### Spaced Repetition
- Ye, J. (2024). FSRS — Free Spaced Repetition Scheduler. GitHub: open-spaced-repetition/fsrs4anki
- Wozniak, P.A. (1990). SM-2 Algorithm (SuperMemo)
- Settles, B. & Meeder, B. (2016). A trainable spaced repetition model for language learning (Duolingo Half-Life Regression)

### AI in Language Learning
- Speak Inc. — speak.com (AI-first speaking practice, $78M+ raised)
- Praktika AI — praktika.ai (AI tutor characters, 20M+ learners)
- Univerbal — univerbal.app (Swiss-backed AI conversation practice)

---

*This document should be treated as a living reference. Update as new research emerges and as Aretee's development validates or invalidates these recommendations.*
