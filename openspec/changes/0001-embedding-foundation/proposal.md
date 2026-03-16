# Change Proposal: Embedding Foundation for WordPress + WooCommerce RAG

## Why
Current foundation uses structured tags and rule overlap. To improve recall and semantic matching, we need embedding-based retrieval that remains reusable and open-source.

## Scope
This change introduces:
1. Offline embedding generation pipeline
2. Incremental embedding refresh
3. Semantic search module (cosine similarity)
4. Integration contract for downstream recommender services
5. Open-source boundary policy (what stays in repo vs private)

## Non-goals
- No site-specific frontend
- No private business scoring weights in this repo
- No customer-specific prompt logic

## Deliverables
- `scripts/generate-embeddings.js`
- `lib/semantic-search.js`
- Artifact schema docs
- Example integration adapter (`examples/recommender-adapter.js`)
- Tests for cosine/profileToText/basic retrieval

## Success Criteria
- Build product/article embeddings from source JSON
- Incremental mode updates only changed items
- Semantic retrieval returns topK with similarity scores
- Public repo remains generic and reusable
