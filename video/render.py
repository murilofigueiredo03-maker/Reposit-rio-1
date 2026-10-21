"""Renderiza o curta "O Sonho de Lucas" (animação 2D + trilha sintetizada).

Uso: python3 video/render.py  ->  gera video/o_sonho_de_lucas.mp4
"""
import math
import os
import random
import subprocess
import wave

import cairo
import numpy as np

W, H, FPS = 1280, 720, 24
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "o_sonho_de_lucas.mp4")
AUDIO = os.path.join(HERE, "_trilha.wav")

SKIN = (0.87, 0.67, 0.50)
SKIN_DAD = (0.78, 0.58, 0.42)
HAIR = (0.18, 0.12, 0.08)


# ---------------------------------------------------------------- utilidades
def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def ease(v):
    v = clamp(v)
    return v * v * (3 - 2 * v)


def fade(t, dur, fin=0.6, fout=0.6):
    return clamp(min(t / fin if fin else 1, (dur - t) / fout if fout else 1))


def lerp(a, b, k):
    return a + (b - a) * k


def mix(c1, c2, k):
    return tuple(lerp(a, b, k) for a, b in zip(c1, c2))


def rgb(ctx, c, a=1.0):
    ctx.set_source_rgba(c[0], c[1], c[2], a)


def vgrad(ctx, top, bottom, y0=0, y1=H):
    g = cairo.LinearGradient(0, y0, 0, y1)
    g.add_color_stop_rgb(0, *top)
    g.add_color_stop_rgb(1, *bottom)
    ctx.set_source(g)
    ctx.rectangle(0, y0, W, y1 - y0)
    ctx.fill()


def rrect(ctx, x, y, w, h, r):
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 3 * math.pi / 2)
    ctx.close_path()


def font(ctx, size, bold=True, family="Inter", italic=False):
    ctx.select_font_face(
        family,
        cairo.FONT_SLANT_ITALIC if italic else cairo.FONT_SLANT_NORMAL,
        cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL,
    )
    ctx.set_font_size(size)


def wrap(ctx, text, maxw):
    lines, cur = [], ""
    for word in text.split():
        test = (cur + " " + word).strip()
        if ctx.text_extents(test).x_advance > maxw and cur:
            lines.append(cur)
            cur = word
        else:
            cur = test
    if cur:
        lines.append(cur)
    return lines


def text_center(ctx, text, cx, y, color=(1, 1, 1), a=1.0, maxw=None):
    lines = wrap(ctx, text, maxw) if maxw else [text]
    lh = ctx.font_extents()[2] * 1.05
    for i, ln in enumerate(lines):
        e = ctx.text_extents(ln)
        rgb(ctx, color, a)
        ctx.move_to(cx - e.x_advance / 2, y + i * lh)
        ctx.show_text(ln)
    return len(lines) * lh


def caption(ctx, text, a):
    if a <= 0 or not text:
        return
    font(ctx, 30, bold=False)
    lines = wrap(ctx, text, W - 240)
    lh = 40
    bh = lh * len(lines) + 28
    y0 = H - 40 - bh
    rrect(ctx, 100, y0, W - 200, bh, 14)
    ctx.set_source_rgba(0, 0, 0, 0.55 * a)
    ctx.fill()
    for i, ln in enumerate(lines):
        e = ctx.text_extents(ln)
        ctx.set_source_rgba(1, 1, 1, a)
        ctx.move_to(W / 2 - e.x_advance / 2, y0 + 14 + 30 + i * lh)
        ctx.show_text(ln)


def captions(ctx, t, items):
    """items: lista de (inicio, fim, texto)."""
    for s, e, txt in items:
        if s <= t < e:
            caption(ctx, txt, fade(t - s, e - s, 0.4, 0.4))


def badge(ctx, text, a=1.0):
    font(ctx, 26)
    e = ctx.text_extents(text)
    rrect(ctx, 36, 32, e.x_advance + 40, 50, 25)
    ctx.set_source_rgba(1, 0.80, 0.15, 0.95 * a)
    ctx.fill()
    ctx.set_source_rgba(0.1, 0.1, 0.1, a)
    ctx.move_to(56, 66)
    ctx.show_text(text)


def bubble(ctx, text, x, y, tail_x, tail_y, a=1.0, maxw=300, size=24, color=(1, 1, 1)):
    if a <= 0:
        return
    font(ctx, size)
    lines = wrap(ctx, text, maxw)
    lh = size * 1.3
    tw = max(ctx.text_extents(l).x_advance for l in lines)
    bw, bh = tw + 36, lh * len(lines) + 24
    bx, by = x - bw / 2, y - bh / 2
    ctx.save()
    ctx.move_to(clamp(tail_x, bx + 30, bx + bw - 30) - 14, by + bh - 2)
    ctx.line_to(tail_x, tail_y)
    ctx.line_to(clamp(tail_x, bx + 30, bx + bw - 30) + 14, by + bh - 2)
    ctx.close_path()
    rgb(ctx, color, a)
    ctx.fill()
    rrect(ctx, bx, by, bw, bh, 18)
    rgb(ctx, color, a)
    ctx.fill_preserve()
    ctx.set_source_rgba(0, 0, 0, 0.25 * a)
    ctx.set_line_width(2)
    ctx.stroke()
    for i, ln in enumerate(lines):
        e = ctx.text_extents(ln)
        ctx.set_source_rgba(0.1, 0.1, 0.1, a)
        ctx.move_to(x - e.x_advance / 2, by + 12 + size + i * lh)
        ctx.show_text(ln)
    ctx.restore()


