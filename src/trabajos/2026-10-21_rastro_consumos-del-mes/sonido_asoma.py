# Sonido de "asomarse" para el personaje de Pau (pedido 2026-10-23: "ponele un efecto de sonido como de asomarse"):
# silbato de émbolo corto que sube (el clásico de dibujo animado cuando alguien se asoma), compuesto por código, sin
# licencias. Un seno que sube de tono con un vibrato chico, ataque rápido y cola corta; pico en -3 dBFS como los demás
# efectos de preparar_sonidos.sh (el volumen final va en composiciones.ts).
# Uso (raíz del proyecto, Python del .venv): python src/trabajos/2026-10-21_rastro_consumos-del-mes/sonido_asoma.py
import numpy as np
import soundfile as sf

SALIDA = "public/trabajos/2026-10-21_rastro_consumos-del-mes/audio/asoma.wav"
SR = 48000
DURA = 0.42  # s
DESDE_HZ = 520
HASTA_HZ = 1250
VIBRATO_HZ = 11
VIBRATO = 0.025  # fracción del tono
PICO_DB = -3


def main() -> None:
    t = np.arange(int(SR * DURA)) / SR
    avance = (t / DURA) ** 0.7  # sube rápido al principio y se asienta
    tono = DESDE_HZ * (HASTA_HZ / DESDE_HZ) ** avance
    tono = tono * (1 + VIBRATO * np.sin(2 * np.pi * VIBRATO_HZ * t))
    fase = 2 * np.pi * np.cumsum(tono) / SR
    onda = np.sin(fase) + 0.18 * np.sin(2 * fase)  # un armónico: suena a silbato, no a tono de prueba
    envolvente = np.minimum(1, t / 0.02) * np.minimum(1, (DURA - t) / 0.12)
    s = onda * envolvente
    s = s / np.abs(s).max() * 10 ** (PICO_DB / 20)
    sf.write(SALIDA, np.stack([s, s], axis=1).astype(np.float32), SR, subtype="PCM_16")
    print("listo:", SALIDA)


main()
