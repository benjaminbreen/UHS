"""Contact sheet of a benchmark run. Usage: benchmark-sheet.py <label>"""
import glob, sys
from PIL import Image
label = sys.argv[1]
fs = sorted(glob.glob(f"artifacts/benchmark/{label}/*.png"))
ims = [Image.open(f).convert("RGB") for f in fs]
w, h = ims[0].size
cols = 3
s = Image.new("RGB", (cols * w // 2, -(-len(ims) // cols) * h // 2))
for i, im in enumerate(ims):
    s.paste(im.resize((w // 2, h // 2), Image.NEAREST), ((i % cols) * w // 2, (i // cols) * h // 2))
s.save(f"artifacts/benchmark/{label}-sheet.jpg", quality=85)
print(fs)
