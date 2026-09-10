"""Modern slab phone with a metal rail.

Units are the body height (2.0 = 147 mm). Everything is modelled flat — the
display in the XY plane, facing +Z — because the rounded-rectangle profile is
built in XY, and then every part is stood upright by baking a +90 degree turn
about X into its object matrix. That turn is exactly the inverse of the glTF
y-up conversion, so in the exported file the phone stands along Y with the
screen facing +Z, and `screen` keeps a flat XY mesh centred on its own origin.

Front stack, back to front: `back` (BODY) → `rail` (ALU, full height, visible
at the edge) → `bezel` (INK, under the glass) → `glass` (transmissive cover,
inset from the rail) → `screen` (the site's UI plane) → `island` (an INK pill
sitting on top of the screen, not a hole in it).
"""
import os
import sys

import mathutils

sys.path.insert(0, os.path.dirname(__file__))
from common import (args, bevel, box, cylinder, deg, export, group, hemisphere,  # noqa: E402
                    join, pbr, place, reset, rounded_box, segments, smooth, subtract,
                    yup_plane)
from style import BEVEL_R, mat  # noqa: E402

a = args()
reset()
low = a.lod == "low"
s = 16 if low else segments(a.lod)
corner = 5 if low else 10
lens_count = 1 if low else 3
hole_count = 3 if low else 6

alu = mat("alu", "alu")
ink = mat("ink", "ink")
body = mat("body", "body")
glass = mat("glass", "glass")
lens_glass = pbr("lens_glass", (0.02, 0.03, 0.05), roughness=0.05, transmission=0.85, ior=1.52)
flash = pbr("flash", (0.9, 0.88, 0.8), roughness=0.2)
screen_off = pbr("screen_off", (0.02, 0.02, 0.025), roughness=0.08)

# 2.00 = 149.6 mm, a 6.3-inch Pro's height, so the width and thickness are that
# same machine's: 71.5 mm and 8.25 mm.
BODY_H = 2.00
BODY_W, THICK = BODY_H * 71.5 / 149.6, BODY_H * 8.25 / 149.6   # slab envelope
CORNER_R = 0.13                              # continuous, near-pill corners
RAIL_W = 0.012                               # metal band width, uniform all round
GLASS_INSET = 0.006                          # reveal between the rail and the glass
FRONT = THICK / 2
BUMP = (-0.19, 0.70)                         # camera island centre on the back

GLASS_W, GLASS_H = BODY_W - 2 * (RAIL_W + GLASS_INSET), BODY_H - 2 * (RAIL_W + GLASS_INSET)
# The site maps a capture of the real product onto this plane, so the plane's
# aspect is the capture's: an iPhone Pro's display, 1206 x 2622. Round it and the
# handoff matrix keeps a residual scale instead of resolving to the identity.
DISPLAY_ASPECT = 1206 / 2622
# The one bezel width that lets that aspect sit in the glass opening with an equal
# margin all round — solved rather than guessed, because a guess leaves the top and
# bottom margins visibly fatter than the sides.
BEZEL_M = (GLASS_W - DISPLAY_ASPECT * GLASS_H) / (2 * (1 - DISPLAY_ASPECT))
SCREEN_H = GLASS_H - 2 * BEZEL_M
SCREEN_W = SCREEN_H * DISPLAY_ASPECT

# Front stack, cumulative from the back cover's top face: each layer sits
# flush on top of the one below it, plus a hair of proud step where it needs
# to read as a separate surface (screen over bezel, island over screen). A
# first pass buried the screen a fraction of a millimetre *under* the bezel's
# own top surface — same Z range, so the opaque bezel hid it completely.
BEZEL_T, SCREEN_T, ISLAND_T, GLASS_GAP, GLASS_T = 0.0020, 0.0006, 0.0006, 0.0004, 0.0060
z_bezel_top = BEZEL_T
z_screen_top = z_bezel_top + SCREEN_T
z_island_top = z_screen_top + ISLAND_T
z_glass_bot = z_island_top + GLASS_GAP
STACK = z_glass_bot + GLASS_T
BACK_T = THICK - STACK
z0 = -THICK / 2 + BACK_T                     # back cover's top face

back = rounded_box("back", (BODY_W, BODY_H, BACK_T), CORNER_R, corner, body,
                   location=(0, 0, -THICK / 2 + BACK_T / 2), rim=BEVEL_R, rim_segs=3)

