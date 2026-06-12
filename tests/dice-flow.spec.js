// @ts-check
/* The new action economy: answer FIRST, then choose the strike, then the d20.
   - A wrong answer is a critical failure: no strike menu, no roll, no damage.
   - A correct answer arms the strike menu; specials need deep recall.
   - The d20 decides whether the armed strike (or earned guard) holds; a broken
     die never staggers and never touches mastery — knowledge held.
   Guard/threat derive from the original CHARCLASS Defense/Agility/Attack. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

async function startBattle(page, enemyKey = 'parsewraith', regionIdx = 0, boss = false) {
  await page.evaluate(({ ek, ri, bs }) => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: ek, region: wf.DATA.regions[ri], spawn: null, boss: bs });
  }, { ek: enemyKey, ri: regionIdx, bs: boss });
}

test('wrong answer = critical failure: no strike menu, no roll, foes untouched', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    const foeHp = B.foes.reduce((s, f) => s + f.halves, 0);
    window.pickAction(0);
    const mi = B.actions[0].mi;
    window.onAnswer(B.opts.findIndex(o => !o.ok));
    return {
      phase: B.phase,                            // straight to feedback — never "pick" or "roll"
      foeDmg: foeHp - B.foes.reduce((s, f) => s + f.halves, 0),
      rollArmed: !!B.roll,
      skPicked: !!(B.sel && B.sel.sk),
      staggerStamp: B.party[mi].staggerRound | 0,
    };
  });
  expect(out.phase).toBe('fb');
  expect(out.foeDmg).toBe(0);
  expect(out.rollArmed).toBe(false);
  expect(out.skPicked).toBe(false);
  expect(out.staggerStamp).toBeGreaterThan(0);   // the failed recall benches the unit
});

test('correct answer arms the strike menu; standard recall locks specials', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    wf.S.level = 10;                             // every skill tier unlocked
    window.showActions();
    const std = B.actions.findIndex(a => a.depth === 'std');
    window.pickAction(std);
    window.onAnswer(B.opts.findIndex(o => o.ok));
    const locked = B.strikes.filter(s => s.locked).map(s => s.sk.n);
    const open = B.strikes.filter(s => !s.locked && !s.sk.bomb).map(s => s.sk.n);
    return { phase: B.phase, locked, open,
      anySpecialLocked: B.strikes.some(s => s.locked && wf.skillIsSpecial(s.sk)) };
  });
  expect(out.phase).toBe('pick');                // answer first, THEN the strike choice
  expect(out.open.length).toBeGreaterThan(0);    // basics armed
  expect(out.anySpecialLocked).toBe(true);       // specials demand deep recall
});

test('deep recall serves a six-choice draw with exactly one truth and no hint', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    wf.S.level = 10;
    window.showActions();
    const deep = B.actions.findIndex(a => a.depth === 'deep');
    window.pickAction(deep);
    const hintHidden = document.getElementById('btnHint').classList.contains('hidden');
    window.onAnswer(B.opts.findIndex(o => o.ok));
    const specialsOpen = B.strikes.some(s => !s.locked && wf.skillIsSpecial(s.sk));
    return { n: B.opts.length, oks: B.opts.filter(o => o.ok).length, hintHidden, specialsOpen };
  });
  expect(out.n).toBeGreaterThanOrEqual(4);
  expect(out.n).toBeLessThanOrEqual(6);
  expect(out.oks).toBe(1);
  expect(out.hintHidden).toBe(true);             // a special cannot be hinted into
  expect(out.specialsOpen).toBe(true);
});

test('the d20 decides the armed strike: a 20 crits, a low die misses without stagger', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  // crit on a natural 20
  const crit = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    window.pickAction(0);
    const mi = B.actions[0].mi;
    window.onAnswer(B.opts.findIndex(o => o.ok));
    window.chooseStrike(0);
    const phase = B.phase;
    const foeHp = B.foes.reduce((s, f) => s + f.halves, 0);
    window.resolveRoll(20);
    return { phase, mi, dmg: foeHp - B.foes.reduce((s, f) => s + f.halves, 0), after: B.phase };
  });
  expect(crit.phase).toBe('roll');               // strike chosen -> the die is armed
  expect(crit.dmg).toBeGreaterThan(0);
  expect(crit.after).toBe('fb');
  // a fresh battle; a 2 (total 6) is under every guard floor (8) -> clean miss
  await startBattle(page);
  const miss = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    window.pickAction(0);
    const mi = B.actions[0].mi;
    window.onAnswer(B.opts.findIndex(o => o.ok));
    window.chooseStrike(0);
    const foeHp = B.foes.reduce((s, f) => s + f.halves, 0);
    window.resolveRoll(2);
    return {
      dmg: foeHp - B.foes.reduce((s, f) => s + f.halves, 0),
      staggerStamp: B.party[mi].staggerRound | 0,
    };
  });
  expect(miss.dmg).toBe(0);
  expect(miss.staggerStamp).toBe(0);             // a missed die is not a failed recall
});

test('defense: a correct answer earns the guard roll; the die decides the blow', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const out = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    window.startDefense();                       // round 0 -> never a telegraphed sweep
    const phaseQ = B.phase;
    window.onAnswer(B.opts.findIndex(o => o.ok));
    const phaseRoll = B.phase;
    const victim = B.party[B.defMember];
    const hpBefore = victim.halves;
    window.resolveRoll(20);                      // perfect parry
    const held = victim.halves === hpBefore;
    return { phaseQ, phaseRoll, held };
  });
  expect(out.phaseQ).toBe('q');
  expect(out.phaseRoll).toBe('roll');
  expect(out.held).toBe(true);
  // and a broken guard die lets the blow land
  await startBattle(page);
  const lands = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    window.startDefense();
    window.onAnswer(B.opts.findIndex(o => o.ok));
    const victim = B.party[B.defMember];
    const hpBefore = victim.halves;
    window.resolveRoll(1);                       // a 1 always fails (and bites deeper)
    return { dmg: hpBefore - victim.halves, staggered: (victim.staggerRound | 0) > 0 };
  });
  expect(lands.dmg).toBeGreaterThan(0);
  expect(lands.staggered).toBe(false);           // knowledge held — no stagger from dice
});

test('guard and threat come from the original CHARCLASS medians', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf, t = wf.DATA.eaStats;
    wf.B = null;                                 // no boss bump
    const mk = shape => ({ e: { shape } });
    return {
      ogreDef: t.ogre.def, zombieDef: t.zombie.def, bansheeAgi: t.banshee.agi,
      gOgre: wf.foeGuard(mk('ogre')), gZombie: wf.foeGuard(mk('zombie')),
      tOgre: wf.foeThreat(mk('ogre')), tZombie: wf.foeThreat(mk('zombie')),
    };
  });
  expect(out.ogreDef).toBe(58);                  // straight from CHARCLASS
  expect(out.zombieDef).toBe(17);
  expect(out.bansheeAgi).toBe(104);
  expect(out.gOgre).toBeGreaterThan(out.gZombie);     // tougher hide, higher guard
  expect(out.tOgre).toBeGreaterThan(out.tZombie);     // heavier arm, higher threat
  expect(out.gOgre).toBeLessThanOrEqual(15);
  expect(out.tOgre).toBeLessThanOrEqual(16);
});

test('boss battles run on exam recall: every action deep, six choices, hints off', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const region = wf.DATA.regions.find(r => r.cert === 'c' && r.boss);
    window.startBattle({ enemyKey: region.boss, region, spawn: null, boss: true });
    const B = wf.B;
    const depths = B.actions.map(a => a.depth);
    window.pickAction(0);
    const hintHidden = document.getElementById('btnHint').classList.contains('hidden');
    return { depths, n: B.opts.length, hintHidden };
  });
  expect(out.depths.every(d => d === 'deep')).toBe(true);
  expect(out.n).toBeGreaterThanOrEqual(4);
  expect(out.hintHidden).toBe(true);
});
