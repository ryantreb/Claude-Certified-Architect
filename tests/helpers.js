// @ts-check
/* Shared helpers for Weavefall tests.
   The game is non-module <script> blocks, so its `let`/`const` globals are NOT
   window properties. index.html exposes a gameplay-inert `window.__wf` bridge
   with live getters/setters; the tests drive the pure spaced-repetition / combat
   logic through it rather than through the canvas. */

const { expect } = require('@playwright/test');

/** The phone the mobile build targets. Hand-rolled rather than Playwright's
    devices[] descriptor: that descriptor pins defaultBrowserType to webkit,
    which would silently switch the browser out from under the chromium project. */
const IPHONE_13_PRO_MAX = {
  viewport: { width: 428, height: 926 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) ' +
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
};

/** Load the game and wait until boot() has populated the bridge. */
async function loadGame(page, path = '/index.html') {
  await page.goto(path);
  await page.waitForFunction(() => !!window.__wf && !!window.__wf.S);
}

/** Reset to a clean, started game on the given track ('c' = Loom, 'g' = Forge). */
async function freshGame(page, track = 'c', path = '/index.html') {
  await loadGame(page, path);
  await page.evaluate((tk) => {
    try { localStorage.clear(); } catch (e) {}
    const wf = window.__wf;
    wf.S = wf.newState();
    wf.S.track = tk;
    wf.S.started = true;
    wf.S.session = wf.freshSession();
  }, track);
}

/** A concept key that exists on the track, with its domain index. */
async function aConcept(page, track = 'c') {
  return page.evaluate((tk) => {
    const wf = window.__wf;
    const c = wf.ALLCONCEPTS[tk][0];
    return { concept: c, dom: wf.CONCEPT_DOM[tk][c] };
  }, track);
}

/** Drive a concept all the way to "mastered" by forcing each recall to be due.
    Mirrors what the engine does, but collapses the weave-day timers for the test. */
async function forceMaster(page, track, concept) {
  return page.evaluate(({ tk, c }) => {
    const wf = window.__wf;
    const key = wf.srKey(tk, c);
    for (let i = 0; i < 6; i++) {
      if (wf.S.sr[key]) wf.S.sr[key].due = 0;   // make it due now
      wf.srAnswer(tk, c, true, false);          // a real (non-hinted) recall
      if (wf.srState(key) === 'mastered') break;
    }
    return { state: wf.srState(key), reps: wf.S.sr[key].reps, iv: wf.S.sr[key].iv };
  }, { tk: track, c: concept });
}

/** Rig art demand-loads (a rig starts fetching the first time a draw path asks
    for it). Tests that inspect rig frames or portraits must ask first, exactly
    like the game does: wake the rigs, then wait until frame 0 is drawable. */
async function wakeRigs(page, keys, timeout = 20000) {
  await page.evaluate((ks) => ks.forEach((k) => window.__wf.wakeRig(k)), keys);
  await page.waitForFunction((ks) => ks.every((k) => {
    const r = window.__wf.EARIG[k];
    const f = r && r.anims.idle && r.anims.idle[0];
    return f && f.complete && f.naturalWidth > 0 &&
      (!r.portrait || (r.portrait.complete && r.portrait.naturalWidth > 0));
  }), keys, { timeout });
}

module.exports = { loadGame, freshGame, aConcept, forceMaster, wakeRigs, IPHONE_13_PRO_MAX, expect };
