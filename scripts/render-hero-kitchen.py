"""Original, procedural concept film. Run with Blender 4.5 LTS, not application Python.

blender --background --python scripts/render-hero-kitchen.py -- --output .tools/kitchen-render
All geometry/materials are authored here. No stock model, customer content or paid asset.
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
parser.add_argument('--frames', default='1,150')
parser.add_argument('--width', type=int, default=1920)
parser.add_argument('--height', type=int, default=1080)
parser.add_argument('--samples', type=int, default=32)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
os.makedirs(args.output, exist_ok=True)
random.seed(23)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPTIX'
scene.cycles.seed = 23
scene.cycles.use_animated_seed = False
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.06
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 3
scene.render.resolution_x = args.width
scene.render.resolution_y = args.height
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.fps = 30
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.world = bpy.data.worlds.new('Soft daylight')
scene.world.use_nodes = True
world_nodes = scene.world.node_tree.nodes
world_nodes['Background'].inputs['Color'].default_value = (0.9, 0.94, 1, 1)
world_nodes['Background'].inputs['Strength'].default_value = 0.35

preferences = bpy.context.preferences.addons['cycles'].preferences
try:
    preferences.compute_device_type = 'OPTIX'
    preferences.get_devices()
    for device in preferences.devices:
        device.use = device.type == 'OPTIX'
    if any(device.use for device in preferences.devices):
        scene.cycles.device = 'GPU'
except Exception:
    scene.cycles.device = 'CPU'
if scene.cycles.device != 'GPU':
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'


def material(name, color, roughness=0.45, metal=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metal
    return mat


ivory = material('Warm lime plaster', (0.72, 0.68, 0.59), 0.82)
ceiling_mat = material('Warm white ceiling', (0.88, 0.85, 0.76), 0.8)
raw_mat = material('Unfinished mineral floor', (0.29, 0.29, 0.27), 0.93)

# Reference swatch #D7DBDC, converted from sRGB to scene-linear for Blender.
def linear_srgb(rgb):
    return tuple(
        ((value / 255 + 0.055) / 1.055) ** 2.4
        if value / 255 > 0.04045 else value / 255 / 12.92
        for value in rgb
    )


# Compensate for this scene's bright architectural lighting so the rendered
# fronts retain the reference's light grey tone instead of reading as white.
joinery_color = tuple(channel * 0.45 for channel in linear_srgb((215, 219, 220)))
joinery = material('Satin light grey joinery D7DBDC', joinery_color, 0.33)
joinery_inset = material('Recessed light grey panels', joinery_color, 0.38)
foliage = material('Olive foliage', (0.018, 0.055, 0.028), 0.33)
brass = material('Brushed brass', (0.56, 0.34, 0.105), 0.27, 0.78)
black = material('Soft black metal', (0.016, 0.02, 0.017), 0.28, 0.3)
glass = material('Smoked oven glazing', (0.025, 0.037, 0.032), 0.1, 0.35)
wood = material('Natural oak', (0.32, 0.19, 0.095), 0.48)
linen = material('Sand linen', (0.55, 0.48, 0.36), 0.9)
ceramic = material('Warm stone ceramic', (0.66, 0.59, 0.46), 0.37)

marble = material('Ivory marble with fine grey veins', (0.82, 0.81, 0.75), 0.2)
nodes = marble.node_tree.nodes
links = marble.node_tree.links
tex = nodes.new('ShaderNodeTexNoise')
tex.inputs['Scale'].default_value = 3.2
tex.inputs['Detail'].default_value = 3
tex.inputs['Roughness'].default_value = 0.72
tex.inputs['Distortion'].default_value = 1.7
coord = nodes.new('ShaderNodeTexCoord')
mapping = nodes.new('ShaderNodeVectorMath')
mapping.operation = 'MULTIPLY'
mapping.inputs[1].default_value = (0.8, 4, 1.5)
links.new(coord.outputs['Generated'], mapping.inputs[0])
links.new(mapping.outputs['Vector'], tex.inputs['Vector'])
ramp = nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position = 0.46
ramp.color_ramp.elements[0].color = (0.86, 0.84, 0.77, 1)
ramp.color_ramp.elements[1].position = 0.51
ramp.color_ramp.elements[1].color = (0.48, 0.51, 0.48, 1)
ramp.color_ramp.elements.new(0.535).color = (0.86, 0.84, 0.77, 1)
links.new(tex.outputs['Fac'], ramp.inputs[0])
links.new(ramp.outputs['Color'], nodes['Principled BSDF'].inputs['Base Color'])

animated = []


def box(name, location, dimensions, mat, bevel=0.012, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Soft machined edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    obj.parent = parent
    return obj


def cylinder(name, location, radius, depth, mat, parent=None, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new('Rounded edge', 'BEVEL')
    bevel.width = min(radius / 4, 0.015)
    bevel.segments = 3
    obj.parent = parent
    if rotation:
        obj.rotation_euler = rotation
    return obj


def group(name, start, end, direction='up'):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    animated.append((obj, start, end, direction))
    return obj


def panel(name, x, y, z, w, h, parent):
    box(name + ' inset', (x, y + 0.012, z), (w - 0.04, 0.035, h - 0.04), joinery_inset, parent=parent)
    for dx in (-w / 2 + 0.035, w / 2 - 0.035):
        box(name + ' stile', (x + dx, y - 0.012, z), (0.07, 0.065, h), joinery, parent=parent)
    for dz in (-h / 2 + 0.035, h / 2 - 0.035):
        box(name + ' rail', (x, y - 0.012, z + dz), (w - 0.14, 0.065, 0.07), joinery, parent=parent)
    cylinder(name + ' pull', (x + w * 0.29, y - 0.07, z + 0.1), 0.011, 0.15, brass, parent)


# Shell is already present in the first frame; no camera movement or crossfading photographs.
box('Concrete slab', (0, -3, -0.09), (12, 18, 0.16), raw_mat)
box('Back plaster wall', (0, 3.55, 1.8), (8.4, 0.2, 3.6), ivory)
box('Right plaster wall', (4.1, -1, 1.8), (0.2, 9, 3.6), ivory)
box('Window lower wall', (-4.1, 0.4, 0.28), (0.18, 6.3, 0.56), ivory)
box('Window upper wall', (-4.1, 0.4, 3.35), (0.18, 6.3, 0.5), ivory)
for y in (-2.7, 3.5):
    box('Window wall pier', (-4.1, y, 1.8), (0.18, 0.25, 3.6), ivory)
for y in (-2.5, -0.55, 1.4, 3.3):
    box('Slim bronze window mullion', (-4.08, y, 1.83), (0.1, 0.065, 2.55), brass)
box('Window sill', (-4.0, 0.4, 0.59), (0.35, 6.0, 0.07), ceramic)
# Exterior backdrop geometry is procedural too; no downloaded imagery or HDRI.
garden = material('Distant garden foliage', (0.055, 0.13, 0.045), 1)
sky = material('Soft exterior sky', (0.55, 0.72, 0.86), 1)
sky.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (0.55, 0.72, 0.86, 1)
sky.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.7
box('Distant sky outside windows', (-18, 0, 5), (0.1, 35, 18), sky, 0)
box('Garden ground', (-10, 0, -0.12), (12, 35, 0.1), garden, 0)
box('Upper ceiling structure', (0, -2, 3.63), (8.5, 12, 0.13), raw_mat)
for x in (-3, -1, 1, 3):
    box('Exposed ceiling rib', (x, 0.4, 3.46), (0.08, 7.8, 0.15), raw_mat)
finish = group('Refined ceiling', 0.12, 0.25, 'down')
box('Finished ceiling', (0, -2, 3.38), (8.25, 12, 0.1), ceiling_mat, parent=finish)

# Oak floor appears before the cabinetry. Each plank is an individually shaded element.
floor = group('Oak flooring', 0.12, 0.27)
for row in range(24):
    y = -4.8 + row * 0.35
    for col in range(5):
        x = -4.8 + col * 2.05 + (row % 2) * 0.65
        plank_mat = material(f'Oak tone {row}-{col}', (0.3 + random.random() * 0.08, 0.18 + random.random() * 0.045, 0.09 + random.random() * 0.025), 0.52)
        grain = plank_mat.node_tree.nodes.new('ShaderNodeTexNoise')
        grain.inputs['Scale'].default_value = 3
        grain.inputs['Detail'].default_value = 2
        grain_coord = plank_mat.node_tree.nodes.new('ShaderNodeTexCoord')
        grain_scale = plank_mat.node_tree.nodes.new('ShaderNodeVectorMath')
        grain_scale.operation = 'MULTIPLY'
        grain_scale.inputs[1].default_value = (1, 80, 3)
        plank_mat.node_tree.links.new(grain_coord.outputs['Generated'], grain_scale.inputs[0])
        plank_mat.node_tree.links.new(grain_scale.outputs['Vector'], grain.inputs['Vector'])
        bump = plank_mat.node_tree.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.12
        bump.inputs['Distance'].default_value = 0.025
        plank_mat.node_tree.links.new(grain.outputs['Fac'], bump.inputs['Height'])
        plank_mat.node_tree.links.new(bump.outputs['Normal'], plank_mat.node_tree.nodes['Principled BSDF'].inputs['Normal'])
        box('Oak plank', (x, y, 0.014), (2.049, 0.349, 0.025), plank_mat, 0.001, floor)

# Rear wall cabinetry, stone backsplash, full-height integrated refrigerator and oven.
stone = group('Stone backsplash', 0.32, 0.47)
box('Full height marble backdrop', (0.25, 3.39, 1.78), (5.25, 0.06, 2.86), marble, parent=stone)
for i, x in enumerate((-2.0, -1.15, -0.3, 0.55, 1.4, 2.25)):
    cabinet = group(f'Base cabinet {i}', 0.24 + i * 0.012, 0.37 + i * 0.012)
    box('Base cabinet carcass', (x, 3.0, 0.5), (0.83, 0.7, 0.88), joinery, parent=cabinet)
    panel('Shaker door', x, 2.63, 0.53, 0.81, 0.78, cabinet)
    box('Recessed plinth', (x, 3.04, 0.09), (0.75, 0.57, 0.12), black, parent=cabinet)
    box('Rear marble worktop', (x, 2.98, 0.98), (0.85, 0.83, 0.07), marble, parent=cabinet)

tall = group('Tall light grey cabinetry', 0.27, 0.43)
box('Tall cupboard body', (-3.15, 3.0, 1.5), (1.35, 0.75, 2.94), joinery, parent=tall)
panel('Integrated fridge lower', -3.15, 2.61, 0.78, 1.30, 1.42, tall)
panel('Integrated fridge upper', -3.15, 2.61, 2.24, 1.30, 1.44, tall)
box('Oven black frame', (2.25, 2.57, 0.55), (0.70, 0.08, 0.63), black, parent=tall)
box('Oven glass', (2.25, 2.515, 0.53), (0.58, 0.02, 0.39), glass, parent=tall)
cylinder('Oven brass rail', (2.25, 2.48, 0.78), 0.012, 0.56, brass, tall, (0, math.pi / 2, 0))
box('Black induction hob', (0.65, 2.95, 1.023), (0.75, 0.52, 0.012), glass, parent=tall)

upper = group('Upper light grey cabinetry', 0.36, 0.50)
for i, x in enumerate((-1.75, -0.82, 0.11, 1.04, 1.97)):
    box('Upper cabinet body', (x, 3.17, 2.7), (0.91, 0.4, 0.79), joinery, parent=upper)
    panel('Upper shaker door', x, 2.95, 2.7, 0.89, 0.75, upper)

# Centre island: ribbed light grey carcass, thick marble top and waterfall end.
island = group('Marble and light grey island', 0.49, 0.69)
box('Island shadow plinth', (0, 0.1, 0.09), (2.7, 1.05, 0.15), black, parent=island)
box('Island light grey base', (0, 0.1, 0.54), (2.85, 1.13, 0.88), joinery, parent=island)
for i in range(38):
    cylinder('Island fluted front', (-1.37 + i * 0.074, -0.49, 0.55), 0.031, 0.82, joinery, island)
# Four connected stone pieces leave a real inset opening without a Boolean dependency.
box('Island slab left of sink', (-1.27, 0.04, 1.04), (0.74, 1.51, 0.09), marble, 0.007, island)
box('Island slab right of sink', (0.67, 0.04, 1.04), (1.94, 1.51, 0.09), marble, 0.007, island)
box('Island slab in front of sink', (-0.6, -0.35, 1.04), (0.6, 0.73, 0.09), marble, 0.007, island)
box('Island slab behind sink', (-0.6, 0.62, 1.04), (0.6, 0.35, 0.09), marble, 0.007, island)
box('Marble waterfall end', (1.57, 0.04, 0.55), (0.09, 1.51, 1.02), marble, 0.012, island)
box('Inset sink basin', (-0.6, 0.23, 0.94), (0.58, 0.42, 0.025), black, 0.025, island)
for x in (-0.895, -0.305):
    box('Inset sink side', (x, 0.23, 1.005), (0.012, 0.43, 0.13), black, 0.004, island)
for y in (0.02, 0.44):
    box('Inset sink side', (-0.6, y, 1.005), (0.6, 0.012, 0.13), black, 0.004, island)
cylinder('Brass faucet upright', (-0.6, 0.51, 1.25), 0.022, 0.35, brass, island)
cylinder('Brass faucet spout', (-0.6, 0.43, 1.43), 0.022, 0.19, brass, island, (math.pi / 2, 0, 0))

# Two stools arrive after the island, with soft upholstered seats and slender brass frames.
for i, x in enumerate((-0.9, 0.3)):
    stool = group(f'Counter stool {i}', 0.63 + i * 0.025, 0.78 + i * 0.025)
    cylinder('Upholstered stool seat', (x, -1.05, 0.69), 0.25, 0.12, linen, stool)
    for dx in (-0.17, 0.17):
        for dy in (-0.17, 0.17):
            cylinder('Stool slender leg', (x + dx, -1.05 + dy, 0.34), 0.014, 0.64, brass, stool)

# Hanging wires are present in the bare room; brass light fixtures arrive at the end.
lamps = group('Brass pendant lights', 0.73, 0.88, 'down')
lamp_lights = []
for x in (-1.0, 0, 1.0):
    cylinder('Bare suspension cable', (x, 0.05, 2.93), 0.006, 0.82, black)
    cylinder('Brass pendant canopy', (x, 0.05, 3.29), 0.07, 0.035, brass, lamps)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=1, location=(x, 0.05, 2.44))
    shade = bpy.context.object
    shade.name = 'Brushed brass pendant shade'
    shade.scale = (0.24, 0.24, 0.17)
    shade.parent = lamps
    shade.data.materials.append(brass)
    for polygon in shade.data.polygons:
        polygon.use_smooth = True
    bpy.ops.object.light_add(type='AREA', location=(x, 0.05, 2.27))
    light = bpy.context.object
    light.data.energy = 35
    light.data.color = (1, 0.77, 0.48)
    light.data.shape = 'DISK'
    light.data.size = 0.25
    lamp_lights.append(light)

props = group('Final styling', 0.83, 0.95)
cylinder('Stoneware vase', (0.75, 0.3, 1.24), 0.11, 0.31, ceramic, props)
for i in range(3):
    cylinder('Stem', (0.75 + i * 0.03, 0.3, 1.55 + i * 0.04), 0.004, 0.42, wood, props)
    for j in range(5):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.055, location=(0.75 + i * 0.03 + (-1 if j % 2 else 1) * 0.025, 0.3, 1.48 + j * 0.065 + i * 0.04))
        leaf = bpy.context.object
        leaf.name = 'Slender olive leaf'
        leaf.scale = (0.3, 0.08, 0.8)
        leaf.rotation_euler.y = (-1 if j % 2 else 1) * 0.6
        leaf.parent = props
        leaf.data.materials.append(foliage)


def area(name, location, energy, size, target, color=(1, 0.91, 0.78)):
    bpy.ops.object.light_add(type='AREA', location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.energy = energy
    obj.data.shape = 'DISK'
    obj.data.size = size
    obj.data.color = color
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


area('Daylight through large windows', (-4.8, -0.2, 3.0), 1800, 5, (0, 1, 1))
area('Soft front bounce', (1, -5, 3.2), 950, 5, (0, 2.5, 1.2))
area('Ceiling bounce', (0, 0, 3.25), 350, 3, (0, 0, 0))
bpy.ops.object.camera_add(location=(3.3, -5.4, 2.05))
camera = bpy.context.object
camera.name = 'Locked architectural camera'
camera.rotation_euler = (Vector((-0.25, 1.9, 1.65)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 28
scene.camera = camera


def smooth(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)


def set_progress(progress):
    for obj, start, end, direction in animated:
        t = smooth((progress - start) / (end - start))
        obj.hide_render = t <= 0
        obj.scale = (1, 1, max(0.001, t))
        obj.location.z = (1 - t) * (3.6 if direction == 'down' else -0.1)
    for light in lamp_lights:
        light.data.energy = 35 * smooth((progress - 0.8) / 0.13)


set_progress(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.abspath(args.output), 'concept-kitchen.blend'))
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
    pose = tuple(round(smooth((progress - start) / (end - start)), 6) for _, start, end, _ in animated)
    scene.render.filepath = os.path.join(os.path.abspath(args.output), f'frame_{frame:04d}.png')
    if previous_pose == pose and previous_file:
        shutil.copyfile(previous_file, scene.render.filepath)
    else:
        bpy.ops.render.render(write_still=True)
    previous_pose = pose
    previous_file = scene.render.filepath
    print(f'RTM_FRAME_COMPLETE {frame}', flush=True)
