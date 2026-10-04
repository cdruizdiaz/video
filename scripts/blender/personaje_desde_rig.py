"""Construye en Blender el modelo 3D de un personaje de la biblioteca de rigs, a partir de sus piezas vectoriales
(public/personajes/<nombre>/piezas.json, vista frente) y su esqueleto (rig.json): mismos huesos, mismos pivotes.
Así el modelo 3D se anima con las MISMAS poses del rig 2D (scripts/blender/poses.ts → render.py).

  cabeza, cuerpo        → elipsoides con las medidas de su caja (con modificador de subdivisión)
  manos, pies           → elipsoides chicos en la punta de la pieza
  pétalos / pelo / resto→ el contorno de la pieza extruido con bisel (los de la corona, inclinados hacia atrás)
  cara                  → calcomanía (plano con shrinkwrap sobre la cabeza) con la textura de la cara 2D
                          (composición CaraTextura de Remotion: expresiones, parpadeo y boca del rig)
  contorno              → modificador Solidify con normales invertidas (línea de dibujo animado)

Uso:  blender -b -P scripts/blender/personaje_desde_rig.py -- <nombre> [--cara carpeta_png | archivo.png]
Salida: C:/Videos/personajes/<nombre>/<nombre>_3d.blend y public/personajes/<nombre>/<nombre>.glb
Unidades: 1 pt del .ai = 1 cm. Ejes: x a la derecha, z hacia arriba, la cámara mira hacia +Y (adelante = -Y).
"""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

RAIZ = Path(__file__).resolve().parents[2]
HERR = json.loads((RAIZ / "scripts/herramientas.json").read_text(encoding="utf-8"))
PT = 0.01  # metros por punto del .ai

# Formas (las mismas proporciones que src/personajes/bloomie/Bloomie3D.tsx)
PROF = {"cabeza": 0.72, "cuerpo": 0.78}
PETALO = {"grosor": 16, "bisel": 6, "atras": -42, "inclina": 0.42}
CONTORNO = 2.6  # pt
COLOR_CONTORNO = "#a8650a"
CARA = {"delante": 1.25, "subdiv": 24}  # la calcomanía arranca a 1,25 radios delante del centro y se proyecta


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not a:
        print(__doc__)
        sys.exit(1)
    cara = a[a.index("--cara") + 1] if "--cara" in a else None
    return a[0], cara


def a_blender(x, y, z=0.0):
    """Coordenadas del .ai (y hacia abajo, z hacia la cámara) → Blender."""
    return Vector((x * PT, -z * PT, -y * PT))


def hex_rgba(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


def material(nombre, color, rugosidad=0.6):
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = hex_rgba(color)
    bsdf.inputs["Roughness"].default_value = rugosidad
    m.diffuse_color = hex_rgba(color)
    return m


def material_contorno():
    m = bpy.data.materials.get("contorno") or bpy.data.materials.new("contorno")
    m.use_nodes = True
    m.use_backface_culling = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = hex_rgba(COLOR_CONTORNO)
    bsdf.inputs["Roughness"].default_value = 1.0
    return m


def con_contorno(obj, grosor=CONTORNO):
    """Línea de dibujo animado: cáscara un poco más grande con las normales invertidas (solo se ve el borde)."""
    obj.data.materials.append(material_contorno())
    s = obj.modifiers.new("contorno", "SOLIDIFY")
    s.thickness = grosor * PT
    s.offset = 1
    s.use_flip_normals = True
    s.use_rim = False
    s.material_offset = len(obj.data.materials) - 1


def elipsoide(nombre, c, r, color):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1)
    o = bpy.context.active_object
    o.name = nombre
    o.location = a_blender(*c)
    o.scale = (r[0] * PT, r[2] * PT, r[1] * PT)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    o.data.materials.append(material(f"mat_{nombre}", color))
    con_contorno(o)
    return o


