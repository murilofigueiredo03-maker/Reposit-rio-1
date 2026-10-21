#!/usr/bin/env python3
"""Gera a biblioteca de sons de ambiente e efeitos (skill "sons-de-ambiente").

Uso:
    python3 sintetizar.py --saida biblioteca/ [--voz narracao.mp3] [--seed 7]

Tudo é sintetizado (numpy/scipy) — sem download. A multidão ("walla") é feita picando,
mudando o tom e invertendo trechos de uma voz (--voz), até virar burburinho sem palavras.
Sem --voz, a multidão usa ruído com formantes (menos realista).

Saída: WAV 48 kHz estéreo. Loops (amb_*) têm 24 s e emendam sem clique; efeitos (sfx_*) são curtos.
"""
import argparse, os, subprocess, json
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000


def rng_for(seed):
    return np.random.default_rng(seed)


# ---------------------------------------------------------------- utilidades
def ruido(n, cor, r):
    """branco / rosa / marrom"""
    w = r.standard_normal(n)
    if cor == 'branco':
        return w
    if cor == 'marrom':
        x = np.cumsum(w)
        x = signal.lfilter([1], [1, -0.995], w)
        return x / (np.abs(x).max() + 1e-9)
    # rosa (filtro de Paul Kellet)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    x = signal.lfilter(b, a, w)
    return x / (np.abs(x).max() + 1e-9)


def filtro(x, tipo, f, ordem=4):
    if tipo == 'banda':
        sos = signal.butter(ordem, [f[0] / (SR / 2), f[1] / (SR / 2)], btype='band', output='sos')
    else:
        sos = signal.butter(ordem, f / (SR / 2), btype='low' if tipo == 'baixa' else 'high', output='sos')
    return signal.sosfilt(sos, x)


def env(n, ataque, queda):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / max(queda, 1e-4))
    return e


def reverb(x, sala=0.5, mistura=0.3):
    """Schroeder simples: 4 combs em paralelo + 2 allpass."""
    out = np.zeros_like(x)
    for d, g in [(1557, .84), (1617, .83), (1491, .82), (1422, .81)]:
        d = int(d * (0.6 + sala))
        b = np.zeros(d + 1); b[0] = 1
        a = np.zeros(d + 1); a[0] = 1; a[d] = -g * (0.7 + 0.3 * sala)
        out += signal.lfilter(b, a, x)
    for d, g in [(225, .5), (556, .5)]:
        b = np.zeros(d + 1); b[0] = -g; b[d] = 1
        a = np.zeros(d + 1); a[0] = 1; a[d] = -g
        out = signal.lfilter(b, a, out)
    out = out / (np.abs(out).max() + 1e-9) * np.abs(x).max()
    return (1 - mistura) * x + mistura * out


def loop_suave(x, xf=1.0):
    """emenda o fim no começo com crossfade (loop sem clique)"""
    n = int(xf * SR)
    a = x[:-n].copy()
    fade = np.linspace(0, 1, n)
    a[:n] = a[:n] * fade + x[-n:] * (1 - fade)
    return a


def estereo(x, r, largura=0.25):
    """estéreo com leve descorrelação (atraso + ruído de fase)"""
    d = int(0.011 * SR)
    l = x
    rr = np.concatenate([x[d:], x[:d]])
    rr = (1 - largura) * x + largura * rr
    return np.stack([l, rr], axis=1)


def normaliza(x, pico_db=-3):
    m = np.abs(x).max() + 1e-9
    return x / m * 10 ** (pico_db / 20)


def salvar(caminho, x):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    wavfile.write(caminho, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))


# ---------------------------------------------------------------- elementos
def walla(dur, r, voz=None, densidade=14, tom=(0.82, 1.18), abafar=1900, sala=0.6):
    """burburinho de multidão: muitos pedaços de fala, com tom mudado e invertidos"""
    n = int(dur * SR)
    out = np.zeros(n)
    if voz is None:
        # sem voz: ruído com formantes moduladas
        for k in range(densidade):
            base = filtro(ruido(n, 'rosa', r), 'banda', (300 + 90 * k % 600, 1200 + 70 * k % 900))
            am = filtro(np.abs(r.standard_normal(n)), 'baixa', 4)
            out += base * am / (np.abs(am).max() + 1e-9)
    else:
        pos = 0
        while pos < n:
            for _ in range(densidade):
                L = int(r.uniform(0.35, 1.3) * SR)
                ini = r.integers(0, len(voz) - L)
                pedaco = voz[ini:ini + L].copy()
                fator = r.uniform(*tom)
                pedaco = signal.resample(pedaco, int(L / fator))
                if r.random() < 0.45:
                    pedaco = pedaco[::-1]
                pedaco *= np.hanning(len(pedaco)) * r.uniform(0.3, 1.0)
                at = pos + r.integers(0, int(1.2 * SR))
                fim = min(n, at + len(pedaco))
                if at < n:
                    out[at:fim] += pedaco[:fim - at]
            pos += int(1.0 * SR)
    out = filtro(filtro(out, 'baixa', abafar), 'alta', 180)
    out = reverb(out, sala, 0.45)
    return normaliza(out, -6)


def passaros(dur, r, quantos=10):
    n = int(dur * SR); out = np.zeros(n)
    for _ in range(quantos):
        t0 = r.uniform(0, dur - 1)
        f0 = r.uniform(2600, 4800)
        for k in range(r.integers(2, 6)):
            L = int(r.uniform(0.05, 0.14) * SR)
            t = np.arange(L) / SR
            f = f0 * (1 + r.uniform(-0.25, 0.35) * np.sin(np.pi * t / t[-1]))
            ph = 2 * np.pi * np.cumsum(f) / SR
            s = np.sin(ph) * np.sin(np.pi * t / t[-1]) ** 2
            at = int((t0 + k * r.uniform(0.09, 0.2)) * SR)
            if at + L < n:
                out[at:at + L] += s * r.uniform(0.3, 1)
    return normaliza(reverb(out, 0.9, 0.3), -8)


