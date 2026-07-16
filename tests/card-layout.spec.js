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

test('the production card uses the question-first hierarchy selected in prototype B', async ({ page }) => {
  await freshGame(page, 'c', '/index.html');
  const order = await page.evaluate(() => {
    const box = document.getElementById('battleBox');
    const ids = [...box.querySelectorAll('[id]')].map(el => el.id);
    return ['qDomain', 'qScen', 'qOpts', 'qContext', 'bHead'].map(id => ids.indexOf(id));
  });
  expect(order.every(i => i >= 0)).toBe(true);
  expect(order).toEqual([...order].sort((a, b) => a - b));
});

test('a battle applies its region hue to the card rail', async ({ page }) => {
  await freshGame(page, 'c', '/index.html');
  const hue = await page.evaluate(() => {
    const wf = window.__wf;
    const region = wf.DATA.regions[0];
    window.startBattle({ enemyKey: 'scopecreep', region, spawn: null, boss: false });
    return document.getElementById('battleBox').style.getPropertyValue('--region-hue');
  });
  expect(hue).toBe('36');
});
