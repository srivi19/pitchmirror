# PitchMirror — Architecture Document

> **Last updated:** March 2026  
> A living reference covering the full techno-functional architecture of PitchMirror.

---

## 1. Overview

**PitchMirror** is a full-stack web application (React SPA + Express proxy) that helps startup founders sharpen their investor pitches using AI. The frontend runs entirely in the browser; all Claude API calls are routed through a lightweight Express server that keeps the Anthropic API key server-side. No database, no user accounts.

---

## 2. Technology Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| Framework | React | 18.2 | Component-driven UI |
| Bundler | Vite | 5.2 | Dev server + production build |
| Language | JSX (ES Modules) | — | UI logic & templating |
| Styling | Vanilla CSS | — | Dark-mode design system |
| Fonts | Google Fonts (Inter, Roboto Slab) | — | Typography |
| Backend proxy | Express | 4.x | Serves SPA + proxies Anthropic API |
| AI Model | Anthropic Claude | `claude-sonnet-4-20250514` | All intelligence |
| Voice input | Web Speech API — SpeechRecognition | — | Pitch recording + sim mic |
| Voice output | Web Speech API — SpeechSynthesis | — | Investor TTS in simulation |
| Hosting | Railway | — | Runs `node server.js` |

---

## 3. High-Level Architecture

```mermaid
graph TD
    Browser["🌐 Browser (React SPA)"]
    SpeechRec["🎤 SpeechRecognition API\nPitch recording + Q&A mic"]
    SpeechSyn["🔊 SpeechSynthesis API\nInvestor voice output"]
    Server["🔒 Express Server (Railway)\nserves /dist + POST /api/chat"]
    Claude["🤖 Anthropic Claude\nclaude-sonnet-4-20250514"]

    Browser -->|"voice stream"| SpeechRec
    SpeechRec -->|"transcript text"| Browser
    Browser -->|"TTS utterance"| SpeechSyn
    Browser -->|"POST /api/chat (same-origin)"| Server
    Server -->|"x-api-key + messages"| Claude
    Claude -->|"JSON response"| Server
    Server -->|"structured JSON"| Browser

    style Browser fill:#1E293B,stroke:#38BDF8,color:#E2E8F0
    style SpeechRec fill:#1E293B,stroke:#818CF8,color:#E2E8F0
    style SpeechSyn fill:#1E293B,stroke:#818CF8,color:#E2E8F0
    style Server fill:#1E293B,stroke:#FBBF24,color:#E2E8F0
    style Claude fill:#1E293B,stroke:#34D399,color:#E2E8F0
```

---

## 4. Application Phase State Machine

Orchestrated by a single `phase` state variable. Back buttons are available on every phase except landing. The final report overlays the simulation phase.

```mermaid
stateDiagram-v2
    [*] --> landing : App loads
    landing --> recording : "Start Your Free Analysis"
    recording --> landing : ← Back
    recording --> analyzing : submitPitch() — text ≥ 30 chars
    analyzing --> recording : ← Back / API error
    analyzing --> report : Claude responds with JSON analysis
    report --> recording : ← Back
    report --> pickInvestor : "Start Investor Q&A"
    pickInvestor --> report : ← Back
    pickInvestor --> simulation : Investor card selected
    simulation --> pickInvestor : ← Back (while Q&A active)
    simulation --> simulation : sendSimResponse() — up to 4 rounds\nvoice input (mic) + voice output (TTS)
    simulation --> final : 4th Q&A round complete\n(finalReport generated async)

    note right of analyzing
        POST /api/chat
        model: claude-sonnet-4-20250514
        max_tokens: 1500
    end note

    note right of simulation
        POST /api/chat per turn
        model: claude-sonnet-4-20250514
        max_tokens: 600
    end note

    note right of final
        POST /api/chat (async)
        model: claude-sonnet-4-20250514
        max_tokens: 800
    end note
```

---

## 5. Component & File Structure

```mermaid
graph TD
    main["main.jsx\n(React root mount)"]
    App["App.jsx\nPitchMirror()"]
    ScoreRing["ScoreRing\n(SVG donut chart)"]
    TypingIndicator["TypingIndicator\n(animated dots)"]
    CSS["index.css\n(dark design system)"]
    HTML["index.html\n(SPA shell)"]
    Server["server.js\n(Express proxy)"]
    Logo["public/logo.png\n(local logo asset)"]

    main --> App
    App --> ScoreRing
    App --> TypingIndicator
    App -.->|imports| CSS
    App -.->|serves| Logo
    HTML --> main
    Server -.->|serves| HTML
```

### File Inventory

