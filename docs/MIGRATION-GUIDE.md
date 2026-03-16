## Migration Guide

This guide explains how to integrate this open-source embedding foundation into your own recommendation stack.

> 本指南說明如何把此開源 embedding 基礎層接入你的推薦系統。

---

## Prerequisites

- Node.js 18+
- OpenAI API key
- WooCommerce and WordPress REST APIs (or equivalent data source)

> 前置需求：
> - Node.js 18+
> - OpenAI API key
> - WooCommerce / WordPress REST API（或等效資料來源）

---

## Step 1: Clone, Install, and Configure

```bash
git clone <repo-url>
cd openclaw-wordpress-rag-skill
npm install
cp .env.example .env
```

Set values in `.env`.

> 第一步：clone 專案、安裝依賴、設定 `.env`。

---

## Step 2: Prepare Source Data

Option A: fetch from WordPress/WooCommerce

```bash
npm run fetch:source
```

Option B: manually place files:
- `data/source/product-meta.json`
- `data/source/article-insights.json`

> 第二步：準備資料。可用 fetch 腳本或手動放入 source JSON。

---

## Step 3: Validate Source Data

```bash
npm run validate:source
```

Validation should pass before embedding generation.

> 第三步：先做 source validation，通過後再生成 embedding。

---

## Step 4: Generate Embeddings

```bash
npm run build:embeddings
# force full rebuild
npm run build:embeddings:force
```

> 第四步：生成 embedding。可增量或強制全量重建。

---

## Step 5: Build Your Private Adapter

Use `examples/recommender-adapter.js` as a reference, not production copy-paste.
You should implement your own:
- `profileToText` field map
- scoring/weight policy
- frontend/API integration

> 第五步：建立私有 adapter。可參考範例，但不要原封不動上線。
> 你需要自行實作：
> - profileToText 的 fieldMap
> - 加權公式
> - 前端與 API 串接

---

## Step 6: Merge Semantic Score Into Existing Ranking

Typical weighted merge:

```text
totalScore =
  ruleScore * w_rule +
  ragScore * w_rag +
  semanticScore * w_semantic
```

Keep weights configurable (env/config), not hardcoded in open-source core.

> 第六步：把 semanticScore 與現有分數合併。
> 權重應配置化，不要硬寫在 core。

---

## FAQ

### When should I move to a vector database?

If embeddings grow beyond ~10,000 items, evaluate a vector DB for speed and operational simplicity.

> 何時要換向量資料庫？
> 建議超過約 10,000 筆時評估切換。

### Can I use another embedding model?

Yes. Change `EMBEDDING_MODEL` and rebuild embeddings.

> 可以換模型嗎？
> 可以，改 `EMBEDDING_MODEL` 後重跑 build:embeddings。

### How to run CI tests without hitting OpenAI?

`npm test` uses unit/smoke tests with mock paths for retrieval behavior.
The script `scripts/test-openai-connectivity.js` requires a real key and should run only in controlled environments.

> CI 怎麼避免打 OpenAI？
> `npm test` 以單元/煙霧測試為主（可 mock）。
> `scripts/test-openai-connectivity.js` 需要真 key，建議在受控環境才執行。
