# 2026-10-19_volto_radio

| Campo | Valor |
|---|---|
| Cliente / marca | VOLTO (`src/marcas/volto`) |
| Pieza | Radio: serie de reels con el material de la radio |
| Estado | 🟡 En curso: transcripción y propuesta de narrativas |
| Abierto | 2026-10-19 |
| Cerrado | — |

## Brief
- **Pedido:** "nuevas previews para Volto, como con los videos de la fashion week": analizar y transcribir todo el material de la radio y proponer **todas las narrativas posibles para reels de ~1 minuto, sin repetir contenido** entre ellas. Después, previews de cortes como en `2026-10-06_volto_fashion-week`.
- **Objetivo:** reels para las redes de Volto (agentes de IA para marcas de ropa). ⚠️ completar si el cliente da un objetivo propio para esta serie.
- **Formato(s):** 9:16 1080×1920 · 30 fps (decidido el 2026-10-19). El material ya es **vertical**: los MOV son 1920×1080 con la rotación del iPhone y los proxies quedan en 1080×1920, sin recorte.
- **Modo de animación:** — (sin personajes)
- **Duración:** ~1 min cada pieza (en la fashion week, el máximo era 60 s salvo para no cortar el final).
- **Tono / estilo:** el de Volto, de entrada: `src/plantillas/HablaSubtitulada/CRITERIOS_REEL.md` (piezas 6, 1 y 5, con "Gráficos de vidrio") y la memoria del cliente Volto. Subtítulos New Black a mano, 74 px, en seco y en pirámide; paleta de la marca; música solo bajo la placa final.
- **Textos obligatorios:** ⚠️ a confirmar (nombre de la radio o del programa, si el cliente lo quiere en pantalla).
- **Llamado a la acción:** ⚠️ a confirmar (en la fashion week: "Escribinos acá abajo" / @volto.ai).
- **Entrega:** `out/2026-10-19_volto_radio/final/`

## Materiales
- **Originales del cliente:** `C:/Users/LUCIA/Documents/RASTRO/Clientes/Volto.ia/Radio/Videos/` (21 MOV, 4,7 GB). Copia en `C:/Videos/crudos/2026-10-19_volto_radio/`.
- **Proxies y material de trabajo:** `public/trabajos/2026-10-19_volto_radio/` (crudos/, audio/, img/, datos/). Proxies con `preparar_crudos.sh`: 1080p, 30 fps, libx264 crf 20, **rango completo → estándar** (la mayoría viene en `pc`).
- **Marca:** `public/marcas/volto/` (logo, estrella, `fuentes/` New Black y Nostalgic Memories).
- **Cámaras** (por los metadatos):
  - **iPhone 17 Pro Max:** IMG_7162–7177 e IMG_7180-002, todos verticales. IMG_7180-002 es la toma larga (32:44, desde las 21:21 del 2026-10-06). Las cortas son de las 21:01 y de 21:54 a 22:41. IMG_7171 es del **2026-10-07** (15:34): otro día.
  - **iPhone 16 Pro:** IMG_7327 (4K, 22:57), IMG_7328–7330 (1080p a 60 fps, 21:26–21:53). Dos pistas de audio: AAC estéreo + APAC espacial (se usa la AAC). **IMG_7328–7330 se solapan con IMG_7180-002** → posible segunda cámara: sincronizar con GCC-PHAT como en la fashion week.

## Guiones
- `NARRATIVAS.md` (2026-10-19): 20 narrativas de ~1 min sin tramos repetidos, para que el cliente elija cuáles van a preview.
- `guion_<pieza>.md` (generar con `/guion 2026-10-19_volto_radio`; aplicar cambios con `/aplicar-guion 2026-10-19_volto_radio`)

