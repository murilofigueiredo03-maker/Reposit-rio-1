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
  const norm = a => ((a + 540) % 360) - 180;
  const P_lin = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];   // ângulo em (-180, 180]
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
    dormindo:    { olho: 'fechado', boca: 'reta', extras: ['zzz'] },
    zumbi:       { sobAlt: [-5, 7], sobInt: [9, -5], sobCurva: -1, olho: 'branco', olhoTam: 12, olharX: 3, boca: 'torta', fala: 'grito', falaAbre: 1.3, rubor: 0 }
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
      this.roupa = opts.roupa ?? null;          // cor da túnica/camisa, ou null (atalho antigo)
      // figurino: { tronco, cor, cor2, mangas, pernas, corPernas, pes, corPes, cabelo, corCabelo, chapeu, corChapeu, extras, corCapa }
      this.fig = Boneco.figurino(opts.figurino, this.roupa);
      if (opts.figurino && this.fig.tronco) this.roupa = this.fig.cor;   // figurino manda na cor da roupa
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
    // mancha na roupa (suco, lama, sangue de mentira...): cresce em 0,3 s a partir de t0
    manchar(t0, t1, cor = '#E8742A') { (this.manchas = this.manchas || []).push({ t0, t1, cor }); return this; }
    mao(lado) { return this._maos ? this._maos[lado] : [0, 0]; }
    // forma da mão (luva): 'relaxada' | 'aberta' | 'punho' | 'apontar' | 'indicador' | 'joinha' | 'baixo' | 'paz' | 'ok' | 'palma' | 'n1'..'n5'
    formaMao(lado, t0, t1, forma) { (lado === 'ambos' ? ['e', 'd'] : [lado]).forEach(l => (this.formas = this.formas || { e: [], d: [] })[l].push({ t0, t1, forma })); return this; }

    // ---------- construção do SVG ----------
    build(parent, contorno) {
      const g = this.g = document.createElementNS(NS, 'g');
      if (contorno) g.setAttribute('filter', 'url(#outline)');
      parent.appendChild(g);
      const mk = (tag, attrs, pai = g) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); pai.appendChild(e); return e; };
      const sw = 16 * this.s;
      const linha = c => ({ fill: 'none', stroke: c, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      this.el = {};
      const F = this.fig;
      const tecido = (c, w) => ({ fill: 'none', stroke: c, 'stroke-width': w * this.s, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      this.el.sombraPe = mk('ellipse', { fill: '#1A1424', opacity: 0.2 }, parent);   // sombra de contato no chão (fora do contorno)
      parent.insertBefore(this.el.sombraPe, g);
      this.el.capa = mk('path', { fill: F.corCapa || '#7A3A2A', stroke: 'none' });
      this.el.mochila = mk('g', {});        // mochila nas costas (sobrevivente): atrás do corpo
      this.el.bracoLonge = mk('path', linha(this.corLonge));
      this.el.mangaLonge = mk('path', tecido(F.corManga || F.cor || '#888', 30));
      this.el.manicaLonge = mk('g', {});   // gladiador: protetor de braço (manica) e de ombro (galero)
      this.el.maoLonge = mk('circle', { r: 11 * this.s, fill: this.corLonge });
      this.el.maoFormaLonge = mk('g', {});   // mão em forma de luva (aberta, punho, apontando, joinha...) — skill personagem-sobrevivente
      this.el.pernaLonge = mk('path', linha(this.corLonge));
      this.el.calcaLonge = mk('path', tecido(F.corPernas || '#3A4A6A', 30));
      this.el.grevaLonge = mk('g', {});    // gladiador: caneleira (ocrea)
      this.el.peLonge = mk('g', {});
      // pernas ficam atrás da roupa: só aparecem abaixo da barra
      this.el.pernaPerto = mk('path', linha(this.cor));
      this.el.calcaPerto = mk('path', tecido(F.corPernas || '#3A4A6A', 30));
      this.el.grevaPerto = mk('g', {});
      this.el.pePerto = mk('g', {});
      this.el.tronco = mk('path', linha(this.cor));
      if (this.roupa) {
        this.el.roupa = mk('path', { fill: this.roupa });
        this.el.cinto = mk('path', { fill: 'none', stroke: F.cinto || this.cinto, 'stroke-width': 10 * this.s, 'stroke-linecap': 'round' });
        this.el.detalhe = mk('path', { fill: 'none', stroke: F.cor2 || 'none', 'stroke-width': 14 * this.s, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
        this.el.avental = mk('path', { fill: '#E8DCC4', stroke: 'none' });
      }
      this.el.bolsa = mk('path', { fill: '#8A5A33', stroke: 'none' });
      this.el.bolsoCargo = mk('path', { fill: 'none', stroke: '#111114', 'stroke-width': 4 * this.s, 'stroke-linejoin': 'round' });
      this.el.mancha = mk('path', { fill: '#E8742A', stroke: 'none', opacity: 0.85 });
      this.el.alcas = mk('path', { fill: 'none', stroke: '#1A1A1E', 'stroke-width': 9 * this.s, 'stroke-linecap': 'round' });
      this.el.cachecol = mk('g', {});       // cachecol laranja (marca registrada do Sobrevivente)
      // cabeça
      const h = this.el.cab = mk('g', {});
      this.el.cabeloTras = mk('path', { fill: F.corCabelo || '#3A2A20' }, h);
      this.el.cranio = mk('circle', { r: M.cabeca * this.s, fill: this.cor }, h);
      this.el.cabelo = mk('path', { fill: F.corCabelo || '#3A2A20' }, h);
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
      this.el.chapeu = mk('g', {}, h);
      this.el.bracoPerto = mk('path', linha(this.cor));
      this.el.mangaPerto = mk('path', tecido(F.corManga || F.cor || '#888', 30));
      this.el.manicaPerto = mk('g', {});
      this.el.maoPerto = mk('circle', { r: 11 * this.s, fill: this.cor });
      this.el.maoFormaPerto = mk('g', {});
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
        // p.estica: estica uma perna para a frente (px, até a perna ficar reta) — ex.: passar o pé em alguém
        const est = Math.min(p.estica || 0, (M.coxa + M.canela) * s * 0.97 - Math.hypot(fx - hx, chao - hy));
        return { vista: 'perfil', dir, R: [hx, chao], giro: 0, inclina: p.inclina ?? 4, quadril: [hx, hy], respira,
          pes: [{ tz: [fx + dir * (sep + Math.max(0, est)), chao - M.tornozelo * s], inc: est > 0 ? -10 : 0 }, { tz: [fx - dir * sep, chao - M.tornozelo * s], inc: 0 }],
          bracos: { e: { o: 18, c: 40 }, d: { o: 14, c: 40 } } };
      }
      if (a.tipo === 'montar') {
        // montado em moto / bicicleta / carro (skill fisica-de-cena): 3 pontos de contato com o veículo
        //  p.assento [x,y] = quadril no banco · p.pe [x,y] = pedaleira (sola do pé) ou p.pedivela { c:[x,y], r, rpm, fase }
        //  p.guidao [x,y] = onde as mãos seguram (guidão / volante) · p.inclina (se faltar, inclina só o necessário para alcançar)
        const dirM = p.dir ?? 1;
        const hx = p.assento[0], hy = p.assento[1] + respira * 0.15;
        const tz = M.tornozelo * s;
        let pes;
        if (p.pedivela) {
          const { c, r, rpm = 50, fase = 0 } = p.pedivela;
          const th = (fase + (t - a.t0) * rpm / 60 * 360) * RAD;
          pes = [0, Math.PI].map(o => { const ang = th + o; return { tz: [c[0] + dirM * Math.cos(ang) * r, c[1] + Math.sin(ang) * r - tz], inc: 0 }; });
        } else {
          const pe = p.pe ?? [hx + dirM * M.coxa * 0.6 * s, hy + 150 * s];
          pes = [{ tz: [pe[0] + dirM * 4 * s, pe[1] - tz], inc: 4 }, { tz: [pe[0] - dirM * 4 * s, pe[1] - tz], inc: 4 }];
        }
        const ombroEm = inc => [hx + dirM * Math.sin(inc * RAD) * M.tronco * s, hy - Math.cos(inc * RAD) * M.tronco * s + 16 * s];
        const alcance = (M.braco + M.antebraco) * s;
        let inc = p.inclina;
        if (inc == null) {
          inc = 4;
          if (p.guidao) while (inc < 50 && Math.hypot(p.guidao[0] - ombroEm(inc)[0], p.guidao[1] - ombroEm(inc)[1]) > alcance * 0.93) inc += 2;
        }
        const bracoAte = alvo => { const r = ik2(ombroEm(inc), alvo, M.braco * s, M.antebraco * s, dirM, -1); return { o: r.a1 - inc, c: norm(r.a2 - r.a1) }; };
        const bracos = p.guidao
          ? { e: bracoAte([p.guidao[0] - dirM * 6 * s, p.guidao[1]]), d: bracoAte(p.guidao) }
          : { e: { o: 18, c: 40 }, d: { o: 14, c: 40 } };
        return { vista: 'perfil', dir: dirM, R: [hx, p.chao ?? hy + 200 * s], giro: 0, inclina: inc, quadril: [hx, hy], respira: 0, pes, bracos, semSombra: true };
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
        // gestos do guia de mãos do Sobrevivente
        case 'explicar': return vista === 'frente' ? { o: 38, c: 52 + Math.sin(tt * 2 * Math.PI * 0.9) * 8 } : { o: 40, c: 55 + Math.sin(tt * 2 * Math.PI * 0.9) * 8 };   // mão aberta, palma para cima
        case 'parar': return vista === 'frente' ? { o: 80, c: -30 } : { o: 84, c: -38 };      // braço esticado, palma para frente
        case 'joinha': return vista === 'frente' ? { o: 40, c: 70 } : { o: 50, c: 72 };
        case 'levantar': return { o: 168, c: 8 };                                              // braço para cima (pedir a palavra / chamar atenção)
        case 'chamar': return vista === 'frente' ? { o: 55, c: 50 + Math.sin(tt * 2 * Math.PI * 2.2) * 35 } : { o: 70, c: 45 + Math.sin(tt * 2 * Math.PI * 2.2) * 35 };
        case 'contar': return vista === 'frente' ? { o: 28, c: 120 } : { o: 30, c: 118 };      // mão na altura do ombro mostrando os dedos
        case 'cruzar': case 'cabeca': case 'testa': {
          let alvo;
          if (g.gesto === 'cruzar') alvo = vista === 'frente' ? add(cabeca, [-sx * 22 * s, (M.cabeca + M.pescoco + 70 + (lado === 'e' ? 6 : 0)) * s]) : add(cabeca, [dir * 30 * s, (M.cabeca + 95) * s]);
          else if (g.gesto === 'cabeca') alvo = add(cabeca, [sx * (vista === 'frente' ? 30 : 0) * s, -M.cabeca * 0.95 * s]);
          else alvo = add(cabeca, [vista === 'frente' ? sx * 14 * s : dir * 40 * s, -M.cabeca * 0.4 * s]);
          const r = ik2(ombro, alvo, M.braco * s, M.antebraco * s, sx, vista === 'frente' ? 1 : -1);
          return { o: r.a1, c: norm(r.a2 - r.a1) };
        }
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


    // Roupas que dependem das articulações: mangas, calças, calçados, capa, bolsa, cabelo e chapéu
    desenharFigurino({ pernas, bracos, perto, longe, top, H, inc, vista, dir, f, rot, s }) {
      const F = this.fig, el = this.el;
      const P_ = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
      // mangas
      const manga = B => {
        if (!F.mangas || F.mangas === 'nenhuma') return '';
        if (F.mangas === 'longa') return `M${f(B.o)} L${f(B.c)} L${f(P_(B.c, B.m, 0.85))}`;
        return `M${f(B.o)} L${f(P_(B.o, B.c, 0.48))}`;
      };
      el.mangaLonge.setAttribute('d', manga(bracos[longe.braco]));
      el.mangaPerto.setAttribute('d', manga(bracos[perto.braco]));
      // calças
      const calca = L => {
        if (!F.pernas || F.pernas === 'nua') return '';
        if (F.pernas === 'bermuda') return `M${f(L.q)} L${f(P_(L.q, L.j, 1.05))}`;
        return `M${f(L.q)} L${f(L.j)} L${f(P_(L.j, L.tz, 0.9))}`;
      };
      el.calcaLonge.setAttribute('d', calca(pernas[longe.perna]));
      el.calcaPerto.setAttribute('d', calca(pernas[perto.perna]));
      // gladiador: manica (braço acolchoado em faixas), galero (placa de metal no ombro), ocrea (caneleira)
      const T_ = this.tinta;
      const manica = (B, lado) => {
        let h = '';
        if (F.manica === lado) {
          const pts = [B.o, B.c, B.m].map(f).join(' L');
          h += `<path d="M${pts}" fill="none" stroke="${T_}" stroke-width="${30 * s}" stroke-linecap="round" stroke-linejoin="round"/><path d="M${pts}" fill="none" stroke="${F.corManica || '#D9CBAE'}" stroke-width="${23 * s}" stroke-linecap="round" stroke-linejoin="round"/>`;
          for (let u = 0.12; u < 0.95; u += 0.17) { h += `<path d="M${f(P_(B.o, B.c, u))} L${f(P_(B.o, B.c, u + 0.05))} M${f(P_(B.c, B.m, u))} L${f(P_(B.c, B.m, u + 0.05))}" stroke="#9A8A6A" stroke-width="${23 * s}" opacity=".35"/>`; }
        }
        if (F.galero === lado) {
          const o = B.o, up = [0, -1];
          h += `<path d="M${f([o[0] - 26 * s, o[1] + 8 * s])} L${f([o[0] - 22 * s, o[1] - 52 * s])} Q${f([o[0] + 6 * s, o[1] - 70 * s])} ${f([o[0] + 30 * s, o[1] - 44 * s])} L${f([o[0] + 26 * s, o[1] + 14 * s])}Z" fill="#B9BCC4" stroke="${T_}" stroke-width="${4 * s}"/><path d="M${f([o[0] - 16 * s, o[1] - 44 * s])} Q${f([o[0] + 4 * s, o[1] - 58 * s])} ${f([o[0] + 20 * s, o[1] - 38 * s])}" stroke="#fff" stroke-width="${3 * s}" fill="none" opacity=".7"/>`;
        }
        return h;
      };
      el.manicaLonge.innerHTML = manica(bracos[longe.braco], longe.braco);
      el.manicaPerto.innerHTML = manica(bracos[perto.braco], perto.braco);
      const greva = (L, i) => F.greva == null || F.greva !== i ? '' :
        `<path d="M${f(P_(L.j, L.tz, 0.05))} L${f(P_(L.j, L.tz, 0.86))}" stroke="${T_}" stroke-width="${30 * s}" stroke-linecap="round"/><path d="M${f(P_(L.j, L.tz, 0.05))} L${f(P_(L.j, L.tz, 0.86))}" stroke="${F.corGreva || '#B9BCC4'}" stroke-width="${23 * s}" stroke-linecap="round"/><path d="M${f(P_(L.j, L.tz, 0.12))} L${f(P_(L.j, L.tz, 0.8))}" stroke="#fff" stroke-width="${4 * s}" opacity=".6" transform="translate(${-5 * s} 0)"/>`;
      el.grevaLonge.innerHTML = greva(pernas[longe.perna], longe.perna);
      el.grevaPerto.innerHTML = greva(pernas[perto.perna], perto.perna);
      // calçados
      el.peLonge.innerHTML = this.calcado(pernas[longe.perna], vista, dir, f, true);
      el.pePerto.innerHTML = this.calcado(pernas[perto.perna], vista, dir, f, false);
      // capa (paenula/manto): atrás do corpo, do ombro até abaixo do joelho
      if ((F.extras || []).includes('capa')) {
        const w = (vista === 'frente' ? 48 : 30) * s, joelho = Math.max(pernas[0].j[1], pernas[1].j[1]) + 30 * s;
        const tras = vista === 'perfil' ? -dir * 26 * s : 0;
        el.capa.setAttribute('d', `M${f([top[0] - w, top[1] + 10 * s])} Q${f([top[0], top[1] - 14 * s])} ${f([top[0] + w, top[1] + 10 * s])} L${f([top[0] + w * 1.25 + tras, joelho])} L${f([top[0] - w * 1.25 + tras, joelho])}Z`);
      } else el.capa.setAttribute('d', '');
      // bolsa a tiracolo
      if ((F.extras || []).includes('bolsa')) {
        const bx = H[0] + (vista === 'perfil' ? -dir * 30 : 46) * s, by = H[1] - 10 * s;
        el.bolsa.setAttribute('d', `M${f([bx - 26 * s, by])} h${52 * s} v${44 * s} h${-52 * s}Z M${f(top)} L${f([bx, by])}`);
        el.bolsa.setAttribute('stroke', '#5E3B1C'); el.bolsa.setAttribute('stroke-width', 6 * s);
      } else el.bolsa.setAttribute('d', '');
      const T0 = '#1D1D2B', ex = F.extras || [], t = this._t || 0, rapido = this._rapido || 0;
      // mancha na roupa (no peito, por cima da camiseta)
      const mc = (this.manchas || []).find(m => t >= m.t0 && t <= m.t1);
      if (mc) {
        const k = Math.min(1, (t - mc.t0) / 0.3), c = P_(top, H, 0.38), R0 = 34 * s * k;
        const lobos = [1, 0.7, 1.15, 0.8, 1.05, 0.65, 0.95, 0.75].map((m, i) => { const a = i / 8 * Math.PI * 2; return [c[0] + Math.cos(a) * R0 * m * (vista === 'perfil' ? 0.6 : 1), c[1] + Math.sin(a) * R0 * m * 1.1]; });
        let d = `M${f(lobos[0])}`; lobos.forEach((p0, i) => { const p1 = lobos[(i + 1) % 8]; d += ` Q${f([p0[0] * 1.0 + (p1[0] - c[0]) * 0.25, p0[1] + (p1[1] - c[1]) * 0.25])} ${f(p1)}`; });
        d += `Z M${f([c[0] + 10 * s, c[1] + R0])} q${3 * s} ${30 * s * k} ${-2 * s} ${42 * s * k} q${-6 * s} ${-4 * s} ${-4 * s} ${-42 * s * k}Z`;   // escorrendo
        el.mancha.setAttribute('d', d); el.mancha.setAttribute('fill', mc.cor);
      } else el.mancha.setAttribute('d', '');
      // luvas pretas
      if (F.luvas) { el.maoLonge.setAttribute('fill', '#2A2A30'); el.maoPerto.setAttribute('fill', '#1D1D2B'); }
      // bolso lateral da calça cargo (na coxa da perna da frente)
      if (F.cargo && F.pernas === 'calca') {
        const L = pernas[perto.perna], a = P_(L.q, L.j, 0.42), b = P_(L.q, L.j, 0.78);
        const v = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(v[0], v[1]) || 1, w = [-v[1] / n * 11 * s, v[0] / n * 11 * s];
        el.bolsoCargo.setAttribute('d', `M${f([a[0] + w[0], a[1] + w[1]])} L${f([b[0] + w[0], b[1] + w[1]])} L${f([b[0] - w[0], b[1] - w[1]])} L${f([a[0] - w[0], a[1] - w[1]])}Z M${f([a[0] + w[0], a[1] + w[1] + 7 * s])} L${f([a[0] - w[0], a[1] - w[1] + 7 * s])}`);
      } else el.bolsoCargo.setAttribute('d', '');
      // mochila preta pequena: de perfil inteira nas costas; de frente só as alças
      if (ex.includes('mochila')) {
        if (vista === 'perfil') {
          const tras = -dir, c = P_(top, H, 0.42), bx = c[0] + tras * 30 * s, by = c[1];
          const w = 44 * s, h = 112 * s, x0 = bx - w / 2 + tras * 6 * s;
          const fc = c[0].toFixed(1) + ' ' + c[1].toFixed(1);
          el.mochila.innerHTML = `<g transform="${this._giroR || ''}"><g transform="rotate(${(dir * inc).toFixed(1)} ${fc})"><rect x="${x0}" y="${by - h / 2}" width="${w}" height="${h}" rx="${18 * s}" fill="#24242A" stroke="${T0}" stroke-width="${5 * s}"/>` +
            `<rect x="${x0 + w * 0.075}" y="${by + h * 0.08}" width="${w * 0.85}" height="${h * 0.34}" rx="${8 * s}" fill="#1A1A1E" stroke="${T0}" stroke-width="${4 * s}" transform="translate(${tras * 6 * s} 0)"/>` +
            `<rect x="${bx - 7 * s + tras * 6 * s}" y="${by + h * 0.18}" width="${14 * s}" height="${10 * s}" rx="${2 * s}" fill="#FF7A00" stroke="${T0}" stroke-width="${2.5 * s}"/>` +
            `<path d="M${x0 + w * 0.15} ${by - h * 0.32} H${x0 + w * 0.85}" stroke="#FF7A00" stroke-width="${4 * s}" stroke-linecap="round"/></g></g>`;
          el.alcas.setAttribute('d', `M${f(P_(top, H, 0.02))} Q${f([top[0] + dir * 14 * s, top[1] + 40 * s])} ${f(P_(top, H, 0.5))}`);
        } else {
          el.mochila.innerHTML = '';
          const yA = top[1] + (H[1] - top[1]) * 0.42;   // alças só no peito (de frente a mochila fica escondida atrás)
          el.alcas.setAttribute('d', `M${f([top[0] - 22 * s, top[1] + 10 * s])} Q${f([top[0] - 30 * s, yA - 20 * s])} ${f([top[0] - 34 * s, yA])} M${f([top[0] + 22 * s, top[1] + 10 * s])} Q${f([top[0] + 30 * s, yA - 20 * s])} ${f([top[0] + 34 * s, yA])}`);
        }
      } else { el.mochila.innerHTML = ''; el.alcas.setAttribute('d', ''); }
      // cachecol laranja: volta grossa no pescoço + nó + 2 pontas largas que esvoaçam para trás (mais quando corre)
      if (ex.includes('cachecol')) {
        const g0 = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
        const pesc = [top[0], top[1] - M.pescoco * 0.3 * s], tras = vista === 'perfil' ? -dir : -1;
        const vento = 0.55 + rapido * 0.45, amp = (5 + rapido * 10) * s;
        const rx = (vista === 'perfil' ? 26 : 36) * s, ry = 15 * s;
        let h = `<path d="M${pesc[0] - rx} ${pesc[1] - ry * 0.5} Q${pesc[0]} ${pesc[1] + ry * 1.6} ${pesc[0] + rx} ${pesc[1] - ry * 0.5} L${pesc[0] + rx * 0.9} ${pesc[1] + ry * 0.6} Q${pesc[0]} ${pesc[1] + ry * 2.6} ${pesc[0] - rx * 0.9} ${pesc[1] + ry * 0.6}Z" fill="#FF7A00" stroke="${T0}" stroke-width="${4.5 * s}" stroke-linejoin="round"/>`;
        const no = [pesc[0] + tras * rx * 0.7, pesc[1] + ry * 0.7];
        [1, 0].forEach(k => {
          const len = (k ? 62 : 80) * s, ang = (35 + vento * 50 - k * 14) * RAD, ph = t * (5 + rapido * 7) + k * 1.9;
          const dirv = [tras * Math.sin(ang), Math.cos(ang)];               // para trás e um pouco para baixo
          const nrm = [-dirv[1], dirv[0]];
          const e = [no[0] + dirv[0] * len, no[1] + dirv[1] * len + Math.sin(ph) * amp];
          const m = [no[0] + dirv[0] * len * 0.5 + nrm[0] * Math.sin(ph + 1.2) * amp, no[1] + dirv[1] * len * 0.5 + nrm[1] * Math.sin(ph + 1.2) * amp];
          const w0 = 7 * s, w1 = (k ? 16 : 20) * s;                        // estreita no nó, larga na ponta (como bandeira)
          const A1 = [no[0] + nrm[0] * w0, no[1] + nrm[1] * w0], A2 = [no[0] - nrm[0] * w0, no[1] - nrm[1] * w0];
          const E1 = [e[0] + nrm[0] * w1, e[1] + nrm[1] * w1], E2 = [e[0] - nrm[0] * w1, e[1] - nrm[1] * w1];
          const M1 = [m[0] + nrm[0] * (w0 + w1) / 2, m[1] + nrm[1] * (w0 + w1) / 2], M2 = [m[0] - nrm[0] * (w0 + w1) / 2, m[1] - nrm[1] * (w0 + w1) / 2];
          const corte = [e[0] - dirv[0] * 8 * s, e[1] - dirv[1] * 8 * s];      // ponta em "V" (franja cortada)
          h += `<path d="M${g0(A1)} Q${g0(M1)} ${g0(E1)} L${g0(corte)} L${g0(E2)} Q${g0(M2)} ${g0(A2)}Z" fill="${k ? '#E86A00' : '#FF7A00'}" stroke="${T0}" stroke-width="${4 * s}" stroke-linejoin="round"/>`;
        });
        h += `<ellipse cx="${no[0].toFixed(1)}" cy="${no[1].toFixed(1)}" rx="${11 * s}" ry="${9 * s}" fill="#FF7A00" stroke="${T0}" stroke-width="${4 * s}"/>`;
        el.cachecol.innerHTML = this._giroR ? `<g transform="${this._giroR}">${h}</g>` : h;
      } else el.cachecol.innerHTML = '';
    }

    // Calçado desenhado sobre o pé (calcanhar → ponta), apontando para onde o pé aponta
    calcado(L, vista, dir, f, longe) {
      const F = this.fig, s = this.s, tipo = F.pes || 'descalco';
      if (tipo === 'descalco') return '';
      const T = '#1D1D2B';
      const a = L.calc, b = L.ponta, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      let n = vista === 'frente' ? [0, -1] : (dir > 0 ? [u[1], -u[0]] : [-u[1], u[0]]);
      if (n[1] > 0) n = [-n[0], -n[1]];
      const p = (x, y) => [a[0] + u[0] * x * s + n[0] * y * s, a[1] + u[1] * x * s + n[1] * y * s];
      const ll = len / s;
      const cor = longe ? Boneco.tomLonge(F.corPes || '#8A5A33') : (F.corPes || '#8A5A33');
      const pts = arr => arr.map(q => f(p(q[0], q[1]))).join(' L');
      if (tipo === 'tenis' || tipo === 'sapato' || tipo === 'bota') {
        let d = `M${pts([[-9, -6], [ll + 12, -6], [ll + 14, 6], [ll + 2, 16], [10, 26], [-8, 22]])}Z`;
        let s2 = `<path d="${d}" fill="${cor}" stroke="${T}" stroke-width="${4 * s}" stroke-linejoin="round"/>`;
        if (tipo === 'tenis') {
          const sola = longe ? '#D9D9E3' : '#FFFFFF', det = F.corPes2 || '#111111';
          s2 += `<path d="M${pts([[-10, -7], [ll + 13, -7], [ll + 15, 1], [-10, 1]])}Z" fill="${sola}" stroke="${T}" stroke-width="${3 * s}"/>`;
          s2 += `<path d="M${pts([[2, 4], [ll * 0.55, 16]])}" stroke="${det}" stroke-width="${5 * s}" stroke-linecap="round"/><path d="M${pts([[ll * 0.35, 18], [ll * 0.75, 12]])}" stroke="#FFFFFF" stroke-width="${3 * s}" stroke-linecap="round"/>`;
        }
        if (tipo === 'bota') {
          const q1 = P_lin(L.tz, L.j, 0.55);
          s2 = `<path d="M${f(P_lin(L.tz, L.j, -0.05))} L${f(q1)}" stroke="${cor}" stroke-width="${30 * s}" stroke-linecap="round"/><path d="M${f(P_lin(L.tz, L.j, -0.05))} L${f(q1)}" stroke="${T}" stroke-width="${3 * s}" stroke-opacity=".0"/>` + s2;
        }
        return s2;
      }
      // sandálias: sola + tiras sobre o pé; caliga = tiras subindo pela canela
      let s2 = `<path d="M${pts([[-9, -4], [ll + 10, -4], [ll + 10, 2], [-9, 2]])}Z" fill="${cor}" stroke="${T}" stroke-width="${3 * s}"/>`;
      const tira = (x) => `<path d="M${f(p(x, 0))} L${f(p(x - 4, 14))}" stroke="${cor}" stroke-width="${5 * s}" stroke-linecap="round"/>`;
      s2 += tira(ll * 0.35) + tira(ll * 0.7) + `<path d="M${f(p(-2, 6))} L${f(L.tz)} L${f(p(ll * 0.35, 12))}" stroke="${cor}" stroke-width="${4.5 * s}" fill="none" stroke-linecap="round"/>`;
      if (tipo === 'caliga') {
        for (let k = 1; k <= 3; k++) { const q = P_lin(L.tz, L.j, k * 0.13); s2 += `<path d="M${f([q[0] - 12 * s, q[1]])} L${f([q[0] + 12 * s, q[1] - 6 * s])}" stroke="${cor}" stroke-width="${5 * s}" stroke-linecap="round"/>`; }
        s2 = `<path d="M${pts([[-9, -6], [ll + 10, -6], [ll + 10, 0], [-9, 0]])}Z" fill="#3A2A1A"/>` + s2;
      }
      return s2;
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
      this._t = t; { const a = this.acaoEm(this.acoes, t).atual; this._rapido = a ? ({ correr: 1, pular: 0.8, andar: 0.35, montar: 0.7 }[a.tipo] || 0) : 0; }
      if (!P) { this.g.style.display = 'none'; this.el.extras.style.display = 'none'; this.el.sombraPe.style.display = 'none'; return; }
      this.el.sombraPe.style.display = '';
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
      const formaG = { e: null, d: null };
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
          if (w > 0.5) formaG[l] = g.p.mao || (g.gesto === 'contar' ? 'n' + (g.p.n ?? 1) : FORMA_GESTO[g.gesto]);
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
      // sombra de contato: embaixo dos pés (ou do corpo deitado), achatada no chão
      { const sp = this.el.sombraPe, chaoY = P.R[1];
        if (this.semSombra || P.semSombra) sp.setAttribute('rx', 0);
        else if (giro) { const c = rot(H); sp.setAttribute('cx', c[0].toFixed(1)); sp.setAttribute('cy', (chaoY + 4).toFixed(1)); sp.setAttribute('rx', (230 * s).toFixed(1)); sp.setAttribute('ry', (16 * s).toFixed(1)); }
        else { const xs = pernas.map(Lg => Lg.tz[0]), alto = Math.max(0, chaoY - Math.max(...pernas.map(Lg => Lg.tz[1])) - M.tornozelo * s);
          const k = Math.max(0.35, 1 - alto / (160 * s));
          sp.setAttribute('cx', ((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(1)); sp.setAttribute('cy', (chaoY + 3).toFixed(1));
          sp.setAttribute('rx', ((Math.abs(xs[0] - xs[1]) / 2 + 58 * s) * k).toFixed(1)); sp.setAttribute('ry', (12 * s * k).toFixed(1)); sp.setAttribute('opacity', (0.22 * k).toFixed(2)); } }
      this._giroR = giro ? `rotate(${giro.toFixed(2)} ${R[0].toFixed(1)} ${R[1].toFixed(1)})` : '';
      this.desenharFigurino({ pernas, bracos, perto, longe, top, H, inc, vista, dir, f, rot, s });
      const mL = rot(maos[longe.braco]), mP = rot(maos[perto.braco]);
      this.el.maoLonge.setAttribute('cx', mL[0]); this.el.maoLonge.setAttribute('cy', mL[1]);
      this.el.maoPerto.setAttribute('cx', mP[0]); this.el.maoPerto.setAttribute('cy', mP[1]);
      if (this.fig.luvas) {
        const baseA = this.acaoEm(this.acoes, t).atual, padrao = baseA && baseA.tipo === 'correr' ? 'punho' : 'relaxada';
        const formaEm = l => { const ex = ((this.formas || {})[l] || []).filter(x => t >= x.t0 && t <= x.t1).pop(); return ex ? ex.forma : formaG[l] || padrao; };
        [[longe.braco, this.el.maoFormaLonge, this.el.maoLonge, true], [perto.braco, this.el.maoFormaPerto, this.el.maoPerto, false]].forEach(([l, gEl, circ, eLonge]) => {
          circ.setAttribute('r', 0);
          const B = bracos[l], sxL = vista === 'frente' ? (l === 'e' ? -1 : 1) : dir;
          gEl.innerHTML = Boneco.desenharMao(formaEm(l), rot(B.c), rot(B.m), { s: s * 1.45, vista, sx: sxL, longe: eLonge });   // luva um pouco maior que a bolinha, como na ficha
        });
      } else { this.el.maoFormaLonge.innerHTML = ''; this.el.maoFormaPerto.innerHTML = ''; }
      this.el.tronco.setAttribute('d', `M${f(H)} L${f(pescoco)}`);
      // roupa (túnica): trapézio do ombro até um pouco abaixo do quadril
      if (this.el.roupa) {
        const up = [Math.sin(inc * RAD) * (vista === 'perfil' ? dir : 0), -Math.cos(inc * RAD)];
        const lat = [-up[1], up[0]];
        const T = Boneco.TRONCOS[this.fig.tronco] || Boneco.TRONCOS.tunica;
        const abertura = Math.abs(pernas[0].tz[0] - pernas[1].tz[0]) / 2;
        const desce = T.desce * s;
        const wO = (vista === 'frente' ? 34 : 20) * s * (T.ombro || 1);
        const wB = Math.max((vista === 'frente' ? T.barra : T.barra * 0.76) * s, T.desce > 120 ? abertura + 26 * s : 0);
        let o0 = add(top, [lat[0] * -wO, lat[1] * -wO]), o1 = add(top, [lat[0] * wO, lat[1] * wO]);
        if (T.cintura) { const wc = wB * 0.95; o0 = add(H, [up[0] * 58 * s + lat[0] * -wc, up[1] * 58 * s + lat[1] * -wc]); o1 = add(H, [up[0] * 58 * s + lat[0] * wc, up[1] * 58 * s + lat[1] * wc]); }   // tanga: só da cintura para baixo
        const bc = add(H, [-up[0] * desce, -up[1] * desce]);
        // no perfil/sentado a barra segue a coxa da frente
        const b0 = add(bc, [lat[0] * -wB, lat[1] * -wB]), b1 = add(bc, [lat[0] * wB, lat[1] * wB]);
        this.el.roupa.setAttribute('d', `M${f(o0)} L${f(o1)} L${f(b1)} L${f(b0)} Z`);
        const c0 = add(H, [up[0] * 60 * s + lat[0] * -wB * 0.82, up[1] * 60 * s + lat[1] * -wB * 0.82]);
        const c1 = add(H, [up[0] * 60 * s + lat[0] * wB * 0.82, up[1] * 60 * s + lat[1] * wB * 0.82]);
        this.el.cinto.setAttribute('d', T.cinto === false && !this.fig.cinto ? '' : `M${f(c0)} L${f(c1)}`);
        // detalhes por tipo: faixa da toga, bordas, listras da armadura, gola
        const P_ = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
        let det = '';
        if (this.fig.tronco === 'toga') det = `M${f(P_(o1, o0, 0.15))} Q${f(P_(H, b0, 0.2))} ${f(P_(b0, b1, 0.12))}`;
        else if (this.fig.tronco === 'armadura') det = [0.25, 0.42, 0.59, 0.76].map(u => `M${f(P_(o0, b0, u))} L${f(P_(o1, b1, u))}`).join(' ');
        else if (this.fig.cor2) det = `M${f(P_(b0, o0, 0.04))} L${f(P_(b1, o1, 0.04))}` + (this.fig.tronco === 'camiseta' || this.fig.tronco === 'moletom' ? ` M${f(P_(o0, o1, 0.3))} Q${f(add(top, [0, 22 * s]))} ${f(P_(o0, o1, 0.7))}` : '');
        this.el.detalhe.setAttribute('d', det);
        if (this.fig.tronco === 'armadura') this.el.detalhe.setAttribute('stroke', '#5A5A62');
        const temAvental = (this.fig.extras || []).includes('avental');
        this.el.avental.setAttribute('d', temAvental ? `M${f(P_(c0, c1, 0.18))} L${f(P_(c0, c1, 0.82))} L${f(P_(b0, b1, 0.86))} L${f(P_(b0, b1, 0.14))}Z` : '');
      }
      this._maos = { e: rot(maos.e), d: rot(maos.d) };
      // cabeça e rosto
      const C = rot(cab);
      this.el.cranio.setAttribute('cx', C[0]); this.el.cranio.setAttribute('cy', C[1]);
      const rotRosto = (giro || 0) - sxCab * inclCab;
      this.desenharCabeca(C, cabeca.yaw, rotRosto, s);
      this.desenharRosto(t, C, cabeca, P, rotRosto);
    }


    // Cabelo e chapéu: giram com a cabeça e deslizam para trás quando ela vira de perfil
    desenharCabeca(C, yaw, rot, s) {
      const F = this.fig, el = this.el, r = M.cabeca * s, T = '#1D1D2B';
      const tr = `rotate(${rot.toFixed(2)} ${C[0].toFixed(1)} ${C[1].toFixed(1)})`;
      [el.cabelo, el.cabeloTras, el.chapeu].forEach(e => e.setAttribute('transform', tr));
      const TH = yaw * 1.35, giroX = Math.sin(TH);          // mesma rotação do rosto
      let d = '', dT = '';
      const est = F.cabelo || 'nenhum';
      if (est !== 'nenhum' && est !== 'careca') {
        // Cabelo = "touca" numa esfera que gira junto com o rosto (mesma conta do desenharRosto).
        // Linha do cabelo h(lon): latitude (rad) onde o cabelo começa; lon 0 = testa, ±π = nuca.
        // Parte visível = arco da silhueta (por cima da cabeça) + linha do cabelo no lado visível.
        const R = r * 1.05;
        const H = { curto: [0.02, 0.5], cacheado: [0.12, 0.52], coque: [0.0, 0.52], longo: [-0.05, 0.5], militar: [0.62, 0.3] }[est] || [0.02, 0.5];
        const h = lon => H[0] + H[1] * Math.cos(lon);
        const pt = (lon, lat) => [C[0] + R * Math.cos(lat) * Math.sin(lon + TH), C[1] - R * Math.sin(lat)];
        const lonD = Math.PI / 2 - TH, lonE = -Math.PI / 2 - TH;          // longitudes na borda direita/esquerda da tela
        const pts = [];
        const latE = h(lonE), latD = h(lonD);
        for (let k = 0; k <= 16; k++) { const lat = latE + (Math.PI - latD - latE) * (k / 16);   // silhueta: sobe pela esquerda, passa no topo, desce pela direita
          pts.push([C[0] - R * Math.cos(lat), C[1] - R * Math.sin(lat)]); }
        for (let k = 0; k <= 24; k++) { const lon = lonD + (lonE - lonD) * (k / 24); pts.push(pt(lon, h(lon))); }
        d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + 'Z';
        if (est === 'militar') {             // militar curto e espetado: fios em ponta saindo do topo, inclinados para um lado
          const nS = 11;
          for (let k = 0; k < nS; k++) {
            const lat = (h(lonE) + 0.08) + (Math.PI - h(lonD) - h(lonE) - 0.16) * (k / (nS - 1));
            const bx = C[0] - R * Math.cos(lat), by = C[1] - R * Math.sin(lat);
            const n = [-Math.cos(lat), -Math.sin(lat)], tg = [-n[1], n[0]];          // normal (para fora) e tangente
            const comp = r * (0.24 + 0.08 * Math.sin(k * 2.3)), lar = r * 0.12, lado = 0.55;   // fios inclinados para um lado
            const p1 = [bx + tg[0] * lar, by + tg[1] * lar], p2 = [bx - tg[0] * lar, by - tg[1] * lar];
            const tip = [bx + n[0] * comp + tg[0] * comp * lado, by + n[1] * comp + tg[1] * comp * lado];
            d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z`;
          }
        }
        if (est === 'cacheado') {            // cachos: bolinhas ao longo da borda do cabelo
          const bol = (x, y) => `M${(x - r * 0.19).toFixed(1)} ${y.toFixed(1)} a${r * 0.19} ${r * 0.19} 0 1 1 ${r * 0.38} 0 a${r * 0.19} ${r * 0.19} 0 1 1 ${-r * 0.38} 0Z`;
          pts.forEach((p, k) => { if (k % 3 === 0) d += bol(p[0], p[1]); });
        }
        if (est === 'longo') { const dx = -giroX * r * 0.55;
          dT = `M${C[0] - r * 1.02 + dx} ${C[1] - r * 0.2} Q${C[0] - r * 1.15 + dx} ${C[1] + r * 1.2} ${C[0] - r * 0.6 + dx} ${C[1] + r * 1.35} H${C[0] + r * 0.6 + dx} Q${C[0] + r * 1.15 + dx} ${C[1] + r * 1.2} ${C[0] + r * 1.02 + dx} ${C[1] - r * 0.2}Z`; }
        if (est === 'coque') {               // coque preso atrás e em cima: ponto da esfera (lon π, lat 0.7) um pouco para fora
          const lat = 0.7, x = C[0] + r * 1.12 * Math.cos(lat) * Math.sin(Math.PI + TH), y = C[1] - r * 1.12 * Math.sin(lat);
          dT = `M${x - r * 0.36} ${y} a${r * 0.36} ${r * 0.32} 0 1 0 ${r * 0.72} 0 a${r * 0.36} ${r * 0.32} 0 1 0 ${-r * 0.72} 0Z`;
        }
      }
      el.cabelo.setAttribute('d', d); el.cabeloTras.setAttribute('d', dT);
      // chapéus / adornos
      const ch = F.chapeu || 'nenhum', cc = F.corChapeu || '#9E2A22';
      let h = '';
      if (ch === 'louros') { for (let k = 0; k < 10; k++) { const a = Math.PI * (1.0 + k * 0.11), x = C[0] + Math.cos(a) * r * 0.98, y = C[1] + Math.sin(a) * r * 0.98 + r * 0.25; h += `<ellipse cx="${x}" cy="${y}" rx="${10 * s}" ry="${5 * s}" fill="${k % 2 ? '#5C7A3A' : '#7A9A4A'}" stroke="${T}" stroke-width="${2 * s}" transform="rotate(${a * 57.3 + 90} ${x} ${y})"/>`; } }
      else if (ch === 'capacete') {
        h = `<path d="M${C[0] - r * 1.05} ${C[1] - r * 0.05} A${r * 1.05} ${r * 1.1} 0 0 1 ${C[0] + r * 1.05} ${C[1] - r * 0.05} L${C[0] + r * 1.12} ${C[1] + r * 0.12} H${C[0] - r * 1.12}Z" fill="#B9BCC4" stroke="${T}" stroke-width="${4 * s}"/>`;
        // protetores de bochecha presos na esfera (longitude ±1,15): giram com o rosto e somem atrás da cabeça
        const pb = [-1.15, 1.15].filter(lg => Math.cos(lg + TH) > 0.05).map(lg => { const x = C[0] + r * 0.95 * Math.sin(lg + TH), w = r * 0.3 * Math.max(0.35, Math.cos(lg + TH)) * Math.sign(-Math.sin(lg + TH) || 1);
          return `M${x} ${C[1]} L${x} ${C[1] + r * 0.62} L${x + w} ${C[1] + r * 0.5} L${x + w * 0.85} ${C[1]}Z`; }).join(' ');
        if (pb) h += `<path d="${pb}" fill="#A9ACB4" stroke="${T}" stroke-width="${3 * s}"/>`;
        h += `<path d="M${C[0] - r * 0.7} ${C[1] - r * 1.0} Q${C[0]} ${C[1] - r * 1.75} ${C[0] + r * 0.7} ${C[1] - r * 1.0} Q${C[0]} ${C[1] - r * 1.25} ${C[0] - r * 0.7} ${C[1] - r * 1.0}Z" fill="${cc}" stroke="${T}" stroke-width="${3 * s}"/>`;
      } else if (ch === 'secutor') {
        // capacete de gladiador secutor: liso e redondo (a rede escorrega), dois furinhos para os olhos, crista baixa, aba na nuca
        const cx = C[0], cy = C[1] - r * 0.08, rx = r * 1.14, ry = r * 1.2, lat = Math.abs(Math.sin(TH));
        h = `<path d="M${cx - rx * 0.95} ${C[1] + r * 0.55} Q${cx} ${C[1] + r * 0.95} ${cx + rx * 0.95} ${C[1] + r * 0.55} L${cx + rx * 1.06} ${C[1] + r * 0.82} Q${cx} ${C[1] + r * 1.22} ${cx - rx * 1.06} ${C[1] + r * 0.82}Z" fill="#9EA2AA" stroke="${T}" stroke-width="${4 * s}"/>`;
        const wc = rx * (0.08 + 0.72 * lat);
        h += `<path d="M${cx - wc} ${cy - ry * 0.72} Q${cx} ${cy - ry * 1.42} ${cx + wc} ${cy - ry * 0.72} Q${cx} ${cy - ry * 1.08} ${cx - wc} ${cy - ry * 0.72}Z" fill="#A9ACB4" stroke="${T}" stroke-width="${4 * s}"/>`;
        h += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#C3C6CD" stroke="${T}" stroke-width="${5 * s}"/>`;
        h += `<path d="M${cx + rx * 0.25} ${cy - ry * 0.96} A${rx} ${ry} 0 0 1 ${cx + rx * 0.25} ${cy + ry * 0.96} A${rx * 0.78} ${ry * 0.97} 0 0 0 ${cx + rx * 0.25} ${cy - ry * 0.96}Z" fill="#7E838C" opacity=".5"/>`;
        h += `<path d="M${cx - rx * 0.62} ${cy - ry * 0.25} Q${cx - rx * 0.55} ${cy - ry * 0.78} ${cx - rx * 0.08} ${cy - ry * 0.88}" stroke="#FFFFFF" stroke-width="${7 * s}" fill="none" opacity=".75" stroke-linecap="round"/>`;
        h += `<path d="M${cx - rx * 0.96} ${cy + ry * 0.38} Q${cx} ${cy + ry * 0.62} ${cx + rx * 0.96} ${cy + ry * 0.38}" stroke="#8E929A" stroke-width="${3 * s}" fill="none"/>`;
        [-0.42, 0.42].forEach(lg => { const c = Math.cos(lg + TH); if (c > 0.15) { const x = cx + r * 0.9 * Math.sin(lg + TH); h += `<ellipse cx="${x}" cy="${C[1] - r * 0.22}" rx="${6 * s * Math.max(0.45, c)}" ry="${6.5 * s}" fill="#0E0E14"/><path d="M${x - 7 * s * c} ${C[1] - r * 0.22 - 8 * s} q${7 * s * c} -4 ${14 * s * c} 0" stroke="#8E929A" stroke-width="${2.5 * s}" fill="none"/>`; } });
        for (let k = 0; k < 7; k++) { const a = Math.PI * (0.15 + k * 0.117) + TH * 0.0, px = cx + rx * 0.9 * Math.cos(a), py = cy + ry * 0.9 * Math.sin(a); if (py > cy) h += `<circle cx="${px}" cy="${py}" r="${2.6 * s}" fill="#6E727A"/>`; }
      } else if (ch === 'bone') {
        const fr = (yaw === 0 ? 0 : Math.sign(yaw)) * (F.boneTras ? -1 : 1);   // boneTras: aba virada para trás
        h = `<path d="M${C[0] - r * 1.0} ${C[1] - r * 0.25} A${r} ${r * 1.0} 0 0 1 ${C[0] + r * 1.0} ${C[1] - r * 0.25}Z" fill="${cc}" stroke="${T}" stroke-width="${4 * s}"/>`;
        h += fr === 0 ? `<ellipse cx="${C[0]}" cy="${C[1] - r * 0.22}" rx="${r * 0.9}" ry="${r * 0.18}" fill="${Boneco.tomLonge(cc)}" stroke="${T}" stroke-width="${3 * s}"/>`
                      : `<path d="M${C[0] + fr * r * 0.6} ${C[1] - r * 0.28} L${C[0] + fr * r * 1.7} ${C[1] - r * 0.18} L${C[0] + fr * r * 0.6} ${C[1] - r * 0.1}Z" fill="${Boneco.tomLonge(cc)}" stroke="${T}" stroke-width="${3 * s}"/>`;
      } else if (ch === 'capuz' || ch === 'palla') {
        const c2 = ch === 'palla' ? (F.corChapeu || '#E8DCC4') : cc;
        // manto sobre a cabeça: a abertura do rosto gira junto com a cabeça (mesma esfera do rosto);
        // de perfil o pano cobre a nuca e a abertura fica só do lado para onde ele olha
        const ox = C[0] - giroX * r * 0.12, f = n => n.toFixed(1);
        const fx = C[0] + giroX * r * 0.62, hw = r * 0.9 * (0.55 + 0.45 * Math.cos(TH));
        const ab = [Math.max(ox - r * 1.06, fx - hw), Math.min(ox + r * 1.06, fx + hw)];   // bordas da abertura
        const topo = C[1] - r * 1.02, pe = C[1] + r * 0.9;
        h = `<path d="M${f(ox - r * 1.18)} ${f(pe)} Q${f(ox - r * 1.3)} ${f(C[1] - r * 1.35)} ${f(ox)} ${f(C[1] - r * 1.25)} Q${f(ox + r * 1.3)} ${f(C[1] - r * 1.35)} ${f(ox + r * 1.18)} ${f(pe)} L${f(ab[1])} ${f(pe)} Q${f(ab[1] + r * 0.1)} ${f(C[1] - r * 1.0)} ${f((ab[0] + ab[1]) / 2)} ${f(topo)} Q${f(ab[0] - r * 0.1)} ${f(C[1] - r * 1.0)} ${f(ab[0])} ${f(pe)}Z" fill="${c2}" stroke="${T}" stroke-width="${3 * s}"/>`;
      } else if (ch === 'touca') {          // touca de cozinha (merendeira): cobre o alto da cabeça
        h = `<path d="M${C[0] - r * 1.08} ${C[1] - r * 0.15} Q${C[0] - r * 1.2} ${C[1] - r * 1.25} ${C[0]} ${C[1] - r * 1.3} Q${C[0] + r * 1.2} ${C[1] - r * 1.25} ${C[0] + r * 1.08} ${C[1] - r * 0.15} Q${C[0]} ${C[1] - r * 0.4} ${C[0] - r * 1.08} ${C[1] - r * 0.15}Z" fill="${cc}" stroke="${T}" stroke-width="${4 * s}"/>`;
        for (let k = -2; k <= 2; k++) h += `<path d="M${C[0] + k * r * 0.35} ${C[1] - r * 1.1} q${r * 0.05} ${r * 0.3} 0 ${r * 0.6}" stroke="${Boneco.tomLonge(cc)}" stroke-width="${2.5 * s}" fill="none"/>`;
      } else if (ch === 'tiara') {          // tiara/arco no cabelo (gira com a cabeça: some atrás quando de costas)
        const f = n => n.toFixed(1), lat = 0.72, rr = r * 1.07;
        const pts = []; for (let k = 0; k <= 20; k++) { const lon = -Math.PI / 2 + Math.PI * k / 20, x = C[0] + rr * Math.cos(lat) * Math.sin(lon + TH) * 1.0, y = C[1] - rr * Math.sin(lat) - Math.cos(lon) * r * 0.12; if (Math.cos(lon + TH) > -0.2) pts.push(f(x) + ' ' + f(y)); }
        if (pts.length > 1) h = `<path d="M${pts.join(' L')}" fill="none" stroke="${T}" stroke-width="${13 * s}" stroke-linecap="round"/><path d="M${pts.join(' L')}" fill="none" stroke="${cc}" stroke-width="${8 * s}" stroke-linecap="round"/>`;
      } else if (ch === 'chapeu') {
        h = `<ellipse cx="${C[0]}" cy="${C[1] - r * 0.6}" rx="${r * 1.6}" ry="${r * 0.22}" fill="${cc}" stroke="${T}" stroke-width="${4 * s}"/><path d="M${C[0] - r * 0.75} ${C[1] - r * 0.6} L${C[0] - r * 0.6} ${C[1] - r * 1.45} H${C[0] + r * 0.6} L${C[0] + r * 0.75} ${C[1] - r * 0.6}Z" fill="${cc}" stroke="${T}" stroke-width="${4 * s}"/>`;
      }
      el.chapeu.innerHTML = h;
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
      // Rosto numa esfera: cada traço tem uma "longitude" (rad) e gira com a cabeça (yaw).
      // x na tela = RF·sen(long + θ); some quando passa para trás (cos < 0,12) e estreita perto da borda.
      const RF = 54, TH = yaw * 1.35;
      const LONG_OLHO = [-0.42, 0.42], LONG_BOCH = [-0.83, 0.83];
      const proj = lg => RF * Math.sin(lg + TH);
      const face = lg => Math.cos(lg + TH);                 // 1 = de frente para a câmera, ≤0 = atrás
      const visivel = i => face(LONG_OLHO[i]) > 0.12;
      const estreita = lg => Math.max(0.4, face(lg));
      const xNariz = proj(0);
      // borda da cabeça na altura dy (traços não podem sair do crânio quando ela gira)
      const borda = (dy, folga) => Math.sqrt(Math.max(0, (M.cabeca - folga) ** 2 - dy * dy)) * s;
      const prender = (x, dy, folga) => { const b = borda(dy, folga); return Math.max(C[0] - b, Math.min(C[0] + b, x)); };
      const sujo = this.sujo.some(q => t >= q.t0 && t <= q.t1);
      el.manchas.forEach(m => { m.style.display = sujo ? '' : 'none'; m.setAttribute('cx', C[0] + proj(Math.asin(Math.max(-1, Math.min(1, m.dataset.x / RF)))) * s); m.setAttribute('cy', C[1] + m.dataset.y * s); });
      const pisca = this.piscadas.some(p => t >= p && t < p + 0.12);
      const olhar = [(num('olharX', 0) + cabeca.olhar[0]) * s, (num('olharY', 0) + cabeca.olhar[1]) * s];
      // lado de fora do olho (oposto ao nariz) — vale de frente, de ¾ e de perfil
      const ladoOlho = i => { const d = proj(LONG_OLHO[i]) - xNariz; return Math.abs(d) < 0.5 ? (i === 0 ? -1 : 1) : Math.sign(d); };
      const posOlho = i => [C[0] + proj(LONG_OLHO[i]) * s, C[1] - 16 * s];
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
        const rx = 7.5 * s * estreita(LONG_OLHO[i]), ry = num('olhoTam', 0) * s;
        const lid = num('palpebra', 0), slant = num('palpebraInc', 0);
        const ox2 = ox + olhar[0] * 0.6, oy2 = oy + olhar[1] * 0.6;
        const pts = [];
        for (let k = 0; k <= 24; k++) {
          const a = (k / 24) * Math.PI * 2;
          let x = ox2 + Math.cos(a) * rx, y = oy2 + Math.sin(a) * ry;
          const dentro = -lado * (x - ox2) / rx;   // +1 = canto interno (perto do nariz)
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
        const y = oy - 21 * s - alt, wv = 12 * s * estreita(LONG_OLHO[i]);   // ponta interna = lado do nariz
        const dyS = (y - C[1]) / s, xi = prender(ox - lado * wv, dyS, 6), xo = prender(ox + lado * wv, dyS, 6);
        sb.setAttribute('d', `M${xo} ${y - inn * 0.4} Q${ox} ${y - cur} ${xi} ${y + inn}`);
      });
      // ---- bochechas
      const corada = num('rubor', 0);
      el.bochechas.forEach((b, i) => {
        const vis = face(LONG_BOCH[i]) > 0.15; b.style.display = vis ? '' : 'none'; if (!vis) return;
        const bx = C[0] + proj(LONG_BOCH[i]) * s;
        b.setAttribute('cx', bx); b.setAttribute('cy', C[1] + 12 * s);
        const verde = disc('verde');
        b.setAttribute('fill', verde ? '#6DBE45' : corada > 0.5 ? '#FF3B4E' : this.bochecha);
        b.setAttribute('opacity', verde ? 0.85 : this.fig.semBochecha && corada < 0.9 ? 0 : (0.45 + corada * 0.4).toFixed(2));
        b.setAttribute('rx', (11 + corada * 5) * s);
      });
      // ---- boca
      const falando = this.boca ? this.boca(t) : 'smile';
      const abre = { '0': 0, '1': 0.3, '2': 0.6, '3': 1, '4': 0.85 }[falando];
      let bx = C[0] + proj(0) * s; const by = C[1] + 26 * s;
      const W = 18 * s * Math.max(0.62, face(0)) * num('bocaLarg', 0);
      { const b = borda(26, 5); if (Math.abs(bx - C[0]) + W > b) bx = C[0] + Math.sign(bx - C[0]) * Math.max(0, b - W); }
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

  // Tipos de roupa do tronco: desce = quanto passa do quadril; barra = meia-largura da barra (de frente)
  Boneco.TRONCOS = {
    tunica:      { desce: 46, barra: 58 },
    tunicaLonga: { desce: 170, barra: 64 },
    toga:        { desce: 190, barra: 72, ombro: 1.15 },
    estola:      { desce: 215, barra: 66 },
    vestido:     { desce: 120, barra: 76 },
    armadura:    { desce: 52, barra: 60, ombro: 1.1 },
    camiseta:    { desce: 14, barra: 50, cinto: false },
    moletom:     { desce: 22, barra: 54, cinto: false },
    moletomLargo:{ desce: 26, barra: 66, cinto: false, ombro: 1.3 },   // corpo mais largo (Pedrão)
    subligaculo: { desce: 40, barra: 46, cintura: true }      // tanga de gladiador (peito de fora)
  };
  const _hex = h => { h = h.replace('#', ''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  Boneco.tomLonge = c => { const v = _hex(c).map(x => Math.round(x * 0.78 + 20)); return '#' + v.map(x => Math.min(255, x).toString(16).padStart(2, '0')).join(''); };
  // Figurinos prontos (ver references/figurino.md). Qualquer campo pode ser sobrescrito.
  Boneco.FIGURINOS = {
    // --- Roma Antiga ---
    'romano':        { tronco: 'tunica', cor: '#B89A6A', mangas: 'curta', pes: 'sandalia', corPes: '#7A4E2C', cabelo: 'curto', corCabelo: '#3A2A20' },
    'romano-cidadao':{ tronco: 'toga', cor: '#F2EBDA', mangas: 'curta', pes: 'sapato', corPes: '#7A2E1F', cabelo: 'curto', corCabelo: '#4A3A2A', cinto: 'none' },
    'senador':       { tronco: 'toga', cor: '#F2EBDA', cor2: '#6B2A6B', mangas: 'curta', pes: 'sapato', corPes: '#7A2E1F', cabelo: 'curto', corCabelo: '#8A8A8A', cinto: 'none' },
    'romana':        { tronco: 'estola', cor: '#3B5E8C', mangas: 'curta', pes: 'sandalia', corPes: '#7A4E2C', cabelo: 'coque', corCabelo: '#3A2418', chapeu: 'palla', corChapeu: '#E8DCC4', cinto: 'none' },
    'legionario':    { tronco: 'armadura', cor: '#9E2A22', mangas: 'curta', pes: 'caliga', corPes: '#6B4A2E', chapeu: 'capacete', corChapeu: '#9E2A22', extras: ['capa'], corCapa: '#9E2A22', cinto: '#5E3B1C' },
    'vendedor':      { tronco: 'tunica', cor: '#7A6A4A', mangas: 'curta', pes: 'sandalia', corPes: '#5E3B1C', cabelo: 'cacheado', corCabelo: '#2A1E16', extras: ['avental'] },
    'gladiador':     { tronco: 'subligaculo', cor: '#E8DCC4', pes: 'descalco', manica: 'd', greva: 0, cabelo: 'curto', corCabelo: '#2A1E16', cinto: '#7A2E1F' },
    'secutor':       { tronco: 'subligaculo', cor: '#E8DCC4', pes: 'descalco', manica: 'd', greva: 0, chapeu: 'secutor', cinto: '#7A2E1F' },
    'reciario':      { tronco: 'subligaculo', cor: '#3B5E8C', pes: 'descalco', manica: 'e', galero: 'e', cabelo: 'cacheado', corCabelo: '#2A1E16', cinto: '#C9A24A' },
    'lanista':       { tronco: 'tunicaLonga', cor: '#6B4A2E', mangas: 'curta', pes: 'sandalia', corPes: '#4A3420', cabelo: 'curto', corCabelo: '#7A7A7A', cinto: '#2A1E16' },
    'imperador':     { tronco: 'toga', cor: '#6B2A6B', cor2: '#C9A24A', mangas: 'curta', pes: 'sapato', corPes: '#C9A24A', cabelo: 'curto', corCabelo: '#4A3A2A', chapeu: 'louros', cinto: 'none' },
    'zumbi':         { tronco: 'camiseta', cor: '#6E7A5A', cor2: '#4A5240', mangas: 'curta', pernas: 'calca', corPernas: '#3A4A5A', pes: 'tenis', corPes: '#8A8A80', corPes2: '#5A5A50', cabelo: 'curto', corCabelo: '#3A3A30' },
    'trabalhador':   { tronco: 'tunica', cor: '#A08A68', mangas: 'nenhuma', pes: 'descalco', cabelo: 'curto', corCabelo: '#2A1E16', cinto: '#5E3B1C' },
    // --- hoje ---
    'casual':        { tronco: 'camiseta', cor: '#3B7DD8', mangas: 'curta', pernas: 'calca', corPernas: '#2E4A7A', pes: 'tenis', corPes: '#FFFFFF', corPes2: '#3B7DD8', cabelo: 'curto', corCabelo: '#3A2A20' },
    'moletom':       { tronco: 'moletom', cor: '#6A6E78', mangas: 'longa', pernas: 'calca', corPernas: '#2A2C32', pes: 'tenis', corPes: '#FFFFFF', corPes2: '#2A2C32', cabelo: 'curto', corCabelo: '#2A1E16' },
    // --- marca do usuário (personagem principal) ---
    'marca':         { tronco: 'camiseta', cor: '#111111', cor2: '#FF7A00', mangas: 'curta', pernas: 'calca', corPernas: '#24242A', pes: 'tenis', corPes: '#FF7A00', corPes2: '#111111' },
    // --- ELENCO FIXO DA SÉRIE "O GAROTO DO TÊNIS LARANJA" (skill elenco-serie) — mesma aparência em todos os episódios ---
    'caio':          { tronco: 'moletom', cor: '#B8322A', mangas: 'longa', pernas: 'calca', corPernas: '#3B5E8C', pes: 'tenis', corPes: '#F2F2F2', corPes2: '#B8322A', cabelo: 'curto', corCabelo: '#D8A73A', semBochecha: true },
    'duda':          { tronco: 'camiseta', cor: '#2E9E5A', mangas: 'curta', pernas: 'calca', corPernas: '#C9B48A', pes: 'tenis', corPes: '#2A2A30', corPes2: '#F2F2F2', cabelo: 'cacheado', corCabelo: '#2A1E16', semBochecha: true },
    'pedrao':        { tronco: 'moletomLargo', cor: '#6A6E78', mangas: 'longa', pernas: 'calca', corPernas: '#2A2A30', pes: 'tenis', corPes: '#2E4A7A', corPes2: '#F2F2F2', cabelo: 'curto', corCabelo: '#1A1A1A', chapeu: 'bone', corChapeu: '#2E4A7A', boneTras: true, semBochecha: true },
    'menina':        { tronco: 'camiseta', cor: '#7A4AA8', mangas: 'curta', pernas: 'calca', corPernas: '#6A8AB8', pes: 'tenis', corPes: '#F2F2F2', corPes2: '#7A4AA8', cabelo: 'longo', corCabelo: '#3A2418', chapeu: 'tiara', corChapeu: '#F2C230', semBochecha: true },
    'merendeira':    { tronco: 'camiseta', cor: '#F2F2EE', mangas: 'curta', pernas: 'calca', corPernas: '#F2F2EE', pes: 'tenis', corPes: '#F2F2F2', corPes2: '#8A8A8A', cabelo: 'curto', corCabelo: '#5A3A2A', chapeu: 'touca', corChapeu: '#FFFFFF', extras: ['avental'], semBochecha: true },
    'aluno':         { tronco: 'camiseta', cor: '#5A7A9A', mangas: 'curta', pernas: 'calca', corPernas: '#2E3A4A', pes: 'tenis', corPes: '#F2F2F2', corPes2: '#5A5A60', cabelo: 'curto', corCabelo: '#2A1E16', semBochecha: true },
    // --- SOBREVIVENTE: personagem oficial (skill personagem-sobrevivente) ---
    'sobrevivente':  { tronco: 'camiseta', cor: '#FFFFFF', mangas: 'curta', pernas: 'calca', corPernas: '#26262B', cargo: true, pes: 'tenis', corPes: '#FF7A00', corPes2: '#111111', cabelo: 'militar', corCabelo: '#111111', extras: ['cachecol', 'mochila'], luvas: true, semBochecha: true, cinto: 'none' }
  };
  // O personagem principal leva SEMPRE o tênis laranja e preto, qualquer que seja a época.
  Boneco.PROTAGONISTA = { pes: 'tenis', corPes: '#FF7A00', corPes2: '#111111' };
  Boneco.figurino = (f, roupaAntiga) => {
    if (!f) return roupaAntiga ? { tronco: 'tunica', cor: roupaAntiga } : {};
    if (typeof f === 'string') return { ...(Boneco.FIGURINOS[f] || {}) };
    const base = f.preset ? Boneco.FIGURINOS[f.preset] || {} : {};
    const r = { ...base, ...f };
    if (f.protagonista) Object.assign(r, Boneco.PROTAGONISTA);
    return r;
  };

  // forma da mão para cada gesto de braço (guia de mãos do Sobrevivente)
  const FORMA_GESTO = { apontar: 'apontar', acenar: 'aberta', cima: 'punho', desespero: 'aberta', encolher: 'aberta', abanar: 'aberta', estender: 'aberta',
    segurar: 'punho', cintura: 'punho', comer: 'punho', queixo: 'punho', nariz: 'punho', alcancar: 'aberta', explicar: 'aberta', parar: 'palma', joinha: 'joinha',
    levantar: 'indicador', chamar: 'aberta', cruzar: 'punho', cabeca: 'aberta', testa: 'aberta' };
  Boneco.FORMA_GESTO = FORMA_GESTO;

  // Desenha a mão de luva preta. E = cotovelo, W = mão (fim do antebraço). Dedos simples e arredondados, 4 dedos + polegar.
  Boneco.desenharMao = (forma, E, W, { s = 1, vista = 'frente', sx = 1, longe = false } = {}) => {
    const LUVA = longe ? '#34343C' : '#22222A', BORDA = '#0B0B10', BRILHO = '#5C5C68';
    let u = [W[0] - E[0], W[1] - E[1]]; const n0 = Math.hypot(u[0], u[1]) || 1; u = [u[0] / n0, u[1] / n0];
    let v = [-u[1], u[0]];
    if (vista === 'frente') { if (v[0] * -sx < 0) v = [-v[0], -v[1]]; }      // de frente: polegar para o lado de dentro
    else if (v[1] > 0) v = [-v[0], -v[1]];                                 // de lado: polegar para cima
    const P = (a, b) => [W[0] + (u[0] * a + v[0] * b) * s, W[1] + (u[1] * a + v[1] * b) * s];
    const q = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    const rotv = (d, ang) => { const c = Math.cos(ang), sn = Math.sin(ang); return [d[0] * c - d[1] * sn, d[0] * sn + d[1] * c]; };
    const dedo = (b, d, L, w = 7) => { const e = [b[0] + d[0] * L * s, b[1] + d[1] * L * s];
      return `<path d="M${q(b)} L${q(e)}" stroke="${BORDA}" stroke-width="${(w + 3) * s}" stroke-linecap="round"/><path d="M${q(b)} L${q(e)}" stroke="${LUVA}" stroke-width="${w * s}" stroke-linecap="round"/>`; };
    const palma = (c, r = 10) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r * s}" fill="${LUVA}" stroke="${BORDA}" stroke-width="${2.6 * s}"/>`;
    const brilho = (c, r = 10) => `<path d="M${q([c[0] - r * 0.55 * s, c[1] - r * 0.25 * s])} Q${q([c[0] - r * 0.2 * s, c[1] - r * 0.75 * s])} ${q([c[0] + r * 0.35 * s, c[1] - r * 0.6 * s])}" stroke="${BRILHO}" stroke-width="${2 * s}" fill="none" stroke-linecap="round" opacity=".8"/>`;
    const C = P(9, 0), up = [0, -1], lado = [1, 0];
    const abre = vista === 'frente' ? 1 : 0.45;
    let h = '';
    const dedosCima = (k, comPolegar) => {        // k dedos levantados (contagem), saindo do alto do punho
      let r = '';
      const dx = [-6, -2, 2, 6];
      for (let i = 0; i < k; i++) { const b = [C[0] + dx[i] * s * abre, C[1] - 7 * s]; r += dedo(b, rotv(up, (i - (k - 1) / 2) * 0.16 * abre), 12, 6); }
      if (comPolegar) r += dedo([C[0] - sx * 8 * s * abre, C[1]], rotv(up, -sx * 1.1), 10, 6.5);
      return r;
    };
    const nos = () => `<path d="M${q(P(14, -6))} L${q(P(15, 6))}" stroke="${BRILHO}" stroke-width="${1.6 * s}" stroke-dasharray="${3 * s} ${2.2 * s}" opacity=".7"/>`;   // juntas dos dedos
    switch (forma) {
      case 'aberta': {
        h += palma(P(8, 0), 9.5);
        [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => {   // dedos em leque: cada um abre para o seu lado
          const d0 = [u[0] - v[0] * k * 0.42 * abre, u[1] - v[1] * k * 0.42 * abre], nd = Math.hypot(d0[0], d0[1]);
          h += dedo(P(12, -k * 4.6 * abre), [d0[0] / nd, d0[1] / nd], i === 0 || i === 3 ? 9.5 : 12, 5.6); });
        { const d0 = [u[0] * 0.4 + v[0], u[1] * 0.4 + v[1]], nd = Math.hypot(d0[0], d0[1]); h += dedo(P(5, 8), [d0[0] / nd, d0[1] / nd], 8, 6.5); }   // polegar para o lado
        h += brilho(P(8, 0), 9.5); break;
      }
      case 'palma': {        // palma para frente, dedos para cima (gesto de parar / cumprimentar)
        const c = P(6, 0); h += palma(c, 10.5);
        [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => { h += dedo([c[0] + k * 4.2 * s * abre, c[1] - 8 * s], rotv(up, k * 0.12), i === 0 || i === 3 ? 10 : 12.5, 6); });
        h += dedo([c[0] - sx * 9 * s * abre, c[1] + 1 * s], rotv(up, -sx * 1.15), 9, 6.5);
        h += brilho(c, 10.5); break;
      }
      case 'apontar': {
        h += palma(C, 10.5) + nos();
        h += dedo(P(15, -3), u, 15, 6.5);                             // indicador esticado na direção do braço
        h += dedo(P(6, 8), rotv(u, 0.5), 7, 6.5); h += brilho(C, 10.5); break;
      }
      case 'indicador': case 'n1': h += palma(C, 10.5) + dedosCima(1, false) + brilho(C, 10.5); break;
      case 'paz': case 'n2': { h += palma(C, 10.5); const b = [C[0], C[1] - 7 * s]; h += dedo([b[0] - 2.5 * s, b[1]], rotv(up, -0.32), 12.5, 6) + dedo([b[0] + 2.5 * s, b[1]], rotv(up, 0.32), 12.5, 6) + brilho(C, 10.5); break; }
      case 'n3': h += palma(C, 10.5) + dedosCima(3, false) + brilho(C, 10.5); break;
      case 'n4': h += palma(C, 10.5) + dedosCima(4, false) + brilho(C, 10.5); break;
      case 'n5': h += palma(C, 10.5) + dedosCima(4, true) + brilho(C, 10.5); break;
      case 'ok': {
        h += palma(C, 10);
        const anel = [C[0] - sx * 8 * s, C[1] - 6 * s];
        h += `<circle cx="${anel[0].toFixed(1)}" cy="${anel[1].toFixed(1)}" r="${6 * s}" fill="none" stroke="${BORDA}" stroke-width="${8.5 * s}"/><circle cx="${anel[0].toFixed(1)}" cy="${anel[1].toFixed(1)}" r="${6 * s}" fill="none" stroke="${LUVA}" stroke-width="${5.5 * s}"/>`;
        [0, 1, 2].forEach(i => { h += dedo([C[0] + (i * 4 - 1) * s * sx, C[1] - 7 * s], rotv(up, sx * (0.1 + i * 0.16)), 11, 5.5); });
        h += brilho(C, 10); break;
      }
      case 'joinha': case 'baixo': {
        h += palma(C, 11) + `<path d="M${q([C[0] - 8 * s, C[1] + 3 * s])} H${q([C[0] + 8 * s, 0]).split(' ')[0]}" stroke="${BRILHO}" stroke-width="${1.6 * s}" opacity=".7"/>`;
        const d = forma === 'joinha' ? up : [0, 1];
        h += dedo([C[0] - sx * 3 * s, C[1] + d[1] * 8 * s], d, 11, 7.5) + brilho(C, 11); break;
      }
      case 'punho': h += palma(C, 11) + nos() + dedo(P(5, 7), rotv(u, 0.9), 6, 6) + brilho(C, 11); break;
      default: {             // relaxada: luva arredondada, dedos juntos levemente curvados
        const c = P(9, 0), ang = Math.atan2(u[1], u[0]) * 180 / Math.PI;
        h += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${13 * s}" ry="${10 * s}" transform="rotate(${ang.toFixed(1)} ${q(c)})" fill="${LUVA}" stroke="${BORDA}" stroke-width="${2.6 * s}"/>`;
        h += dedo(P(5, 7.5), rotv(u, 0.55), 6, 6) + brilho(c, 10);
      }
    }
    return h;
  };

  Boneco.escada = (x0, y0, larg, alt, n) => x => {
    const k = clamp(Math.floor((x - x0) / larg), 0, n - 1);
    return y0 - k * alt;
  };
  Boneco.medidas = M; Boneco.expressoes = Object.keys(EXPR); Boneco.gait = GAIT; Boneco.ik2 = ik2;
  global.Boneco = Boneco;
})(window);
