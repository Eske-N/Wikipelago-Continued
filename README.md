# Wikipelago

Wikipelago is a custom [Archipelago](https://archipelago.gg/) world inspired by wiki racing.

Each round gives you a **Start article** and a **Target article**. You navigate Wikipedia links to reach the target, send checks to Archipelago, collect progression, and eventually clear the goal.

This repository is a continued fork of the original project. Live web client: https://wikipelago-contd.onrender.com/

## Game basics

### Rounds
Each check is a round: open the **Start** page, click Wikipedia links, and reach the **Target**. Completing a round sends that location check to Archipelago.

### Knowledge Fragments
Completing rounds can award **Knowledge Fragments**. You need the number set in your YAML (`required_fragments`) to finish the **Grand Goal** (reach the final goal article with enough fragments).

### Round Access
Only some rounds are available at the start (`start_rounds_unlocked`). Extra rounds unlock when you receive **Round Access** items. Each Round Access opens more rounds according to `rounds_per_unlock`.

### Useful items
- **Back Button** — browser back navigation
- **Ctrl+F Lens** — in-page search
- **Wiki Compass** — warmer/colder hints toward the target
- **Progressive Scroll Speed** — only used when Scrollsanity is enabled

### Footnotes
Extra item slots that are not required progression are filled with **Footnote** filler items. They do nothing; they only pad the item pool.

### Searchsanity and Scrollsanity
Optional YAML toggles (off by default):

- **Searchsanity** — in-page search is limited by **Search Letter** items (you may start with a few letters via `search_starting_letters`).
- **Scrollsanity** — page scrolling starts slow and improves with **Progressive Scroll Speed** items.

### Display unlocks (Lenses)
Optional YAML toggles such as `randomize_tables`, `randomize_pictures`, `randomize_incipit`, and similar options for infoboxes, table of contents, navboxes, hatnotes, and references.

- When a toggle is **false** (default), that part of the page shows like normal Wikipedia.
- When a toggle is **true**, that part stays locked until you receive the matching **Lens** item (for example Table Lens, Picture Lens, Lead Lens).

Full option names and defaults live in [`Wikipelago/yaml/Wiki.yaml`](Wikipelago/yaml/Wiki.yaml) — treat that file as the source of truth.

### Category toggles
YAML can enable or disable article categories (for example video games, movies, history, science). Turn categories on or off in your player YAML to shape the article pool. See [`Wikipelago/yaml/Wiki.yaml`](Wikipelago/yaml/Wiki.yaml) for the full list.

## Core features

- Round-based Wikipedia navigation checks
- Knowledge Fragment progression and Grand Goal completion
- Progressive Round Access gating
- Strict no-repeat round generation
- Category toggles and optional sanities / display unlocks in YAML

## What this repository contains

- `Wikipelago/world/` — APWorld source and build scripts
- `Wikipelago/yaml/` — player YAML templates ([`Wiki.yaml`](Wikipelago/yaml/Wiki.yaml) is the reference)
- `Wikipelago/bridge/` — web client ↔ Archipelago bridge
- `Wikipelago/web/` — web client UI

## Quick start (host / organizer)

1. Download `Wikipelago.apworld` from this repo’s [Releases](https://github.com/Eske-N/Wikipelago-Continued/releases).
2. Install it in either way:
   - Double-click the `.apworld` file to open it with the Archipelago Launcher, **or**
   - Place it in your Archipelago `custom_worlds` folder.
3. Restart the **Archipelago Launcher** either way.
4. Put player YAML files in your Archipelago `Players` folder.
5. Generate the seed with the **Archipelago Launcher**.
6. Host your room (for example on `archipelago.gg`).
7. Share:
   - room address + port
   - slot name

## Quick start (player)

1. Open the web client: https://wikipelago-contd.onrender.com/
2. Enter:
   - Archipelago server (example: `archipelago.gg:PORT`)
   - slot name
   - password (if used)
3. Click connect.
4. Play rounds by navigating from Start → Target.
5. Collect enough Knowledge Fragments and clear the Grand Goal.

## Compatibility

- Recommended Archipelago version: **0.6.7**

## Known issues

- Progress resume after disconnect is not fully reliable yet. If you disconnect, use search (when unlocked) to jump back to your last article and continue.

## Credits

Original Wikipelago by [Skrumptily69](https://github.com/Skrumptily69/Wikipelago).

Continued development and hosting by [Eske-N](https://github.com/Eske-N/Wikipelago-Continued).
