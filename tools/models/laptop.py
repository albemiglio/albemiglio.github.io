"""Open 14-inch notebook.

Units are the base width (2.0 = 315 mm). The lid pivots on the hinge line at the
back of the deck: 75 degrees of rotation about that line is a 105-degree opening
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
from style import BEVEL_R, INK, mat  # noqa: E402

a = args()
reset()
low = a.lod == "low"
s = 16 if low else segments(a.lod)
corner = 3 if low else 6
key_corner = 1 if low else 2
cols, rows = (10, 6) if low else (14, 6)

alu = mat("alu", "alu")
ink = mat("ink", "ink")
# Keycaps sit a hair lighter than the well they stand in — the cue that reads
# as "matte keyboard" rather than "keys and well are the same flat colour".
key = pbr("key", tuple(min(1.0, c + 0.05) for c in INK), roughness=0.42)
screen_off = pbr("screen_off", (0.02, 0.02, 0.025), roughness=0.08)
rubber = pbr("rubber", (0.045, 0.045, 0.045), roughness=0.92)
# A trackpad is glass over glass-smooth diamond-cut aluminium, not painted
# plastic — same hue as `ink`, far lower roughness.
trackpad_mat = pbr("trackpad", INK, roughness=0.08)

# 2.0 = 312.6 mm, the real 14-inch width, so every other dimension can be taken
# from the same machine: 221.2 mm deep, 15.5 mm thick.
W, DEPTH, THICK = 2.0, 1.4152, 0.0992       # unibody envelope
DECK = THICK / 2                            # top face of the base
HINGE = (0.0, DEPTH / 2 - 0.045, DECK + 0.006)
OPEN = deg(75)                              # 180 - 75 = 105 degrees open
LID = mathutils.Matrix.Rotation(OPEN, 3, "X")
KB_Y, KB_Z = 0.14, DECK - 0.016             # keyboard well centre and floor
PITCH = 0.115                               # key pitch: cap + gap
KEY_CAP = 0.098
KEY_DISH_R = 0.010
TP_Y, TP_H = -0.44, 0.42                    # trackpad well centre/height, clear of the space row


def wedge(name, tri_yz, width, material):
    """Triangular prism, cross-section `tri_yz` (y, z) in the X=0 plane,
    solidified along X. A rotated-box cutter for a shallow taper is easy to
    mis-size into a slab-eating monster (it did, on the first try); a hand-built
    triangle whose corners sit exactly at the shell's own edge cannot overshoot."""
    pts = [(0.0, y, z) for y, z in tri_yz]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(pts, [], [list(range(len(pts)))])
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    mod = o.modifiers.new("extrude", "SOLIDIFY")
    mod.thickness = width
    mod.offset = 0.0
    bpy.ops.object.modifier_apply(modifier=mod.name)
    o.data.materials.append(material)
    return o


# --- base: one unibody slab, wells cut, then a shallow wedge shaved off the
# front-bottom edge so the chassis reads as tapered instead of a blunt brick.
base = box("shell", (W, DEPTH, THICK), (0, 0, 0), alu)
# Two sequential cuts, not one joined cutter: their footprints come within 0.02
# of touching, and Blender's exact boolean solver returns an empty mesh when a
# joined multi-part cutter has near-coincident geometry — it handles the same
# two cuts fine one at a time.
subtract(base, box("kb_well", (1.74, 0.66, 0.05), (0, KB_Y, DECK), ink))
subtract(base, box("tp_well", (0.706, TP_H + 0.006, 0.05), (0, TP_Y, DECK), ink))
TAPER_RUN, TAPER_LEAVE = 0.045, 0.020        # subtle: a 45-thou run down to a 20-thou lip
y_front = -DEPTH / 2
subtract(base, wedge("taper_cutter", [
    (y_front, -THICK / 2),
    (y_front + TAPER_RUN, -THICK / 2),
    (y_front, -THICK / 2 + (THICK - TAPER_LEAVE)),
], W * 1.1, alu))
bevel(base, BEVEL_R)
smooth(base)

# --- keyboard: a well plate plus dished keycaps, six rows, wider space/shift/
# enter and a small inverted-T arrow cluster carved out of the bottom-right.
ARROW_COLS = 2                              # main-grid columns freed for the cluster
keys = [box("kb_plate", (1.70, 0.60, 0.01), (0, KB_Y, KB_Z + 0.004), ink)]


def key_at(name, x, y, w=KEY_CAP):
    return rounded_box(name, (w, KEY_CAP, 0.016), KEY_DISH_R, key_corner, key,
                       location=(x, y, KB_Z + 0.018), rim=0.004, rim_segs=2)


for r in range(rows):
    y = KB_Y + (r - (rows - 1) / 2) * PITCH
    row_cols = cols - ARROW_COLS if r <= 1 else cols
    if r == 0:                              # bottom row: modifiers + long space
        continue
    # Only the enter row widens its last key: row 1 gives its right end to the
    # arrow cluster, and a wide key there lands on top of the arrows.
    wide = r == 3
    for c in range(row_cols):
        x = (c - (cols - 1) / 2) * PITCH
        if wide and c == row_cols - 1:
            keys.append(key_at(f"key_{r}_{c}", x + PITCH * 0.35, y, KEY_CAP * 1.8))
        else:
            keys.append(key_at(f"key_{r}_{c}", x, y, KEY_CAP))
space_y = KB_Y - (rows - 1) / 2 * PITCH
keys.append(key_at("space", -0.10, space_y, 0.62))
keys.append(key_at("mod_l", -0.10 - 0.31 - KEY_CAP / 2, space_y, KEY_CAP))
keys.append(key_at("mod_r", -0.10 + 0.31 + KEY_CAP / 2, space_y, KEY_CAP))

