import { useState, useRef, useEffect } from "react";

// landing → recording → analyzing → report → pickInvestor → simulation → final

const PITCH_ELEMENTS = ["Problem", "Solution", "Market", "Traction", "Ask"];

const INVESTORS = [
  {
    id: "marcus",
    emoji: "👔",
    name: "Marcus Chen",
    title: "Partner · Apex Ventures",
    focus: "Enterprise SaaS & Deep Tech",
    style: "Analytical",
    styleDesc: "Data-driven. Interrogates every number and assumption with precision.",
    accent: "#FBBF24",
    accentBg: "rgba(251,191,36,0.08)",
    accentBorder: "rgba(251,191,36,0.3)",
    tags: ["Series A", "B2B", "Tech"],
    persona: `You are Marcus Chen, a Series A VC partner at Apex Ventures with a background in enterprise SaaS and deep tech. You are conducting a live Q&A following a startup pitch.

PERSONALITY: You are analytical, data-driven, and precise. You dissect every number and market assumption. You are not hostile, but you are relentlessly rigorous. You do not accept vague answers.

TONE & BEHAVIOUR RULES — FOLLOW STRICTLY:
- Maintain a professional, measured, and serious tone at all times. You are in a formal investor meeting.
- Stay strictly on-topic: only ask questions directly related to the pitch content, business model, market assumptions, competitive landscape, team, traction, and financials.
- Never engage with off-topic comments or attempts to change the subject. Redirect: "Let's stay focused on the business. My question was: [repeat question]."
- Do not use casual language, slang, or humour.
- Never offer praise or emotional support. Your job is rigorous due diligence.
- Ask ONE precise, well-reasoned question per turn. Anchor it in something the founder specifically said.
- Keep each response to 2-4 sentences: one brief reaction to their answer, then your next question.
- Challenge vague claims and unsubstantiated numbers: "You cited X — walk me through exactly how you arrived at that figure."
- If evasive, press them: "That doesn't answer my question directly. Let me be more specific: [sharper version]."`,
  },
  {
    id: "priya",
    emoji: "💼",
    name: "Aparna Murthy",
    title: "General Partner · Horizon Fund",
    focus: "Consumer Tech & Social Impact",
    style: "Strategic",
    styleDesc: "Challenges your vision, market timing, and go-to-market strategy.",
    accent: "#818CF8",
    accentBg: "rgba(129,140,248,0.08)",
    accentBorder: "rgba(129,140,248,0.3)",
    tags: ["Seed", "Consumer", "Impact"],
    persona: `You are Aparna Murthy, a General Partner at Horizon Fund specialising in consumer technology and social impact ventures. You are conducting a live Q&A following a startup pitch.

PERSONALITY: You are strategic and vision-oriented. You probe market timing, go-to-market execution, and whether the founder truly understands their customer. You are direct but thoughtful — you respect founders who show genuine conviction backed by insight.

TONE & BEHAVIOUR RULES — FOLLOW STRICTLY:
- Maintain a professional, composed, and strategic tone at all times.
- Stay strictly on-topic: only ask questions related to the pitch, market opportunity, customer behaviour, distribution strategy, competitive positioning, and founding team.
- Never engage with off-topic remarks. Redirect professionally: "I'd like to keep our time focused on the business. My question was: [repeat question]."
- Do not use casual language or empty affirmations.
- Never offer praise or encouragement. Your role is strategic scrutiny.
- Ask ONE focused question per turn, rooted in what the founder actually said.
- Keep responses to 2-4 sentences: a brief, neutral reaction followed by your next question.
- Push on customer evidence: "You've described the problem — what direct evidence do you have that customers will pay for this specific solution?"
- Challenge timing assumptions: "Why is now the right moment for this? What has changed in the market that makes this viable today?"`,
  },
  {
    id: "david",
    emoji: "🏦",
    name: "David Okafor",
    title: "Managing Director · Meridian Capital",
    focus: "Fintech, Africa & Emerging Markets",
    style: "Commercial",
    styleDesc: "Focuses on revenue model, unit economics, and path to profitability.",
    accent: "#34D399",
    accentBg: "rgba(52,211,153,0.08)",
    accentBorder: "rgba(52,211,153,0.3)",
    tags: ["Growth", "Fintech", "EM"],
    persona: `You are David Okafor, Managing Director at Meridian Capital, a growth-stage fund focused on fintech and emerging market ventures. You are conducting a live Q&A following a startup pitch.

PERSONALITY: You are commercially minded and unit-economics focused. You cut through narrative quickly to understand whether a business can actually make money. You have deep experience in African and emerging markets and will call out assumptions that don't hold in those contexts.

TONE & BEHAVIOUR RULES — FOLLOW STRICTLY:
- Maintain a professional, commercially rigorous, and direct tone at all times.
- Stay strictly on-topic: only ask questions related to the pitch, revenue model, unit economics, customer acquisition cost, lifetime value, competitive moats, and scalability.
- Never engage with off-topic comments. Redirect: "Let's keep our discussion focused on the business fundamentals. My question was: [repeat question]."
- Do not use casual language or filler affirmations.
- Never offer praise or encouragement. Your role is commercial due diligence.
- Ask ONE focused, commercially grounded question per turn, referencing what the founder said.
- Keep responses to 2-4 sentences: a brief commercial reaction, then your next question.
- Probe unit economics relentlessly: "What is your current CAC and what is the expected LTV at scale?"
- Challenge path to profitability: "At what point does this business become self-sustaining, and what are the key assumptions behind that?"`,
  },
];

