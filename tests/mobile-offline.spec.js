// @ts-check
const { test, expect } = require('@playwright/test');

/* The phone-only path: the slim mobile build is served by a local dev server
   (a-Shell on iOS) that the OS suspends once you switch to Safari, so ~50MB of
   EA art can't finish streaming. build-mobile.py ships a service worker that
   caches every asset on first fetch and a page hook that warms that cache, so
   the game survives the server going to sleep. These tests lock that wiring.
   Playwright serves the repo root, so /mobile/* is reachable, and 127.0.0.1 is
   a secure context, which is what the worker needs to register. */

test.describe('mobile offline cache (phone-only path)', () => {
  test('serves the worker and a non-empty asset manifest', async ({ request }) => {
    const sw = await request.get('/mobile/sw.js');
    expect(sw.status()).toBe(200);

    const man = await request.get('/mobile/asset-manifest.json');
    expect(man.status()).toBe(200);
    const json = await man.json();
    expect(typeof json.version).toBe('string');
    expect(Array.isArray(json.assets)).toBe(true);
    expect(json.assets.length).toBeGreaterThan(100);

    // the worker is keyed to the same build version as the manifest
    expect(await sw.text()).toContain(json.version);
  });

  test('registers a worker that caches an asset for offline use', async ({ page }) => {
    await page.goto('/mobile/index.html', { waitUntil: 'domcontentloaded' });

    // wait for the worker to install + activate (skipWaiting + clients.claim)
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });

    // reload so the page is controlled by the now-active worker
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);

    // an asset fetched through the worker should land in a versioned cache —
    // that durable copy is what lets the map paint after the server sleeps
    const cached = await page.evaluate(async () => {
      const { assets } = await (await fetch('asset-manifest.json', { cache: 'no-store' })).json();
      const url = assets[0];
      await fetch(url);
      for (let i = 0; i < 20; i++) {
        for (const k of await caches.keys()) {
          if (await (await caches.open(k)).match(url)) return true;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(cached).toBe(true);
  });
});
