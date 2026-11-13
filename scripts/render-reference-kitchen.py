"""Photo-reference assembly study; original geometry, offline Blender 4.5 LTS.

Not a reconstruction survey or a photographed customer project. Source photos
guide the green shaker joinery, portal, shelves, black stone and oak peninsula.
The fixed camera and room are identical throughout. No photo crossfades.
"""

import argparse
import math
import os
import random
import shutil
import sys

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--frames', default='1,75,150')
parser.add_argument('--width', type=int, default=1920)
parser.add_argument('--height', type=int, default=1200)
parser.add_argument('--samples', type=int, default=96)
parser.add_argument('--noise-threshold', type=float, default=0.015)
parser.add_argument('--mobile', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
os.makedirs(args.output, exist_ok=True)
random.seed(17)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.use_persistent_data = True
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPENIMAGEDENOISE'
scene.cycles.seed = 17
scene.cycles.use_animated_seed = False
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = args.noise_threshold
scene.cycles.max_bounces = 8
scene.render.resolution_x = args.width
scene.render.resolution_y = args.height
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.fps = 30
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.world = bpy.data.worlds.new('Daylight')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.77, 0.85, 1, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.18
preferences = bpy.context.preferences.addons['cycles'].preferences
try:
    preferences.compute_device_type = 'OPTIX'
    preferences.get_devices()
    for device in preferences.devices:
        device.use = device.type == 'OPTIX'
    if any(device.use for device in preferences.devices):
        scene.cycles.device = 'GPU'
        scene.cycles.denoiser = 'OPTIX'
except Exception:
    scene.cycles.device = 'CPU'


def material(name, color, roughness=0.5, metal=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metal
    return mat


plaster = material('Warm greige plaster', (0.59, 0.55, 0.47), 0.86)
chalk = material('Soft chalk ceiling', (0.82, 0.80, 0.73), 0.82)
green = material('Deep forest green satin joinery', (0.008, 0.039, 0.018), 0.32)
green_inset = material('Green recessed door panels', (0.007, 0.032, 0.014), 0.37)
interior = material('Cabinet interior birch', (0.73, 0.68, 0.56), 0.65)
black = material('Powder coated charcoal', (0.003, 0.004, 0.005), 0.62)
glass = material('Black appliance glass', (0.012, 0.018, 0.023), 0.12, 0.25)
brass = material('Brushed brass handles', (0.49, 0.31, 0.105), 0.28, 0.8)
steel = material('Brushed stainless steel', (0.24, 0.26, 0.27), 0.27, 0.95)
chrome = material('Polished faucet chrome', (0.57, 0.59, 0.61), 0.13, 1)
rubber = material('Appliance seals and burner enamel', (0.004, 0.005, 0.006), 0.48)
ceramic = material('Warm stoneware', (0.73, 0.67, 0.54), 0.42)
floor_mat = material('Existing pale grey stone floor', (0.43, 0.43, 0.40), 0.7)
tile = material('Warm white brick backsplash', (0.72, 0.71, 0.64), 0.3)
grout = material('Fine warm grey grout', (0.4, 0.41, 0.36), 0.85)
wood = material('Natural oiled oak', (0.48, 0.26, 0.10), 0.39)
stone = material('Charcoal fine grained worktop', (0.02, 0.025, 0.024), 0.29)

# Procedural grain is stable in object space across every animation frame.
def grain(mat, scale, strength, distance):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    coord = nodes.new('ShaderNodeTexCoord')
    stretch = nodes.new('ShaderNodeVectorMath')
    stretch.operation = 'MULTIPLY'
    stretch.inputs[1].default_value = scale
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 3
    noise.inputs['Detail'].default_value = 3
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = strength
    bump.inputs['Distance'].default_value = distance
    links.new(coord.outputs['Generated'], stretch.inputs[0])
    links.new(stretch.outputs['Vector'], noise.inputs['Vector'])
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], nodes['Principled BSDF'].inputs['Normal'])
    return noise


