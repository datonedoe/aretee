# Aretee Exercise Types Spec

**Author:** Darweenie | **Date:** 2026-02-18 | **Status:** Draft

---

## Context

Aretee currently has three exercise modes: **Flash** (SRS cards), **Socratic** (AI dialogue), and **Feynman** (explain-to-grade). These are powerful but all text-heavy and passive-receptive. To serve Dee's goals — communication, accent, quant visualization — we need exercise types that train **active production**, **spoken fluency**, and **visual-spatial reasoning**.

### What Already Exists (leverage, don't rebuild)
- `Card` type with FSRS scheduling → reuse for all new exercise types
- `SessionSegment` + `InterleavingConfig` → extend `SessionSegmentMode` enum
- `SpeechRecognition` service (Web Speech API, web-only) → foundation for voice
- `AI client` (Claude 3.5 Haiku, streaming) → evaluation engine
- `MicroChallengeType` enum → extend with new types
- Gamification (XP, quests, achievements) → wire new exercises into existing system

---

## Priority Order

| Priority | Exercise Type | Goals Served | Effort | Why This Order |
|----------|--------------|-------------|--------|----------------|
| **P0** | Spoken Response + AI Eval | Communication, Accent | Medium | Highest ROI — trains production, leverages existing speech recognition |
| **P1** | AI Roleplay Scenarios | Communication, Accent | Medium | Builds on P0's voice infra, adds conversational practice |
| **P2** | Interactive Visual Derivation | Quant + Visualization | High | Unique to Aretee, no competitor does this well |
| **P3** | Smart Cloze | All domains | Low | Quick win, extends existing `fill_the_gap` micro-challenge |
| **P4** | Concept Mapping | Quant | Medium | Deepens understanding of concept relationships |

---

## P0: Spoken Response + AI Evaluation

### What It Is
User receives a prompt → speaks their answer → AI evaluates both **content accuracy** AND **delivery quality** (pronunciation, filler words, clarity, pace).

### Exercise Variants
1. **Explain This** — "Explain Black-Scholes in 30 seconds" (quant + communication)
2. **Pronunciation Drill** — Hear a word/phrase, repeat it, compare (accent)
3. **Impromptu Response** — "What's your view on Bitcoin as a store of value?" (communication)
4. **Read Aloud** — Read a passage, AI evaluates pronunciation and fluency

### Data Model

```typescript
// New file: src/types/exercise.ts

export enum ExerciseType {
  SpokenResponse = 'spoken_response',
  Roleplay = 'roleplay',
  VisualDerivation = 'visual_derivation',
  SmartCloze = 'smart_cloze',
  ConceptMap = 'concept_map',
}

export enum SpokenResponseVariant {
  ExplainThis = 'explain_this',
  PronunciationDrill = 'pronunciation_drill',
  ImpromptuResponse = 'impromptu_response',
  ReadAloud = 'read_aloud',
}

export interface SpokenResponseExercise {
  id: string
  type: ExerciseType.SpokenResponse
  variant: SpokenResponseVariant
  cardId: string | null            // linked SRS card (null for standalone)
  prompt: string                    // what the user sees
  referenceText: string | null      // correct answer / reference passage
  referenceAudioUrl: string | null  // native speaker audio (for pronunciation)
  timeLimit: number                 // seconds (0 = unlimited)
  difficulty: number                // 0-1, affects grading strictness
}

export interface SpokenResponseResult {
  exerciseId: string
  transcript: string               // what the user said (from speech recognition)
  audioBlob: Blob | null           // raw recording for playback
  durationMs: number               // how long they spoke
  evaluation: SpokenEvaluation
  completedAt: number              // unix timestamp
}

export interface SpokenEvaluation {
  contentAccuracy: DimensionScore   // did they get the facts right?
  clarity: DimensionScore           // was the explanation clear and structured?
  pronunciation: DimensionScore     // accent, enunciation, stress patterns
  fluency: DimensionScore           // pace, filler words, hesitations
  overall: number                   // 0-100 composite
  fillerWords: string[]             // detected filler words ("um", "like", "you know")
  fillerCount: number
  suggestions: string[]             // specific improvement tips (max 3)
  followUp: string | null           // follow-up question if gaps detected
}

export interface DimensionScore {
  score: number    // 0-100
  feedback: string // 1-2 sentences
}
```

### AI Evaluation Prompt

