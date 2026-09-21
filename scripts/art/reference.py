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

