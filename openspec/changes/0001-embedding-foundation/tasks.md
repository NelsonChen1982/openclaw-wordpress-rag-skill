# Tasks

## Phase A - Foundation
- [ ] Setup environment variables and `.env` workflow (`OPENAI_API_KEY`, `EMBEDDING_MODEL`)
- [ ] Add API connectivity validation (fail fast if key invalid/unreachable)
- [ ] Add robust source validators for `product-meta.json` and `article-insights.json`
- [ ] Add product/article text composition logic (explicit, testable builders)
- [ ] Add retry/backoff and rate-limit-safe batching in embedding script
- [ ] Add run summary output (items updated, elapsed time)

## Phase B - Retrieval
- [ ] Add article/product dual retrieval helper
- [ ] Add `examples/recommender-adapter.js` showing how semantic score plugs into existing rankers
- [ ] Add fallback path when embeddings missing

## Phase C - Quality
- [ ] Add tests for cosine similarity edge cases
- [ ] Add tests for profileToText composition
- [ ] Add smoke test for end-to-end semantic topK retrieval

## Phase D - Open source readiness
Priority order: **CONTRACT -> BOUNDARY -> MIGRATION**
- [ ] Add `docs/ARTIFACT-CONTRACT.md` (CONTRACT)
- [ ] Add `docs/OSS-BOUNDARY.md` (BOUNDARY)
- [ ] Add `docs/MIGRATION-GUIDE.md` (MIGRATION, how to adopt without exposing private logic)
