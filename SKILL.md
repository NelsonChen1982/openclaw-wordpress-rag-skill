---
name: openclaw-wordpress-rag-skill
description: Build a WordPress + WooCommerce RAG knowledge base for OpenClaw, including ingestion-ready JSON normalization, embedding generation, semantic retrieval, and recommendation-ready artifacts. Use when creating or maintaining content+product RAG pipelines from WordPress posts and WooCommerce products.
---

# OpenClaw WordPress RAG Skill

## Scope
- Normalize WordPress article data + WooCommerce product data into RAG artifacts.
- Generate embeddings for products and articles.
- Provide semantic search primitives for downstream recommenders.

## Quick Start
1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
2. Put source files into `data/source/`:
   - `product-meta.json`
   - `article-insights.json`
3. Run embedding build:
   - `npm install`
   - `npm run build:embeddings`

## Outputs
- `data/embeddings/product-embeddings.json`
- `data/embeddings/article-embeddings.json`

## Notes
- Embedding outputs are intentionally gitignored.
- This repo is foundation-only (no site-specific UI/admin assumptions).
