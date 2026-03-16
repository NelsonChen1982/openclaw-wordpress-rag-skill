#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { validateSourceData } = require('../lib/source-validators');

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'data', 'source');

const WP_SITE_URL = (process.env.WP_SITE_URL || '').replace(/\/$/, '');
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || '';
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || '';

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function fetchAllPages(baseUrl, params = {}, headers = {}) {
  const out = [];
  let page = 1;
  let totalPages = 1;

  do {
    const qs = new URLSearchParams({ ...params, page: String(page), per_page: String(params.per_page || 50) });
    const url = `${baseUrl}?${qs.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Fetch failed ${res.status} ${baseUrl}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    out.push(...(Array.isArray(data) ? data : []));

    const headerPages = Number(res.headers.get('X-WP-TotalPages') || 0);
    totalPages = headerPages || (Array.isArray(data) && data.length > 0 ? page + 1 : page);
    page++;
  } while (page <= totalPages);

  return out;
}

async function fetchTermsMap(type) {
  const baseUrl = `${WP_SITE_URL}/wp-json/wp/v2/${type}`;
  const rows = await fetchAllPages(baseUrl, { per_page: 100 });
  const map = new Map();
  for (const r of rows) map.set(Number(r.id), r.name);
  return map;
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function mapWooProduct(p) {
  return {
    id: String(p.id),
    name: p.name,
    price: p.price || p.regular_price || '',
    salePrice: p.sale_price || '',
    stockStatus: p.stock_status || 'unknown',
    types: (p.categories || []).map(c => c.name).filter(Boolean),
    tags: (p.tags || []).map(t => t.name).filter(Boolean),
    images: (p.images || []).map(i => i.src).filter(Boolean),
    permalink: p.permalink || '',
    brewery: [],
    meta: {
      sensory: {
        aroma: [],
        taste: []
      },
      occasion: {
        settings: []
      },
      rawDescription: stripHtml(p.description || p.short_description || '')
    }
  };
}

function mapWpPost(post, tagMap, categoryMap) {
  const tags = (post.tags || []).map(id => tagMap.get(Number(id))).filter(Boolean);
  const categories = (post.categories || []).map(id => categoryMap.get(Number(id))).filter(Boolean);

  return {
    id: String(post.id),
    title: post.title?.rendered || '',
    summary: stripHtml(post.excerpt?.rendered || ''),
    tagBlock: {
      keywords: [...new Set([...tags, ...categories])]
    },
    keyInsights: [stripHtml(post.excerpt?.rendered || '')].filter(Boolean),
    link: post.link || ''
  };
}

async function main() {
  if (!WP_SITE_URL) {
    console.error('Missing WP_SITE_URL');
    process.exit(1);
  }
  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    console.error('Missing WC_CONSUMER_KEY / WC_CONSUMER_SECRET');
    process.exit(1);
  }

  ensureDir(SOURCE_DIR);

  const wcBase = `${WP_SITE_URL}/wp-json/wc/v3/products`;
  const wcRows = await fetchAllPages(wcBase, {
    per_page: 50,
    consumer_key: WC_CONSUMER_KEY,
    consumer_secret: WC_CONSUMER_SECRET,
    status: 'publish'
  });

  const tagMap = await fetchTermsMap('tags');
  const categoryMap = await fetchTermsMap('categories');

  const postBase = `${WP_SITE_URL}/wp-json/wp/v2/posts`;
  const postRows = await fetchAllPages(postBase, { per_page: 50, status: 'publish' });

  const products = wcRows.map(mapWooProduct);
  const articles = postRows.map(p => mapWpPost(p, tagMap, categoryMap));

  const validation = validateSourceData(products, articles);
  if (!validation.ok) {
    console.error('Source validation failed after fetch:');
    validation.errors.forEach(e => console.error(`- ${e}`));
    process.exit(1);
  }

  fs.writeFileSync(path.join(SOURCE_DIR, 'product-meta.json'), JSON.stringify(products, null, 2));
  fs.writeFileSync(path.join(SOURCE_DIR, 'article-insights.json'), JSON.stringify(articles, null, 2));

  console.log('✅ source fetch complete');
  console.log(`products=${products.length} articles=${articles.length}`);
}

main().catch(err => {
  console.error('❌ fetch-source-data failed');
  console.error(err?.message || err);
  process.exit(1);
});
