# Tasks

## Phase A - Foundation
- [ ] Add robust source validators for `product-meta.json` and `article-insights.json`
- [ ] Add retry/backoff and rate-limit-safe batching in embedding script
- [ ] Add run summary output (items updated, elapsed time)

## Phase B - Retrieval
- [ ] Add `examples/recommender-adapter.js` showing how semantic score plugs into existing rankers
- [ ] Add article/product dual retrieval helper
- [ ] Add fallback path when embeddings missing

## Phase C - Quality
- [ ] Add tests for cosine similarity edge cases
- [ ] Add tests for profileToText composition
- [ ] Add smoke test for end-to-end semantic topK retrieval

## Phase D - Open source readiness
- [ ] Add `docs/OSS-BOUNDARY.md`
- [ ] Add `docs/ARTIFACT-CONTRACT.md`
- [ ] Add `docs/MIGRATION-GUIDE.md` (how to adopt without exposing private logic)
