# Wikipelago

Wikipelago is a custom [Archipelago](https://archipelago.gg/) world inspired by wiki racing.

Each round gives you a **Start article** and a **Target article**. You navigate Wikipedia links to reach the target, send checks to Archipelago, collect progression, and eventually clear the goal.

## Live Web Client

Paste your hosted client URL here:

- **Wikipelago Web Client:** https://wikipelago-contd.onrender.com/

## What This Repository Contains

- `world/` - APWorld source code and build scripts
- `yaml/` - player YAML templates
- `bridge/` - backend bridge service (web client <-> Archipelago server)
- `web/` - frontend website UI

## Core Features

- Round-based Wikipedia navigation checks
- Knowledge Fragment progression + goal completion
- Progressive Round Access gating
- Strict no-repeat round generation
- Category toggles in YAML so players can tailor article pool
- Reconnect note: progress resume is not fully reliable yet. If you disconnect, use search to jump back to your last article and continue.

## Category Toggles (YAML)

Players can enable/disable article groups in their YAML:

- video games
- board games
- movies
- TV shows
- anime/manga
- sports
- science/space
- technology/internet
- history
- geography/landmarks
- food/cuisine
- art/literature
- mythology/folklore

## Quick Start (Host / Organizer)

1. Install `Wikipelago.apworld` into your Archipelago `custom_worlds` folder.
2. Use the YAML template from `yaml/` 
3. Generate your seed locally with Archipelago.
4. Host your room (for example on `archipelago.gg`).
5. Share:
   - room address + port
   - slot name
   - your web client URL

## Quick Start (Player)

1. Open the web client URL: https://wikipelago-contd.onrender.com/ 
2. Enter:
   - Archipelago server (example: `archipelago.gg:PORT`)
   - slot name
   - password (if used)
3. Click connect.
4. Play rounds by navigating from Start -> Target.
5. Reach goal requirements and clear Grand Goal.

## Compatibility

- Recommended Archipelago version: **0.6.6**

## Credits

Wikipelago was built by me.
