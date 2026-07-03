// @ts-check
const { test, expect } = require('@playwright/test');

/* Slice 5 of the iPhone plan: a new build reaches the phone on the next open
   with no manual cache surgery. Three cooperating behaviors:
     1. the page reloads itself once when a new worker takes control
        (controllerchange), so the fresh shell runs immediately;
     2. activation purges every stale versioned cache;
     3. the warm pass completes and stamps the current build version.
   Full build-A→build-B propagation on the real phone is checklist #16. */

test.describe('mobile build update flow', () => {
  test('the page ships the one-shot reload on a new worker taking over', async ({ request }) => {
    const html = await (await request.get('/mobile/index.html')).text();
    expect(html).toContain('controllerchange');
    // guarded: only reloads when a previous controller existed, so the very
    // first install can never reload-loop
    expect(html).toMatch(/controllerchange[\s\S]{0,200}location\.reload/);
  });

  test('activation purges stale versioned caches, keeps the live one', async ({ page }) => {
    await page.goto('/mobile/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });

    // plant a stale build's cache, then force a fresh install+activate cycle
    await page.evaluate(async () => {
      const stale = await caches.open('weavefall-mobile-stale0000');
      await stale.put('/mobile/planted', new Response('old build leftovers'));
      const reg = await navigator.serviceWorker.ready;
      await reg.unregister();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });

    await expect
      .poll(async () => page.evaluate(() => caches.keys()), { timeout: 15000 })
      .not.toContain('weavefall-mobile-stale0000');

    // the live cache is opened lazily by the first fetch the worker handles —
    // push one through, then the current build's cache must exist
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      await fetch('asset-manifest.json');
    });
    await expect
      .poll(async () =>
        page.evaluate(async () =>
          (await caches.keys()).some((k) => k.startsWith('weavefall-mobile-'))
        ), { timeout: 15000 })
      .toBe(true);
  });

  test('the warm pass completes and stamps the current build version', async ({ page }) => {
    test.slow(); // pulls every asset once through the worker
    await page.goto('/mobile/index.html', { waitUntil: 'load' });
    const version = await page.evaluate(async () =>
      (await (await fetch('asset-manifest.json', { cache: 'no-store' })).json()).version
    );
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('wf-warmed')), { timeout: 150000 })
      .toBe(version);
  });
});
