"""Render en Blender (Eevee) de un personaje 3D con las poses del rig, como capa con transparencia para Remotion.

Uso:  blender -b <personaje>_3d.blend -P scripts/blender/render.py -- <escena.json> <carpeta_png>
escena.json:
  { "poses": "ruta/poses.json",          # de scripts/blender/poses.ts (cuadro a cuadro, mismas pistas que el 2D)
    "ancho": 1080, "alto": 1920,         # px del cuadro de Remotion
    "rotY": 0 | [r0, r1, …],             # giro del personaje (radianes; lista = uno por cuadro)
    "luz": { "angulo": 135, "altura": 50, "intensidad": 3.0 },   # ángulo en pantalla (0 = desde la derecha,
                                         # 90 = desde arriba, 135 = arriba a la izquierda), como el brief 2,5D
    "cara": "carpeta_png" | null,        # textura animada de la cara (composición CaraTextura o PNG propios)
    "tarjetas": [ … ],                   # accesorios planos pegados a huesos (ver tarjetas())
    "estilo": "suave" | "toon",
    "muestras": 16,
    "contraluz": { "angulo": 25, "atras": 40, "intensidad": 4, "color": "#8fd8ff" },   # opcional: luz desde atrás
                                         # (ángulo en pantalla como "luz"; atras = grados por detrás del personaje)
    "huesosExtra": { "<hueso>": { "z": [...], "cabeceo": [...], "yaw": [...] } },      # opcional, uno por cuadro:
                                         # z en pt hacia la cámara (manos delante del cuerpo), cabeceo en grados
                                         # (+ = mira hacia abajo), yaw en radianes (+ = como rotY)
    "solo": [12, 40, …] }               # opcional: renderiza solo esos cuadros (0…n-1) → f0013.png, f0041.png…
Cámara ortográfica en px: un punto del .ai mide `lugar.escala` px y los pies van en (lugar.x, lugar.y) de cada
cuadro (los trayectos del rig incluidos), igual que en PersonajeRig.
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Vector

PT = 0.01


def hex_lin(h):
    h = h.lstrip("#")
    return tuple(((c / 255) / 12.92 if c / 255 <= 0.04045 else ((c / 255 + 0.055) / 1.055) ** 2.4) for c in (int(h[i:i + 2], 16) for i in (0, 2, 4)))


def tarjetas(lista, arm, n):
    """Accesorios planos (guitarra, pañuelo, una mano especial…) dentro de la escena 3D: un plano con la imagen,
    pegado a un hueso del rig (se mueve con él) y con visibilidad por tramos de cuadros.
    Cada tarjeta: { imagen, hueso, centro: [x, y] (pt del .ai, en reposo), z (pt hacia la cámara), ancho (pt),
                    rot (grados en pantalla, + = horario), visible: [[desde, hasta], …] (cuadros 0…n-1; null = siempre),
                    ocultar: "pieza" (objeto del modelo que se esconde mientras la tarjeta se ve), sombra: true }"""
    for t in lista:
        img = bpy.data.images.load(str(Path(t["imagen"]).resolve()))
        ancho = t["ancho"] * PT
        alto = ancho * img.size[1] / img.size[0]
        bpy.ops.mesh.primitive_plane_add(size=1)
        o = bpy.context.active_object
        o.name = Path(t["imagen"]).stem
        o.scale = (ancho, alto, 1)
        o.rotation_euler = Euler((math.radians(90), math.radians(t.get("rot", 0)), 0))  # al plano de la pantalla
        cx, cy = t["centro"]
        o.location = Vector((cx * PT, -t.get("z", 0) * PT, -cy * PT))
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        m = bpy.data.materials.new(o.name)
        m.use_nodes = True
        nt = m.node_tree
        bsdf = nt.nodes.get("Principled BSDF")
        bsdf.inputs["Roughness"].default_value = 0.65
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = img
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        o.data.materials.append(m)
        o.visible_shadow = t.get("sombra", True)
        g = o.vertex_groups.new(name=t["hueso"])
        g.add([v.index for v in o.data.vertices], 1.0, "REPLACE")
        mod = o.modifiers.new("rig", "ARMATURE")
        mod.object = arm
        o.parent = arm
        # Visibilidad por tramos (y la pieza que reemplaza, al revés)
        tramos = t.get("visible")
        if tramos is not None:
            oculta = bpy.data.objects.get(t["ocultar"]) if t.get("ocultar") else None
            for k in range(n):
                ve = any(a <= k < b for a, b in tramos)
                o.hide_render = not ve
                o.keyframe_insert("hide_render", frame=k + 1)
                if oculta:
                    oculta.hide_render = ve
                    oculta.keyframe_insert("hide_render", frame=k + 1)
        yield o


def main():
    a = sys.argv[sys.argv.index("--") + 1:]
    escena = json.loads(Path(a[0]).read_text(encoding="utf-8"))
    salida = Path(a[1]).resolve()  # Blender toma las rutas relativas desde el .blend
    salida.mkdir(parents=True, exist_ok=True)
    poses = json.loads(Path(escena["poses"]).resolve().read_text(encoding="utf-8"))
    cuadros = poses["cuadros"]
    n = len(cuadros)
    W, H = escena.get("ancho", 1080), escena.get("alto", 1920)

    sc = bpy.context.scene
    motores = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in motores else "BLENDER_EEVEE"
    try:
        sc.eevee.taa_render_samples = escena.get("muestras", 16)
    except AttributeError:
        pass
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"  # colores tal cual (sin Filmic/AgX: respeta la paleta)
    sc.frame_start, sc.frame_end = 1, n
    sc.render.fps = int(poses.get("fps", 30))

    # Luz: sol desde el ángulo de pantalla pedido + ambiente del mundo
    luz = escena.get("luz", {})
    ang = math.radians(luz.get("angulo", 135))
    alt = math.radians(luz.get("altura", 50))
    sol_d = bpy.data.lights.new("sol", "SUN")
    sol_d.energy = luz.get("intensidad", 3.0)
    if luz.get("color"):
        sol_d.color = hex_lin(luz["color"])
    sol_d.angle = math.radians(8)
    sol = bpy.data.objects.new("sol", sol_d)
    sc.collection.objects.link(sol)
    # dirección HACIA la luz en mundo: x = cos(ang), z = sin(ang) en pantalla, y = hacia la cámara (-Y)
    hacia = Vector((math.cos(ang) * math.cos(alt), -math.sin(alt), math.sin(ang) * math.cos(alt))).normalized()
    sol.rotation_euler = hacia.to_track_quat("Z", "Y").to_euler()
    # Contraluz (opcional): sol de color desde atrás, para recortar la silueta del fondo
    cl = escena.get("contraluz")
    if cl:
        cl_d = bpy.data.lights.new("contraluz", "SUN")
        cl_d.energy = cl.get("intensidad", 4.0)
        cl_d.color = hex_lin(cl.get("color", "#8fd8ff"))
        cl_d.angle = math.radians(6)
        clo = bpy.data.objects.new("contraluz", cl_d)
        sc.collection.objects.link(clo)
        a_cl, b_cl = math.radians(cl.get("angulo", 25)), math.radians(cl.get("atras", 40))
        hacia_cl = Vector((math.cos(a_cl) * math.cos(b_cl), math.sin(b_cl), math.sin(a_cl) * math.cos(b_cl))).normalized()
        clo.rotation_euler = hacia_cl.to_track_quat("Z", "Y").to_euler()
    mundo = bpy.data.worlds.new("mundo")
    mundo.use_nodes = True
    fondo = mundo.node_tree.nodes.get("Background")
    fondo.inputs["Color"].default_value = (*hex_lin("#fff4e0"), 1)
    fondo.inputs["Strength"].default_value = luz.get("ambiente", 0.9)
    sc.world = mundo

    # Estilo toon: reemplaza el BSDF por "Shader to RGB" + rampa de 3 tonos (como MeshToonMaterial en Remotion)
    if escena.get("estilo") == "toon":
        for m in bpy.data.materials:
            if m.name in ("contorno", "cara") or not m.node_tree:
                continue
            nt = m.node_tree
            bsdf = nt.nodes.get("Principled BSDF")
            salida_m = next(nd for nd in nt.nodes if nd.type == "OUTPUT_MATERIAL")
            dif = nt.nodes.new("ShaderNodeBsdfDiffuse")
            dif.inputs["Color"].default_value = bsdf.inputs["Base Color"].default_value
            rgb = nt.nodes.new("ShaderNodeShaderToRGB")
            rampa = nt.nodes.new("ShaderNodeValToRGB")
            rampa.color_ramp.interpolation = "CONSTANT"
            base = bsdf.inputs["Base Color"].default_value
            el = rampa.color_ramp.elements
            el[0].position, el[0].color = 0.0, (base[0] * 0.55, base[1] * 0.55, base[2] * 0.55, 1)
            el[1].position, el[1].color = 0.55, (base[0] * 1.15, base[1] * 1.15, base[2] * 1.15, 1)
            medio = el.new(0.2)
            medio.color = (base[0] * 0.85, base[1] * 0.85, base[2] * 0.85, 1)
            emi = nt.nodes.new("ShaderNodeEmission")
            nt.links.new(dif.outputs[0], rgb.inputs[0])
            nt.links.new(rgb.outputs["Color"], rampa.inputs["Fac"])
            nt.links.new(rampa.outputs["Color"], emi.inputs["Color"])
            nt.links.new(emi.outputs[0], salida_m.inputs["Surface"])

    # Cara animada (secuencia PNG de CaraTextura)
    cara = escena.get("cara")
    if cara and bpy.data.materials.get("cara"):
        nodo = bpy.data.materials["cara"].node_tree.nodes.get("textura_cara")
        pngs = sorted(Path(cara).resolve().glob("*.png"))
        if pngs:
            img = bpy.data.images.load(str(pngs[0]))
            img.source = "SEQUENCE" if len(pngs) > 1 else "FILE"
            nodo.image = img
            nodo.image_user.frame_duration = len(pngs)
            nodo.image_user.frame_start = 1
            # Blender numera por el número del archivo: si la secuencia empieza en 000, se corre uno
            import re
            primero = int(re.findall(r"(\d+)", pngs[0].stem)[-1])
            nodo.image_user.frame_offset = primero - 1
            nodo.image_user.use_auto_refresh = True

    # Tarjetas: accesorios del kit (PNG con transparencia) como planos pegados a un hueso, en la escena 3D
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    for t in tarjetas(escena.get("tarjetas", []), arm, n):
        pass

    # Cámara ortográfica en px
    cam_d = bpy.data.cameras.new("camara")
    cam_d.type = "ORTHO"
    cam = bpy.data.objects.new("camara", cam_d)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.rotation_euler = Euler((math.radians(90), 0, 0))  # mira hacia +Y

    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    arm.animation_data_clear()
    rot_y = escena.get("rotY", 0)
    extra = escena.get("huesosExtra", {})
    de_extra = lambda hid, canal, k: (extra.get(hid, {}).get(canal) or [0] * n)[min(k, n - 1)]
    for k, c in enumerate(cuadros):
        f = k + 1
        lugar = c["lugar"]
        e = lugar["escala"]  # px por pt
        # metros por px = PT / e ; la cámara se ubica para que los pies (origen) caigan en (x, y) px
        mpx = PT / e
        cam_d.ortho_scale = max(W, H) * mpx
        cam.location = Vector(((W / 2 - lugar["x"]) * mpx, -50, (lugar["y"] - H / 2) * mpx))
        cam.keyframe_insert("location", frame=f)
        cam_d.keyframe_insert("ortho_scale", frame=f)
        ry = rot_y[k] if isinstance(rot_y, list) else rot_y
        arm.rotation_euler = Euler((0, math.radians(lugar.get("rot", 0)), -ry))
        arm.scale = (-1 if c.get("espejo") else 1, 1, 1)
        arm.keyframe_insert("rotation_euler", frame=f)
        arm.keyframe_insert("scale", frame=f)
        for hid, m in c["huesos"].items():
            pb = arm.pose.bones.get(hid)
            if not pb:
                continue
            pb.rotation_mode = "XYZ"
            # rig 2D: rot + = horario en pantalla = giro sobre +Y del mundo = -Z local del hueso (roll 0, apunta a +Z)
            # ejes locales del hueso (apunta a +Z del mundo, roll 0): X = derecha, Y = arriba, Z = hacia la cámara
            pb.rotation_euler = Euler((math.radians(de_extra(hid, "cabeceo", k)), de_extra(hid, "yaw", k), -math.radians(m["rot"])))
            pb.location = Vector((m["x"] * PT, -m["y"] * PT, de_extra(hid, "z", k) * PT))
            pb.scale = Vector((m["sx"], m["sy"], 1))
            pb.keyframe_insert("rotation_euler", frame=f)
            pb.keyframe_insert("location", frame=f)
            pb.keyframe_insert("scale", frame=f)
    # Sin interpolación entre claves (cada cuadro ya trae su pose exacta)
    for obj in (arm, cam):
        ad = obj.animation_data
        if ad and ad.action:
            for fc in getattr(ad.action, "fcurves", []):
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"
    solo = escena.get("solo")
    if solo:
        for k in solo:
            sc.frame_set(k + 1)
            sc.render.filepath = str(salida / f"f{k + 1:04d}")
            bpy.ops.render.render(write_still=True)
        print(f"OK {salida} · {len(solo)} cuadros sueltos")
        return
    sc.render.filepath = str(salida / "f")
    bpy.ops.render.render(animation=True)
    print(f"OK {salida} · {n} cuadros {W}×{H} · {sc.render.engine}")


main()
