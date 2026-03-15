# PitchMirror

PitchMirror is an AI-powered pitch practice web app. Record or type your startup pitch, get instant expert feedback from Claude AI, then step into a live Q&A with realistic AI investor personas — all with voice input and output.

## Features

- **🎤 Pitch Recording** — Record your pitch via microphone (Web Speech API) or type it manually.
- **🧠 AI Pitch Analysis** — Scores your pitch on structure, storytelling, and clarity. Identifies strengths, weaknesses, investor readiness, and the #1 question a VC would ask.
- **👔 Investor Simulation** — Simulate a 4-round Q&A with three distinct AI investor personas (Analytical, Strategic, Commercial). Speak your answers or type them.
- **🔊 Voice I/O in Q&A** — Investor replies are read aloud via text-to-speech. Your answers can be spoken using the mic button. Toggle voice on/off mid-session.
- **📊 Final Report** — After the Q&A, get scored on clarity under pressure, confidence, and overall performance with actionable next steps.
- **⤓ Download Reports** — Download the pitch analysis or full session report as a `.txt` file.
- **← Back Navigation** — Back buttons on every screen so you can revise and retry freely.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend proxy | Express (Node.js) |
| AI model | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Voice input | Web Speech API — SpeechRecognition |
| Voice output | Web Speech API — SpeechSynthesis |
| Hosting | Railway |

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```dotenv
ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at [console.anthropic.com](https://console.anthropic.com).

### 3. Start the development server (frontend only)

```bash
npm run dev
```

Open `http://localhost:5173/`.

> **Note:** This runs the Vite dev server only — the Express proxy is not active. Calls to `/api/chat` will fail unless you also run the server (see below) or temporarily point the fetch calls to your deployed Railway URL.

### 4. (Optional) Run the full stack locally

```bash
npm run build
npm start
```

This builds the frontend (`/dist`) and starts the Express proxy server at `http://localhost:3000`.

## Deploying to Railway

1. Push the repo to GitHub.
2. Create a new Railway service linked to the repo.
3. In Railway **Variables**, add:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```
4. Railway will run `npm run build` then `npm start` (`node server.js`), which serves the built SPA and proxies Claude API calls server-side.
