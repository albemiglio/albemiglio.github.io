"""Member card with a chip, a hologram and a QR block.

Units are the card width (1.6 = 85.6 mm, ISO 7810 scaled), height 1.0, thickness
0.03. Every part is modelled flat in XY with the printed face towards +Z, and its
origin is then moved to the card centre so the site's exploded view can push each
node straight out along the card normal without unpicking a parent transform.
`yup_plane` keeps that normal on local Z in the exported file.

The finished stack rests on its lower edge, laid back at a slight angle rather
than stood nearly upright: propped on its thin edge the card only ever touches
the surface along a line, which casts no shadow anyone can see and reads as
floating no matter how it is lit. Laid back it rests on a real footprint, the
occlusion under it is strong enough to show up against a near-black page, and
the printed face still opens up nicely to a camera shooting from 24 degrees
above.
"""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from common import (args, bevel, box, cylinder, deg, export, group, join, pbr,  # noqa: E402
                    reset, rounded_box, smooth, subtract, yup_plane)

a = args()
reset()
low = a.lod == "low"
s = 16 if low else 48
corner = 4 if low else 10

W, H, T = 1.6, 1.0, 0.03
FRONT = T / 2          # z of the printed face
BACK = -T / 2
LEAN = deg(35)         # laid back 55 degrees off vertical, resting on a real footprint

plastic = pbr("plastic", (0.92, 0.96, 0.93), roughness=0.4)
black = pbr("black", (0.05, 0.05, 0.055), roughness=0.55)
gold = pbr("gold", (0.85, 0.70, 0.35), roughness=0.3, metallic=1.0)
photo_mat = pbr("photo", (0.55, 0.58, 0.60), roughness=0.5)
green = pbr("green", (0.42, 0.80, 0.54), roughness=0.35)
holo = pbr("holo", (0.80, 0.85, 0.90), roughness=0.1, metallic=0.6)

# A 7x7 block is too small for real finder patterns, so this is a fixed,
# QR-shaped arrangement: solid anchors in three corners, noise between them.
QR_PATTERN = (
    "1101011",
    "1100110",
    "0010101",
    "1011010",
    "0101101",
    "1100011",
    "1110100",
)

plate = rounded_box("plate", (W, H, T), 0.05, corner, plastic, rim=0.004, rim_segs=2)

# Magnetic stripe, on the back. It stops just short of the side walls: run out to
# the full width and it lands exactly on the plate's bevelled edge, where it
# shows as a dark hairline breaking the card's silhouette.
stripe = box("stripe", (W - 0.02, 0.16, 0.002), (0, 0.25, BACK - 0.001), black)

# Chip: a gold pad cut by one horizontal and three vertical grooves, which is the
# 2 x 4 contact grid of a real smart card. The cutter runs past both faces so the
# boolean never has to resolve coplanar caps, and the grooves are cut one at a
# time: joined into a single cutter they cross, and the exact solver reads the
# four overlaps as outside the cutter and leaves the pad whole.
CHIP = (-0.05, 0.10)
chip = box("chip", (0.22, 0.18, 0.004), (CHIP[0], CHIP[1], FRONT + 0.002), gold)
subtract(chip, box("groove_h", (0.24, 0.012, 0.02), (CHIP[0], CHIP[1], FRONT + 0.002), gold))
for i, dx in enumerate((-0.055, 0.0, 0.055)):
    subtract(chip, box(f"groove_v{i}", (0.012, 0.20, 0.02),
                       (CHIP[0] + dx, CHIP[1], FRONT + 0.002), gold))
bevel(chip, 0.0015, 2)
smooth(chip)

photo = box("photo", (0.36, 0.46, 0.002), (-0.52, 0.16, FRONT + 0.001), photo_mat)

# Card number, then name and surname, as bars under the photo.
text = join("text", [
    box(name, (w, h, 0.002), (x, y, FRONT + 0.001), black)
    for name, w, h, x, y in (("number", 0.62, 0.045, -0.39, -0.17),
                             ("name", 0.36, 0.030, -0.52, -0.29),
                             ("surname", 0.26, 0.030, -0.57, -0.38))
])

# QR: a white tile with the fixed pattern raised on it. Modules sit a hair short
# of the cell so neighbours never share a face.
QR = (0.55, -0.27)
CELL = 0.30 / 7
qr_parts = [box("qr_field", (0.30, 0.30, 0.002), (QR[0], QR[1], FRONT + 0.001), plastic)]
for r, row in enumerate(QR_PATTERN):
    for c, bit in enumerate(row):
        if bit == "1":
            qr_parts.append(box(
                f"qr_{r}_{c}", (CELL - 0.0006, CELL - 0.0006, 0.0015),
                (QR[0] + (c - 3) * CELL, QR[1] + (3 - r) * CELL, FRONT + 0.0025), black))
qr = join("qr", qr_parts)

# Logo: a filled disc inside a ring, both in the chapter green.
LOGO = (0.62, 0.32)
ring = cylinder("logo_ring", 0.09, 0.002, FRONT + 0.001, s, green, x=LOGO[0], y=LOGO[1])
subtract(ring, cylinder("logo_hole", 0.072, 0.02, FRONT + 0.001, s, green, x=LOGO[0], y=LOGO[1]))
logo = join("logo", [ring, cylinder("logo_dot", 0.045, 0.002, FRONT + 0.001, s, green,
                                    x=LOGO[0], y=LOGO[1])])

hologram = rounded_box("hologram", (0.25, 0.15, 0.002), 0.02, corner, holo,
                       location=(0.28, 0.10, FRONT + 0.001))

parts = [plate, stripe, chip, photo, qr, text, logo, hologram]

# One origin for the whole card, so the exploded view is a pure translation along
# the shared normal and the lean below is one rotation about that same point.
bpy.ops.object.select_all(action="DESELECT")
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")

for part in parts:
    part.rotation_euler = (LEAN, 0, 0)
    yup_plane(part)

root = group("card", parts)
export(root, a.out)
