const {
  profileToText,
  getQueryEmbedding,
  semanticSearch,
} = require('./semantic-search');

function indexById(items = []) {
  const m = new Map();
  for (const it of items) m.set(String(it.id), it);
  return m;
}

function mergeEmbeddingWithCandidates(embeddingItems = [], candidates = []) {
  const candidateMap = indexById(candidates);
  return embeddingItems
    .map(e => {
      const c = candidateMap.get(String(e.id));
      if (!c) return null;
      return {
        id: c.id,
        name: c.name || c.title || '',
        embedding: e.embedding,
        metadata: {
          source: c,
        },
      };
    })
    .filter(Boolean);
}

async function retrieveSemanticMatches({
  profile,
  productEmbeddingItems = [],
  articleEmbeddingItems = [],
  productCandidates = [],
  articleCandidates = [],
  topKProducts = 10,
  topKArticles = 5,
}) {
  const queryText = profileToText(profile || {});
  const queryEmbedding = await getQueryEmbedding(queryText);

  const productSpace = mergeEmbeddingWithCandidates(productEmbeddingItems, productCandidates);
  const articleSpace = mergeEmbeddingWithCandidates(articleEmbeddingItems, articleCandidates);

  const productResults = semanticSearch(queryEmbedding, productSpace, topKProducts);
  const articleResults = semanticSearch(queryEmbedding, articleSpace, topKArticles);

  return {
    queryText,
    products: productResults,
    articles: articleResults,
  };
}

module.exports = {
  retrieveSemanticMatches,
  mergeEmbeddingWithCandidates,
};
