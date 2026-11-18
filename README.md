# Eclipse of the Veil

**Two playable chapters of an offline, single-player pixel-art action RPG.** A bell wakes Lumenford and the mark on your hand answers. In **The Broken Seal**, follow the disappearances to the Fallen Spire. In **The Bell Below**, cross Ashen Pass into a capital that has been keeping peace by taking people’s names out of the world.

![The new title menu, with the party beneath a crimson eclipse](docs/title.webp)

New journeys start with an illustrated story. The Chapter I prologue follows a riderless horse, an erased name, and the first bell in Lumenford. Free CC0 pixel art is adapted for the opening plates, foliage, and terrain across both chapters, alongside the original sprites, portraits, and crimson-eclipse cover.

![The Morning Bell, the first illustrated scene of the prologue](docs/prologue.webp)

See the [portrait prologue](docs/prologue-touch.webp) and [Chapter II recap](docs/ashen-recap.webp) on touch layouts.

![Character creation: class art beside the customizable in-world sprite](docs/creation.webp)

## Play

Use the **Eclipse of the Veil** Arena preview, or run the game locally.

- **Chapter I:** Choose **New Game**, create your hero, then **Begin Prologue**. Read the three scenes before entering Lumenford, or choose **Skip prologue**. You can reread the story later with **Chronicle → Read the Prologue** without starting a save.
- **Chapter II:** Choose **Chronicle → Start in Chapter II**, create a hero, then **Read Chapter I Recap**. Read or skip the recap to arrive in Ashen Pass at level six with four learned skills, Tarek, Lyra, and the Oath Shard. Speak to Veyra near the overlook and decide what to tell the Crown.

An occupied slot requires confirmation. Nothing is saved or overwritten until you enter the world. You can go back from the story without losing the hero you were setting up.

**Continuing an existing journey?** **Continue** and **Load Game** resume gameplay without replaying the opening. Use **Load Game → Import Save** to bring in an export, including from Chapter I. Finished Chapter I saves get **A Bell for the Living** in the journal. Follow the gold markers to Ashen Pass. If the earlier shard choice was left unanswered, Veyra asks for it there. On a different preview URL, export from the old one and import into the new one; browser saves do not travel between origins automatically.

![Actual gameplay in Vesperhold’s Lantern Ward](docs/vesperhold.webp)

### Local setup

Requires Node.js **22.12+** and npm. There are no game accounts, backend services, environment variables, or mandatory asset CDNs.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. New Chapter I players: move a few steps, dispel the spark, and report to Captain Tarek. The journal and gold map markers guide both chapters. Shrines restore your party and set a checkpoint. Spend earned points in **Character** and **Skillbook**.

```sh
npm run build       # Type check, static dist/, and versioned offline cache
npm run preview     # Serve the production build to test offline support
```

After the production title screen says **Offline ready**, the story, art, and both chapters can start or resume without a connection. Supported browsers may offer **Install** or **Add to Home Screen**. Service workers require HTTPS or `localhost`; after an update, close old game tabs before reopening to give the new worker a chance to activate. Saves live in three local IndexedDB slots with a localStorage safety mirror. Use **Pause → Export Save** to back up a journey. Audio starts muted; use the sound switch to hear the original score and effects.

### Controls

| Desktop | Action |
| --- | --- |
| WASD / arrow keys | Move; left/right arrows turn pages in the opening |
| Left click | Walk to a point, approach an interaction, or engage an enemy |
| Tab / F | Cycle visible targets / auto-attack the target |
| 1–6 | Use a learned class skill |
| Space | Dodge in the movement or facing direction |
| E | Interact at the prompt; advance dialogue |
| Q / R | Drink a health / mana tonic |
| I / C / K | Inventory / character / skillbook |
| J / M / P | Journal / map / party |
| F1 / F2 / F3 | Control the hero or one of the two active companions |
| Esc | Dismiss, close, or pause |

On touch, use the joystick and action buttons or tap the world. Landscape gives the most room ([landscape HUD](docs/touch-hud.webp) · [portrait HUD](docs/portrait-touch.webp)). Settings offer Story, Adventure, and Veteran difficulty; automatic, always-on or hidden touch controls; reduced motion; and separate volume controls.

## What’s in the game

| Content | Included |
| --- | --- |
| Chapters | The Broken Seal and The Bell Below, **16 main quests**, **6 side quests**, and **8 connected maps** |
| Chapter II | Rainlit Vesperhold, the Drowned Archive’s two-wheel floodgate, and the Vault of the Last Bell. The shard decision changes the entrance, encounters, and dialogue. A separate ending changes how the city handles the recovered names and which accessory you earn. |
| Opening | Three Chapter I prologue scenes, a two-scene Chapter II recap, and a read-only story in the Chronicle. The first quest records Bess’s watchbook in the journal. |
| Characters | Recruit Captain Tarek, Lyra, and Veyra. Bring two companions, switch control, and set their tactics. Illustrated scenes bring Seris, Archivist Iona, and Malrec into the story. |
| Field journal | Track quests, read discovered memories, look up people, and check the bestiary for combat tells. |
| Encounters | **16 enemy types**, including Siltmaw charge lanes, Bellwing projectile fans, Crown Bailiff frontal guard, the Archive Husk, and two three-phase bosses. Look for the safe centre or outer edge of the Hollow Knight’s ring. |
| Classes and gear | Six customizable classes, six working abilities with three ranks per class, five attributes, 36 bag slots, ten equipment slots, six rarities, crafting, shops, and enhancement up to +3. The level cap is 100; the current campaign is balanced for early progression, not endgame. |

