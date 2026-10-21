/*
  boneco.js — stickman com articulações humanas e cinemática inversa (IK) 2D.
  Skill "movimento-humano". Sem dependências; determinístico (mesmo t → mesmo desenho).

  Uso básico:
    const b = new Boneco(svgGroup, { escala: 0.9, roupa: '#C8553D' });
    b.base(0, 3, 'andar', { de: [100, 1700], ate: [700, 1700] });   // pernas/tronco
    b.base(3, 6, 'parado', { x: 700, y: 1700, vista: 'frente' });
    b.braco('d', 3.5, 5, 'acenar');                                  // braço por cima da base
    b.expressao(4, 6, 'feliz');
    // a cada quadro:  b.desenhar(t)   (chame dentro de window.__seek)

  Convenções:
    - Coordenadas de mundo (as do SVG). y cresce para baixo. Comprimentos já multiplicados pela escala.
    - Ângulos em graus, medidos a partir da vertical para baixo.
      Perfil: positivo = para frente (direção em que ele olha, dir = 1 direita / -1 esquerda).
      Frente: positivo = para fora (para o lado do próprio membro).
    - Joelho só dobra para trás e cotovelo só dobra para frente: o IK sempre escolhe
      a solução anatômica (joelho apontando para a frente do corpo).
*/
(function (global) {
  const RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = u => u * u * (3 - 2 * u);
  const frac = v => v - Math.floor(v);
  const norm = a => ((a + 540) % 360) - 180;   // ângulo em (-180, 180]
  const NS = 'http://www.w3.org/2000/svg';

  // Medidas do corpo em unidades locais (altura total ≈ 560 com escala 1)
  const M = {
    coxa: 118, canela: 112, pe: 44, tornozelo: 10,
    tronco: 190, pescoco: 18, cabeca: 62,
    braco: 96, antebraco: 90,
    quadrilFrente: 14, ombroFrente: 32,
    alturaQuadril: 238
  };

  // Ciclos de locomoção (unidades locais; ver references/biomecanica.md)
  const GAIT = {
    andar:  { passo: 120, apoio: 0.62, quadril: 228, balanco: 5, elevar: 34, bracos: 22, cotovelo: 14, inclina: 3, calcanhar: true },
    correr: { passo: 175, apoio: 0.38, quadril: 218, balanco: 9, elevar: 70, bracos: 38, cotovelo: 88, inclina: 11, calcanhar: false, chute: 70 },
    subir:  { passo: 120, apoio: 0.62, quadril: 226, balanco: 4, elevar: 42, bracos: 16, cotovelo: 20, inclina: 9, calcanhar: false }
  };


  // Expressões faciais. Números se misturam com 'normal' (entrada/saída 0,15 s); o resto troca no meio.
  //  sobAlt [esq, dir]: sobe a sobrancelha · sobInt [esq, dir]: + abaixa a ponta de dentro (bravo), − levanta (preocupado)
  //  olho: 'solido' | 'branco' (arregalado, pupila pequena) | 'feliz' (^) | 'fechado' | 'x'
  //  palpebra 0..1 (desce a pálpebra) · palpebraInc: + abaixa o canto de dentro (raiva/desconfiança)
  //  boca (calado): sorriso, sorrisao, reta, triste, o, grito, dentes, nojo, torta, tremula
  //  fala (falando): normal, feliz, triste, dentes, grito · falaAbre multiplica a abertura do lipsync
  const EXPR = {
    normal:      { sobAlt: [0, 0], sobInt: [0, 0], sobCurva: 3, olho: 'solido', olhoTam: 11, palpebra: 0, palpebraInc: 0, olharX: 0, olharY: 0, boca: 'sorriso', fala: 'normal', falaAbre: 1, bocaLarg: 1, rubor: 0 },
    feliz:       { sobAlt: [3, 3], sobCurva: 5, olho: 'feliz', boca: 'sorriso', fala: 'feliz', bocaLarg: 1.1 },
    alegre:      { sobAlt: [6, 6], sobCurva: 6, olho: 'feliz', boca: 'sorrisao', fala: 'feliz', falaAbre: 1.2, bocaLarg: 1.2, rubor: 0.6 },
    serio:       { sobAlt: [-3, -3], sobInt: [3, 3], sobCurva: 0, palpebra: 0.22, boca: 'reta', fala: 'normal', falaAbre: 0.8, bocaLarg: 0.9 },
    bravo:       { sobAlt: [-5, -5], sobInt: [9, 9], sobCurva: -1, palpebra: 0.3, palpebraInc: 0.5, boca: 'dentes', fala: 'dentes', falaAbre: 1.1, extras: ['veia'] },
    furioso:     { sobAlt: [-7, -7], sobInt: [12, 12], sobCurva: -2, palpebra: 0.35, palpebraInc: 0.7, boca: 'grito', fala: 'grito', falaAbre: 1.8, bocaLarg: 1.3, rubor: 1, tremer: true, extras: ['veia'] },
    gritando:    { sobAlt: [6, 6], sobInt: [4, 4], olho: 'branco', olhoTam: 15, boca: 'grito', fala: 'grito', falaAbre: 1.9, bocaLarg: 1.3, tremer: true },
    susto:       { sobAlt: [13, 13], sobInt: [-3, -3], sobCurva: 6, olho: 'branco', olhoTam: 16, boca: 'o', fala: 'normal', falaAbre: 1.3, extras: ['choque'] },
    espanto:     { sobAlt: [15, 15], sobInt: [-4, -4], sobCurva: 7, olho: 'branco', olhoTam: 17, boca: 'grito', fala: 'grito', falaAbre: 1.5, extras: ['choque', 'suor'] },
    surpreso:    { sobAlt: [11, 11], sobCurva: 6, olhoTam: 14, boca: 'o', fala: 'normal', falaAbre: 1.2 },
    medo:        { sobAlt: [8, 8], sobInt: [-9, -9], sobCurva: 2, olho: 'branco', olhoTam: 14, olharX: -3, boca: 'tremula', fala: 'triste', tremer: true, extras: ['suor'] },
    preocupado:  { sobAlt: [4, 4], sobInt: [-7, -7], boca: 'tremula', fala: 'triste', extras: ['suor'] },
    triste:      { sobAlt: [2, 2], sobInt: [-8, -8], palpebra: 0.25, palpebraInc: -0.4, olharY: 2, boca: 'triste', fala: 'triste', falaAbre: 0.8 },
    chorando:    { sobAlt: [4, 4], sobInt: [-10, -10], olho: 'fechado', boca: 'triste', fala: 'triste', falaAbre: 1.3, extras: ['lagrimas'] },
    nojo:        { sobAlt: [-3, 2], sobInt: [7, 4], palpebra: 0.3, boca: 'nojo', fala: 'triste', verde: true },
    pensando:    { sobAlt: [9, -2], sobInt: [-2, 3], olharX: 3, olharY: -3, boca: 'torta', fala: 'normal' },
    confuso:     { sobAlt: [10, -4], sobInt: [-4, 6], olhoTam: 12, boca: 'torta', fala: 'normal' },
    desconfiado: { sobAlt: [-4, 4], sobInt: [6, 0], palpebra: 0.45, palpebraInc: 0.3, olharX: 3, boca: 'torta', fala: 'normal' },
    cansado:     { sobAlt: [-1, -1], sobInt: [-4, -4], palpebra: 0.55, palpebraInc: -0.3, boca: 'reta', fala: 'normal', falaAbre: 0.7, extras: ['suor'] },
    envergonhado:{ sobAlt: [3, 3], sobInt: [-5, -5], olharY: 3, olharX: -3, boca: 'tremula', rubor: 1 },
    determinado: { sobAlt: [-4, -4], sobInt: [6, 6], palpebra: 0.2, palpebraInc: 0.3, boca: 'torta', fala: 'dentes' },
    aliviado:    { sobAlt: [3, 3], sobInt: [-4, -4], olho: 'fechado', boca: 'sorriso', fala: 'feliz', extras: ['suor'] },
    tonto:       { olho: 'x', boca: 'tremula', fala: 'normal' },
    dormindo:    { olho: 'fechado', boca: 'reta', extras: ['zzz'] }
  };

  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // vetor de comprimento L num ângulo a (graus, a partir de "para baixo"), sx = sinal horizontal
  const vec = (a, L, sx) => [sx * Math.sin(a * RAD) * L, Math.cos(a * RAD) * L];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  // ângulo de um vetor medido a partir de "para baixo", positivo para sx
  const angOf = (v, sx) => Math.atan2(sx * v[0], v[1]) / RAD;

  /* IK de 2 ossos. P = raiz (quadril/ombro), A = alvo (tornozelo/mão).
     sx = lado para onde a articulação do meio aponta (joelho: frente; cotovelo: trás... ver 'dobra').
     dobra = +1 → articulação do meio fica do lado sx (joelho para frente);
             -1 → do lado oposto (cotovelo para trás). */
  function ik2(P, A, L1, L2, sx, dobra) {
    const v = [A[0] - P[0], A[1] - P[1]];
    const d = clamp(Math.hypot(v[0], v[1]), Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.05);
    const base = angOf(v, sx);
    const a1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)) / RAD;
    const a1s = base + dobra * a1;                       // ângulo do osso de cima
    const meio = add(P, vec(a1s, L1, sx));
    const fim = add(P, vec(base, d, sx));
    const a2s = angOf([fim[0] - meio[0], fim[1] - meio[1]], sx); // ângulo do osso de baixo
    return { a1: a1s, a2: a2s, meio, fim };
  }

  class Boneco {
    constructor(parent, opts = {}) {
      this.s = opts.escala ?? 1;
      this.cor = opts.cor ?? '#FFFFFF';
      this.corLonge = opts.corLonge ?? '#D9D9E3';
      this.tinta = opts.tinta ?? '#1D1D2B';
      this.roupa = opts.roupa ?? null;          // cor da túnica/camisa, ou null
      this.cinto = opts.cinto ?? '#7A2E1F';
      this.bochecha = opts.bochecha ?? '#FF6B5B';
      this.acoes = [];      // base: pernas + tronco
      this.bracos = { e: [], d: [] };
      this.cabecas = [];
      this.expr = [];
      this.sujo = [];
      this.boca = opts.boca || null;            // fn(t) → '0'..'4' | 'smile'
      const rnd = mulberry32(opts.seed ?? 3);
      this.piscadas = []; for (let t = 0.8 + rnd() * 1.5; t < 3600; t += 2.2 + rnd() * 2.2) this.piscadas.push(t);
      this.build(parent, opts.contorno !== false);
    }

    // ---------- API de animação ----------
    base(t0, t1, tipo, p = {}) { this.acoes.push({ t0, t1, tipo, p }); this.acoes.sort((a, b) => a.t0 - b.t0); return this; }
    braco(lado, t0, t1, gesto, p = {}) { (lado === 'ambos' ? ['e', 'd'] : [lado]).forEach(l => this.bracos[l].push({ t0, t1, gesto, p })); return this; }
    cabeca(t0, t1, p) { this.cabecas.push({ t0, t1, p }); return this; }
    expressao(t0, t1, nome) { this.expr.push({ t0, t1, nome }); return this; }
    sujeira(t0, t1) { this.sujo.push({ t0, t1 }); return this; }
    mao(lado) { return this._maos ? this._maos[lado] : [0, 0]; }

    // ---------- construção do SVG ----------
    build(parent, contorno) {
      const g = this.g = document.createElementNS(NS, 'g');
      if (contorno) g.setAttribute('filter', 'url(#outline)');
      parent.appendChild(g);
      const mk = (tag, attrs, pai = g) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); pai.appendChild(e); return e; };
      const sw = 16 * this.s;
      const linha = c => ({ fill: 'none', stroke: c, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      this.el = {};
      this.el.bracoLonge = mk('path', linha(this.corLonge));
      this.el.maoLonge = mk('circle', { r: 11 * this.s, fill: this.corLonge });
      this.el.pernaLonge = mk('path', linha(this.corLonge));
      this.el.tronco = mk('path', linha(this.cor));
      if (this.roupa) {
        this.el.roupa = mk('path', { fill: this.roupa });
        this.el.cinto = mk('path', { fill: 'none', stroke: this.cinto, 'stroke-width': 10 * this.s, 'stroke-linecap': 'round' });
      }
      this.el.pernaPerto = mk('path', linha(this.cor));
      // cabeça
      const h = this.el.cab = mk('g', {});
      this.el.cranio = mk('circle', { r: M.cabeca * this.s, fill: this.cor }, h);
      this.el.rosto = mk('g', {}, h);
      this.el.manchas = [[-26, -30, 18, 11], [30, 30, 15, 8], [6, -48, 10, 6]].map(([x, y, rx, ry]) => mk('ellipse', { rx: rx * this.s, ry: ry * this.s, fill: '#3A3A3A', opacity: 0.55, 'data-x': x, 'data-y': y }, this.el.rosto));
      this.el.bochechas = [0, 1].map(() => mk('ellipse', { rx: 11 * this.s, ry: 8 * this.s, fill: this.bochecha, opacity: 0.45 }, this.el.rosto));
      const sw6 = 6 * this.s;
      this.el.olhos = [0, 1].map(() => ({
        esclera: mk('circle', { r: 15 * this.s, fill: '#FFFFFF', stroke: this.tinta, 'stroke-width': 4 * this.s }, this.el.rosto),
        cheio: mk('path', { fill: this.tinta }, this.el.rosto),
        brilho: mk('circle', { r: 3 * this.s, fill: '#FFFFFF' }, this.el.rosto),
        linha: mk('path', { fill: 'none', stroke: this.tinta, 'stroke-width': sw6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.el.rosto)
      }));
      this.el.sobrancelhas = [0, 1].map(() => mk('path', { fill: 'none', stroke: this.tinta, 'stroke-width': 6.5 * this.s, 'stroke-linecap': 'round' }, this.el.rosto));
      this.el.boca = mk('path', { fill: this.tinta, stroke: this.tinta, 'stroke-width': sw6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.el.rosto);
      this.el.dentes = mk('path', { fill: '#FFFFFF', stroke: 'none' }, this.el.rosto);
      this.el.lingua = mk('path', { fill: '#FF6B5B', stroke: 'none' }, this.el.rosto);
      this.el.extras = mk('g', {}, parent);   // fora do filtro de contorno: traços finos ficam nítidos
      this.el.suor = mk('path', { fill: '#8FD3FF', stroke: this.tinta, 'stroke-width': 3 * this.s }, this.el.extras);
      this.el.lagrimas = [0, 1].map(() => mk('path', { fill: '#8FD3FF', stroke: this.tinta, 'stroke-width': 3 * this.s }, this.el.extras));
      this.el.veia = mk('path', { fill: 'none', stroke: '#D7263D', 'stroke-width': 4.5 * this.s, 'stroke-linecap': 'round' }, this.el.extras);
      this.el.choque = mk('path', { fill: 'none', stroke: this.tinta, 'stroke-width': 5 * this.s, 'stroke-linecap': 'round' }, this.el.extras);
      this.el.zzz = mk('path', { fill: 'none', stroke: this.tinta, 'stroke-width': 4 * this.s, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.el.extras);
      this.el.bracoPerto = mk('path', linha(this.cor));
      this.el.maoPerto = mk('circle', { r: 11 * this.s, fill: this.cor });
    }

    // ---------- poses base ----------
    // Retorna pose "corporal": R (raiz no chão), quadril, inclina, vista, dir, giro, pés {tornozelo, inclinacao, chao}, braços padrão
    poseBase(a, t) {
      const s = this.s, p = a.p;
      const vista = p.vista ?? (['andar', 'correr', 'subir', 'sentar', 'deitado'].includes(a.tipo) ? 'perfil' : 'frente');
      const dir = p.dir ?? (a.tipo === 'andar' || a.tipo === 'correr' || a.tipo === 'subir' ? Math.sign((p.ate[0] - p.de[0]) || 1) : 1);
      const respira = Math.sin(t * 2 * Math.PI / 3.2) * 2.2 * s;
      if (a.tipo === 'parado' || a.tipo === 'deitado' || a.tipo === 'agachar') {
        const x = p.x, y = p.y, chao = y;
        const agacha = a.tipo === 'agachar' ? (p.quanto ?? 60) * s : 0;
        const hq = M.alturaQuadril * s - agacha + respira * 0.3;
        if (vista === 'frente') {
          const abre = (p.abertura ?? 30) * s;
          return { vista, dir, R: [x, y], giro: a.tipo === 'deitado' ? (p.giro ?? -90) : 0, inclina: 0, quadril: [x, y - hq], respira,
            pes: [{ tz: [x - abre, chao - M.tornozelo * s], inc: 0 }, { tz: [x + abre, chao - M.tornozelo * s], inc: 0 }],
            bracos: { e: { o: 10, c: 10 }, d: { o: 10, c: 10 } } };
        }
        const pass = (p.passada ?? 14) * s;
        return { vista, dir, R: [x, y], giro: a.tipo === 'deitado' ? (p.giro ?? -90) : 0, inclina: a.tipo === 'agachar' ? 14 : 1, quadril: [x - dir * 4 * s, y - hq], respira,
          pes: [{ tz: [x + dir * pass, chao - M.tornozelo * s], inc: 0 }, { tz: [x - dir * pass, chao - M.tornozelo * s], inc: 0 }],
          bracos: { e: { o: 4, c: 12 }, d: { o: -4, c: 12 } } };
      }
      if (a.tipo === 'sentar') {
        // p.x,p.y = ponto do assento (onde fica o quadril), p.chao = y do chão
        const chao = p.chao ?? (p.y + 120 * s);
        const hx = p.x, hy = p.y - 6 * s + respira * 0.3;
        const fx = hx + dir * (M.coxa * 0.92 * s), sep = 6 * s;
        return { vista: 'perfil', dir, R: [hx, chao], giro: 0, inclina: p.inclina ?? 4, quadril: [hx, hy], respira,
          pes: [{ tz: [fx + dir * sep, chao - M.tornozelo * s], inc: 0 }, { tz: [fx - dir * sep, chao - M.tornozelo * s], inc: 0 }],
          bracos: { e: { o: 18, c: 40 }, d: { o: 14, c: 40 } } };
      }
      if (a.tipo === 'pular') {
        // pulo no lugar (frente ou perfil): agacha → sobe → cai → amortece
        const u = clamp((t - a.t0) / Math.max(0.01, a.t1 - a.t0), 0, 1);
        const alt = (p.altura ?? 70) * s;
        let dy = 0, ag = 0;
        if (u < 0.25) ag = Math.sin(u / 0.25 * Math.PI / 2) * 40 * s;
        else if (u < 0.8) { const k = (u - 0.25) / 0.55; dy = Math.sin(k * Math.PI) * alt; ag = (1 - Math.min(1, k * 4)) * 40 * s; }
        else ag = Math.sin((u - 0.8) / 0.2 * Math.PI) * 30 * s;
        const pose = this.poseBase({ tipo: 'parado', p: { ...p, vista } }, t);
        pose.quadril[1] += ag - dy;
        pose.pes.forEach(f => { f.tz[1] -= dy; });
        pose.inclina += ag / s * 0.15;
        if (vista === 'frente') { pose.bracos.e = { o: 20 + dy / s * 1.6, c: 20 }; pose.bracos.d = { o: 20 + dy / s * 1.6, c: 20 }; }
        return pose;
      }
      // locomoção: andar / correr / subir (escada) — pés plantados via IK
      const G = { ...GAIT[a.tipo], ...(p.gait || {}) };
      const chaoF = p.chao || (() => p.de[1]);
      const dx = p.ate[0] - p.de[0];
      const dist = Math.abs(dx);
      const passo = p.passo ?? (dist > 1 ? dist / Math.max(1, Math.round(dist / (G.passo * s))) : G.passo * s);
      const u = clamp((t - a.t0) / Math.max(0.01, a.t1 - a.t0), 0, 1);
      const D = u * dist;                       // distância percorrida pelo quadril
      const fase = D / (2 * passo);
      const pes = [], qs = [];
      for (let i = 0; i < 2; i++) {
        const off = i * 0.5, q = frac(fase + off);
        qs.push(q);
        const k = Math.floor(fase + off);
        const Dk = (k - off) * 2 * passo;                       // distância do quadril no contato desta passada
        const Xf = p.de[0] + dir * (Dk + 0.55 * passo);          // onde o pé pisou
        const Xn = Xf + dir * 2 * passo;                         // próxima pisada
        const gF = chaoF(Xf), gN = chaoF(Xn);
        const tz = M.tornozelo * s, L = M.pe * s;
        let pos, inc;
        if (q < G.apoio) {
          const w = q / G.apoio;
          if (G.calcanhar && w < 0.12) { inc = lerp(18, 0, w / 0.12); pos = [Xf, gF - tz]; }      // calcanhar toca
          else if (w < 0.68) { inc = 0; pos = [Xf, gF - tz]; }                                    // pé chato, apoio
          else {                                                                                  // calcanhar sobe, gira na ponta
            inc = lerp(0, -38, (w - 0.68) / 0.32);
            const ponta = [Xf + dir * L, gF - tz];
            pos = [ponta[0] - dir * L * Math.cos(inc * RAD), ponta[1] - L * Math.sin(-inc * RAD)];
          }
          if (!G.calcanhar && w < 0.12) inc = lerp(6, 0, w / 0.12);
        } else {
          const w = (q - G.apoio) / (1 - G.apoio), e = smooth(w);
          const L0 = L, incIni = -38;
          const xIni = Xf + dir * L0 - dir * L0 * Math.cos(incIni * RAD), yIni = gF - tz - L0 * Math.sin(-incIni * RAD);
          const xFim = Xn, yFim = gN - tz;
          const subida = Math.max(0, gF - gN);
          pos = [lerp(xIni, xFim, e) - dir * Math.sin(w * Math.PI) * (G.chute || 0) * s * (1 - w),
                 lerp(yIni, yFim, e) - Math.sin(w * Math.PI) * (G.elevar * s + subida * 0.6)];
          inc = w < 0.3 ? lerp(-38, -8, w / 0.3) : lerp(-8, G.calcanhar ? 18 : 6, (w - 0.3) / 0.7);
        }
        pes.push({ tz: pos, inc, chao: q < G.apoio ? gF : null });
      }
      const hx = p.de[0] + dir * D;
      const apoioY = pes.map((f, i) => qs[i] < G.apoio ? f.tz[1] + M.tornozelo * s : null).filter(v => v != null);
      const gy = apoioY.length ? apoioY.reduce((a2, b2) => a2 + b2) / apoioY.length : chaoF(hx);
      const bal = Math.cos(2 * Math.PI * (2 * fase - 0.7)) * G.balanco * s;
      const voo = a.tipo === 'correr' ? Math.max(0, Math.sin(2 * Math.PI * (2 * fase - 0.25))) * 18 * s : 0;
      const quadril = [hx, Math.min(gy, chaoF(hx) + 20 * s) - G.quadril * s - bal - voo];
      // braços em oposição às pernas: braço esquerdo acompanha a perna direita
      const bracos = {};
      ['e', 'd'].forEach((l, i) => {
        const qOposta = qs[1 - i];
        const o = G.bracos * Math.cos(2 * Math.PI * qOposta);   // perna oposta à frente → braço à frente
        bracos[l] = { o, c: G.cotovelo + Math.max(0, o) * 0.8 };
      });
      return { vista: 'perfil', dir, R: [hx, chaoF(hx)], giro: 0, inclina: G.inclina, quadril, pes, bracos, respira: 0 };
    }

    // ---------- gestos de braço (sobrepõem a pose base) ----------
    gesto(g, t, lado, ctx) {
      const { vista, dir, ombro, cabeca, s } = ctx;
      const tt = t - g.t0, p = g.p;
      const sx = vista === 'frente' ? (lado === 'e' ? -1 : 1) : dir;
      switch (g.gesto) {
        case 'acenar': return { o: 145, c: 18 + Math.sin(tt * 2 * Math.PI * 2.6) * 26 };
        case 'cima': return { o: 165 + Math.sin(tt * 2 * Math.PI * 1.5) * 4, c: 6 };
        case 'desespero': return { o: 150 + Math.sin(tt * 2 * Math.PI * 3) * 14, c: 20 + Math.sin(tt * 2 * Math.PI * 3 + 1) * 15 };
        case 'encolher': return { o: 38, c: 72 };
        case 'abanar': return { o: 118, c: 52 + Math.sin(tt * 2 * Math.PI * 3) * 28 };
        case 'apontar': return vista === 'frente' ? { o: 120, c: -8 } : { o: 82, c: 2 };
        case 'estender': return vista === 'frente' ? { o: 55, c: 8 } : { o: 68, c: 14 };
        case 'segurar': return vista === 'frente' ? { o: 18, c: 80 } : { o: 12, c: 88 };
        case 'cintura': return vista === 'frente' ? { o: 38, c: -95 } : { o: -20, c: 100 };
        case 'pose': return { o: p.o, c: p.c };
        case 'comer': case 'queixo': case 'nariz': case 'alcancar': {
          // mão até um alvo do rosto (ou p.alvo em mundo) via IK; cotovelo para baixo
          let alvo;
          if (g.gesto === 'alcancar') alvo = p.alvo;
          else if (vista === 'frente') alvo = add(cabeca, g.gesto === 'comer' ? [sx * 6 * s, 34 * s] : g.gesto === 'nariz' ? [sx * 4 * s, 8 * s] : [sx * 10 * s, 60 * s]);
          else alvo = add(cabeca, g.gesto === 'comer' ? [dir * 48 * s, 30 * s] : g.gesto === 'nariz' ? [dir * 58 * s, 4 * s] : [dir * 34 * s, 58 * s]);
          if (g.gesto === 'comer') alvo[1] += Math.sin(tt * 2 * Math.PI * 1.6) * 8 * s;
          const r = ik2(ombro, alvo, M.braco * s, M.antebraco * s, sx, vista === 'frente' ? 1 : -1);
          return { o: r.a1, c: norm(r.a2 - r.a1) };
        }
      }
      return null;
    }

    // ---------- avaliação no tempo t ----------
    acaoEm(lista, t) {
      let atual = null, anterior = null;
      for (const a of lista) { if (a.t0 <= t) { anterior = atual; atual = a; } }
      if (atual && t > atual.t1 && lista !== this.acoes) return { atual: null, anterior: atual };
      return { atual, anterior };
    }

    pose(t) {
      const s = this.s;
      const { atual, anterior } = this.acaoEm(this.acoes, t);
      if (!atual) return null;
      let P = this.poseBase(atual, Math.min(t, atual.t1));
      // transição suave a partir do fim da ação anterior (mesma vista)
      const tr = atual.p.transicao ?? 0.3;
      if (anterior && t - atual.t0 < tr) {
        const Q = this.poseBase(anterior, anterior.t1);
        const u = smooth((t - atual.t0) / tr);
        if (Q.vista === P.vista && Q.dir === P.dir) P = misturar(Q, P, u);
        else if (u < 0.5) P = Q;
      }
      return P;
    }

    desenhar(t) {
      const s = this.s;
      const P = this.pose(t);
      if (!P) { this.g.style.display = 'none'; this.el.extras.style.display = 'none'; return; }
      this.g.style.display = ''; this.el.extras.style.display = '';
      const { vista, dir } = P;
      // tronco
      const inc = P.inclina;
      const H = P.quadril;
      const top = add(H, [dir * Math.sin(inc * RAD) * M.tronco * s * (vista === 'perfil' ? 1 : 0), -Math.cos(inc * RAD) * M.tronco * s - (P.respira || 0)]);
      // cabeça (orientação própria)
      const cabeca = this.cabecaEm(t, P);
      const inclCab = cabeca.inclinar + (vista === 'perfil' ? inc * 0.5 : 0);
      const sxCab = vista === 'perfil' ? dir : 1;
      const pescoco = add(top, [0, -M.pescoco * s]);
      const cab = add(pescoco, vec(180 + inclCab, M.cabeca * s, sxCab));
      // pernas via IK
      const quadris = vista === 'frente'
        ? [add(H, [-M.quadrilFrente * s, 0]), add(H, [M.quadrilFrente * s, 0])]
        : [H, H];
      const pernas = P.pes.map((f, i) => {
        const sx = vista === 'frente' ? (i === 0 ? -1 : 1) : dir;
        const r = ik2(quadris[i], f.tz, M.coxa * s, M.canela * s, sx, 1);
        const L = M.pe * s;
        let ponta;
        if (vista === 'frente') ponta = add(r.fim, [sx * L * 0.55, 4 * s]);
        else ponta = add(r.fim, [dir * L * Math.cos(f.inc * RAD), -L * Math.sin(f.inc * RAD)]);
        const calc = vista === 'frente' ? add(r.fim, [-sx * 4 * s, 4 * s]) : add(r.fim, [-dir * 9 * s * Math.cos(f.inc * RAD), 9 * s * Math.sin(f.inc * RAD)]);
        return { q: quadris[i], j: r.meio, tz: r.fim, ponta, calc };
      });
      // braços: base + gestos (com entrada/saída suaves)
      const ombros = vista === 'frente'
        ? { e: add(top, [-M.ombroFrente * s, 16 * s]), d: add(top, [M.ombroFrente * s, 16 * s]) }
        : { e: add(top, [0, 16 * s]), d: add(top, [0, 16 * s]) };
      const ctx = { vista, dir, cabeca: cab, s };
      const maos = {}, bracos = {};
      ['e', 'd'].forEach(l => {
        let ang = { ...P.bracos[l] };
        const lista = this.bracos[l];
        for (const g of lista) {
          if (t < g.t0 - 0.0001 || t > g.t1 + 0.3) continue;
          const alvo = this.gesto(g, Math.min(t, g.t1), l, { ...ctx, ombro: ombros[l] });
          if (!alvo) continue;
          const ent = g.p.entrada ?? 0.25, sai = g.p.saida ?? 0.3;
          let w = 1;
          if (t < g.t0 + ent) w = smooth((t - g.t0) / ent);
          if (t > g.t1) w = 1 - smooth((t - g.t1) / sai);
          ang = { o: lerp(ang.o, alvo.o, w), c: lerp(ang.c, alvo.c, w) };
        }
        const sx = vista === 'frente' ? (l === 'e' ? -1 : 1) : dir;
        const o = vista === 'perfil' ? ang.o + inc : ang.o;
        const c = vista === 'perfil' ? clamp(ang.c, -5, 150) : ang.c;
        const cot = add(ombros[l], vec(o, M.braco * s, sx));
        const mao = add(cot, vec(o + c, M.antebraco * s, sx));
        bracos[l] = { o: ombros[l], c: cot, m: mao }; maos[l] = mao;
      });
      // giro do corpo todo (deitado) em torno da raiz
      const giro = P.giro || 0;
      const R = P.R;
      const rot = giro ? (pt => { const c = Math.cos(giro * RAD), sn = Math.sin(giro * RAD), x = pt[0] - R[0], y = pt[1] - R[1]; return [R[0] + x * c - y * sn, R[1] + x * sn + y * c]; }) : (pt => pt);
      const f = pt => { const q = rot(pt); return q[0].toFixed(1) + ' ' + q[1].toFixed(1); };
      const legPath = L => `M${f(L.q)} L${f(L.j)} L${f(L.tz)} M${f(L.calc)} L${f(L.ponta)}`;
      const armPath = B => `M${f(B.o)} L${f(B.c)} L${f(B.m)}`;
      // quem fica na frente: no perfil, o lado "perto" é o esquerdo do corpo quando dir=1? escolhemos fixo: perna 0 / braço 'e' perto
      const perto = vista === 'frente' ? { perna: 1, braco: 'd' } : { perna: 0, braco: dir > 0 ? 'e' : 'd' };
      const longe = { perna: 1 - perto.perna, braco: perto.braco === 'e' ? 'd' : 'e' };
      if (vista === 'frente') {
        // de frente as duas pernas e braços aparecem iguais
        this.el.pernaLonge.setAttribute('stroke', this.cor); this.el.bracoLonge.setAttribute('stroke', this.cor); this.el.maoLonge.setAttribute('fill', this.cor);
      } else {
        this.el.pernaLonge.setAttribute('stroke', this.corLonge); this.el.bracoLonge.setAttribute('stroke', this.corLonge); this.el.maoLonge.setAttribute('fill', this.corLonge);
      }
      this.el.pernaLonge.setAttribute('d', legPath(pernas[longe.perna]));
      this.el.pernaPerto.setAttribute('d', legPath(pernas[perto.perna]));
      this.el.bracoLonge.setAttribute('d', armPath(bracos[longe.braco]));
      this.el.bracoPerto.setAttribute('d', armPath(bracos[perto.braco]));
      const mL = rot(maos[longe.braco]), mP = rot(maos[perto.braco]);
      this.el.maoLonge.setAttribute('cx', mL[0]); this.el.maoLonge.setAttribute('cy', mL[1]);
      this.el.maoPerto.setAttribute('cx', mP[0]); this.el.maoPerto.setAttribute('cy', mP[1]);
      this.el.tronco.setAttribute('d', `M${f(H)} L${f(pescoco)}`);
      // roupa (túnica): trapézio do ombro até um pouco abaixo do quadril
      if (this.el.roupa) {
        const up = [Math.sin(inc * RAD) * (vista === 'perfil' ? dir : 0), -Math.cos(inc * RAD)];
        const lat = [-up[1], up[0]];
        const wO = (vista === 'frente' ? 34 : 20) * s, wB = (vista === 'frente' ? 58 : 44) * s, desce = 46 * s;
        const o0 = add(top, [lat[0] * -wO, lat[1] * -wO]), o1 = add(top, [lat[0] * wO, lat[1] * wO]);
        const bc = add(H, [-up[0] * desce, -up[1] * desce]);
        // no perfil/sentado a barra segue a coxa da frente
        const b0 = add(bc, [lat[0] * -wB, lat[1] * -wB]), b1 = add(bc, [lat[0] * wB, lat[1] * wB]);
        this.el.roupa.setAttribute('d', `M${f(o0)} L${f(o1)} L${f(b1)} L${f(b0)} Z`);
        const c0 = add(H, [up[0] * 60 * s + lat[0] * -wB * 0.82, up[1] * 60 * s + lat[1] * -wB * 0.82]);
        const c1 = add(H, [up[0] * 60 * s + lat[0] * wB * 0.82, up[1] * 60 * s + lat[1] * wB * 0.82]);
        this.el.cinto.setAttribute('d', `M${f(c0)} L${f(c1)}`);
      }
      this._maos = { e: rot(maos.e), d: rot(maos.d) };
      // cabeça e rosto
      const C = rot(cab);
      this.el.cranio.setAttribute('cx', C[0]); this.el.cranio.setAttribute('cy', C[1]);
      this.desenharRosto(t, C, cabeca, P, (giro || 0) - sxCab * inclCab);
    }

    // Orientação da cabeça em t. virar: 0 = de frente, ±1 = perfil olhando para ±x (valores no meio = ¾).
    // A troca frente↔perfil do corpo vira a cabeça em ~0,25 s; cabeca(t0,t1,{...}) sobrepõe com entrada/saída de 0,25 s.
    cabecaEm(t, P) {
      const yawDe = Q => (Q ? (Q.vista === 'perfil' ? Q.dir : 0) : 0);
      let yaw = 0; const K = 5;
      for (let k = 0; k < K; k++) yaw += yawDe(k === 0 ? P : this.pose(Math.max(0, t - k * 0.06)));
      yaw /= K;
      let incl = 0, olhar = [0, 0], baixar = 0;
      let hc = null;
      for (const c of this.cabecas) if (t >= c.t0 - 0.0001 && t <= c.t1 + 0.25) hc = c;
      if (hc) {
        const p = hc.p, tt = t - hc.t0;
        const w = clamp(Math.min(1, (t - hc.t0) / 0.25, t <= hc.t1 ? 1 : 1 - (t - hc.t1) / 0.25), 0, 1);
        const alvo = p.virar ?? (p.vista === 'frente' ? 0 : p.vista === 'perfil' ? (p.dir ?? P.dir) : null);
        if (alvo != null) yaw = lerp(yaw, alvo, w);
        incl += (p.inclinar ?? 0) * w;
        baixar += (p.baixar ?? 0) * w;
        if (p.olhar) olhar = [p.olhar[0] * w, p.olhar[1] * w];
        if (p.gesto === 'sim') baixar += Math.sin(tt * 2 * Math.PI * 2.2) * 9 * w;
        if (p.gesto === 'nao') yaw += Math.sin(tt * 2 * Math.PI * 2.4) * 0.38 * w;
        if (p.gesto === 'balancar') incl += Math.sin(tt * 2 * Math.PI * 1.2) * 8 * w;
      }
      // fala: cabeça acompanha levemente as sílabas
      const f = this.boca ? this.boca(t) : 'smile';
      const ab = { '1': 0.3, '2': 0.6, '3': 1, '4': 0.8 }[f] || 0;
      baixar += ab * 2.5;
      return { yaw: clamp(yaw, -1, 1), inclinar: incl, olhar, baixar };
    }

    // Expressão ativa em t, com entrada/saída de 0,15 s (mistura numérica com 'normal')
    expressaoEm(t) {
      let ex = null;
      for (const e of this.expr) if (t >= e.t0 - 0.0001 && t <= e.t1 + 0.15) ex = e;
      if (!ex) return { E: EXPR.normal, w: 0, nome: 'normal' };
      const w = Math.min(1, (t - ex.t0) / 0.15, t <= ex.t1 ? 1 : 1 - (t - ex.t1) / 0.15);
      return { E: EXPR[ex.nome] || EXPR.normal, w: clamp(w, 0, 1), nome: ex.nome };
    }

    desenharRosto(t, C0, cabeca, P, rotRosto) {
      const s = this.s, el = this.el;
      const yaw = cabeca.yaw, a = Math.abs(yaw), dir = yaw === 0 ? (P.dir || 1) : Math.sign(yaw);
      const vista = a > 0.5 ? 'perfil' : 'frente';
      el.rosto.setAttribute('transform', `rotate(${rotRosto.toFixed(2)} ${C0[0].toFixed(1)} ${C0[1].toFixed(1)})`);
      const { E, w, nome } = this.expressaoEm(t);
      const N = EXPR.normal;
      const num = (k, i) => { const a = Array.isArray(N[k]) ? N[k][i] : N[k], b = Array.isArray(E[k]) ? E[k][i] : E[k]; return lerp(a ?? 0, b ?? (a ?? 0), w); };
      const disc = k => (w > 0.5 ? (E[k] ?? N[k]) : N[k]);
      const tremor = disc('tremer') ? Math.sin(t * 2 * Math.PI * 14) * 2.2 * s : 0;
      const C = [C0[0] + tremor, C0[1] + cabeca.baixar * 0.45 * s];
      const frente = vista === 'frente';
      const perto = dir > 0 ? 1 : 0;                       // olho/bochecha do lado para onde ele vira
      const visivel = i => a < 0.62 || i === perto;
      const mix = (f, pf) => lerp(f, pf, a);
      const sujo = this.sujo.some(q => t >= q.t0 && t <= q.t1);
      el.manchas.forEach(m => { m.style.display = sujo ? '' : 'none'; m.setAttribute('cx', C[0] + m.dataset.x * s * (frente ? 1 : dir) + yaw * 14 * s); m.setAttribute('cy', C[1] + m.dataset.y * s); });
      const pisca = this.piscadas.some(p => t >= p && t < p + 0.12);
      const olhar = [(num('olharX', 0) + cabeca.olhar[0]) * s, (num('olharY', 0) + cabeca.olhar[1]) * s];
      const ladoOlho = i => (frente ? (i === 0 ? -1 : 1) : dir);
      const posOlho = i => [C[0] + mix(i === 0 ? -22 : 22, i === perto ? 26 * dir : 34 * dir) * s, C[1] - 16 * s];
      // ---- olhos
      const tipo = disc('olho');
      el.olhos.forEach((o, i) => {
        const vis = visivel(i);
        [o.esclera, o.cheio, o.brilho, o.linha].forEach(e => (e.style.display = 'none'));
        if (!vis) return;
        const [ox, oy] = posOlho(i), lado = ladoOlho(i);
        const fechado = pisca || tipo === 'fechado';
        if (fechado) { o.linha.style.display = ''; o.linha.setAttribute('d', `M${ox - 9 * s} ${oy + 1 * s} Q${ox} ${oy + 5 * s} ${ox + 9 * s} ${oy + 1 * s}`); return; }
        if (tipo === 'feliz') { o.linha.style.display = ''; o.linha.setAttribute('d', `M${ox - 9 * s} ${oy + 3 * s} Q${ox} ${oy - 10 * s} ${ox + 9 * s} ${oy + 3 * s}`); return; }
        if (tipo === 'x') { o.linha.style.display = ''; const k = 7 * s; o.linha.setAttribute('d', `M${ox - k} ${oy - k} L${ox + k} ${oy + k} M${ox + k} ${oy - k} L${ox - k} ${oy + k}`); return; }
        if (tipo === 'branco') {          // arregalado: esclera branca + pupila pequena
          const r = num('olhoTam', 0) * s;
          o.esclera.style.display = ''; o.esclera.setAttribute('cx', ox); o.esclera.setAttribute('cy', oy); o.esclera.setAttribute('r', r);
          o.cheio.style.display = '';
          const pr = 4.5 * s, px = ox + olhar[0], py = oy + olhar[1];
          o.cheio.setAttribute('d', `M${px - pr} ${py} a${pr} ${pr} 0 1 0 ${2 * pr} 0 a${pr} ${pr} 0 1 0 ${-2 * pr} 0Z`);
          return;
        }
        // olho sólido com pálpebra (lid: 0 aberto … 1 fechado; slant: + abaixa o lado de dentro)
        const rx = 7.5 * s, ry = num('olhoTam', 0) * s;
        const lid = num('palpebra', 0), slant = num('palpebraInc', 0);
        const ox2 = ox + olhar[0] * 0.6, oy2 = oy + olhar[1] * 0.6;
        const pts = [];
        for (let k = 0; k <= 24; k++) {
          const a = (k / 24) * Math.PI * 2;
          let x = ox2 + Math.cos(a) * rx, y = oy2 + Math.sin(a) * ry;
          const dentro = frente ? -lado * (x - ox2) / rx : dir * (x - ox2) / rx;   // +1 = canto interno (perto do nariz)
          const linhaLid = oy2 - ry + 2 * ry * lid + dentro * slant * ry * 0.9;
          if (y < linhaLid) y = Math.min(linhaLid, oy2 + ry);
          pts.push([x, y]);
        }
        o.cheio.style.display = '';
        o.cheio.setAttribute('d', 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + 'Z');
        if (lid < 0.45) { o.brilho.style.display = ''; o.brilho.setAttribute('cx', ox2 + 2.5 * s); o.brilho.setAttribute('cy', oy2 - ry * 0.45 + ry * lid); }
      });
      // ---- sobrancelhas: [altura, ponta interna (+ desce), curva]
      el.sobrancelhas.forEach((sb, i) => {
        const vis = visivel(i); sb.style.display = vis ? '' : 'none'; if (!vis) return;
        const [ox, oy] = posOlho(i), lado = ladoOlho(i);
        const alt = num('sobAlt', i) * s, inn = num('sobInt', i) * s, cur = num('sobCurva', 0) * s;
        const y = oy - 21 * s - alt, wv = 12 * s;   // ponta interna = lado do nariz
        const xi = frente ? ox - lado * wv : ox + dir * wv, xo = frente ? ox + lado * wv : ox - dir * wv;
        sb.setAttribute('d', `M${xo} ${y - inn * 0.4} Q${ox} ${y - cur} ${xi} ${y + inn}`);
      });
      // ---- bochechas
      const corada = num('rubor', 0);
      el.bochechas.forEach((b, i) => {
        const vis = visivel(i); b.style.display = vis ? '' : 'none'; if (!vis) return;
        const bx = C[0] + mix(i === 0 ? -40 : 40, i === perto ? 22 * dir : 46 * dir) * s;
        b.setAttribute('cx', bx); b.setAttribute('cy', C[1] + 12 * s);
        const verde = disc('verde');
        b.setAttribute('fill', verde ? '#6DBE45' : corada > 0.5 ? '#FF3B4E' : this.bochecha);
        b.setAttribute('opacity', verde ? 0.85 : (0.45 + corada * 0.4).toFixed(2));
        b.setAttribute('rx', (11 + corada * 5) * s);
      });
      // ---- boca
      const falando = this.boca ? this.boca(t) : 'smile';
      const abre = { '0': 0, '1': 0.3, '2': 0.6, '3': 1, '4': 0.85 }[falando];
      const bx = C[0] + mix(0, dir * 40) * s, by = C[1] + 26 * s;
      const W = mix(18, 13) * s * num('bocaLarg', 0);
      const B = el.boca, D = el.dentes, Lg = el.lingua;
      D.setAttribute('d', ''); Lg.setAttribute('d', '');
      const formaFala = disc('fala');
      if (abre != null && abre > 0) {
        const o = abre * 15 * s * num('falaAbre', 0);
        if (formaFala === 'feliz') { B.setAttribute('d', `M${bx - W} ${by - 3 * s} Q${bx} ${by - 3 * s} ${bx + W} ${by - 3 * s} Q${bx + W} ${by + o * 1.2} ${bx} ${by + o * 1.3} Q${bx - W} ${by + o * 1.2} ${bx - W} ${by - 3 * s}Z`); }
        else if (formaFala === 'triste') { B.setAttribute('d', `M${bx - W} ${by + 4 * s} Q${bx - W} ${by - o * 1.2} ${bx} ${by - o * 1.1} Q${bx + W} ${by - o * 1.2} ${bx + W} ${by + 4 * s}Z`); }
        else if (formaFala === 'dentes') {
          const h = Math.max(6 * s, o);
          B.setAttribute('d', `M${bx - W} ${by - h / 2} H${bx + W} V${by + h / 2} H${bx - W}Z`);
          D.setAttribute('d', `M${bx - W + 3 * s} ${by - h / 2 + 2 * s} H${bx + W - 3 * s} V${by - h / 2 + 7 * s} H${bx - W + 3 * s}Z M${bx - W + 3 * s} ${by + h / 2 - 7 * s} H${bx + W - 3 * s} V${by + h / 2 - 2 * s} H${bx - W + 3 * s}Z`);
        } else {
          const rx = W * (falando === '4' ? 0.6 : 0.85), ry = Math.max(3 * s, o);
          B.setAttribute('d', `M${bx - rx} ${by} A${rx} ${ry} 0 1 0 ${bx + rx} ${by} A${rx} ${ry} 0 1 0 ${bx - rx} ${by}Z`);
          if (ry > 9 * s) { Lg.setAttribute('d', `M${bx - rx * 0.6} ${by + ry * 0.75} Q${bx} ${by + ry * 0.2} ${bx + rx * 0.6} ${by + ry * 0.75} Q${bx} ${by + ry * 1.0} ${bx - rx * 0.6} ${by + ry * 0.75}Z`);
            if (formaFala === 'grito') D.setAttribute('d', `M${bx - rx * 0.7} ${by - ry * 0.82} Q${bx} ${by - ry * 1.05} ${bx + rx * 0.7} ${by - ry * 0.82} L${bx + rx * 0.6} ${by - ry * 0.62} Q${bx} ${by - ry * 0.75} ${bx - rx * 0.6} ${by - ry * 0.62}Z`); }
        }
        B.setAttribute('fill', this.tinta);
      } else {
        const f = disc('boca');
        let d = '', cheia = false;
        const Wb = W;
        switch (f) {
          case 'sorriso': d = `M${bx - Wb} ${by - 4 * s} Q${bx} ${by + 14 * s} ${bx + Wb} ${by - 4 * s}`; break;
          case 'sorrisao': d = `M${bx - Wb * 1.1} ${by - 5 * s} Q${bx} ${by - 2 * s} ${bx + Wb * 1.1} ${by - 5 * s} Q${bx + Wb} ${by + 20 * s} ${bx} ${by + 22 * s} Q${bx - Wb} ${by + 20 * s} ${bx - Wb * 1.1} ${by - 5 * s}Z`; cheia = true;
            Lg.setAttribute('d', `M${bx - Wb * 0.55} ${by + 15 * s} Q${bx} ${by + 6 * s} ${bx + Wb * 0.55} ${by + 15 * s} Q${bx} ${by + 22 * s} ${bx - Wb * 0.55} ${by + 15 * s}Z`); break;
          case 'reta': d = `M${bx - Wb * 0.75} ${by + 2 * s} L${bx + Wb * 0.75} ${by + 2 * s}`; break;
          case 'triste': d = `M${bx - Wb * 0.85} ${by + 8 * s} Q${bx} ${by - 6 * s} ${bx + Wb * 0.85} ${by + 8 * s}`; break;
          case 'o': d = `M${bx - 6 * s} ${by + 3 * s} a${6 * s} ${8 * s} 0 1 0 ${12 * s} 0 a${6 * s} ${8 * s} 0 1 0 ${-12 * s} 0Z`; cheia = true; break;
          case 'grito': { const rx = Wb * 0.9, ry = 18 * s; d = `M${bx - rx} ${by + 4 * s} A${rx} ${ry} 0 1 0 ${bx + rx} ${by + 4 * s} A${rx} ${ry} 0 1 0 ${bx - rx} ${by + 4 * s}Z`; cheia = true;
            Lg.setAttribute('d', `M${bx - rx * 0.6} ${by + 4 * s + ry * 0.7} Q${bx} ${by + 4 * s + ry * 0.15} ${bx + rx * 0.6} ${by + 4 * s + ry * 0.7} Q${bx} ${by + 4 * s + ry} ${bx - rx * 0.6} ${by + 4 * s + ry * 0.7}Z`);
            D.setAttribute('d', `M${bx - rx * 0.7} ${by + 4 * s - ry * 0.82} Q${bx} ${by + 4 * s - ry * 1.05} ${bx + rx * 0.7} ${by + 4 * s - ry * 0.82} L${bx + rx * 0.6} ${by + 4 * s - ry * 0.6} Q${bx} ${by + 4 * s - ry * 0.72} ${bx - rx * 0.6} ${by + 4 * s - ry * 0.6}Z`); break; }
          case 'dentes': { const h = 12 * s; d = `M${bx - Wb} ${by - h / 2 + 2 * s} H${bx + Wb} V${by + h / 2 + 2 * s} H${bx - Wb}Z`; cheia = true;
            D.setAttribute('d', `M${bx - Wb + 2 * s} ${by - h / 2 + 4 * s} H${bx + Wb - 2 * s} V${by + h / 2} H${bx - Wb + 2 * s}Z`); break; }
          case 'nojo': d = `M${bx - Wb} ${by + 4 * s} Q${bx - Wb / 2} ${by - 6 * s} ${bx} ${by + 2 * s} Q${bx + Wb / 2} ${by + 8 * s} ${bx + Wb} ${by - 2 * s}`; break;
          case 'torta': d = `M${bx - Wb * 0.8} ${by + 4 * s} Q${bx + Wb * 0.2} ${by + 6 * s} ${bx + Wb * 0.9} ${by - 5 * s}`; break;
          case 'tremula': { const n = 6, w2 = Wb * 1.6 / n; d = `M${bx - Wb * 0.8} ${by + 3 * s}`; for (let k = 1; k <= n; k++) d += ` L${bx - Wb * 0.8 + k * w2} ${by + 3 * s + (k % 2 ? -4 : 4) * s}`; break; }
          default: d = `M${bx - Wb} ${by - 4 * s} Q${bx} ${by + 14 * s} ${bx + Wb} ${by - 4 * s}`;
        }
        B.setAttribute('d', d); B.setAttribute('fill', cheia ? this.tinta : 'none');
      }
      // ---- extras
      const ext = w > 0.5 ? (E.extras || []) : [];
      const tem = k => ext.includes(k);
      const lado0 = frente ? 1 : -dir;   // lado da testa onde vão gota/veia
      el.suor.style.display = tem('suor') ? '' : 'none';
      if (tem('suor')) { const sx = C[0] + lado0 * 52 * s, sy = C[1] - 30 * s + ((t * 0.6) % 1) * 22 * s; el.suor.setAttribute('d', `M${sx} ${sy - 14 * s} Q${sx + 9 * s} ${sy} ${sx} ${sy + 6 * s} Q${sx - 9 * s} ${sy} ${sx} ${sy - 14 * s}Z`); }
      el.lagrimas.forEach((lg, i) => {
        const vis = tem('lagrimas') && visivel(i); lg.style.display = vis ? '' : 'none'; if (!vis) return;
        const [ox, oy] = posOlho(i), k = ((t * 0.9 + i * 0.5) % 1);
        const ly = oy + 10 * s + k * 34 * s;
        lg.setAttribute('d', `M${ox} ${ly - 10 * s} Q${ox + 7 * s} ${ly} ${ox} ${ly + 5 * s} Q${ox - 7 * s} ${ly} ${ox} ${ly - 10 * s}Z`);
      });
      el.veia.style.display = tem('veia') ? '' : 'none';
      if (tem('veia')) { const vx = C[0] + lado0 * 38 * s, vy = C[1] - 44 * s, k = 10 * s * (1 + Math.sin(t * 2 * Math.PI * 4) * 0.15);
        el.veia.setAttribute('d', `M${vx - k} ${vy - k * 0.2} Q${vx - k * 0.2} ${vy - k * 0.2} ${vx - k * 0.2} ${vy - k} M${vx + k} ${vy - k * 0.2} Q${vx + k * 0.2} ${vy - k * 0.2} ${vx + k * 0.2} ${vy - k} M${vx - k} ${vy + k * 0.2} Q${vx - k * 0.2} ${vy + k * 0.2} ${vx - k * 0.2} ${vy + k} M${vx + k} ${vy + k * 0.2} Q${vx + k * 0.2} ${vy + k * 0.2} ${vx + k * 0.2} ${vy + k}`); }
      el.choque.style.display = tem('choque') ? '' : 'none';
      if (tem('choque')) { const r0 = 84 * s, r1 = (104 + Math.sin(t * 2 * Math.PI * 6) * 5) * s; let d = '';
        [-60, -35, -12, 12, 35, 60].forEach(a => { const ar = (a - 90) * RAD; d += `M${C[0] + Math.cos(ar) * r0} ${C[1] + Math.sin(ar) * r0} L${C[0] + Math.cos(ar) * r1} ${C[1] + Math.sin(ar) * r1} `; });
        el.choque.setAttribute('d', d); }
      el.zzz.style.display = tem('zzz') ? '' : 'none';
      if (tem('zzz')) { let d = ''; [0, 1, 2].forEach(k => { const z = (12 + k * 5) * s, x = C[0] + (40 + k * 22) * s, y = C[1] - (60 + k * 26) * s - ((t * 0.5) % 1) * 10 * s; d += `M${x} ${y} h${z} l${-z} ${z} h${z} `; }); el.zzz.setAttribute('d', d); }
    }
  }

  function misturar(A, B, u) {
    const L = (a, b) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
    return {
      ...B,
      R: L(A.R, B.R), quadril: L(A.quadril, B.quadril), inclina: lerp(A.inclina, B.inclina, u), giro: lerp(A.giro || 0, B.giro || 0, u),
      pes: B.pes.map((f, i) => ({ ...f, tz: L(A.pes[i].tz, f.tz), inc: lerp(A.pes[i].inc, f.inc, u) })),
      bracos: { e: { o: lerp(A.bracos.e.o, B.bracos.e.o, u), c: lerp(A.bracos.e.c, B.bracos.e.c, u) }, d: { o: lerp(A.bracos.d.o, B.bracos.d.o, u), c: lerp(A.bracos.d.c, B.bracos.d.c, u) } }
    };
  }

  // Chão em degraus: escada(x0, y0, largura, altura, n, sobe=+1 para direita)
  Boneco.escada = (x0, y0, larg, alt, n) => x => {
    const k = clamp(Math.floor((x - x0) / larg), 0, n - 1);
    return y0 - k * alt;
  };
  Boneco.medidas = M; Boneco.expressoes = Object.keys(EXPR); Boneco.gait = GAIT; Boneco.ik2 = ik2;
  global.Boneco = Boneco;
})(window);
