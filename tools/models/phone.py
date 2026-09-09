"""Modern slab phone with a metal rail.

Units are the body height (2.0 = 147 mm). Everything is modelled flat — the
display in the XY plane, facing +Z — because the rounded-rectangle profile is
built in XY, and then every part is stood upright by baking a +90 degree turn
about X into its object matrix. That turn is exactly the inverse of the glTF
y-up conversion, so in the exported file the phone stands along Y with the
screen facing +Z, and `screen` keeps a flat XY mesh centred on its own origin.
"""
import os
import sys

import mathutils

sys.path.insert(0, os.path.dirname(__file__))
from common import (args, bevel, box, cylinder, deg, export, group, hemisphere,  # noqa: E402
                    join, pbr, place, reset, rounded_box, segments, smooth, subtract,
                    yup_plane)

a = args()
reset()
low = a.lod == "low"
s = 16 if low else segments(a.lod)
corner = 4 if low else 8
lens_count = 1 if low else 3
hole_count = 3 if low else 6

alu = pbr("alu", (0.80, 0.81, 0.83), roughness=0.35, metallic=1.0)
black = pbr("black", (0.045, 0.045, 0.05), roughness=0.6)
screen_off = pbr("screen_off", (0.02, 0.02, 0.025), roughness=0.1)
lens_glass = pbr("lens_glass", (0.02, 0.03, 0.05), roughness=0.05, transmission=0.85, ior=1.52)

FRONT = 0.04                      # body half-thickness
RAIL = 0.043                      # frame half-height: the rail stands proud of the glass
BUMP = (-0.19, 0.70)              # camera island centre on the back

body = rounded_box("body", (0.92, 2.00, 0.08), 0.09, corner, black, rim=0.006, rim_segs=3)

# Frame: a rounded ring, cut rather than modelled, so its outer arcs and the
# body's stay concentric. The cutter is deeper than the frame in Z, so only the
# side walls intersect and the boolean has no coplanar faces to resolve.
frame = rounded_box("frame", (0.94, 2.02, RAIL * 2), 0.10, corner, alu)
subtract(frame, rounded_box("frame_cut", (0.905, 1.985, 0.24), 0.083, corner, alu))
bevel(frame, 0.005, 3)
smooth(frame)

# 9:19.5 panel, inside the rail and clear of the body's front face.
screen = rounded_box("screen", (0.86, 1.86, 0.0015), 0.07, corner + 2, screen_off,
                     location=(0, 0, FRONT + 0.0015))
notch = rounded_box("notch", (0.24, 0.07, 0.002), 0.035, corner, black,
                    location=(0, 0.83, FRONT + 0.0033))

# Camera island: a rounded square standing on the back, with black lens rings and
# domed glass raised above it.
bump = [rounded_box("bump", (0.40, 0.40, 0.02), 0.09, corner, black,
                    location=(BUMP[0], BUMP[1], -FRONT - 0.01), rim=0.005, rim_segs=3)]
for i, (dx, dy) in enumerate(((-0.09, 0.09), (0.09, 0.09), (-0.09, -0.09))[:lens_count]):
    x, y = BUMP[0] + dx, BUMP[1] + dy
    bump.append(cylinder(f"lens_ring_{i}", 0.075, 0.022, -0.071, s, black, x=x, y=y))
    bump.append(place(hemisphere(f"lens_{i}", 0.058, -0.078, s, lens_glass,
                                 keep="lower", flatten=0.25), (x, y, -0.078)))
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
    place(cylinder(f"hole_{i}", 0.012, 0.045, 0.0, s, black), (x, -0.99, 0), (deg(90), 0, 0))
    for i, x in enumerate((j - (hole_count - 1) / 2) * 0.035 for j in range(hole_count))
])

# Stand the flat build upright; see the module docstring for why this angle.
UP = mathutils.Matrix.Rotation(deg(90), 3, "X")
parts = [body, frame, screen, notch, camera_bump, buttons, speaker]
for part in parts:
    part.location = UP @ part.location
    part.rotation_euler = (UP @ part.rotation_euler.to_matrix()).to_euler()

print(f"phone: screen {tuple(round(v, 4) for v in screen.dimensions)}, "
      f"aspect {screen.dimensions.x / screen.dimensions.y:.4f}")
yup_plane(screen)

root = group("phone", parts)
export(root, a.out)
