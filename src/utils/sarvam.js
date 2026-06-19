// ===== API KEY MANAGER =====
function getKeys() {
  try {
    return JSON.parse(localStorage.getItem("sarvam_api_keys") || "[]");
  } catch { return []; }
}

function getCurrentKeyIndex() {
  return parseInt(localStorage.getItem("sarvam_key_index") || "0");
}

function getActiveKey() {
  const keys = getKeys();
  if (keys.length === 0) return "";
  const idx = getCurrentKeyIndex() % keys.length;
  return keys[idx];
}

function rotateKey() {
  const keys = getKeys();
  if (keys.length <= 1) return;
  const next = (getCurrentKeyIndex() + 1) % keys.length;
  localStorage.setItem("sarvam_key_index", next);
  console.log(`🔄 Key rotated to index ${next}`);
}

export function saveKeys(keysArray) {
  localStorage.setItem("sarvam_api_keys", JSON.stringify(keysArray));
  localStorage.setItem("sarvam_key_index", "0");
}

export function getSavedKeys() {
  return getKeys();
}

// ===== API CALL with key rotation on failure =====
async function callAPI(prompt, maxTokens = 3000, retries = 0) {
  const key = getActiveKey();
  if (!key) throw new Error("Koi API key nahi mili!");

  const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": key,
    },
    body: JSON.stringify({
      model: "sarvam-30b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
      reasoning_effort: null,   // ← THINKING DISABLED — no reasoning_content
    }),
  });

  const data = await response.json();

  // Key expired/invalid — rotate and retry once
  if (!response.ok) {
    const errMsg = JSON.stringify(data);
    if ((response.status === 401 || response.status === 403 || errMsg.includes("invalid") || errMsg.includes("expired")) && retries < getKeys().length) {
      console.warn(`⚠️ Key failed (${response.status}), rotating...`);
      rotateKey();
      return callAPI(prompt, maxTokens, retries + 1);
    }
    throw new Error("API Error: " + errMsg);
  }

  const choice = data.choices?.[0];
  // reasoning_effort: null ensures content is always filled, not reasoning_content
  const text = choice?.message?.content || "";
  if (!text) throw new Error("Empty response — dobara try karo");
  return text;
}

// ===== VALIDATE KEY =====
export async function validateKey(key) {
  const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": key,
    },
    body: JSON.stringify({
      model: "sarvam-30b",
      messages: [{ role: "user", content: "Say OK" }],
      max_tokens: 5,
      reasoning_effort: null,
    }),
  });
  return response.ok;
}

// ===== GENERATORS =====
export async function generateSummary(text) {
  const chunk = text.slice(0, 4000);
  return await callAPI(`You are an expert Class 12 NIOS teacher. Read the chapter below and write a DETAILED SUMMARY.

Rules:
- Write 8-12 bullet points starting with •
- Each bullet = one complete meaningful sentence
- Cover ALL major topics
- Simple English, mix Hindi where helpful

Chapter:
${chunk}

Write summary now (only bullet points, no thinking, no preamble):`, 1500);
}

export async function generateNotes(text) {
  const half1 = text.slice(0, 3000);
  const half2 = text.slice(3000, 6000);

  const [part1, part2] = await Promise.all([
    callAPI(`You are a Class 12 NIOS teacher. Write DETAILED EXAM-READY NOTES.

Rules:
- Use ## for section headings
- Use **bold** for important terms and definitions  
- Write what student should write in NIOS board exam
- Cover every concept, no skipping
- Min 400 words

Chapter Part 1:
${half1}

Write notes now (directly, no thinking text):`, 2000),

    half2.length > 100
      ? callAPI(`You are a Class 12 NIOS teacher. Continue DETAILED EXAM-READY NOTES.

Rules:
- Use ## headings, **bold** key terms
- Exam-quality writing
- Cover all concepts

Chapter Part 2:
${half2}

Continue notes (directly, no thinking text):`, 2000)
      : Promise.resolve(""),
  ]);

  return part1 + (part2 ? "\n\n" + part2 : "");
}

export async function generateQuestions(text) {
  return await callAPI(`You are a Class 12 NIOS Economics teacher. Create 10 exam questions from the chapter.

Output EXACTLY in this format — no thinking, no preamble, start directly:

## MCQ Questions

**Q1.** [question]
a) [option]  b) [option]  c) [option]  d) [option]
**Answer: [letter]) [text]**

**Q2.** [question]
a) b) c) d)
**Answer: [answer]**

**Q3.** [question]
a) b) c) d)
**Answer: [answer]**

## Short Answer (2-3 marks)

**Q4.** [question]
**Answer:** [3-4 line proper answer]

**Q5.** [question]
**Answer:** [answer]

**Q6.** [question]
**Answer:** [answer]

**Q7.** [question]
**Answer:** [answer]

## Long Answer (5 marks)

**Q8.** [question]
**Answer:** [6-8 line detailed answer with all key points]

**Q9.** [question]
**Answer:** [answer]

**Q10.** [question]
**Answer:** [answer]

Chapter:
${text.slice(0, 4000)}`, 3000);
}

export async function generateAll(text) {
  const [summary, notes, questions] = await Promise.all([
    generateSummary(text),
    generateNotes(text),
    generateQuestions(text),
  ]);
  return { summary, notes, questions };
}