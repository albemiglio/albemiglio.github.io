"""Two-piece capsule with loose beads inside.

Units are the capsule length (2.0 = 21 mm), radius 0.42. Each half is one open
surface — a hemisphere whose cut boundary is extruded down into the barrel — so
Solidify can give it a real wall and the exploded view shows the shell thickness
at the rim. Joining a separate cap to a separate tube would leave two coincident
boundary loops there and Solidify would build a wall on each.

Both halves are modelled along +Z with the rim on the origin, then turned to lie
along X: the origin stays on the seam, so pulling the two nodes apart along the
capsule axis is a pure translation from the pose they are exported in.

Reading the beads through the clear half is the whole point of the object, and
it is a lens problem, not a lighting one. The controlling variable turned out to
be the index of refraction, and only that. Rendered at IOR 1.45 the spherical end
cap still shows the bead inside it — two concentric spheres refract an object near
their common centre almost cleanly — while the barrel, two concentric *cylinders*
seen at 39 degrees off their normal, erases the other three outright: they do not
come back at a 0.005 wall (a quarter of the one here), at roughness 0, or under a
four-times finer mesh. Sweeping the index instead, all four beads are crisp at
1.04-1.06, teardrop-smeared at 1.10, and gone by 1.20. So the shell is an
index-matched window at 1.05: a deliberate departure from the 1.45 of real
polystyrene, and the price of the brief's "the shell must show four beads
inside". It reaches the WebGL scene through KHR_materials_ior, where it buys the
same legibility.

Two things the index does not have to pay for: the wall, and the veil. The clear
half is solidified at 0.02 against the opaque half's 0.04 — thin plastic is what
a see-through blister half is, and the exploded view still has the 0.04 rim to
show — and transmission goes to 0.92, since the leftover diffuse lobe of a white
base colour is what used to veil the beads behind a milky surface.

The beads themselves are opaque and alternate deep teal with white so that
neighbours separate by value as well as by size, and they carry no emission —
a glowing bead exports as `emissiveFactor` and would self-light in the WebGL
scene, which the visual direction forbids. What replaced it is in
`render_fallback.py`: clear parts are taken out of the shadow pass, so the key
light reaches what is sealed behind them instead of being blocked at the surface.
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
WALL = 0.04         # opaque half: thick enough to read as a moulded shell
WALL_CLEAR = 0.02   # clear half: the beads are behind it, so half the meniscus

teal = pbr("teal", (0.35, 0.78, 0.76), roughness=0.35)
# Clear plastic. Base colour near white tints the transmitted light barely at
# all; the 0.08 that is not transmitted is the satin sheen that keeps it plastic
# rather than glass. Alpha is the glTF fallback for viewers without
# KHR_materials_transmission; the Cycles pass forces it back to 1 so the surface
# is not blended twice. The `label` band shares this material and reads as a
# clear collar moulded onto the opaque half.
white = pbr("white", (0.97, 0.99, 0.99), roughness=0.05, alpha=0.35,
            transmission=0.92, ior=1.05)
metal = pbr("metal", (0.82, 0.83, 0.86), roughness=0.3, metallic=1.0)
# Two colours alternating along the row: a deep teal that holds its value against
# the lit shell and a plain white that reads as the brightest thing in the frame.
# Roughness 0.3 gives each bead one compact specular highlight, which is what
# tells the eye it is looking at a sphere. The second teal and the second white
# are a shade off their partners — loose beads are not injection-moulded to match,
# and byte-identical materials are merged by `gltf-transform optimize`'s dedup
# pass, which would drop bead_c and bead_d from the file and break the name
# contract the exploded view reads.
bead_mats = [pbr(name, rgb, roughness=0.3)
             for name, rgb in (("bead_a", (0.05, 0.35, 0.35)),
                               ("bead_b", (0.95, 0.95, 0.95)),
                               ("bead_c", (0.05, 0.31, 0.33)),
                               ("bead_d", (0.91, 0.93, 0.94)))]


def half_shell(name, material, sign, wall):
    """Open half capsule: a hemisphere at z = TUBE whose cut rim is extruded down
    to z = 0, given its `wall` by Solidify and then laid along `sign` * X."""
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
    solidify(o, wall)
    smooth(o)
    o.rotation_euler = (0, deg(90) * sign, 0)
    return o


def ring(name, outer, inner, depth, material):
    """Band clamped around the capsule: a disc with its middle bored out. The
    cutter is deeper than the band so the boolean never sees two coplanar caps."""
    o = cylinder(name, outer, depth, 0.0, s, material)
    subtract(o, cylinder(f"{name}_bore", inner, depth * 3, 0.0, s, material))
    return o


shell_a = half_shell("shell_a", teal, 1, WALL)
shell_b = half_shell("shell_b", white, -1, WALL_CLEAR)

seam = place(ring("seam", 0.43, 0.395, 0.03, metal), (0, 0, 0), (0, deg(90), 0))
bevel(seam, 0.004, 2)
smooth(seam)

# Label: a band on the teal half with one slot engraved into its outer wall,
# facing -Y — the side the fallback render is shot from.
label = ring("label", 0.44, 0.412, 0.26, white)
subtract(label, box("label_mark", (0.05, 0.03, 0.15), (0, -0.442, 0), white))
smooth(label)
place(label, (0.42, 0, 0), (0, deg(90), 0))

# All four beads under the clear half (x from 0 at the seam to -1.0 at the cap),
# laid out largest-first and offset off the axis by different amounts in Y and Z
# so they read as loose beads at four depths rather than as a threaded row. Their
# diameters plus the gaps between them come to more than nine tenths of the half,
# so the row is packed: neighbours clear each other in space, not along the axis.
# The Y bias is towards the camera side (-Y), and bead4 needs the most of it —
# the camera looks down the axis from the opaque half's end, so a bead near the
# seam is only visible if its sight line leaves the barrel radius before it
# reaches the teal wall. bead1 gets the least: it sits inside the end cap, where
# sqrt(dx**2 + r_yz**2) + radius has to stay under R - WALL_CLEAR.
beads = [
    sphere(f"bead{i + 1}", radius, (x, y, z), s, bead_mats[i])
    for i, (radius, x, y, z) in enumerate(((0.15, -0.79, -0.10, 0.05),
                                           (0.09, -0.56, -0.23, -0.09),
                                           (0.12, -0.36, -0.14, 0.10),
                                           (0.07, -0.18, -0.29, -0.04)))
]

print(f"capsule: length {2 * (TUBE + R):.2f}, clear bore radius {R - WALL_CLEAR:.2f}, "
      f"largest bead {max(b.dimensions.x for b in beads) / 2:.2f}")

root = group("capsule", [shell_a, shell_b, seam, *beads, label])
export(root, a.out)