```typescript
// Addition to src/services/ai/prompts.ts

export function buildSpokenEvalPrompt(
  variant: SpokenResponseVariant,
  prompt: string,
  referenceText: string | null,
  transcript: string,
  difficulty: number,
  durationMs: number
): string {
  const strictness = difficulty > 0.7 ? 'strict' : difficulty > 0.4 ? 'fair' : 'encouraging'
  const wordsPerMinute = (transcript.split(/\s+/).length / (durationMs / 60000)).toFixed(0)

  return `You are evaluating a spoken response. The user was asked to respond verbally and their speech was transcribed.

PROMPT GIVEN: "${prompt}"
${referenceText ? `REFERENCE ANSWER: "${referenceText}"` : ''}
USER'S TRANSCRIPT: "${transcript}"
SPEAKING PACE: ${wordsPerMinute} words/minute (natural range: 120-160 wpm)
DURATION: ${(durationMs / 1000).toFixed(1)}s

Grade on these dimensions. Return ONLY valid JSON:
{
  "contentAccuracy": { "score": <0-100>, "feedback": "<1-2 sentences>" },
  "clarity": { "score": <0-100>, "feedback": "<1-2 sentences>" },
  "pronunciation": { "score": <0-100>, "feedback": "<note: limited to transcript analysis, flag unusual spellings that suggest mispronunciation>" },
  "fluency": { "score": <0-100>, "feedback": "<1-2 sentences about pace, flow, filler words>" },
  "overall": <0-100>,
  "fillerWords": [<detected fillers like "um", "uh", "like", "you know", "basically">],
  "fillerCount": <total filler count>,
  "suggestions": [<max 3 specific, actionable tips>],
  "followUp": "<ONE follow-up question if a gap was detected, or null>"
}

Grading mode: ${strictness}. ${strictness === 'strict' ? 'Expect precise, structured responses. Penalize vagueness.' : strictness === 'fair' ? 'Balance encouragement with honest feedback.' : 'Focus on what they got right. Be supportive but identify the biggest gap.'}`
}
```

### UI Flow

```
┌──────────────────────────────────────┐
│  💡 Explain This Concept             │
│                                      │
│  "What is delta hedging and why      │
│   do market makers use it?"          │
│                                      │
│  ⏱️ 45s limit                        │
├──────────────────────────────────────┤
│                                      │
│         🎙️ [TAP TO RECORD]           │
│                                      │
│  ── or type your response ──         │
│                                      │
├──────────────────────────────────────┤
│  💬 Hearing: "Delta hedging is..."   │  ← live partial transcript
│  ██████████░░░░░░░ 23s / 45s        │  ← timer bar
└──────────────────────────────────────┘

         ↓ after submission ↓

┌──────────────────────────────────────┐
│  📊 Your Score: 74/100               │
│                                      │
│  Accuracy    ████████░░  82          │
│  Clarity     ███████░░░  71          │
│  Pronunciation ████████░░ 78        │
│  Fluency     ██████░░░░  64          │
│                                      │
│  ⚠️ Filler words: "um" (3x),        │
│     "basically" (2x)                 │
│                                      │
│  💡 Suggestions:                     │
│  • Structure: state what → why → how │
│  • Replace "basically" with a pause  │
│  • Slow down — you spoke at 182 wpm │
│                                      │
│  [🔄 Try Again]  [➡️ Next]           │
└──────────────────────────────────────┘
```

### Integration Points
- Extend `SessionSegmentMode` with `Spoken = 'spoken'`
- Wire into interleaving composer — spoken exercises interleave with flash/socratic/feynman
- XP reward: base 15 XP + bonus for score > 80
- New achievement: "Silver Tongue" — score 90+ on 10 spoken exercises
- Record audio using `expo-av` (native) or MediaRecorder API (web)

### Native Audio Recording (needed)

