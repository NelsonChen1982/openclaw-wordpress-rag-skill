#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OpenAI = require('openai');
const { validateSourceData } = require('../lib/source-validators');
const { buildProductText, buildArticleText } = require('../lib/text-builders');

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const FORCE = process.argv.includes('--force');
const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'data', 'source');
const OUT_DIR = path.join(ROOT, 'data', 'embeddings');
const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE || 10);
const BASE_DELAY_MS = Number(process.env.EMBEDDING_BASE_DELAY_MS || 200);
const MAX_RETRIES = Number(process.env.EMBEDDING_MAX_RETRIES || 3);

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment');
  process.exit(1);
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const hashText = txt => crypto.createHash('sha256').update(txt).digest('hex');

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function readJson(p, fallback = null) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}


async function embedWithRetry(text, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await client.embeddings.create({ model: EMBEDDING_MODEL, input: text });
      return {
        embedding: r.data[0].embedding,
        usageTokens: r.usage?.total_tokens || 0,
      };
    } catch (e) {
      if (i === retries - 1) throw e;
      const backoff = BASE_DELAY_MS * Math.pow(2, i) + Math.floor(Math.random() * 120);
      await sleep(backoff);
    }
  }
}

async function processInBatches(items, handler, batchSize = BATCH_SIZE) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    for (const item of batch) {
      await handler(item);
      await sleep(BASE_DELAY_MS);
    }
  }
}

function toMap(items = []) {
  const m = new Map();
  for (const it of items) m.set(String(it.id), it);
  return m;
}

async function run() {
  ensureDir(OUT_DIR);

  const products = readJson(path.join(SOURCE_DIR, 'product-meta.json'), []);
  const articles = readJson(path.join(SOURCE_DIR, 'article-insights.json'), []);

  const validation = validateSourceData(products, articles);
  if (!validation.ok) {
    console.error('source validation failed');
    validation.errors.forEach(e => console.error(`- ${e}`));
    process.exit(1);
  }

  const prevProducts = readJson(path.join(OUT_DIR, 'product-embeddings.json'), { items: [] });
  const prevArticles = readJson(path.join(OUT_DIR, 'article-embeddings.json'), { items: [] });

  const prevProductMap = toMap(prevProducts.items || []);
  const prevArticleMap = toMap(prevArticles.items || []);

  let productCount = 0;
  let articleCount = 0;
  let tokenCount = 0;

  const outProducts = [];
  await processInBatches(products, async (p) => {
    const id = String(p.id);
    const text = buildProductText(p);
    const textHash = hashText(text);
    const prev = prevProductMap.get(id);

    if (!FORCE && prev && prev.textHash === textHash && Array.isArray(prev.embedding)) {
      outProducts.push(prev);
      return;
    }

    const { embedding, usageTokens } = await embedWithRetry(text);
    outProducts.push({ id: p.id, name: p.name, text_used: text, textHash, embedding });
    productCount++;
    tokenCount += usageTokens;
  });

  const outArticles = [];
  await processInBatches(articles, async (a) => {
    const id = String(a.id);
    const text = buildArticleText(a);
    const textHash = hashText(text);
    const prev = prevArticleMap.get(id);

    if (!FORCE && prev && prev.textHash === textHash && Array.isArray(prev.embedding)) {
      outArticles.push(prev);
      return;
    }

    const { embedding, usageTokens } = await embedWithRetry(text);
    outArticles.push({ id: a.id, title: a.title, text_used: text, textHash, embedding });
    articleCount++;
    tokenCount += usageTokens;
  });

  fs.writeFileSync(path.join(OUT_DIR, 'product-embeddings.json'), JSON.stringify({
    model: EMBEDDING_MODEL,
    generated_at: new Date().toISOString(),
    items: outProducts,
  }, null, 2));

  fs.writeFileSync(path.join(OUT_DIR, 'article-embeddings.json'), JSON.stringify({
    model: EMBEDDING_MODEL,
    generated_at: new Date().toISOString(),
    items: outArticles,
  }, null, 2));

  console.log(`done | model=${EMBEDDING_MODEL} | updated products=${productCount} articles=${articleCount}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
