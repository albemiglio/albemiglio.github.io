"""Product-photography look-dev pass over a finished GLB.

Run: Blender -b --python lookdev.py -- --glb X.glb --color '#F0B24A' --out Y.png
     [--samples 1400] [--size 1600]

The GLB carries geometry and flat PBR colours only — that is the contract the
WebGL scene reads. Everything that makes the still look photographed is added
here, at render time, so the file the site loads never changes:

- a CC0 studio HDRI (Poly Haven, cached in .blender-cache, never committed) as
  the base light, plus one large soft key and a rim tinted with the chapter
  colour;
- AgX with a product-photo look, 85 mm with depth of field, transparent film
  over a glossy shadow catcher;
- per-material imperfections, mapped from the material names the object scripts
  write into the GLB:

  | material (script)                  | treatment                                  |
  |------------------------------------|--------------------------------------------|
  | shell, plastic (ipcam, card)        | matte ABS/PVC: roughness noise, micro bump |
  | black, dark, board, photo, stem     | matte, roughness noise + finer bump        |
  | green (card print)                  | matte print, very fine bump                |
  | metal, gold, holo                   | brushed: anisotropic + radial grain        |
  | glass, lens_glass (ipcam dome/lens) | real glass, IOR 1.5, dispersion            |
  | teal (capsule opaque half)          | moulded plastic under a clearcoat          |
  | white (capsule clear half)          | clear shell, index-matched, clearcoat      |
  | bead_a..d                           | glossy plastic beads, coat + micro bump    |
  | sponge, frosting, cherry, berry     | subsurface (sponge crumb, cream, fruit)    |
  | led, status                         | emissive, left alone apart from the bump   |
  | alu (devices, style.py)             | satin metal: roughness noise, fine bump    |
  | body, ink (devices, style.py)       | matte satin, roughness noise + micro bump  |

  Blender suffixes duplicate names on import (`metal.001` when the hero brings
  four files into one scene), so the lookup is on the part before the dot.
"""
import argparse
import math
import os
import sys

import bpy
import mathutils
import numpy as np

HDRI = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    ".blender-cache", "studio_small_09_2k.hdr")

# Framing: three-quarter view from slightly above, the angle the fallback stills
# already use, so the two are comparable side by side.
AZIMUTH = 32.0
ELEVATION = 24.0
FILL = 0.80        # share of the frame half-width the widest point reaches
FOCAL = 85.0       # mm
FSTOP = 4.5
ENV_STRENGTH = 1.1
ENV_ROTATION = 145.0   # degrees about Z: puts the HDRI's big softbox camera-left
EXPOSURE = 0.35
GROUND_SPAN = 3.0   # multiples of the object radius: wide enough for the shadow, small enough to stay out of frame
FLOOR_MARGIN = 0.12  # fraction of the frame height every object's contact point is shifted to, post-render


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def use_gpu(scene):
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
        print(f"lookdev: Metal setup failed ({exc}), using the CPU")
    scene.cycles.device = "CPU"
    return "CPU"


def bounds(objects):
    """World-space vertices, centre, floor height and radius of the meshes."""
    points = [obj.matrix_world @ v.co
              for obj in objects if obj.type == "MESH" for v in obj.data.vertices]
    lo = mathutils.Vector([min(pt[i] for pt in points) for i in range(3)])
    hi = mathutils.Vector([max(pt[i] for pt in points) for i in range(3)])
    return points, (lo + hi) / 2, lo.z, (hi - lo).length / 2


def fit_distance(points, centre, right, up, forward, half_fov, fill=FILL):
    limit = fill * math.tan(half_fov)
    return max(max(abs((pt - centre) @ right), abs((pt - centre) @ up)) / limit
               - (pt - centre) @ forward for pt in points)


# --- material imperfections -------------------------------------------------

# Every texture scale below is written in features across one object radius, and
# divided by UNIT (that radius, in scene units) when the node is built. Written
# as absolute Blender scales they were meaningless: the capsule is 2 units long
# and the cake 3, so one number could be a coarse blotch on one object and, on
# another, a pattern finer than the pixel grid — which is exactly what aliased
# the brushed metal into wet concrete on the first pass.
UNIT = 1.0


