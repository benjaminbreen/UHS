"""Score rendered ambience against words with CLAP, a model that embeds audio
and text in one space. Called by scripts/render-ambience.ts --clap.

stdin: {"labels": [description, ...], "report": [{"describe", "rows": [{"file"}]}]}
stdout: {file: {"own": cosine to its scene's description, "rank": 1 = best of
the scene labels, "best": the nearest label of all, "decoy": the nearest of the
sounds synthetic rain is often mistaken for, and its cosine}}

CLAP cannot tell one shade of rain from another (real recordings rank no better
than synthesis among the scene labels). What it does catch is rain that reads
as static, frying or applause, so the decoys are the signal to watch.

Needs torch and transformers in .venv; the model (~800 MB) downloads on first use.
"""
import json
import subprocess
import sys

import numpy as np
import torch
from transformers import ClapModel, ClapProcessor

MODEL = "laion/larger_clap_general"
SR = 48000


def load(path):
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


DECOYS = [
    "white noise static hiss",
    "bacon frying in a pan",
    "applause from a crowd",
    "a running shower in a bathroom",
    "a waterfall",
    "an electrical hum",
    "wind blowing",
]
job = json.load(sys.stdin)
scenes = job["labels"]
labels = scenes + DECOYS
model = ClapModel.from_pretrained(MODEL).eval()
proc = ClapProcessor.from_pretrained(MODEL)
with torch.no_grad():
    text = model.get_text_features(**proc(text=labels, return_tensors="pt", padding=True))
    text = torch.nn.functional.normalize(text, dim=-1)
    out = {}
    for entry in job["report"]:
        own = labels.index(entry["describe"])
        for row in entry["rows"]:
            # CLAP hears 10 s at a time; average the windows of the clip.
            audio = load(row["file"])
            windows = [audio[i:i + SR * 10] for i in range(0, max(1, len(audio) - SR * 5), SR * 10)]
            inputs = proc(audios=windows, sampling_rate=SR, return_tensors="pt", padding=True)
            emb = torch.nn.functional.normalize(model.get_audio_features(**inputs).mean(0, keepdim=True), dim=-1)
            sims = (emb @ text.T)[0]
            order = torch.argsort(sims[: len(scenes)], descending=True).tolist()
            decoy = int(torch.argmax(sims[len(scenes):])) + len(scenes)
            out[row["file"]] = {
                "own": round(float(sims[own]), 4),
                "rank": order.index(own) + 1,
                "best": labels[int(torch.argmax(sims))],
                "decoy": labels[decoy],
                "decoyScore": round(float(sims[decoy]), 4),
            }
json.dump(out, sys.stdout)