def grilos(dur, r):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for k in range(5):
        f = r.uniform(4200, 5200); ritmo = r.uniform(2.2, 3.4); fase = r.uniform(0, 1)
        trem = (np.sin(2 * np.pi * 30 * t) > 0).astype(float)          # pulsos rápidos
        frase = ((t * ritmo + fase) % 1 < 0.22).astype(float)            # frases
        frase = filtro(frase, 'baixa', 60)
        out += np.sin(2 * np.pi * f * t) * trem * frase * r.uniform(0.4, 1)
    return normaliza(reverb(out, 1.0, 0.4), -10)


def vento(dur, r, intensidade=1.0):
    n = int(dur * SR)
    x = filtro(ruido(n, 'rosa', r), 'banda', (120, 900))
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / SR / r.uniform(5, 9) + r.uniform(0, 6))
    return normaliza(x * lfo * intensidade, -8)


def tom_sala(dur, r):
    n = int(dur * SR)
    return normaliza(filtro(ruido(n, 'marrom', r), 'baixa', 260), -12)


def agua_corrente(dur, r, forte=1.0):
    n = int(dur * SR)
    x = filtro(ruido(n, 'rosa', r), 'banda', (350, 6500))
    gotas = np.zeros(n)
    for _ in range(int(dur * 60 * forte)):
        at = r.integers(0, n - 2000); L = r.integers(300, 1200)
        f = r.uniform(600, 2400)
        t = np.arange(L) / SR
        gotas[at:at + L] += np.sin(2 * np.pi * f * (1 + 3 * t) * t) * np.exp(-t * 60) * r.uniform(0.2, 0.8)
    am = 0.75 + 0.25 * filtro(r.standard_normal(n), 'baixa', 3) * 8
    return normaliza((x * am + 0.6 * gotas), -7)


def fogo(dur, r, forte=1.0):
    n = int(dur * SR)
    ronco = filtro(ruido(n, 'marrom', r), 'baixa', 500)
    ronco *= 0.7 + 0.3 * filtro(r.standard_normal(n), 'baixa', 2) * 6
    estalos = np.zeros(n)
    for _ in range(int(dur * 38 * forte)):
        at = r.integers(0, n - 3000); L = r.integers(80, 900)
        clique = r.standard_normal(L) * np.exp(-np.arange(L) / (L / 5))
        estalos[at:at + L] += filtro(clique, 'alta', 1800, 2) * r.uniform(0.2, 1.0) ** 2
    return normaliza(0.8 * ronco + 0.9 * estalos * forte, -5)


def batida_coracao(dur, r, bpm=110):
    n = int(dur * SR); out = np.zeros(n); per = 60 / bpm
    t = 0.2
    while t < dur - 0.4:
        for dt, a in [(0, 1), (0.16, 0.7)]:
            at = int((t + dt) * SR); L = int(0.18 * SR); tt = np.arange(L) / SR
            if at + L < n:
                out[at:at + L] += np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 22) * a
        t += per
    return normaliza(out, -6)


# ---------------------------------------------------------------- efeitos curtos
def passo(r, piso='pedra'):
    L = int(0.16 * SR)
    x = r.standard_normal(L) * env(L, 0.002, 0.03 if piso == 'pedra' else 0.045)
    if piso == 'pedra':
        x = filtro(x, 'banda', (250, 3500)) + 0.4 * filtro(x, 'banda', (2500, 7000))
    elif piso == 'madeira':
        t = np.arange(L) / SR
        x = filtro(x, 'banda', (120, 1400)) + 0.8 * np.sin(2 * np.pi * 95 * t) * np.exp(-t * 35)
    else:  # terra
        x = filtro(x, 'banda', (150, 1800))
    return normaliza(x, -3)


def moeda(r):
    L = int(0.9 * SR); t = np.arange(L) / SR; x = np.zeros(L)
    for k, dt in enumerate([0, 0.11, 0.19]):
        at = int(dt * SR)
        for f, d in [(2140, 9), (3420, 13), (5710, 18), (7900, 25)]:
            seg = np.sin(2 * np.pi * f * r.uniform(0.98, 1.02) * t[:L - at]) * np.exp(-t[:L - at] * d)
            x[at:] += seg * (0.7 ** k)
    return normaliza(reverb(x, 0.3, 0.2), -4)


def splash(r):
    L = int(1.2 * SR); t = np.arange(L) / SR
    corpo = filtro(r.standard_normal(L), 'baixa', 1400) * np.exp(-t * 5)
    glub = np.sin(2 * np.pi * (180 - 90 * t) * t) * np.exp(-t * 7) * 0.8
    respingos = filtro(r.standard_normal(L), 'alta', 2500) * np.exp(-t * 14) * 0.5
    return normaliza(corpo + glub + respingos, -2)


def baque_madeira(r):
    L = int(0.5 * SR); t = np.arange(L) / SR
    x = np.sin(2 * np.pi * 140 * t) * np.exp(-t * 18) + filtro(r.standard_normal(L), 'banda', (200, 1500)) * np.exp(-t * 30) * 0.6
    return normaliza(x, -3)


def rugido_fogo(r):
    """o fogo 'acendendo' de uma vez: subida de ruído + estalos"""
    L = int(2.5 * SR); t = np.arange(L) / SR
    x = filtro(ruido(L, 'marrom', r), 'baixa', 900) * np.minimum(1, t / 0.25) * np.exp(-np.maximum(0, t - 0.6) * 1.6)
    return normaliza(x + 0.5 * fogo(2.5, r, 1.6) * np.exp(-t * 0.8), -1)