| File | Purpose |
|---|---|
| `src/main.jsx` | React DOM root — renders `<PitchMirror />` into `#root` |
| `src/App.jsx` | Entire app: state machine, all views, AI calls, voice I/O, sub-components |
| `src/index.css` | Global dark-mode design tokens, layout classes, button variants |
| `index.html` | SPA shell — `<div id="root">` |
| `server.js` | Express: serves `/dist`, proxies `POST /api/chat` to Anthropic |
| `public/logo.png` | App logo (local asset, generated) |
| `vite.config.js` | Vite config — `@vitejs/plugin-react` |
| `package.json` | Dependencies, scripts (`dev`, `build`, `start`) |
| `.env` | `ANTHROPIC_API_KEY` — read by server.js only, never in browser |

---

## 6. State Management

All state lives inside the single `PitchMirror` component via React `useState` and `useRef` — no external library.

```mermaid
graph LR
    subgraph "Core State (useState)"
        phase(["phase\n7 values"])
        pitchText(["pitchText\nraw transcript"])
        typedPitch(["typedPitch\nmanual input"])
        useTyping(["useTyping\nbool"])
        isRecording(["isRecording\nbool"])
        analysis(["analysis\nJSON from Claude"])
        selectedInvestor(["selectedInvestor\nInvestor object"])
        simMessages(["simMessages\nmessage[]"])
        simInput(["simInput\nstring"])
        simLoading(["simLoading\nbool"])
        simIsListening(["simIsListening\nbool — mic active"])
        simDone(["simDone\nbool"])
        voiceOutput(["voiceOutput\nbool — TTS on/off"])
        questionCount(["questionCount\n0–4"])
        finalReport(["finalReport\nJSON from Claude"])
        error(["error\nstring"])
    end

    subgraph "Refs (useRef)"
        recognitionRef(["recognitionRef\npitch SpeechRecognition"])
        simRecognitionRef(["simRecognitionRef\nsim SpeechRecognition"])
        chatEndRef(["chatEndRef\nscroll anchor"])
    end
```

---

## 7. Voice I/O Pipeline

```mermaid
flowchart TD
    subgraph "Pitch Recording (recording phase)"
        Mic1["🎤 Mic"] --> SR1["SpeechRecognition\ncontinuous · interimResults"]
        SR1 -->|isFinal chunks| pitchText["pitchText state"]
        SR1 -->|not supported| TypeFallback["textarea fallback"]
    end

    subgraph "Simulation Voice I/O (simulation phase)"
        MicBtn["🎤 Mic button\ntoggleSimMic()"] --> SR2["SpeechRecognition\ncontinuous: false"]
        SR2 -->|transcript| simInput["simInput state"]
        simInput --> Send["sendSimResponse()"]
        Send -->|investor reply| TTS["SpeechSynthesis\nspeakText(reply)"]
        TTS -->|voiceOutput = false| Muted["🔇 silent"]
        Toggle["🔊/🔇 Toggle\nvoiceOutput state"] --> Muted
    end
```

---

## 8. AI Integration — Three Claude Calls

```mermaid
sequenceDiagram
    actor Founder
    participant App as React App
    participant Server as Express (Railway)
    participant Claude as Claude claude-sonnet-4-20250514

    %% Call 1: Pitch Analysis
    Founder->>App: Submit pitch text
    App->>Server: POST /api/chat
    Note over Server,Claude: system: pitch coach persona<br/>max_tokens: 1500
    Claude-->>Server: JSON { overall_score, structure_score,<br/>storytelling_score, clarity_score,<br/>elements{}, top_strength, top_weakness,<br/>narrative_feedback, investor_readiness,<br/>opening_question }
    Server-->>App: analysis object
    App-->>Founder: Report view + ScoreRings + ⤓ Download

    %% Call 2: Simulation
    Founder->>App: Select investor + speak/type answers
    loop Up to 4 Q&A rounds
        App->>Server: POST /api/chat (investor persona)
        Note over Server,Claude: system: investor persona + pitch context<br/>max_tokens: 600
        Claude-->>Server: 2–4 sentence investor reply
        Server-->>App: reply text
        App-->>Founder: Chat bubble + 🔊 TTS spoken reply
    end

    %% Call 3: Final Report (async)
    App->>Server: POST /api/chat (final evaluation)
    Note over Server,Claude: system: senior pitch coach<br/>max_tokens: 800<br/>user: full Q&A transcript
    Claude-->>Server: JSON { qa_score, clarity_under_pressure,<br/>confidence_score, best_answer_summary,<br/>weakest_moment, overall_verdict, next_steps[] }
    Server-->>App: finalReport object
    App-->>Founder: Final Report + ⤓ Download + ↺ Start Over
```

---

## 9. AI Persona Roster

Three investor personas are hardcoded as constant objects. Each drives a distinct simulation style.

