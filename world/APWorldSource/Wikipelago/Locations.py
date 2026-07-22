from dataclasses import dataclass


@dataclass(frozen=True)
class WikipelagoLocationData:
    code: int


LOCATION_OFFSET = 1_880_000
MAX_ROUNDS = 5000

location_table: dict[str, WikipelagoLocationData] = {
    **{
        f"Round {index} Complete": WikipelagoLocationData(LOCATION_OFFSET + index)
        for index in range(1, MAX_ROUNDS + 1)
    },
    "Grand Goal": WikipelagoLocationData(LOCATION_OFFSET + MAX_ROUNDS + 1),
}
