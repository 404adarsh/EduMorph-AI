export default function LoadingScreen({ step }) {
  const steps = [
    { id: 1, label: "PDF se text extract ho raha hai..." },
    { id: 2, label: "Summary ban rahi hai..." },
    { id: 3, label: "Detailed notes generate ho rahe hain..." },
    { id: 4, label: "Practice questions ban rahe hain..." },
  ];

  return (
    <div className="loading-screen">
      <div className="loading-animation">
        <div className="book-loader">
          <div className="book-page"></div>
          <div className="book-page"></div>
          <div className="book-page"></div>
        </div>
      </div>
      <h3>AI Notes Bana Raha Hai...</h3>
      <p className="loading-sub">Sarvam AI tumhara pura chapter padh raha hai 📖</p>
      <div className="steps-list">
        {steps.map((s) => (
          <div key={s.id} className={`step-item ${step >= s.id ? "done" : step === s.id - 1 ? "active" : ""}`}>
            <span className="step-dot">{step > s.id ? "✅" : step === s.id ? "⏳" : "○"}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}