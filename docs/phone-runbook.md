# Sigilbound on the iPhone — Tailscale runbook

From zero to the game loading in iPhone Safari at a private HTTPS URL. Run the
workstation steps on the Linux box that hosts this repo; total setup is about
ten minutes, once. Nothing here exposes anything publicly — the game (and its
EA-derived art) is reachable only by devices logged into *your* tailnet.

## 1. Tailscale on the workstation (once)

```sh
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up          # opens a browser login — create/use your account
tailscale status           # should list this machine as connected
```

The free "Personal" plan covers everything this runbook needs.

## 2. Tailscale on the iPhone (once)

1. App Store → install **Tailscale**.
2. Log in with the **same account**.
3. Leave the VPN toggle on. (It's a lightweight WireGuard tunnel — battery
   impact is negligible, and it only carries tailnet traffic.)

## 3. Enable MagicDNS + HTTPS certificates (once)

In the [Tailscale admin console](https://login.tailscale.com/admin/dns):

1. **DNS → MagicDNS**: enable it. Your machines get names like
   `workstation.tail1234.ts.net`.
2. **DNS → HTTPS Certificates**: enable. This lets `tailscale serve` mint a
   real, publicly-trusted certificate for the machine's ts.net name — which is
   what makes Safari treat the origin as a secure context, which is what lets
   the service worker (offline cache, update flow) engage.

## 4. Serve the mobile build (once)

```sh
# static file server, loopback-only (the LAN can never reach it directly)
mkdir -p ~/.config/systemd/user
cp tools/sigilbound-mobile.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now sigilbound-mobile
loginctl enable-linger "$USER"        # survives logout and reboot

# front it with HTTPS on the tailnet (config persists across reboots)
tailscale serve --bg https / http://127.0.0.1:8753
tailscale serve status                # shows the exact URL
```

> Never use `tailscale funnel` for this — funnel is the *public* variant and
> would publish the EA assets to the open internet.

## 5. Load it on the phone (once)

1. Safari → `https://<workstation>.<tailnet>.ts.net/` (the URL from
   `tailscale serve status`).
2. Let it load once; the pill at the bottom shows the offline cache warming.
3. **Share → Add to Home Screen** for the standalone app icon.

## 6. Ship an update (weekly, or whenever)

```sh
tools/deploy-mobile.sh          # pull → rebuild → swap live, one command
```

It builds into a staging folder and swaps only on success — a broken build
aborts loudly with the old build still served. The phone's service worker
adopts the new version on its next open (one automatic reload). Pass a branch
name to pull a specific branch; `SKIP_PULL=1` deploys the working tree as-is.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Phone can't reach the URL | Tailscale toggle on the phone; `tailscale status` on the workstation shows both devices |
| Certificate warning in Safari | HTTPS Certificates not enabled in the admin DNS page (step 3) |
| Game loads but no offline pill | You're not on the HTTPS ts.net origin (plain http is not a secure context) |
| Stale build on the phone | Confirm `build-mobile.py` ran on the workstation; pull-to-refresh once in Safari / reopen the Home Screen app |
| Server dead after reboot | `systemctl --user status sigilbound-mobile`; confirm `loginctl enable-linger` was run |
