import { useState } from "react";
import { validateKey, saveKeys, getSavedKeys } from "../utils/sarvam";

export default function ApiKeySetup({ onKeysSet }) {
  const existing = getSavedKeys();
  const [screen, setScreen] = useState(existing.length > 0 ? "manage" : "add");
  const [keys, setKeys] = useState(existing.length > 0 ? existing : [""]);
  const [draftKeys, setDraftKeys] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(-1);
  const [showKeys, setShowKeys] = useState([]);
  const [editIdx, setEditIdx] = useState(-1);
  const [editVal, setEditVal] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function maskKey(k) {
    if (k.length <= 8) return "••••••••";
    return k.slice(0, 4) + "••••••••••••" + k.slice(-4);
  }

  function toggleShow(i) {
    setShowKeys((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  function removeKey(i) {
    const updated = keys.filter((_, idx) => idx !== i);
    setKeys(updated);
    saveKeys(updated);
    setSuccessMsg("Key removed!");
    setTimeout(() => setSuccessMsg(""), 2000);
    if (updated.length === 0) setScreen("add");
  }

  function startEdit(i) {
    setEditIdx(i);
    setEditVal(keys[i]);
  }

  async function saveEdit(i) {
    const trimmed = editVal.trim();
    if (!trimmed) return;
    setLoading(true);
    const ok = await validateKey(trimmed);
    if (!ok) {
      setError("❌ Invalid key — check karo");
      setLoading(false);
      return;
    }
    const updated = [...keys];
    updated[i] = trimmed;
    setKeys(updated);
    saveKeys(updated);
    setEditIdx(-1);
    setEditVal("");
    setError("");
    setSuccessMsg("✅ Key updated!");
    setTimeout(() => setSuccessMsg(""), 2000);
    setLoading(false);
  }

  function addDraftField() {
    if (draftKeys.length >= 5) return;
    setDraftKeys([...draftKeys, ""]);
  }

  function updateDraft(i, val) {
    const updated = [...draftKeys];
    updated[i] = val;
    setDraftKeys(updated);
  }

  function removeDraft(i) {
    setDraftKeys(draftKeys.filter((_, idx) => idx !== i));
  }

  async function handleAddKeys() {
    const trimmed = draftKeys.map((k) => k.trim()).filter(Boolean);
    if (trimmed.length === 0) { setError("Kam se kam ek key daalo!"); return; }
    setLoading(true);
    setError("");
    const valid = [];
    for (let i = 0; i < trimmed.length; i++) {
      setValidating(i);
      const ok = await validateKey(trimmed[i]);
      if (ok) valid.push(trimmed[i]);
    }
    setValidating(-1);
    if (valid.length === 0) {
      setError("❌ Koi bhi key valid nahi. Dashboard se check karo.");
      setLoading(false);
      return;
    }
    const merged = [...new Set([...keys, ...valid])];
    setKeys(merged);
    saveKeys(merged);
    setDraftKeys([""]);
    setLoading(false);
    setError("");
    setSuccessMsg(`✅ ${valid.length} key(s) add ho gayi!`);
    setTimeout(() => setSuccessMsg(""), 2500);
    setScreen("manage");
  }

  async function handleStart() {
    if (keys.length === 0) { setError("Pehle key add karo!"); return; }
    onKeysSet(keys);
  }

  // ── ADD SCREEN ──
  if (screen === "add") {
    return (
      <div className="setup-overlay">
        <div className="setup-card">
          <div className="setup-icon">🔑</div>
          <h1>PDF Explainer</h1>
          <p className="setup-subtitle">NIOS Class 12 — AI Study Notes Generator</p>

          <div className="setup-features">
            <div className="feature-item">📋 Detailed summary</div>
            <div className="feature-item">📖 Exam-ready notes</div>
            <div className="feature-item">❓ Practice Q&amp;A</div>
            <div className="feature-item">💾 Save as PDF</div>
          </div>

          <div className="setup-form">
            <label>
              Sarvam AI API Keys
              <span className="label-hint"> (multiple add karo — auto-rotate hogi)</span>
            </label>

            {draftKeys.map((k, i) => (
              <div key={i} className="key-row">
                <span className="key-status">
                  {validating === i ? "⏳" : "🔑"}
                </span>
                <input
                  type="text"
                  placeholder={`API Key ${i + 1}`}
                  value={k}
                  onChange={(e) => updateDraft(i, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeys()}
                  className="key-input"
                />
                {draftKeys.length > 1 && (
                  <button className="remove-key-btn" onClick={() => removeDraft(i)}>✕</button>
                )}
              </div>
            ))}

            {error && <p className="setup-error">{error}</p>}

            <div className="key-actions">
              {draftKeys.length < 5 && (
                <button className="add-key-btn" onClick={addDraftField}>
                  + Add another key
                </button>
              )}
              <button className="setup-btn" onClick={handleAddKeys} disabled={loading}>
                {loading
                  ? `⏳ Verify ho raha hai (${validating + 1}/${draftKeys.filter(Boolean).length})...`
                  : keys.length > 0 ? "✅ Add Keys" : "🚀 Start karo"}
              </button>
              {keys.length > 0 && (
                <button className="back-btn" onClick={() => { setScreen("manage"); setError(""); }}>
                  ← Wapas jao
                </button>
              )}
            </div>
          </div>

          <div className="setup-help">
            <a href="https://dashboard.sarvam.ai" target="_blank" rel="noreferrer">
              👉 Sarvam API key kahan milegi?
            </a>
            <p className="setup-note">
              Keys browser mein save hoti hain — kahi nahi jaati ✅<br />
              Agar ek expire ho, dusri automatically use hogi 🔄
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── MANAGE SCREEN ──
  return (
    <div className="setup-overlay">
      <div className="setup-card manage-card">
        <div className="setup-icon">📚</div>
        <h1>PDF Explainer</h1>
        <p className="setup-subtitle">NIOS Class 12 — AI Study Notes Generator</p>

        {successMsg && <div className="success-msg">{successMsg}</div>}
        {error && <p className="setup-error">{error}</p>}

        <div className="manage-header">
          <span className="manage-title">🔑 API Keys ({keys.length}/5)</span>
          <button className="add-more-btn" onClick={() => { setScreen("add"); setError(""); }}>
            + Add Key
          </button>
        </div>

        <div className="keys-list">
          {keys.map((k, i) => (
            <div key={i} className="key-card">
              {editIdx === i ? (
                /* Edit mode */
                <div className="edit-row">
                  <input
                    type="text"
                    className="key-input edit-input"
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(i)}
                  />
                  <div className="edit-actions">
                    <button className="save-edit-btn" onClick={() => saveEdit(i)} disabled={loading}>
                      {loading ? "⏳" : "✅ Save"}
                    </button>
                    <button className="cancel-edit-btn" onClick={() => { setEditIdx(-1); setError(""); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="key-view-row">
                  <div className="key-info">
                    <span className="key-number">Key {i + 1}</span>
                    <span className="key-value">
                      {showKeys.includes(i) ? k : maskKey(k)}
                    </span>
                  </div>
                  <div className="key-btns">
                    <button
                      className="icon-btn show-btn"
                      onClick={() => toggleShow(i)}
                      title={showKeys.includes(i) ? "Hide" : "Show"}
                    >
                      {showKeys.includes(i) ? "🙈" : "👁️"}
                    </button>
                    <button
                      className="icon-btn edit-btn"
                      onClick={() => startEdit(i)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn del-btn2"
                      onClick={() => removeKey(i)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="setup-btn start-big-btn" onClick={handleStart}>
          🚀 App Start Karo
        </button>

        <p className="setup-note" style={{ marginTop: "0.75rem" }}>
          Keys browser mein safe hain ✅ &nbsp;|&nbsp; Auto-rotate on expire 🔄
        </p>
      </div>
    </div>
  );
}