"""Dome IP camera: base, body, board, lens, dome. Parts are separate meshes so the exploded view can move them."""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from common import args, bevel, box, cylinder, deg, export, group, half_sphere, pbr, reset, segments  # noqa: E402

a = args()
reset()
s = segments(a.lod)

shell = pbr("shell", (0.92, 0.92, 0.90), roughness=0.55)
dark = pbr("dark", (0.10, 0.10, 0.11), roughness=0.5)
metal = pbr("metal", (0.75, 0.75, 0.78), roughness=0.25, metallic=1.0)
glass = pbr("glass", (0.05, 0.06, 0.08), roughness=0.1, alpha=0.55)
board_mat = pbr("board", (0.12, 0.35, 0.22), roughness=0.7)

base = cylinder("base", radius=1.0, depth=0.12, z=0.06, segs=s, material=shell)
bevel(base, 0.02)
body = cylinder("body", radius=0.9, depth=0.5, z=0.37, segs=s, material=shell)
bevel(body, 0.03)
board = box("board", size=(0.5, 0.35, 0.02), location=(0, 0, 0.30), material=board_mat)

lens = cylinder("lens", radius=0.25, depth=0.30, z=0.75, segs=s, material=metal)
bevel(lens, 0.01)
bpy.ops.mesh.primitive_uv_sphere_add(segments=s, ring_count=max(8, s // 2), radius=0.17, location=(0, 0, 0.90))
eye = bpy.context.active_object
eye.data.materials.append(dark)
bpy.ops.object.select_all(action="DESELECT")
lens.select_set(True); eye.select_set(True)
bpy.context.view_layer.objects.active = lens
bpy.ops.object.join()
lens.rotation_euler = (deg(20), 0, 0)

dome = half_sphere("dome", radius=0.85, z=0.62, segs=s, material=glass)

root = group("ipcam", [base, body, board, lens, dome])
export(root, a.out)