# Arrow cluster: inverted T, tucked in the bottom-right corner the grid left free.
arrow_x = (cols - 1 - ARROW_COLS / 2 - 0.5) * PITCH - (cols - 1) / 2 * PITCH
keys.append(key_at("arrow_left", arrow_x - PITCH * 0.55, space_y, KEY_CAP * 0.9))
keys.append(key_at("arrow_down", arrow_x + PITCH * 0.55, space_y, KEY_CAP * 0.9))
keys.append(key_at("arrow_right", arrow_x + PITCH * 1.65, space_y, KEY_CAP * 0.9))
keys.append(key_at("arrow_up", arrow_x + PITCH * 0.55, space_y + PITCH, KEY_CAP * 0.9))
keyboard = join("keyboard", keys)

trackpad = rounded_box("trackpad", (0.70, TP_H, 0.006), 0.014, corner, trackpad_mat,
                       location=(0, TP_Y, DECK - 0.003), rim=0.0015, rim_segs=2)

# Speaker grille: two patches of tiny holes flanking the keyboard well.
grille = []
for side in (-1, 1):
    gx = side * 0.865
    for row in range(2 if low else 3):
        for col in range(4 if low else 7):
            gy = 0.34 - col * 0.045
            grille.append(cylinder(f"hole_{side}_{row}_{col}", 0.006, 0.02, DECK - 0.006,
                                   8, ink, x=gx + row * 0.018, y=gy))
grille = join("grille", grille)

# Hinge: a bar between two slightly fatter barrels, its dark sleeve the only
# part that shows once the lid is open.
hinge = join("hinge", [
    place(cylinder(n, r, d, 0.0, s, ink), (x, HINGE[1], HINGE[2]), (0, deg(90), 0))
    for n, r, d, x in (("hinge_bar", 0.032, 1.62, 0.0),
                       ("hinge_cap_l", 0.042, 0.10, -0.80),
                       ("hinge_cap_r", 0.042, 0.10, 0.80))
])
bevel(hinge, 0.006, 2)

# --- lid, in hinge-local coordinates: a slab whose whole front face is the
# display's black glass, with only the slab's own edge left showing as metal.
# An earlier pass ran a raised aluminium lip around the opening; on a dark page
# that lip is a bright stepped ledge framing the product UI, and it is the one
# detail that reads loudest as "not the machine this is meant to be" — the real
# lid's glass is flush to within a millimetre of the edge.
LID_D, LID_THICK = DEPTH, 0.012
LID_Y = 0.02 + LID_D / 2
# The black glass covers the whole lid face, not just a collar around the panel:
# that is what puts the thin bezel at the sides and the deeper band above and
# below, where the real machine keeps its camera and its chin.
GLASS_INSET = 0.003                          # 0.5 mm of lid edge left as metal
# The site maps a capture of a real product onto this plane, so the plane's
# aspect is the capture's: a 14-inch MacBook Pro's logical display, 1512 x 982.
# Anything else and the handoff matrix carries a scale the eye reads as a skew.
SCREEN_W = 1.92                              # 300.2 mm: a 6.2 mm bezel each side
SCREEN_H = SCREEN_W * 982 / 1512
BEZEL_SIZE = (W - 2 * GLASS_INSET, LID_D - 2 * GLASS_INSET)
lid = box("lid_slab", (W, LID_D, LID_THICK), (0, LID_Y, -LID_THICK / 2), alu)
lid.name = "lid"
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
bevel(lid, BEVEL_R)
place(lid, HINGE, (OPEN, 0, 0))

bezel = rounded_box("bezel", (*BEZEL_SIZE, 0.004), 0.018, corner, ink, location=(0, LID_Y, 0.002))
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
place(bezel, HINGE, (OPEN, 0, 0))

# Anchored to the panel, not the lid: the camera belongs just above the image.
camera = rounded_box("camera", (0.014, 0.006, 0.002), 0.003, 2, ink,
                     location=(0, LID_Y + SCREEN_H / 2 + 0.030, 0.0035))
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
place(camera, HINGE, (OPEN, 0, 0))

# The panel, sitting a hair proud of the bezel so the two never z-fight.
screen = rounded_box("screen", (SCREEN_W, SCREEN_H, 0.0015), 0.014, corner, screen_off)
screen.location = mathutils.Vector(HINGE) + LID @ mathutils.Vector((0.0, LID_Y, 0.0055))
screen.rotation_euler = (OPEN, 0, 0)

feet = join("feet", [
    cylinder(f"foot_{i}", 0.055, 0.010, -THICK / 2 - 0.005, s, rubber, x=sx * 0.82, y=sy * 0.52)
    for i, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1)))
])
bevel(feet, 0.003, 2)

# Ports on the left flank. They only poke a hair out of the side wall, so what
# reads is the dark slot, not a tab.
port_ys = [0.14] if low else [0.34, 0.14, -0.06]
ports = join("ports", [
    box(f"port_{i}", (0.008, 0.10, 0.022), (-0.9985, y, 0.006), ink)
    for i, y in enumerate(port_ys)
])

print(f"laptop: screen {tuple(round(v, 4) for v in screen.dimensions)}, "
      f"aspect {screen.dimensions.x / screen.dimensions.y:.6f}")
yup_plane(screen)

root = group("laptop", [base, keyboard, trackpad, grille, hinge, lid, bezel, camera, screen, feet, ports])
export(root, a.out)
