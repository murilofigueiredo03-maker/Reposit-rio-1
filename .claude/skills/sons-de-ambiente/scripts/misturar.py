#!/usr/bin/env python3
"""Mistura narração + ambientes + efeitos a partir de uma "partitura" JSON (skill "sons-de-ambiente").

Uso:
    python3 misturar.py partitura.json --saida mix.wav [--video video.mp4 --video-saida final.mp4]

partitura.json:
{
  "duracao": 91.7,
  "voz": "fala_master.wav",                 # narração já masterizada (ver SKILL.md)
  "biblioteca": ["../biblioteca/roma", "../biblioteca/ui"],
  "ambientes": [ { "som": "amb_rua", "de": 11.1, "ate": 25.2, "db": -18, "fade": 0.5 }, ... ],
  "efeitos":   [ { "som": "sfx_splash", "em": 20.7, "db": -8 }, ... ],
  "passos":    [ { "som": "sfx_passo_pedra", "de": 30.5, "ate": 31.9, "intervalo": 0.35, "db": -16 }, ... ],
  "ducking":   { "db": 8 },                 # quanto o ambiente baixa quando a voz fala
  "volume_final_lufs": -10
}
- Ambientes tocam em loop e fazem crossfade nas trocas de cena.
- Efeitos e passos NÃO sofrem ducking (precisam ser ouvidos na hora certa), só os ambientes.
"""
import argparse, json, os, subprocess, glob
import numpy as np
from scipy.io import wavfile

SR = 48000


def carregar(caminho):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', caminho, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def achar(nome, pastas):
    for p in pastas:
        for ext in ('.wav', '.mp3', '.ogg'):
            f = os.path.join(p, nome + ext)
            if os.path.exists(f):
                return f
    # variações numeradas (sfx_passo_pedra_1..4)
    for p in pastas:
        achados = sorted(glob.glob(os.path.join(p, nome + '_*.*')))
        if achados:
            return achados
    raise FileNotFoundError(nome)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('partitura')
    ap.add_argument('--saida', default='mix.wav')
    ap.add_argument('--video')
    ap.add_argument('--video-saida')
    ap.add_argument('--so-ambiente', action='store_true', help='exporta só ambiente+efeitos (com ducking), sem a voz — para medir o equilíbrio')
    a = ap.parse_args()
    base = os.path.dirname(os.path.abspath(a.partitura))
    P = json.load(open(a.partitura))
    pastas = [os.path.join(base, p) for p in P['biblioteca']]
    N = int(P['duracao'] * SR)
    amb = np.zeros((N, 2)); fx = np.zeros((N, 2))
    cache = {}

    def som(nome):
        if nome not in cache:
            f = achar(nome, pastas)
            cache[nome] = [carregar(x) for x in f] if isinstance(f, list) else [carregar(f)]
        return cache[nome]

    # ambientes em loop com fade
    for c in P.get('ambientes', []):
        x = som(c['som'])[0]
        i0, i1 = int(c['de'] * SR), min(N, int(c['ate'] * SR))
        if i1 <= i0:
            continue
        reps = int(np.ceil((i1 - i0) / len(x))) + 1
        off = int(c.get('offset', 0) * SR) % len(x)
        y = np.tile(x, (reps, 1))[off:off + (i1 - i0)]
        g = 10 ** (c.get('db', -18) / 20)
        fd = int(c.get('fade', 0.4) * SR)
        e = np.ones(len(y))
        if fd:
            e[:fd] = np.linspace(0, 1, fd) if c['de'] > 0 else 1
            e[-fd:] = np.minimum(e[-fd:], np.linspace(1, 0, fd))
        # automação opcional de volume: [[t, db], ...]
        if 'automacao' in c:
            ts = np.array([p[0] for p in c['automacao']]) * SR - i0
            ds = np.array([p[1] for p in c['automacao']])
            g = 10 ** (np.interp(np.arange(len(y)), ts, ds) / 20)
        amb[i0:i1] += y * (e * g)[:, None]

    def por(nome, t, db, var=0):
        xs = som(nome)
        x = xs[var % len(xs)]
        i0 = int(t * SR)
        if i0 >= N:
            return
        i1 = min(N, i0 + len(x))
        fx[i0:i1] += x[:i1 - i0] * 10 ** (db / 20)

    for c in P.get('efeitos', []):
        por(c['som'], c['em'], c.get('db', -10))
    for k, c in enumerate(P.get('passos', [])):
        t, i = c['de'], 0
        while t < c['ate'] - 1e-3:
            por(c['som'], t, c.get('db', -16) + (1.5 if i % 2 else 0), i)
            t += c['intervalo']; i += 1

    tmp = os.path.join(base, '_amb.wav'), os.path.join(base, '_fx.wav')
    for f, x in zip(tmp, (amb, fx)):
        wavfile.write(f, SR, np.clip(x, -1, 1).astype(np.float32))
    voz = os.path.join(base, P['voz'])
    duck = P.get('ducking', {}).get('db', 8)
    ratio = max(2, duck / 2)
    alvo = P.get('volume_final_lufs', -10)
    duck_f = f"[0:a][v1]sidechaincompress=threshold=0.03:ratio={ratio}:attack=25:release=350:makeup=1[ambd];"
    if a.so_ambiente:   # só ambiente + efeitos (já com ducking), para medir o equilíbrio com a voz
        filtro = f"[1:a]aresample={SR},apad=whole_dur={P['duracao']},asplit=2[v1][v2];[v2]anullsink;" + duck_f + f"[ambd][2:a]amix=inputs=2:normalize=0:duration=first,aresample={SR}[out]"
    else:
        filtro = (f"[1:a]aresample={SR},apad=whole_dur={P['duracao']},asplit=2[v1][v2];" + duck_f +
                  f"[ambd][v2][2:a]amix=inputs=3:normalize=0:duration=first,loudnorm=I={alvo}:TP=-1.5:LRA=9,alimiter=limit=0.8:level=disabled,aresample={SR}[out]")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp[0], '-i', voz, '-i', tmp[1],
                    '-filter_complex', filtro, '-map', '[out]', '-ar', str(SR), a.saida], check=True)
    for f in tmp:
        os.remove(f)
    if not a.so_ambiente:   # 2ª passada: se ficou abaixo do alvo (efeitos com pico alto seguram o loudnorm), sobe com limitador
        med = subprocess.run(['ffmpeg', '-i', a.saida, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
        I = [float(l.split()[1]) for l in med.splitlines() if l.strip().startswith('I:')][-1]
        if alvo - I > 0.5:
            tmp2 = a.saida + '.tmp.wav'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.saida, '-af', f'volume={alvo - I + 0.6:.2f}dB,alimiter=limit=0.8:attack=1:release=80:level=disabled', '-ar', str(SR), tmp2], check=True)
            os.replace(tmp2, a.saida)
            print(f'volume corrigido: {I:.1f} → ~{alvo} LUFS')
    if a.video:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-i', a.saida, '-map', '0:v', '-map', '1:a',
                        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', a.video_saida or a.video.replace('.mp4', '_som.mp4')], check=True)
    print('ok', a.saida)


if __name__ == '__main__':
    main()
