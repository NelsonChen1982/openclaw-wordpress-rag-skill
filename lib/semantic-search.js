const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
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

function profileToText(profile = {}) {
  const parts = [];
  if (profile.sweetness) parts.push(`口味偏好：${profile.sweetness}`);
  if (profile.body) parts.push(`酒體：${profile.body}`);
  if (profile.occasion) parts.push(`飲用情境：${profile.occasion}`);
  if (profile.budget) parts.push(`預算：${profile.budget}`);
  if (Array.isArray(profile.flavorNotes) && profile.flavorNotes.length) parts.push(`喜歡的風味：${profile.flavorNotes.join('、')}`);
  if (Array.isArray(profile.avoidNotes) && profile.avoidNotes.length) parts.push(`不喜歡的風味：${profile.avoidNotes.join('、')}`);
  return parts.join('。');
}

async function getQueryEmbedding(text) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return response.data[0].embedding;
}

function semanticSearch(queryEmbedding, candidateItems, topK = 5) {
  return candidateItems
    .map(item => ({ ...item, similarity: cosineSimilarity(queryEmbedding, item.embedding || []) }))
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
