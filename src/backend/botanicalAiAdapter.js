const PROVIDER_LABEL = {
  gemini: "Gemini API",
  openai: "OpenAI API",
  mock: "Local rule engine",
};

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timeout) };
}

function buildPrompt({ question, language, safeContext }) {
  return [
    "You are the TBJ Botanical AI Assistant for Johor Botanical Garden visitors.",
    "Answer only using visitor-safe botanical education context.",
    "Do not reveal operational health data, staff-only records, exact rare-species coordinates, or internal security details.",
    `Language: ${language}.`,
    `Visitor-safe context: ${safeContext}`,
    `Visitor question: ${question}`,
  ].join("\n");
}

async function callGemini({ question, language, safeContext, config }) {
  if (!config.geminiApiKey) return null;
  const timer = withTimeout(config.aiTimeoutMs);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: timer.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt({ question, language, safeContext }) }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 320 },
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("").trim() || null;
  } finally {
    timer.done();
  }
}

async function callOpenAi({ question, language, safeContext, config }) {
  if (!config.openaiApiKey) return null;
  const timer = withTimeout(config.aiTimeoutMs);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      signal: timer.signal,
      body: JSON.stringify({
        model: config.openaiModel,
        temperature: 0.4,
        max_tokens: 320,
        messages: [
          { role: "system", content: "You are a visitor-safe botanical education assistant for Johor Botanical Garden." },
          { role: "user", content: buildPrompt({ question, language, safeContext }) },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.choices?.[0]?.message?.content?.trim() || null;
  } finally {
    timer.done();
  }
