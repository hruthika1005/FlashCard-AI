const openai = require('../config/openai');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_CHARS_PER_CHUNK = 6000; // keeps each request well within context/token budgets

const SYSTEM_PROMPT = `You are an expert academic study-material writer who converts raw notes into high-quality flashcards.

STRICT RULES YOU MUST FOLLOW:
1. Base every flashcard ONLY on information explicitly present in the provided text. NEVER invent facts, numbers, names, or details that are not in the source text (no hallucination).
2. Questions must be concise and unambiguous — a student should know exactly what is being asked.
3. Answers must be accurate and directly traceable to the source text. If the text is medical/scientific in nature, use precise, textbook-accurate terminology found in or directly implied by the source.
4. Break down long or complex passages into MULTIPLE smaller flashcards rather than one large one. Prefer atomic, single-concept cards.
5. Whenever a concept has a well-known mnemonic device, or one can be reasonably constructed from the source content, include it in the "mnemonic" field. If no useful mnemonic applies, use an empty string.
6. Populate "highlightedConcepts" with the key terms/phrases from the answer that are most important to remember (up to 5 short items).
7. Assign a "difficulty" of "easy", "medium", or "hard" based on conceptual complexity.
8. Suggest 1-4 short lowercase "tags" (keywords) per card relevant to its content.
9. Classify each card with "subject" (broad field, e.g. "Biology"), "chapter" (the section/unit this content belongs to), and "topic" (the specific concept), inferred from context and any headings present in the text. If the text gives no clear hierarchy, make a reasonable inference from content but do not fabricate specific named chapters that aren't supported by the text.
10. If the provided text does not contain enough substantive information to create a meaningful flashcard, return an empty flashcards array rather than making something up.

Respond ONLY with valid JSON matching this exact shape, no markdown fences, no commentary:
{
  "flashcards": [
    {
      "subject": "string",
      "chapter": "string",
      "topic": "string",
      "question": "string",
      "answer": "string",
      "mnemonic": "string",
      "highlightedConcepts": ["string"],
      "difficulty": "easy|medium|hard",
      "tags": ["string"]
    }
  ]
}`;

/**
 * Splits long extracted text into manageable chunks along paragraph
 * boundaries so each Gemini request stays within a safe token budget
 * while avoiding cutting sentences in half where possible.
 */
function chunkText(text, maxChars = MAX_CHARS_PER_CHUNK) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Fallback: if a single paragraph itself exceeds maxChars, hard-split it
  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChars) return [chunk];
    const parts = [];
    for (let i = 0; i < chunk.length; i += maxChars) {
      parts.push(chunk.slice(i, i + maxChars));
    }
    return parts;
  });
}

/**
 * Calls Gemini for a single chunk of text and returns the parsed
 * flashcard array. Uses responseMimeType "application/json" to guarantee
 * parseable structured output.
 */
async function generateFlashcardsForChunk(chunk, hints = {}) {
  const userPrompt = `Source text:\n"""${chunk}"""\n\n${
    hints.subject ? `Preferred subject if applicable: ${hints.subject}\n` : ''
  }${hints.chapter ? `Preferred chapter if applicable: ${hints.chapter}\n` : ''}${
    hints.topic ? `Preferred topic if applicable: ${hints.topic}\n` : ''
  }Generate as many high-quality flashcards as the content justifies.`;

  const response = await openai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const raw =
  typeof response.text === "function"
    ? response.text()
    : response.text;
  if (!raw) {
    throw ApiError.internal('Gemini returned an empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(`Failed to parse Gemini JSON response: ${error.message}`);
    throw ApiError.internal('AI response could not be parsed');
  }

  if (!Array.isArray(parsed.flashcards)) {
    return [];
  }

  return parsed.flashcards.filter(
    (card) => card.question && card.answer && card.subject && card.chapter && card.topic
  );
}

/**
 * Main entry point: takes the full extracted note text, chunks it if
 * necessary, generates flashcards per chunk, and merges the results.
 * Optional hints let the user pre-specify subject/chapter/topic which
 * the AI will prefer when consistent with the content.
 */
async function generateFlashcardsFromText(text, hints = {}) {
  if (!text || !text.trim()) {
    throw ApiError.badRequest('No text provided to generate flashcards from');
  }

  const chunks = chunkText(text);
  logger.info(`Generating flashcards from ${chunks.length} chunk(s) of extracted text`);

  const results = [];
  for (const chunk of chunks) {
    try {
      const cards = await generateFlashcardsForChunk(chunk, hints);
      results.push(...cards);
    } catch (error) {
      logger.error(`Chunk flashcard generation failed: ${error.message}`);
      // Continue processing remaining chunks rather than failing the whole batch
    }
  }

  if (results.length === 0) {
    throw ApiError.badRequest(
      'The AI could not generate any flashcards from the provided content. Try uploading clearer or more detailed notes.'
    );
  }

  return results;
}

module.exports = { generateFlashcardsFromText, chunkText };
