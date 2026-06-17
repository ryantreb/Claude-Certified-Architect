// @ts-check
/* Commit 4 — stagger + glancing.
   A wrong answer benches the acting unit for its next round (the same failure
   that resets the concept's reps). A hinted-but-correct answer still lands, but
   as a glancing half-damage hit that earns zero mastery. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

/* start a real battle so the engine wires up B, the party, and the question */
async function startBattle(page, enemyKey = 'parsewraith', regionIdx = 0) {
  await page.evaluate(({ ek, ri }) => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: ek, region: wf.DATA.regions[ri], spawn: null, boss: false });
  }, { ek: enemyKey, ri: regionIdx });
}

test('a wrong attack answer staggers the acting unit for the next round only', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const res = await page.evaluate(() => {
    const wf = window.__wf;
    window.pickAction(0);                       // first available skill
    const mi = wf.B.actions[0].mi;
    const round = wf.B.round;
    const wrongI = wf.B.opts.findIndex(o => !o.ok);
    window.onAnswer(wrongI);
    const m = wf.B.party[mi];
    const stamp = m.staggerRound;
    // simulate arriving at the next player round
    wf.B.round = round + 1;
    const staggeredNext = wf.memberStaggered(m);
    wf.B.round = round + 2;
    const clearedAfter = wf.memberStaggered(m);
    return { stamp, expected: round + 1, staggeredNext, clearedAfter };
  });
  expect(res.stamp).toBe(res.expected);
  expect(res.staggeredNext).toBe(true);
  expect(res.clearedAfter).toBe(false);
});

test('when every living unit is staggered, no attack actions are offered', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.consume.bomb = 0;                       // remove the item out so only units could act
    wf.B.round = 1;                              // a normal mid-fight round (engine never stamps round 0)
    wf.B.party.forEach(m => { if (m.halves > 0) m.staggerRound = 1; });  // staggered THIS round
    window.showActions();
    return { actions: wf.B.actions.length };
  });
  expect(out.actions).toBe(0);                   // soft-lock guard => a "hold the line" pass is shown instead
});

test('a glancing (hinted) hit deals half damage', async ({ page }) => {
  await freshGame(page, 'c');
  // unmastered concept, no super-effective: base 4 -> glancing floor(4*0.5) = 2
  const { concept } = await page.evaluate(() => {
    const wf = window.__wf;
    wf.B = { region: { dom: 0, cert: 'c' }, cert: 'c', q: null, qCert: 'c' };
    return { concept: wf.ALLCONCEPTS.c[0] };
  });
  const full = await page.evaluate((c) => window.__wf.attackDamage(4, 'c', c, {}), concept);
  const glancing = await page.evaluate((c) => window.__wf.attackDamage(4, 'c', c, { hinted: true }), concept);
  expect(full).toBe(4);
  expect(glancing).toBe(2);
});

test('a glancing hit earns zero mastery credit (hinted path)', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf, c = wf.ALLCONCEPTS.c[0], key = wf.srKey('c', c);
    wf.S.sr[key] = undefined;
    const res = wf.srAnswer('c', c, true, true);   // correct but hinted
    return { kind: res.kind, reps: wf.S.sr[key].reps, score: wf.conceptScore(key) };
  });
  expect(out.kind).toBe('hinted');
  expect(out.reps).toBe(0);
  expect(out.score).toBe(0);
});
