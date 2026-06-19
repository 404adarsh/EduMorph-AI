import { useState, useEffect } from "react";
import ApiKeySetup from "./components/ApiKeySetup";
import PDFUploader from "./components/PDFUploader";
import NotesDisplay from "./components/NotesDisplay";
import LoadingScreen from "./components/LoadingScreen";
import { generateAll } from "./utils/sarvam";
import "./App.css";

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
  const keys = JSON.parse(localStorage.getItem("sarvam_api_keys") || "[]");
  return keys.length > 0 ? keys[0] : "";
});
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  // Listen for loading saved notes
  useEffect(() => {
    function handleLoad(e) {
      const entry = e.detail;
      setNotes({ summary: entry.summary, notes: entry.notes, questions: entry.questions });
      setFileName(entry.fileName);
    }
    window.addEventListener("loadSavedNote", handleLoad);
    return () => window.removeEventListener("loadSavedNote", handleLoad);
  }, []);

  async function handleFileReady(text, name) {
    setError("");
    setLoading(true);
    setLoadStep(1);
    setFileName(name);
    setNotes(null);

    try {
      setLoadStep(2);
      const result = await generateAll(text);
      setLoadStep(4);
      setNotes(result);
    } catch (e) {
      setError("❌ Kuch gadbad ho gayi: " + e.message);
    }
    setLoading(false);
    setLoadStep(0);
  }

  function handleReset() {
    setApiKey("");
    localStorage.removeItem("sarvam_api_key");
  }

  if (!apiKey) {
  return <ApiKeySetup onKeysSet={(keys) => setApiKey(keys[0] || "")} />;
}
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>📚 PDF Explainer</h1>
          <span className="header-badge">NIOS Class 12</span>
        </div>
        <div className="header-right">
          <span className="api-status">🟢 Sarvam AI Connected</span>
          <button className="change-key-btn" onClick={handleReset} title="Change API key">
            🔑 Change Key
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* Upload section */}
        <div className="upload-card">
          <h2 className="section-title">📄 PDF Upload Karo</h2>
          <p className="section-sub">NIOS website se PDF download karo aur yahan upload karo</p>
          <PDFUploader onFileReady={handleFileReady} loading={loading} />
          {error && <div className="main-error">{error}</div>}
        </div>

        {/* Loading */}
        {loading && <LoadingScreen step={loadStep} />}

        {/* Notes */}
        {notes && !loading && (
          <NotesDisplay notes={notes} fileName={fileName} />
        )}

        {/* Empty state */}
        {!notes && !loading && (
          <div className="empty-state">
            <div className="empty-cards">
              <div className="info-card">
                <span>📋</span>
                <h3>Smart Summary</h3>
                <p>Chapter ke saare key points ek jagah</p>
              </div>
              <div className="info-card">
                <span>📖</span>
                <h3>Exam Notes</h3>
                <p>Jo seedha board exam mein likh sako</p>
              </div>
              <div className="info-card">
                <span>❓</span>
                <h3>Practice Questions</h3>
                <p>MCQ + Short + Long — answers ke saath</p>
              </div>
              <div className="info-card">
                <span>💾</span>
                <h3>Save & Download</h3>
                <p>PDF mein save karo — kabhi bhi padhо</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}