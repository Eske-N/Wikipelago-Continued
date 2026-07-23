# Entertainment article pool fix notes

Applied transforms to `world/APWorldSource/Wikipelago/entertainment_articles.py`.

## Counts

| Metric | Count |
|--------|------:|
| Original pool size | 1064 |
| Original unique titles | 1034 |
| Entries removed (`Concordia (board game)`) | 1 |
| Entries replaced (explicit + redirect_ok) | 69 |
| Duplicates removed after transform | 38 |
| Final pool size | 1025 |

## Explicit replacements

23 title strings remapped (missing/disambiguation fixes and intentional overrides).

## Removals

- `Concordia (board game)` — missing on Wikipedia / removed entirely.

## redirect_ok

Applied remaining `redirect_ok` mappings from `world/pool_validation_report.json` to canonical titles, except where overridden by explicit replacements (including intentional keeps for Phasmophobia → video game, Terraforming Mars → board game, Mythology → Myth).

## Order

Relative order preserved; `dict.fromkeys` used for deduplication.

## Validation

Re-ran `world/validate_article_pool.py` after transforms:

- missing: **0**
- disambiguation: **0**
- redirect_ok: **0**
- duplicates: **0**
- all_ok / pool_size: **1025**
