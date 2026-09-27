"""Street trees for the industrial city, drawn by the city kit."""
from art.city_kit import plane_tree


def city_plane(variant):
    return plane_tree(3 + variant * 5, r=(16, 19, 22)[variant])
