import { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs`;

export default function PDFUploader({ onFileReady, loading }) {
  const inputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);

  async function extractText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    const pages = Math.min(pdf.numPages, 20);
    setPageCount(pages);
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((s) => s.str).join(" ") + "\n";
    }
    return fullText;
  }

  async function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
      setError("Sirf PDF file upload karo!");
      return;
    }
    setError("");
    setFileName(file.name);
    try {
      const text = await extractText(file);
      if (text.trim().length < 100) {
        setError("PDF mein text nahi mila — scanned image PDF nahi chalega.");
        return;
      }
      onFileReady(text, file.name);
    } catch (e) {
      setError("PDF read nahi hua: " + e.message);
    }
  }

  return (
    <div className="uploader-section">
      <div
        className={`drop-zone ${loading ? "disabled" : ""}`}
        onClick={() => !loading && inputRef.current.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!loading) handleFile(e.dataTransfer.files[0]);
        }}
      >
        <div className="drop-icon">
          {loading ? "⏳" : fileName ? "✅" : "📄"}
        </div>
        <p className="drop-title">
          {loading
            ? "AI notes bana raha hai... please wait"
            : fileName
            ? fileName
            : "NIOS PDF yahan drop karo"}
        </p>
        <small>
          {loading
            ? `${pageCount} pages process ho rahi hain`
            : "Click karo ya drag & drop karo • Max 20 pages"}
        </small>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {error && <div className="upload-error">⚠️ {error}</div>}
    </div>
  );
}