"""Two-piece capsule with loose beads inside.

Units are the capsule length (2.0 = 21 mm), radius 0.42. Each half is one open
surface — a hemisphere whose cut boundary is extruded down into the barrel — so
Solidify can give it a real 0.04 wall and the exploded view shows the shell
thickness at the rim. Joining a separate cap to a separate tube would leave two
coincident boundary loops there and Solidify would build a wall on each.

Both halves are modelled along +Z with the rim on the origin, then turned to lie
along X: the origin stays on the seam, so pulling the two nodes apart along the
capsule axis is a pure translation from the pose they are exported in.
"""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from common import (args, bevel, box, cylinder, deg, export, group, pbr,  # noqa: E402
                    place, reset, smooth, solidify, sphere, subtract)

a = args()
reset()
low = a.lod == "low"
s = 16 if low else 48

R = 0.42
TUBE = 1.0 - R      # barrel length of each half, so a half measures 1.0
WALL = 0.04

teal = pbr("teal", (0.35, 0.78, 0.76), roughness=0.35)
# Thin translucent plastic, not glass. The IOR matters more than the transmission
# here: at 1.45 the 0.04 wall is a curved meniscus that bends the beads behind it
# into an unreadable smear, and the half renders as a dark tunnel. Near 1.1 it
# stays a window, keeps a soft edge highlight, and still reads as a milky band
# where the label wraps the opaque half. Alpha is the glTF fallback for viewers
# without KHR_materials_transmission.
white = pbr("white", (0.94, 0.97, 0.97), roughness=0.10, alpha=0.7,
            transmission=0.78, ior=1.10)
metal = pbr("metal", (0.82, 0.83, 0.86), roughness=0.3, metallic=1.0)
# The beads sit in a closed shell with every light outside it, so the only path
# that reaches them refracts through the wall — a caustic, which renders as noise
# at any sample count this build can afford. A low emission of each bead's own
# colour stands in for that bounced light and is what makes them read through the
# translucent half.
BEAD_GLOW = 0.9
bead_mats = [
    pbr(name, rgb, roughness=rough, emission=rgb, emission_strength=BEAD_GLOW)
    for name, rgb, rough in (("bead_a", (0.55, 0.88, 0.86), 0.3),
                             ("bead_b", (0.95, 0.96, 0.96), 0.35),
                             ("bead_c", (0.10, 0.42, 0.44), 0.3),
                             ("bead_d", (0.90, 0.93, 0.94), 0.35))
]


def half_shell(name, material, sign):
    """Open half capsule: a hemisphere at z = TUBE whose cut rim is extruded down
    to z = 0, given its wall by Solidify and then laid along `sign` * X."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=s, ring_count=max(8, s // 2), radius=R, location=(0, 0, TUBE))
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bisect(plane_co=(0, 0, TUBE), plane_no=(0, 0, 1),
                        clear_inner=True, use_fill=False)
    bpy.ops.mesh.select_mode(type="EDGE")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_non_manifold(extend=False, use_boundary=True, use_wire=False,
                                     use_multi_face=False, use_non_contiguous=False,
                                     use_verts=False)
    bpy.ops.mesh.extrude_region_move(TRANSFORM_OT_translate={"value": (0, 0, -TUBE)})
    bpy.ops.object.mode_set(mode="OBJECT")
    # The sphere left the origin at its own centre, half a barrel above the rim;
    # move it onto the rim so the turn below pivots on the seam and the exploded
    # view slides the half straight out of the other one.
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    o.data.materials.append(material)
    solidify(o, WALL)
    smooth(o)
    o.rotation_euler = (0, deg(90) * sign, 0)
    return o


def ring(name, outer, inner, depth, material):
    """Band clamped around the capsule: a disc with its middle bored out. The
    cutter is deeper than the band so the boolean never sees two coplanar caps."""
    o = cylinder(name, outer, depth, 0.0, s, material)
    subtract(o, cylinder(f"{name}_bore", inner, depth * 3, 0.0, s, material))
    return o


shell_a = half_shell("shell_a", teal, 1)
shell_b = half_shell("shell_b", white, -1)

seam = place(ring("seam", 0.43, 0.395, 0.03, metal), (0, 0, 0), (0, deg(90), 0))
bevel(seam, 0.004, 2)
smooth(seam)

# Label: a band on the teal half with one slot engraved into its outer wall,
# facing -Y — the side the fallback render is shot from.
label = ring("label", 0.44, 0.412, 0.26, white)
subtract(label, box("label_mark", (0.05, 0.03, 0.15), (0, -0.442, 0), white))
smooth(label)
place(label, (0.42, 0, 0), (0, deg(90), 0))

# Beads along the axis, three of them under the translucent half so the render
# shows them and the fourth under the opaque one, where the exploded view finds
# it. They are pushed towards -Y, the camera side, so each sits just behind the
# near wall: parked on the axis they read through twice as much glass and blur
# into the dark tunnel of the shell interior.
beads = [
    sphere(f"bead{i + 1}", radius, (x, y, z), s, bead_mats[i])
    for i, (radius, x, y, z) in enumerate(((0.12, -0.70, -0.18, 0.06),
                                           (0.09, -0.42, -0.20, -0.05),
                                           (0.15, -0.10, -0.16, 0.05),
                                           (0.07, 0.28, -0.22, 0.04)))
]

print(f"capsule: length {2 * (TUBE + R):.2f}, bore radius {R - WALL:.2f}, "
      f"largest bead {max(b.dimensions.x for b in beads) / 2:.2f}")

root = group("capsule", [shell_a, shell_b, seam, *beads, label])
export(root, a.out)