```typescript
// New file: src/services/speech/recorder.ts

import { Audio } from 'expo-av'
import { Platform } from 'react-native'

export interface RecordingResult {
  uri: string
  durationMs: number
  blob: Blob | null  // web only
}

export async function startRecording(): Promise<Audio.Recording | MediaRecorder> {
  if (Platform.OS === 'web') {
    // Use MediaRecorder API
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    recorder.start()
    return recorder
  } else {
    // Use expo-av
    const { granted } = await Audio.requestPermissionsAsync()
    if (!granted) throw new Error('Microphone permission required')

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    })

    const recording = new Audio.Recording()
    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    )
    await recording.startAsync()
    return recording
  }
}

export async function stopRecording(
  recorder: Audio.Recording | MediaRecorder
): Promise<RecordingResult> {
  if (recorder instanceof Audio.Recording) {
    await recorder.stopAndUnloadAsync()
    const uri = recorder.getURI()!
    const status = await recorder.getStatusAsync()
    return { uri, durationMs: status.durationMillis, blob: null }
  } else {
    // MediaRecorder
    return new Promise((resolve) => {
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        resolve({
          uri: URL.createObjectURL(blob),
          durationMs: 0, // calculate from blob
          blob,
        })
      }
      recorder.stop()
    })
  }
}
```

---

## P1: AI Roleplay Scenarios

### What It Is
Multi-turn spoken conversation with AI playing a character. Real scenarios relevant to Dee's goals: quant interviews, team standups, investor pitches, casual networking. AI adapts, pushes back, asks follow-ups.

### Exercise Variants
1. **Quant Interview** — "Explain your approach to pricing exotic derivatives" (quant + communication)
2. **Team Standup** — "Give your 2-minute update on the options pricing model" (communication)
3. **Elevator Pitch** — "You have 60 seconds to pitch Bitcoin to a traditional fund manager" (communication)
4. **Casual Networking** — "You're at a conference. Someone asks what you do." (accent + communication)
5. **Defend Your Position** — "I think Black-Scholes is obsolete. Change my mind." (quant + communication)

### Data Model

```typescript
export enum RoleplayScenario {
  QuantInterview = 'quant_interview',
  TeamStandup = 'team_standup',
  ElevatorPitch = 'elevator_pitch',
  CasualNetworking = 'casual_networking',
  DefendPosition = 'defend_position',
}

export interface RoleplayExercise {
  id: string
  type: ExerciseType.Roleplay
  scenario: RoleplayScenario
  title: string                     // "Quant Interview: Exotic Derivatives"
  characterName: string             // "Sarah Chen, Head of Quant Research"
  characterDescription: string      // personality, style, what they care about
  context: string                   // scene setting
  objectives: string[]              // what the user should accomplish
  maxTurns: number                  // conversation length cap
  relatedCardIds: string[]          // linked SRS cards for topic grounding
  difficulty: number                // 0-1
}

export interface RoleplayTurn {
  role: 'user' | 'character'
  content: string
  transcript?: string              // if spoken
  audioUri?: string                // if recorded
  timestamp: number
}

export interface RoleplayResult {
  exerciseId: string
  turns: RoleplayTurn[]
  evaluation: RoleplayEvaluation
  durationMs: number
  completedAt: number
}

export interface RoleplayEvaluation {
  objectivesMet: { objective: string; met: boolean; feedback: string }[]
  persuasiveness: DimensionScore
  technicalAccuracy: DimensionScore
  communication: DimensionScore
  adaptability: DimensionScore     // how well they handled pushback
  overall: number                  // 0-100
  highlights: string[]             // things they did well
  improvements: string[]           // specific areas to work on
}
```

### AI System Prompt Pattern

```typescript
export function buildRoleplaySystemPrompt(
  exercise: RoleplayExercise,
  turnCount: number
): string {
  return `You are ${exercise.characterName}. ${exercise.characterDescription}

SCENARIO: ${exercise.context}

