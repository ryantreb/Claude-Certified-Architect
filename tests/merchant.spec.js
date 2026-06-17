// @ts-check
/* Kaiten's Quartermaster: study-earned lyrium shards buy tactical supplies.
   Buying spends shards and fills the pack — it NEVER moves SM-2 state or the
   pass meters (same honesty rule as loot drops). */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('buying a consumable spends shards and fills the pack — meters and SR never move', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.shards = 100;
    wf.S.consume.tonic = 0;
    const meterBefore = { c: wf.meterOf('c').total, g: wf.meterOf('g').total };
    const srBefore = JSON.stringify(wf.S.sr);
    const ok = wf.buyConsumable('tonic');
    const price = wf.MERCHANT.find(m => m.k === 'tonic').cost;
    return {
      ok,
      price,
      shards: wf.S.shards,
      tonic: wf.S.consume.tonic,
      meterDelta: (wf.meterOf('c').total - meterBefore.c) + (wf.meterOf('g').total - meterBefore.g),
      srUntouched: JSON.stringify(wf.S.sr) === srBefore,
    };
  });
  expect(out.ok).toBe(true);
  expect(out.shards).toBe(100 - out.price);   // shards spent
  expect(out.tonic).toBe(1);                  // pack filled
  expect(out.meterDelta).toBe(0);             // IMMUTABLE: meters never move
  expect(out.srUntouched).toBe(true);         // IMMUTABLE: SM-2 state never moves
});

test('the merchant refuses when shards are short and respects the stock cap', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const it = wf.MERCHANT.find(m => m.k === 'bomb');
    // too poor to buy
    wf.S.shards = it.cost - 1;
    wf.S.consume.bomb = 0;
    const poor = wf.buyConsumable('bomb');
    const shardsAfterPoor = wf.S.shards;
    // rich, but pack already full -> refused, no spend
    wf.S.shards = 999;
    wf.S.consume.bomb = it.cap;
    const full = wf.buyConsumable('bomb');
    return { poor, shardsAfterPoor, poorCost: it.cost - 1, full, shardsAfterFull: wf.S.shards, cap: it.cap, held: wf.S.consume.bomb };
  });
  expect(out.poor).toBe(false);
  expect(out.shardsAfterPoor).toBe(out.poorCost);   // refused: nothing spent
  expect(out.full).toBe(false);
  expect(out.shardsAfterFull).toBe(999);            // refused at cap: nothing spent
  expect(out.held).toBe(out.cap);                   // never exceeds the cap
});