# ---------------------------------------------------------------- personagens
def ball(ctx, x, y, r, rot=0.0, a=1.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.arc(0, 0, r, 0, 2 * math.pi)
    ctx.set_source_rgba(1, 1, 1, a)
    ctx.fill_preserve()
    ctx.set_source_rgba(0.1, 0.1, 0.1, a)
    ctx.set_line_width(max(1.5, r * 0.08))
    ctx.stroke()
    for i in range(5):
        ang = i * 2 * math.pi / 5
        px, py = math.cos(ang) * r * 0.62, math.sin(ang) * r * 0.62
        ctx.arc(px, py, r * 0.2, 0, 2 * math.pi)
        ctx.fill()
    ctx.arc(0, 0, r * 0.24, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()


def person(ctx, x, gy, h, fat=0.0, shirt=(0.9, 0.2, 0.2), shorts=(0.15, 0.2, 0.5),
           skin=SKIN, hair=HAIR, mood="smile", walk=0.0, kick=0.0, arm_l=None,
           arm_r=None, face=1, number=None, mustache=False, tears=0.0, a=1.0,
           laugh=0.0, head_tilt=0.0):
    """Desenha uma pessoa estilizada com os pés em (x, gy) e altura h.

    arm_l / arm_r: ângulo do braço em radianos (0 = para baixo, pi = para cima).
    walk: fase da caminhada/corrida. kick: 0..1 chute com a perna da frente.
    """
    ctx.save()
    ctx.push_group()
    leg_top = gy - h * 0.40
    tor_top = gy - h * 0.73
    tw = h * 0.25 * (1 + fat * 0.75)
    lw = h * 0.085 * (1 + fat * 0.4)
    # pernas
    swing = math.sin(walk) * 0.5
    for i, ang in enumerate((swing, -swing - kick * 1.2)):
        lx = x + (-tw * 0.22 if i == 0 else tw * 0.22)
        ex = lx + math.sin(ang) * h * 0.38 * face
        ey = leg_top + math.cos(ang) * h * 0.38
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_width(lw)
        rgb(ctx, skin)
        ctx.move_to(lx, leg_top)
        ctx.line_to(ex, ey)
        ctx.stroke()
        rgb(ctx, (0.1, 0.1, 0.1))
        ctx.arc(ex + face * lw * 0.3, ey, lw * 0.62, 0, 2 * math.pi)
        ctx.fill()
    # short
    rgb(ctx, shorts)
    rrect(ctx, x - tw / 2 * 0.98, leg_top - h * 0.05, tw * 0.98, h * 0.14, h * 0.03)
    ctx.fill()
    # braços
    sh_y = tor_top + h * 0.05
    for side, ang in ((-1, arm_l), (1, arm_r)):
        if ang is None:
            ang = 0.25 + (math.sin(walk + (0 if side > 0 else math.pi)) * 0.5 if walk else 0)
        sx = x + side * tw * 0.48
        ex = sx + side * math.sin(ang) * h * 0.30
        ey = sh_y + math.cos(ang) * h * 0.30
        ctx.set_line_width(lw * 0.85)
        rgb(ctx, skin)
        ctx.move_to(sx, sh_y)
        ctx.line_to(ex, ey)
        ctx.stroke()
    # tronco
    rgb(ctx, shirt)
    rrect(ctx, x - tw / 2, tor_top, tw, leg_top - tor_top + h * 0.02, tw * 0.35)
    ctx.fill()
    if number:
        font(ctx, h * 0.11)
        e = ctx.text_extents(number)
        ctx.set_source_rgb(1, 1, 1)
        ctx.move_to(x - e.x_advance / 2, tor_top + h * 0.2)
        ctx.show_text(number)
    # cabeça
    hr = h * 0.13
    hx, hy = x + head_tilt * hr * 0.3, tor_top - hr * 0.85 + head_tilt * hr * 0.15
    rgb(ctx, skin)
    ctx.arc(hx, hy, hr * (1 + fat * 0.08), 0, 2 * math.pi)
    ctx.fill()
    rgb(ctx, hair)
    ctx.arc(hx, hy - hr * 0.15, hr * 1.02, math.pi * 1.05, math.pi * 1.95)
    ctx.close_path()
    ctx.fill()
    # rosto
    ex_off = hr * 0.38
    eye_y = hy + hr * 0.02
    fx = hx + face * hr * 0.12
    ctx.set_source_rgb(0.08, 0.08, 0.08)
    for s in (-1, 1):
        if laugh > 0.5:
            ctx.set_line_width(hr * 0.1)
            ctx.arc(fx + s * ex_off, eye_y + hr * 0.05, hr * 0.1, math.pi * 1.1, math.pi * 1.9)
            ctx.stroke()
        else:
            ctx.arc(fx + s * ex_off, eye_y, hr * 0.09, 0, 2 * math.pi)
            ctx.fill()
    if mood == "sad":
        for s in (-1, 1):
            ctx.set_line_width(hr * 0.07)
            ctx.move_to(fx + s * ex_off - hr * 0.15, eye_y - hr * 0.22 - s * hr * 0.06)
            ctx.line_to(fx + s * ex_off + hr * 0.15, eye_y - hr * 0.22 + s * hr * 0.06)
            ctx.stroke()
    ctx.set_line_width(hr * 0.09)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    my = hy + hr * 0.48
    if mood == "smile":
        ctx.arc(fx, my - hr * 0.2, hr * 0.32, math.pi * 0.2, math.pi * 0.8)
        ctx.stroke()
    elif mood == "laugh":
        ctx.arc(fx, my - hr * 0.12, hr * 0.3, 0, math.pi)
        ctx.close_path()
        ctx.fill()
    elif mood == "sad":
        ctx.arc(fx, my + hr * 0.2, hr * 0.25, math.pi * 1.2, math.pi * 1.8)
        ctx.stroke()
    elif mood == "neutral":
        ctx.move_to(fx - hr * 0.18, my)
        ctx.line_to(fx + hr * 0.18, my)
        ctx.stroke()
    if mustache:
        ctx.set_source_rgb(*HAIR)
        rrect(ctx, fx - hr * 0.3, my - hr * 0.2, hr * 0.6, hr * 0.13, hr * 0.06)
        ctx.fill()
    if tears > 0:
        ctx.set_source_rgba(0.45, 0.7, 1.0, tears)
        for s in (-1, 1):
            ty = eye_y + hr * 0.2 + (tears * 3 % 1) * hr * 0.4
            ctx.arc(fx + s * ex_off, ty, hr * 0.07, 0, 2 * math.pi)
            ctx.fill()
    if fat > 0.6:  # bochechas
        ctx.set_source_rgba(0.95, 0.45, 0.45, 0.35)
        for s in (-1, 1):
            ctx.arc(fx + s * hr * 0.6, hy + hr * 0.3, hr * 0.15, 0, 2 * math.pi)
            ctx.fill()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(a)
    ctx.restore()


# ---------------------------------------------------------------- cenários
def sky_day(ctx, k=0.0):
    vgrad(ctx, mix((0.45, 0.72, 0.98), (0.98, 0.62, 0.35), k), mix((0.80, 0.92, 1.0), (1.0, 0.85, 0.6), k))


def grass(ctx, y, c=(0.32, 0.65, 0.28), c2=(0.22, 0.50, 0.20)):
    vgrad(ctx, c, c2, y, H)


def house(ctx, x, y, s=1.0):
    ctx.set_source_rgb(0.95, 0.88, 0.72)
    ctx.rectangle(x, y - 160 * s, 220 * s, 160 * s)
    ctx.fill()
    ctx.set_source_rgb(0.70, 0.28, 0.22)
    ctx.move_to(x - 20 * s, y - 160 * s)
    ctx.line_to(x + 110 * s, y - 250 * s)
    ctx.line_to(x + 240 * s, y - 160 * s)
    ctx.close_path()
    ctx.fill()
    ctx.set_source_rgb(0.45, 0.30, 0.18)
    ctx.rectangle(x + 30 * s, y - 95 * s, 50 * s, 95 * s)
    ctx.fill()
    ctx.set_source_rgb(0.55, 0.80, 0.95)
    ctx.rectangle(x + 120 * s, y - 120 * s, 70 * s, 55 * s)
    ctx.fill()


def tree(ctx, x, y, s=1.0, dark=0.0):
    ctx.set_source_rgb(*mix((0.45, 0.30, 0.18), (0.1, 0.1, 0.15), dark))
    ctx.rectangle(x - 12 * s, y - 120 * s, 24 * s, 120 * s)
    ctx.fill()
    ctx.set_source_rgb(*mix((0.20, 0.55, 0.22), (0.08, 0.15, 0.18), dark))
    for dx, dy, r in ((0, -170, 70), (-50, -130, 50), (50, -130, 50)):
        ctx.arc(x + dx * s, y + dy * s, r * s, 0, 2 * math.pi)
        ctx.fill()


def goal(ctx, x, y, w, h, c=(1, 1, 1), a=1.0):
    ctx.save()
    ctx.set_source_rgba(c[0], c[1], c[2], 0.35 * a)
    ctx.set_line_width(1.5)
    for i in range(1, 12):
        ctx.move_to(x + w * i / 12, y - h)
        ctx.line_to(x + w * i / 12, y)
    for i in range(1, 6):
        ctx.move_to(x, y - h * i / 6)
        ctx.line_to(x + w, y - h * i / 6)
    ctx.stroke()
    ctx.set_source_rgba(c[0], c[1], c[2], a)
    ctx.set_line_width(7)
    ctx.move_to(x, y)
    ctx.line_to(x, y - h)
    ctx.line_to(x + w, y - h)
    ctx.line_to(x + w, y)
    ctx.stroke()
    ctx.restore()


def star(ctx, x, y, r, a=1.0, glow=True):
    if glow:
        g = cairo.RadialGradient(x, y, 0, x, y, r * 5)
        g.add_color_stop_rgba(0, 1, 0.95, 0.7, 0.6 * a)
        g.add_color_stop_rgba(1, 1, 0.95, 0.7, 0)
        ctx.set_source(g)
        ctx.arc(x, y, r * 5, 0, 2 * math.pi)
        ctx.fill()
    ctx.set_source_rgba(1, 0.97, 0.8, a)
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.42
        px, py = x + math.cos(ang) * rr, y + math.sin(ang) * rr
        (ctx.move_to if i == 0 else ctx.line_to)(px, py)
    ctx.close_path()
    ctx.fill()


def vignette(ctx, strength=0.5):
    g = cairo.RadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, strength)
    ctx.set_source(g)
    ctx.paint()


# ---------------------------------------------------------------- cenas
def s_title(ctx, t, d):
    vgrad(ctx, (0.04, 0.06, 0.16), (0.12, 0.10, 0.25))
    rnd = random.Random(3)
    for _ in range(90):
        sx, sy = rnd.uniform(0, W), rnd.uniform(0, H * 0.8)
        tw = 0.5 + 0.5 * math.sin(t * 3 + sx)
        ctx.set_source_rgba(1, 1, 1, 0.25 + 0.5 * tw)
        ctx.arc(sx, sy, rnd.uniform(0.8, 2.0), 0, 2 * math.pi)
        ctx.fill()
    a = fade(t, d, 1.2, 0.8)
    ball(ctx, W / 2, 230 + math.sin(t * 2) * 8, 44, t * 0.6, a)
    font(ctx, 78)
    text_center(ctx, "O SONHO DE LUCAS", W / 2, 390, (1, 0.85, 0.3), a)
    font(ctx, 28, bold=False)
    text_center(ctx, "uma história sobre nunca desistir", W / 2, 445, (1, 1, 1), a * ease((t - 1.0) / 1.0))


def s_age5(ctx, t, d):
    sky_day(ctx, 0.35)
    ctx.set_source_rgba(1, 0.95, 0.7, 0.9)
    ctx.arc(1080, 140, 55, 0, 2 * math.pi)
    ctx.fill()
    house(ctx, 820, 520)
    tree(ctx, 150, 520, 1.1)
    grass(ctx, 520)
    gy = 600
    person(ctx, 460, gy, 330, shirt=(0.25, 0.45, 0.75), shorts=(0.2, 0.2, 0.25), skin=SKIN_DAD,
           mustache=True, arm_r=0.6 if t < 5 else 1.2)
    bounce = abs(math.sin(t * 3.2)) * 70
    person(ctx, 640, gy, 190, fat=1.0, shirt=(0.95, 0.80, 0.15), shorts=(0.1, 0.45, 0.25),
           mood="smile", face=-1, arm_l=0.4 + bounce / 200, arm_r=0.4 + bounce / 200)
    ball(ctx, 700, gy - 18 - bounce, 18, t * 3)
    badge(ctx, "5 anos", fade(t, d, 0.5, 0.5))
    bubble(ctx, "Pai, quando eu crescer eu vou ser jogador de futebol!", 760, 290, 650, 400,
           fade(t - 2.2, 3.0, 0.3, 0.3), maxw=330)
    bubble(ctx, "Vai sim, filho. Eu vou estar lá torcendo.", 380, 200, 450, 255,
           fade(t - 5.4, 3.0, 0.3, 0.3), maxw=300)
    captions(ctx, t, [(0.3, 2.2, "Aos 5 anos, Lucas descobriu o que queria da vida.")])


def s_bullying(ctx, t, d):
    sky_day(ctx, 0.15)
    for i in range(6):
        ctx.set_source_rgb(0.80, 0.78, 0.74)
        ctx.rectangle(i * 230 - 20, 300 - (i % 3) * 30, 200, 260 + (i % 3) * 30)
        ctx.fill()
    vgrad(ctx, (0.76, 0.55, 0.35), (0.62, 0.43, 0.27), 500, H)  # campinho de terra
    goal(ctx, 60, 560, 200, 130)
    gy = 610
    bad = [(840, (0.85, 0.25, 0.25), 0.0), (980, (0.2, 0.65, 0.4), 1.3), (1120, (0.55, 0.35, 0.8), 2.1)]
    for i, (x, c, ph) in enumerate(bad):
        shake = math.sin(t * 14 + ph) * 3
        person(ctx, x, gy + shake * 0.3, 200, fat=0.0, shirt=c, mood="laugh", face=-1, laugh=1,
               arm_l=1.6 + shake * 0.05, arm_r=0.3 + abs(shake) * 0.05, hair=(0.1 + i * 0.12, 0.07, 0.05))
    sad = t > 2.5
    person(ctx, 480, gy, 205, fat=0.95, shirt=(0.95, 0.80, 0.15), shorts=(0.1, 0.45, 0.25),
           mood="sad" if sad else "neutral", face=1, tears=clamp((t - 9) / 2) * 0.9, head_tilt=0.6 if sad else 0)
    ball(ctx, 560, gy - 18, 18)
    badge(ctx, "6 a 9 anos", fade(t, d, 0.5, 0.5))
    lines = [(1.0, "Olha o gordinho tentando jogar!", 740, 280, 835),
             (3.4, "Você NUNCA vai ser jogador!", 990, 150, 980),
             (5.8, "Vai pro gol, você nem consegue correr!", 1110, 300, 1120)]
    for s, txt, bx, by, tx in lines:
        bubble(ctx, txt, bx, by, tx, 400, fade(t - s, d - s - 0.2, 0.25, 0.3), maxw=250, size=22)
    captions(ctx, t, [(8.4, d, "Todo dia era a mesma coisa. Mas o sonho continuava ali.")])


def s_dad_comfort(ctx, t, d):
    vgrad(ctx, (0.35, 0.25, 0.30), (0.20, 0.15, 0.22))
    ctx.set_source_rgb(0.95, 0.75, 0.45)
    ctx.rectangle(900, 150, 200, 160)
    ctx.fill()
    ctx.set_source_rgb(0.3, 0.2, 0.25)
    ctx.set_line_width(8)
    ctx.move_to(1000, 150); ctx.line_to(1000, 310); ctx.move_to(900, 230); ctx.line_to(1100, 230)
    ctx.stroke()
    g = cairo.RadialGradient(560, 380, 30, 560, 380, 500)
    g.add_color_stop_rgba(0, 1, 0.8, 0.5, 0.35)
    g.add_color_stop_rgba(1, 1, 0.8, 0.5, 0)
    ctx.set_source(g)
    ctx.paint()
    vgrad(ctx, (0.45, 0.32, 0.22), (0.35, 0.24, 0.16), 560, H)
    gy = 640
    person(ctx, 440, gy + 60, 360, shirt=(0.25, 0.45, 0.75), shorts=(0.2, 0.2, 0.25), skin=SKIN_DAD,
           mustache=True, arm_r=1.35, mood="smile")
    lucas_mood = "sad" if t < 4.5 else "smile"
    person(ctx, 620, gy, 205, fat=0.85, shirt=(0.95, 0.80, 0.15), shorts=(0.1, 0.45, 0.25),
           mood=lucas_mood, face=-1, head_tilt=0.5 if t < 4.5 else 0)
    bubble(ctx, "Filho, não escuta eles. Treina todo dia, que um dia você chega lá.", 420, 160, 460, 290,
           fade(t - 0.8, 4.6, 0.3, 0.3), maxw=380)
    captions(ctx, t, [(5.4, d, "O pai era o único que nunca deixou de acreditar.")])


def s_training(ctx, t, d):
    p = t / d
    sky_day(ctx, 0.5 - 0.4 * p)
    ctx.set_source_rgb(0.75, 0.55, 0.45)  # muro
    ctx.rectangle(940, 220, 340, 400)
    ctx.fill()
    ctx.set_source_rgba(0.5, 0.35, 0.3, 0.7)
    ctx.set_line_width(2)
    for r in range(10):
        y = 220 + r * 40
        ctx.move_to(940, y); ctx.line_to(1280, y)
        for c in range(9):
            x = 940 + c * 40 + (20 if r % 2 else 0)
            ctx.move_to(x, y); ctx.line_to(x, y + 40)
    ctx.stroke()
    ctx.set_source_rgb(1, 1, 1)
    ctx.set_line_width(5)
    rrect(ctx, 1020, 330, 180, 130, 4)
    ctx.stroke()
    grass(ctx, 560)
    age = 6 + int(p * 4.99)
    fat = lerp(0.95, 0.45, ease(p))
    h = lerp(205, 250, p)
    cyc = (t * 1.25) % 1.0
    kick = ease(1 - abs(cyc - 0.25) * 6) if cyc < 0.45 else 0
    # bola vai até o muro e volta
    bx = 520 + (380 * ease(cyc / 0.5) if cyc < 0.5 else 380 * (1 - ease((cyc - 0.5) / 0.5)))
    by = 640 - 18 - math.sin(clamp(cyc / 0.5) * math.pi) * (40 + 80 * p) if cyc < 0.5 else 622
    stumble = t < 3.2 and 1.6 < t % 3.2 < 2.2
    person(ctx, 440, 640, h, fat=fat, shirt=(0.95, 0.80, 0.15), shorts=(0.1, 0.45, 0.25),
           mood="neutral" if t < 4 else "smile", kick=kick, walk=0, arm_l=0.6 + kick * 0.6,
           arm_r=0.3 + kick * 0.8, head_tilt=0.8 if stumble else 0)
    ball(ctx, bx, by, 18, t * 8)
    badge(ctx, f"{age} anos", 1)
    # marcadores de treino
    font(ctx, 22)
    rgb(ctx, (1, 1, 1), 0.9)
    reps = int(t * 1.25 * 37) + 12
    ctx.move_to(40, 120); ctx.show_text(f"Chutes no muro: {reps}")
    captions(ctx, t, [(0.3, 4.0, "Ele treinou sozinho, todo dia, no muro de casa."),
                      (4.3, 7.8, "Caiu, levantou... e foi melhorando."),
                      (8.0, d, "Os amigos começaram a perceber.")])


def rain(ctx, t, n=220, a=0.5):
    rnd = random.Random(7)
    ctx.set_source_rgba(0.75, 0.82, 1.0, a)
    ctx.set_line_width(1.4)
    for _ in range(n):
        x0, sp = rnd.uniform(-100, W), rnd.uniform(700, 1100)
        y = (rnd.uniform(0, H) + t * sp) % (H + 40) - 40
        x = x0 + (y / H) * 60
        ctx.move_to(x, y)
        ctx.line_to(x + 6, y + 22)
    ctx.stroke()


def s_loss(ctx, t, d):
    vgrad(ctx, (0.08, 0.10, 0.18), (0.18, 0.20, 0.28))
    tree(ctx, 1050, 560, 1.2, dark=0.8)
    vgrad(ctx, (0.12, 0.18, 0.16), (0.08, 0.10, 0.12), 560, H)
    gy = 630
    # cadeira vazia do pai
    ctx.set_source_rgb(0.30, 0.22, 0.18)
    ctx.rectangle(760, gy - 110, 110, 14); ctx.fill()
    ctx.rectangle(760, gy - 230, 14, 230); ctx.fill()
    ctx.rectangle(856, gy - 110, 14, 110); ctx.fill()
    person(ctx, 520, gy, 250, fat=0.45, shirt=mix((0.95, 0.80, 0.15), (0.3, 0.3, 0.35), 0.5),
           shorts=(0.1, 0.2, 0.2), mood="sad", head_tilt=1.0, arm_l=0.1, arm_r=0.1,
           tears=clamp((t - 2) / 2) * 0.85)
    ball(ctx, 180, gy - 16, 18, 0, 0.7)
    rain(ctx, t)
    vignette(ctx, 0.7)
    badge(ctx, "10 anos", fade(t, d, 0.5, 0.5))
    captions(ctx, t, [(0.6, 4.6, "Aos 10 anos, Lucas perdeu o pai."),
                      (4.8, d, "A bola ficou parada no canto. E o sonho... também.")])


NOTE = ["Filho,",
        "independente de tudo,",
        "eu vou estar sempre",
        "te vendo lá de cima.",
        "Não desista do seu sonho.",
        "Eu acredito em você.",
        "                    — Pai"]


def s_drawer(ctx, t, d):
    if t < 5.0:
        vgrad(ctx, (0.18, 0.14, 0.12), (0.10, 0.08, 0.07))
        g = cairo.RadialGradient(640, 300, 20, 640, 300, 520)
        g.add_color_stop_rgba(0, 1, 0.85, 0.55, 0.25)
        g.add_color_stop_rgba(1, 1, 0.85, 0.55, 0)
        ctx.set_source(g)
        ctx.paint()
        ctx.set_source_rgb(0.42, 0.27, 0.16)  # cômoda
        ctx.rectangle(400, 260, 480, 360); ctx.fill()
        for i, yy in enumerate((290, 410, 530)):
            out = ease((t - 2.0) / 1.6) * 60 if i == 0 else 0
            ctx.set_source_rgb(0.52, 0.34, 0.20)
            ctx.rectangle(420 - out * 0.3, yy + out * 0.4, 440 + out * 0.6, 100 + out * 0.2); ctx.fill()
            ctx.set_source_rgb(0.85, 0.70, 0.35)
            ctx.arc(640, yy + 50 + out * 0.5, 9, 0, 2 * math.pi); ctx.fill()
            if i == 0 and out > 20:
                ctx.set_source_rgb(0.98, 0.95, 0.85)
                ctx.rectangle(560, yy + out * 0.4 - 6, 120, 18); ctx.fill()
        # porta-retrato
        ctx.set_source_rgb(0.85, 0.70, 0.35)
        ctx.rectangle(450, 170, 110, 90); ctx.fill()
        ctx.set_source_rgb(0.55, 0.75, 0.9)
        ctx.rectangle(460, 180, 90, 70); ctx.fill()
        person(ctx, 490, 250, 60, skin=SKIN_DAD, shirt=(0.25, 0.45, 0.75), mustache=True)
        person(ctx, 522, 250, 38, fat=1.0, shirt=(0.95, 0.80, 0.15))
        person(ctx, 1000, 700, 260, fat=0.45, shirt=mix((0.95, 0.80, 0.15), (0.3, 0.3, 0.35), 0.5),
               mood="neutral", face=-1, arm_l=1.4, a=0.95)
        captions(ctx, t, [(0.3, 4.8, "Dias depois, arrumando as coisas do pai, ele abriu uma gaveta...")])
    else:
        tt = t - 5.0
        vgrad(ctx, (0.20, 0.15, 0.10), (0.12, 0.09, 0.06))
        a = ease(tt / 0.8)
        ctx.save()
        ctx.translate(640, 360)
        ctx.rotate(-0.03)
        ctx.set_source_rgba(0, 0, 0, 0.35 * a)
        ctx.rectangle(-300 + 10, -270 + 12, 600, 540); ctx.fill()
        ctx.set_source_rgba(0.98, 0.95, 0.86, a)
        ctx.rectangle(-300, -270, 600, 540); ctx.fill()
        ctx.set_source_rgba(0.6, 0.7, 0.9, 0.5 * a)
        ctx.set_line_width(1.2)
        for i in range(10):
            ctx.move_to(-270, -195 + i * 52); ctx.line_to(270, -195 + i * 52)
        ctx.stroke()
        font(ctx, 36, bold=False, family="DejaVu Serif", italic=True)
        shown = (tt - 0.8) * 22  # caracteres por segundo
        y = -205
        for ln in NOTE:
            n = int(clamp(shown, 0, len(ln)))
            shown -= len(ln) + 4
            ctx.set_source_rgba(0.12, 0.15, 0.40, a)
            ctx.move_to(-255, y)
            ctx.show_text(ln[:n])
            y += 64
        ctx.restore()
        vignette(ctx, 0.6)


def s_restart(ctx, t, d):
    k = ease(t / d)
    vgrad(ctx, mix((0.10, 0.12, 0.30), (0.40, 0.55, 0.85), k), mix((0.55, 0.35, 0.45), (1.0, 0.75, 0.50), k))
    star(ctx, 980, 140, 16 + 3 * math.sin(t * 3), 1 - 0.4 * k)
    ctx.set_source_rgba(1, 0.85, 0.4, 0.9)
    ctx.arc(640, 560 + 120 * (1 - k), 90, math.pi, 2 * math.pi); ctx.fill()
    grass(ctx, 560, (0.25, 0.50, 0.25), (0.15, 0.35, 0.18))
    run = t > 3.5
    x = 380 + (t - 3.5) * 140 if run else 380
    person(ctx, x, 650, 280, fat=0.35, shirt=(0.95, 0.80, 0.15), shorts=(0.1, 0.45, 0.25),
           mood="smile" if t > 2 else "neutral", walk=t * 10 if run else 0,
           arm_r=2.8 if 1.4 < t < 3.4 else None)
    ball(ctx, x + 45 if run else 450, 632, 18, t * 9 if run else 0)
    badge(ctx, "11 anos", fade(t, d, 0.5, 0.5))
    captions(ctx, t, [(0.4, 3.6, "Naquele dia, ele entendeu: o sonho não era só dele."),
                      (3.8, d, "Agora ele jogava pelos dois.")])


def s_years(ctx, t, d):
    vgrad(ctx, (0.05, 0.05, 0.08), (0.05, 0.05, 0.08))
    items = [("12 anos", "Peneira na escolinha do bairro"), ("14 anos", "Aprovado na base de um clube"),
             ("17 anos", "Capitão do time sub-17"), ("19 anos", "A estreia como profissional")]
    for i, (age, txt) in enumerate(items):
        s = i * 1.5
        a = fade(t - s, d - s, 0.4, 0.4)
        y = 210 + i * 95
        font(ctx, 40)
        rgb(ctx, (1, 0.8, 0.15), a)
        ctx.move_to(300, y); ctx.show_text(age)
        font(ctx, 32, bold=False)
        rgb(ctx, (1, 1, 1), a)
        ctx.move_to(520, y); ctx.show_text(txt)


def crowd(ctx, t, excite=0.0):
    rnd = random.Random(11)
    for row in range(7):
        y = 150 + row * 34
        for i in range(70):
            x = i * 19 + (row % 2) * 9
            c = rnd.choice([(0.9, 0.2, 0.2), (1, 1, 1), (0.95, 0.8, 0.15), (0.2, 0.3, 0.7), (0.3, 0.3, 0.3)])
            jump = abs(math.sin(t * 9 + i * 0.7 + row)) * 8 * excite
            ctx.set_source_rgba(c[0] * 0.7, c[1] * 0.7, c[2] * 0.7, 1)
            ctx.arc(x, y - jump, 7, 0, 2 * math.pi)
            ctx.fill()


def s_stadium(ctx, t, d):
    goal_t = 5.0
    excite = 0.3 if t < goal_t else 1.0
    vgrad(ctx, (0.02, 0.03, 0.10), (0.08, 0.10, 0.20), 0, 140)
    ctx.set_source_rgb(0.12, 0.12, 0.16)
    ctx.rectangle(0, 120, W, 280); ctx.fill()
    crowd(ctx, t, excite)
    for lx in (120, 1160):
        g = cairo.RadialGradient(lx, 60, 5, lx, 60, 260)
        g.add_color_stop_rgba(0, 1, 1, 0.95, 0.9)
        g.add_color_stop_rgba(1, 1, 1, 0.95, 0)
        ctx.set_source(g)
        ctx.arc(lx, 60, 260, 0, 2 * math.pi); ctx.fill()
    for i in range(8):
        ctx.set_source_rgb(0.18, 0.55, 0.22) if i % 2 else ctx.set_source_rgb(0.20, 0.60, 0.24)
        ctx.rectangle(i * 160, 400, 160, H - 400); ctx.fill()
    ctx.set_source_rgba(1, 1, 1, 0.8)
    ctx.set_line_width(4)
    ctx.move_to(0, 420); ctx.line_to(W, 420); ctx.stroke()
    goal(ctx, 980, 560, 260, 150)
    person(ctx, 1110, 560, 230, shirt=(0.2, 0.2, 0.2), shorts=(0.1, 0.1, 0.1),
           arm_l=2.0 if t > goal_t - 0.5 else 0.8, arm_r=2.2, face=-1, mood="neutral",
           a=1.0, walk=0, kick=0)
    # Lucas
    if t < goal_t:
        px = 260 + t * 90
        kick = ease((t - (goal_t - 0.6)) / 0.5)
        person(ctx, px, 660, 300, fat=0.2, shirt=(0.85, 0.15, 0.15), shorts=(1, 1, 1),
               walk=t * 11 if kick == 0 else 0, kick=kick, number="10", mood="neutral")
        bx = px + 60
        ball(ctx, bx, 642, 18, t * 10)
    else:
        tt = t - goal_t
        px = 260 + goal_t * 90 + min(tt, 1.5) * 60
        pointing = tt > 2.5
        person(ctx, px, 660, 300, fat=0.2, shirt=(0.85, 0.15, 0.15), shorts=(1, 1, 1),
               number="10", mood="smile", arm_l=3.0 if pointing else 2.4,
               arm_r=0.3 if pointing else 2.4, walk=tt * 11 if tt < 1.5 else 0)
        k = ease(tt / 0.5)
        bx = lerp(260 + goal_t * 90 + 60, 1150, k)
        by = lerp(642, 470, k) - math.sin(k * math.pi) * 60
        ball(ctx, bx, by, 18, t * 14)
        if pointing:
            star(ctx, px - 40, 60, 14 + 4 * math.sin(t * 4), ease((tt - 2.5) / 1.5))
        if tt < 2.6:
            a = fade(tt, 2.6, 0.15, 0.5)
            ctx.set_source_rgba(1, 1, 1, 0.35 * a * (1 - tt / 2.6))
            ctx.paint()
            font(ctx, 120)
            sc = 1 + 0.1 * math.sin(tt * 12)
            ctx.save()
            ctx.translate(W / 2, 300)
            ctx.scale(sc, sc)
            text_center(ctx, "GOOOOL!", 0, 0, (1, 0.85, 0.15), a)
            ctx.restore()
    captions(ctx, t, [(0.3, 4.6, "Anos depois. Estádio lotado. Camisa 10."),
                      (8.0, d, "Ele olhou pro céu: \"Pra você, pai.\"")])


def s_end(ctx, t, d):
    vgrad(ctx, (0.02, 0.02, 0.05), (0.06, 0.05, 0.12))
    star(ctx, W / 2, 150, 18, fade(t, d, 1.0, 0.8))
    font(ctx, 40, bold=False)
    text_center(ctx, "Riram dele. Duvidaram dele.", W / 2, 300, (1, 1, 1), fade(t - 0.3, d - 0.3, 0.6, 0.6))
    text_center(ctx, "O pai prometeu que ia ver lá de cima.", W / 2, 370, (1, 1, 1),
                fade(t - 2.0, d - 2.0, 0.6, 0.6))
    font(ctx, 46)
    text_center(ctx, "E viu.", W / 2, 450, (1, 0.85, 0.3), fade(t - 3.8, d - 3.8, 0.6, 0.6))
    font(ctx, 28, bold=False)
    text_center(ctx, "Nunca desista do seu sonho.", W / 2, 560, (0.8, 0.8, 0.9), fade(t - 5.6, d - 5.6, 0.8, 0.8))


SCENES = [(s_title, 5.0), (s_age5, 9.0), (s_bullying, 12.0), (s_dad_comfort, 8.0),
          (s_training, 11.0), (s_loss, 10.0), (s_drawer, 15.0), (s_restart, 9.0),
          (s_years, 7.0), (s_stadium, 13.0), (s_end, 9.0)]


# ---------------------------------------------------------------- trilha
def piano(freq, dur, sr, vel=0.3):
    n = int(dur * sr)
    tt = np.arange(n) / sr
    env = np.exp(-tt * 2.2) * np.minimum(1, tt * 200)
    sig = sum(np.sin(2 * np.pi * freq * k * tt) / k ** 1.6 for k in range(1, 6))
    return sig * env * vel


def nf(name):
    notes = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    return 440 * 2 ** ((notes[name[0]] + 12 * (int(name[-1]) - 4)) / 12)


def build_audio(total):
    sr = 44100
    out = np.zeros(int((total + 3) * sr))

    def add(sig, t0):
        i = int(t0 * sr)
        out[i:i + len(sig)] += sig[: len(out) - i]

    bounds, acc = {}, 0.0
    for fn, d in SCENES:
        bounds[fn.__name__] = (acc, acc + d)
        acc += d
    sad = [["A2", "A3", "C4", "E4"], ["F2", "F3", "A3", "C4"], ["C3", "G3", "C4", "E4"], ["G2", "G3", "B3", "D4"]]
    hope = [["F2", "F3", "A3", "C4"], ["G2", "G3", "B3", "D4"], ["A2", "A3", "C4", "E4"], ["C3", "G3", "C4", "E4"]]
    epic = [["C3", "G3", "C4", "E4", "G4"], ["G2", "G3", "B3", "D4", "G4"],
            ["A2", "A3", "C4", "E4", "A4"], ["F2", "F3", "A3", "C4", "F4"]]
    bar = 2.4
    t, i = 0.0, 0
    loss_start = bounds["s_loss"][0]
    restart_start = bounds["s_restart"][0]
    stadium = bounds["s_stadium"]
    while t < total:
        if t < loss_start:
            prog, vel, step = sad, 0.18, bar / 4
        elif t < restart_start:
            prog, vel, step = sad, 0.13, bar / 2
        elif t < stadium[0]:
            prog, vel, step = hope, 0.2, bar / 6
        else:
            prog, vel, step = epic, 0.24, bar / 8
        ch = prog[i % len(prog)]
        add(piano(nf(ch[0]), bar * 1.4, sr, vel * 1.2), t)
        arp = ch[1:] + ch[-2:0:-1]
        k = 0
        while k * step < bar - 1e-6:
            add(piano(nf(arp[k % len(arp)]), 1.6, sr, vel), t + k * step)
            k += 1
        t += bar
        i += 1
    rng = np.random.default_rng(1)
    # chuva
    s0, s1 = bounds["s_loss"]
    n = int((s1 - s0) * sr)
    noise = np.convolve(rng.normal(0, 1, n), np.ones(8) / 8, "same")
    env = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / sr)
    add(noise * env * 0.05, s0)
    # torcida + explosão no gol
    s0, s1 = stadium
    n = int((s1 - s0) * sr)
    tt = np.arange(n) / sr
    noise = np.convolve(rng.normal(0, 1, n), np.ones(30) / 30, "same")
    lvl = 0.15 + 0.85 * np.clip((tt - 5.0) * 4, 0, 1) * np.exp(-np.clip(tt - 5.0, 0, None) * 0.35)
    env = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / sr)
    add(noise * lvl * env * 0.5, s0)
    out = out[: int(total * sr)]
    fo = int(2.5 * sr)
    out[-fo:] *= np.linspace(1, 0, fo)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.85
    with wave.open(AUDIO, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


# ---------------------------------------------------------------- render
def main():
    total = sum(d for _, d in SCENES)
    build_audio(total)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", AUDIO,
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
         "-c:a", "aac", "-b:a", "160k", "-shortest", OUT],
        stdin=subprocess.PIPE)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    for fn, d in SCENES:
        for f in range(int(d * FPS)):
            t = f / FPS
            ctx = cairo.Context(surf)
            ctx.set_source_rgb(0, 0, 0)
            ctx.paint()
            fn(ctx, t, d)
            # fade preto entre cenas
            edge = min(t, d - t)
            if edge < 0.35:
                ctx.set_source_rgba(0, 0, 0, 1 - edge / 0.35)
                ctx.paint()
            surf.flush()
            proc.stdin.write(bytes(surf.get_data()))
    proc.stdin.close()
    proc.wait()
    os.remove(AUDIO)
    print("ok:", OUT, f"{total:.0f}s")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "frames":
        # gera prévias PNG de cada cena para conferência
        acc = 0
        for fn, d in SCENES:
            for k in (0.3, 0.6, 0.9):
                surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
                ctx = cairo.Context(surf)
                fn(ctx, d * k, d)
                surf.write_to_png(os.path.join(sys.argv[2], f"{fn.__name__}_{int(k*10)}.png"))
    else:
        main()
