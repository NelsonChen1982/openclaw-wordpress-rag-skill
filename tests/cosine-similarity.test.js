const test = require('node:test');
const assert = require('node:assert/strict');

const { cosineSimilarity } = require('../lib/semantic-search');

test('cosine: identical vectors => 1', () => {
  const sim = cosineSimilarity([1, 2, 3], [1, 2, 3]);
  assert.equal(sim, 1);
});

test('cosine: orthogonal vectors => 0', () => {
  const sim = cosineSimilarity([1, 0], [0, 1]);
  assert.equal(sim, 0);
});

test('cosine: opposite vectors => -1', () => {
  const sim = cosineSimilarity([1, 0, 0], [-1, 0, 0]);
  assert.equal(sim, -1);
});

test('cosine: empty vectors => 0', () => {
  const sim = cosineSimilarity([], []);
  assert.equal(sim, 0);
});

test('cosine: dimension mismatch => 0', () => {
  const sim = cosineSimilarity([1, 2, 3], [1, 2, 3, 4, 5]);
  assert.equal(sim, 0);
});

test('cosine: zero vectors => 0', () => {
  const sim = cosineSimilarity([0, 0, 0], [0, 0, 0]);
  assert.equal(sim, 0);
});
