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
