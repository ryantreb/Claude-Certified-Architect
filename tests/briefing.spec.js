// @ts-check
/* The region briefings (story-driven lessons in DATA.lessons). Locks three guarantees,
   data-driven across every region that has a briefing:
   1. completeness — every expected region has a briefing
   2. coverage    — every concept a domain quizzes is also taught and doc-linked
   3. honesty     — rendering/reading a briefing moves no progress whatsoever */
const { test, expect } = require('@playwright/test');
const { loadGame } = require('./helpers');

// region briefing keys are cert+dom; x0r (the overlap finale) has no domain lesson.
const EXPECTED = ['c0', 'c1', 'c2', 'c3', 'c4', 'g0', 'g1', 'g2', 'g3', 'g4', 'g5'];

test('every region has a briefing that teaches and doc-links its quizzed concepts', async ({ page }) => {
  await loadGame(page);
  const r = await page.evaluate((EXPECTED) => {
    const wf = window.__wf, D = wf.DATA;
    const out = {};
    for (const key of EXPECTED) {
      const L = (D.lessons || {})[key];
      if (!L) { out[key] = { missing: true }; continue; }
      const cert = key[0], dom = +key.slice(1);
      const taught = new Set();
      L.movements.forEach(m => (m.concepts || []).forEach(c => taught.add(c)));
      const quizzed = Object.keys((wf.QIDX[cert] || {})[dom] || {});        // concepts the domain's battles ask
      const untaught = quizzed.filter(c => !taught.has(c));                  // quizzed but the lesson skips
      const undocumented = [...taught].filter(c => !(D.docs[cert] || {})[c]); // taught but no official doc link
      out[key] = { moves: L.movements.length, untaught, undocumented };
    }
    return out;
  }, EXPECTED);
  for (const key of EXPECTED) {
    expect(r[key].missing, `region ${key} must have a briefing`).toBeFalsy();
    expect(r[key].moves, `${key} needs at least 3 movements`).toBeGreaterThanOrEqual(3);
    expect(r[key].untaught, `${key}: every quizzed concept must be taught`).toEqual([]);
    expect(r[key].undocumented, `${key}: every taught concept must link to its doc`).toEqual([]);
  }
});

test('every rendered briefing shows its movements and resolves official doc links', async ({ page }) => {
  await loadGame(page);
  const r = await page.evaluate((EXPECTED) => {
    const wf = window.__wf;
    const out = {};
    for (const key of EXPECTED) {
      const L = wf.DATA.lessons[key];
      const html = wf.lessonHtml(L, key[0]);
      const taught = new Set();
      L.movements.forEach(m => (m.concepts || []).forEach(c => taught.add(c)));
      const headings = L.movements.filter(m => html.includes(m.h)).length;
      const docLinks = (html.match(/class='doclink'/g) || []).length;
      const officialHrefs = (html.match(/href='https:\/\/(code\.claude\.com|platform\.claude\.com|www\.anthropic\.com|docs\.github\.com)/g) || []).length;
      out[key] = { headings, moves: L.movements.length, docLinks, officialHrefs, taught: taught.size };
    }
    return out;
  }, EXPECTED);
  for (const key of EXPECTED) {
    expect(r[key].headings, `${key}: all movement headings render`).toBe(r[key].moves);
    expect(r[key].docLinks, `${key}: one doc link per taught concept`).toBe(r[key].taught);
    expect(r[key].officialHrefs, `${key}: every doc link points at an official source`).toBe(r[key].taught);
  }
});

test('reading any briefing grants no xp, level, or mastery (honesty)', async ({ page }) => {
  await loadGame(page);
  const r = await page.evaluate((EXPECTED) => {
    const wf = window.__wf;
    wf.S = wf.newState(); wf.S.started = true;
    const snap = () => JSON.stringify({ xp: wf.S.xp, level: wf.S.level, shards: wf.S.shards, sr: wf.S.sr, stats: wf.S.stats });
    const before = snap();
    for (const key of EXPECTED) wf.lessonHtml(wf.DATA.lessons[key], key[0]); // the exact render the briefing performs
    return { before, after: snap() };
  }, EXPECTED);
  expect(r.after).toEqual(r.before);
});
