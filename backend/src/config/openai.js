const { GoogleGenAI } = require("@google/genai");
const logger = require("../utils/logger");

if (!process.env.GEMINI_API_KEY) {
  logger.warn("GEMINI_API_KEY is not set.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

module.exports = ai;