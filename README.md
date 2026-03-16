# openclaw-wordpress-rag-skill

Open-source OpenClaw skill for building **WordPress + WooCommerce RAG** knowledge bases with semantic embedding search.

> 開源 OpenClaw skill，用於建立 WordPress + WooCommerce 的 RAG 知識庫，支援語意 embedding 檢索。

---

## What This Does 功能說明

1. **Fetch** product and article data from WooCommerce / WordPress REST API
2. **Validate** source data against expected schema
3. **Generate embeddings** offline using OpenAI `text-embedding-3-small`
4. **Semantic search** via cosine similarity for recommendation systems
5. **Integrate with OpenClaw** — run the pipeline in the background, get notified in your channel when done

> 1. 從 WooCommerce / WordPress REST API 拉取商品與文章資料
> 2. 驗證來源資料格式
> 3. 離線產生 embedding 向量（OpenAI text-embedding-3-small）
> 4. 透過 cosine similarity 提供語意檢索
> 5. 整合 OpenClaw — 背景執行 pipeline，完成後自動在 channel 回報

---

## Project Structure 專案結構

```text
.
├── SKILL.md                          # OpenClaw skill definition
├── scripts/
│   ├── embedding-worker.js           # Background pipeline runner (OpenClaw integrated)
│   ├── fetch-source-data.js          # WP/Woo REST API data fetcher
│   ├── generate-embeddings.js        # Embedding generator (with progress bar)
│   ├── validate-source.js            # Source data validator
│   └── test-openai-connectivity.js   # API connectivity test
├── lib/
│   ├── semantic-search.js            # Cosine similarity + query embedding
│   ├── retrieval-helper.js           # Dual retrieval (products + articles)
│   ├── text-builders.js              # Text composition + profileToText
│   └── source-validators.js          # Schema validators
├── examples/
│   └── recommender-adapter.js        # Generic weighted ranking example
├── tests/
│   ├── cosine-similarity.test.js
│   ├── profile-to-text.test.js
│   └── semantic-retrieval.test.js
├── data/
│   ├── source/                       # Input (product-meta.json, article-insights.json)
│   └── embeddings/                   # Output (gitignored)
├── docs/
│   ├── ARTIFACT-CONTRACT.md          # Embedding file format spec (bilingual)
│   ├── OSS-BOUNDARY.md              # Public vs private scope (bilingual)
│   ├── MIGRATION-GUIDE.md           # Integration guide (bilingual)
│   └── DATA-SOURCE-GUIDE.md         # WP/Woo data fetching guide
├── openspec/                         # Design specs and proposals
├── .env.example
└── package.json
```

---

## Quick Start (Standalone) 快速開始（獨立使用）

```bash
git clone https://github.com/NelsonChen1982/openclaw-wordpress-rag-skill.git
cd openclaw-wordpress-rag-skill
npm install
cp .env.example .env
```

Edit `.env` and set your keys, then:

> 編輯 `.env` 填入你的 key，然後：

```bash
# Fetch data from WordPress / WooCommerce
npm run fetch:source

# Validate source data
npm run validate:source

# Generate embeddings
npm run build:embeddings
```

---

## Quick Start (OpenClaw Integration) 快速開始（OpenClaw 整合）

### 1. Install the skill 安裝 skill

```bash
# Clone into OpenClaw skills directory
cd ~/.openclaw/skills
git clone https://github.com/NelsonChen1982/openclaw-wordpress-rag-skill.git
cd openclaw-wordpress-rag-skill
npm install
cp .env.example .env
```

> 將 repo clone 到 OpenClaw 的 skills 目錄。OpenClaw 會自動偵測並載入。

### 2. Configure webhook 設定 webhook

Generate a token:

```bash
openssl rand -hex 32
```

Add to `~/.openclaw/openclaw.json`:

```json5
{
  hooks: {
    enabled: true,
    token: "your-generated-token",
    path: "/hooks"
  }
}
```

Set the same token in `.env`:

```bash
OPENCLAW_HOOK_TOKEN=your-generated-token
```

> 產生一組 token，分別填入 OpenClaw config 和 skill 的 `.env`。

### 3. Verify skill is loaded 確認 skill 已載入

```bash
openclaw skills --eligible
```

You should see `openclaw-wordpress-rag-skill` in the list.

> 確認 skill 出現在可用列表中。

### 4. Run the pipeline 執行 pipeline

From your OpenClaw channel, tell your agent:

> 在 OpenClaw 的 channel 中對 agent 說：

```
更新商品 embedding
```