# Rail: a rounded ring, cut rather than modelled, so its outer arcs and the
# body's stay concentric. The cutter is deeper than the frame in Z, so only the
# side walls intersect and the boolean has no coplanar faces to resolve.
rail = rounded_box("rail", (BODY_W, BODY_H, THICK), CORNER_R, corner, alu)
subtract(rail, rounded_box("rail_cut", (BODY_W - 2 * RAIL_W, BODY_H - 2 * RAIL_W, THICK * 3),
                           max(CORNER_R - RAIL_W, 0.01), corner, alu))
bevel(rail, 0.005, 3)
smooth(rail)

bezel = rounded_box("bezel", (GLASS_W, GLASS_H, BEZEL_T), max(CORNER_R - RAIL_W - GLASS_INSET, 0.01),
                    corner, ink, location=(0, 0, z0 + BEZEL_T / 2))
front_glass = rounded_box("front_glass", (GLASS_W, GLASS_H, GLASS_T),
                          max(CORNER_R - RAIL_W - GLASS_INSET, 0.01), corner, glass,
                          location=(0, 0, z0 + z_glass_bot + GLASS_T / 2))

screen = rounded_box("screen", (SCREEN_W, SCREEN_H, SCREEN_T), 0.07, corner + 2, screen_off,
                     location=(0, 0, z0 + z_bezel_top + SCREEN_T / 2))
island = rounded_box("island", (0.24, 0.065, ISLAND_T), 0.032, corner, ink,
                     location=(0, 0.83, z0 + z_screen_top + ISLAND_T / 2))

# Camera island: a rounded square standing proud of the back by a couple of
# millimetres, with lens rings that only just clear its surface — the first
# pass let the domed glass poke out nearly 2cm, reading as bulging eyes rather
# than flush modern camera glass.
BUMP_OUTER = -FRONT - 0.016                  # plateau's outer (proud) face
bump = [rounded_box("bump", (0.40, 0.40, 0.016), 0.09, corner, body,
                    location=(BUMP[0], BUMP[1], (-FRONT + BUMP_OUTER) / 2), rim=0.005, rim_segs=3)]
for i, (dx, dy) in enumerate(((-0.09, 0.09), (0.09, 0.09), (-0.09, -0.09))[:lens_count]):
    x, y = BUMP[0] + dx, BUMP[1] + dy
    bump.append(cylinder(f"lens_ring_{i}", 0.072, 0.012, BUMP_OUTER - 0.005, s, ink, x=x, y=y))
    bump.append(place(hemisphere(f"lens_{i}", 0.050, BUMP_OUTER - 0.011, s, lens_glass,
                                 keep="lower", flatten=0.18), (x, y, BUMP_OUTER - 0.011)))
bump.append(cylinder("flash", 0.028, 0.008, BUMP_OUTER - 0.003, s, flash,
                     x=BUMP[0] + 0.09, y=BUMP[1] - 0.09))
camera_bump = join("camera_bump", bump)

buttons = join("buttons", [
    box(n, (0.012, h, 0.042), (x, y, 0), alu)
    for n, x, y, h in (("vol_up", -0.474, 0.52, 0.15),
                       ("vol_down", -0.474, 0.34, 0.15),
                       ("power", 0.474, 0.42, 0.22))
])
bevel(buttons, 0.004, 2)

# Speaker grille: short black cylinders through the bottom rail. Their caps end a
# hair outside the alu, so each one reads as a hole rather than as a buried plug.
speaker = join("speaker", [
    place(cylinder(f"hole_{i}", 0.012, 0.045, 0.0, s, ink), (x, -0.99, 0), (deg(90), 0, 0))
    for i, x in enumerate((j - (hole_count - 1) / 2) * 0.035 for j in range(hole_count))
])

# Stand the flat build upright; see the module docstring for why this angle.
UP = mathutils.Matrix.Rotation(deg(90), 3, "X")
parts = [back, rail, bezel, front_glass, screen, island, camera_bump, buttons, speaker]
for part in parts:
    part.location = UP @ part.location
    part.rotation_euler = (UP @ part.rotation_euler.to_matrix()).to_euler()

print(f"phone: screen {tuple(round(v, 4) for v in screen.dimensions)}, "
      f"aspect {screen.dimensions.x / screen.dimensions.y:.6f}")
yup_plane(screen)

root = group("phone", parts)
export(root, a.out)
