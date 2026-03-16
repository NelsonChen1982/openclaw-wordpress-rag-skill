function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function validateProduct(item, idx) {
  const errors = [];
  if (!isObject(item)) return [`products[${idx}] must be an object`];
  if (!item.id) errors.push(`products[${idx}].id is required`);
  if (!item.name) errors.push(`products[${idx}].name is required`);
  if (item.types && !Array.isArray(item.types)) errors.push(`products[${idx}].types must be array`);
  if (item.brewery && !Array.isArray(item.brewery)) errors.push(`products[${idx}].brewery must be array`);
  if (item.meta && !isObject(item.meta)) errors.push(`products[${idx}].meta must be object`);
  return errors;
}

function validateArticle(item, idx) {
  const errors = [];
  if (!isObject(item)) return [`articles[${idx}] must be an object`];
  if (!item.id) errors.push(`articles[${idx}].id is required`);
  if (!item.title) errors.push(`articles[${idx}].title is required`);
  if (item.keyInsights && !Array.isArray(item.keyInsights)) errors.push(`articles[${idx}].keyInsights must be array`);
  if (item.tagBlock && !isObject(item.tagBlock)) errors.push(`articles[${idx}].tagBlock must be object`);
  return errors;
}

function validateSourceData(products, articles) {
  const errors = [];
  if (!Array.isArray(products)) errors.push('product-meta.json must be an array');
  if (!Array.isArray(articles)) errors.push('article-insights.json must be an array');

  if (Array.isArray(products)) {
    products.forEach((p, i) => errors.push(...validateProduct(p, i)));
  }
  if (Array.isArray(articles)) {
    articles.forEach((a, i) => errors.push(...validateArticle(a, i)));
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      products: Array.isArray(products) ? products.length : 0,
      articles: Array.isArray(articles) ? articles.length : 0,
    },
  };
}

module.exports = {
  validateSourceData,
};
