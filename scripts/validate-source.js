#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { validateSourceData } = require('../lib/source-validators');
const { buildProductText, buildArticleText } = require('../lib/text-builders');

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'data', 'source');

function readJson(p, fallback = null) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const products = readJson(path.join(SOURCE_DIR, 'product-meta.json'), []);
const articles = readJson(path.join(SOURCE_DIR, 'article-insights.json'), []);

const result = validateSourceData(products, articles);
if (!result.ok) {
  console.error('❌ source validation failed');
  result.errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
}

console.log('✅ source validation passed');
console.log(`products=${result.counts.products} articles=${result.counts.articles}`);

if (products[0]) console.log(`sample product text: ${buildProductText(products[0]).slice(0,120)}...`);
if (articles[0]) console.log(`sample article text: ${buildArticleText(articles[0]).slice(0,120)}...`);
