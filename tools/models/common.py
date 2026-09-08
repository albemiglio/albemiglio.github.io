"""Shared helpers for the procedural models. Run inside Blender: -b --python <script> -- --out X [--lod low]."""
import argparse
import math
import sys

import bpy


def args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--lod", default="high", choices=["high", "low"])
    return p.parse_args(argv)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def segments(lod):
    return 24 if lod == "low" else 64


def pbr(name, rgb, roughness=0.6, metallic=0.0, alpha=1.0, transmission=0.0, ior=1.45,
        emission=None, emission_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Alpha"].default_value = alpha
    bsdf.inputs["Transmission Weight"].default_value = transmission
    bsdf.inputs["IOR"].default_value = ior
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        m.blend_method = "BLEND"
    return m


def bevel(obj, width=0.02, segs=3):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segs
    mod.limit_method = "ANGLE"
    return mod


def solidify(obj, thickness=0.03):
    mod = obj.modifiers.new("solidify", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = -1.0
    return mod


def smooth(obj, angle_deg=30):
    """Smooth-shade by dihedral angle: curved faces (small angle between neighbours)
    render smooth, sharp edges (e.g. a 90-degree box corner) stay flat. Keeps the
    bevel modifier's sharp CAD edges while removing facet banding on cylinders/spheres."""
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle_deg))
    return obj


def cylinder(name, radius, depth, z, segs, material, x=0.0, y=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segs, radius=radius, depth=depth, location=(x, y, z))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    smooth(o)
    return o


def sphere(name, radius, location, segs, material):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segs, ring_count=max(6, segs // 2), radius=radius, location=location)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    smooth(o)
    return o


def hemisphere(name, radius, z, segs, material, keep="upper", fill=True, flatten=1.0):
    """Half of a UV sphere cut at `z`. `keep` picks the half; `fill` closes the cut with
    an ngon (leave it off when a Solidify modifier gives the shell its thickness).
    `flatten` scales the kept half along Z, for shallow bowls and lens caps."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segs, ring_count=max(8, segs // 2), radius=radius, location=(0, 0, z))
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bisect(
        plane_co=(0, 0, z), plane_no=(0, 0, 1),
        clear_inner=(keep == "upper"), clear_outer=(keep == "lower"), use_fill=fill)
    bpy.ops.object.mode_set(mode="OBJECT")
    if flatten != 1.0:
        o.scale = (1, 1, flatten)
        bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    smooth(o)
    return o


def box(name, size, location, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    return o


def join(name, parts):
    """Merge parts into one mesh named `name`; the first part keeps its origin."""
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    smooth(o)
    return o


def place(obj, location, rotation=(0, 0, 0)):
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def group(name, children):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    root = bpy.context.active_object
    root.name = name
    for c in children:
        c.parent = root
    return root


def export(root, path):
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for c in root.children_recursive:
        c.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_yup=True,
    )


def deg(v):
    return math.radians(v)