Your behavior:
- Stay in character at all times
- Be realistic — push back when appropriate, ask follow-up questions
- If the student says something technically wrong, challenge it naturally (don't break character to correct)
- Adapt your difficulty based on how well they're doing
- Keep responses to 2-4 sentences (this is a conversation, not a lecture)
- After ${exercise.maxTurns} turns, wrap up naturally

OBJECTIVES the student should demonstrate:
${exercise.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Current turn: ${turnCount + 1}/${exercise.maxTurns}
${turnCount >= exercise.maxTurns - 2 ? '\nSTART WRAPPING UP the conversation naturally.' : ''}`
}

export function buildRoleplayEvalPrompt(
  exercise: RoleplayExercise,
  turns: RoleplayTurn[]
): string {
  const conversation = turns.map(t =>
    `${t.role === 'user' ? 'STUDENT' : exercise.characterName}: ${t.content}`
  ).join('\n')

  return `Evaluate this roleplay conversation. Return ONLY valid JSON.

SCENARIO: ${exercise.context}
OBJECTIVES: ${exercise.objectives.join('; ')}

CONVERSATION:
${conversation}

{
  "objectivesMet": [${exercise.objectives.map(o => `{"objective": "${o}", "met": <bool>, "feedback": "<why>"}`).join(', ')}],
  "persuasiveness": { "score": <0-100>, "feedback": "<1-2 sentences>" },
  "technicalAccuracy": { "score": <0-100>, "feedback": "<1-2 sentences>" },
  "communication": { "score": <0-100>, "feedback": "<1-2 sentences>" },
  "adaptability": { "score": <0-100>, "feedback": "<1-2 sentences>" },
  "overall": <0-100>,
  "highlights": [<2-3 things done well>],
  "improvements": [<2-3 specific improvements>]
}`
}
```

### UI Flow

```
┌──────────────────────────────────────┐
│  🎭 Quant Interview                  │
│  Sarah Chen, Head of Quant Research  │
│  ─────────────────────────────────── │
│  "You're interviewing for a junior   │
│   quant role. I want to understand   │
│   how you think about risk."         │
│                                      │
│  Objectives:                         │
│  ☐ Explain delta hedging clearly     │
│  ☐ Handle a technical challenge      │
│  ☐ Show original thinking            │
│                                      │
│  [🎙️ Start Conversation]             │
└──────────────────────────────────────┘

         ↓ during conversation ↓

┌──────────────────────────────────────┐
│  🎭 Turn 3/8                         │
│                                      │
│  🏫 Sarah: "Interesting. But what    │
│   happens to your delta hedge when   │
│   vol spikes 40% intraday? Walk me  │
│   through it."                       │
│                                      │
│  ☐ ☐ ☑ Objectives (1/3 met)         │
│                                      │
│       🎙️ [RECORDING...]              │
│       "When vol spikes, the gamma..." │
│       ██████░░░░░░ 15s               │
│                                      │
│  [⏸️ Pause]  [⏹️ End Early]          │
└──────────────────────────────────────┘

         ↓ after completion ↓

┌──────────────────────────────────────┐
│  📊 Roleplay Score: 78/100           │
│                                      │
│  Objectives:                         │
│  ✅ Explain delta hedging clearly    │
│  ❌ Handle a technical challenge     │
│  ✅ Show original thinking           │
│                                      │
│  Persuasiveness  ████████░░  81      │
│  Technical       ██████░░░░  62      │
│  Communication   █████████░  87      │
│  Adaptability    ███████░░░  73      │
│                                      │
│  🌟 Highlights:                      │
│  • Clear initial explanation         │
│  • Good use of analogies             │
│                                      │
│  📈 Work on:                         │
│  • Got flustered on the vol spike Q  │
│  • Practice gamma exposure scenarios │
│                                      │
│  [🔄 Replay]  [📝 Review Cards]      │
└──────────────────────────────────────┘
```

### Integration Points
- Extend `SessionSegmentMode` with `Roleplay = 'roleplay'`
- XP reward: base 25 XP (longer exercise) + objective bonuses
- Achievement: "Method Actor" — complete 5 different scenarios with 80+ score
- Roleplay exercises surface cards from relevant decks (quant deck → quant interview)

---

## P2: Interactive Visual Derivation

### What It Is
Step-through a formula or concept with interactive elements. User fills in the next step, manipulates parameters via sliders, observes visual changes. Tests deep understanding, not memorization.

### Exercise Variants
1. **Fill the Step** — Formula derivation with blanks at key steps
2. **Parameter Explorer** — Slider adjusts input, user predicts output direction before seeing it
3. **Spot the Error** — Derivation with one wrong step, find it
4. **Graph Interpretation** — "What does this chart tell you about the portfolio's risk?"

### Data Model

```typescript
export enum VisualDerivationVariant {
  FillTheStep = 'fill_the_step',
  ParameterExplorer = 'parameter_explorer',
  SpotTheError = 'spot_the_error',
  GraphInterpretation = 'graph_interpretation',
}

export interface DerivationStep {
  id: string
  latex: string                     // rendered with KaTeX/MathJax
  explanation: string               // plain text explanation of this step
  isBlank: boolean                  // user must fill this in
  blankAnswer: string | null        // correct answer for blank steps
  hasError: boolean                 // for spot-the-error variant
  errorExplanation: string | null   // why it's wrong
}

export interface ParameterDef {
  name: string                      // "σ (volatility)"
  symbol: string                    // "σ"
  min: number
  max: number
  step: number
  defaultValue: number
  unit: string                      // "%", "$", etc.
}

export interface VisualDerivationExercise {
  id: string
  type: ExerciseType.VisualDerivation
  variant: VisualDerivationVariant
  title: string                     // "Black-Scholes: From GBM to Option Price"
  description: string
  steps: DerivationStep[]           // for fill_the_step / spot_the_error
  parameters: ParameterDef[]        // for parameter_explorer
  chartType: ChartType | null       // what visualization to render
  chartConfig: Record<string, any>  // chart-specific config
  relatedCardIds: string[]
  difficulty: number
}

export enum ChartType {
  OptionPayoff = 'option_payoff',
  VolSurface = 'vol_surface',
  GreeksSensitivity = 'greeks_sensitivity',
  PriceDistribution = 'price_distribution',
  PortfolioValue = 'portfolio_value',
  YieldCurve = 'yield_curve',
}

export interface VisualDerivationResult {
  exerciseId: string
  stepsCompleted: { stepId: string; userAnswer: string; correct: boolean }[]
  parameterPredictions: {
    parameter: string
    predictedDirection: 'up' | 'down' | 'unchanged'
    actualDirection: 'up' | 'down' | 'unchanged'
    correct: boolean
  }[]
  errorsFound: { stepId: string; found: boolean }[]
  score: number                     // 0-100
  timeSpentMs: number
  completedAt: number
}
```

### Visualization Library
Use `react-native-svg` + `d3-scale`/`d3-shape` for charts. LaTeX rendering via `react-native-katex` or web-based KaTeX.

### UI Flow (Parameter Explorer)

```
┌──────────────────────────────────────┐
│  📈 Parameter Explorer               │
│  Black-Scholes: How Vol Affects Price │
│                                      │
│  C = S·N(d₁) - K·e⁻ʳᵀ·N(d₂)       │
│                                      │
│  ┌────────────────────────────────┐  │
│  │     📊 Option Price vs. S      │  │
│  │                          ╱     │  │
│  │                        ╱       │  │
│  │                     ╱──        │  │
│  │                 ╱───           │  │
│  │            ╱────               │  │
│  │       ╱────                    │  │
│  │  ─────                        │  │
│  └────────────────────────────────┘  │
│                                      │
│  σ (volatility): ██████████░ 30%     │
│                  ←  drag  →          │
│                                      │
│  ❓ If you increase σ to 50%,        │
│     what happens to the call price?  │
│                                      │
│  [📈 Goes Up] [📉 Goes Down] [➡️ Same]│
│                                      │
│  ← answer first, THEN see the chart  │
│    update to confirm/correct         │
└──────────────────────────────────────┘
```

### UI Flow (Fill the Step)

```
┌──────────────────────────────────────┐
│  🧮 Derivation: Itô's Lemma          │
│  Step 3 of 7                         │
│                                      │
│  Step 1: dS = μS dt + σS dW    ✅   │
│  Step 2: Let f(S,t) be a C² fn  ✅   │
│  Step 3: df = [___] dt + [___] dW    │
│                                      │
│  Fill in the blanks:                 │
│  ┌─────────────────────┐             │
│  │ ∂f/∂t + μS·∂f/∂S +  │  dt term   │
│  │ ½σ²S²·∂²f/∂S²       │             │
│  └─────────────────────┘             │
│  ┌─────────────────────┐             │
│  │ σS·∂f/∂S            │  dW term    │
│  └─────────────────────┘             │
│                                      │
│  [Check Answer]                      │
└──────────────────────────────────────┘
```

### Integration Points
- New `SessionSegmentMode.Visual = 'visual'`
- XP: 20 XP base, +5 per correct step/prediction
- Achievement: "Quant Eye" — complete 10 parameter explorations correctly
- Charts reusable across the app (analytics, progress screens)

---

## P3: Smart Cloze

### What It Is
Fill-in-the-blank where the blank is always the **conceptually important** word or phrase, not random filler. AI generates blanks from card content, targeting the user's weak spots.

### Why It's a Quick Win
`MicroChallengeType.FillTheGap` already exists. This upgrades it from static to AI-generated, context-aware blanks.

### Data Model

```typescript
export enum ClozeStrategy {
  KeyConcept = 'key_concept',       // blank the most important term
  Definition = 'definition',        // blank the definition, show the term
  Relationship = 'relationship',    // blank the connector ("causes", "implies", "because")
  Numerical = 'numerical',          // blank a number/formula component
}

export interface SmartClozeExercise {
  id: string
  type: ExerciseType.SmartCloze
  cardId: string
  originalText: string              // full text before blanking
  clozeText: string                 // text with [___] placeholders
  blanks: ClozeBlank[]
  strategy: ClozeStrategy
  hint: string | null               // optional hint
  difficulty: number
}

export interface ClozeBlank {
  index: number                     // which blank (0-based)
  answer: string                    // correct answer
  alternatives: string[]            // acceptable alternatives
  position: { start: number; end: number }  // char positions in originalText
}

export interface SmartClozeResult {
  exerciseId: string
  answers: { blankIndex: number; userAnswer: string; correct: boolean }[]
  score: number
  timeSpentMs: number
  completedAt: number
}
```

### AI Generation Prompt

```typescript
export function buildClozeGenerationPrompt(
  question: string,
  answer: string,
  strategy: ClozeStrategy
): string {
  const strategyGuide: Record<ClozeStrategy, string> = {
    key_concept: 'Remove the single most important concept/term. The blank should test whether the student knows THE key idea.',
    definition: 'Show the term, blank out its definition or explanation.',
    relationship: 'Blank the word that shows HOW two concepts relate (causes, implies, is derived from, etc.).',
    numerical: 'Blank a number, formula component, or quantitative detail.',
  }

  return `Create a fill-in-the-blank exercise from this content.
Strategy: ${strategyGuide[strategy]}

QUESTION: ${question}
ANSWER: ${answer}

Return ONLY valid JSON:
{
  "clozeText": "<text with [___] for each blank>",
  "blanks": [{ "index": 0, "answer": "<correct>", "alternatives": [<other acceptable answers>] }],
  "hint": "<optional one-word hint or null>"
}`
}
```

### Integration Points
- Replaces/upgrades existing `MicroChallengeType.FillTheGap`
- Works as micro-challenge (push notification) AND in-session exercise
- XP: 10 XP per correct cloze
- Low effort: mostly prompt engineering + UI for text input

---

## P4: Concept Mapping

### What It Is
Given a set of concepts, arrange them in a dependency/relationship graph. Drag nodes to create connections. Tests whether you understand **how ideas relate**, not just what they are.

### Data Model

```typescript
export interface ConceptNode {
  id: string
  label: string                     // "Itô's Lemma"
  description: string               // brief tooltip
}

export interface ConceptEdge {
  from: string                      // node id
  to: string                        // node id
  relationship: string              // "is used to derive", "depends on"
}

export interface ConceptMapExercise {
  id: string
  type: ExerciseType.ConceptMap
  title: string                     // "Stochastic Calculus → Black-Scholes"
  nodes: ConceptNode[]              // 4-8 nodes
  correctEdges: ConceptEdge[]       // the right connections
  distractorNodes: ConceptNode[]    // 1-2 nodes that don't belong (optional)
  difficulty: number
  relatedCardIds: string[]
}

export interface ConceptMapResult {
  exerciseId: string
  userEdges: ConceptEdge[]          // what the user connected
  correctCount: number
  incorrectCount: number
  missedCount: number
  distractorsIdentified: boolean
  score: number
  timeSpentMs: number
  completedAt: number
}
```

### UI Flow

```
┌──────────────────────────────────────┐
│  🔗 Connect the Concepts             │
│  "How does stochastic calculus lead  │
│   to option pricing?"               │
│                                      │
│   ┌─────────┐      ┌──────────┐     │
│   │Brownian  │─────→│ Itô's    │     │
│   │ Motion   │      │ Lemma    │     │
│   └─────────┘      └──────────┘     │
│                          │           │
│                          ↓           │
│   ┌─────────┐      ┌──────────┐     │
│   │ Risk-   │      │  GBM     │     │
│   │ Neutral │      │          │     │
│   └─────────┘      └──────────┘     │
│                                      │
│   ┌─────────┐      ┌──────────┐     │
│   │ No-Arb  │      │ Black-   │     │
│   │         │      │ Scholes  │     │
│   └─────────┘      └──────────┘     │
│                                      │
│  Drag between nodes to connect.      │
│  4/6 connections made                │
│                                      │
│  [Check Connections]                 │
└──────────────────────────────────────┘
```

### Integration Points
- `SessionSegmentMode.ConceptMap = 'concept_map'`
- XP: 20 XP + 5 per correct connection
- Use `react-native-gesture-handler` for drag
- Achievement: "Systems Thinker" — complete 10 maps with 100% accuracy

---

## Shared Infrastructure Needed

### 1. Exercise Router (extends interleaving)

```typescript
// Extend SessionSegmentMode
export enum SessionSegmentMode {
  Flash = 'flash',
  Socratic = 'socratic',
  Feynman = 'feynman',
  Spoken = 'spoken',        // NEW
  Roleplay = 'roleplay',    // NEW
  Visual = 'visual',        // NEW
  SmartCloze = 'cloze',     // NEW
  ConceptMap = 'concept_map', // NEW
}
```

### 2. Exercise Store (new Zustand store)

```typescript
// src/stores/exerciseStore.ts
interface ExerciseState {
  currentExercise: Exercise | null  // union type of all exercise types
  currentResult: ExerciseResult | null
  isRecording: boolean
  recordingDurationMs: number

  // Actions
  startExercise: (exercise: Exercise) => void
  submitResult: (result: ExerciseResult) => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<RecordingResult>

  // History
  recentResults: ExerciseResult[]
  loadHistory: () => Promise<void>
}
```

### 3. Audio Pipeline

For P0 and P1, we need:
1. **Record** → `expo-av` (native) / MediaRecorder (web)
2. **Transcribe** → Web Speech API (free, web) or Whisper API (native, ~$0.006/min)
3. **Evaluate** → Claude Haiku (existing client)
4. **Playback** → `expo-av` for comparison playback

Cost estimate per spoken exercise: ~$0.01 (Whisper) + ~$0.002 (Haiku eval) = ~$0.012

### 4. Visualization Library (for P2)

- `react-native-svg` — cross-platform SVG charts
- `react-native-katex` or `katex` (web) — LaTeX rendering
- `d3-scale` + `d3-shape` — data-to-visual transforms
- `react-native-gesture-handler` — slider interactions

---

## Sprint Plan

### Sprint A (P0 — Spoken Response): ~3-4 days
1. Audio recording service (`expo-av` + MediaRecorder)
2. `SpokenResponseExercise` type + store
3. `SpokenExerciseCard` component (prompt → record → evaluate → score)
4. AI evaluation prompt + integration
5. Wire into interleaving composer
6. XP + achievement hooks

### Sprint B (P3 — Smart Cloze): ~1-2 days
1. Upgrade `FillTheGap` micro-challenge with AI generation
2. `SmartClozeExercise` type
3. `SmartClozeCard` component
4. Cloze generation prompt
5. Wire into micro-challenge scheduler

### Sprint C (P1 — Roleplay): ~3-4 days
1. `RoleplayExercise` type + store
2. `RoleplayScreen` component (multi-turn conversation UI)
3. Character system prompts
4. Post-conversation evaluation
5. Scenario library (5 initial scenarios)
6. Wire into session system

### Sprint D (P2 — Visual Derivation): ~5-7 days
1. Chart library setup (SVG + d3)
2. LaTeX rendering integration
3. `VisualDerivationExercise` type + store
4. Parameter Explorer component (sliders + live charts)
5. Fill-the-Step component (formula with blanks)
6. 3-5 initial derivation exercises (Black-Scholes, put-call parity, Greeks)
7. Wire into session system

### Sprint E (P4 — Concept Mapping): ~3-4 days
1. `ConceptMapExercise` type + store
2. Draggable node graph component
3. Edge drawing + validation
4. 5 initial concept maps
5. Wire into session system

**Total estimate: ~15-21 days**

---

## Open Questions

1. **Whisper vs Web Speech API for native?** Web Speech is free but web-only. Whisper costs ~$0.006/min but works everywhere. Could start web-only (Sprint A) and add Whisper later.
2. **Pronunciation scoring depth?** Transcript-based eval is limited — can't detect accent nuances from text alone. Real phoneme-level scoring needs a specialized model (e.g., Azure Speech pronunciation assessment). Worth adding later?
3. **Exercise content authoring?** Should exercises be hand-crafted, AI-generated from cards, or both? Recommendation: AI-generated from existing card decks + a curated library for quant fundamentals.
4. **Offline support?** Spoken exercises need network for AI eval. Cache a "practice mode" that records without eval for offline use?
