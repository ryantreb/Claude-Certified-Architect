// @ts-check
const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/* Slice 8 of the iPhone plan: the save endpoint honors its contract
   (docs/save-endpoint.md). This exercises the real server process directly —
   GET-before-PUT emptiness, PUT/GET round-trip, and the failure codes. */

const PORT = 8981;
const URL = `http://127.0.0.1:${PORT}/save`;

/** @type {import('child_process').ChildProcess} */
let server;
let saveFile;

test.beforeAll(async () => {
  saveFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'wf-save-')), 'save.json');
  server = spawn('python3', ['tools/save-server.py', saveFile, String(PORT)], {
    cwd: path.join(__dirname, '..'),
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try { await fetch(URL); return; } catch (e) { await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error('save-server never came up');
});

test.afterAll(() => { server.kill(); });

test('GET before any PUT yields the documented empty response', async () => {
  const res = await fetch(URL);
  expect(res.status).toBe(204);
});

test('PUT then GET round-trips the blob byte-for-byte', async () => {
  const blob = { v: 1, savedAt: 1780000000000, sr: { 'c|loop-control': { reps: 3, ease: 2.5, iv: 21 } } };
  const put = await fetch(URL, { method: 'PUT', body: JSON.stringify(blob) });
  expect(put.status).toBe(204);

  const got = await fetch(URL);
  expect(got.status).toBe(200);
  expect(got.headers.get('content-type')).toBe('application/json');
  expect(await got.json()).toEqual(blob);
});

test('rejects malformed JSON and unknown paths per the contract', async () => {
  const bad = await fetch(URL, { method: 'PUT', body: 'not json{{{' });
  expect(bad.status).toBe(400);

  const lost = await fetch(`http://127.0.0.1:${PORT}/other`);
  expect(lost.status).toBe(404);

  // the malformed PUT must not have clobbered the stored save
  const still = await fetch(URL);
  expect(still.status).toBe(200);
});