def respiracao_ofegante(r, dur=4.0):
    n = int(dur * SR); out = np.zeros(n); t = 0.0
    while t < dur - 0.5:
        for k, (L, f) in enumerate([(0.22, (500, 2500)), (0.3, (300, 1800))]):
            at = int((t + k * 0.24) * SR); m = int(L * SR)
            if at + m < n:
                out[at:at + m] += filtro(r.standard_normal(m), 'banda', f) * np.hanning(m) * (0.8 if k == 0 else 0.6)
        t += 0.55
    return normaliza(out, -6)


# ---------------------------------------------------------------- ambientes prontos (loops)
def ambientes(r, voz):
    D = 25
    def mix(*partes):
        n = int(D * SR); x = np.zeros(n)
        for p, g in partes:
            x += p[:n] * 10 ** (g / 20)
        return loop_suave(normaliza(x, -4))
    w = lambda **k: walla(D, r, voz, **k)
    return {
        'amb_quarto':     mix((tom_sala(D, r), -2), (w(densidade=6, abafar=700, sala=0.9), -16), (passaros(D, r, 4), -22)),
        'amb_rua':        mix((w(densidade=12, abafar=2200, sala=0.5), -4), (passaros(D, r, 10), -10), (vento(D, r), -16)),
        'amb_mercado':    mix((w(densidade=22, abafar=2600, sala=0.4), -2), (tom_sala(D, r), -14), (passaros(D, r, 3), -18)),
        'amb_praca_fonte':mix((agua_corrente(D, r), -3), (w(densidade=8, abafar=2000, sala=0.6), -10), (passaros(D, r, 10), -12)),
        'amb_latrina':    mix((reverb(agua_corrente(D, r, 0.4), 0.9, 0.5), -4), (w(densidade=6, abafar=1500, sala=0.95), -10)),
        'amb_escada':     mix((tom_sala(D, r), -4), (w(densidade=5, abafar=600, sala=0.95), -14)),
        'amb_noite':      mix((grilos(D, r), -4), (vento(D, r, 0.7), -12), (tom_sala(D, r), -16)),
        'amb_fogo':       mix((fogo(D, r, 1.3), -2), (w(densidade=16, tom=(1.05, 1.4), abafar=2600, sala=0.5), -6)),
        'amb_fuga':       mix((fogo(D, r, 0.8), -10), (batida_coracao(D, r, 118), -4), (tom_sala(D, r), -12)),
        'amb_amanhecer':  mix((passaros(D, r, 26), -1), (vento(D, r, 0.6), -14), (fogo(D, r, 0.2), -24)),
    }


# ---------------------------------------------------------------- Coliseu (arena, subsolo, feras)
def gotas(dur, r, quantas=10):
    """gotas pingando num subsolo de pedra"""
    n = int(dur * SR); out = np.zeros(n)
    for _ in range(int(dur * quantas / 10)):
        at = r.integers(0, n - 6000); L = int(0.08 * SR); t = np.arange(L) / SR
        f0 = r.uniform(900, 1800)
        out[at:at + L] += np.sin(2 * np.pi * (f0 + 900 * t) * t) * np.exp(-t * 60) * r.uniform(0.3, 1)
    return normaliza(reverb(out, 0.95, 0.6), -6)


def ronco_multidao(dur, r, voz, abafado=False, densidade=40):
    """multidão gigante: walla densa + rugido grave (o 'mar' de gente); abafado = ouvido do subsolo, através do chão"""
    w = walla(dur, r, voz, densidade=densidade, tom=(0.75, 1.35), abafar=600 if abafado else 3200, sala=0.7)
    n = int(dur * SR)
    mar = filtro(ruido(n, 'rosa', r), 'banda', (120, 900 if abafado else 2600))
    mar *= 0.75 + 0.25 * filtro(r.standard_normal(n), 'baixa', 0.6) * 8
    return normaliza(w[:n] + 0.8 * mar / (np.abs(mar).max() + 1e-9), -4)


def grito_multidao(r, voz, dur=2.6):
    """a multidão 'explode' (UUUH!, 50 mil, SOLTA!): subida rápida e queda lenta"""
    x = ronco_multidao(dur, r, voz, densidade=70)
    t = np.arange(len(x)) / SR
    return normaliza(x * np.minimum(1, t / 0.25) * np.exp(-np.maximum(0, t - 0.8) * 1.4), -1)


def rugido(r, tipo='leao'):
    """rugido de fera: voz grave pulsante (dente de serra com tremolo) + respiração ruidosa com formantes"""
    dur = 1.9 if tipo == 'leao' else 1.6
    L = int(dur * SR); t = np.arange(L) / SR
    f0 = (95 if tipo == 'leao' else 70) * (1 + 0.25 * np.sin(np.pi * t / dur)) * (1 + 0.04 * np.sin(2 * np.pi * 23 * t))
    fase = 2 * np.pi * np.cumsum(f0) / SR
    serra = (fase / np.pi) % 2 - 1
    corpo = filtro(serra, 'baixa', 900) * (0.6 + 0.4 * np.sin(2 * np.pi * (31 if tipo == 'leao' else 18) * t))
    sopro = filtro(r.standard_normal(L), 'banda', (250, 1800 if tipo == 'leao' else 1100))
    env_ = np.minimum(1, t / 0.12) * np.exp(-np.maximum(0, t - dur * 0.55) * 4)
    x = (corpo + 0.7 * sopro) * env_
    return normaliza(reverb(x, 0.8, 0.35), -1)


