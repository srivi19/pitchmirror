# PitchMirror — Architecture Document

> **Last updated:** March 2026  
> A living reference covering the full techno-functional architecture of PitchMirror.

---

## 1. Overview

**PitchMirror** is a single-page web application (SPA) that helps startup founders sharpen their investor pitches using AI. The entire experience runs in the browser — no backend database, no user accounts. All intelligence is delegated to **Anthropic Claude claude-sonnet-4-20250514** via a lightweight proxy server hosted on Railway.

---

## 2. Technology Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| Framework | React | 18.2 | Component-driven UI |
| Bundler | Vite | 5.2 | Dev server + production build |
| Language | JSX (ES Modules) | — | UI logic & templating |
| Styling | Vanilla CSS | — | Dark-mode design system |
| Fonts | Google Fonts (Inter, Roboto Slab) | — | Typography |
| AI Model | Anthropic Claude claude-sonnet-4-20250514 | — | All intelligence |
| AI Proxy | Custom REST proxy on Railway | — | Hides API credentials |
| Browser API | Web Speech API (SpeechRecognition) | — | Voice-to-text recording |
| Hosting | Vite preview / `serve` (static) | — | Production static serving |

---

## 3. High-Level Architecture

```mermaid
graph TD
    Browser["🌐 Browser (React SPA)"]
    WebSpeech["🎤 Web Speech API\n(SpeechRecognition)"]
    Proxy["🔒 Railway Proxy\nhttps://your-proxy.up.railway.app"]
    Claude["🤖 Anthropic Claude\nclaude-sonnet-4-20250514"]

    Browser -->|"voice stream"| WebSpeech
    WebSpeech -->|"transcript text"| Browser
    Browser -->|"POST /api/chat (JSON)"| Proxy
    Proxy -->|"Anthropic API call"| Claude
    Claude -->|"JSON response"| Proxy
    Proxy -->|"structured JSON"| Browser

    style Browser fill:#1E293B,stroke:#38BDF8,color:#E2E8F0
    style WebSpeech fill:#1E293B,stroke:#818CF8,color:#E2E8F0
    style Proxy fill:#1E293B,stroke:#FBBF24,color:#E2E8F0
    style Claude fill:#1E293B,stroke:#34D399,color:#E2E8F0
```

---

## 4. Application Phase State Machine

The app is orchestrated by a single `phase` state variable that drives which view is rendered. There is no router — phase transitions replace the view entirely.

```mermaid
stateDiagram-v2
    [*] --> landing : App loads
    landing --> recording : "Start Your Free Analysis"
    recording --> analyzing : submitPitch() — text ≥ 30 chars
    analyzing --> report : Claude responds with JSON analysis
    analyzing --> recording : API error (fallback)
    report --> pickInvestor : "Start Investor Q&A"
    pickInvestor --> simulation : Investor card selected
    simulation --> simulation : sendSimResponse() — up to 4 rounds
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
        POST /api/chat
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

    main --> App
    App --> ScoreRing
    App --> TypingIndicator
    App -.->|imports| CSS
    HTML --> main
```

### File Inventory

| File | Size | Purpose |
|---|---|---|
| `src/main.jsx` | 234 B | React DOM root — renders `<PitchMirror />` into `#root` |
| `src/App.jsx` | 23 KB | Entire app: state machine, all views, AI calls, sub-components |
| `src/index.css` | 2.9 KB | Global dark-mode design tokens and view layout classes |
| `index.html` | 360 B | SPA shell, sets `<div id="root">` |
| `vite.config.js` | 162 B | Vite config — applies `@vitejs/plugin-react` |
| `package.json` | 729 B | Dependencies, scripts (`dev`, `build`, `preview`, `start`) |

---

## 6. State Management

All state lives inside the single `PitchMirror` component via React `useState` and `useRef` hooks — no external state library.

```mermaid
graph LR
    subgraph "Core State (useState)"
        phase(["phase\n7 values"])
        pitchText(["pitchText\nraw transcript"])
        typedPitch(["typedPitch\nmanual input"])
        useTyping(["useTyping\nbool toggle"])
        isRecording(["isRecording\nbool"])
        analysis(["analysis\nJSON from Claude"])
        selectedInvestor(["selectedInvestor\nInvestor object"])
        simMessages(["simMessages\nmessage[]"])
        simInput(["simInput\nstring"])
        simLoading(["simLoading\nbool"])
        simDone(["simDone\nbool"])
        questionCount(["questionCount\n0–4"])
        finalReport(["finalReport\nJSON from Claude"])
        error(["error\nstring"])
    end

    subgraph "Refs (useRef)"
        recognitionRef(["recognitionRef\nSpeechRecognition instance"])
        chatEndRef(["chatEndRef\nscroll anchor"])
    end
```

---

## 7. AI Integration Detail

PitchMirror makes **three distinct Claude API calls**, each with a purpose-built system prompt and JSON output schema.