def parts(mat):
    return mat.node_tree.nodes, mat.node_tree.links


def coords(mat):
    """Object-space texture coordinates: the noise then sticks to the part
    instead of swimming with the camera."""
    nodes, _ = parts(mat)
    node = nodes.get("lookdev_coords")
    if node is None:
        node = nodes.new("ShaderNodeTexCoord")
        node.name = "lookdev_coords"
        node.location = (-1400, 0)
    return node.outputs["Object"]


def noise(mat, scale, detail, roughness=0.5, y=0):
    nodes, links = parts(mat)
    n = nodes.new("ShaderNodeTexNoise")
    n.location = (-1100, y)
    n.inputs["Scale"].default_value = scale / UNIT
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = roughness
    links.new(coords(mat), n.inputs["Vector"])
    return n


def vary_roughness(mat, bsdf, base, amount, scale=4.0, detail=6.0):
    """Roughness wandering around `base`: a perfectly uniform specular response
    across a whole panel is the single loudest tell of a CG surface."""
    nodes, links = parts(mat)
    n = noise(mat, scale, detail, y=200)
    r = nodes.new("ShaderNodeMapRange")
    r.location = (-850, 200)
    r.inputs["From Min"].default_value = 0.25
    r.inputs["From Max"].default_value = 0.75
    r.inputs["To Min"].default_value = max(0.01, base - amount)
    r.inputs["To Max"].default_value = min(1.0, base + amount)
    r.clamp = True
    links.new(n.outputs["Fac"], r.inputs["Value"])
    links.new(r.outputs["Result"], bsdf.inputs["Roughness"])


def micro_bump(mat, bsdf, scale=110.0, strength=0.10, detail=8.0, socket="Normal"):
    """Handling relief — fingerprints, micro-scratches, mould texture. Fine
    enough to read as surface quality rather than as a pattern, coarse enough to
    still be several pixels wide at 1600, because a bump finer than the pixel
    grid does not average into a sheen, it flickers."""
    nodes, links = parts(mat)
    n = noise(mat, scale, detail, roughness=0.7, y=-200)
    b = nodes.new("ShaderNodeBump")
    b.location = (-850, -200)
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = UNIT * 0.004
    links.new(n.outputs["Fac"], b.inputs["Height"])
    links.new(b.outputs["Normal"], bsdf.inputs[socket])
    return b


def brushed(mat, bsdf, base_roughness, anisotropy=0.5):
    """Anisotropic metal with a radial grain about Z — the rings, the stand, the
    lens bezel and the contact pad are all turned or stamped parts, so the brush
    runs around the axis and the highlight stretches with it."""
    nodes, links = parts(mat)
    bsdf.inputs["Roughness"].default_value = base_roughness
    bsdf.inputs["Anisotropic"].default_value = anisotropy
    tangent = nodes.new("ShaderNodeTangent")
    tangent.location = (-850, 400)
    tangent.direction_type = "RADIAL"
    tangent.axis = "Z"
    links.new(tangent.outputs["Tangent"], bsdf.inputs["Tangent"])
    vary_roughness(mat, bsdf, base_roughness, 0.10, scale=7.0)
    micro_bump(mat, bsdf, scale=140.0, strength=0.06)


def dispersive_glass(mat, ior=1.5, spread=0.012, roughness=0.02, tint=(0.86, 0.88, 0.92)):
    """Three Glass BSDFs, one per channel, at slightly different indices. The
    Principled BSDF has no dispersion input in 5.2 and neither does the Glass
    node, so the wavelength split is done by hand; summed, the three tinted
    lobes come back to `tint`, with a coloured fringe left at grazing angles."""
    nodes, links = parts(mat)
    out = nodes["Material Output"]
    shaders = []
    for i, (channel, offset) in enumerate((((tint[0], 0, 0, 1), -spread),
                                           ((0, tint[1], 0, 1), 0.0),
                                           ((0, 0, tint[2], 1), spread))):
        g = nodes.new("ShaderNodeBsdfGlass")
        g.location = (-300, 300 - i * 200)
        g.inputs["Color"].default_value = channel
        g.inputs["IOR"].default_value = ior + offset
        g.inputs["Roughness"].default_value = roughness
        shaders.append(g)
    add1 = nodes.new("ShaderNodeAddShader")
    add1.location = (-100, 200)
    add2 = nodes.new("ShaderNodeAddShader")
    add2.location = (60, 100)
    links.new(shaders[0].outputs[0], add1.inputs[0])
    links.new(shaders[1].outputs[0], add1.inputs[1])
    links.new(add1.outputs[0], add2.inputs[0])
    links.new(shaders[2].outputs[0], add2.inputs[1])
    links.new(add2.outputs[0], out.inputs["Surface"])