def corneta(r):
    """corneta romana (cornu): metal grave com harmônicos, vibrato e um 'tuuu-tu-tuuu'"""
    out = np.zeros(int(2.2 * SR))
    for ini, dur_, f in [(0, 0.55, 233), (0.62, 0.22, 233), (0.9, 1.1, 311)]:
        L = int(dur_ * SR); t = np.arange(L) / SR
        ff = f * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t))
        fase = 2 * np.pi * np.cumsum(ff) / SR
        x = sum(np.sin(k * fase) / k ** 0.8 for k in range(1, 12))
        x = filtro(x, 'baixa', 2600) * np.minimum(1, t / 0.04) * np.minimum(1, (dur_ - t) / 0.06)
        at = int(ini * SR); out[at:at + L] += x
    return normaliza(reverb(out, 0.9, 0.35), -1)


def clang(r):
    """tridente batendo no escudo: parciais inarmônicas de metal + estalo"""
    L = int(1.3 * SR); t = np.arange(L) / SR
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(520, 6, 1), (1240, 8, 0.8), (2210, 10, 0.6), (3390, 14, 0.5), (5150, 20, 0.3)])
    x += filtro(r.standard_normal(L), 'alta', 2000) * np.exp(-t * 60) * 1.2
    x += np.sin(2 * np.pi * 110 * t) * np.exp(-t * 25) * 0.8      # pancada na madeira do escudo
    return normaliza(reverb(x, 0.6, 0.3), -1)


def portao(r):
    """portão de ferro subindo: correntes chacoalhando + rangido + baque no fim"""
    L = int(1.6 * SR); t = np.arange(L) / SR
    corrente = np.zeros(L)
    for _ in range(60):
        at = r.integers(0, L - 4000); M = 3000; tt = np.arange(M) / SR
        corrente[at:at + M] += np.sin(2 * np.pi * r.uniform(1800, 4200) * tt) * np.exp(-tt * 70) * r.uniform(0.2, 0.7)
    rangido = filtro(np.sign(np.sin(2 * np.pi * (60 + 40 * t) * t)) * (r.random(L) < 0.6), 'banda', (300, 1500)) * 0.4
    baque = np.zeros(L); at = int(1.2 * SR); M = L - at; tt = np.arange(M) / SR
    baque[at:] = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 12) * 1.2
    return normaliza(reverb(corrente + rangido + baque, 0.8, 0.4), -1)


def areia_caindo(r, dur=1.2):
    """poeira/areia escorrendo pelas frestas"""
    L = int(dur * SR); t = np.arange(L) / SR
    graos = (r.random(L) < 0.02) * r.standard_normal(L)
    x = filtro(graos, 'alta', 3000) + 0.3 * filtro(r.standard_normal(L), 'banda', (2000, 7000))
    return normaliza(x * np.sin(np.pi * t / dur) ** 0.5, -6)


def respira_capacete(r, dur=4.0):
    """respiração ofegante abafada e com eco dentro do capacete de metal"""
    x = respiracao_ofegante(r, dur)
    x = filtro(x, 'banda', (250, 1400)) * 2.5
    return normaliza(reverb(x, 0.25, 0.55), -3)


# ---------------------------------------------------------------- detalhes de cena (objetos e ações)
def espada_madeira(r):
    """espada de treino de madeira caindo na pedra: batida forte + 2 quiques + arrasto"""
    L = int(1.1 * SR); out = np.zeros(L)
    for at_s, a, f0 in [(0, 1.0, 180), (0.17, 0.55, 210), (0.29, 0.3, 240), (0.36, 0.15, 260)]:
        at = int(at_s * SR); M = int(0.25 * SR); t = np.arange(M) / SR
        x = (np.sin(2 * np.pi * f0 * t) + 0.6 * np.sin(2 * np.pi * f0 * 2.7 * t)) * np.exp(-t * 30)
        x += filtro(r.standard_normal(M), 'banda', (300, 2600)) * np.exp(-t * 55) * 0.9
        out[at:at + M] += x * a
    t = np.arange(L) / SR
    out += filtro(r.standard_normal(L), 'banda', (800, 3000)) * np.exp(-np.abs(t - 0.5) * 18) * 0.08   # arrasto
    return normaliza(reverb(out, 0.6, 0.25), -1)


def ceramica(r):
    """tigela/copo de barro pousado na mesa de madeira"""
    L = int(0.6 * SR); t = np.arange(L) / SR
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(820, 28, 1), (1730, 40, 0.6), (2950, 55, 0.35)])
    x += np.sin(2 * np.pi * 120 * t) * np.exp(-t * 35) * 0.8 + filtro(r.standard_normal(L), 'banda', (400, 3000)) * np.exp(-t * 90) * 0.6
    return normaliza(reverb(x, 0.5, 0.2), -2)


def goles(r, n=3):
    """goles de quem bebe (garganta)"""
    L = int(1.6 * SR); out = np.zeros(L)
    for k in range(n):
        at = int((0.1 + k * 0.42) * SR); M = int(0.2 * SR); t = np.arange(M) / SR
        f = 260 - 140 * t / 0.2
        out[at:at + M] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) + filtro(r.standard_normal(M), 'baixa', 700) * np.exp(-t * 25) * 0.5
    return normaliza(out, -3)


def capacete_metal(r):
    """capacete de bronze: batida metálica grave e pesada"""
    L = int(1.2 * SR); t = np.arange(L) / SR
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(310, 5, 1), (690, 7, 0.7), (1290, 10, 0.5), (2210, 14, 0.3)])
    x += filtro(r.standard_normal(L), 'alta', 1500) * np.exp(-t * 50) * 0.7
    return normaliza(reverb(x, 0.7, 0.3), -1)