def extruido(nombre, d, caja, color, grosor, bisel):
    """Contorno SVG de una pieza → curva importada → extruida con bisel → malla, ajustada a la caja de la pieza."""
    tmp = Path(bpy.app.tempdir) / f"{nombre}.svg"
    tmp.write_text(f'<svg xmlns="http://www.w3.org/2000/svg"><path d="{d}" fill="#000"/></svg>', encoding="utf-8")
    antes = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=str(tmp))
    nuevos = [o for o in bpy.data.objects if o not in antes and o.type == "CURVE"]
    if not nuevos:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for o in nuevos:
        o.select_set(True)
    bpy.context.view_layer.objects.active = nuevos[0]
    if len(nuevos) > 1:
        bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = nombre
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.active_object
    # El importador deja la curva en el plano XY: se la para en el plano de la pantalla (XZ)
    o.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # Ajustar a la caja de la pieza (en pt) sin depender de las unidades del importador
    vs = [o.matrix_world @ v.co for v in o.data.vertices]
    x0, x1 = min(v.x for v in vs), max(v.x for v in vs)
    z0, z1 = min(v.z for v in vs), max(v.z for v in vs)
    ox0, ox1 = caja[0] * PT, caja[2] * PT
    oz0, oz1 = -caja[3] * PT, -caja[1] * PT
    sx = (ox1 - ox0) / max(1e-9, x1 - x0)
    sz = (oz1 - oz0) / max(1e-9, z1 - z0)
    for v in o.data.vertices:
        w = o.matrix_world @ v.co
        v.co = o.matrix_world.inverted() @ Vector((ox0 + (w.x - x0) * sx, w.y, oz0 + (w.z - z0) * sz))
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    # Volumen: solidify (grosor) + bisel en los bordes
    sol = o.modifiers.new("grosor", "SOLIDIFY")
    sol.thickness = grosor * PT
    sol.offset = 0
    bev = o.modifiers.new("bisel", "BEVEL")
    bev.width = bisel * PT
    bev.segments = 3
    bev.limit_method = "ANGLE"
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.shade_smooth()
    o.data.materials.clear()  # el importador de SVG deja su propio material (negro) en el primer lugar
    o.data.materials.append(material(f"mat_{nombre}", color))
    con_contorno(o, CONTORNO * 0.8)
    return o


