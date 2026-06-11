// @ts-check
/* Commit 5 — telegraphed AoE sweeps with a free dodge.
   A foe winds up a sweep at the front or back LINE. Repositioning out of that
   line is free (does not consume the round's formation move and never costs a
   recall); the counterattack riposte still requires a correct answer. A correct
   riposte turns the whole sweep aside; a wrong one lands it on whoever stayed. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

async function startBattle(page, enemyKey = 'parsewraith', regionIdx = 0) {
  await page.evaluate(({ ek, ri }) => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: ek, region: wf.DATA.regions[ri], spawn: null, boss: false });
  }, { ek: enemyKey, ri: regionIdx });
}

/* force a telegraphed sweep at a known column and return to a clean dodge phase */
async function forceTelegraph(page, col) {
  await page.evaluate((c) => {
    const wf = window.__wf, B = wf.B;
    B.round = 2;                               // a mid-fight round so sweeps are allowed
    const attacker = B.foes.find(f => f.halves > 0);
    B.defFoe = B.foes.indexOf(attacker);
    wf.telegraphAoE(attacker);
    B.aoe.col = c;                             // pin the threatened line for the test
    wf.showDodge();
  }, col);
}

test('a telegraphed sweep enters a dodge phase that threatens one line', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await forceTelegraph(page, 0);
  const out = await page.evaluate(() => ({
    phase: window.__wf.B.phase,
    aoeCol: window.__wf.B.aoe.col,
    free: window.__wf.B.moved === false,       // the dodge reposition is free
  }));
  expect(out.phase).toBe('dodge');
  expect(out.aoeCol).toBe(0);
  expect(out.free).toBe(true);
});

test('dodging the whole line then a WRONG riposte costs no HP', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await forceTelegraph(page, 0);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    // move every living unit OFF the threatened front line (col 0) to the back (col 1)
    B.party.forEach((m, i) => { if (m.halves > 0 && m.cell.col === 0) m.cell = { col: 1, row: i }; });
    const hpBefore = B.party.reduce((s, m) => s + m.halves, 0);
    const threatened = wf.aoeThreatened().length;
    // brace + answer WRONG
    B.phase = 'q'; window.serveQuestion();
    const wrongI = B.opts.findIndex(o => !o.ok);
    window.onAnswer(wrongI);
    const hpAfter = B.party.reduce((s, m) => s + m.halves, 0);
    return { threatened, hpBefore, hpAfter, aoeCleared: B.aoe === null };
  });
  expect(out.threatened).toBe(0);              // nobody left in the path
  expect(out.hpAfter).toBe(out.hpBefore);      // free dodge => no damage even on a wrong riposte
  expect(out.aoeCleared).toBe(true);
});

test('staying in the line and a WRONG riposte lets the sweep land', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await forceTelegraph(page, 0);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    // force at least one unit INTO the threatened line
    B.party[0].cell = { col: 0, row: 1 };
    const hpBefore = B.party.reduce((s, m) => s + m.halves, 0);
    const threatened = wf.aoeThreatened().length;
    B.phase = 'q'; window.serveQuestion();
    const wrongI = B.opts.findIndex(o => !o.ok);
    window.onAnswer(wrongI);
    const hpAfter = B.party.reduce((s, m) => s + m.halves, 0);
    return { threatened, dmg: hpBefore - hpAfter };
  });
  expect(out.threatened).toBeGreaterThan(0);
  expect(out.dmg).toBeGreaterThan(0);          // the sweep landed on whoever stayed
});

test('a correct riposte turns the sweep aside for the whole line', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await forceTelegraph(page, 0);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    B.party[0].cell = { col: 0, row: 1 };       // someone is in the path
    const hpBefore = B.party.reduce((s, m) => s + m.halves, 0);
    B.phase = 'q'; window.serveQuestion();
    const rightI = B.opts.findIndex(o => o.ok);
    window.onAnswer(rightI);
    const hpAfter = B.party.reduce((s, m) => s + m.halves, 0);
    return { dmg: hpBefore - hpAfter, aoeCleared: B.aoe === null };
  });
  expect(out.dmg).toBe(0);                      // riposte protected everyone
  expect(out.aoeCleared).toBe(true);
});
