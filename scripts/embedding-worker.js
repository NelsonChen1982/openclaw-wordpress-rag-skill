#!/usr/bin/env node
/**
 * OpenClaw-integrated background embedding worker.
 *
 * Runs the full pipeline: fetch source → validate → build embeddings.
 * Reports result back to OpenClaw Gateway via webhook when done.
 *
 * If OPENCLAW_GATEWAY_URL is not set, runs in standalone mode
 * (same as running each npm script manually).
 *
 * Usage:
 *   node scripts/embedding-worker.js           # full pipeline
 *   node scripts/embedding-worker.js --skip-fetch  # skip fetch, only rebuild embeddings
 */
require('dotenv').config();

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');

// --- OpenClaw defaults ---
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789/hooks';
const OPENCLAW_HOOK_TOKEN = process.env.OPENCLAW_HOOK_TOKEN || '';
const OPENCLAW_HOOK_NAME = process.env.OPENCLAW_HOOK_NAME || 'embedding-done';
const NOTIFY_OPENCLAW = !!OPENCLAW_HOOK_TOKEN; // only notify if token is set

const SKIP_FETCH = process.argv.includes('--skip-fetch');

// --- Helpers ---

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}\n${stderr}`));
      }
    });

    child.on('error', reject);
  });
}

function notifyOpenClaw(payload) {
  if (!NOTIFY_OPENCLAW) {
    console.log('[worker] No OPENCLAW_HOOK_TOKEN set, skipping notification');
    return Promise.resolve();
  }

  const url = `${OPENCLAW_GATEWAY_URL}/${OPENCLAW_HOOK_NAME}`;
  const body = JSON.stringify(payload);
  const parsed = new URL(url);
  const transport = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openclaw-token': OPENCLAW_HOOK_TOKEN,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[worker] OpenClaw notified (${res.statusCode})`);
          resolve(data);
        } else {
          console.warn(`[worker] OpenClaw notification failed (${res.statusCode}): ${data}`);
          // Don't reject - notification failure shouldn't fail the whole pipeline
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      console.warn(`[worker] OpenClaw notification error: ${err.message}`);
      // Don't reject - same reason
      resolve();
    });

    req.write(body);
    req.end();
  });
}

// --- Main pipeline ---

async function main() {
  const startedAt = Date.now();
  const results = { steps: [], success: false };

  console.log('='.repeat(60));
  console.log('[worker] OpenClaw Embedding Worker started');
  console.log(`[worker] Mode: ${SKIP_FETCH ? 'rebuild only' : 'full pipeline'}`);
  console.log(`[worker] OpenClaw notify: ${NOTIFY_OPENCLAW ? 'enabled' : 'disabled (no token)'}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch source data
    if (!SKIP_FETCH) {
      console.log('\n[worker] Step 1/3: Fetching source data...');
      const fetchResult = await runScript('scripts/fetch-source-data.js');
      results.steps.push({ step: 'fetch', status: 'ok', output: fetchResult.stdout.trim() });
    } else {
      console.log('\n[worker] Step 1/3: Skipped (--skip-fetch)');
      results.steps.push({ step: 'fetch', status: 'skipped' });
    }

    // Step 2: Validate source data
    console.log('\n[worker] Step 2/3: Validating source data...');
    const validateResult = await runScript('scripts/validate-source.js');
    results.steps.push({ step: 'validate', status: 'ok', output: validateResult.stdout.trim() });

    // Step 3: Build embeddings
    console.log('\n[worker] Step 3/3: Building embeddings...');
    const buildResult = await runScript('scripts/generate-embeddings.js');
    results.steps.push({ step: 'build', status: 'ok', output: buildResult.stdout.trim() });

    results.success = true;
  } catch (err) {
    results.steps.push({ step: 'error', status: 'failed', message: err.message });
    console.error(`\n[worker] Pipeline failed: ${err.message}`);
  }

  const elapsedMs = Date.now() - startedAt;
  results.elapsedMs = elapsedMs;
  results.elapsedHuman = formatElapsed(elapsedMs);

  console.log('\n' + '='.repeat(60));
  console.log(`[worker] ${results.success ? '✅ Pipeline complete' : '❌ Pipeline failed'}`);
  console.log(`[worker] Total time: ${results.elapsedHuman}`);
  console.log('='.repeat(60));

  // Notify OpenClaw
  await notifyOpenClaw({
    message: results.success
      ? `Embedding pipeline complete (${results.elapsedHuman}). ${getLastStepSummary(results)}`
      : `Embedding pipeline failed: ${getFailureReason(results)}`,
    name: 'EmbeddingWorker',
    payload: results,
    wakeMode: 'now',
  });
}

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m${rem}s`;
}

function getLastStepSummary(results) {
  const buildStep = results.steps.find(s => s.step === 'build' && s.status === 'ok');
  return buildStep ? buildStep.output.split('\n').pop() : '';
}

function getFailureReason(results) {
  const failed = results.steps.find(s => s.status === 'failed');
  return failed ? failed.message.split('\n')[0] : 'unknown error';
}

main().catch(err => {
  console.error('[worker] Unhandled error:', err);
  process.exit(1);
});
