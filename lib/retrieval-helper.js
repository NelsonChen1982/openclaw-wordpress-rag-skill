const {
  profileToText,
  getQueryEmbedding,
  semanticSearch,
  loadEmbeddings,
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

function loadEmbeddingsSafe(baseDir) {
  try {
    const loaded = loadEmbeddings(baseDir);
    return {
      ok: true,
      products: loaded.products?.items || [],
      articles: loaded.articles?.items || [],
      warning: null,
    };
  } catch (err) {
    return {
      ok: false,
      products: [],
      articles: [],
      warning: `semantic embeddings unavailable: ${err.message}`,
    };
  }
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
  if (!productEmbeddingItems.length || !articleEmbeddingItems.length) {
    return {
      queryText: profileToText(profile || {}),
      products: [],
      articles: [],
      skipped: true,
      warning: 'semantic scoring skipped: embedding items missing',
    };
  }

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
    skipped: false,
    warning: null,
  };
}

module.exports = {
  retrieveSemanticMatches,
  mergeEmbeddingWithCandidates,
  loadEmbeddingsSafe,
};
