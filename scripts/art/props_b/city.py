"""Street trees for the industrial city, drawn by the city kit."""
from art.city_kit import plane_tree


def city_plane(variant):
    return plane_tree(3 + variant * 5, r=(16, 19, 22)[variant])


def city_willow(variant):
    from art.city_japan import willow
    return willow(variant * 7 + 1)


def meiji_pole(variant):
    from art.city_japan import pole
    return pole(variant)


def rickshaw(variant):
    from art.city_japan import rickshaw as draw
    return draw(variant)
