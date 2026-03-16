const test = require('node:test');
const assert = require('node:assert/strict');

const { profileToText } = require('../lib/text-builders');

test('profileToText: default fieldMap includes body and budget labels', () => {
  const out = profileToText({ body: 'full', budget: 'high' });
  assert.match(out, /body: full/);
  assert.match(out, /budget: high/);
});

test('profileToText: custom fieldMap uses custom label', () => {
  const out = profileToText({ sweetness: 'high' }, { sweetness: '甘口偏好' });
  assert.match(out, /甘口偏好: high/);
});

test('profileToText: array fields include all values', () => {
  const out = profileToText({ flavorNotes: ['citrus', 'floral'] });
  assert.match(out, /citrus/);
  assert.match(out, /floral/);
});

test('profileToText: empty profile returns empty string', () => {
  const out = profileToText({});
  assert.equal(out, '');
});

test('profileToText: extra keys not in fieldMap are preserved', () => {
  const out = profileToText(
    { body: 'light', customSignal: 'weekend-mode' },
    { body: 'body' }
  );
  assert.match(out, /body: light/);
  assert.match(out, /customSignal: weekend-mode/);
});