## Decisiones
- **Material:** entrevista a Nacho en la radio **Activa 93.1** (Santa Fe, 2026-10-06). En el estudio están el conductor (izquierda), Nacho y otro invitado al fondo (remera gris).
- **Plantilla:** `HablaSubtitulada` / `EntrevistaRadio` (las mismas de la fashion week; se reutilizan sus composiciones como modelo).
- **Previews (2026-10-19, pedido: "haceme la preview de los 20, después elijo yo"):** composiciones `volto-radio-preview-<pieza>` (`composiciones.ts`), solo cortes y planos.
  - Cortes en `datos/tomas.json`: se escriben aproximados en `datos/tomas_aprox.json` y `ajustar_cortes.py` los lleva al valle de la voz (±0,3 s). Las palabras con sus tiempos se listan con `palabras.mjs`.
  - Planos de IMG_7180-002 (general fijo): general 1×, cerrado de Nacho 1,6× (`87% 66%`), cerrado del conductor 1,6× (`0% 58%`), verificados en `revision/encuadres.png`.
  - Tomas con cámara en mano: original ↔ cerrado 1,3× que sigue la cara (`seguir_cara.py`: la cara más grande, 10 cuadros/s).
  - 2ª cámara: `sincronizar.py` (GCC-PHAT). IMG_7328 343,170 s, IMG_7329 354,023 s, IMG_7330 1629,740 s (z 18–43). IMG_7327 sin acuerdo (z 5): no se usa.
  - Voz: cada clip a -19 LUFS (de -13,5 a -15,4 medidos) y `cruceAudio: 1`; `render_previews.sh` hace el loudnorm a -14.
