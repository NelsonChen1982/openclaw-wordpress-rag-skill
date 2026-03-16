const { retrieveSemanticMatches } = require('../lib/retrieval-helper');

function toMapById(rows = []) {
  const map = new Map();
  for (const r of rows) map.set(String(r.id), r);
  return map;
}

function normalizeScore(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/**
 * Generic adapter example:
 * merge semantic scores with pre-existing scores from your private system.
 */
async function rankWithSemantic({
  profile,
  productCandidates,
  articleCandidates,
  productEmbeddingItems,
  articleEmbeddingItems,
  existingScores = {},
  config = {},
}) {
  const weights = {
    rule: Number(config.ruleWeight ?? process.env.RANK_RULE_WEIGHT ?? 0.5),
    rag: Number(config.ragWeight ?? process.env.RANK_RAG_WEIGHT ?? 0.2),
    semantic: Number(config.semanticWeight ?? process.env.RANK_SEMANTIC_WEIGHT ?? 0.3),
  };

  const semantic = await retrieveSemanticMatches({
    profile,
    productEmbeddingItems,
    articleEmbeddingItems,
    productCandidates,
    articleCandidates,
    topKProducts: Number(config.topKProducts ?? 20),
    topKArticles: Number(config.topKArticles ?? 8),
  });

  const semanticById = toMapById(semantic.products);

  const ranked = productCandidates.map(product => {
    const id = String(product.id);
    const base = existingScores[id] || {};

    const ruleScore = normalizeScore(base.ruleScore || 0);
    const ragScore = normalizeScore(base.ragScore || 0);
    const semanticScore = normalizeScore(semanticById.get(id)?.similarity || 0);

    const totalScore =
      ruleScore * weights.rule +
      ragScore * weights.rag +
      semanticScore * weights.semantic;

    return {
      id: product.id,
      name: product.name,
      totalScore,
      scoreBreakdown: {
        ruleScore,
        ragScore,
        semanticScore,
      },
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  return {
    ranked,
    semanticArticles: semantic.articles,
    queryText: semantic.queryText,
    weights,
  };
}

module.exports = {
  rankWithSemantic,
};
