// @ts-check
/* The original guild companions (CHARACTER_GUILDNPCS.xml): join by play
   milestones, ride beside the study companions, sharpen the d20 only. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('the original roster is aboard with stats, warcries and portraits', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const C = wf.DATA.eaComp;
    return {
      n: C.length,
      names: C.map(c => c.name),
      portraits: C.every(c => c.port && c.port.startsWith('data:image/webp')),
      famous: ['Hawke', 'Isabela', 'Morrigan', 'Shale', 'Barkspawn', 'Fire Drake'].every(n => C.some(c => c.name === n)),
      shale: C.find(c => c.name === 'Shale'),
    };
  });
  expect(out.n).toBe(20);
  expect(out.portraits).toBe(true);
  expect(out.famous).toBe(true);
  expect(out.shale.df).toBe(25);                  // original Defense, verbatim
  expect(out.shale.warcry).toBe('Death to all pigeons!');
});

test('companions join by deeds: levels, bosses, streaks — never by viewing', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const tovez = wf.DATA.eaComp.find(c => c.name === 'Tovez');     // joins at level 5
    const janara = wf.DATA.eaComp.find(c => c.name === 'Janara');   // joins on first boss
    const before = { tovez: wf.eaCompJoined(tovez), janara: wf.eaCompJoined(janara), roster: wf.eaCompRoster().length };
    wf.S.level = 5;
    const r0 = wf.trackRegions('c')[0];
    wf.regState(r0.id).boss = true;
    const after = { tovez: wf.eaCompJoined(tovez), janara: wf.eaCompJoined(janara) };
    return { before, after };
  });
  expect(out.before.tovez).toBe(false);
  expect(out.before.janara).toBe(false);
  expect(out.before.roster).toBe(0);
  expect(out.after.tovez).toBe(true);
  expect(out.after.janara).toBe(true);
});

test('an original companion rides into the party and sharpens the d20 only', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const srBefore = JSON.stringify(wf.S.sr);
    const meterBefore = wf.meterOf('c').total;
    wf.S.level = 5;                                  // Tovez joins (atk 22, df 13)
    wf.S.activeComp = { c: ['NPC_TOVEZ'], g: [] };
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const tovez = wf.B.party.find(m => m.id === 'NPC_TOVEZ');
    const plain = { kind: 'comp', id: 'comp_c0', cls: 'vanguard' };
    return {
      riding: !!tovez, cls: tovez && tovez.cls,
      hitBonus: wf.atkBonusOf(tovez) - wf.atkBonusOf(plain),     // 22/12 ≈ +2
      guardBonus: wf.guardBonusOf(tovez) - wf.guardBonusOf(plain), // 13/12 ≈ +1
      srSame: JSON.stringify(wf.S.sr) === srBefore,
      meterDelta: wf.meterOf('c').total - meterBefore,
    };
  });
  expect(out.riding).toBe(true);
  expect(out.cls).toBe('vanguard');
  expect(out.hitBonus).toBe(2);
  expect(out.guardBonus).toBe(1);
  expect(out.srSame).toBe(true);
  expect(out.meterDelta).toBe(0);
});
