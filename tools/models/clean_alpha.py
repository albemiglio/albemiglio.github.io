"""Zero the near-transparent fringe of a rendered still and re-encode its WebP.

Run: python3 clean_alpha.py public/fallback/<obj>.png
Cycles' shadow catcher and denoiser leave a wide halo of 1-4 % alpha around the
object; composited on the page's near-black background it reads as a faint box.
"""
import sys
from PIL import Image
import numpy as np

THRESHOLD = 12  # of 255: below this the pixel is background, not shadow

for path in sys.argv[1:]:
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    a[a[:, :, 3] < THRESHOLD] = 0
    out = Image.fromarray(a)
    out.save(path)
    out.save(path.rsplit(".", 1)[0] + ".webp", quality=88, method=6, exact=False)
    print(f"clean_alpha: {path} cleaned")
