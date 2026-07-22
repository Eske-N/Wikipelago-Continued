from BaseClasses import Region

from .Locations import location_table


def create_regions(world: "WikipelagoWorld") -> None:
    menu = Region("Menu", world.player, world.multiworld)
    game = Region("Wikipelago", world.player, world.multiworld)

    menu.connect(game)

    round_count = world.options.check_count.value
    for index in range(1, round_count + 1):
        name = f"Round {index} Complete"
        data = location_table[name]
        game.add_locations({name: data.code}, world.location_class)

    game.add_locations({"Grand Goal": location_table["Grand Goal"].code}, world.location_class)

    world.multiworld.regions.extend([menu, game])
