Garment icon art. `drape.py` is the model — a torso whose width runs from
shoulder to waist to hem, sleeves hung off it, a neck cut, folds, a hem band —
and `shapes.py` gives each silhouette its numbers. Hats, shoes and jewellery
are drawn by hand in `heads.py` and `extras.py`, then run through the same
shader so the whole set is lit the same way.

    python3 scripts/garment_art/emit.py    # rewrites src/render/garment-art.ts
    python3 scripts/garment_art/sheet.py 6 # contact sheet, four cloths wide

Edit the art here, not in the generated TypeScript.
