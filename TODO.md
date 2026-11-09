# PK Golf — TODO

## Scoring & setup

- **"Everyone scores their own round" mode.** Right now one device enters scores for the whole group. Data model already supports concurrent multi-device writes with no conflicts (`scores/{playerId}_{hole}`, one doc per player per hole) and every scoring/leaderboard screen already live-syncs via `onSnapshot` — so the sync part is free. What's actually needed:
  - A mode toggle on New Round ("One device scores everyone" vs "Everyone scores their own") — keep both, don't replace the current flow.
  - A "Which player are you?" picker shown once per device on the scoring link, remembered via localStorage (no `uid` link on player docs today, so this is device-level, not account-level).
  - Filter the Score tab's entry UI to just the selected player instead of the full multi-player grid; other players' progress still visible read-only via the existing Leaderboards tab.
  - A QR code for the scoring link (e.g. an `api.qrserver.com` image, no new library) so a group can scan-to-join at the first tee instead of passing a URL around.
  - Known limitation, not a blocker: identity is device-local, so clearing browser data or switching phones means re-picking your name; two people mistakenly picking the same player is last-write-wins per hole, same as today's single-scorer mode already behaves.

- **Handicap system.** Golfer profiles (`golfers/{uid}`) have a `handicap` field, but it's just a manually-typed number on the Account page right now — no real handicap calculation/tracking. Design this properly later (how it's computed/updated, whether it pulls from round scores). Deferred on purpose (2026-10-26) to keep sign-up simple for now.

## Friends & notifications

- **Friends list.** Prerequisite for push notifications below (nothing to notify without a linked person) and useful on its own (reusable player picker instead of retyping names every round).
  - Search by exact email only, not an open user directory — keeps it consent-based (you need to already know their email to find them).
  - Friend request → accept/decline flow (Firestore collection for pending/accepted).
  - A Friends screen (search, pending requests, friends list) — likely off Account.
  - New Round's player fields get a "pick from friends" option alongside typing a name, which links that player doc to the friend's real account instead of just a text string.

- **Push notifications** (e.g. "you were added to a fourball"). Depends on the friends list existing first.
  - One-time setup: generate a VAPID key pair.
  - Client: request notification permission, subscribe via the service worker (`sw.js` already exists), store the subscription in Firestore per user.
  - **New backend piece required** — a browser can't push to another device directly; sending needs a server holding the VAPID private key. A small Cloudflare Worker endpoint, same pattern as PK Vote/PK Chess already use.
  - `sw.js` needs a `push` event handler added to actually display the notification when it arrives.

## Courses & GPS

- **GPS distance/map feature.** Tee/green yardage like other golf apps. OSM has ~56 SA courses with full 18-hole GPS mapping; plan was OSM where mapped, plus players dropping their own tee/green pins stored in Firestore where it isn't. **Firestore rules need tightening first** — currently open to anyone with the app key (confirmed 2026-10-16) — before storing any player-added location data there.
- **Meters-converted yardage on the scoring screen.** GolfCore gives yardage in yards per hole per tee; SA uses metric. Nothing converts/displays this yet — cached in Firestore but not shown anywhere in the UI.
- **National course import.** Only Gauteng's 67 courses were bulk-imported from GolfCore so far (2026-11-03); other provinces deferred to avoid burning the free-tier monthly quota in one run. Re-run the same paced-import approach for more provinces when it's worth the quota.
- **Time-sensitive: GolfCore API key.** The GolfCore course-search API moves off its free keyless tier on **2026-12-04** — needs a developer account + API key at golfcore.org before then, or course search in New Round breaks. The account creation itself is on Ruan, not something Claude can do.

## Desktop

- Desktop sidebar dashboard (Home, History, New Round, Account, Competition/Standings) shipped 2026-11-07 — done, not a TODO item, kept here only as a note that the earlier "scope still open" framing is stale.