def subsurface(bsdf, weight, radius, scale, roughness):
    bsdf.inputs["Subsurface Weight"].default_value = weight
    bsdf.inputs["Subsurface Radius"].default_value = radius
    bsdf.inputs["Subsurface Scale"].default_value = scale * UNIT
    bsdf.inputs["Roughness"].default_value = roughness


def treat(mat):
    """Apply the treatment this material's name asks for. Unknown names get the
    generic plastic pass rather than nothing, so a new part is never flat."""
    if not mat.use_nodes:
        return
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    name = mat.name.split(".")[0]
    base_rough = bsdf.inputs["Roughness"].default_value

    if name in ("glass", "lens_glass"):
        # The dome tint was chosen for a renderer that read Alpha; through real
        # glass, with three surface crossings before the eye, the old 0.36 smoke
        # renders as a black ball and hides the optics, so it is opened up here.
        # The dome's roughness is a hair above mirror-smooth: at 0.015 the key
        # light's reflection lands on so few pixels it reads as a blown-out
        # fleck, and doubling as the only bright thing in the frame it also
        # drags the muddy interior down by contrast. 0.05 spreads the same
        # energy wide enough to read as a highlight rather than a clipped
        # hotspot without going soft enough to look frosted.
        tint = (0.88, 0.90, 0.95) if name == "glass" else (0.14, 0.16, 0.22)
        dispersive_glass(mat, roughness=0.05 if name == "glass" else 0.03, tint=tint)
        return

    if name in ("metal", "gold", "holo"):
        brushed(mat, bsdf, 0.30 if name == "metal" else 0.34)
        return

    if name == "alu":
        # Same metallic family as `brushed`, but isotropic: `brushed`'s radial
        # grain about Z is built for small turned parts (rings, hinges) — laid
        # over a large flat chassis panel it reads as one giant swirl instead
        # of a fine brush, because the tangent direction is only well-defined
        # near the axis it radiates from. A coarse noise scale (fine on a
        # capsule-sized part) also turns into a few dirty-looking blotches
        # once the object is a 2-unit-wide laptop, so both go much finer here.
        vary_roughness(mat, bsdf, 0.28, 0.025, scale=40.0)
        micro_bump(mat, bsdf, scale=220.0, strength=0.04)
        return

    if name == "teal":
        # Injection-moulded shell: satin base under a glossy coat, with a mould
        # texture fine enough to only show inside the highlight.
        vary_roughness(mat, bsdf, 0.42, 0.10, scale=5.0)
        bsdf.inputs["Coat Weight"].default_value = 1.0
        bsdf.inputs["Coat Roughness"].default_value = 0.06
        micro_bump(mat, bsdf, scale=120.0, strength=0.10)
        return

    if name == "white":
        # Clear half. The 1.05 index is deliberate (see capsule.py): it is what
        # keeps the four beads readable through two concentric cylinders. The
        # coat gives that index a real specular skin.
        bsdf.inputs["Roughness"].default_value = 0.03
        bsdf.inputs["Coat Weight"].default_value = 1.0
        bsdf.inputs["Coat Roughness"].default_value = 0.04
        micro_bump(mat, bsdf, scale=130.0, strength=0.05, socket="Coat Normal")
        return

    if name.startswith("bead"):
        vary_roughness(mat, bsdf, 0.28, 0.08, scale=14.0)
        bsdf.inputs["Coat Weight"].default_value = 0.4
        bsdf.inputs["Coat Roughness"].default_value = 0.08
        micro_bump(mat, bsdf, scale=150.0, strength=0.08)
        return

    if name == "sponge":
        subsurface(bsdf, 0.6, (0.9, 0.55, 0.30), 0.05, 0.85)
        micro_bump(mat, bsdf, scale=34.0, strength=0.7, detail=10.0)
        vary_roughness(mat, bsdf, 0.85, 0.10, scale=22.0)
        return

    if name == "frosting":
        subsurface(bsdf, 0.55, (0.55, 0.32, 0.32), 0.04, 0.42)
        bsdf.inputs["Sheen Weight"].default_value = 0.12
        bsdf.inputs["Sheen Roughness"].default_value = 0.4
        micro_bump(mat, bsdf, scale=48.0, strength=0.35, detail=9.0)
        vary_roughness(mat, bsdf, 0.42, 0.14, scale=10.0)
        return

    if name in ("cherry", "berry"):
        subsurface(bsdf, 0.35, (0.8, 0.12, 0.10), 0.015, 0.12 if name == "cherry" else 0.28)
        bsdf.inputs["Coat Weight"].default_value = 0.6
        bsdf.inputs["Coat Roughness"].default_value = 0.05
        micro_bump(mat, bsdf, scale=160.0, strength=0.10)
        return

    if name == "plastic":
        # Card stock: PVC with a printed face — the sheen is what separates it
        # from the moulded plastics around it.
        vary_roughness(mat, bsdf, 0.38, 0.12, scale=6.0)
        bsdf.inputs["Sheen Weight"].default_value = 0.22
        bsdf.inputs["Sheen Roughness"].default_value = 0.35
        micro_bump(mat, bsdf, scale=120.0, strength=0.10)
        return

    if name in ("led", "status"):
        micro_bump(mat, bsdf, scale=150.0, strength=0.06)
        return

    if name in ("body", "ink"):
        # Same reasoning as `alu`: the device family's panels are 2-3x the
        # radius the generic fallback's noise scale was tuned against, so its
        # default frequency reads as blotches instead of a satin micro-grain.
        vary_roughness(mat, bsdf, base_rough, min(0.10, base_rough * 0.25), scale=32.0)
        micro_bump(mat, bsdf, scale=200.0, strength=0.06)
        return

    # shell, black, dark, board, photo, green, stem and anything new.
    vary_roughness(mat, bsdf, base_rough, min(0.14, base_rough * 0.35), scale=4.5)
    micro_bump(mat, bsdf, scale=110.0, strength=0.09)