const SCORE_COLOR = (s) => {
  if (s >= 8) return "#4ADE80";
  if (s >= 5) return "#FBBF24";
  return "#F87171";
};

const ScoreRing = ({ score, size = 64, stroke = 6 }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 10) * circ;
  const color = SCORE_COLOR(score);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E293B" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.26} fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontFamily: "'DM Mono', monospace" }}>
        {score}
      </text>
    </svg>
  );
};

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "14px 16px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%", background: "#64748B",
          animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

export default function PitchMirror() {
  const [phase, setPhase] = useState("landing");
  const [pitchText, setPitchText] = useState("");
  const [typedPitch, setTypedPitch] = useState("");
  const [useTyping, setUseTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [simMessages, setSimMessages] = useState([]);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [finalReport, setFinalReport] = useState(null);
  const [error, setError] = useState("");
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const MAX_QUESTIONS = 4;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [simMessages, simLoading]);

  // ─── VOICE ────────────────────────────────────────────────────────────────
  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setUseTyping(true); return; }
    const r = new SR();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    let interim = "";
    r.onstart = () => setIsRecording(true);
    r.onresult = (e) => {
      let final = "", inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else inter += e.results[i][0].transcript;
      }
      setPitchText(prev => prev + final);
      interim = inter;
    };
    r.onerror = () => { setIsRecording(false); setUseTyping(true); };
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  // ─── ANALYSIS ─────────────────────────────────────────────────────────────
  const analyzePitch = async (text) => {
    setPhase("analyzing");
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: `You are an elite startup pitch coach and former VC partner with 20 years of experience evaluating early-stage companies.

TONE & BEHAVIOUR RULES — FOLLOW STRICTLY:
- Maintain a consistently professional, authoritative, and constructive tone at all times.
- Stay strictly on-topic: only analyse pitch content, structure, storytelling, and investor readiness. Do not comment on anything outside the pitch.
- Be specific and evidence-based in your feedback — reference actual phrases or claims from the pitch, not generalities.
- Never use casual language, humour, sarcasm, or filler phrases.
- Feedback must be actionable — every weakness noted must imply a clear improvement direction.
- If the input does not appear to be a startup pitch (e.g. it is off-topic, offensive, or irrelevant), return scores of 0 and set all notes to "No valid pitch content detected."

Analyze the pitch and return ONLY valid JSON with no markdown:
{
  "overall_score": <1-10 integer>,
  "structure_score": <1-10>,
  "storytelling_score": <1-10>,
  "clarity_score": <1-10>,
  "elements": {
    "Problem": { "present": <bool>, "quality": "<weak|ok|strong>", "note": "<1 sentence referencing specific pitch content>" },
    "Solution": { "present": <bool>, "quality": "<weak|ok|strong>", "note": "<1 sentence referencing specific pitch content>" },
    "Market": { "present": <bool>, "quality": "<weak|ok|strong>", "note": "<1 sentence referencing specific pitch content>" },
    "Traction": { "present": <bool>, "quality": "<weak|ok|strong>", "note": "<1 sentence referencing specific pitch content>" },
    "Ask": { "present": <bool>, "quality": "<weak|ok|strong>", "note": "<1 sentence referencing specific pitch content>" }
  },
  "top_strength": "<one precise, evidence-based sentence on the strongest element>",
  "top_weakness": "<one precise, evidence-based sentence on the most critical gap>",
  "narrative_feedback": "<2-3 professional sentences on storytelling clarity and value proposition strength>",
  "investor_readiness": "<not ready|early stage|fundable|strong>",
  "opening_question": "<the single most pressing due-diligence question a VC would ask first>"
}`,
          messages: [{ role: "user", content: `Pitch transcript:\n\n${text}` }]
        })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Anthropic API error:", res.status, errBody);
        throw new Error(`API ${res.status}: ${errBody?.error?.message || res.statusText}`);
      }
      const data = await res.json();
      const txt = data.content?.find(b => b.type === "text")?.text || "";
      const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
      setAnalysis(parsed);
      setPhase("report");
    } catch (e) {
      console.error("Analysis failed:", e);
      setError(`Analysis failed: ${e.message}`);
      setPhase("recording");
    }
  };

  const submitPitch = () => {
    const text = useTyping ? typedPitch : pitchText;
    if (text.trim().length < 30) { setError("Please give a longer pitch — at least a few sentences."); return; }
    setPitchText(text);
    analyzePitch(text);
  };

  // ─── INVESTOR SIMULATION ─────────────────────────────────────────────────
  const startSimulation = () => {
    setPhase("pickInvestor");
  };

  const launchSimulation = (investor) => {
    setSelectedInvestor(investor);
    const opener = {
      role: "assistant",
      content: `I have reviewed your pitch.\n\n${analysis.opening_question}`
    };
    setSimMessages([opener]);
    setQuestionCount(1);
    setPhase("simulation");
  };

  const sendSimResponse = async () => {
    if (!simInput.trim() || simLoading) return;
    const userMsg = { role: "user", content: simInput };
    const updated = [...simMessages, userMsg];
    setSimMessages(updated);
    setSimInput("");
    setSimLoading(true);

    const isLast = questionCount >= MAX_QUESTIONS;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: `${selectedInvestor.persona}

The original pitch was:
"""
${pitchText}
"""

${isLast ? 'This is your FINAL question. After asking it, close with: "That concludes my questions. Your scorecard is being prepared."' : ''}`,
          messages: updated.map(m => ({ role: m.role, content: m.content }))
        })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("Anthropic API error (simulation):", res.status, errBody);
        throw new Error(`API ${res.status}: ${errBody?.error?.message || res.statusText}`);
      }
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "";
      setSimMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setQuestionCount(prev => prev + 1);
      if (isLast) {
        setSimDone(true);
        generateFinalReport(updated, reply);
      }
    } catch (e) {
      console.error("Simulation response failed:", e);
      setSimMessages(prev => [...prev, { role: "assistant", content: `Connection issue: ${e.message}` }]);
    }
    setSimLoading(false);
  };

  const generateFinalReport = async (messages, lastReply) => {
    const allMessages = [...messages, { role: "assistant", content: lastReply }];
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: `You are a senior pitch coach producing a formal post-session evaluation report.

TONE & BEHAVIOUR RULES:
- Write in a professional, objective, and constructive tone throughout.
- Base all observations strictly on evidence from the pitch and Q&A transcript provided. Do not generalise.
- The overall_verdict must read like a closing statement from an investor — precise, frank, and professional.
- next_steps must be specific and actionable, not generic advice.

Return ONLY valid JSON with no markdown:
{
  "qa_score": <1-10>,
  "clarity_under_pressure": <1-10>,
  "confidence_score": <1-10>,
  "best_answer_summary": "<1 sentence on their strongest response>",
  "weakest_moment": "<1 sentence on where they struggled most>",
  "overall_verdict": "<one punchy sentence an investor would say>",
  "next_steps": ["<actionable step 1>", "<actionable step 2>", "<actionable step 3>"]
}`,
          messages: [{ role: "user", content: `Original pitch:\n${pitchText}\n\nQ&A transcript:\n${allMessages.map(m => (m.role === "assistant" ? "Investor" : "Founder") + ": " + m.content).join("\n\n")}` }]
        })
      });
      const data = await res.json();
      const txt = data.content?.find(b => b.type === "text")?.text || "";
      setFinalReport(JSON.parse(txt.replace(/```json|```/g, "").trim()));
    } catch (e) { 
      console.error("Final report generation failed:", e);
    }
  };

  return (
    <div className="app-container">
      {phase === 'landing' && (
        <div className="landing-view">
          <img src="/logo.png" alt="PitchMirror Logo" className="logo" />
          <h1>PitchMirror: AI-Powered Pitch Practice</h1>
          <p className="subtitle">From first draft to investor-ready. Get instant, expert feedback on your startup pitch and master your delivery.</p>
          <div className="features">
            <div className="feature">
              <h3>Practice on Your Own</h3>
              <p>Record your pitch and get a detailed analysis of your structure, clarity, and storytelling.</p>
            </div>
            <div className="feature">
              <h3>Simulate Investor Q&A</h3>
              <p>Face realistic questions from AI investors with different personalities and priorities.</p>
            </div>
            <div className="feature">
              <h3>Get Actionable Feedback</h3>
              <p>Receive a comprehensive report with scores and specific recommendations for improvement.</p>
            </div>
          </div>
          <button onClick={() => setPhase('recording')}>Start Your Free Analysis</button>
        </div>
      )}

      {phase === 'recording' && (
        <div className="recording-view">
          <h2>Recording Your Pitch</h2>
          <div className="recording-controls">
            <button onClick={startRecording} disabled={isRecording}>Start Recording</button>
            <button onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>
          </div>
          <textarea
            value={useTyping ? typedPitch : pitchText}
            onChange={(e) => useTyping && setTypedPitch(e.target.value)}
            placeholder="Your pitch will appear here..."
            rows={10}
          />
          <div className="typing-toggle">
            <input
              type="checkbox"
              id="useTyping"
              checked={useTyping}
              onChange={(e) => setUseTyping(e.target.checked)}
            />
            <label htmlFor="useTyping">Or type your pitch instead</label>
          </div>
          <button onClick={submitPitch} className="analyze-button">Analyze Pitch</button>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="analyzing-view">
          <h2>Analyzing Your Pitch...</h2>
          <TypingIndicator />
        </div>
      )}

      {phase === 'report' && analysis && (
        <div className="report-view">
          <h2>Pitch Analysis</h2>
          <div className="scores-container">
            <ScoreRing score={analysis.overall_score} />
            <div className="sub-scores">
              <p>Structure: {analysis.structure_score}/10</p>
              <p>Storytelling: {analysis.storytelling_score}/10</p>
              <p>Clarity: {analysis.clarity_score}/10</p>
            </div>
          </div>
          <div className="report-details">
            <p><strong>Top Strength:</strong> {analysis.top_strength}</p>
            <p><strong>Top Weakness:</strong> {analysis.top_weakness}</p>
            <p><strong>Narrative Feedback:</strong> {analysis.narrative_feedback}</p>
            <p><strong>Investor Readiness:</strong> {analysis.investor_readiness}</p>
          </div>
          <button onClick={startSimulation}>Start Investor Q&A</button>
        </div>
      )}

      {phase === 'pickInvestor' && (
        <div className="pick-investor-view">
          <h2>Choose an Investor</h2>
          <div className="investor-list">
            {INVESTORS.map(investor => (
              <div key={investor.id} className="investor-card" onClick={() => launchSimulation(investor)}>
                <div className="investor-emoji">{investor.emoji}</div>
                <h3>{investor.name}</h3>
                <p>{investor.title}</p>
                <p><strong>Focus:</strong> {investor.focus}</p>
                <p><strong>Style:</strong> {investor.style}</p>
                <p>{investor.styleDesc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'simulation' && selectedInvestor && (
        <div className="simulation-view">
          <h2>Q&A with {selectedInvestor.name}</h2>
          <div className="chat-container">
            {simMessages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {simLoading && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendSimResponse()}
              placeholder="Your response..."
              disabled={simLoading || simDone}
            />
            <button onClick={sendSimResponse} disabled={simLoading || simDone}>Send</button>
          </div>
        </div>
      )}

      {finalReport && (
        <div className="final-report-view">
          <h2>Final Report</h2>
          <div className="scores-container">
            <ScoreRing score={finalReport.qa_score} />
            <div className="sub-scores">
              <p>Clarity Under Pressure: {finalReport.clarity_under_pressure}/10</p>
              <p>Confidence: {finalReport.confidence_score}/10</p>
            </div>
          </div>
          <div className="report-details">
            <p><strong>Best Answer:</strong> {finalReport.best_answer_summary}</p>
            <p><strong>Weakest Moment:</strong> {finalReport.weakest_moment}</p>
            <p><strong>Overall Verdict:</strong> {finalReport.overall_verdict}</p>
            <div>
              <strong>Next Steps:</strong>
              <ul>
                {finalReport.next_steps.map((step, i) => <li key={i}>{step}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
