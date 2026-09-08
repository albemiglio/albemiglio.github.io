"""Render a GLB as a studio product shot on a transparent background.

Run: Blender -b --python render_fallback.py -- --glb X --color #hex --out Y
Cycles on the Metal GPU renders the dome's real transmission and a soft ground
shadow; it falls back to CPU Cycles if the Metal device is unavailable.
"""
import argparse
import math
import sys

import bpy
import mathutils

# Framing: three-quarter view, raised enough that the dome, the lens and the LED
# ring around it are all visible at once.
AZIMUTH = 32.0
ELEVATION = 25.0
FILL = 0.80  # share of the frame half-width the object's widest point reaches
FOCAL = 55.0


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def use_gpu(scene):
    """Enable the Metal compute device; report whether it took."""
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.refresh_devices()
        for d in prefs.devices:
            d.use = d.type == "METAL"
        if any(d.type == "METAL" and d.use for d in prefs.devices):
            scene.cycles.device = "GPU"
            return "Metal GPU"
    except (KeyError, AttributeError, TypeError) as exc:
        print(f"render_fallback: Metal setup failed ({exc}), using the CPU")
    scene.cycles.device = "CPU"
    return "CPU"


def bounds(objects):
    """World-space vertices, centre and floor height of the imported meshes.
    Real vertices, not bounding-box corners: a box around a round object
    overstates its width and would frame the shot too loosely."""
    points = [obj.matrix_world @ v.co
              for obj in objects if obj.type == "MESH" for v in obj.data.vertices]
    lo = mathutils.Vector([min(pt[i] for pt in points) for i in range(3)])
    hi = mathutils.Vector([max(pt[i] for pt in points) for i in range(3)])
    return points, (lo + hi) / 2, lo.z, (hi - lo).length / 2


def fit_distance(points, centre, right, up, forward, half_fov):
    """Closest camera distance that still keeps every point inside FILL of the frame."""
    limit = FILL * math.tan(half_fov)
    return max(max(abs((pt - centre) @ right), abs((pt - centre) @ up)) / limit
               - (pt - centre) @ forward for pt in points)


def drop_fallback_alpha():
    """glTF carries Alpha as the fallback for viewers without KHR_materials_transmission.
    Cycles renders the transmission itself, so keeping both would blend the surface
    twice and turn clear glass milky."""
    for material in bpy.data.materials:
        bsdf = material.node_tree and material.node_tree.nodes.get("Principled BSDF")
        if bsdf and bsdf.inputs["Transmission Weight"].default_value > 0:
            bsdf.inputs["Alpha"].default_value = 1.0


def area_light(name, location, aim_at, energy, color, size):
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.active_object
    light.name = name
    light.rotation_euler = (aim_at - location).normalized().to_track_quat("-Z", "Y").to_euler()
    light.data.energy = energy
    light.data.color = color
    light.data.size = size
    # Round sources: a square one reflects in the glossy dome as a hard-edged
    # rectangle that reads as a modelling mistake rather than a studio softbox.
    light.data.shape = "DISK"
    return light


argv = sys.argv[sys.argv.index("--") + 1:]
p = argparse.ArgumentParser()
p.add_argument("--glb", required=True)
p.add_argument("--color", required=True)
p.add_argument("--out", required=True)
p.add_argument("--size", type=int, default=1600)
p.add_argument("--samples", type=int, default=192)
a = p.parse_args(argv)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a.glb)
imported = list(bpy.context.scene.objects)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
print(f"render_fallback: Cycles on the {use_gpu(scene)}")
scene.cycles.samples = a.samples
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = a.size
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
# Standard keeps the chapter colour saturated; the filmic transforms desaturate
# a tinted key light into a muddy neutral on a white shell.
scene.view_settings.view_transform = "Standard"

world = bpy.data.worlds.new("studio")
world.use_nodes = True
# Black, so the shadow catcher only darkens where the lights are actually
# blocked; an ambient world would veil the whole plane with a flat grey alpha.
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0, 0, 0, 1)
scene.world = world

drop_fallback_alpha()
points, centre, floor_z, radius = bounds(imported)

# Ground: invisible except for the shadow it catches, so the object sits on
# something instead of floating on the transparent background.
bpy.ops.mesh.primitive_plane_add(size=radius * 14, location=(centre.x, centre.y, floor_z))
bpy.context.active_object.is_shadow_catcher = True

az, el = math.radians(AZIMUTH), math.radians(ELEVATION)
direction = mathutils.Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
forward = -direction
# Camera-relative basis, so "key from the upper right" lands in the upper right
# of the frame whatever the object's dimensions.
right = forward.cross(mathutils.Vector((0, 0, 1))).normalized()
up = right.cross(forward).normalized()

half_fov = math.atan(18.0 / FOCAL)
bpy.ops.object.camera_add(
    location=centre + direction * fit_distance(points, centre, right, up, forward, half_fov))
cam = bpy.context.active_object
cam.data.lens = FOCAL
cam.rotation_euler = forward.to_track_quat("-Z", "Y").to_euler()
scene.camera = cam

cool = (0.78, 0.86, 1.0)

area_light("key", centre + right * 3.0 + up * 3.2 - forward * 1.0, centre, 450, hex_rgb(a.color), 3.5)
area_light("fill", centre - right * 3.4 + up * 1.0 - forward * 1.6, centre, 130, cool, 6.0)
area_light("rim", centre - right * 1.2 + up * 2.4 + forward * 3.0, centre, 240, cool, 4.0)

scene.render.filepath = a.out
bpy.ops.render.render(write_still=True)
