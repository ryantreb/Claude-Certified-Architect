// @ts-check
/* The region briefing (story-driven lesson). Locks two guarantees:
   1. coverage — every concept the domain quizzes is also taught and doc-linked
   2. honesty  — rendering/reading the briefing moves no progress whatsoever */
const { test, expect } = require('@playwright/test');
const { loadGame } = require('./helpers');

test('Orchestration briefing teaches every domain-1 concept, each doc-linked', async ({ page }) => {
  await loadGame(page);
  const r = await page.evaluate(() => {
    const wf = window.__wf, D = wf.DATA;
    const L = D.lessons && D.lessons.c0;
    if (!L) return { ok: false, why: 'no c0 lesson defined' };
    const taught = new Set();
    L.movements.forEach(m => (m.concepts || []).forEach(c => taught.add(c)));
    const quizzed = Object.keys(wf.QIDX.c[0] || {});           // concepts the c0 battles actually ask
    const missing = quizzed.filter(c => !taught.has(c));        // any quizzed concept the lesson skips
    const undocumented = [...taught].filter(c => !(D.docs.c || {})[c]); // taught but no official doc link
    return { ok: true, moves: L.movements.length, quizzed, taught: [...taught], missing, undocumented };
  });
  expect(r.ok, r.why).toBeTruthy();
  expect(r.moves).toBe(4);
  expect(r.missing, 'every quizzed c0 concept must be taught').toEqual([]);
  expect(r.undocumented, 'every taught concept must link to its doc').toEqual([]);
});

test('the rendered briefing shows all four movements and resolves doc links', async ({ page }) => {
  await loadGame(page);
  const r = await page.evaluate(() => {
    const wf = window.__wf, L = wf.DATA.lessons.c0;
    const html = wf.lessonHtml(L, 'c');
    const headings = L.movements.filter(m => html.includes(m.h)).length;
    const docLinks = (html.match(/class='doclink'/g) || []).length;
    const officialHrefs = (html.match(/href='https:\/\/(code\.claude\.com|platform\.claude\.com|www\.anthropic\.com)/g) || []).length;
    return { headings, docLinks, officialHrefs };
  });
  expect(r.headings).toBe(4);
  expect(r.docLinks).toBeGreaterThanOrEqual(9); // one per taught concept
  expect(r.officialHrefs).toBeGreaterThanOrEqual(9);
});

test('reading the briefing grants no xp, level, or mastery (honesty)', async ({ page }) => {
  await loadGame(page);
  const r = await page.evaluate(() => {
    const wf = window.__wf;
    wf.S = wf.newState(); wf.S.started = true;
    const snap = () => JSON.stringify({ xp: wf.S.xp, level: wf.S.level, shards: wf.S.shards, sr: wf.S.sr, stats: wf.S.stats });
    const before = snap();
    wf.lessonHtml(wf.DATA.lessons.c0, 'c'); // the exact render the briefing performs
    return { before, after: snap() };
  });
  expect(r.after).toEqual(r.before);
});