oak_noise = grain(wood, (0.7, 4.5, 8), 0.13, 0.0015)
oak_noise.name = 'Oak fibre'
oak_noise.inputs['Detail'].default_value = 5
oak_noise.noise_dimensions = '4D'
oak_ramp = wood.node_tree.nodes.new('ShaderNodeValToRGB')
oak_ramp.name = 'Oak colour'
oak_ramp.color_ramp.elements[0].color = (0.11, 0.042, 0.012, 1)
oak_ramp.color_ramp.elements[1].color = (0.46, 0.235, 0.075, 1)
wood.node_tree.links.new(oak_noise.outputs['Fac'], oak_ramp.inputs[0])
wood.node_tree.links.new(oak_ramp.outputs['Color'], wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
grain(stone, (100, 100, 100), 0.08, 0.005)
grain(plaster, (55, 55, 55), 0.11, 0.008)
grain(tile, (4, 4, 4), 0.13, 0.012)
grain(green, (120, 120, 120), 0.065, 0.0003)
grain(green_inset, (120, 120, 120), 0.065, 0.0003)
for mat in (green, green_inset, wood):
    surface = mat.node_tree.nodes['Principled BSDF']
    surface.inputs['Coat Weight'].default_value = 0.18
    surface.inputs['Coat Roughness'].default_value = 0.3
steel.node_tree.nodes['Principled BSDF'].inputs['Anisotropic'].default_value = 0.25

animated = []
practical_lights = []


def box(name, location, dimensions, mat, parent=None, bevel=0.008):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Crafted edge highlight', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    obj.parent = parent
    return obj


def cylinder(name, location, radius, depth, mat, parent=None, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new('Soft edge', 'BEVEL')
    bevel.width = min(0.008, radius * 0.2)
    bevel.segments = 3
    obj.parent = parent
    if rotation:
        obj.rotation_euler = rotation
    return obj


def group(name, start, end, offset=(0, 0, 0.25)):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    animated.append((obj, start, end, offset))
    return obj


def lathe(name, location, profile, mat, parent=None):
    """Closed radial profile: real lips, hollow interiors and rounded transitions."""
    segments = 64
    vertices = [(location[0] + radius * math.cos(i * math.tau / segments),
                 location[1] + radius * math.sin(i * math.tau / segments), location[2] + z)
                for radius, z in profile for i in range(segments)]
    faces = []
    for row in range(len(profile) - 1):
        for i in range(segments):
            j = (i + 1) % segments
            faces.append((row * segments + i, row * segments + j,
                          (row + 1) * segments + j, (row + 1) * segments + i))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    mesh.materials.append(mat)
    for face in mesh.polygons:
        face.use_smooth = True
    obj.parent = parent
    return obj


def door(name, x, y, z, width, height, parent, knob=False):
    box(name + ' recessed panel', (x, y + 0.017, z), (width - 0.035, 0.025, height - 0.035), green_inset, parent, bevel=0.002)
    for dx in (-width / 2 + 0.032, width / 2 - 0.032):
        box(name + ' stile', (x + dx, y - 0.014, z), (0.064, 0.055, height), green, parent, bevel=0.0025)
    for dz in (-height / 2 + 0.032, height / 2 - 0.032):
        box(name + ' rail', (x, y - 0.014, z + dz), (width - 0.128, 0.055, 0.064), green, parent, bevel=0.0025)
    if knob:
        cylinder(name + ' brass knob', (x + width * 0.31, y - 0.066, z - height * 0.33), 0.018, 0.035, brass, parent, (math.pi / 2, 0, 0))
    else:
        for dx in (-0.105, 0.105):
            cylinder('Handle stand', (x + dx, y - 0.065, z + height * 0.3), 0.009, 0.05, brass, parent, (math.pi / 2, 0, 0))
        cylinder('Brass handle', (x, y - 0.09, z + height * 0.3), 0.011, 0.25, brass, parent, (0, math.pi / 2, 0))


# Architectural shell is static. The opening matches the reference's framed niche.
box('Floor slab', (0, -1.0, -0.09), (12, 15, 0.16), grout)
for row in range(16):
    for col in range(12):
        box('Large existing floor tile', (-5.5 + col, -6 + row, 0), (0.997, 0.997, 0.02), floor_mat, bevel=0.002)
box('Back wall', (0, 3.25, 1.6), (5.2, 0.2, 3.2), plaster)
box('Right niche wall', (2.55, 1.65, 1.6), (0.18, 3.3, 3.2), plaster)
box('Left niche wall', (-2.55, 1.65, 1.6), (0.18, 3.3, 3.2), plaster)
box('Niche ceiling', (0, 1.7, 3.22), (5.2, 3.4, 0.12), chalk)
box('Front ceiling', (0, -6, 3.45), (16, 12, 0.12), chalk)
for x in (-4.65, 4.65):
    box('Opening plaster pier', (x, 0.05, 1.7), (4, 0.25, 3.4), plaster)
box('Opening plaster lintel', (0, 0.05, 3.14), (5.3, 0.25, 0.52), plaster)
for y in (0.6, 2.8):
    box('Rear ceiling cornice', (0, y, 3.08), (5.0, 0.045, 0.065), chalk)

# The installation starts with open carcasses. Doors and stone are separate beats.
for index, x in enumerate((-1.64, -0.82, 0, 0.82)):
    start = 0.13 + index * 0.025
    carcass = group(f'{index} base cabinet assembly', start, start + 0.15, (0, 0.5, -0.6))
    for dx in (-0.39, 0.39):
        box('Birch cabinet side', (x + dx, 2.71, 0.49), (0.025, 0.68, 0.85), interior, carcass)
    box('Birch bottom', (x, 2.71, 0.1), (0.78, 0.68, 0.035), interior, carcass)
    box('Birch shelf', (x, 2.71, 0.48), (0.78, 0.66, 0.025), interior, carcass)
    box('Birch back', (x, 3.03, 0.49), (0.8, 0.025, 0.85), interior, carcass)
    for dx in (-0.392, 0.392):
        box('Painted green carcass edge', (x + dx, 2.365, 0.49), (0.027, 0.018, 0.85), green, carcass, bevel=0.001)
    box('Shadow plinth', (x, 2.78, 0.055), (0.77, 0.52, 0.08), black, carcass)
    front = group(f'{index} green shaker door installation', 0.43 + index * 0.025, 0.58 + index * 0.025, (0, -0.25, -1.1))
    door('Lower shaker door', x, 2.35, 0.51, 0.79, 0.79, front)

# Upper cabinetry has individually arriving cabinets and separate shaker fronts.
for index, x in enumerate((-0.89, -0.13, 0.63)):
    cabinet = group(f'{index} upper cabinet mounting', 0.23 + index * 0.025, 0.39 + index * 0.025, (0, 0.15, 1.8))
    for dx in (-0.365, 0.365):
        box('Upper birch side', (x + dx, 2.97, 2.13), (0.022, 0.4, 0.88), interior, cabinet)
    for z in (1.7, 2.13, 2.56):
        box('Upper shelf', (x, 2.97, z), (0.73, 0.4, 0.025), interior, cabinet)
    box('Upper back', (x, 3.15, 2.13), (0.75, 0.025, 0.88), interior, cabinet)
    for dx in (-0.367, 0.367):
        box('Painted upper cabinet edge', (x + dx, 2.757, 2.13), (0.027, 0.022, 0.88), green, cabinet, bevel=0.001)
    box('Painted upper cabinet underside', (x, 2.97, 1.69), (0.75, 0.42, 0.025), green, cabinet, bevel=0.002)
    front = group(f'{index} upper shaker door', 0.49 + index * 0.026, 0.64 + index * 0.026, (0, -0.15, 1.8))
    door('Upper green shaker', x, 2.74, 2.13, 0.73, 0.87, front, True)

# Backsplash tiles settle into position in a short architectural wave.
for row in range(5):
    tiles = group(f'Backsplash row {row}', 0.32 + row * 0.015, 0.46 + row * 0.015, (0, 0.2, 0))
    for col in range(14):
        x = -2.01 + col * 0.244 + (row % 2) * 0.07
        if x < 1.22:
            box('Handmade brick tile', (x, 3.105, 1.015 + row * 0.128), (0.238, 0.04, 0.121), tile, tiles, bevel=0.012)

# Black stone worktop split around a real sink aperture.
worktop = group('Black stone counter lowers into place', 0.37, 0.52, (0, 0, 2.5))
box('Worktop hob side', (-1.25, 2.69, 0.966), (1.6, 0.8, 0.055), stone, worktop)
box('Worktop right', (0.85, 2.69, 0.966), (0.75, 0.8, 0.055), stone, worktop)
for y, depth in ((2.38, 0.18), (3.015, 0.15)):
    box('Sink surround', (0, y, 0.966), (0.9, depth, 0.055), stone, worktop)
sink = group('Sink and tap assembly', 0.52, 0.65, (0, 0, 2.6))
# Pressed stainless basin: a continuous rounded rim, curved walls and a drain.
sink_rings = [(0.44, 0.25, 0.984), (0.421, 0.232, 0.988),
              (0.405, 0.216, 0.977), (0.397, 0.208, 0.94),
              (0.37, 0.18, 0.825), (0.34, 0.15, 0.807),
              (0.045, 0.045, 0.801)]
sink_vertices = []
for w, d, z in sink_rings:
    for i in range(64):
        angle = math.tau * i / 64
        cx, cy = math.cos(angle), math.sin(angle)
        sink_vertices.append((math.copysign(abs(cx) ** 0.5, cx) * w,
                              2.7 + math.copysign(abs(cy) ** 0.5, cy) * d, z))
sink_faces = [(row * 64 + i, row * 64 + (i + 1) % 64,
               (row + 1) * 64 + (i + 1) % 64, (row + 1) * 64 + i)
              for row in range(len(sink_rings) - 1) for i in range(64)]
sink_mesh = bpy.data.meshes.new('Pressed stainless bowl mesh')
sink_mesh.from_pydata(sink_vertices, [], sink_faces)
sink_mesh.update()
basin = bpy.data.objects.new('Continuous pressed sink basin', sink_mesh)
scene.collection.objects.link(basin)
basin.parent = sink
basin.data.materials.append(steel)
for polygon in basin.data.polygons:
    polygon.use_smooth = True
cylinder('Drain brushed steel strainer', (0, 2.7, 0.802), 0.043, 0.004, chrome, sink)
for i in range(8):
    a = i * math.tau / 8
    cylinder('Strainer perforation', (0.025 * math.cos(a), 2.7 + 0.025 * math.sin(a), 0.805), 0.0035, 0.001, black, sink)
bpy.ops.curve.primitive_bezier_curve_add()
faucet = bpy.context.object
faucet.name = 'Continuous swan neck stainless faucet'
faucet.data.dimensions = '3D'
faucet.data.bevel_depth = 0.018
faucet.data.bevel_resolution = 4
points = [(0, 2.99, 0.98), (0, 2.99, 1.26), (0, 2.91, 1.40), (0, 2.73, 1.40), (0, 2.67, 1.27)]
spline = faucet.data.splines[0]
spline.bezier_points.add(len(points) - 2)
for point, location in zip(spline.bezier_points, points):
    point.co = location
    point.handle_left_type = point.handle_right_type = 'AUTO'
faucet.data.materials.append(chrome)
faucet.parent = sink
cylinder('Faucet circular foot', (0, 2.99, 0.991), 0.036, 0.017, chrome, sink)
cylinder('Faucet mixer body', (0.042, 2.99, 1.061), 0.025, 0.055, chrome, sink, (0, math.pi / 2, 0))
cylinder('Faucet slim lever', (0.075, 2.99, 1.09), 0.007, 0.08, chrome, sink)

# Left shelving forms the deep green edge visible in the photographs.
shelf = group('Tall open green shelving', 0.29, 0.47, (-1.0, 0, 0))
for x in (-2.35, -1.91):
    box('Full height shelving side', (x, 2.47, 1.43), (0.04, 0.7, 2.86), green, shelf)
box('Shelving back', (-2.13, 2.82, 1.43), (0.48, 0.04, 2.86), green, shelf)
for z in (0.07, 0.48, 0.97, 1.46, 1.95, 2.44, 2.86):
    box('Open shelf', (-2.13, 2.47, z), (0.48, 0.7, 0.045), green, shelf)

appliances = group('Appliances slide into their housings', 0.55, 0.73, (3.5, 0, 0))
box('Oven body', (-1.64, 2.68, 0.5), (0.67, 0.63, 0.64), black, appliances)
box('Oven glass front', (-1.64, 2.315, 0.48), (0.59, 0.045, 0.42), glass, appliances)
box('Oven brushed control fascia', (-1.64, 2.31, 0.825), (0.6, 0.04, 0.115), steel, appliances, bevel=0.004)
box('Oven inset clock display', (-1.64, 2.284, 0.83), (0.15, 0.008, 0.05), glass, appliances, bevel=0.002)
for z in (0.32, 0.63):
    box('Oven inner glass edge', (-1.64, 2.286, z), (0.51, 0.003, 0.005), black, appliances, bevel=0.001)
cylinder('Oven rail', (-1.64, 2.27, 0.76), 0.014, 0.5, steel, appliances, (0, math.pi / 2, 0))
for x in (-1.85, -1.45):
    cylinder('Oven control', (x, 2.28, 0.83), 0.024, 0.025, steel, appliances, (math.pi / 2, 0, 0))
box('Black cooktop', (-1.64, 2.68, 1.006), (0.66, 0.53, 0.025), glass, appliances)
for x in (-1.83, -1.45):
    for y in (2.51, 2.83):
        cylinder('Brushed burner base', (x, y, 1.025), 0.087, 0.017, steel, appliances)
        cylinder('Black enamel burner cap', (x, y, 1.041), 0.066, 0.014, rubber, appliances)
        for angle in (0, math.pi / 2):
            support = box('Cast iron pan support', (x, y, 1.062), (0.235, 0.014, 0.014), black, appliances, bevel=0.003)
            support.rotation_euler.z = angle
hood = group('Angled black cooker hood', 0.48, 0.63, (0, 0, 1.8))
box('Hood chimney', (-1.64, 3.0, 2.49), (0.24, 0.24, 0.7), black, hood)
hood_face = box('Sloped hood glass', (-1.64, 2.79, 2.03), (0.62, 0.1, 0.53), glass, hood)
hood_face.rotation_euler.x = math.radians(-22)
box('Stainless refrigerator body', (1.78, 2.72, 1.15), (0.85, 0.82, 2.3), steel, appliances, bevel=0.045)
for z, height in ((0.52, 1.0), (1.68, 1.25)):
    box('Refrigerator dark magnetic door seal', (1.78, 2.295, z), (0.825, 0.018, height + 0.012), rubber, appliances, bevel=0.018)
    box('Brushed steel fridge door', (1.78, 2.28, z), (0.82, 0.06, height), steel, appliances, bevel=0.024)
    cylinder('Refrigerator handle', (1.46, 2.22, z), 0.012, 0.5, black, appliances)
for i in range(5):
    box('Refrigerator lower ventilation slot', (1.78, 2.295, 0.035 + i * 0.011), (0.62, 0.012, 0.004), black, appliances, bevel=0.001)

# The peninsula is built as carcass, green front, then thick oak slab.
island = group('Peninsula carcass rises', 0.66, 0.79, (0, 0, -1.1))
box('Island shadow gap', (0, -0.55, 0.055), (2.45, 0.78, 0.11), black, island)
box('Green island body', (0, -0.55, 0.51), (2.55, 0.88, 0.93), green, island)
for i in range(4):
    panel = group(f'Peninsula front {i}', 0.72 + i * 0.012, 0.83 + i * 0.012, (0, -0.24, -1.1))
    door('Island shaker panel', -0.95 + i * 0.635, -1.005, 0.53, 0.625, 0.86, panel)
slab = group('Solid oak countertop settles', 0.77, 0.89, (0, 0, 2.5))
for index in range(7):
    board_mat = wood.copy()
    board_mat.name = f'Oak lamella {index + 1}'
    tone = 0.91 + random.random() * 0.18
    for stop in board_mat.node_tree.nodes['Oak colour'].color_ramp.elements:
        stop.color = tuple(c * tone for c in stop.color[:3]) + (1,)
    board_mat.node_tree.nodes['Oak fibre'].inputs['W'].default_value = index * 0.713
    box('Continuous grain oak worktop lamella', (0, -1.31 + (index + 0.5) * 1.28 / 7, 1.025),
        (2.99, 1.28 / 7 - 0.0007, 0.075), board_mat, slab, bevel=0.003)

# Green opening trim and black track complete the same architectural frame.
trim = group('Forest green portal finish', 0.78, 0.91, (0, 0.17, 0))
for x in (-2.48, 2.48):
    box('Green vertical portal trim', (x, -0.13, 1.44), (0.17, 0.18, 2.89), green, trim)
box('Green overhead portal trim', (0, -0.13, 2.84), (5.13, 0.2, 0.2), green, trim)
lighting = group('Black track and spotlights', 0.83, 0.95, (0, 0, 0.25))
box('Black lighting track', (0, -0.29, 3.12), (3.8, 0.07, 0.045), black, lighting)
for x in (-1.45, -0.48, 0.48, 1.45):
    cylinder('Architectural black spotlight', (x, -0.29, 2.97), 0.07, 0.23, black, lighting)
    lathe('Spotlight recessed reflector', (x, -0.29, 2.858),
          [(0.060, 0.015), (0.054, 0), (0.03, 0.033), (0.02, 0.04)], chrome, lighting)
    cylinder('Warm spotlight recessed lens', (x, -0.29, 2.895), 0.025, 0.008, ceramic, lighting)

props = group('Quiet final styling', 0.9, 0.98, (0, 0, 0.15))
for index in range(3):
    cylinder('Ceramic storage jar', (-2.13, 2.35, 0.61 + index * 0.49), 0.105, 0.23, ceramic, props)
    cylinder('Oak jar lid', (-2.13, 2.35, 0.735 + index * 0.49), 0.107, 0.025, wood, props)
box('Oak chopping board', (0.92, 3.03, 1.18), (0.28, 0.03, 0.4), wood, props, bevel=0.025)
lathe('Hollow stoneware serving bowl', (0.72, -0.6, 1.067),
      [(0, 0), (0.075, 0), (0.085, 0.015), (0.14, 0.035), (0.17, 0.09),
       (0.168, 0.098), (0.158, 0.093), (0.13, 0.046), (0.07, 0.023), (0, 0.023)], ceramic, props)


def area(name, location, energy, size, target, color=(1, 0.9, 0.75)):
    bpy.ops.object.light_add(type='AREA', location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.energy = energy
    obj.data.shape = 'DISK'
    obj.data.size = size
    obj.data.color = color
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


area('Large soft window left of camera', (-4.5, -2.5, 2.8), 750, 3.2, (0, 1.4, 1), (1, 0.96, 0.88))
area('Soft front fill', (2.4, -4, 2.6), 125, 3, (0, 2, 1.4), (0.83, 0.91, 1))
area('Ceiling bounce', (0, 1.4, 3.05), 80, 2.5, (0, 1.4, 0))
practical_lights.append(area('Under cabinet warm wash', (0, 2.7, 1.67), 0, 1.6, (0, 2.8, 0.95)))
for x in (-1.45, -0.48, 0.48, 1.45):
    practical_lights.append(area('Track pool of light', (x, -0.3, 2.83), 0, 0.18, (x, -0.5, 0)))

bpy.ops.object.camera_add(location=(3.7, -7.8, 2.65))
camera = bpy.context.object
camera.name = 'Locked reference-inspired architectural camera'
camera.rotation_euler = (Vector((-0.15, 1.3, 1.5)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 38
if args.mobile:
    camera.location = (1.0, -9.8, 2.6)
    camera.rotation_euler = (Vector((0, 0.9, 1.55)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.sensor_fit = 'HORIZONTAL'
    camera.data.lens = 62
scene.camera = camera


def smooth(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)


def set_progress(progress):
    for obj, start, end, offset in animated:
        t = smooth((progress - start) / (end - start))
        # Children, including doors/handles, keep real dimensions. Assemblies
        # translate as rigid objects; they never stretch or flatten into place.
        for child in obj.children:
            child.hide_render = t <= 0
        obj.location = Vector(offset) * (1 - t)
    for index, light in enumerate(practical_lights):
        light.data.energy = (45 if index == 0 else 18) * smooth((progress - 0.89) / 0.08)


set_progress(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.abspath(args.output), 'reference-kitchen.blend'))
frames = []
for part in args.frames.split(','):
    if ':' in part:
        start, end = [int(value) for value in part.split(':')]
        frames.extend(range(start, end + 1))
    else:
        frames.append(int(part))
previous_pose = None
previous_file = None
for frame in frames:
    progress = (frame - 1) / 149
    set_progress(progress)
    pose = (
        tuple(round(smooth((progress - start) / (end - start)), 6) for _, start, end, _ in animated),
        tuple(round(light.data.energy, 6) for light in practical_lights),
    )
    scene.render.filepath = os.path.join(os.path.abspath(args.output), f'frame_{frame:04d}.png')
    if pose == previous_pose and previous_file:
        shutil.copyfile(previous_file, scene.render.filepath)
    else:
        bpy.ops.render.render(write_still=True)
    previous_pose, previous_file = pose, scene.render.filepath
    print(f'RTM_FRAME_COMPLETE {frame}', flush=True)
