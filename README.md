# openclaw-wordpress-rag-skill

OpenClaw skill project for building **WordPress + WooCommerce RAG** knowledge bases with embedding support.

## What this repo is (v0.1)

This is a clean, new project (no coupling to existing lovensake runtime code) focused on the **foundation layer**:

1. Normalize product/article source JSON
2. Generate embeddings offline (`text-embedding-3-small`)
3. Provide semantic retrieval utilities (cosine similarity)
4. Output recommendation-ready artifacts

## Project structure

```text
.
├── SKILL.md
├── scripts/
│   └── generate-embeddings.js
├── lib/
│   └── semantic-search.js
├── data/
│   ├── source/
│   │   ├── product-meta.json          # input
│   │   └── article-insights.json      # input
│   └── embeddings/
│       ├── product-embeddings.json    # output (gitignored)
│       └── article-embeddings.json    # output (gitignored)
├── .env.example
├── .gitignore
└── package.json
```

## Quick start

1. Install deps

```bash
npm install
```

2. Configure env

```bash
cp .env.example .env
# set OPENAI_API_KEY in .env
```

3. Put source files

- `data/source/product-meta.json`
- `data/source/article-insights.json`

4. Generate embeddings

```bash
npm run build:embeddings
# or force rebuild
npm run build:embeddings:force
```

## Incremental behavior

`scripts/generate-embeddings.js` computes a `textHash` for each item.
If hash unchanged, existing embedding is reused (cost saving).

## Next milestone

- Add artifact schema (`taxonomy/synonyms/mapping/weights/version`)
- Add retrieval benchmark script
- Add optional vector DB adapter (for large catalogs)
- Add WordPress plugin import contract (`rag-bundle.zip`)

## License

MIT