def corrente(r):
    """corrente de ferro chacoalhando"""
    L = int(1.2 * SR); out = np.zeros(L)
    for _ in range(26):
        at = r.integers(0, L - 3000); M = 2500; t = np.arange(M) / SR
        out[at:at + M] += sum(np.sin(2 * np.pi * r.uniform(1500, 5200) * t) * np.exp(-t * r.uniform(50, 90)) for _ in range(2)) * r.uniform(0.2, 0.8)
    return normaliza(reverb(out, 0.7, 0.3), -2)


def queda_areia(r):
    """corpo caindo na areia: baque surdo + areia espirrando"""
    L = int(0.9 * SR); t = np.arange(L) / SR
    x = np.sin(2 * np.pi * 65 * t) * np.exp(-t * 14) * 1.2 + filtro(r.standard_normal(L), 'baixa', 400) * np.exp(-t * 20)
    x += filtro(r.standard_normal(L), 'alta', 2500) * np.exp(-t * 9) * 0.35
    return normaliza(x, -1)


def rede_cai(r):
    """rede de corda caindo na areia (chiado de corda + pesos de chumbo)"""
    L = int(0.8 * SR); t = np.arange(L) / SR
    x = filtro(r.standard_normal(L), 'banda', (900, 4000)) * np.exp(-t * 7) * 0.6
    for k in range(5):
        at = int((0.05 + k * 0.05) * SR); M = 1800; tt = np.arange(M) / SR
        x[at:at + M] += np.sin(2 * np.pi * r.uniform(150, 260) * tt) * np.exp(-tt * 40) * 0.6
    return normaliza(x, -2)


def tocha(dur, r):
    """tocha na parede: estalos suaves de fogo pequeno"""
    return fogo(dur, r, 0.45)


def ambientes_coliseu(r, voz):
    D = 25
    def mix(*partes):
        n = int(D * SR); x = np.zeros(n)
        for p, g in partes:
            x += p[:n] * 10 ** (g / 20)
        return loop_suave(normaliza(x, -4))
    return {
        'amb_cela':        mix((tom_sala(D, r), -3), (gotas(D, r, 8), -10), (ronco_multidao(D, r, voz, abafado=True, densidade=20), -12)),
        'amb_subsolo':     mix((ronco_multidao(D, r, voz, abafado=True, densidade=40), -2), (tom_sala(D, r), -8), (gotas(D, r, 4), -16)),
        'amb_tunel':       mix((tom_sala(D, r), -2), (ronco_multidao(D, r, voz, abafado=True, densidade=30), -8), (batida_coracao(D, r, 96), -10)),
        'amb_arena':       mix((ronco_multidao(D, r, voz, densidade=45), -1), (vento(D, r, 0.5), -18)),
        'amb_tocha':       mix((tocha(D, r), -2), (tom_sala(D, r), -10)),
        'amb_fim_tarde':   mix((passaros(D, r, 8), -6), (vento(D, r, 0.6), -10), (ronco_multidao(D, r, voz, abafado=True, densidade=12), -16)),
    }, {
        'sfx_rugido_leao': [rugido(r, 'leao')], 'sfx_rugido_urso': [rugido(r, 'urso')], 'sfx_corneta': [corneta(r)],
        'sfx_clang': [clang(r)], 'sfx_portao': [portao(r)], 'sfx_areia': [areia_caindo(r)], 'sfx_respira_capacete': [respira_capacete(r)],
        'sfx_grito_multidao': [grito_multidao(r, voz)], 'sfx_baque_madeira': [baque_madeira(r)],
        'sfx_passo_pedra': [passo(r, 'pedra') for _ in range(4)], 'sfx_passo_areia': [passo(r, 'terra') for _ in range(4)],
        'sfx_espada_madeira': [espada_madeira(r)], 'sfx_ceramica': [ceramica(r)], 'sfx_goles': [goles(r)], 'sfx_capacete': [capacete_metal(r)],
        'sfx_corrente': [corrente(r)], 'sfx_queda_areia': [queda_areia(r)], 'sfx_rede_cai': [rede_cai(r)],
    }


# ---------------------------------------------------------------- hoje / apocalipse zumbi
def gemido_zumbi(r, dur=1.4):
    """gemido de zumbi: voz grave rouca (dente de serra com vibrato irregular) passando por formantes de "uhh" + chiado"""
    L = int(dur * SR); t = np.arange(L) / SR
    f0 = r.uniform(70, 105) * (1 + 0.08 * np.sin(2 * np.pi * 3.1 * t) + 0.05 * filtro(r.standard_normal(L), 'baixa', 6) * 10)
    fase = 2 * np.pi * np.cumsum(f0) / SR
    serra = (fase / np.pi) % 2 - 1
    voz = filtro(serra, 'banda', (220, 420)) + 0.6 * filtro(serra, 'banda', (650, 950)) + 0.25 * filtro(serra, 'banda', (2200, 2800))
    rouco = filtro(r.standard_normal(L), 'banda', (300, 1500)) * 0.35
    env_ = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
    return normaliza(reverb((voz + rouco) * env_, 0.6, 0.3), -2)


def tiro(r):
    """tiro de revólver: estalo forte + estrondo grave + eco de rua"""
    L = int(1.8 * SR); t = np.arange(L) / SR
    x = r.standard_normal(L) * np.exp(-t * 45) * 1.5 + np.sin(2 * np.pi * 60 * t) * np.exp(-t * 9) * 1.2 + filtro(r.standard_normal(L), 'baixa', 400) * np.exp(-t * 6)
    return normaliza(reverb(x, 0.95, 0.45), -0.5)


