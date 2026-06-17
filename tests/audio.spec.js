// @ts-check
/* The original soundscape: every audio.swf sample and the original music
   loops ride in DATA verbatim; Music follows the screen. Presentation only. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('the original sound library and music loops are aboard, verbatim data URIs', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const snd = wf.DATA.eaSnd, mus = wf.DATA.eaMusic;
    const keys = Object.keys(snd);
    return {
      n: keys.length,
      allMp3: keys.every(k => snd[k].startsWith('data:audio/mpeg;base64,')),
      music: Object.keys(mus).sort(),
      hasCore: ['Slash', 'Victory', 'Defeated', 'level_up', 'ArcaneBolt', 'Heartbeat'].every(k => !!snd[k]),
    };
  });
  expect(out.n).toBeGreaterThanOrEqual(200);
  expect(out.allMp3).toBe(true);
  expect(out.music).toEqual(['castle', 'combat', 'deeproads', 'party', 'quest']);
  expect(out.hasCore).toBe(true);
});

test('the music follows the screen: combat in battle, castle in the keep, quest on the road', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.settings.music = true;
    wf.MODE = 'battle'; wf.Music.sync(); const inBattle = wf.Music.cur;
    wf.MODE = 'keep';   wf.Music.sync(); const inKeep = wf.Music.cur;
    wf.MODE = 'world';  wf.Music.sync(); const onRoad = wf.Music.cur;
    wf.S.settings.music = false; wf.Music.sync();   // mute path must not throw
    return { inBattle, inKeep, onRoad };
  });
  expect(out.inBattle).toBe('combat');
  expect(out.inKeep).toBe('castle');
  expect(out.onRoad).toBe('quest');
});

test('voice barks fire through battle without touching SM-2 state', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    const srBefore = JSON.stringify(wf.S.sr);
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    wf.heroBark('atk'); wf.heroBark('pain'); wf.heroBark('death');
    return { srSame: JSON.stringify(wf.S.sr) === srBefore };
  });
  expect(out.srSame).toBe(true);
});
