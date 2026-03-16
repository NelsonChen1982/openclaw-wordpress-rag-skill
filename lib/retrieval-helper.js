const {
  getQueryEmbedding,
  semanticSearch,
  loadEmbeddings,
} = require('./semantic-search');
const { profileToText } = require('./text-builders');

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
  profileFieldMap,
  productEmbeddingItems = [],
  articleEmbeddingItems = [],
  productCandidates = [],
  articleCandidates = [],
  topKProducts = 10,
  topKArticles = 5,
  getQueryEmbeddingFn = getQueryEmbedding,
}) {
  const queryText = profileToText(profile || {}, profileFieldMap);
  const warnings = [];

  const hasProducts = productEmbeddingItems.length > 0;
  const hasArticles = articleEmbeddingItems.length > 0;

  if (!hasProducts && !hasArticles) {
    return {
      queryText,
      products: [],
      articles: [],
      skipped: true,
      warning: 'semantic scoring skipped: no embedding items available',
    };
  }

  const queryEmbedding = await getQueryEmbeddingFn(queryText);

  let productResults = [];
  if (hasProducts) {
    const productSpace = mergeEmbeddingWithCandidates(productEmbeddingItems, productCandidates);
    productResults = semanticSearch(queryEmbedding, productSpace, topKProducts);
  } else {
    warnings.push('product embeddings missing, product semantic scoring skipped');
  }

  let articleResults = [];
  if (hasArticles) {
    const articleSpace = mergeEmbeddingWithCandidates(articleEmbeddingItems, articleCandidates);
    articleResults = semanticSearch(queryEmbedding, articleSpace, topKArticles);
  } else {
    warnings.push('article embeddings missing, article semantic scoring skipped');
  }

  return {
    queryText,
    products: productResults,
    articles: articleResults,
    skipped: false,
    warning: warnings.length ? warnings.join('; ') : null,
  };
}

module.exports = {
  retrieveSemanticMatches,
  mergeEmbeddingWithCandidates,
  loadEmbeddingsSafe,
};
