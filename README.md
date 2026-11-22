# La Lanterna di Brumafonda

A top-down action-adventure for the browser, in the spirit of classic 2D Zelda games, with an original story, world and characters. Everything (graphics, music, sound effects) is generated in code: no external assets. The look is a hand-painted watercolor style: paper texture, bleeding washes, pigment edges, swaying grass and trees, drifting cloud shadows and breathing characters.

Ilio, a young apprentice lamplighter, and Pip, a very talkative firefly, set out to recover the three Flames stolen from the Great Lantern of Brumafonda by Cenerale, the Moth King.

## Play

**[Play online](https://mayday-gaming.github.io/brumafonda/)**, or open `index.html` in any modern browser. Desktop and mobile (touch controls) are supported. Progress is saved automatically in `localStorage`.

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrows / WASD | Joystick |
| Attack, talk, open (A) | Space / J / Z | A |
| Spin attack | Hold A and release | Hold A |
| Use item (B) | K / X | B |
| Switch item | Q / L / C | ⟳ |
| Ask Pip for a hint | P / H | ✦ |
| Menu | Esc / M / Tab | ☰ |

## Guidance

The current objective is always shown at the bottom left, a golden arrow points to the screen exit leading to it, and a star marks the exact spot once you get there. The pause menu has a quest log, and Pip (✦ / P) gives contextual hints, or speaks up on his own if you seem stuck. The guide can be turned off in Options.

## Content

- 15 overworld screens and 4 dungeons (Tana del Fungo, Faro Sommerso, Campanile Spezzato, Nido della Falena)
- 4 items: the lamplighter's pole, lantern, grappling hook, glass bell
- 7 enemy types and 4 bosses, each beaten with a different item
- Collectibles: 24 lost fireflies, 4 heart pieces, 6 diary pages, seashells (currency), 16 trophies
- Two endings, a shop, and several easter eggs

## Development

Sources live in `src/` and are bundled into a single `index.html`:

```sh
./build.sh                 # bundle + syntax check
node tools/validate.js     # check room sizes and edge connectivity
```

Every push to `main` rebuilds the game and publishes it to the `gh-pages` branch (see `.github/workflows/pages.yml`).

| File | Contents |
|---|---|
| `src/head.html` | Markup and CSS (HUD buttons, menus, touch controls) |
| `src/data.js` | Rooms, diary pages, items, trophies |
| `src/core.js` | Constants, procedural audio and music, input, save |
| `src/world.js` | Room loading, collisions, tile rendering |
| `src/paint.js` | Watercolor post-processing, paper, foliage, shadows, clouds |
| `src/entities.js` | Enemies, bosses, pickups, character renderer |
| `src/npc.js` | NPC dialogue, Pip hints, shop |
| `src/guide.js` | Objectives, path arrow, quest log |
| `src/game.js` | Player, items, interactions, dialogue, update loop |
| `src/render.js` | World rendering, lighting, HUD and windows |
| `src/ui.js` | Title screen, pause menu, shop UI, main loop |
