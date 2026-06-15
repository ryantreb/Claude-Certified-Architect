# Weavefall — mobile / offline build

This folder is the slim build for phones, generated from the canonical
single-file `../index.html` by `../tools/build-mobile.py`. The base64 data URIs
in the source are extracted to real files under `assets/`, and a service worker
(`sw.js`) caches the whole app shell and every EA asset so the game keeps
running offline after the local dev server is suspended.

> Do not hand-edit `index.html`, `sw.js`, or `asset-manifest.json` here — they
> are generated. Edit the canonical `../index.html` and re-run
> `python3 tools/build-mobile.py` from the repo root.

## 🍎 Play offline on iPhone / iPad

The plan: run a tiny local server in **a-Shell**, open it once in Safari so the
service worker caches every asset, then it works offline forever (even after
a-Shell sleeps). You can also add it to your Home Screen for an app-like icon.

1. **Get this `mobile/` folder onto your phone.** On a computer, pull the
   branch, then AirDrop (or iCloud Drive) the `mobile` folder into the **Files**
   app under **On My iPhone → a-Shell** (that folder appears after step 2).
2. **Install a-Shell** (free, App Store). It ships with `python3`.
3. **Start the local server** in a-Shell:
   ```sh
   cd mobile
   python3 -m http.server 8753
   ```
   Keep a-Shell in the foreground for this first load.
4. **Warm the cache:** open **Safari → `http://localhost:8753`** and let the
   game fully load once (it pulls ~46 MB of art/audio into the offline cache).
5. **You're offline-capable.** Switch away from a-Shell, enable Airplane Mode,
   reload — the game still runs. Tap **Share → Add to Home Screen** for a
   tappable icon that launches offline.

### Notes
- The **first** load needs the server running (step 3). After it's cached you
  don't need a-Shell again — until you ship a new build, then repeat steps 3–4
  once to re-warm the cache.
- Private-repo shortcut: in a-Shell you can `lg2 clone <repo-url>` instead of
  AirDrop, but it prompts for a GitHub username + personal-access token, which is
  fiddlier than AirDrop.

## 🤖 Play offline on Android

1. Install **Termux** (from F-Droid).
2. ```sh
   pkg install git python
   git clone <repo-url> && cd <repo>/mobile
   python -m http.server 8753
   ```
3. Open **Chrome → `http://localhost:8753`**, let it load once to cache, then it
   works offline. Chrome can also "Add to Home screen".

## Rebuilding

From the repo root, after changing `index.html`:

```sh
python3 tools/build-mobile.py   # regenerates index.html, assets/, sw.js, asset-manifest.json
npx playwright test tests/mobile-offline.spec.js   # verifies the offline wiring
```
