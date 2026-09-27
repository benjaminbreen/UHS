"""Reference art shared by review sheets."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent


def current_adult():
    path = ROOT / 'scripts/art/reference/current-adult.png'
    if not path.exists():
        raise FileNotFoundError(
            f'{path} is missing; run npx tsx scripts/capture-building-scale-reference.ts with Vite running')
    return Image.open(path).convert('RGBA')



def current_adult_d():
    """Renderer d adult (16x38) and child (14x31), idle, facing south."""
    base = ROOT / 'scripts/art/reference'
    return (Image.open(base / 'current-adult-d.png').convert('RGBA'),
            Image.open(base / 'current-child-d.png').convert('RGBA'))
