// @ts-check
const { test, expect } = require('@playwright/test');
const { freshGame } = require('./helpers');

test('the question keeps an 18px rendered size regardless of legacy card scale state', async ({ page }) => {
  await freshGame(page, 'c', '/index.html');
  const sizes = await page.evaluate(() => {
    const wf = window.__wf;
    const box = document.getElementById('battleBox');
    const question = document.getElementById('qScen');
    const sample = (qscale, qzoom) => {
      Object.assign(wf.S.settings, { qscale, qzoom });
      wf.applySettings();
      const cssPx = parseFloat(getComputedStyle(question).fontSize);
      const zoom = parseFloat(getComputedStyle(box).zoom) || 1;
      return cssPx * zoom;
    };
    return [sample('s', .45), sample('m', 1), sample('x', 2)];
  });
  expect(sizes).toEqual([18, 18, 18]);
});

test('the production question uses the selected speech-stack hierarchy', async ({ page }) => {
  await freshGame(page, 'c', '/index.html');
  const order = await page.evaluate(() => {
    const box = document.getElementById('battleBox');
    const ids = [...box.querySelectorAll('[id]')].map(el => el.id);
    return ['qDomain', 'qScen', 'qOpts', 'qContext', 'ruleBar', 'bActions'].map(id => ids.indexOf(id));
  });
  expect(order.every(i => i >= 0)).toBe(true);
  expect(order).toEqual([...order].sort((a, b) => a - b));
});

test('knowledge-gate actions stay visible while long card content scrolls', async ({ page }) => {
  await freshGame(page, 'c', '/index.html');
  const controls = await page.evaluate(async () => {
    const wf = window.__wf;
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    wf.selectCombatAction('attack');
    for (let i = 0; i < wf.B.foes.length && wf.B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
    wf.onAnswer(wf.B.opts.findIndex(option => option.ok));
    const box = document.getElementById('battleBox');
    document.getElementById('rbRule').style.minHeight = '1200px';
    box.scrollTop = box.scrollHeight;
    await new Promise(resolve => requestAnimationFrame(resolve));
    const actions = document.getElementById('bActions');
    const style = getComputedStyle(actions), cardRect = box.getBoundingClientRect(), actionRect = actions.getBoundingClientRect();
    return {
      position: style.position,
      bottom: style.bottom,
      visible: actionRect.bottom <= cardRect.bottom + 1 && actionRect.top >= cardRect.top - 1,
    };
  });
  expect(controls).toEqual({ position: 'sticky', bottom: '0px', visible: true });
});

test('the question disappears outside knowledge gates and exposes no minimize control', async ({ page }) => {
  await freshGame(page, 'c', '/index.html');
  const out = await page.evaluate(() => {
    const wf = window.__wf, region = wf.DATA.regions[0];
    window.startBattle({ enemyKey: 'scopecreep', region, spawn: null, boss: false });
    const box = document.getElementById('battleBox'), min = document.getElementById('bMin');
    const before = box.classList.contains('hidden');
    wf.selectCombatAction('attack');
    for (let i = 0; i < wf.B.foes.length && wf.B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
    return { before, during: !box.classList.contains('hidden'), minimizeVisible: min.getClientRects().length > 0 };
  });
  expect(out).toEqual({ before: true, during: true, minimizeVisible: false });
});

test('a battle applies its region hue to the comic marks without a long region label', async ({ page }) => {
  await freshGame(page, 'c', '/index.html');
  const hue = await page.evaluate(() => {
    const wf = window.__wf;
    const region = wf.DATA.regions[0];
    window.startBattle({ enemyKey: 'scopecreep', region, spawn: null, boss: false });
    return {
      hue: document.getElementById('battleBox').style.getPropertyValue('--region-hue'),
      areaVisible: getComputedStyle(document.getElementById('qArea')).display !== 'none',
    };
  });
  expect(hue).toEqual({ hue: '36', areaVisible: false });
});
