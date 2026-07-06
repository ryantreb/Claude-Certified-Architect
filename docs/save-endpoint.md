# Save endpoint contract

The cross-device save is one opaque JSON blob behind two verbs, served by
`tools/save-server.py` on the tailnet host next to the static game. This file
is the canonical contract; the client (Slice 9, #14) and any stub in a
Playwright spec must match it exactly.

## Routes

| Verb | Path | Success | Failures |
| --- | --- | --- | --- |
| `GET` | `/save` | `200` + the stored blob (`application/json`) — or `204` with no body before any save exists | `404` any other path |
| `PUT` | `/save` | `204`, blob replaced | `400` malformed JSON · `413` over 1 MiB · `404` any other path |

No auth, no users, no versioned history: the endpoint is reachable only inside
the owner's tailnet (the server binds loopback; `tailscale serve` fronts it).
Writes are atomic — a crash mid-write never corrupts the stored save.

## Blob envelope

The endpoint treats the blob as opaque; the *client* writes this shape:

```json
{
  "v": 1,
  "savedAt": 1780000000000,
  "sr": { "<srKey>": { "reps": 3, "ease": 2.5, "iv": 21, "due": 1780000000, "seen": 1779000000 } }
}
```

- `v` — envelope version, bumped only on breaking shape changes.
- `savedAt` — client clock at push, milliseconds. Diagnostic only; merge
  decisions use per-concept recency, never this field.
- `sr` — the spaced-repetition map, exactly as the game stores it. The merge
  rules (Slice 10, #15) operate per key and can never mint records neither
  device earned.

## Serving it (workstation)

```sh
python3 tools/save-server.py &                      # or a systemd unit later
tailscale serve --bg https /save http://127.0.0.1:8754/save
```

Same tailnet origin as the game, so the client fetch is same-origin (`/save`).

## Stubbing it in a spec

```js
await page.route('**/save', (route) =>
  route.request().method() === 'PUT'
    ? route.fulfill({ status: 204 })
    : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(blob) })
);
```
