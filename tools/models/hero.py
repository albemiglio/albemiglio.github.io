"""Hero sculpture fallback: the four chapter objects (high LOD), placed exactly where React
puts them inside the hero box per heroSlots.json, combined into one GLB for render_fallback.py
to shoot. heroSlots.json is the single source of truth for both sides.

Run: Blender -b --python hero.py -- --out X
"""
import json
import os
import sys

import bpy
import mathutils

sys.path.insert(0, os.path.dirname(__file__))
from common import args, export, group, reset  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Y-up (glTF / three.js, what heroSlots.json is written in) -> Z-up (Blender) change of basis:
# (x, y, z) -> (x, -z, y). The same conversion the glTF importer applies to the meshes it just
# brought in, applied here to the slot's own position/rotation so the objects land exactly where
# React places them inside the hero box.
C = mathutils.Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))

a = args()
reset()

with open(os.path.join(ROOT, "src", "scene", "heroSlots.json")) as f:
    slots = json.load(f)

roots = []
for name, slot in slots.items():
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "public", "models", f"{name}.glb"))
    # The root empty's name is a contract with the object's own build script (ipcam.py etc.):
    # group(name, ...) there names it after the object, and this is the only object in the file
    # with that exact name.
    obj = bpy.data.objects[name]

    x, y, z = slot["position"]
    pos_b = mathutils.Vector((x, -z, y))

    rx, ry, rz = slot["rotation"]
    r_g = mathutils.Euler((rx, ry, rz), "XYZ").to_matrix()
    r_b = (C @ r_g @ C.transposed()).to_4x4()

    obj.matrix_world = (
        mathutils.Matrix.Translation(pos_b) @ r_b @ mathutils.Matrix.Scale(slot["scale"], 4)
    )
    roots.append(obj)

root = group("hero", roots)
export(root, a.out)
