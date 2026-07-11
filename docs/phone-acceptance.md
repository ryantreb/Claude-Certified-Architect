# iPhone 13 Pro Max — acceptance checklist

The pass that turns "works on my phone" into a verified claim. Run it on the
physical phone after the runbook (docs/phone-runbook.md) is set up, and again
after any change to the loading engine, the service worker, or the sync. Every
item states the action and the exact pass condition — no vibes.

Record a run by copying the table and filling the date column.

| # | Do this | Pass means | Run 2026-__-__ |
| --- | --- | --- | --- |
| 1 | **Install.** Safari → the tailnet URL → let it load once → Share → Add to Home Screen. | The icon appears with the hero art and the name "Sigilbound"; tapping it opens full-screen with no Safari chrome. | |
| 2 | **Cold boot.** Force-quit the app (swipe away), relaunch from the icon. | Title screen interactive in ≤ 5 seconds; no blank canvas, no "problem repeatedly occurred". | |
| 3 | **Battle art.** Start or continue a game, walk to a node, enter a battle. | The fight opens promptly; DA Legends sprites appear within ~2 seconds of the battle starting (stand-ins may flash first — that's the demand-load working, not a failure). | |
| 4 | **Notch / home bar.** In world and battle, look at the top HUD and bottom action bar. | Nothing hides under the notch or the home indicator; every button is tappable without fighting the system gestures. | |
| 5 | **Background / resume.** Mid-battle, switch to another app for a minute, come back. | The game resumes where you left it; audio comes back after a tap (iOS rule); no reload loop. | |
| 6 | **Phone restart.** Reboot the phone, relaunch from the icon. | Loads to title from cache/tailnet without re-doing setup; progress intact. | |
| 7 | **Update propagation.** On the workstation: `tools/deploy-mobile.sh`. Then close and reopen the app once. | The new build is running (one automatic reload at most); the caching pill re-warms briefly; no manual cache clearing. | |
| 8 | **Save convergence.** Answer a recall on the phone; open the game on the workstation (same endpoint) and check that concept; then the reverse. | Both devices show the same reps/mastery for the studied concepts; meters agree; nothing gained that wasn't earned on one of them. | |

## When an item fails

File it as a GitHub issue titled `Device checklist #<n> failed: <symptom>`,
labelled `needs-triage`, with: iOS version, what you saw, and whether items
before it passed. The checklist is only "done" when a full run passes top to
bottom on one build.