def drop_transparent_shadows(objects):
    """Cycles cannot sample a light through a refractive surface: a shadow ray
    that reaches one is blocked outright, so anything sealed behind glass reads
    as a dark tunnel regardless of how much the material itself is opened up
    (the ipcam dome and the capsule's clear half both depend on this). Taking
    the transparent parts out of the shadow pass is the fix: they keep their
    own reflections and refraction, they just stop casting a shadow of their
    own — invisible anyway on a near-black page — and the key light reaches
    what is sealed behind them instead of being stopped at the surface."""
    for obj in objects:
        if obj.type != "MESH":
            continue
        if any(m and m.name.split(".")[0] in ("glass", "lens_glass", "white") for m in obj.data.materials):
            obj.visible_shadow = False
            print(f"lookdev: {obj.name} excluded from the shadow pass (refractive)")


def drop_fallback_alpha():
    """glTF carries Alpha as the fallback for viewers without
    KHR_materials_transmission; Cycles renders the transmission itself."""
    for mat in bpy.data.materials:
        bsdf = mat.node_tree and mat.node_tree.nodes.get("Principled BSDF")
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
    light.data.shape = "DISK"   # a square softbox reflects as a hard rectangle
    return light


def fill_light(*a, **kw):
    """A fill that lifts the shadow side without printing a third white ellipse
    on every glossy surface: it keeps its diffuse contribution and gives up most
    of its specular one."""
    light = area_light(*a, **kw)
    light.data.specular_factor = 0.06
    return light


