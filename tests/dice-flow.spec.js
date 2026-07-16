// @ts-check
/* Production combat contract: choose an action, choose its target, answer the
   region-driven question, read feedback, then resolve. Optional d20 rolls are
   earned by correct answers and are disabled by default. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

async function startBattle(page, enemyKey = 'parsewraith', regionIdx = 0, boss = false) {
  await page.evaluate(({ enemyKey, regionIdx, boss }) => {
    const wf = window.__wf;
    window.startBattle({ enemyKey, region: wf.DATA.regions[regionIdx], spawn: null, boss });
  }, { enemyKey, regionIdx, boss });
}

async function answerAttack(page, correct, rollsEnabled = false) {
  return page.evaluate(({ correct, rollsEnabled }) => {
    const wf = window.__wf;
    wf.S.settings.d20Combat = rollsEnabled;
    wf.selectCombatAction('attack');
    let target = 0;
    for (; target < wf.B.foes.length && wf.B.phase === 'target'; target++) wf.chooseCombatTarget('foe', target);
    target = wf.B.target;
    const before = wf.B.foes[target].halves;
    wf.onAnswer(wf.B.opts.findIndex(option => option.ok === correct));
    return { before, target, afterAnswer: wf.B.foes[target].halves, phase: wf.B.phase };
  }, { correct, rollsEnabled });
}

test('wrong knowledge denies the selected attack until Continue, then misses without damage', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const gated = await answerAttack(page, false);
  expect(gated.phase).toBe('fb');
  expect(gated.afterAnswer).toBe(gated.before);
  const resolved = await page.evaluate(() => {
    const wf = window.__wf;
    wf.onContinueResolve();
    return { hp: wf.B.foes[wf.B.target].halves, phase: wf.B.phase, seq: wf.B.fx.seq.kind };
  });
  expect(resolved.hp).toBe(gated.before);
  expect(resolved.phase).toBe('resolve');
  expect(resolved.seq).toBe('fizzle');
});

test('correct knowledge resolves an attack deterministically when d20 combat is off', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const gated = await answerAttack(page, true);
  expect(gated.afterAnswer).toBe(gated.before);
  const resolved = await page.evaluate(() => {
    const wf = window.__wf;
    wf.onContinueResolve();
    return { hp: wf.B.foes[wf.B.target].halves, phase: wf.B.phase, seq: wf.B.fx.seq.kind };
  });
  expect(resolved.hp).toBeLessThan(gated.before);
  expect(resolved.phase).toBe('resolve');
  expect(resolved.seq).not.toBe('fizzle');
});

test('correct knowledge earns the external d20 when enabled; the roll decides hit or miss', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const gated = await answerAttack(page, true, true);
  const crit = await page.evaluate(() => {
    const wf = window.__wf;
    wf.onContinueResolve();
    const phase = wf.B.phase;
    wf.resolveRoll(20);
    return { phase, hp: wf.B.foes[wf.B.target].halves, after: wf.B.phase };
  });
  expect(crit.phase).toBe('roll');
  expect(crit.hp).toBeLessThan(gated.before);
  expect(crit.after).toBe('resolve');

  await startBattle(page);
  const missGate = await answerAttack(page, true, true);
  const miss = await page.evaluate(() => {
    const wf = window.__wf;
    wf.onContinueResolve();
    wf.resolveRoll(1);
    return wf.B.foes[wf.B.target].halves;
  });
  expect(miss).toBe(missGate.before);
});

test('defense callout precedes its question and wrong knowledge lets the enemy hit only after Continue', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const announced = await page.evaluate(() => {
    const wf = window.__wf;
    wf.startDefense();
    return { phase: wf.B.phase, text: document.getElementById('combatThreat').textContent };
  });
  expect(announced.phase).toBe('threat');
  expect(announced.text).toContain('Defend ');
  await page.waitForTimeout(5100);
  const gated = await page.evaluate(() => {
    const wf = window.__wf, victim = wf.B.party[wf.B.defMember];
    const before = victim.halves;
    wf.onAnswer(wf.B.opts.findIndex(option => !option.ok));
    const afterAnswer = victim.halves;
    wf.onContinueResolve();
    return { before, afterAnswer, afterResolve: victim.halves };
  });
  expect(gated.afterAnswer).toBe(gated.before);
  expect(gated.afterResolve).toBeLessThan(gated.before);
});

test('guard and threat still come from the original CHARCLASS medians', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf, stats = wf.DATA.eaStats;
    wf.B = null;
    const mk = shape => ({ e: { shape } });
    return {
      ogreDef: stats.ogre.def,
      zombieDef: stats.zombie.def,
      gOgre: wf.foeGuard(mk('ogre')),
      gZombie: wf.foeGuard(mk('zombie')),
      tOgre: wf.foeThreat(mk('ogre')),
      tZombie: wf.foeThreat(mk('zombie')),
    };
  });
  expect(out.ogreDef).toBe(58);
  expect(out.zombieDef).toBe(17);
  expect(out.gOgre).toBeGreaterThan(out.gZombie);
  expect(out.tOgre).toBeGreaterThan(out.tZombie);
});