![Veyra responds to the Chapter I decision in an in-game dialogue scene](docs/veyra.webp)

![The party crosses the opened grating in the Drowned Archive](docs/archive.webp)

![An actual phase-two encounter in the Vault of the Last Bell](docs/last-bell.webp)

More gameplay: [Lumenford Village](docs/lumenford.webp) · [Equipment and inventory](docs/inventory.webp) · [Gloomroot Warden](docs/gloomroot.webp)

## Implementation

- **Phaser** renders the world and handles the camera and world pointer input. Terrain is cached in 16×16-tile chunks. Actors are Y-sorted animated pixel atlases; world entities are not DOM elements.
- The **TypeScript** simulation ticks independently, with fixed-step combat, A* routing, exact grid line of sight, collision, status effects, gear progression, and persistent quest events. `src/game/patterns.ts` shares telegraph geometry with the gameplay rules.
- **React** owns the illustrated opening, hero creation, HUD, journal, menus, dialogue, and accessible controls. `src/game/audio.ts` provides original Web Audio music and effects.
- `src/data/` contains maps, dialogue, quests, encounters and lore. `src/game/peopleArt.ts` draws the character atlases, `src/game/sceneryArt.ts` maps the local terrain atlas and foliage to existing tiles and props, `src/game/pixels.ts` draws fallback terrain and creatures, and `src/game/iconArt.ts` caches pixel icons for the HUD, skills, and gear. The art refresh does not change map collision.
- `scripts/service-worker.mjs` fingerprints and precaches the production files. Save validation in `src/game/save.ts` retains Chapter I’s schema and identifiers.

## Pixel-art credits

- **[Mountain at Dusk Background](https://opengameart.org/content/mountain-at-dusk-background)** by Luis Zuno (Ansimuz) — layered landscapes adapted for Lumenford and Ashen Pass.
- **[Ninja Adventure Asset Pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack)** by Pixel-Boy and AAA — foliage, outdoor and town tiles, and the wood beneath the watchbook.
- **[16x16 DungeonTileset II](https://0x72.itch.io/dungeontileset-ii)** by 0x72 (Robert Norenberg) — floor tiles for the Spire, Archive, and Vault.

These packs are [CC0](https://creativecommons.org/publicdomain/zero/1.0/). Adapted files are served locally, not hotlinked. See the [asset-by-asset credits](public/licenses/open-pixel-art.md) and [third-party notices](public/licenses/).

## Validation

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The Playwright suite starts the production preview on port 4317. For an existing browser binary, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Set `VEILBOUND_SOFTWARE_CANVAS=1` for a headless environment without WebGL acceleration.

- **35 Vitest tests:** both chapters completed in deterministic simulations on all six classes; one complete Chapter II quick-start run; both archive routes and final decisions; side quests, companions, new telegraphs, gates, save compatibility, and the original skills, combat and economy regressions.
- **10 Playwright scenarios:** the full prologue, read-only Chronicle, art, and Chapter II recap; backing out of a pending overwrite and skipping while offline; portrait and landscape touch; desktop combat and travel; save import/export and Chapter I saves resuming directly; and the Archive and Last Bell encounters.
- Strict TypeScript and the production build pass. Tests use Chromium, including emulated touch, not a physical-device benchmark or a timed human playthrough. Chapter III and beyond, endgame, and the full planned campaign are not included.

## Deploy

`vercel.json` configures the Vite build, `dist/` output, SPA fallback, and service-worker cache policy. The GitHub repository `kimpoy813/inotia5` is linked to the `inotia5` Vercel project.

1. To preview changes, deploy the branch containing this release from the project dashboard, or run `npx vercel link --project inotia5` and then `npx vercel` from the checkout. Select the project’s existing workspace and use Node 22 or newer. Use a preview before intentionally promoting to production.
2. Open the deployment over HTTPS, start a game, save, and reload using **Continue**. Wait for **Offline ready**, go offline, and reload again to verify the cached release.

The static `dist/` output also works on other HTTPS hosts with SPA fallback to `index.html` and a revalidated `/sw.js`.

*Eclipse of the Veil* is an original, unofficial project inspired by *Inotia 4*. It is not licensed, endorsed, or affiliated with Com2uS and does not use its assets or code.
