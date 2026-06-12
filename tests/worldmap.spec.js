// @ts-check
/* The original overworld: DMMapScreenSWF parchment + WORLD_REGIONS.xml graph.
   The map is a lens over region/road state — it unlocks nothing by itself. */
const { test } = require('@playwright/test');
const { freshGame, expect } = require('./helpers');

test('the original world graph is aboard with its places and art', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    return {
      ids: wf.DATA.eaWorld.map(w => w.id).sort(),
      castle: wf.DATA.eaWorld.find(w => w.id === 'Castle'),
      art: ['bg', 'node', 'castle'].every(k => wf.DATA.eaWorldMap[k] && wf.DATA.eaWorldMap[k].d.startsWith('data:image/webp')),
      bgSize: [wf.DATA.eaWorldMap.bg.w, wf.DATA.eaWorldMap.bg.h],
    };
  });
  expect(out.ids).toEqual(['Castle', 'R_GD', 'R_KW', 'R_OR', 'R_PF', 'R_PP', 'R_T', 'R_WC', 'R_WS']);
  expect(out.castle.conn).toEqual(['R_T', 'R_PP', 'R_GD']);
  expect(out.art).toBe(true);
  expect(out.bgSize).toEqual([767, 615]);
});

test('the map binds study regions to original places and honors locks', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.settings.music = false; wf.S.settings.sound = false;
    wf.S.keepLvl = 1;                      // tier-2/3 regions stay sealed
    wf.MODE = 'world';
    wf.openWorldMap();
    const nodes = [...document.querySelectorAll('#mapNodes .mapNode')].map(n => ({
      id: n.dataset.map, locked: n.classList.contains('locked'),
    }));
    const mode = wf.MODE;
    const placeOfFirst = wf.mapPlaceOf(wf.DATA.regions.find(r => r.cert === 'c').id);
    wf.closeWorldMap();
    return { nodes, mode, placeOfFirst: placeOfFirst && placeOfFirst.id, after: wf.MODE };
  });
  expect(out.mode).toBe('map');
  expect(out.after).toBe('world');
  expect(out.placeOfFirst).toBe('R_T');
  const castle = out.nodes.find(n => n.id === 'Castle');
  expect(castle.locked).toBe(false);
  const sealed = out.nodes.filter(n => n.locked);
  expect(sealed.length).toBeGreaterThan(0);   // tier-gated regions + the trial
  // opening and closing the map changed no progression state
});

test('the map unlocks nothing: regions and SM-2 are untouched by viewing', async ({ page }) => {
  await freshGame(page, 'c');
  const out = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.settings.music = false; wf.S.settings.sound = false;
    const before = JSON.stringify([wf.S.sr, wf.S.regions, wf.S.keepLvl]);
    wf.MODE = 'world';
    wf.openWorldMap(); wf.closeWorldMap();
    return { same: JSON.stringify([wf.S.sr, wf.S.regions, wf.S.keepLvl]) === before };
  });
  expect(out.same).toBe(true);
});
