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

## Profile input interface (generic)
```ts
interface ProfileInput {
  sweetness?: string;
  body?: string;
  occasion?: string;
  budget?: string;
  flavorNotes?: string[];
  avoidNotes?: string[];
  [key: string]: unknown;
}
```

## Artifact Contract (public schema)

### Common envelope
```json
{
  "schema_version": "1.0.0",
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "generated_at": "2026-03-16T00:00:00.000Z",
  "items": []
}
```

### `product-embeddings.json`
```json
{
  "schema_version": "1.0.0",
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "generated_at": "...",
  "items": [
    {
      "id": "product_123",
      "name": "Product name",
      "text_used": "normalized text",
      "textHash": "sha256...",
      "embedding": [0.01, -0.02]
    }
  ]
}
```

### `article-embeddings.json`
```json
{
  "schema_version": "1.0.0",
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "generated_at": "...",
  "items": [
    {
      "id": "article_456",
      "title": "Article title",
      "text_used": "normalized text",
      "textHash": "sha256...",
      "embedding": [0.01, -0.02]
    }
  ]
}
```

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

## Private outputs + git policy
`data/embeddings/*.json` are runtime-generated/private outputs and **must not be committed**.

Required `.gitignore` rules:
```gitignore
.env
.env.local
node_modules/
data/embeddings/*.json
!data/embeddings/.gitkeep
```

## Integration pattern
Open-source core -> adapter -> private service/UI

- Core exports stable functions and artifact schema.
- Private app imports artifacts and applies business ranking.
- Keep private rules outside this repository.