```mermaid
graph LR
    subgraph INVESTORS
        Marcus["👔 Marcus Chen\nApex Ventures\nAnalytical · Enterprise SaaS\nAccent: #FBBF24"]
        Aparna["💼 Aparna Murthy\nHorizon Fund\nStrategic · Consumer & Impact\nAccent: #818CF8"]
        David["🏦 David Okafor\nMeridian Capital\nCommercial · Fintech & EM\nAccent: #34D399"]
    end

    Claude["Claude claude-sonnet-4-20250514"] -->|system prompt persona| Marcus
    Claude -->|system prompt persona| Aparna
    Claude -->|system prompt persona| David
```

---

## 10. Pitch Analysis Output Schema

```mermaid
graph TD
    Analysis["analysis object"]
    Analysis --> overall_score["overall_score (1–10)"]
    Analysis --> structure_score["structure_score (1–10)"]
    Analysis --> storytelling_score["storytelling_score (1–10)"]
    Analysis --> clarity_score["clarity_score (1–10)"]
    Analysis --> elements["elements{}"]
    elements --> Problem["Problem { present, quality, note }"]
    elements --> Solution["Solution { present, quality, note }"]
    elements --> Market["Market { present, quality, note }"]
    elements --> Traction["Traction { present, quality, note }"]
    elements --> Ask["Ask { present, quality, note }"]
    Analysis --> top_strength["top_strength"]
    Analysis --> top_weakness["top_weakness"]
    Analysis --> narrative_feedback["narrative_feedback"]
    Analysis --> investor_readiness["not ready | early stage | fundable | strong"]
    Analysis --> opening_question["opening_question → seeds Q&A"]
```

---

## 11. Final Report Output Schema

```mermaid
graph TD
    FR["finalReport object"]
    FR --> qa_score["qa_score (1–10)"]
    FR --> clarity_under_pressure["clarity_under_pressure (1–10)"]
    FR --> confidence_score["confidence_score (1–10)"]
    FR --> best_answer_summary["best_answer_summary"]
    FR --> weakest_moment["weakest_moment"]
    FR --> overall_verdict["overall_verdict"]
    FR --> next_steps["next_steps[] — 3 actionable items"]
```

---

## 12. Design System

| Token | Value | Usage |
|---|---|---|
| Background | `#0F172A` | Page root |
| Surface | `#1E293B` | Cards, chat bubbles, mic button |
| Border | `#334155` | All borders |
| Primary text | `#E2E8F0` | Body copy |
| Muted text | `#94A3B8` | Subtitles, labels |
| Accent blue | `#38BDF8` | Primary CTAs, user chat bubbles |
| Score green | `#4ADE80` | Scores ≥ 8 |
| Score amber | `#FBBF24` | Scores 5–7 |
| Score red | `#F87171` | Scores ≤ 4 |
| Download green | `#10B981` | Download buttons |
| Mic active red | `#EF4444` | Pulsing mic button border |
| Font (headings) | Roboto Slab 700 | Landing title |
| Font (body) | Inter 400/600/700 | All other text |
| Font (scores) | DM Mono (inline) | ScoreRing numbers |

---

## 13. Build & Deployment

```mermaid
flowchart LR
    Dev["npm run dev\nVite dev server :5173\n(frontend only)"] -->|iterate| Browser
    Build["npm run build\nvite build → /dist"] --> Dist["/dist static assets"]
    Dist --> Start["npm start\nnode server.js :3000\nserves dist + proxies /api/chat"]
    Railway["Railway\nsets ANTHROPIC_API_KEY\nruns build + start"] --> Start
```

### Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Hot-reload frontend dev |
| `build` | `vite build` | Production SPA bundle → `/dist` |
| `preview` | `vite preview` | Preview built bundle locally |
| `start` | `node server.js` | Express server: serves dist + AI proxy |
| `lint` | `eslint . --ext js,jsx` | Static analysis |

---

## 14. Key Architectural Decisions & Trade-offs

| Decision | Rationale | Trade-off |
|---|---|---|
| **Express proxy (`server.js`)** | API key stays server-side; eliminates CORS | Must be kept live on Railway |
| **Single-file app (`App.jsx`)** | Rapid prototyping; zero routing complexity | Harder to split at scale |
| **No database** | Zero infra; stateless per session | Session lost on refresh |
| **Web Speech API** | Native browser; no third-party libs | Chrome/Edge best; Safari limited |
| **SpeechSynthesis for TTS** | Zero cost; native; no latency | Voice quality varies by OS/browser |
| **Hardcoded investor personas** | Curated, high-quality prompts | New investors need a code change |
| **Phase-based navigation** | Strict linear flow; clear UX | Cannot deep-link to a specific phase |
| **JSON-only Claude outputs** | Deterministic parsing; no post-processing | Requires careful prompt engineering |
