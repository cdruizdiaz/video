---
description: Lista los trabajos (abiertos por defecto) con su última entrega y lo que falta
argument-hint: [todos]
---

Mostrame el estado de los trabajos. Argumentos: $ARGUMENTS

1. Corré `node scripts/estado.mjs` (agregá `--todos` si el argumento es "todos"). No abras cada TRABAJO.md: el script ya los resume.
2. Respondé con una tabla corta: ID · estado · última entrega · qué falta (los ⚠️ resumidos en pocas palabras).
3. Si algún trabajo tiene una entrega en disco sin anotar o está cerrado sin archivar, decímelo al final y ofrecé resolverlo (`/cerrar-trabajo <ID>` o anotar la entrega). No cambies nada sin que te lo pida.
