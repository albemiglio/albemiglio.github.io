"""Indoor dome IP camera.

Proportions follow a real ceiling dome camera, in units of the base radius
(1.0 = 55 mm): base diameter 2.0, total height ~1.25, dome diameter 1.70, and a
low body so the dome dominates. Every part is its own node so the exploded view
in the site can move them independently; `dome`, `lens`, `body`, `base` and
`board` are a name contract with the React side.
"""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from common import (args, bevel, box, cylinder, deg, export, group, hemisphere, join,  # noqa: E402
                    pbr, place, reset, segments, solidify, sphere)

a = args()
reset()
s = segments(a.lod)
small = min(s, 16)
led_count = 8 if a.lod == "low" else 12

# Where the optical module sits inside the dome, and how far it tilts forward
# (toward -Y, the side the fallback render looks from).
FACE = (0.0, 0.03, 0.60)
TILT = (deg(20), 0.0, 0.0)

shell = pbr("shell", (0.90, 0.90, 0.885), roughness=0.45)
black = pbr("black", (0.045, 0.045, 0.05), roughness=0.7)
dark = pbr("dark", (0.025, 0.025, 0.03), roughness=0.25)
metal = pbr("metal", (0.84, 0.85, 0.88), roughness=0.28, metallic=1.0)
# Smoke tint, not the near-black of the spec sketch: the Principled tint is applied
# at every surface crossing, so a 0.05 base through a solidified shell renders as
# an opaque black ball and hides the lens and the LED ring behind it.
glass = pbr("glass", (0.36, 0.38, 0.44), roughness=0.06, alpha=0.55, transmission=0.9, ior=1.45)
lens_glass = pbr("lens_glass", (0.02, 0.03, 0.05), roughness=0.05, transmission=0.85, ior=1.52)
led = pbr("led", (0.22, 0.02, 0.03), roughness=0.12, emission=(0.6, 0.03, 0.03), emission_strength=0.6)
status = pbr("status", (0.10, 0.55, 0.25), roughness=0.15, emission=(0.2, 1.0, 0.4), emission_strength=1.5)
board_mat = pbr("board", (0.12, 0.35, 0.22), roughness=0.7)

# Base: flat mounting flange, 0.00 - 0.10.
base = cylinder("base", radius=1.0, depth=0.10, z=0.05, segs=s, material=shell)
bevel(base, 0.015)

# Screws on the exposed flange rim, at 120 degrees. Each is a head ring with a
# recessed centre disc, which reads as a fastener without a boolean cut.
screw_parts = []
for i in range(3):
    ang = deg(90 + i * 120)
    x, y = 0.96 * math.cos(ang), 0.96 * math.sin(ang)
    screw_parts.append(cylinder(f"screw{i}", 0.038, 0.030, 0.105, small, metal, x=x, y=y))
    screw_parts.append(cylinder(f"slot{i}", 0.025, 0.020, 0.098, small, metal, x=x, y=y))
screws = join("screws", screw_parts)
bevel(screws, 0.004)

# Body: a low drum, 0.10 - 0.32, split by a recessed dark groove that breaks the
# silhouette the way a real two-part housing does.
body = join("body", [
    cylinder("body_lower", radius=0.92, depth=0.135, z=0.1675, segs=s, material=shell),
    cylinder("body_groove", radius=0.885, depth=0.045, z=0.2575, segs=s, material=black),
    cylinder("body_upper", radius=0.92, depth=0.040, z=0.300, segs=s, material=shell),
])
bevel(body, 0.012)

# Clamping ring that holds the dome down, 0.32 - 0.44.
ring = cylinder("ring", radius=0.88, depth=0.12, z=0.38, segs=s, material=black)
bevel(ring, 0.02)

board = box("board", size=(0.5, 0.35, 0.02), location=(0, 0, 0.22), material=board_mat)

# Gimbal bowl carrying the optics, tilted with the lens.
cradle = hemisphere("cradle", radius=0.55, z=0.0, segs=s, material=black,
                    keep="lower", fill=True, flatten=0.6)
place(cradle, FACE, TILT)

# Lens module, built along +Z at the origin so the whole stack pivots on the
# cradle face: dark barrel, brushed-metal bezel, convex glass front element.
lens = join("lens", [
    cylinder("barrel", radius=0.20, depth=0.28, z=0.14, segs=s, material=dark),
    cylinder("bezel", radius=0.265, depth=0.06, z=0.275, segs=s, material=metal),
    hemisphere("element", radius=0.19, z=0.255, segs=s, material=lens_glass, flatten=0.5),
])
bevel(lens, 0.008)
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
place(lens, FACE, TILT)

# Infrared LED ring set into the cradle face around the lens.
leds = join("leds", [
    sphere(f"led{i}", 0.045,
           (0.36 * math.cos(deg(i * 360 / led_count)), 0.36 * math.sin(deg(i * 360 / led_count)), 0.02),
           max(8, small - 4), led)
    for i in range(led_count)
])
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
place(leds, FACE, TILT)

status_led = cylinder("status_led", radius=0.04, depth=0.04, z=0.21, segs=small, material=status, y=-0.905)
status_led.rotation_euler = (deg(90), 0, 0)

# Dome: an open hemisphere given real thickness by Solidify. Bisecting without a
# fill keeps the rim clean; the earlier filled ngon shaded badly along the edge.
dome = hemisphere("dome", radius=0.85, z=0.40, segs=s, material=glass, fill=False)
solidify(dome, 0.03)

root = group("ipcam", [base, screws, body, ring, board, cradle, lens, leds, status_led, dome])
export(root, a.out)
