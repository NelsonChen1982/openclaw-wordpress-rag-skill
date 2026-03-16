# DATA SOURCE GUIDE

This guide explains how to fetch source data from WooCommerce + WordPress into this open-source RAG foundation.

## 1) WooCommerce REST API key setup

In WordPress admin:
1. Go to **WooCommerce -> Settings -> Advanced -> REST API**
2. Click **Add key**
3. Description: `openclaw-rag-sync`
4. Permissions: `Read`
5. Save and copy:
   - `Consumer key` -> `WC_CONSUMER_KEY`
   - `Consumer secret` -> `WC_CONSUMER_SECRET`

Also set:
- `WP_SITE_URL` (example: `https://yourstore.com`)

## 2) Fetch command

```bash
npm run fetch:source
```

This pulls:
- WooCommerce products from `/wp-json/wc/v3/products`
- WordPress posts from `/wp-json/wp/v2/posts`

With pagination support (`page`, `per_page`).

## 3) Field mapping overview

### WooCommerce product -> `data/source/product-meta.json`
- `name` -> product name
- `price`, `sale_price`, `stock_status`
- `categories` -> `types`
- `tags` -> `tags`
- `images[].src` -> `images`
- `permalink` -> `permalink`
- `description/short_description` -> `meta.rawDescription`

### WordPress post -> `data/source/article-insights.json`
- `title.rendered` -> `title`
- `excerpt.rendered` -> `summary`
- `tags[] + categories[]` -> `tagBlock.keywords`
- `excerpt.rendered` (plain text) -> `keyInsights[]`
- `link` -> `link`

## 4) Custom fields (ACF / custom meta)

If your site stores important data in custom fields:
1. Extend `scripts/fetch-source-data.js`
2. Read your custom payload from REST response (`meta`, `acf`, or custom endpoint)
3. Map into project schema fields (recommended under `meta`)
4. Re-run:
   - `npm run fetch:source`
   - `npm run validate:source`

## 5) Security notes

- Keep `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`, and `OPENAI_API_KEY` in `.env` only.
- Never commit real credentials.
- `.env` is ignored by git; `.env.example` is safe template only.
