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
6. Environment variable and API key security management (`.env`, `.env.example`, `.gitignore`)

## Cost estimate (initial)
Using `text-embedding-3-small` (reference rate: **$0.02 / 1M tokens**):
- Example 200 products (~20k tokens) + 100 articles (~30k tokens) => ~50k tokens
- One full rebuild ~= **$0.001**
- Incremental rebuild is expected to be significantly lower

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

## Clarification: profileToText
`profileToText` in this open-source repo is **generic only** (portable baseline). Any business-specific wording, feature engineering, or proprietary profile enrichment remains private.

## Success Criteria
- Build product/article embeddings from source JSON
- Incremental mode updates only changed items
- Semantic retrieval returns topK with similarity scores
- Public repo remains generic and reusable
