// @ts-check
/* Failure and hint invariants under the action-first combat flow. A wrong
   answer fails the selected action without inventing a second, hidden action
   penalty. Hints affect learning credit only. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

/* start a real battle so the engine wires up B, the party, and the question */
async function startBattle(page, enemyKey = 'parsewraith', regionIdx = 0) {
  await page.evaluate(({ ek, ri }) => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: ek, region: wf.DATA.regions[ri], spawn: null, boss: false });
  }, { ek: enemyKey, ri: regionIdx });
}

test('a wrong attack answer fails the intent without benching the active combatant', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const res = await page.evaluate(() => {
    const wf = window.__wf;
    wf.selectCombatAction('attack');
    for (let i = 0; i < wf.B.foes.length && wf.B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
    const m = wf.B.party[wf.B.active], before = wf.B.foes[wf.B.target].halves;
    wf.onAnswer(wf.B.opts.findIndex(o => !o.ok));
    wf.onContinueResolve();
    return { staggered: wf.memberStaggered(m), foeHp: wf.B.foes[wf.B.target].halves, before };
  });
  expect(res.staggered).toBe(false);
  expect(res.foeHp).toBe(res.before);
});

test('changing the active combatant is free before choosing an intent', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const next = wf.B.party.findIndex((m, i) => i > 0 && m.halves > 0);
    const changed = next >= 0 ? wf.setActiveCombatant(next) : true;
    return { changed, phase: wf.B.phase, active: wf.B.active, expected: next >= 0 ? next : 0 };
  });
  expect(out.changed).toBe(true);
  expect(out.phase).toBe('act');
  expect(out.active).toBe(out.expected);
});

test('a hinted correct hit deals full tactical damage', async ({ page }) => {
  await freshGame(page, 'c');
  // unmastered concept, no super-effective: base 4 stays 4 even with a hint
  const { concept } = await page.evaluate(() => {
    const wf = window.__wf;
    wf.B = { region: { dom: 0, cert: 'c' }, cert: 'c', q: null, qCert: 'c' };
    return { concept: wf.ALLCONCEPTS.c[0] };
  });
  const full = await page.evaluate((c) => window.__wf.attackDamage(4, 'c', c, {}), concept);
  const hinted = await page.evaluate((c) => window.__wf.attackDamage(4, 'c', c, { hinted: true }), concept);
  expect(full).toBe(4);
  expect(hinted).toBe(4);
});

test('a hinted correct answer earns zero mastery credit', async ({ page }) => {
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
