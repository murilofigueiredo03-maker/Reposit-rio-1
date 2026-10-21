#!/usr/bin/env python3
"""Gera dados de sincronia labial (formas de boca por quadro) a partir de um áudio.

Uso:
    python3 lipsync.py narracao.wav lipsync.js [--fps 30] [--offset 0]

Saída: um arquivo .js com  window.LIPSYNC = {fps, offset, frames:[0..4,...]}
(.js em vez de .json para funcionar via file:// sem fetch).

Formas: 0 fechada · 1 entreaberta · 2 média · 3 aberta · 4 "O" (vogal longa/forte).
Baseado em energia (RMS) + variação — não reconhece fonemas, mas com suavização
e fechamento nas pausas o resultado parece natural para personagens 2D.
"""
import argparse
import array
import json
import math
import subprocess
import sys


def decode(path, rate):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(rate), "-f", "s16le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    samples = array.array("h")
    samples.frombytes(raw)
    return samples


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("out")
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--offset", type=float, default=0, help="segundo da cena em que o áudio começa")
    a = ap.parse_args()

    rate = 16000
    s = decode(a.audio, rate)
    hop = rate / a.fps
    n = int(len(s) / hop)
    rms, flux = [], []
    prev = 0.0
    for i in range(n):
        chunk = s[int(i * hop): int((i + 1) * hop)]
        if not chunk:
            rms.append(0.0); flux.append(0.0); continue
        e = math.sqrt(sum(x * x for x in chunk) / len(chunk))
        rms.append(e)
        flux.append(max(0.0, e - prev))
        prev = e

    if not rms:
        sys.exit("áudio vazio")
    ref = sorted(rms)[int(len(rms) * 0.95)] or 1.0
    silence = ref * 0.12

    # suavização leve (média de 3) para a boca não "tremer"
    sm = [(rms[max(i - 1, 0)] + rms[i] * 2 + rms[min(i + 1, n - 1)]) / 4 for i in range(n)]
    frames = []
    for i, e in enumerate(sm):
        v = e / ref
        if e < silence:
            shape = 0
        elif v < 0.3:
            shape = 1
        elif v < 0.6:
            shape = 2
        elif flux[i] < ref * 0.05 and v > 0.75:
            shape = 4  # vogal sustentada
        else:
            shape = 3
        frames.append(shape)

    # evita formas que duram 1 quadro só (pisca-pisca de boca)
    for i in range(1, n - 1):
        if frames[i - 1] == frames[i + 1] != frames[i]:
            frames[i] = frames[i - 1]

    data = {"fps": a.fps, "offset": a.offset, "duration": n / a.fps, "frames": frames}
    with open(a.out, "w") as f:
        f.write("window.LIPSYNC = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"{n} quadros ({n / a.fps:.2f}s) → {a.out}")


if __name__ == "__main__":
    main()
