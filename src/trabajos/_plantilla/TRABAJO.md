# {{ID}}

| Campo | Valor |
|---|---|
| Cliente / marca | {{cliente}} (`src/marcas/{{marca}}`) |
| Pieza | {{pieza}} |
| Estado | 🟡 En curso |
| Abierto | {{fecha}} |
| Cerrado | — |

## Brief
- **Objetivo:**
- **Formato(s):** 9:16 1080×1920 · 30 fps
- **Duración:**
- **Tono / estilo:**
- **Textos obligatorios:**
- **Llamado a la acción:**
- **Entrega:** `out/{{ID}}/final/`

## Materiales
- **Originales:** `C:/Videos/crudos/{{ID}}/` (fuera del proyecto)
- **Proxies y material de trabajo:** `public/trabajos/{{ID}}/` (crudos/, audio/, img/, datos/)
- **Marca:** `public/marcas/{{marca}}/`

## Guiones
- `guion_<pieza>.md` (generar con `/guion {{ID}}`; aplicar cambios con `/aplicar-guion {{ID}}`)

## Decisiones
- **Plantilla:**
- **Música:** (tema, fuente, id, sha256 del original — primeros 12 caracteres, de `public/biblioteca/LICENCIAS-mixkit.json` —, tramo usado, LUFS)
- **Otras:**

## Entregas
| Archivo (`out/{{ID}}/final/`) | Fecha | Cambios respecto de la versión anterior |
|---|---|---|

## Cómo rehacerlo
1. Restaurar `public/trabajos/{{ID}}/` desde `C:/Videos/archivo/{{ID}}/` (si el trabajo está cerrado).
2. Regenerar audios preparados con los scripts de `src/trabajos/{{ID}}/` (si los hay).
3. `npx remotion render src/index.ts <id-composición> out/{{ID}}/final/<salida>_vN.mp4 --crf=18`
