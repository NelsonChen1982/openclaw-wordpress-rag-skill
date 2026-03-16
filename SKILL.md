---
name: openclaw-wordpress-rag-skill
description: Build a WordPress + WooCommerce RAG knowledge base for OpenClaw, including ingestion-ready JSON normalization, embedding generation, semantic retrieval, and recommendation-ready artifacts. Use when creating or maintaining content+product RAG pipelines from WordPress posts and WooCommerce products.
---

# OpenClaw WordPress RAG Skill

## Scope
- Normalize WordPress article data + WooCommerce product data into RAG artifacts.
- Generate embeddings for products and articles.
- Provide semantic search primitives for downstream recommenders.
- Integrate with OpenClaw Gateway for background pipeline execution and webhook notification.

## Quick Start (Standalone)
1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
2. Put source files into `data/source/`:
   - `product-meta.json`
   - `article-insights.json`
3. Run embedding build:
   - `npm install`
   - `npm run build:embeddings`

## Quick Start (OpenClaw Integration)
1. Copy `.env.example` to `.env` and set all required keys.
2. Set `OPENCLAW_HOOK_TOKEN` to match the token in your `~/.openclaw/openclaw.json` hooks config.
3. Run the full pipeline (fetch + validate + build + notify OpenClaw):
   ```bash
   npm run pipeline
   ```
4. Or rebuild embeddings only (skip fetch):
   ```bash
   npm run pipeline:rebuild
   ```

When `OPENCLAW_HOOK_TOKEN` is set, the worker automatically notifies your OpenClaw Gateway upon completion. When not set, it runs in standalone mode with console output only.

## Commands

| Command | Description |
|---------|-------------|
| `npm run pipeline` | Full pipeline: fetch → validate → build → notify OpenClaw |
| `npm run pipeline:rebuild` | Rebuild only: validate → build → notify (skip fetch) |
| `npm run fetch:source` | Fetch source data from WP/Woo REST API |
| `npm run validate:source` | Validate source JSON files |
| `npm run build:embeddings` | Generate embeddings (incremental) |
| `npm run build:embeddings:force` | Generate embeddings (full rebuild) |
| `npm test` | Run unit and smoke tests |

## OpenClaw Webhook Setup

Add this to your `~/.openclaw/openclaw.json`:
```json5
{
  hooks: {
    enabled: true,
    token: "your-token-here",
    path: "/hooks"
  }
}
```

Generate a token: `openssl rand -hex 32`

The worker sends a POST to `{OPENCLAW_GATEWAY_URL}/{OPENCLAW_HOOK_NAME}` with the pipeline result, using `x-openclaw-token` header for authentication.

## Outputs
- `data/embeddings/product-embeddings.json`
- `data/embeddings/article-embeddings.json`

## Notes
- Embedding outputs are intentionally gitignored.
- This repo is foundation-only (no site-specific UI/admin assumptions).
- See `docs/OSS-BOUNDARY.md` for public vs private scope.
- See `docs/MIGRATION-GUIDE.md` for integration steps.
