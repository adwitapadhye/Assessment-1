import React, { useMemo, useRef, useState } from "react";

const API = "http://127.0.0.1:8000";

const Card = ({ title, icon, children }) => (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <div style={styles.cardIcon}>{icon}</div>
      <div>
        <div style={styles.cardTitle}>{title}</div>
        <div style={styles.cardSubtitle}>Upload → Analyze → Ask</div>
      </div>
    </div>
    <div style={styles.divider} />
    {children}
  </div>
);

const Pill = ({ text, tone = "neutral" }) => (
  <span
    style={{
      ...styles.pill,
      ...(tone === "good"
        ? styles.pillGood
        : tone === "bad"
        ? styles.pillBad
        : styles.pillNeutral),
    }}
  >
    {text}
  </span>
);

export default function App() {
  const [resume, setResume] = useState(null);
  const [jd, setJD] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Upload a resume + job description, then ask me questions about the candidate.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const chatEndRef = useRef(null);

  const score = analysis?.match_score ?? 0;

  const scoreLabel = useMemo(() => {
    if (!analysis) return "—";
    if (score >= 80) return "Excellent match";
    if (score >= 60) return "Good match";
    if (score >= 40) return "Partial match";
    return "Low match";
  }, [analysis, score]);

  const scrollChat = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
  };

  const uploadFiles = async () => {
    if (!resume || !jd) {
      alert("Please choose both Resume and Job Description files.");
      return;
    }
    try {
      setUploading(true);
      setAnalysis(null);

      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jd", jd);

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setAnalysis(data);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Analysis ready ✅ Ask anything about this candidate!" },
      ]);
      scrollChat();
    } catch (e) {
      console.error(e);
      alert("Upload failed. Check backend terminal for errors.");
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    const q = question.trim();
    if (!q) return;

    if (!analysis) {
      alert("Upload resume + JD first to enable RAG chat.");
      return;
    }

    setMessages((prev) => [...prev, { role: "you", text: q }]);
    setQuestion("");
    setAsking(true);
    scrollChat();

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.answer || "No answer returned." }]);
      scrollChat();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "I couldn’t answer that due to an error. Check backend terminal." },
      ]);
      scrollChat();
    } finally {
      setAsking(false);
    }
  };

  // ✅ FIX: onEnter was missing (this causes blank page / crash)
  const onEnter = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.heroBg} />

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>RAG Resume Screener</div>
            <h1 style={styles.h1}>Resume Screening Tool</h1>
            <p style={styles.p}>
              Upload a resume and job description. Get an instant match score with strengths, gaps, and a context-aware chat.
            </p>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.miniStat}>
              <div style={styles.miniStatNum}>{analysis ? `${score}%` : "—"}</div>
              <div style={styles.miniStatLabel}>Match</div>
            </div>
            <div style={styles.miniStat}>
              <div style={styles.miniStatNum}>{analysis ? (analysis.strengths?.length ?? 0) : "—"}</div>
              <div style={styles.miniStatLabel}>Strengths</div>
            </div>
            <div style={styles.miniStat}>
              <div style={styles.miniStatNum}>{analysis ? (analysis.gaps?.length ?? 0) : "—"}</div>
              <div style={styles.miniStatLabel}>Gaps</div>
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          {/* LEFT: Upload + Analysis */}
          <div style={styles.leftCol}>
            <Card title="Upload Files" icon="📄">
              <div style={styles.field}>
                <label style={styles.label}>Upload Resume (PDF/TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  style={styles.file}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Upload Job Description (PDF/TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setJD(e.target.files?.[0] || null)}
                  style={styles.file}
                />
              </div>

              <button
                onClick={uploadFiles}
                disabled={uploading}
                style={{ ...styles.btn, ...(uploading ? styles.btnDisabled : {}) }}
              >
                {uploading ? "Analyzing…" : "Upload & Analyze"}
              </button>

              <div style={styles.hint}>Tip: Upload once. Then use chat to ask multiple questions about the candidate.</div>
            </Card>

            <Card title="Match Analysis" icon="📊">
              {!analysis ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>✨</div>
                  <div style={styles.emptyTitle}>No analysis yet</div>
                  <div style={styles.emptyText}>
                    Upload a resume and JD to see score, strengths, gaps and insights.
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.scoreRow}>
                    <div style={styles.scoreBox}>
                      <div style={styles.scoreNum}>{score}%</div>
                      <div style={styles.scoreLabel}>{scoreLabel}</div>

                      <div style={styles.progressWrap}>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${Math.min(Math.max(score, 0), 100)}%`,
                            }}
                          />
                        </div>
                        <div style={styles.progressText}>Match score based on extracted JD requirements vs resume</div>
                      </div>
                    </div>

                    <div style={styles.scoreSide}>
                      <div style={styles.sideTitle}>Key Insights</div>
                      <ul style={styles.list}>
                        {(analysis.insights || []).slice(0, 6).map((x, idx) => (
                          <li key={idx} style={styles.listItem}>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={styles.twoCols}>
                    <div>
                      <div style={styles.sectionTitle}>✅ Strengths</div>
                      <div style={styles.pills}>
                        {(analysis.strengths || []).length ? (
                          analysis.strengths.map((s) => <Pill key={s} text={s} tone="good" />)
                        ) : (
                          <div style={styles.muted}>No obvious strengths extracted.</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={styles.sectionTitle}>❌ Gaps</div>
                      <div style={styles.pills}>
                        {(analysis.gaps || []).length ? (
                          analysis.gaps.map((g) => <Pill key={g} text={g} tone="bad" />)
                        ) : (
                          <div style={styles.muted}>No gaps detected.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* RIGHT: Chat */}
          <div style={styles.rightCol}>
            <Card title="Ask Questions About This Candidate" icon="💬">
              <div style={styles.chatBox}>
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.msgRow,
                      justifyContent: m.role === "you" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        ...styles.msg,
                        ...(m.role === "you" ? styles.msgYou : styles.msgAI),
                      }}
                    >
                      <div style={styles.msgRole}>{m.role === "you" ? "You" : "AI"}</div>
                      <div>{m.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div style={styles.chatInputRow}>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={onEnter}
                  placeholder={analysis ? "Type your question and press Enter…" : "Upload first to enable chat…"}
                  style={styles.textarea}
                  disabled={!analysis || asking}
                />
                <button
                  onClick={askQuestion}
                  disabled={!analysis || asking}
                  style={{ ...styles.btn2, ...((!analysis || asking) ? styles.btnDisabled : {}) }}
                >
                  {asking ? "…" : "Ask"}
                </button>
              </div>

              <div style={styles.hint}>
                Example: “Does the candidate have experience with React?” • “Can they lead a backend team?”
              </div>
            </Card>
          </div>
        </div>

        <div style={styles.footer}>
          Built with FastAPI + Chroma + Sentence Transformers + Gemini • Real RAG (embed → retrieve → generate)
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1020",
    color: "#eaf0ff",
    position: "relative",
    overflow: "hidden",
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(900px 400px at 15% 10%, rgba(72, 132, 255, 0.35), transparent 60%), radial-gradient(900px 400px at 80% 15%, rgba(239, 68, 68, 0.25), transparent 60%), radial-gradient(800px 500px at 50% 100%, rgba(34, 197, 94, 0.18), transparent 60%)",
    filter: "blur(0px)",
    pointerEvents: "none",
  },
  container: { position: "relative", maxWidth: 1120, margin: "0 auto", padding: "28px 18px 36px" },
  header: {
    display: "flex",
    gap: 18,
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  badge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  h1: { margin: "10px 0 6px", fontSize: 34, lineHeight: 1.1 },
  p: { margin: 0, opacity: 0.85, maxWidth: 720 },
  headerRight: { display: "flex", gap: 10, alignItems: "stretch" },
  miniStat: {
    width: 110,
    borderRadius: 16,
    padding: 12,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  miniStatNum: { fontSize: 24, fontWeight: 800 },
  miniStatLabel: { fontSize: 12, opacity: 0.8, marginTop: 4 },

  grid: { display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 },
  leftCol: { display: "flex", flexDirection: "column", gap: 16 },
  rightCol: { display: "flex", flexDirection: "column", gap: 16 },

  card: {
    borderRadius: 18,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
    padding: 16,
    backdropFilter: "blur(10px)",
  },
  cardHeader: { display: "flex", gap: 12, alignItems: "center" },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: "rgba(255,255,255,0.10)",
    display: "grid",
    placeItems: "center",
    fontSize: 18,
  },
  cardTitle: { fontSize: 16, fontWeight: 800 },
  cardSubtitle: { fontSize: 12, opacity: 0.75, marginTop: 2 },
  divider: { height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0 14px" },

  field: { marginBottom: 12 },
  label: { display: "block", fontSize: 12, opacity: 0.85, marginBottom: 6 },
  file: {
    width: "100%",
    padding: 10,
    borderRadius: 12,
    border: "1px dashed rgba(255,255,255,0.20)",
    background: "rgba(0,0,0,0.10)",
    color: "#eaf0ff",
  },
  btn: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    background: "linear-gradient(90deg, #4f46e5, #06b6d4)",
    color: "white",
    boxShadow: "0 12px 30px rgba(79,70,229,0.22)",
  },
  btn2: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    background: "linear-gradient(90deg, #22c55e, #3b82f6)",
    color: "white",
    minWidth: 92,
  },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },
  hint: { marginTop: 10, fontSize: 12, opacity: 0.75 },

  emptyState: {
    padding: 18,
    borderRadius: 16,
    background: "rgba(0,0,0,0.12)",
    border: "1px solid rgba(255,255,255,0.10)",
    textAlign: "center",
  },
  emptyIcon: { fontSize: 26 },
  emptyTitle: { marginTop: 10, fontWeight: 800 },
  emptyText: { marginTop: 6, fontSize: 12, opacity: 0.75 },

  scoreRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  scoreBox: {
    borderRadius: 16,
    padding: 14,
    background: "rgba(0,0,0,0.14)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  scoreNum: { fontSize: 42, fontWeight: 900, letterSpacing: -1 },
  scoreLabel: { marginTop: 4, opacity: 0.85, fontWeight: 700 },
  progressWrap: { marginTop: 12 },
  progressBar: { height: 10, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #22c55e, #3b82f6, #a855f7)" },
  progressText: { marginTop: 8, fontSize: 12, opacity: 0.7 },

  scoreSide: { borderRadius: 16, padding: 14, background: "rgba(0,0,0,0.12)", border: "1px solid rgba(255,255,255,0.10)" },
  sideTitle: { fontWeight: 800, marginBottom: 8 },

  list: { margin: 0, paddingLeft: 18 },
  listItem: { marginBottom: 6, fontSize: 13, opacity: 0.9 },

  twoCols: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 },
  sectionTitle: { fontWeight: 900, marginBottom: 10 },
  pills: { display: "flex", flexWrap: "wrap", gap: 8 },
  pill: { padding: "7px 10px", borderRadius: 999, fontSize: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)" },
  pillGood: { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)" },
  pillBad: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)" },
  pillNeutral: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" },
  muted: { opacity: 0.75, fontSize: 13 },

  chatBox: { height: 420, overflowY: "auto", borderRadius: 16, padding: 12, background: "rgba(0,0,0,0.14)", border: "1px solid rgba(255,255,255,0.10)" },
  msgRow: { display: "flex", marginBottom: 10 },
  msg: { maxWidth: "85%", borderRadius: 16, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.12)" },
  msgYou: { background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.35)" },
  msgAI: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" },
  msgRole: { fontSize: 11, opacity: 0.75, marginBottom: 4, fontWeight: 800 },

  chatInputRow: { display: "flex", gap: 10, marginTop: 12, alignItems: "stretch" },
  textarea: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    resize: "vertical",
    padding: 10,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.12)",
    color: "#eaf0ff",
    outline: "none",
  },

  footer: { marginTop: 16, fontSize: 12, opacity: 0.65, textAlign: "center" },
};