def build_ground(centre, floor_z, radius):
    """The surface the object stands on, and nothing else.

    An earlier version painted a dark glossy sweep with a radial alpha fade, on
    the theory that a shadow on a near-black page is invisible while a
    reflection reads. It photographed badly: the plane runs to the horizon, so
    the fade — written in the plane's own coordinates, which span the whole
    sheet — left a hard lit wedge behind the object in every still. A shadow
    catcher is both simpler and what a product shot actually wants: the plane
    contributes only the shadow it catches, the film stays transparent
    everywhere else, and the object sits on the page instead of on a disc.
    """
    bpy.ops.mesh.primitive_plane_add(size=radius * GROUND_SPAN, location=(centre.x, centre.y, floor_z))
    ground = bpy.context.active_object
    ground.name = "ground"
    ground.is_shadow_catcher = True
    # Keeping the plane out of the indirect paths (visible_diffuse/glossy = False) looks like the
    # way to stop it tinting the film, but it takes away the unshadowed reference the catcher
    # needs and the whole frame composites opaque. Leave it a plain catcher; the span above is
    # what keeps its edge out of the picture.
    #
    # A shadow catcher's default material is Blender's ~0.8 grey diffuse, so the
    # occluded pixels right under a tangent-contact object (a card on its edge,
    # a capsule lying on its side — a line, not a footprint) only lose a third
    # of their brightness and vanish into a near-black page: the object reads as
    # floating even though a shadow is technically there. A dark, purely matte
    # catcher material keeps the untouched frame exactly as transparent (alpha is
    # still ~0 wherever nothing is occluded) but makes the occluded pixels drop
    # much closer to black, so the same shadow actually shows up against #0B0D10.
    mat = bpy.data.materials.new("ground")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.05, 0.055, 1.0)
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.95
    ground.data.materials.append(mat)
    return ground


SHADOW_GAMMA = 0.55   # < 1 lifts the mid-low alpha of a soft contact shadow toward opaque


def finish_still(path):
    """Two frame-level fixes applied to the finished PNG, after Cycles and
    before the file is judged.

    1. A shadow catcher's occlusion is real physics — a tangent line or a
       raked footprint really does receive less light — but it comes out as
       10-30% alpha, which composited on the page's near-black #0B0D10 is a
       few levels of grey no one notices; the object reads as floating even
       though a correctly shaped shadow is sitting right there. A gamma curve
       on the alpha channel (leaving RGB alone) pushes that same shadow
       towards opaque without inventing anything: pixels already at 0 or
       already at 1 barely move, the soft grey in between does. It also
       tightens the object's own silhouette anti-aliasing a little, which is
       the crispness the brief is asking for, not a side effect to guard
       against.

    2. Framing every object on its bounding-box centre puts a squat,
       top-heavy one (the dome, the tiered cake) low in its square and a
       symmetric one (the capsule on its side, the card laid flat) dead
       centre with floating margin above and below it — four honestly framed
       stills that still read as sitting at different heights side by side.
       Re-doing that in the camera would also rescale each object (pulling
       the aim point towards the floor changes how much of the vertical FOV
       the object needs), so it is done here instead, as a plain vertical
       translation that leaves size and everything else untouched: find the
       lowest opaque row (the object's own contact point, not the soft
       shadow) and shift the whole frame so that row sits at the same
       fraction of every square, padding the vacated edge with transparent
       pixels.
    """
    img = bpy.data.images.load(path)
    w, h = img.size
    # Blender's pixel buffer is bottom-to-top; row index 0 is the bottom edge
    # of the image, which is exactly the axis this function reasons in.
    arr = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    alpha = arr[:, :, 3]

    lift = alpha > 0.0
    alpha[lift] = np.power(alpha[lift], SHADOW_GAMMA)
    arr[:, :, 3] = alpha

    opaque_rows = np.nonzero(np.any(alpha > 0.94, axis=1))[0]
    if opaque_rows.size:
        contact_row = int(opaque_rows.min())
        target_row = int(round(FLOOR_MARGIN * h))
        shift = target_row - contact_row
        if shift:
            shifted = np.zeros_like(arr)
            if shift > 0:
                shifted[shift:, :, :] = arr[:h - shift, :, :]
            else:
                shifted[:h + shift, :, :] = arr[-shift:, :, :]
            arr = shifted

    img.pixels.foreach_set(arr.ravel())
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


