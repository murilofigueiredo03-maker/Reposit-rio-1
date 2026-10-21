"""Tempo de cada palavra a partir do áudio (sem modelo de ASR): divide a frase por sílabas e
encaixa cada fronteira no vale de energia mais próximo. Uso: alinhar.py pasta saida.json"""
import json, re, sys, wave
import numpy as np

pasta, saida = sys.argv[1], sys.argv[2]
FRASES = [l.strip() for l in open(f'{pasta}/frases.txt', encoding='utf-8') if l.strip()]
GAPS = [0.25, 0.35, 0.45, 0.55, 0.45, 0.6, 0.3, 0.6]          # silêncio antes de cada frase (igual ao concat)


def ler(p):
    with wave.open(p) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    return x, sr


def silabas(w):
    w = w.lower()
    return max(1, len(re.findall(r'[aeiouáéíóúâêôãõà]+', w)))


out, t0 = [], 0.0
for i, frase in enumerate(FRASES):
    t0 += GAPS[i]
    x, sr = ler(f'{pasta}/f{i + 1}.wav')
    hop = int(sr * 0.01)
    env = np.array([np.sqrt(np.mean(x[k:k + hop] ** 2)) for k in range(0, len(x) - hop, hop)])
    env = np.convolve(env, np.ones(3) / 3, 'same')
    lim = env.max() * 0.06
    voz = np.where(env > lim)[0]
    a, b = voz[0] * 0.01, (voz[-1] + 1) * 0.01               # início e fim reais da fala
    palavras = frase.split()
    pesos = np.array([silabas(p) + (0.6 if re.search(r'[.,!?:]$', p) else 0) for p in palavras], float)
    cum = np.concatenate([[0], np.cumsum(pesos)]) / pesos.sum()
    fr = [a + (b - a) * c for c in cum]
    for k in range(1, len(fr) - 1):                            # encaixa no vale de energia (±90 ms)
        c = int(fr[k] / 0.01); j0, j1 = max(0, c - 9), min(len(env) - 1, c + 9)
        fr[k] = (j0 + int(np.argmin(env[j0:j1 + 1]))) * 0.01
    for k, p in enumerate(palavras):
        out.append({'text': p, 'start': round(t0 + fr[k], 3), 'end': round(t0 + max(fr[k + 1], fr[k] + 0.08), 3)})
    t0 += len(x) / sr
json.dump(out, open(saida, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(out), 'palavras; fim', round(t0, 2))
for w in out:
    print(f"{w['start']:6.2f} {w['text']}")