- **Música:** solo bajo la placa final (criterio de Volto).
- **Otras:**
- **Glitch de las previews v1 (2026-10-22):** en los cortes donde el primer plano de la toma se marcó unos ms después del inicio de la toma (p. ej. toma 1651,15 con la 2ª cámara desde 1651,20), esos cuadros salían vacíos (fondo verde oscuro): 2 cuadros a los 5,5 s, 1 a los 36,0 s y 8 a los 51,3 s de `preview-trabajo_v1`. Se corrigió en la plantilla (`tramosDePlanos`: el primer plano cubre siempre desde el inicio de la toma, con test). ⚠️ Las otras previews v1 de la serie pueden tener el mismo error: se arregla volviendo a renderizarlas.
- **Pieza "trabajo", edición completa (2026-10-22, pedido: "editalo teniendo en cuenta todas las correcciones… de Volto"):** composición `volto-radio-trabajo` (`guion_trabajo.md`), con los cortes de la preview v1 y todo lo de CRITERIOS_REEL.md:
  - **Voz del conductor:** en el iPhone queda ~26 dB por debajo de Nacho (en la preview casi no se oía) y DeepFilterNet sobre el original lo borra. `preparar_voz_conductor.sh`: +20 dB, pasa-altos y después DeepFilterNet 24 dB; ninguna palabra pierde más de 8 dB. La toma usa la clave `conductor` (audio y transcripción desde el segundo 1638) con la imagen de IMG_7180-002 por desfase.
  - **Transcripción:** `transcripcion_trabajo.py` (Whisper del tramo con `--prompt`, inicios en las pausas de la voz limpia). Texto corregido: "Vuelto" → "Volto"; "súper contentos/productivo" → "supercontentos", "superproductivo" (RAE: prefijo unido); "si es…" → "sí es…"; "ocho", "siete" en letras.
  - ⚠️ **A confirmar con el cliente:** Whisper oye "la gente" en las dos cámaras ("si hace toda la gente", "lo que hace la gente", "que la gente pueda hacer"); por el sentido se subtituló "el agente". También "lo primero que nos **hizo** el vendedor" (¿"dijo"?) quedó como lo oye Whisper.
  - **Gráficos de vidrio** (un pop o una cuenta por gráfico): "IA / con foco / humano" palabra por palabra, "sin laburo", anillos 90 % y 10 % (y el 10 % de eco al final), píldoras "las más aburridas / no calificados / siempre lo mismo" y la jornada de ocho horas (`ProHoras`, nuevo en `InsertosPro.tsx`). "IA con foco humano" va a la izquierda (x 400), no centrado: sobre el cartel blanco de la radio la letra blanca no se leía.
  - **Planos:** los de la preview; único movimiento, un empuje de 1,3× en 200 ms en "no va a reemplazar a los humanos".
  - **Final:** pausa de 0,4 s después de "competir" con ambiente de 1656,70 s, y placa por corte con "Digital Clouds".
  - **2ª tanda (2026-10-22, borrador B), pedidos del usuario, con el valor anterior → el nuevo:**
    - inicio: la pregunta del conductor (0–5 s) → arranca en "Nosotros, el eslogan…" (la voz del conductor y `preparar_voz_conductor.sh` quedan, sin uso);
    - "IA con foco humano": palabra por palabra → la frase entera en bloque ("como un párrafo"), `ProFrase`;
    - "una empresa que tiene vendedores": general quieto → zoom rápido a 1,3× hacia él;
    - subtítulo: "lo primero que nos hizo el vendedor es: Uh, para esto…" → "lo primero que nos dicen / los vendedores es: / “Uh, pará esto / me va a quitar el laburo”." (lo que dice, según el usuario; resuelve la duda de "hizo");
    - "sin laburo": gráfico → sin gráfico (vuelve el subtítulo);
    - 90 %: anillo de vidrio (el de "Vení, seguime") → cifra grande en tipografía con barra repartida (`ProReparto`), a la izquierda del cartel;
    - "las más aburridas / no calificados / siempre lo mismo": píldoras de vidrio → textos que se revelan con un barrido, apilados a la derecha (`ProTextos`);
    - 10 %: anillos en "ese 10 % que es importante" y en el eco del final → sin anillos (los dos eran el mismo gráfico); velocímetro en "con ese 10 % se vuelven más productivos" (`ProVelocimetro`);
    - ocho horas: ocho celdas → reloj de ocho porciones con "antes" / "ahora" (`ProReloj8`);
    - música: solo bajo la placa → "Digital Clouds" de fondo todo el video, -27 dB bajo la voz (~22 dB por debajo, medido), sube en la placa (`preparar_musica.sh`).
    - Criterio del cliente: **no repetir seguido los recursos gráficos** de las piezas anteriores.
  - **3ª tanda (2026-10-23, borrador C):**
    - música de fondo → sin música, tampoco bajo la placa ("no me gusta"; se borraron `preparar_musica.sh` y los wav);
    - "IA con foco humano": bloque centrado de dos renglones → a la izquierda y más grande, "IA" sola (220 px) y "con foco" / "humano" en tinta oscura sobre resaltador naranja (`ProLema`);
    - 90 %: cifra blanca con barra, a la izquierda → tarjeta de vidrio centrada con letra oscura (cifra, barra y "de las consultas", `ProReparto`), hasta el fin de la toma; en "son las más aburridas" una flecha hasta una cara que bosteza con "zzz" (`ProSueno`);
    - enumeración: textos con barrido → chips de otra forma, etiquetas blancas con franja naranja y apenas giradas, centradas y más abajo, arriba de las cabezas (`ProEtiquetas`);
    - 10 %: velocímetro → tarjeta blanca centrada desde el primer "10%" que se ensancha, empuja la cifra y escribe "= más productivos" (`ProIgual`); sigue 1,2 s en el comienzo del general para que la frase se lea;
    - subtítulos 74 → 66 px;
    - placa clara después de 0,4 s de pausa → placa de degradé (la colorida) apenas termina "competir".
  - **4ª tanda (2026-10-23, borrador D):**
    - "IA con foco humano": con pop → sin sonido; x 70 / y 150 → x 170 / y 270 (más cerca de él);
    - flecha y cara que bosteza → se sacan (y su pop);
    - tarjeta del 90 % hasta el fin de la toma → sale cuando arranca la lista; las etiquetas, iguales, ocupan su lugar (centro y 200–380 en vez de 565–745);
    - 10 %: entra fijo con pop → se carga de 1 a 10 en 18 cuadros, con el sonido de cuenta.
  - **5ª tanda (2026-10-23, borrador E):** tarjeta del 90 % y lista "bajalo mucho más, que no haya tanto aire": centro de la tarjeta y 290 → 520 y primera etiqueta y 200 → 520 (~80 px sobre el pelo en los dos planos).
  - **6ª tanda (2026-10-23, borrador F):** sin música → "Deep Techno Ambience" de Alejandro Magaña (Mixkit 134; pedido: "no tan corpo, pero sí tecnológica", elegida entre Deep Techno Ambience, Opalescent y Autofahren), de fondo todo el video a -30 dB (~26 dB bajo la voz, medido) y a -6 dB en la placa (`preparar_musica.sh`).
  - **7ª tanda (2026-10-23, borrador G):** la cita del vendedor iba entre comillas solo hasta "laburo" → de "Uh, pará esto" hasta "¿qué voy a hacer yo?", con comillas angulares « » (en New Black las inglesas ” y las rectas cierran mal: salían "yo?‟"); música bajo la voz -30 → -25 dB ("casi ni se nota, pero no te zarpes": ~21 dB bajo la voz, medido).
  - **Audio final:** `scripts/terminar_audio.sh` (adelanta los 42,7 ms del AAC de Remotion + loudnorm a -14).

