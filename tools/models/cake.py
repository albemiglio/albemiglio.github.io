"""Three-tier frosted cake on a metal stand.

Units are the bottom tier diameter (1.8 = 220 mm). Everything is built around the
Z axis and each node's origin sits on its own base, so the site's exploded view
lifts a tier — or the cream cordon that belongs to it — straight up by one offset
without a pivot correction.

A tier is one node with two material slots: the sponge cylinder and, over it, a
frosting cylinder 0.02 wider and 0.02 taller. The frosting starts a little above
the tier base rather than at it, leaving a band of sponge showing; a coat that
reached the plate would hide the sponge slot completely and the cake would read
as one lump of pink.
"""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from common import (args, bevel, cylinder, deg, export, group, join, pbr, place,  # noqa: E402
                    reset, smooth, sphere)

a = args()
reset()
low = a.lod == "low"
s = 16 if low else 64
bead_segs = 12 if low else 20
bead_count = 10 if low else 16
berry_count = 2 if low else 4      # per cordon, on tiers 1 and 2

COAT = 0.02        # how far the frosting stands proud of the sponge
SKIRT = 0.08       # bare sponge left at the foot of each tier
BEAD = 0.06

metal = pbr("metal", (0.82, 0.83, 0.86), roughness=0.35, metallic=1.0)
sponge = pbr("sponge", (0.93, 0.82, 0.60), roughness=0.8)
frosting = pbr("frosting", (0.95, 0.79, 0.85), roughness=0.55)
cherry = pbr("cherry", (0.72, 0.06, 0.10), roughness=0.12)
stem = pbr("stem", (0.25, 0.45, 0.16), roughness=0.5)
berry = pbr("berry", (0.35, 0.05, 0.10), roughness=0.3)


def base_origin(obj, z):
    """Move `obj`'s origin onto the cake axis at height `z` — its own base."""
    bpy.context.scene.cursor.location = (0, 0, z)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.context.scene.cursor.location = (0, 0, 0)
    return obj


# Stand: foot, stem and plate, 0.00 - 0.43.
PLATE_TOP = 0.43
stand = join("stand", [
    cylinder("stand_foot", 0.50, 0.05, 0.025, s, metal),
    cylinder("stand_stem", 0.08, 0.35, 0.225, s, metal),
    cylinder("stand_plate", 1.05, 0.03, PLATE_TOP - 0.015, s, metal),
])
bevel(stand, 0.012, 3)
smooth(stand)
base_origin(stand, 0.0)

tiers, creams, rims = [], [], []
z = PLATE_TOP
for i, (radius, height) in enumerate(((0.90, 0.36), (0.65, 0.32), (0.42, 0.28)), start=1):
    coat_bottom = z + SKIRT
    coat_top = z + height + COAT
    tier = join(f"tier{i}", [
        cylinder(f"tier{i}_sponge", radius, height, z + height / 2, s, sponge),
        cylinder(f"tier{i}_coat", radius + COAT, coat_top - coat_bottom,
                 (coat_bottom + coat_top) / 2, s, frosting),
    ])
    bevel(tier, 0.010, 2)
    smooth(tier)
    base_origin(tier, z)
    tiers.append(tier)

    # Piped cream: one bead per step just inside the frosting rim and sunk a
    # little into it. Centred on the rim itself each bead would hang half its
    # width over the side wall, with a lit gap under it that reads as a mistake.
    rim = radius + COAT - BEAD * 0.85
    cream = join(f"cream{i}", [
        sphere(f"cream{i}_{k}", BEAD,
               (rim * math.cos(deg(k * 360 / bead_count)),
                rim * math.sin(deg(k * 360 / bead_count)), coat_top - 0.008),
               bead_segs, frosting)
        for k in range(bead_count)
    ])
    base_origin(cream, coat_top)
    creams.append(cream)
    rims.append((rim, coat_top))
    z = coat_top

TOP = z  # top of the third tier's frosting

# Berries nestled in the gaps of the two lower cordons. The angle steps by whole
# bead pitches plus half of one: a plain 360/berry_count lands back on a bead and
# perches the berry on top of it.
def berry_angle(k):
    return deg((k * bead_count / berry_count + 0.5) * 360 / bead_count)


berries = join("berries", [
    sphere(f"berry_{t}_{k}", 0.045,
           (rim * math.cos(berry_angle(k)), rim * math.sin(berry_angle(k)), rim_z + 0.012),
           bead_segs, berry)
    for t, (rim, rim_z) in enumerate(rims[:2])
    for k in range(berry_count)
])
base_origin(berries, rims[0][1])

# Cherry with a stem leaning towards the camera side (-Y).
TILT = deg(18)
cherry_ball = sphere("cherry", 0.09, (0, 0, TOP + 0.085), s, cherry)
stalk = place(cylinder("stalk", 0.012, 0.24, 0.0, max(8, s // 4), stem),
              (0, -0.24 / 2 * math.sin(TILT), TOP + 0.175 + 0.24 / 2 * math.cos(TILT)),
              (TILT, 0, 0))
topper = join("topper", [cherry_ball, stalk])
base_origin(topper, TOP)

root = group("cake", [stand, *tiers, *creams, topper, berries])
export(root, a.out)
