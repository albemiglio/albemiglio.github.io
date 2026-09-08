"""Render a GLB to a transparent PNG lit with the chapter colour. Run: Blender -b --python render_fallback.py -- --glb X --color #hex --out Y."""
import argparse
import sys

import bpy
import mathutils


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


argv = sys.argv[sys.argv.index("--") + 1:]
p = argparse.ArgumentParser()
p.add_argument("--glb", required=True)
p.add_argument("--color", required=True)
p.add_argument("--out", required=True)
p.add_argument("--size", type=int, default=1600)
a = p.parse_args(argv)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a.glb)

scene = bpy.context.scene
engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
scene.render.resolution_x = scene.render.resolution_y = a.size
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.025, 0.03, 1)
scene.world = world

# Look-at camera: aiming manually with Euler angles put the object in the
# upper part of the frame (fixed camera pitch does not account for the
# object's actual bounding box). Pointing -Z at the object's centre keeps it
# centred regardless of the object's exact dimensions.
cam_loc = mathutils.Vector((2.6, -2.9, 1.85))
target = mathutils.Vector((0, 0, 0.55))
bpy.ops.object.camera_add(location=cam_loc)
cam = bpy.context.active_object
forward = (target - cam_loc).normalized()
cam.rotation_euler = forward.to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 50
scene.camera = cam

# Camera-relative basis so "key light from the upper right" means upper
# right of the rendered frame, not an arbitrary world-space guess.
world_up = mathutils.Vector((0, 0, 1))
right = forward.cross(world_up).normalized()
up = right.cross(forward).normalized()

key_rgb = hex_rgb(a.color)


def area_light_at(name, loc, aim_at, energy, color=(1, 1, 1), size=2.0):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.active_object
    l.name = name
    direction = (aim_at - mathutils.Vector(loc)).normalized()
    l.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    l.data.energy = energy
    l.data.color = color
    l.data.size = size
    return l


key_loc = target + right * 2.6 + up * 2.4 + forward * -0.5
fill_loc = target + right * -2.8 + up * 1.2 + forward * -1.0
rim_loc = target + right * -0.5 + up * 1.8 + forward * 2.5

area_light_at("key", key_loc, target, 1600, key_rgb, 2.5)
area_light_at("fill", fill_loc, target, 120, (1, 1, 1), 3.0)
area_light_at("rim", rim_loc, target, 350, (1, 1, 1), 1.5)

scene.render.filepath = a.out
bpy.ops.render.render(write_still=True)
