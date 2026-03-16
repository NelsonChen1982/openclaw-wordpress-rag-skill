## Artifact Contract

This document defines the runtime artifact format for embedding outputs.

> 本文件定義 embedding 輸出檔案在執行時的標準格式。

---

## Scope

The contract covers:
- `data/embeddings/product-embeddings.json`
- `data/embeddings/article-embeddings.json`

> 本規格涵蓋：
> - `data/embeddings/product-embeddings.json`
> - `data/embeddings/article-embeddings.json`

---

## Common Envelope Schema

All embedding artifacts must use this top-level envelope:

```json
{
  "schema_version": "1.0.0",
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "generated_at": "2026-03-16T00:00:00.000Z",
  "items": []
}
```

> 所有 embedding 檔案都必須使用相同的最外層結構。

### Field definitions

- `schema_version` (string): artifact schema version, current `1.0.0`
- `model` (string): embedding model name
- `dimensions` (number): embedding vector length
- `generated_at` (ISO-8601 string): generation timestamp
- `items` (array): embedding rows

> 欄位說明：
> - `schema_version`：規格版本，當前為 `1.0.0`
> - `model`：使用的 embedding 模型名稱
> - `dimensions`：向量維度長度
> - `generated_at`：產生時間（ISO-8601）
> - `items`：embedding 資料列

---

## Product Embedding Item Schema

Each item in `product-embeddings.json` must include:

```json
{
  "id": "product_123",
  "name": "Sample Product",
  "text_used": "normalized text used for embedding",
  "textHash": "sha256_hex",
  "embedding": [0.01, -0.02]
}
```

Required fields:
- `id` (string | number)
- `name` (string)
- `text_used` (string)
- `textHash` (string, SHA-256 hex)
- `embedding` (number[])

> `product-embeddings.json` 的每一筆資料需包含：
> - `id`
> - `name`
> - `text_used`
> - `textHash`（SHA-256）
> - `embedding`（數值陣列）

---

## Article Embedding Item Schema

Each item in `article-embeddings.json` must include:

```json
{
  "id": "article_456",
  "title": "Sample Article",
  "text_used": "normalized text used for embedding",
  "textHash": "sha256_hex",
  "embedding": [0.01, -0.02]
}
```

Required fields:
- `id` (string | number)
- `title` (string)
- `text_used` (string)
- `textHash` (string, SHA-256 hex)
- `embedding` (number[])

> `article-embeddings.json` 的每一筆資料需包含：
> - `id`
> - `title`
> - `text_used`
> - `textHash`（SHA-256）
> - `embedding`（數值陣列）

---

## Versioning Strategy

`schema_version` follows semantic versioning:
- PATCH: typo/docs/compatible metadata additions
- MINOR: backward-compatible field additions
- MAJOR: breaking schema changes

Current version: `1.0.0`.

> `schema_version` 採 semver：
> - PATCH：文件或相容性修正
> - MINOR：向後相容新增欄位
> - MAJOR：破壞性變更
> 目前版本為 `1.0.0`。

---

## Model and Dimension Baseline

Default baseline:
- Model: `text-embedding-3-small`
- Dimensions: `1536`

If model changes, regenerate embeddings and keep `model` + `dimensions` accurate in artifacts.

> 預設基準為 `text-embedding-3-small`（1536 維）。
> 若改模型，必須重建 embedding 並同步更新 `model` 與 `dimensions`。

---

## Git Policy for Artifacts

Embedding JSON files are runtime outputs and must not be committed.
They are excluded by `.gitignore`:

```gitignore
data/embeddings/*.json
!data/embeddings/.gitkeep
```

> embedding JSON 屬於執行產物，不應 commit。
> 透過 `.gitignore` 排除，只保留 `.gitkeep`。