```mermaid
sequenceDiagram
    actor Founder
    participant App as React App
    participant Proxy as Railway Proxy
    participant Claude as Claude claude-sonnet-4-20250514

    %% Call 1: Pitch Analysis
    Founder->>App: Submit pitch text
    App->>Proxy: POST /api/chat (pitch analysis)
    Note over Proxy,Claude: system: pitch coach persona<br/>max_tokens: 1500
    Claude-->>Proxy: JSON { overall_score, structure_score,<br/>storytelling_score, clarity_score,<br/>elements{}, top_strength,<br/>top_weakness, narrative_feedback,<br/>investor_readiness, opening_question }
    Proxy-->>App: analysis object
    App-->>Founder: Report view with ScoreRings

    %% Call 2: Simulation (repeated)
    Founder->>App: Select investor + answer questions
    loop Up to 4 Q&A rounds
        App->>Proxy: POST /api/chat (investor persona)
        Note over Proxy,Claude: system: investor persona + pitch context<br/>max_tokens: 600
        Claude-->>Proxy: 2–4 sentence investor reply
        Proxy-->>App: reply text
        App-->>Founder: Chat bubble
    end

    %% Call 3: Final Report
    App->>Proxy: POST /api/chat (final evaluation)
    Note over Proxy,Claude: system: senior pitch coach<br/>max_tokens: 800<br/>user: full Q&A transcript
    Claude-->>Proxy: JSON { qa_score, clarity_under_pressure,<br/>confidence_score, best_answer_summary,<br/>weakest_moment, overall_verdict, next_steps[] }
    Proxy-->>App: finalReport object
    App-->>Founder: Final Report view
```

---

## 8. AI Persona Roster

Three investor personas are hardcoded as constant objects. Each drives a distinct simulation style.

```mermaid
graph LR
    subgraph INVESTORS
        Marcus["👔 Marcus Chen\nApex Ventures\nAnalytical · Enterprise SaaS\nAccent: #FBBF24"]
        Aparna["💼 Aparna Murthy\nHorizon Fund\nStrategic · Consumer & Impact\nAccent: #818CF8"]
        David["🏦 David Okafor\nMeridian Capital\nCommercial · Fintech & EM\nAccent: #34D399"]
    end

    Claude["Claude claude-sonnet-4-20250514"] -->|adopts persona via system prompt| Marcus
    Claude -->|adopts persona via system prompt| Aparna
    Claude -->|adopts persona via system prompt| David
```

---

## 9. Pitch Analysis Output Schema

Claude is constrained to return strict JSON. The app parses this directly with `JSON.parse()`.

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
    Analysis --> top_strength["top_strength (string)"]
    Analysis --> top_weakness["top_weakness (string)"]
    Analysis --> narrative_feedback["narrative_feedback (string)"]
    Analysis --> investor_readiness["not ready | early stage | fundable | strong"]
    Analysis --> opening_question["opening_question (string → seeds Q&A)"]
```

---

## 10. Final Report Output Schema

```mermaid
graph TD
    FR["finalReport object"]
    FR --> qa_score["qa_score (1–10)"]
    FR --> clarity_under_pressure["clarity_under_pressure (1–10)"]
    FR --> confidence_score["confidence_score (1–10)"]
    FR --> best_answer_summary["best_answer_summary (string)"]
    FR --> weakest_moment["weakest_moment (string)"]
    FR --> overall_verdict["overall_verdict (string)"]
    FR --> next_steps["next_steps[] — 3 actionable items"]
```

---

## 11. Voice Input Pipeline

```mermaid
flowchart LR
    Mic["🎤 Microphone"] --> SR["Web SpeechRecognition API\nlang: en-US\ncontinuous: true\ninterimResults: true"]
    SR -->|isFinal chunks| pitchText["pitchText state\n(append-only)"]
    SR -->|error / not supported| TypeFallback["useTyping = true\n→ textarea input"]
    pitchText --> Submit["submitPitch()"]
    TypeFallback --> Submit
    Submit -->|length < 30 chars| Error["setError() — validation"]
    Submit -->|length ≥ 30 chars| analyzePitch["analyzePitch(text)"]
```

---

## 12. Design System

| Token | Value | Usage |
|---|---|---|
| Background (dark) | `#0F172A` | Page root |
| Surface | `#1E293B` | Cards, panels, chat bubbles |
| Border | `#334155` | All borders |
| Primary text | `#E2E8F0` | Body copy |
| Muted text | `#94A3B8` | Subtitles, labels |
| Accent blue | `#38BDF8` | CTAs, user chat bubbles |
| Score green | `#4ADE80` | Scores ≥ 8 |
| Score amber | `#FBBF24` | Scores 5–7 |
| Score red | `#F87171` | Scores ≤ 4 |
| Font (headings) | Roboto Slab 700 | Landing title, section heads |
| Font (body) | Inter 400/600/700 | All other text |
| Font (scores) | DM Mono (inline) | ScoreRing label |

---

## 13. Build & Deployment

```mermaid
flowchart LR
    Dev["npm run dev\nvite dev server :5173"] -->|local iteration| Browser
    Build["npm run build\nvite build → /dist"] --> Dist["/dist static assets"]
    Dist --> Serve["npm start\nserve -s dist"]
    Dist --> CDN["Static CDN / hosting\n(Netlify, Vercel, etc.)"]
```

### Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Hot-reload dev server |
| `build` | `vite build` | Optimised production bundle |
| `preview` | `vite preview` | Preview production build locally |
| `start` | `serve -s dist` | Serve built `/dist` as SPA |
| `lint` | `eslint . --ext js,jsx` | Static code analysis |

---

## 14. Key Architectural Decisions & Trade-offs

| Decision | Rationale | Trade-off |
|---|---|---|
| **Single-file app (`App.jsx`)** | Rapid prototyping; zero routing complexity | Harder to maintain at scale |
| **No backend / database** | Zero infra; fully static hosting | No persistence — session state lost on refresh |
| **Railway proxy for API key** | API key is never exposed to the browser | Extra network hop; proxy must be kept live |
| **Hardcoded investor personas** | Curated, high-quality prompts; no config needed | Adding new investors requires a code change |
| **Web Speech API** | Native browser API; no third-party libs | Varies by browser; graceful fallback to textarea |
| **Phase-based navigation** | Enforces strict linear flow | Cannot deep-link to a specific phase |
| **JSON-only Claude outputs** | Deterministic parsing; no markdown stripping needed | Prompt engineering effort required |
