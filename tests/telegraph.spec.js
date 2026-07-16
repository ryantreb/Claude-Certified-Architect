// @ts-check
/* Sweeps use the same production defense contract as single-target attacks:
   threat first, knowledge feedback second, battlefield resolution last. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

async function startBattle(page) {
  await page.evaluate(() => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: 'parsewraith', region: wf.DATA.regions[0], spawn: null, boss: false });
  });
}

async function forceSweepQuestion(page, rollsEnabled, clearLine = false) {
  await page.evaluate(({ rollsEnabled, clearLine }) => {
    const wf = window.__wf, B = wf.B, attacker = B.foes.find(f => f.halves > 0);
    B.turn = 'defend'; B.defFoe = B.foes.indexOf(attacker); B.defMember = 0;
    B.aoe = { col: 0, dmg: Math.max(1, B.foeDmg), foe: B.defFoe, foeName: attacker.e.name };
    if (clearLine) B.party.forEach((m, i) => { if (m.halves > 0) m.cell = { col: 1, row: i }; });
    else B.party[0].cell = { col: 0, row: 0 };
    B.intent = { type: 'defend', member: B.defMember, target: { side: 'party', index: B.defMember }, rollsEnabled, move: 'Overrun' };
    B.phase = 'q'; window.serveQuestion();
  }, { rollsEnabled, clearLine });
}

test('a wrong sweep answer changes no HP until Continue, then hits everyone still in the line', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await forceSweepQuestion(page, false);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    const hp = () => B.party.reduce((sum, member) => sum + member.halves, 0);
    const before = hp();
    wf.onAnswer(B.opts.findIndex(option => !option.ok));
    const afterAnswer = hp();
    wf.onContinueResolve();
    return { before, afterAnswer, afterResolve: hp(), aoeCleared: B.aoe === null };
  });
  expect(out.afterAnswer).toBe(out.before);
  expect(out.afterResolve).toBeLessThan(out.before);
  expect(out.aoeCleared).toBe(true);
});

test('a cleared line makes a failed sweep harmless and still clears the telegraph', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await forceSweepQuestion(page, false, true);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    const before = B.party.reduce((sum, member) => sum + member.halves, 0);
    wf.onAnswer(B.opts.findIndex(option => !option.ok));
    wf.onContinueResolve();
    return { before, after: B.party.reduce((sum, member) => sum + member.halves, 0), aoeCleared: B.aoe === null };
  });
  expect(out.after).toBe(out.before);
  expect(out.aoeCleared).toBe(true);
});

test('correct knowledge turns the sweep automatically when optional rolls are off', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await forceSweepQuestion(page, false);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    const before = B.party.reduce((sum, member) => sum + member.halves, 0);
    wf.onAnswer(B.opts.findIndex(option => option.ok));
    wf.onContinueResolve();
    return { before, after: B.party.reduce((sum, member) => sum + member.halves, 0), aoeCleared: B.aoe === null };
  });
  expect(out.after).toBe(out.before);
  expect(out.aoeCleared).toBe(true);
});

test('with optional rolls on, correct knowledge earns the external guard roll', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await forceSweepQuestion(page, true);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    wf.onAnswer(B.opts.findIndex(option => option.ok));
    wf.onContinueResolve();
    const phase = B.phase;
    wf.resolveRoll(20);
    return { phase, aoeCleared: B.aoe === null };
  });
  expect(out.phase).toBe('roll');
  expect(out.aoeCleared).toBe(true);
});
