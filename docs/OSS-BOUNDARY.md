## OSS Boundary Overview

This document defines what belongs in the public repository and what must stay private.

> 本文件定義哪些內容應放在公開 repo，哪些必須保留私有。

---

## Public Scope (In Repository)

The following are intentionally open-source:

- Data schema definitions
- Embedding pipeline (`scripts/generate-embeddings.js`)
- Retrieval primitives (`lib/semantic-search.js`, `lib/retrieval-helper.js`)
- Source validators and text builders
- Generic adapter example (`examples/recommender-adapter.js`)
- Source fetch scripts and docs
- Test suites

> 以下內容屬於公開範圍：
> - 資料 schema 定義
> - embedding pipeline
> - retrieval primitives
> - source validators / text builders
> - generic adapter 範例
> - source fetch 腳本與文件
> - 測試

---

## Private Scope (Out of Repository)

The following must remain private:

- Production frontend UX
- Business-specific weighting formulas and ranking logic
- Domain-specific `profileToText` field maps (e.g., product-category specific labels)
- Customer datasets and generated embedding artifacts
- API keys and environment variable values

> 以下內容不應放在公開 repo：
> - 生產前端 UX
> - 商業專屬加權與排序邏輯
> - domain-specific 的 `profileToText` 映射
> - 客戶資料與 embedding 產出檔
> - API keys 與實際環境變數值

---

## profileToText Boundary Rule

This repo provides a generic `profileToText` implementation with a neutral `DEFAULT_FIELD_MAP`.
Projects should pass a private field map in their own adapter/service layer.

> 本 repo 只提供 generic 版 `profileToText`（含中性 `DEFAULT_FIELD_MAP`）。
> 真正業務場景的欄位映射，應在私有 adapter/service 層傳入。

---

## Integration Pattern

Recommended architecture:

`open-source core -> private adapter -> private frontend`

- Open-source core: reusable pipeline and retrieval base
- Private adapter: business scoring and policy
- Private frontend: product UX and conversion logic

> 建議架構：
> `open-source core -> private adapter -> private frontend`
> - core：可重用管線與檢索底層
> - adapter：商業加權與策略
> - frontend：產品體驗與轉換邏輯

---

## Security and Data Handling

- Keep secrets only in `.env` (ignored by git)
- Keep `.env.example` as template only
- Do not commit customer content or generated embeddings

> 安全原則：
> - secret 只放 `.env`
> - `.env.example` 僅做範本
> - 不 commit 客戶內容與生成 embedding 檔案