def build_world(scene):
    world = bpy.data.worlds.new("studio")
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    bg = nodes["Background"]
    env = nodes.new("ShaderNodeTexEnvironment")
    env.location = (-300, 0)
    env.image = bpy.data.images.load(HDRI)
    mapping = nodes.new("ShaderNodeMapping")
    mapping.location = (-520, 0)
    mapping.inputs["Rotation"].default_value[2] = math.radians(ENV_ROTATION)
    tex = nodes.new("ShaderNodeTexCoord")
    tex.location = (-720, 0)
    links.new(tex.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], env.inputs["Vector"])
    links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = ENV_STRENGTH
    scene.world = world


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    p = argparse.ArgumentParser()
    p.add_argument("--glb", required=True)
    p.add_argument("--color", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--samples", type=int, default=1400)
    p.add_argument("--size", type=int, default=1600)
    # A long thin object framed to the same share of the frame as a compact one runs to the edge:
    # the margin has to answer the silhouette, not a single constant.
    p.add_argument("--fill", type=float, default=FILL)
    p.add_argument("--azimuth", type=float, default=AZIMUTH)
    p.add_argument("--elevation", type=float, default=ELEVATION)
    a = p.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=a.glb)
    imported = list(bpy.context.scene.objects)

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    print(f"lookdev: Cycles on the {use_gpu(scene)}")
    scene.cycles.samples = a.samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.004
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.max_bounces = 24
    scene.cycles.transmission_bounces = 20
    scene.cycles.transparent_max_bounces = 20
    scene.cycles.caustics_refractive = True
    scene.cycles.blur_glossy = 1.0
    scene.render.resolution_x = scene.render.resolution_y = a.size
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = EXPOSURE

    points, centre, floor_z, radius = bounds(imported)

    build_world(scene)
    drop_fallback_alpha()
    # A Catmull-Clark pass used to run here on every glass/lens_glass mesh, to
    # smooth the ring-faceting a UV sphere shows under refraction (reflection
    # hides it, refraction bends by the geometric normal and shows every
    # facet). At this mesh's 64 segments there was none left to fix, and
    # subdividing a UV sphere's pole — a fan of thin triangles, not an
    # ordinary 4-valence vertex — pinched it into a dark, radiating starburst
    # instead: worse than the problem it solved, and it got sharper rather
    # than cleaner at higher sample counts because it was geometry, not noise.
    drop_transparent_shadows(imported)
    global UNIT
    UNIT = radius
    for mat in bpy.data.materials:
        treat(mat)

    build_ground(centre, floor_z, radius)

    az, el = math.radians(a.azimuth), math.radians(a.elevation)
    direction = mathutils.Vector((math.sin(az) * math.cos(el),
                                  -math.cos(az) * math.cos(el), math.sin(el)))
    forward = -direction
    right = forward.cross(mathutils.Vector((0, 0, 1))).normalized()
    up = right.cross(forward).normalized()

    half_fov = math.atan(18.0 / FOCAL)
    distance = fit_distance(points, centre, right, up, forward, half_fov, a.fill)
    bpy.ops.object.camera_add(location=centre + direction * distance)
    cam = bpy.context.active_object
    cam.data.lens = FOCAL
    cam.rotation_euler = forward.to_track_quat("-Z", "Y").to_euler()
    cam.data.dof.use_dof = True
    cam.data.dof.focus_distance = distance
    cam.data.dof.aperture_fstop = FSTOP
    cam.data.dof.aperture_blades = 8
    scene.camera = cam

    tint = hex_rgb(a.color)
    # Key: big and soft, from camera-left and above, neutral daylight — the
    # chapter colour only comes back as the rim, so whites stay white.
    area_light("key", centre + right * 2.6 * radius + up * 3.0 * radius - forward * 1.2 * radius,
               centre, 260 * radius ** 2, (1.0, 0.97, 0.93), radius * 5.0)
    fill_light("fill", centre - right * 3.4 * radius + up * 0.8 * radius - forward * 1.8 * radius,
               centre, 70 * radius ** 2, (0.86, 0.91, 1.0), radius * 7.0)
    area_light("rim", centre - right * 1.6 * radius + up * 2.2 * radius + forward * 3.0 * radius,
               centre, 130 * radius ** 2, tint, radius * 3.0)

    scene.render.filepath = a.out
    bpy.ops.render.render(write_still=True)
    finish_still(a.out)
    print(f"lookdev: wrote {a.out} at {a.size}px, {a.samples} samples, "
          f"camera {distance:.2f} away, object radius {radius:.2f}")


main()