def main():
    nombre, cara_fuente = args()
    piezas = json.loads((RAIZ / f"public/personajes/{nombre}/piezas.json").read_text(encoding="utf-8"))
    rig = json.loads((RAIZ / f"public/personajes/{nombre}/rig.json").read_text(encoding="utf-8"))
    v = piezas["vistas"]["frente"]
    rv = rig["vistas"]["frente"]
    bpy.ops.wm.read_factory_settings(use_empty=True)

    caja2 = lambda c: ((c[0] + c[2]) / 2, (c[1] + c[3]) / 2, (c[2] - c[0]) / 2, (c[3] - c[1]) / 2)
    color_de = lambda p: next((t["fill"] for t in p["trazos"] if t.get("fill") and t.get("op", 1) > 0.9), "#888888")
    pieza = {p["id"]: p for p in v["piezas"]}
    id_cabeza = (v.get("cabeza") or {}).get("id", "cabeza")
    cab = caja2(pieza[id_cabeza]["caja"]) if id_cabeza in pieza else caja2(v["caja"])
    objetos = {}  # pieza → objeto

    for p in v["piezas"]:
        pid, rol = p["id"], p.get("rol", "")
        cx, cy, rx, ry = caja2(p["caja"])
        if pid == id_cabeza:
            objetos[pid] = elipsoide(pid, (cx, cy, 0), (rx * 0.98, ry * 0.98, rx * PROF["cabeza"]), color_de(p))
        elif pid.startswith("cuerpo"):
            objetos[pid] = elipsoide(pid, (cx, cy + 6, -8), (rx * 0.82, ry * 1.05, rx * PROF["cuerpo"]), color_de(p))
        elif pid.startswith("mano"):
            x = p["caja"][0] + 16 if cx < 0 else p["caja"][2] - 16
            objetos[pid] = elipsoide(pid, (x, p["caja"][3] - 26, 14), (15, 22, 15), color_de(p))
        elif pid.startswith("pie"):
            objetos[pid] = elipsoide(pid, (cx + (2 if cx < 0 else -2), -15, 6), (20, 15, 25), color_de(p))
        else:
            t = next((t for t in p["trazos"] if t.get("fill") and t.get("op", 1) > 0.9), None)
            if not t:
                continue
            o = extruido(pid, t["d"], p["caja"], color_de(p), PETALO["grosor"], PETALO["bisel"])
            if not o:
                continue
            if rol == "corona":
                # detrás de la cabeza e inclinado hacia atrás desde su raíz (el pivote de su hueso)
                hueso = next((h for h in rv["huesos"] if h["id"] == rv["piezas"].get(pid)), None)
                piv = hueso["pivote"] if hueso else (cx, cy)
                o.location.y += -PETALO["atras"] * PT
                ux, uy = cx - cab[0], cy - cab[1]
                n = math.hypot(ux, uy) or 1
                eje = a_blender(-uy / n, ux / n).normalized()
                pivote = a_blender(piv[0], piv[1], PETALO["atras"])
                rot = Matrix.Rotation(-PETALO["inclina"], 4, eje)
                o.matrix_world = Matrix.Translation(pivote) @ rot @ Matrix.Translation(-pivote) @ o.matrix_world
            objetos[pid] = o

    # ---------- Esqueleto (mismos huesos y pivotes que rig.json, roll 0, apuntando hacia arriba) ----------
    arm_data = bpy.data.armatures.new(f"{nombre}_rig")
    arm = bpy.data.objects.new(f"{nombre}_rig", arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    for h in rv["huesos"]:
        b = arm_data.edit_bones.new(h["id"])
        b.head = a_blender(*h["pivote"])
        b.tail = b.head + Vector((0, 0, 0.08))
        b.roll = 0
        eb[h["id"]] = b
    for h in rv["huesos"]:
        if h["padre"] and h["padre"] in eb:
            eb[h["id"]].parent = eb[h["padre"]]
            eb[h["id"]].use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")

    # Piezas pegadas a su hueso (peso 1: rígido, como el recorte 2D)
    for pid, o in objetos.items():
        hueso = rv["piezas"].get(pid, "raiz")
        g = o.vertex_groups.new(name=hueso)
        g.add([vv.index for vv in o.data.vertices], 1.0, "REPLACE")
        mod = o.modifiers.new("rig", "ARMATURE")
        mod.object = arm
        o.parent = arm

    # ---------- Cara: calcomanía sobre la cabeza ----------
    if id_cabeza in objetos:
        cabeza = objetos[id_cabeza]
        lado = max(cab[2], cab[3]) * 2 * (1 + 2 * 0.06)  # = cajaCara de src/rig/CaraTextura.tsx
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=CARA["subdiv"], y_subdivisions=CARA["subdiv"], size=lado * PT)
        dec = bpy.context.active_object
        dec.name = "cara"
        dec.rotation_euler = (math.radians(90), 0, 0)
        dec.location = a_blender(cab[0], cab[1], cab[2] * PROF["cabeza"] * CARA["delante"])
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        # UV: la grilla ya trae UV 0–1; se proyecta sobre la cabeza hacia atrás (+Y) y queda un pelo afuera
        sw = dec.modifiers.new("sobre_cabeza", "SHRINKWRAP")
        sw.target = cabeza
        sw.wrap_method = "PROJECT"
        sw.use_project_y = True
        sw.use_negative_direction = True
        sw.use_positive_direction = True
        sw.offset = 0.6 * PT
        bpy.ops.object.modifier_apply(modifier=sw.name)
        # quitar los vértices que no tocaron la cabeza (quedaron en el plano): fuera de la cara
        # (los que tocaron se corrieron hacia +Y, hacia la cabeza; los demás siguen en el plano, el y más chico)
        bm = bmesh.new()
        bm.from_mesh(dec.data)
        y_plano = min(vv.co.y for vv in bm.verts)
        fuera = [vv for vv in bm.verts if abs(vv.co.y - y_plano) < 1e-5]
        bmesh.ops.delete(bm, geom=fuera, context="VERTS")
        bm.to_mesh(dec.data)
        bm.free()
        bpy.ops.object.shade_smooth()
        m = bpy.data.materials.new("cara")
        m.use_nodes = True
        m.blend_method = "HASHED" if hasattr(m, "blend_method") else None
        nt = m.node_tree
        bsdf = nt.nodes.get("Principled BSDF")
        bsdf.inputs["Roughness"].default_value = 0.7
        img_nodo = nt.nodes.new("ShaderNodeTexImage")
        img_nodo.name = "textura_cara"
        img_nodo.extension = "CLIP"
        nt.links.new(img_nodo.outputs["Color"], bsdf.inputs["Base Color"])
        nt.links.new(img_nodo.outputs["Alpha"], bsdf.inputs["Alpha"])
        if cara_fuente:
            fuente = Path(cara_fuente).resolve()
            pngs = sorted(fuente.glob("*.png")) if fuente.is_dir() else [fuente]
            if pngs:
                img = bpy.data.images.load(str(pngs[0]))
                if len(pngs) > 1:
                    img.source = "SEQUENCE"
                    img_nodo.image_user.frame_duration = len(pngs)
                    img_nodo.image_user.frame_start = 1
                    img_nodo.image_user.use_auto_refresh = True
                img_nodo.image = img
        dec.data.materials.append(m)
        dec.visible_shadow = False  # la calcomanía no proyecta sombra sobre la cabeza
        hueso = rv["rostro"]["hueso"]
        g = dec.vertex_groups.new(name=hueso)
        g.add([vv.index for vv in dec.data.vertices], 1.0, "REPLACE")
        mod = dec.modifiers.new("rig", "ARMATURE")
        mod.object = arm
        dec.parent = arm

    # ---------- Guardar ----------
    blend = Path(HERR["carpetaPersonajes"]) / nombre / f"{nombre}_3d.blend"
    blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    glb = RAIZ / f"public/personajes/{nombre}/{nombre}.glb"
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", use_selection=False, export_apply=False)
    print(f"OK {blend} · {glb.relative_to(RAIZ)} · {len(objetos)} piezas · {len(rv['huesos'])} huesos")


main()
