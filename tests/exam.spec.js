// @ts-check
/* Boss fights are practical examinations: every answer is logged to a ledger
   and graded by a pure script against the real pass mark (Loom 720/1000,
   Forge 700/1000). Hinted answers earn half; the grade reports readiness and
   writes NOTHING back into SM-2 state or meters. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('gradePractical scores like the certification: equal weights, hints at half, real pass marks', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const mk = (correct, hinted, dom = 0) => ({ concept: 'loop-control', dom, correct, hinted });
    // 8/10 clean -> 800/1000: a pass on both tracks
    const passC = wf.gradePractical(Array.from({ length: 10 }, (_, i) => mk(i < 8, false)), 'c');
    // 7/10 -> 700: fails the Loom (720) but passes the Forge (700)
    const edgeC = wf.gradePractical(Array.from({ length: 10 }, (_, i) => mk(i < 7, false)), 'c');
    const edgeG = wf.gradePractical(Array.from({ length: 10 }, (_, i) => mk(i < 7, false)), 'g');
    // hinted answers earn half: 10 hinted-correct -> 500
    const hinted = wf.gradePractical(Array.from({ length: 10 }, () => mk(true, true)), 'c');
    return { passC, edgeC, edgeG, hinted };
  });
  expect(out.passC.score).toBe(800);
  expect(out.passC.pass).toBe(true);
  expect(out.edgeC.score).toBe(700);
  expect(out.edgeC.pass).toBe(false);          // Loom marks at 720
  expect(out.edgeC.passMark).toBe(720);
  expect(out.edgeG.pass).toBe(true);           // Forge marks at 700
  expect(out.edgeG.passMark).toBe(700);
  expect(out.hinted.score).toBe(500);          // a hint is never full credit
});

test('a boss battle logs every answer to the exam ledger; skirmishes log nothing', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const region = wf.DATA.regions.find(r => r.cert === 'c' && r.boss);
    window.startBattle({ enemyKey: region.boss, region, spawn: null, boss: true });
    window.pickAction(0);
    window.onAnswer(wf.B.opts.findIndex(o => o.ok));
    const afterCorrect = wf.B.exam.length;
    const entry = wf.B.exam[0];
    // a plain skirmish carries no ledger
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    return { afterCorrect, entry, skirmishLedger: wf.B.exam };
  });
  expect(out.afterCorrect).toBe(1);
  expect(out.entry.correct).toBe(true);
  expect(typeof out.entry.concept).toBe('string');
  expect(out.skirmishLedger).toBeNull();
});

test('grading is pure reporting: SM-2 state and meters never move', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const srBefore = JSON.stringify(wf.S.sr);
    const meterBefore = wf.meterOf('c').total;
    wf.gradePractical([{ concept: 'loop-control', dom: 0, correct: true, hinted: false }], 'c');
    wf.practicalReportHtml([{ concept: 'loop-control', dom: 0, correct: false, hinted: false }], 'c');
    return {
      srSame: JSON.stringify(wf.S.sr) === srBefore,
      meterDelta: wf.meterOf('c').total - meterBefore,
    };
  });
  expect(out.srSame).toBe(true);
  expect(out.meterDelta).toBe(0);
});