def clique_vazio(r):
    L = int(0.25 * SR); t = np.arange(L) / SR
    x = filtro(r.standard_normal(L), 'alta', 2500) * np.exp(-t * 120) + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) * 0.4
    return normaliza(x, -3)


def motor_moto(dur, r, acelera=True):
    """ronco de moto: pulsos de explosão do motor (dente de serra grave) subindo de rotação + escapamento"""
    L = int(dur * SR); t = np.arange(L) / SR
    rpm = 30 + (60 * np.minimum(1, t / 1.2) if acelera else 0) + 4 * np.sin(2 * np.pi * 0.7 * t)
    fase = 2 * np.pi * np.cumsum(rpm) / SR
    x = ((fase / np.pi) % 2 - 1) ** 3
    x = filtro(x, 'baixa', 900) + 0.4 * filtro(r.standard_normal(L), 'banda', (200, 1200)) * (0.5 + 0.5 * np.sin(fase))
    return normaliza(x, -2)


def toc_toc(r):
    """batidas numa porta de madeira (3 toques)"""
    L = int(1.1 * SR); out = np.zeros(L)
    for k, at_s in enumerate([0, 0.22, 0.44]):
        at = int(at_s * SR); M = int(0.2 * SR); tt = np.arange(M) / SR
        out[at:at + M] += (np.sin(2 * np.pi * 160 * tt) + 0.5 * np.sin(2 * np.pi * 410 * tt)) * np.exp(-tt * 35) + filtro(r.standard_normal(M), 'banda', (300, 2000)) * np.exp(-tt * 70) * 0.5
    return normaliza(reverb(out, 0.6, 0.25), -1)


def tique(r, agudo=True):
    L = int(0.12 * SR); t = np.arange(L) / SR
    x = np.sin(2 * np.pi * (2400 if agudo else 1600) * t) * np.exp(-t * 90) + filtro(r.standard_normal(L), 'alta', 3000) * np.exp(-t * 200) * 0.4
    return normaliza(x, -3)


def relogio_contagem(r, seg=5):
    """contagem regressiva de relógio: tic-tac mecânico 2x por segundo, pulso grave que cresce
    a cada segundo e alarme de campainha no fim (o 'acabou o tempo!')"""
    L = int((seg + 1.3) * SR); out = np.zeros(L)
    for k in range(seg * 2):
        at = int(k * 0.5 * SR); M = int(0.06 * SR); tt = np.arange(M) / SR
        clique = filtro(r.standard_normal(M), 'banda', (2500, 7000) if k % 2 == 0 else (1500, 4500)) * np.exp(-tt * 260)
        clique += np.sin(2 * np.pi * (3200 if k % 2 == 0 else 2300) * tt) * np.exp(-tt * 180) * 0.5
        out[at:at + M] += clique * (0.7 + 0.3 * k / (seg * 2))
    for k in range(seg):   # pulso grave (coração do relógio), mais forte a cada segundo
        at = int(k * SR); M = int(0.35 * SR); tt = np.arange(M) / SR
        out[at:at + M] += np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 9) * (0.35 + 0.15 * k)
    at = int(seg * SR); M = int(1.3 * SR); tt = np.arange(M) / SR   # campainha do despertador
    bate = (np.sin(2 * np.pi * 28 * tt) > 0).astype(float)
    sino = sum(np.sin(2 * np.pi * f * tt) * a for f, a in ((1870, 1), (2830, .6), (4100, .35)))
    out[at:at + M] += sino * (0.4 + 0.6 * bate) * np.minimum(1, (1.3 - tt) / 0.3) * 0.9
    return normaliza(reverb(out, 0.4, 0.15), -1)


def porta_range(r):
    """porta de madeira rangendo ao abrir"""
    L = int(1.3 * SR); t = np.arange(L) / SR
    f = 380 + 260 * np.sin(np.pi * t / 1.3) + 40 * filtro(r.standard_normal(L), 'baixa', 8) * 10
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (r.random(L) < 0.7)
    return normaliza(filtro(x, 'banda', (400, 2500)) * np.sin(np.pi * t / 1.3), -3)


def morte(r):
    """o 'você morreu': pancada grave + acorde dissonante descendo"""
    L = int(2.2 * SR); t = np.arange(L) / SR
    x = np.sin(2 * np.pi * 48 * t) * np.exp(-t * 3) * 1.2
    for f in (233, 247, 330):
        x += np.sin(2 * np.pi * f * (1 - 0.08 * t) * t) * np.exp(-t * 1.6) * 0.35
    return normaliza(reverb(x, 0.9, 0.35), -1)


def sirenes(dur, r):
    """sirenes ao longe subindo e descendo"""
    L = int(dur * SR); t = np.arange(L) / SR; out = np.zeros(L)
    for k in range(2):
        f = 700 + 250 * np.sin(2 * np.pi * (0.18 + k * 0.07) * t + k)
        out += np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t + k * 2))
    return normaliza(reverb(filtro(out, 'baixa', 1500), 0.95, 0.7), -6)


def gemidos_ao_longe(dur, r, n=6):
    L = int(dur * SR); out = np.zeros(L)
    for _ in range(n):
        g = gemido_zumbi(r, r.uniform(1.0, 2.0)); at = r.integers(0, L - len(g))
        out[at:at + len(g)] += g * r.uniform(0.3, 0.8)
    return normaliza(reverb(filtro(out, 'baixa', 1600), 0.9, 0.6), -6)


