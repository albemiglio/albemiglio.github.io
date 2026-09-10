"""Shared helpers for the procedural models. Run inside Blender: -b --python <script> -- --out X [--lod low]."""
import argparse
import math
import sys

import bpy
import mathutils


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


def rounded_box(name, size, radius, corner_segs, material, location=(0, 0, 0), rim=0.0, rim_segs=2):
    """Rectangle with real corner arcs in XY, extruded along Z and centred on its origin.

    A cube bevelled by the corner radius is not the same shape: a 0.09 radius on
    a 0.08-thick phone body would eat the flat faces entirely. Here the arcs live
    in the profile, the two flat faces keep their full area, and only `rim`
    softens the edge between them and the side wall.
    """
    w, h, d = size
    r = min(radius, w / 2, h / 2)
    ax, ay = w / 2 - r, h / 2 - r
    pts = []
    for cx, cy, start in ((ax, ay, 0.0), (-ax, ay, 90.0), (-ax, -ay, 180.0), (ax, -ay, 270.0)):
        for i in range(corner_segs + 1):
            t = math.radians(start + 90.0 * i / corner_segs)
            p = (cx + r * math.cos(t), cy + r * math.sin(t), 0.0)
            # A capsule (radius == half the short side) makes consecutive arcs meet
            # on the same point; a repeated vertex would give the ngon a zero-length edge.
            if not pts or math.dist(p[:2], pts[-1][:2]) > 1e-6:
                pts.append(p)
    if len(pts) > 2 and math.dist(pts[0][:2], pts[-1][:2]) < 1e-6:
        pts.pop()

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(pts, [], [list(range(len(pts)))])
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    mod = o.modifiers.new("extrude", "SOLIDIFY")
    mod.thickness = d
    mod.offset = 0.0  # grow both ways, so the slab straddles the origin
    bpy.ops.object.modifier_apply(modifier=mod.name)
    o.location = location
    o.data.materials.append(material)
    if rim:
        bevel(o, rim, rim_segs)
    smooth(o)
    return o


def subtract(obj, cutter):
    """Boolean-difference `cutter` out of `obj`, applied at once and the cutter removed.
    Call it before any bevel: the bevel has to see the edges the cut leaves behind."""
    mod = obj.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    mod.solver = "EXACT"
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return obj


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


def yup_plane(obj):
    """Pre-turn a flat mesh so the exporter's Z-up to Y-up pass leaves it in its own
    local XY plane facing +Z. That pass rewrites vertex data as well as node
    matrices, so a plane authored in Blender's XY lands in the file's XZ with its
    normal on Y — and consumers that read the node's local bounding box as
    width x height would read the thickness instead. Turning the mesh 90 degrees
    about X and taking the same turn back out of the object rotation cancels the
    conversion exactly, leaving the plane's world pose untouched."""
    turn = mathutils.Matrix.Rotation(math.radians(90), 4, "X")
    obj.data.transform(turn)
    obj.rotation_euler = (obj.rotation_euler.to_matrix() @ turn.to_3x3().inverted()).to_euler()
    return obj


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
        export_draco_mesh_compression_enable=False,
        export_yup=True,
    )


def deg(v):
    return math.radians(v)