Or run directly from CLI:

```bash
# Full pipeline: fetch → validate → build → notify OpenClaw
npm run pipeline

# Rebuild only (skip fetch): validate → build → notify OpenClaw
npm run pipeline:rebuild
```

When `OPENCLAW_HOOK_TOKEN` is set, the worker automatically notifies your OpenClaw Gateway upon completion. The pipeline runs in the background — your channel is never blocked.

> 設了 token 後，worker 完成時會自動通知 OpenClaw Gateway。pipeline 在背景執行，不會佔住你的 channel。

---

## All Commands 所有指令

| Command | Description |
|---------|-------------|
| `npm run pipeline` | Full pipeline: fetch → validate → build → notify OpenClaw |
| `npm run pipeline:rebuild` | Rebuild only: validate → build → notify (skip fetch) |
| `npm run fetch:source` | Fetch source data from WP/Woo REST API |
| `npm run validate:source` | Validate source JSON files |
| `npm run build:embeddings` | Generate embeddings (incremental, with progress bar) |
| `npm run build:embeddings:force` | Generate embeddings (full rebuild) |
| `npm run test:openai` | Test OpenAI API connectivity |
| `npm test` | Run unit and smoke tests |

---

## Environment Variables 環境變數

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for embedding generation |
| `EMBEDDING_MODEL` | No | `text-embedding-3-small` | Embedding model name |
| `WP_SITE_URL` | For fetch | — | WordPress site URL |
| `WC_CONSUMER_KEY` | For fetch | — | WooCommerce REST API consumer key |
| `WC_CONSUMER_SECRET` | For fetch | — | WooCommerce REST API consumer secret |
| `OPENCLAW_GATEWAY_URL` | No | `http://127.0.0.1:18789/hooks` | OpenClaw Gateway webhook URL |
| `OPENCLAW_HOOK_TOKEN` | For OpenClaw | — | Webhook auth token (enables OpenClaw notification) |
| `OPENCLAW_HOOK_NAME` | No | `embedding-done` | Webhook hook name |
| `EMBEDDING_BATCH_SIZE` | No | `10` | Items per batch |
| `EMBEDDING_BASE_DELAY_MS` | No | `200` | Delay between API calls (ms) |
| `EMBEDDING_MAX_RETRIES` | No | `3` | Max retries on API failure |
| `EMBEDDING_MAX_TEXT_LENGTH` | No | `30000` | Max chars per embedding input |

---

## Architecture 架構

```
┌─────────────────────────────────────────────────┐
│  OpenClaw Channel (LINE, Slack, Discord, etc.)  │
│  User: "更新商品 embedding"                       │
└──────────────────────┬──────────────────────────┘
                       │ trigger
                       ▼
┌─────────────────────────────────────────────────┐
│  embedding-worker.js (background pipeline)      │
│  ┌─────────────┐  ┌──────────┐  ┌───────────┐  │
│  │ fetch:source │→ │ validate │→ │ build:emb │  │
│  └─────────────┘  └──────────┘  └───────────┘  │
└──────────────────────┬──────────────────────────┘
                       │ webhook POST (result)
                       ▼
┌─────────────────────────────────────────────────┐
│  OpenClaw Gateway (:18789/hooks/embedding-done) │
│  → Agent wakes up → reports result in channel   │
└─────────────────────────────────────────────────┘
```

> 使用者在 channel 觸發 → pipeline 在背景跑 → 完成後透過 webhook 回報結果

---

## Integration Pattern 整合模式

This repo is the **open-source core**. For production use:

> 這個 repo 是**開源核心**。生產環境請搭配私有 adapter：

```
open-source core (this repo)
  → private adapter (your scoring formula, profileToText fieldMap)
    → private frontend (your product UX)
```

See `docs/OSS-BOUNDARY.md` for what's public vs private.

See `docs/MIGRATION-GUIDE.md` for step-by-step integration.

---

## Docs 文件

| Document | Description |
|----------|-------------|
| [`ARTIFACT-CONTRACT.md`](docs/ARTIFACT-CONTRACT.md) | Embedding output file format spec (bilingual) |
| [`OSS-BOUNDARY.md`](docs/OSS-BOUNDARY.md) | Public vs private scope definition (bilingual) |
| [`MIGRATION-GUIDE.md`](docs/MIGRATION-GUIDE.md) | How to integrate into your own system (bilingual) |
| [`DATA-SOURCE-GUIDE.md`](docs/DATA-SOURCE-GUIDE.md) | WP/Woo REST API setup and field mapping |

---

## License

MIT