def ambientes_hoje(r, voz=None):
    D = 25
    def mix(*partes):
        n = int(D * SR); x = np.zeros(n)
        for p, g in partes:
            x += p[:n] * 10 ** (g / 20)
        return loop_suave(normaliza(x, -4))
    return {
        'amb_cidade_caos': mix((vento(D, r, 0.9), -6), (sirenes(D, r), -8), (gemidos_ao_longe(D, r, 7), -6), (fogo(D, r, 0.3), -18)),
        'amb_sala':        mix((tom_sala(D, r), -2), (gemidos_ao_longe(D, r, 2), -20)),
        'amb_tensao':      mix((tom_sala(D, r), -6), (batida_coracao(D, r, 92), -4), (vento(D, r, 0.4), -14)),
        'amb_natureza':    mix((passaros(D, r, 14), -3), (vento(D, r, 0.5), -12), (agua_corrente(D, r, 0.3), -16)),
        'amb_estrada':     mix((vento(D, r, 0.8), -3), (passaros(D, r, 4), -14)),
        'amb_noite_fria':  mix((vento(D, r, 1.1), -3), (grilos(D, r), -12), (gemidos_ao_longe(D, r, 2), -18)),
        'amb_banheiro':    mix((reverb(tom_sala(D, r), 0.95, 0.6), -2), (gotas(D, r, 6), -8)),
    }, {
        'sfx_gemido': [gemido_zumbi(r) for _ in range(4)], 'sfx_tiro': [tiro(r)], 'sfx_clique_vazio': [clique_vazio(r)],
        'sfx_moto': [motor_moto(5.0, r)], 'sfx_toc_toc': [toc_toc(r)], 'sfx_tique': [tique(r, True)], 'sfx_taque': [tique(r, False)],
        'sfx_porta_range': [porta_range(r)], 'sfx_morte': [morte(r)], 'sfx_goles': [goles(r)], 'sfx_queda': [queda_areia(r)],
        'sfx_passo_rua': [passo(r, 'pedra') for _ in range(4)], 'sfx_fogo_acende': [rugido_fogo(r)],
        'sfx_relogio_contagem': [relogio_contagem(r)], 'sfx_relogio_3': [relogio_contagem(r, 3)],
    }


# ---------------------------------------------------------------- escola (série "O garoto do tênis laranja")
def risada(r, dur=1.6, agudo=1.0, voz_crianca=True):
    """uma risada 'ha-ha-ha': pulsos de vogal (formantes) a ~5 por segundo, tom caindo"""
    L = int(dur * SR); t = np.arange(L) / SR; out = np.zeros(L)
    f0 = (300 if voz_crianca else 180) * agudo * r.uniform(0.9, 1.15)
    n_ha = int(dur * r.uniform(4.2, 5.6)); dt = dur / (n_ha + 1)
    for k in range(n_ha):
        a = int((k * dt + r.uniform(0, 0.03)) * SR); M = int(dt * 0.7 * SR); tt = np.arange(M) / SR
        f = f0 * (1.15 - 0.3 * k / n_ha) * (1 + 0.05 * np.sin(2 * np.pi * 7 * tt))
        ph = 2 * np.pi * np.cumsum(f) / SR
        voz = sum(np.sin(ph * h) / h for h in range(1, 12))
        voz = filtro(voz, 'banda', (500, 1500)) * 1.4 + filtro(voz, 'banda', (1700, 3200)) * 0.7   # vogal "a"
        sopro = filtro(r.standard_normal(M), 'banda', (900, 3500)) * 0.25 * np.exp(-tt * 30)        # "h" do ha
        env = np.sin(np.pi * np.minimum(1, tt / (M / SR))) ** 0.6
        if a + M < L: out[a:a + M] += (voz + sopro) * env * (1 - 0.4 * k / n_ha)
    return normaliza(out, -3)


def risadas_turma(r, dur=3.0, n=7):
    """turma rindo: várias risadas sobrepostas, defasadas, com sala"""
    L = int(dur * SR); out = np.zeros(L)
    for i in range(n):
        x = risada(r, r.uniform(1.0, 2.2), r.uniform(0.85, 1.25)); a = int(r.uniform(0, 0.6) * SR)
        m = min(L, a + len(x)); out[a:m] += x[:m - a] * r.uniform(0.5, 1.0)
    return normaliza(reverb(out, 0.6, 0.3), -2)


def talheres(dur, r, n=30):
    L = int(dur * SR); out = np.zeros(L)
    for _ in range(n):
        a = int(r.uniform(0, dur - 0.2) * SR); M = int(0.12 * SR); tt = np.arange(M) / SR
        f = r.uniform(2500, 5200)
        out[a:a + M] += (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.7 * tt)) * np.exp(-tt * r.uniform(40, 70)) * r.uniform(0.2, 0.7)
    return normaliza(reverb(out, 0.7, 0.35), -8)


def bandeja_cai(r):
    """bandeja de metal batendo no chão e chacoalhando, prato e talher"""
    L = int(1.6 * SR); t = np.arange(L) / SR; out = np.zeros(L)
    for k, (at, g) in enumerate([(0, 1), (0.12, 0.6), (0.21, 0.45), (0.28, 0.3), (0.33, 0.22), (0.37, 0.15)]):
        a = int(at * SR); M = L - a; tt = np.arange(M) / SR
        x = sum(np.sin(2 * np.pi * f * tt) * w for f, w in ((420, 1), (910, 0.7), (1630, 0.5), (2870, 0.35)))
        out[a:] += (x * np.exp(-tt * 9) + filtro(r.standard_normal(M), 'banda', (800, 6000)) * np.exp(-tt * 40) * 0.8) * g
    out += np.sin(2 * np.pi * 70 * t) * np.exp(-t * 14) * 0.6       # baque grave
    return normaliza(reverb(out, 0.5, 0.25), -1)


