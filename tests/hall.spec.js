// @ts-check
/* The Creation Hall: legends as champions with original stats, centered
   portraits, the earned drink (consumables spend a recall-bought action),
   the labeled streak chip, and the question-card size setting. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('legends join the roster with their original stat rows on the d20', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const names = wf.LEGEND_CHOICES.map(c => c.rig);
    wf.S.hero = { rig: 'heroWar', cls: 'vanguard' };
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const baseAtk = wf.atkBonusOf(wf.B.party[0]);
    const baseMax = wf.B.party[0].max;
    window.endBattleUI();
    wf.S.hero = { rig: 'beirus', cls: 'vanguard' };
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const beirusAtk = wf.atkBonusOf(wf.B.party[0]);
    const beirusMax = wf.B.party[0].max;
    return { names, baseAtk, baseMax, beirusAtk, beirusMax,
      rec: wf.legendRec(), name: wf.B.party[0].name };
  });
  expect(out.names).toEqual(['beirus', 'shale', 'ogre', 'tianne', 'werewolf', 'soleil', 'desire', 'dragon']);
  expect(out.rec).toEqual({ atk: 50, df: 55, agi: 31, hp: 20 });   // Beirus's CHARCLASS row
  expect(out.beirusAtk).toBe(out.baseAtk + 4);                     // +round(50/12)
  expect(out.beirusMax).toBe(out.baseMax + 3);                     // +round((20-12)/2.5)
  expect(out.name).toBe('Beirus');
});

test('a poultice is earned: refused before a correct answer, spends the action after', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const srBefore = JSON.stringify(wf.S.sr);
    wf.S.consume.tonic = 2; wf.S.consume.draught = 2;
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    wf.useTonic();                                  // intro/ask phase: refused
    const refusedTonic = wf.S.consume.tonic === 2;
    wf.useDraught();
    const refusedDraught = wf.S.consume.draught === 2;
    wf.B.phase = 'pick';                            // the action a recall bought
    wf.B.party[0].halves = 2;
    wf.useTonic();
    const spent = wf.S.consume.tonic === 1;
    const healed = wf.B.party[0].halves === 5;
    const actionConsumed = wf.B.phase === 'fb';
    return { refusedTonic, refusedDraught, spent, healed, actionConsumed,
      srSame: JSON.stringify(wf.S.sr) === srBefore };
  });
  expect(out.refusedTonic).toBe(true);
  expect(out.refusedDraught).toBe(true);
  expect(out.spent).toBe(true);
  expect(out.healed).toBe(true);
  expect(out.actionConsumed).toBe(true);
  expect(out.srSame).toBe(true);
});

test('the streak chip names itself and the card resizes', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    const chip = document.getElementById('comboChip').textContent;
    const title = document.getElementById('comboChip').title;
    wf.S.settings.qscale = 'x'; wf.applySettings();
    const zx = document.getElementById('battleBox').style.zoom;
    wf.S.settings.qscale = 's'; wf.applySettings();
    const zs = document.getElementById('battleBox').style.zoom;
    return { chip, title, zx, zs };
  });
  expect(out.chip).toContain('streak ×');
  expect(out.title).toContain('tactical damage only');
  expect(parseFloat(out.zx)).toBeCloseTo(1.35);
  expect(parseFloat(out.zs)).toBeCloseTo(0.85);
});

test('the hero screen portraits resolve sharp, not thumbnail-sized', async ({ page }) => {
  await freshGame(page, 'c');
  const keys = ['heroWar', 'heroRog', 'heroMag', 'heroArc', 'werewolf', 'desire'];
  await page.waitForFunction((ks) => {
    const E = window.__wf.EARIG;
    return ks.every(k => E[k] && E[k].portrait && E[k].portrait.complete && E[k].portrait.naturalWidth > 0);
  }, keys, { timeout: 20000 });
  const out = await page.evaluate(async (ks) => {
    const wf = window.__wf;
    const sizes = {};
    for (const k of ks) {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.onerror = r; img.src = wf.portraitSquare(k); });
      sizes[k] = img.naturalWidth;
    }
    return sizes;
  }, keys);
  for (const k of keys) expect(out[k], k).toBeGreaterThanOrEqual(96);
});

test('portraits crop to content and land centered on a square', async ({ page }) => {
  await freshGame(page, 'c');
  await page.waitForFunction(() => {
    const E = window.__wf.EARIG;
    return E.heroWar && E.heroWar.portrait && E.heroWar.portrait.complete && E.heroWar.portrait.naturalWidth > 0;
  }, null, { timeout: 15000 });
  const out = await page.evaluate(async () => {
    const wf = window.__wf;
    const url = wf.portraitSquare('heroWar');
    if (!url.startsWith('data:image/png')) return { square: false, url: url.slice(0, 30) };
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = url; });
    return { square: img.naturalWidth === img.naturalHeight, w: img.naturalWidth };
  });
  expect(out.square).toBe(true);
  expect(out.w).toBeGreaterThan(10);
});
