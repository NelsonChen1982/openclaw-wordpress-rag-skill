const test = require('node:test');
const assert = require('node:assert/strict');

const { semanticSearch } = require('../lib/semantic-search');
const {
  mergeEmbeddingWithCandidates,
  retrieveSemanticMatches,
} = require('../lib/retrieval-helper');

test('semanticSearch smoke: returns topK with descending similarity and required fields', () => {
  const query = [1, 0, 0, 0];
  const candidates = [
    { id: 'a', name: 'A', embedding: [1, 0, 0, 0] },
    { id: 'b', name: 'B', embedding: [0.8, 0.2, 0, 0] },
    { id: 'c', name: 'C', embedding: [0, 1, 0, 0] },
    { id: 'd', name: 'D', embedding: [-1, 0, 0, 0] },
    { id: 'e', name: 'E', embedding: [0.4, 0.1, 0, 0] },
  ];

  const out = semanticSearch(query, candidates, 3);
  assert.equal(out.length, 3);
  assert.ok(out[0].similarity >= out[1].similarity);
  assert.ok(out[1].similarity >= out[2].similarity);

  for (const row of out) {
    assert.ok(row.id);
    assert.ok(row.name);
    assert.equal(typeof row.similarity, 'number');
  }
});

test('mergeEmbeddingWithCandidates: returns only intersection ids', () => {
  const embeddingItems = [
    { id: 'p1', embedding: [1, 0, 0, 0] },
    { id: 'p2', embedding: [0, 1, 0, 0] },
    { id: 'p3', embedding: [0, 0, 1, 0] },
  ];

  const candidates = [
    { id: 'p2', name: 'Two' },
    { id: 'p3', name: 'Three' },
    { id: 'p4', name: 'Four' },
  ];

  const out = mergeEmbeddingWithCandidates(embeddingItems, candidates);
  assert.equal(out.length, 2);
  assert.deepEqual(out.map(x => x.id).sort(), ['p2', 'p3']);
});

test('retrieveSemanticMatches fallback: both embedding groups empty => skipped=true', async () => {
  const out = await retrieveSemanticMatches({
    profile: { body: 'light' },
    productEmbeddingItems: [],
    articleEmbeddingItems: [],
    productCandidates: [{ id: 'p1', name: 'P1' }],
    articleCandidates: [{ id: 'a1', title: 'A1' }],
  });

  assert.equal(out.skipped, true);
  assert.equal(out.products.length, 0);
  assert.equal(out.articles.length, 0);
});

test('retrieveSemanticMatches fallback: product empty, article available => products empty, articles present', async () => {
  const out = await retrieveSemanticMatches({
    profile: { body: 'light' },
    productEmbeddingItems: [],
    articleEmbeddingItems: [
      { id: 'a1', embedding: [1, 0, 0, 0] },
      { id: 'a2', embedding: [0, 1, 0, 0] },
    ],
    productCandidates: [{ id: 'p1', name: 'P1' }],
    articleCandidates: [
      { id: 'a1', title: 'A1' },
      { id: 'a2', title: 'A2' },
    ],
    getQueryEmbeddingFn: async () => [1, 0, 0, 0],
    topKArticles: 2,
  });

  assert.equal(out.skipped, false);
  assert.equal(out.products.length, 0);
  assert.ok(out.articles.length > 0);
});
