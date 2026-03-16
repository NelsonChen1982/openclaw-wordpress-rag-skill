const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { profileToText } = require('./text-builders');

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

/**
 * Cosine similarity between two vectors.
 * Returns 0 with a warning if dimensions differ — truncating silently
 * would produce misleading scores.
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    console.warn(
      `[cosineSimilarity] dimension mismatch: ${a.length} vs ${b.length}, returning 0`
    );
    return 0;
  }
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function loadEmbeddings(baseDir = process.cwd()) {
  const dir = path.join(baseDir, 'data', 'embeddings');
  const products = JSON.parse(fs.readFileSync(path.join(dir, 'product-embeddings.json'), 'utf8'));
  const articles = JSON.parse(fs.readFileSync(path.join(dir, 'article-embeddings.json'), 'utf8'));
  return { products, articles };
}

// --- OpenAI client singleton ---
let _openaiClient = null;
function getOpenAIClient() {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openaiClient;
}

async function getQueryEmbedding(text) {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return response.data[0].embedding;
}

function semanticSearch(queryEmbedding, candidateItems, topK = 5) {
  return candidateItems
    .map(item => ({
      id: item.id,
      name: item.name || item.title || '',
      similarity: cosineSimilarity(queryEmbedding, item.embedding || []),
      metadata: item.metadata || null,
      item,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

module.exports = {
  cosineSimilarity,
  loadEmbeddings,
  profileToText,
  getQueryEmbedding,
  semanticSearch,
};
