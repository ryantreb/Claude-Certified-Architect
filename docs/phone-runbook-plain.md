# Putting Sigilbound on your iPhone and iPad — the plain-English guide

This is a friendlier walkthrough of the setup. It says the same thing as the
technical runbook, just without the shorthand. The goal is simple: play the
game on your iPhone and iPad, privately, without putting it on the internet
where anyone could find it.

You only have to do this whole setup once. Plan for about ten minutes.

## What we're actually doing, and why

The game lives on your computer (the Linux machine that holds this project). We
want your phone and iPad to be able to open it. The catch is that we do **not**
want it visible to the public internet, both for privacy and because the game
uses Dragon Age artwork that isn't ours to publish.

The tool that solves this is called **Tailscale**. Think of it as a private
tunnel that connects only your own devices — your computer, your iPhone, your
iPad. Once they're all signed in to Tailscale, they behave as though they're
sitting on the same home network, even when they're miles apart. Nobody else
can see or reach anything.

So the plan is: put Tailscale on every device, start the game running on your
computer, and then open it in the browser on your phone and iPad.

## Step 1 — Set up Tailscale on your computer

On the Linux computer that holds the game, install Tailscale and sign in. When
you start it, a browser window opens and asks you to create an account or log
in — do that. After it finishes, you can ask Tailscale for its status and it
should show your computer as connected.

The free "Personal" plan is all you need. You never have to pay for anything in
this guide.

## Step 2 — Set up Tailscale on your iPhone and iPad

Do this on **each** device you want to play on.

1. Open the App Store and install the app called **Tailscale**.
2. Sign in with the **same account** you used on the computer. This is the part
   that matters most — the devices only find each other because they share one
   account.
3. Leave Tailscale switched on. It runs quietly in the background. It barely
   touches your battery, and it only handles traffic between your own devices —
   it is not routing your normal web browsing.

There is no meaningful difference between the iPhone and the iPad here. The app
is the same and the steps are the same. Just remember to do them on both
devices.

## Step 3 — Turn on two settings in Tailscale's website

This step happens once, in a web browser, on Tailscale's admin website (you can
do it from your computer). You're flipping on two switches:

1. **A switch that gives your computer a friendly name.** Instead of a string of
   numbers, your computer gets a readable web address you can type into a
   browser.
2. **A switch that adds a proper security lock.** This is the padlock icon you
   normally see in a browser's address bar. It matters more than it sounds:
   Safari on Apple devices refuses to let the game save your progress or work
   offline unless the connection has that lock. Turning this on is what makes
   the game behave like a real, installed app rather than a plain web page.

## Step 4 — Start the game running on your computer

Back on your computer, you'll run a few commands (they're in the technical
runbook, copy them exactly). Here's what they accomplish, in order:

1. They start a small web server on your computer that serves the game. On its
   own, this server can only be reached from the computer itself — not even
   other devices on your home Wi-Fi can see it directly. That's deliberate and
   safe.
2. They set that server up to start again automatically if you restart the
   computer, so you don't have to redo this every time.
3. They tell Tailscale to make that server reachable from your own phone and
   iPad, over the secure locked connection from Step 3. Tailscale then prints
   the exact web address to use.

**One important warning.** There is a similar-looking command that uses the word
"funnel" instead. Do **not** use it. "Funnel" is the version that opens the game
to the entire public internet — exactly what we're trying to avoid. Stick with
the command in the runbook, which keeps everything private to your own devices.

## Step 5 — Open the game on your iPhone and iPad

Do this on **each** device.

1. Open Safari and go to the web address Tailscale gave you in Step 4.
2. Let the game load all the way through at least once. While it loads, a small
   status bubble appears near the bottom of the screen letting you know it's
   saving a copy of the artwork so the game can run smoothly later, even if your
   computer is asleep. Wait for that to finish the first time.
3. Save it as an app icon. Tap the **Share** button (the square with an arrow
   pointing up), then choose **Add to Home Screen**. Now you get a real icon on
   your home screen, and tapping it opens the game full-screen with no browser
   clutter around it.

**iPhone versus iPad — is there any difference?** Not really. The steps are
identical. Two small things worth knowing:

- On the iPad, the **Share** button and the **Add to Home Screen** option live
  in the same place as on the iPhone; if you don't see Add to Home Screen right
  away, scroll down within the Share menu.
- The game was designed first for a phone's tall, narrow screen. It still works
  perfectly well on the iPad's larger screen — you just get a roomier view. You
  don't need to do anything different to make it fit.

## Step 6 — Getting updates later

Whenever the game gets improved, you update it on your **computer** with a single
command (it's called `deploy-mobile.sh` in the runbook). It rebuilds everything
safely — if something in the new version is broken, it refuses to go live and
keeps the old working version running, so you can't accidentally end up with a
broken game on your phone.

On your iPhone and iPad, you don't have to do anything special. The next time you
open the game, it quietly notices the new version and refreshes itself once.
That's it.

## If something isn't working

Here are the most common snags and what to check. These apply equally to the
iPhone and the iPad.

**The phone or iPad can't reach the address at all.**
Make sure Tailscale is switched on on that device. Then check on your computer
that Tailscale's status shows *both* the computer and the phone as connected. If
a device isn't listed, it isn't signed in to the same account.

**Safari shows a security warning about the connection.**
This means the security-lock switch from Step 3 didn't get turned on. Go back to
Tailscale's admin website and enable it.

**The game loads but the little "saving for offline" bubble never appears.**
This almost always means you opened the plain, unlocked address instead of the
secure one. Use the exact address Tailscale gave you in Step 4 — the one with
the security lock. Only the secure address lets the game save itself for offline
use.

**The phone is still showing an old version of the game.**
Confirm the update actually ran on your computer (Step 6). Then, in Safari on the
device, pull down to refresh once, or close and reopen the home-screen app icon.

**The game server isn't running after you restarted the computer.**
Check the server's status on your computer. If it didn't come back on its own,
the "start again automatically after a restart" part of Step 4 may not have been
run — redo that piece.
