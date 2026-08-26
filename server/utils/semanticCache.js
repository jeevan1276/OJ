import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Embedding model for semantic similarity
const EMBEDDING_MODEL = 'text-embedding-004';

// In-memory semantic cache: [{ embedding: number[], response: string, key: string }]
const semanticCache = [];
const SIMILARITY_THRESHOLD = parseFloat(process.env.SEMANTIC_CACHE_THRESHOLD || '0.92');
const MAX_CACHE_SIZE = parseInt(process.env.SEMANTIC_CACHE_MAX_SIZE || '200');

/**
 * Compute cosine similarity between two embedding vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} similarity score in [0, 1]
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Generate an embedding vector for the given text using Gemini's embedding model.
 * @param {string} text
 * @returns {Promise<number[]|null>}
 */
export async function generateEmbedding(text) {
  try {
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    });
    return result.embeddings?.[0]?.values ?? null;
  } catch {
    return null;
  }
}

/**
 * Look up the semantic cache for a query that is similar enough to a cached entry.
 * @param {number[]} queryEmbedding - Embedding of the incoming query
 * @returns {{ response: string, similarity: number } | null}
 */
export function lookupCache(queryEmbedding) {
  if (!queryEmbedding) return null;
  let best = null;
  let bestScore = -1;
  for (const entry of semanticCache) {
    const score = cosineSimilarity(queryEmbedding, entry.embedding);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (bestScore >= SIMILARITY_THRESHOLD && best) {
    return { response: best.response, similarity: bestScore };
  }
  return null;
}

/**
 * Store a response in the semantic cache (async fire-and-forget).
 * @param {string} queryText - The original text used for embedding
 * @param {string} response - The AI response to cache
 */
export async function storeInCache(queryText, response) {
  try {
    const embedding = await generateEmbedding(queryText);
    if (!embedding) return;
    // Evict oldest if over limit
    if (semanticCache.length >= MAX_CACHE_SIZE) {
      semanticCache.shift();
    }
    semanticCache.push({ embedding, response, key: queryText.slice(0, 100) });
  } catch {
    // Non-critical; silently fail
  }
}

/**
 * Main entry point for semantically-cached AI generation.
 * Checks cache first; on miss, calls Gemini and stores result asynchronously.
 *
 * @param {string} queryText - The text to embed and look up / use as prompt
 * @param {Function} generateFn - An async function that returns the AI response string on cache miss
 * @returns {Promise<{ response: string, fromCache: boolean }>}
 */
export async function semanticCacheGenerate(queryText, generateFn) {
  const embedding = await generateEmbedding(queryText);
  const cached = lookupCache(embedding);
  if (cached) {
    return { response: cached.response, fromCache: true };
  }

  // Cache miss — call the actual AI
  const response = await generateFn();
  // Asynchronously store in cache (don't await)
  storeInCache(queryText, response).catch(() => {});
  return { response, fromCache: false };
}
