#!/usr/bin/env node
require('dotenv').config();

const OpenAI = require('openai');

const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const apiKey = process.env.OPENAI_API_KEY;

async function main() {
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found. Add it to .env or environment variables.');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const input = '清爽果香、適合夏天、預算 2000 以下';

  const res = await client.embeddings.create({
    model,
    input,
  });

  const embedding = res?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    console.error('❌ Embedding response invalid.');
    process.exit(1);
  }

  console.log('✅ OpenAI embedding connectivity OK');
  console.log(`model=${model}`);
  console.log(`dimensions=${embedding.length}`);
  if (res.usage?.total_tokens !== undefined) {
    console.log(`total_tokens=${res.usage.total_tokens}`);
  }
}

main().catch((err) => {
  console.error('❌ Connectivity test failed');
  console.error(err?.message || err);
  process.exit(1);
});
