/**
 * Implements the SM-2 spaced repetition algorithm (as used by Anki/SuperMemo)
 * to schedule the next review date for a flashcard based on how well the
 * user recalled it.
 *
 * qualityOfRecall: integer 0-5 supplied by the client after a review
 *   0-2 = incorrect / forgotten -> interval resets
 *   3-5 = correct, with 5 being "perfect, effortless recall"
 *
 * Returns the updated scheduling fields to persist on the Flashcard document.
 */
const MIN_EASE_FACTOR = 1.3;

function calculateNextReview({ quality, previousEaseFactor = 2.5, previousInterval = 0, reviewCount = 0 }) {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality of recall must be between 0 and 5');
  }

  let easeFactor = previousEaseFactor;
  let interval;
  let newReviewCount = reviewCount + 1;

  // Update ease factor using the SM-2 formula
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < MIN_EASE_FACTOR) easeFactor = MIN_EASE_FACTOR;

  if (quality < 3) {
    // Incorrect recall: reset repetition progress, review again soon
    newReviewCount = 0;
    interval = 1;
  } else if (reviewCount === 0) {
    interval = 1;
  } else if (reviewCount === 1) {
    interval = 6;
  } else {
    interval = Math.round(previousInterval * easeFactor);
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    reviewCount: newReviewCount,
    nextReviewDate,
    lastReviewed: new Date(),
  };
}

module.exports = { calculateNextReview };