def tropeco(r):
    """corpo caindo no piso: arrastar do tênis + baque surdo"""
    L = int(0.9 * SR); t = np.arange(L) / SR
    arrasta = filtro(r.standard_normal(L), 'banda', (1500, 5000)) * np.exp(-t * 18) * 0.4
    baque = (np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 110 * t)) * np.exp(-t * 11) * (t > 0.18)
    x = arrasta + baque + filtro(r.standard_normal(L), 'baixa', 500) * np.exp(-np.maximum(0, t - 0.18) * 20) * (t > 0.18) * 0.8
    return normaliza(x, -1)


def tenis_range(r):
    """rangido do tênis de borracha no piso (cuiii)"""
    L = int(0.32 * SR); t = np.arange(L) / SR
    f = 1800 + 900 * np.sin(np.pi * t / t[-1])
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) ** 2 * (1 + 0.3 * np.sin(2 * np.pi * 60 * t))
    return normaliza(filtro(x, 'banda', (900, 4000)), -4)


def vibra_celular(r, dur=1.4):
    """celular vibrando em cima da cama/mesa: zumbido de 2 pulsos"""
    L = int(dur * SR); t = np.arange(L) / SR
    pulsos = ((t % 0.7) < 0.42).astype(float); pulsos = filtro(pulsos, 'baixa', 40)
    x = (np.sign(np.sin(2 * np.pi * 150 * t)) * 0.6 + np.sin(2 * np.pi * 300 * t) * 0.4) * pulsos
    return normaliza(filtro(x, 'baixa', 1200), -3)


def notificacao(r):
    L = int(0.6 * SR); t = np.arange(L) / SR; out = np.zeros(L)
    for at, f in ((0, 1568), (0.11, 2093)):
        a = int(at * SR); tt = np.arange(L - a) / SR
        out[a:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9)
    return normaliza(reverb(out, 0.3, 0.2), -4)


def splash_suco(r):
    L = int(0.6 * SR); t = np.arange(L) / SR
    x = filtro(r.standard_normal(L), 'banda', (500, 3500)) * np.exp(-t * 12) + filtro(r.standard_normal(L), 'banda', (200, 900)) * np.exp(-t * 25) * 0.6
    return normaliza(x, -3)


def ambientes_escola(r, voz=None):
    D = 25
    def mix(*partes):
        n = int(D * SR); x = np.zeros(n)
        for p, g in partes:
            x += p[:n] * 10 ** (g / 20)
        return loop_suave(normaliza(x, -4))
    criancas = walla(D, r, voz, densidade=16, tom=(1.25, 1.6), abafar=3200, sala=0.5)   # vozes mais agudas = crianças
    criancas_dentro = walla(D, r, voz, densidade=20, tom=(1.2, 1.55), abafar=2600, sala=0.8)
    return {
        'amb_escola_patio': mix((criancas, -8), (passaros(D, r, 10), -10), (vento(D, r, 0.4), -18)),
        'amb_corredor':     mix((criancas_dentro, -10), (tom_sala(D, r), -8)),
        'amb_refeitorio':   mix((criancas_dentro, -4), (talheres(D, r, 70), -8), (tom_sala(D, r), -10)),
        'amb_quarto_noite': mix((tom_sala(D, r), -4), (grilos(D, r), -16)),
    }, {
        'sfx_risadas': [risadas_turma(r, 3.0, 8)], 'sfx_risada_caio': [risada(r, 1.8, 0.9)],
        'sfx_bandeja_cai': [bandeja_cai(r)], 'sfx_tropeco': [tropeco(r)], 'sfx_tenis_range': [tenis_range(r)],
        'sfx_vibra_celular': [vibra_celular(r)], 'sfx_notificacao': [notificacao(r)], 'sfx_splash_suco': [splash_suco(r)],
        'sfx_passo_escola': [passo(r, 'pedra') for _ in range(4)],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--saida', default='biblioteca')
    ap.add_argument('--voz', default=None, help='arquivo de voz para fazer a multidão (walla)')
    ap.add_argument('--seed', type=int, default=7)
    ap.add_argument('--conjunto', default='roma', choices=['roma', 'coliseu', 'hoje', 'escola'], help='roma = cidade; coliseu = arena, subsolo, feras, corneta')
    a = ap.parse_args()
    os.makedirs(a.saida, exist_ok=True)
    r = rng_for(a.seed)
    voz = None
    if a.voz:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.voz, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
        voz = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    feitos = []
    if a.conjunto == 'coliseu':
        amb, efeitos = ambientes_coliseu(r, voz)
    elif a.conjunto == 'hoje':
        amb, efeitos = ambientes_hoje(r, voz)
    elif a.conjunto == 'escola':
        amb, efeitos = ambientes_escola(r, voz)
    else:
        amb = ambientes(r, voz)
        efeitos = {
            'sfx_passo_pedra': [passo(r, 'pedra') for _ in range(4)],
            'sfx_passo_madeira': [passo(r, 'madeira') for _ in range(4)],
            'sfx_moeda': [moeda(r)], 'sfx_splash': [splash(r)], 'sfx_baque_madeira': [baque_madeira(r)],
            'sfx_rugido_fogo': [rugido_fogo(r)], 'sfx_ofegante': [respiracao_ofegante(r)],
        }
    for nome, x in amb.items():
        salvar(os.path.join(a.saida, nome + '.wav'), estereo(x, r)); feitos.append(nome)
    for nome, lista in efeitos.items():
        for i, x in enumerate(lista):
            arq = nome + (f'_{i + 1}' if len(lista) > 1 else '')
            salvar(os.path.join(a.saida, arq + '.wav'), x); feitos.append(arq)
    print(json.dumps({'gerados': feitos}, ensure_ascii=False))


if __name__ == '__main__':
    main()
