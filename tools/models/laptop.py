"""Open 14-inch notebook.

Units are the base width (2.0 = 315 mm). The lid pivots on the hinge line at the
back of the deck: 80 degrees of rotation about that line is a 100-degree opening
angle, because the angle a laptop is "open" by is measured from the closed lid,
not from the deck plane.

`lid`, `bezel` and `screen` are modelled in the lid's own frame — flat, growing
from the hinge along +Y — and then placed with that same transform baked into
their object matrix. So `screen` ends up a direct child of the root with the
right world pose: the site anchors its UI on `screen.matrixWorld` and must not
have to walk a parent chain to get it.
"""
import os
import sys

import bpy
import mathutils

sys.path.insert(0, os.path.dirname(__file__))
from common import (args, bevel, box, cylinder, deg, export, group, join, pbr,  # noqa: E402
                    place, reset, rounded_box, segments, smooth, subtract,
                    yup_plane)

a = args()
reset()
low = a.lod == "low"
s = 16 if low else segments(a.lod)
corner = 3 if low else 6
cols, rows = (10, 4) if low else (14, 5)

alu = pbr("alu", (0.80, 0.81, 0.83), roughness=0.35, metallic=1.0)
black = pbr("black", (0.045, 0.045, 0.05), roughness=0.6)
screen_off = pbr("screen_off", (0.02, 0.02, 0.025), roughness=0.1)
key = pbr("key", (0.18, 0.18, 0.20), roughness=0.5)
rubber = pbr("rubber", (0.05, 0.05, 0.05), roughness=0.9)
# The trackpad is the one dark surface that has to look like glass; `black` at
# roughness 0.6 renders it as a dead patch of plastic.
glass_pad = pbr("trackpad", (0.06, 0.06, 0.07), roughness=0.25)

DECK = 0.08                       # top face of the base
HINGE = (0.0, 0.60, 0.085)        # hinge axis, parallel to X
OPEN = deg(80)
LID = mathutils.Matrix.Rotation(OPEN, 3, "X")
KB_Y, KB_Z = 0.15, 0.06           # keyboard well centre and floor
PITCH = 0.12                      # key pitch: 0.10 cap + 0.02 gap

# Base: a thick deck over a slightly smaller under-slab, so the chassis reads as
# tapered from every side instead of as one blunt brick.
base = join("base", [
    box("deck", (2.0, 1.35, 0.06), (0, 0, 0.05), alu),
    box("under", (1.96, 1.31, 0.02), (0, 0, 0.01), alu),
])
# Both wells are cut in one boolean; the bevel afterwards softens their rims too.
subtract(base, join("wells", [
    box("kb_well", (1.74, 0.64, 0.04), (0, KB_Y, DECK), black),
    box("tp_well", (0.72, 0.47, 0.016), (0, -0.42, DECK), black),
]))
bevel(base, 0.010)
smooth(base)

# Keyboard: black well plate plus the key caps, one mesh with two material slots.
keys = [box("kb_plate", (1.70, 0.60, 0.01), (0, KB_Y, KB_Z + 0.005), black)]
for r in range(rows):
    y = KB_Y + (r - (rows - 1) / 2) * PITCH
    for c in range(cols):
        x = (c - (cols - 1) / 2) * PITCH
        if r == 0 and abs(x) < 0.36:      # front row: the space bar's slot
            continue
        keys.append(box(f"key_{r}_{c}", (0.10, 0.10, 0.015), (x, y, KB_Z + 0.0175), key))
keys.append(box("space", (0.60, 0.10, 0.015),
                (0, KB_Y - (rows - 1) / 2 * PITCH, KB_Z + 0.0175), key))
keyboard = join("keyboard", keys)
bevel(keyboard, 0.005, 2)

trackpad = box("trackpad", (0.70, 0.45, 0.005), (0, -0.42, DECK - 0.0055), glass_pad)
bevel(trackpad, 0.002, 2)
smooth(trackpad)

# Hinge: a bar between two slightly fatter barrels, laid along X.
hinge = join("hinge", [
    place(cylinder(n, r, d, 0.0, s, black), (x, HINGE[1], HINGE[2]), (0, deg(90), 0))
    for n, r, d, x in (("hinge_bar", 0.035, 1.60, 0.0),
                       ("hinge_cap_l", 0.045, 0.10, -0.80),
                       ("hinge_cap_r", 0.045, 0.10, 0.80))
])
bevel(hinge, 0.006, 2)

# Lid, in hinge-local coordinates: the slab with a raised rim around the display
# opening, which is what makes the bezel sit in a recess instead of on a flat face.
RIM_W, RIM_H = 0.03, 0.008
lid = join("lid", [
    box("lid_slab", (2.0, 1.30, 0.05), (0, 0.67, -0.025), alu),
    box("rim_l", (RIM_W, 1.30, RIM_H), (-1.0 + RIM_W / 2, 0.67, RIM_H / 2), alu),
    box("rim_r", (RIM_W, 1.30, RIM_H), (1.0 - RIM_W / 2, 0.67, RIM_H / 2), alu),
    box("rim_b", (2.0 - 2 * RIM_W, RIM_W, RIM_H), (0, 0.02 + RIM_W / 2, RIM_H / 2), alu),
    box("rim_t", (2.0 - 2 * RIM_W, RIM_W, RIM_H), (0, 1.32 - RIM_W / 2, RIM_H / 2), alu),
])
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
bevel(lid, 0.008)
place(lid, HINGE, (OPEN, 0, 0))

bezel = rounded_box("bezel", (1.94, 1.24, 0.004), 0.02, corner, black, location=(0, 0.67, 0.002))
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
place(bezel, HINGE, (OPEN, 0, 0))

# 16:10 panel, sitting 0.0015 proud of the bezel and 0.0025 below the lid rim.
screen = rounded_box("screen", (1.86, 1.1625, 0.0015), 0.018, corner, screen_off)
screen.location = mathutils.Vector(HINGE) + LID @ mathutils.Vector((0.0, 0.67, 0.0055))
screen.rotation_euler = (OPEN, 0, 0)

feet = join("feet", [
    cylinder(f"foot_{i}", 0.055, 0.012, -0.006, s, rubber, x=sx * 0.82, y=sy * 0.52)
    for i, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1)))
])
bevel(feet, 0.003, 2)

# Ports on the left flank. They only poke a hair out of the side wall, so what
# reads is the dark slot, not a tab.
port_ys = [0.14] if low else [0.34, 0.14, -0.06]
ports = join("ports", [
    box(f"port_{i}", (0.008, 0.10, 0.026), (-0.9985, y, 0.048), black)
    for i, y in enumerate(port_ys)
])

print(f"laptop: screen {tuple(round(v, 4) for v in screen.dimensions)}, "
      f"aspect {screen.dimensions.x / screen.dimensions.y:.4f}")
yup_plane(screen)

root = group("laptop", [base, keyboard, trackpad, hinge, lid, bezel, screen, feet, ports])
export(root, a.out)
