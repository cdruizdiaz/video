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
    # opcionales (escenas con luz que cambia y cámara que "orbita"):
    "luz": { …, "color": "#ffd9a0", "intensidad": 3.0 | [por cuadro], "ambiente": 0.9 | [por cuadro] },
    "recorte": { "angulo": 45, "altura": 35, "intensidad": 4 | [por cuadro], "color": "#fff" },  # contraluz desde atrás
    "luzSigueGiro": true,                # las luces giran con rotY: se ve como si la CÁMARA orbitara al personaje
    "huesosExtra": { "<hueso>": { "z": [pt hacia la cámara por cuadro], "rx": [grados por cuadro, + = cabecea
                     hacia adelante] } },   # lo que el rig 2D no tiene: profundidad y cabeceo
    "solo": [cuadros] }                  # renderiza solo esos cuadros (0…n-1) como f0001.png… para revisar
Cámara ortográfica en px: un punto del .ai mide `lugar.escala` px y los pies van en (lugar.x, lugar.y) de cada
cuadro (los trayectos del rig incluidos), igual que en PersonajeRig.
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector

PT = 0.01


def hex_lin(h):
    h = h.lstrip("#")
    return tuple(((c / 255) / 12.92 if c / 255 <= 0.04045 else ((c / 255 + 0.055) / 1.055) ** 2.4) for c in (int(h[i:i + 2], 16) for i in (0, 2, 4)))


def por_cuadro(v, k, defecto=0.0):
    """Valor fijo o lista con un valor por cuadro."""
    if v is None:
        return defecto
    return v[min(k, len(v) - 1)] if isinstance(v, list) else v


def sol(sc, nombre, conf, atras=False):
    """Sol desde un ángulo de pantalla (0 = derecha, 90 = arriba); `altura` = cuánto viene de frente (o de atrás)."""
    d = bpy.data.lights.new(nombre, "SUN")
    d.angle = math.radians(conf.get("suavidad", 8))
    # Sombras finas y suaves (sin "dientes" en las superficies que la luz toca de costado, como la corona)
    for attr, v in (("shadow_maximum_resolution", conf.get("resolucionSombra", 0.0003)), ("use_shadow_jitter", True), ("shadow_filter_radius", 2.0)):
        if hasattr(d, attr):
            setattr(d, attr, v)
    if conf.get("color"):
        d.color = hex_lin(conf["color"])
    o = bpy.data.objects.new(nombre, d)
    sc.collection.objects.link(o)
    ang = math.radians(conf.get("angulo", 135))
    alt = math.radians(conf.get("altura", 50))
    # dirección HACIA la luz en mundo: x = cos(ang), z = sin(ang) en pantalla, y = hacia la cámara (-Y) o atrás (+Y)
    hacia = Vector((math.cos(ang) * math.cos(alt), (1 if atras else -1) * math.sin(alt), math.sin(ang) * math.cos(alt))).normalized()
    return o, hacia


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

    # Luz: sol desde el ángulo de pantalla pedido (+ contraluz opcional) + ambiente del mundo
    luz = escena.get("luz", {})
    luces = [(*sol(sc, "sol", luz), luz.get("intensidad", 3.0))]
    if escena.get("recorte"):
        r = escena["recorte"]
        luces.append((*sol(sc, "recorte", r, atras=True), r.get("intensidad", 3.0)))
    mundo = bpy.data.worlds.new("mundo")
    mundo.use_nodes = True
    fondo = mundo.node_tree.nodes.get("Background")
    fondo.inputs["Color"].default_value = (*hex_lin(luz.get("colorAmbiente", "#fff4e0")), 1)
    fondo.inputs["Strength"].default_value = por_cuadro(luz.get("ambiente"), 0, 0.9)
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
        # luces: intensidad por cuadro y, si la cámara "orbita", giran con el personaje
        giro = Matrix.Rotation(-ry if escena.get("luzSigueGiro") else 0, 3, "Z")
        for o, hacia, inten in luces:
            o.rotation_euler = (giro @ hacia).to_track_quat("Z", "Y").to_euler()
            o.keyframe_insert("rotation_euler", frame=f)
            o.data.energy = por_cuadro(inten, k, 3.0)
            o.data.keyframe_insert("energy", frame=f)
        if isinstance(luz.get("ambiente"), list):
            fondo.inputs["Strength"].default_value = por_cuadro(luz["ambiente"], k)
            fondo.inputs["Strength"].keyframe_insert("default_value", frame=f)
        extra = escena.get("huesosExtra", {})
        neutro = {"rot": 0, "x": 0, "y": 0, "sx": 1, "sy": 1}
        for hid in set(c["huesos"]) | set(extra):
            m = c["huesos"].get(hid, neutro)
            pb = arm.pose.bones.get(hid)
            if not pb:
                continue
            ex = extra.get(hid, {})
            pb.rotation_mode = "XYZ"
            # rig 2D: rot + = horario en pantalla = giro sobre +Y del mundo = -Z local del hueso (roll 0, apunta a +Z)
            # extra: rx = cabeceo sobre X (+ = la punta hacia la cámara); z = hacia la cámara (eje Z local = -Y del mundo)
            pb.rotation_euler = Euler((math.radians(por_cuadro(ex.get("rx"), k)), 0, -math.radians(m["rot"])))
            pb.location = Vector((m["x"] * PT, -m["y"] * PT, por_cuadro(ex.get("z"), k) * PT))
            pb.scale = Vector((m["sx"], m["sy"], 1))
            pb.keyframe_insert("rotation_euler", frame=f)
            pb.keyframe_insert("location", frame=f)
            pb.keyframe_insert("scale", frame=f)
    # Sin interpolación entre claves (cada cuadro ya trae su pose exacta)
    for obj in (arm, cam, *(o for o, _, _ in luces), *(o.data for o, _, _ in luces), mundo.node_tree):
        ad = obj.animation_data
        if ad and ad.action:
            for fc in getattr(ad.action, "fcurves", []):
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"
    if escena.get("solo"):
        for k in escena["solo"]:
            sc.frame_set(k + 1)
            sc.render.filepath = str(salida / f"f{k + 1:04d}.png")
            bpy.ops.render.render(write_still=True)
        print(f"OK {salida} · cuadros sueltos {escena['solo']}")
        return
    sc.render.filepath = str(salida / "f")
    bpy.ops.render.render(animation=True)
    print(f"OK {salida} · {n} cuadros {W}×{H} · {sc.render.engine}")


main()
