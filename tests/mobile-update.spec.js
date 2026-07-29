// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

/* A new build reaches the phone or iPad without manual cache surgery. Four
   cooperating behaviors:
     1. a resumed Home Screen app explicitly checks for a newer worker;
     2. the page reloads itself once when a new worker takes control
        (controllerchange), so the fresh shell runs immediately;
     3. activation purges every stale versioned cache;
     4. the warm pass completes and stamps the current build version.
   Physical-device propagation remains acceptance-checklist item #7. */

test.describe('mobile build update flow', () => {
  test('a resumed installed app checks for and adopts a newer shell', async ({ browser }) => {
    const mobileHtml = fs.readFileSync(path.join(__dirname, '..', 'mobile', 'index.html'), 'utf8');
    const mobileWorker = fs.readFileSync(path.join(__dirname, '..', 'mobile', 'sw.js'), 'utf8');
    const htmlFor = (version) => mobileHtml.replace(
      '<head>',
      `<head><meta id="served-build" data-version="${version}">`
    );
    const workerFor = (version) => mobileWorker.replace(
      /const VERSION = "[^"]+";/,
      `const VERSION = "${version}";`
    );
    let servedVersion = 'build-a';
    const server = http.createServer((req, res) => {
      const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
        res.end(htmlFor(servedVersion));
        return;
      }
      if (pathname === '/sw.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
        res.end(workerFor(servedVersion));
        return;
      }
      if (pathname === '/asset-manifest.json') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ version: servedVersion, assets: [] }));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('test server did not bind');
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`http://127.0.0.1:${address.port}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => { await navigator.serviceWorker.ready; });
      await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
      expect(await page.locator('#served-build').getAttribute('data-version')).toBe('build-a');

      servedVersion = 'build-b';
      // The production handler intentionally coalesces the visibility/pageshow/
      // focus burst emitted by iPadOS. Let the initial page-focus check leave
      // that throttle window before simulating a later app resume.
      await page.waitForTimeout(2100);
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('pageshow'));
        window.dispatchEvent(new Event('focus'));
      });

      await expect
        .poll(() => page.locator('#served-build').getAttribute('data-version'), { timeout: 8000 })
        .toBe('build-b');
    } finally {
      await context.close();
      await new Promise((resolve) => server.close(resolve));
    }
  });

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
      const stale = await caches.open('sigilbound-mobile-stale0000');
      await stale.put('/mobile/planted', new Response('old build leftovers'));
      const reg = await navigator.serviceWorker.ready;
      await reg.unregister();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });

    await expect
      .poll(async () => page.evaluate(() => caches.keys()), { timeout: 15000 })
      .not.toContain('sigilbound-mobile-stale0000');

    // the live cache is opened lazily by the first fetch the worker handles —
    // push one through, then the current build's cache must exist
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      await fetch('asset-manifest.json');
    });
    await expect
      .poll(async () =>
        page.evaluate(async () =>
          (await caches.keys()).some((k) => k.startsWith('sigilbound-mobile-'))
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
