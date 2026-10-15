# Gardener Survivor

A Vampire Survivors–style browser game: you're a gardener holding off waves of angry plants.
Your tools attack on their own. Move around, collect seeds to level up, choose upgrades, and
survive 10 minutes to face the **Mutant Sunflower**.

## Run

No build step and no dependencies. ES modules need an HTTP server, so `file://` won't work:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Controls

- **WASD / arrow keys**: move (on touch screens, drag to move)
- **1 / 2 / 3** or click: pick a level-up card
- **Esc / P**: pause

## Content

- **Plants:** Weedling, Thorn Bush, Cactus (shoots spines), Venus Flytrap (lunges),
  Creeping Vine (splits when killed), golden elites, and the Mutant Sunflower boss at 10:00
- **Tools (5 levels each):** Pruning Shears, Boomerang Trowel, Weedkiller Spray, Garden Hose,
  Lawn Gnomes, Earthquake Rake
- **Passives:** Garden Boots, Work Gloves, Straw Hat, Fertilizer, Seed Pouch, Sundial
- **Pickups:** seeds (XP), tomatoes (heal), bees (pull in every seed on the map)

## Debug

Open with `?debug` (for example `http://localhost:8000/?debug`) to enable:
`` ` `` skips ahead 1 minute, `L` grants a level-up, `H` heals to full. `window.game` is exposed.

## Code layout

`src/main.js` (loop and state machine), `game.js` (simulation), `player.js`, `enemies.js`,
`spawner.js` (wave timeline), `weapons.js`, `upgrades.js`, `pickups.js`, `projectiles.js`,
`particles.js`, `world.js` (procedural lawn), `icons.js`, `ui.js` (DOM HUD and menus), `utils.js`.
