# Design: Embedding Foundation + OSS Boundary

## Architecture

Input layer:
- `data/source/product-meta.json`
- `data/source/article-insights.json`

Build layer:
- Normalize text per product/article
- Generate embeddings via `text-embedding-3-small`
- Store artifacts in `data/embeddings/*.json`

Runtime layer:
- `profileToText(profile)`
- `getQueryEmbedding(profileText)`
- `semanticSearch(queryEmbedding, candidates, topK)`

## Artifact Contract (public)
- `product-embeddings.json`
- `article-embeddings.json`
- Future: `taxonomy.json`, `synonyms.json`, `mapping.json`, `version.json`

## OSS boundary policy

Public in this repo:
- Ingestion schema
- Embedding pipeline
- Retrieval primitives
- Validation scripts
- Generic adapters/examples

Private (not in this repo):
- Production frontend UX
- Business-specific scoring formulas
- Proprietary prompts and tuning
- Customer datasets and secrets

## Integration pattern

Open-source core -> adapter -> private service/UI

- Core exports stable functions and artifact schema.
- Private app imports artifacts and applies business ranking.
- Keep private rules outside this repository.