## Entregas
| Archivo (`out/2026-10-19_volto_radio/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|
| `revision/borrador_trabajo_9x16_G.mp4` (borrador) | 2026-10-23 | Comillas de la cita hasta "¿qué voy a hacer yo?" (« »); música un poco más alta (~21 dB bajo la voz). -14,1 LUFS |
| `revision/borrador_trabajo_9x16_F.mp4` (borrador) | 2026-10-23 | Música de fondo tecnológica (Mixkit 134), ~26 dB bajo la voz, sube en la placa. -14,1 LUFS, pico -1,4 dBFS |
| `revision/borrador_trabajo_9x16_E.mp4` (borrador) | 2026-10-23 | Tarjeta del 90 % y lista más abajo, cerca de las cabezas |
| `revision/borrador_trabajo_9x16_D.mp4` (borrador) | 2026-10-23 | 4ª tanda: lema sin sonido y más cerca de él; sin flecha ni cara; la lista reemplaza al 90 % en su lugar; el 10 % se carga de 1 a 10. 61,2 s, -14,1 LUFS, pico -1,3 dBFS |
| `revision/borrador_trabajo_9x16_C.mp4` (borrador) | 2026-10-23 | 3ª tanda (ver Decisiones): sin música, lema a la izquierda con resaltador, 90 % en tarjeta + flecha a la cara que bosteza, etiquetas blancas, "10% = más productivos", subtítulos 66 px, placa de degradé sin pausa. 61,2 s, -14,0 LUFS, pico -1,4 dBFS |
| `revision/borrador_trabajo_9x16_B.mp4` (borrador) | 2026-10-22 | 2ª tanda (ver Decisiones): arranca en "Nosotros", gráficos nuevos (frase en bloque, 90 % con barra, textos, velocímetro, reloj de ocho horas), zoom en "una empresa", subtítulo "nos dicen los vendedores", música de fondo. 61,6 s, -14,1 LUFS, pico -1,2 dBFS |
| `revision/borrador_trabajo_9x16_A.mp4` (borrador, no entrega) | 2026-10-22 | Edición completa de `preview-trabajo_v1`: subtítulos, gráficos de vidrio, voz limpia (conductor subido), empuje, placa con música; sin los cuadros vacíos de la v1. -14,1 LUFS, pico -1,4 dBFS |

## Cómo rehacerlo
1. Restaurar `public/trabajos/2026-10-19_volto_radio/` desde `C:/Videos/archivo/2026-10-19_volto_radio/` (si el trabajo está cerrado).
2. Proxies: `bash src/trabajos/2026-10-19_volto_radio/preparar_crudos.sh`
3. `npx remotion render src/index.ts <id-composición> out/2026-10-19_volto_radio/final/<salida>_vN.mp4 --crf=18`
