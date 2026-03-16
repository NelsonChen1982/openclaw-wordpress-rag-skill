#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OpenAI = require('openai');

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const FORCE = process.argv.includes('--force');
const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'data', 'source');
const OUT_DIR = path.join(ROOT, 'data', 'embeddings');

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

function buildProductText(p) {
  return [
    p.name,
    `風味：${(p.meta?.sensory?.aroma || []).join('、')}`,
    `情境：${(p.meta?.occasion?.settings || []).join('、')}`,
    `類型：${(p.types || []).join('、')}`,
    `酒造：${(p.brewery || []).join('、')}`,
  ].filter(Boolean).join('。');
}

function buildArticleText(a) {
  return [
    a.title,
    `摘要：${a.summary || ''}`,
    `標籤：${(a.tagBlock?.keywords || []).join('、')}`,
    `洞察：${(a.keyInsights || []).join('、')}`,
  ].filter(Boolean).join('。');
}

async function embedWithRetry(text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await client.embeddings.create({ model: EMBEDDING_MODEL, input: text });
      return r.data[0].embedding;
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000);
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

  const prevProducts = readJson(path.join(OUT_DIR, 'product-embeddings.json'), { items: [] });
  const prevArticles = readJson(path.join(OUT_DIR, 'article-embeddings.json'), { items: [] });

  const prevProductMap = toMap(prevProducts.items || []);
  const prevArticleMap = toMap(prevArticles.items || []);

  let productCount = 0;
  let articleCount = 0;

  const outProducts = [];
  for (const p of products) {
    const id = String(p.id);
    const text = buildProductText(p);
    const textHash = hashText(text);
    const prev = prevProductMap.get(id);

    if (!FORCE && prev && prev.textHash === textHash && Array.isArray(prev.embedding)) {
      outProducts.push(prev);
      continue;
    }

    const embedding = await embedWithRetry(text);
    outProducts.push({ id: p.id, name: p.name, text_used: text, textHash, embedding });
    productCount++;
    await sleep(200);
  }

  const outArticles = [];
  for (const a of articles) {
    const id = String(a.id);
    const text = buildArticleText(a);
    const textHash = hashText(text);
    const prev = prevArticleMap.get(id);

    if (!FORCE && prev && prev.textHash === textHash && Array.isArray(prev.embedding)) {
      outArticles.push(prev);
      continue;
    }

    const embedding = await embedWithRetry(text);
    outArticles.push({ id: a.id, title: a.title, text_used: text, textHash, embedding });
    articleCount++;
    await sleep(200);
  }

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
