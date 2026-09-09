/**
 * NLP Client Service
 * Calls the Python/FastAPI microservice for live text classification.
 */

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

/**
 * Classify grievance description text.
 * Returns { category, confidence_score, is_low_confidence }
 * Falls back gracefully to 'other' if NLP service is unavailable.
 */
async function classifyDescription(description) {
  if (!description || typeof description !== 'string') {
    return { category: 'other', confidence_score: null, is_low_confidence: true };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${NLP_SERVICE_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: description.trim() }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`NLP service returned HTTP ${response.status}`);
      return { category: 'other', confidence_score: null, is_low_confidence: true };
    }

    const data = await response.json();
    return {
      category: data.category || 'other',
      confidence_score: data.confidence != null ? data.confidence : null,
      is_low_confidence: !!data.is_low_confidence,
    };
  } catch (err) {
    console.warn(`NLP classification fallback (service unreachable: ${err.message})`);
    return { category: 'other', confidence_score: null, is_low_confidence: true };
  }
}

module.exports = {
  classifyDescription,
};
