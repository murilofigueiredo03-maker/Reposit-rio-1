/*
  animal.js — animais quadrúpedes 2D em SVG com movimento de verdade (skill "animacao-animal").
  Mesmo estilo dos bonecos (contorno pelo filtro #outline, cores vivas, luz de um lado).

  const a = new Animal(svgGrupo, { especie: 'leao', escala: 0.6, seed: 3 });
  a.base(0, 4, 'parado', { x: 300, y: 1700, dir: 1 });              // respira, mexe o rabo, troca o peso
  a.base(4, 8, 'andar', { de: [300, 1700], ate: [800, 1700] });     // passo (4 tempos, um pé de cada vez)
  a.base(8, 9, 'trotar' | 'correr' | 'sentar' | 'deitado' | 'pular', {...});
  a.cabeca(2, 3.5, { rugir: true });                                // abre a boca, cabeça avança, juba balança
  a.cabeca(5, 6, { olhar: [dx, dy], baixar: 10 });                  // olhar / farejar
  a.desenhar(t);                                                    // chame a cada quadro (ex.: dentro de __seek)

  Anatomia (skill creature-artist): o "joelho" da frente é o PULSO e dobra para trás; o cotovelo
  aponta para trás; o joelho de trás (soldra) dobra para a frente e o jarrete para trás.
  Andar = sequência lateral (TE, DE, TD, DD); trote = pares diagonais; galope = com fase no ar.
  Vida (skill naturalistic-motion): nunca parado de verdade — respiração, rabo e juba com atraso
  (follow-through), cabeça que balança com o passo, assimetria entre lados.
*/
(function (global) {
  const NS = 'http://www.w3.org/2000/svg';
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = u => u * u * (3 - 2 * u);
  const f = v => Math.round(v * 10) / 10;
  const P = (p) => `${f(p[0])} ${f(p[1])}`;
  // IK de 2 ossos: escolhe a dobra para a frente (+1) ou para trás (-1) em relação à direção do animal
  function ik2(a, alvo, l1, l2, lado, dir) {
    let dx = alvo[0] - a[0], dy = alvo[1] - a[1]; let d = Math.hypot(dx, dy);
    const dm = Math.min(d, (l1 + l2) * 0.999); if (d < 1e-6) d = 1e-6;
    const ux = dx / d, uy = dy / d;
    const cosA = clamp((l1 * l1 + dm * dm - l2 * l2) / (2 * l1 * dm), -1, 1), A = Math.acos(cosA);
    const c1 = [a[0] + l1 * (ux * Math.cos(A) - uy * Math.sin(A)), a[1] + l1 * (ux * Math.sin(A) + uy * Math.cos(A))];
    const c2 = [a[0] + l1 * (ux * Math.cos(-A) - uy * Math.sin(-A)), a[1] + l1 * (ux * Math.sin(-A) + uy * Math.cos(-A))];
    return (c1[0] - c2[0]) * dir * lado > 0 ? c1 : c2;
  }
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- espécies (unidades com escala 1; o leão tem ~1,2 m de altura na cernelha) ----------
  const ESPECIES = {
    leao:     { perfil: { pts: [[-0.55, -0.55], [-0.05, -0.85], [0.5, -0.66], [0.9, -0.36], [1.18, -0.14], [1.22, 0.1], [1.06, 0.28], [0.74, 0.36], [0.8, 0.52], [0.55, 0.7], [0.1, 0.64], [-0.45, 0.36]], pivo: [0.05, 0.36], olho: [0.42, -0.3], nariz: [1.12, -0.1], orelha: 'redonda', orelhaP: [-0.25, -0.78], almofada: [0.88, 0.14, 0.3, 0.2], corNariz: '#4A2A22', ang: 4 }, claro: '#E8B862', cor: '#D9A048', longe: '#B4802E', barriga: '#EBC27A', comp: 250, frente: [106, 101], tras: [104, 83, 52], peito: [92, 86], anca: [84, 80], pescoco: [120, -62], cabeca: 82, focinho: [46, 30], orelha: 'redonda', cauda: { n: 9, seg: 25, w: 10, tufo: '#6E3418', sobe: 0.25 }, juba: '#8A4520', jubaLonge: '#6E3418', passo: 210, pata: 22 },
    urso:     { perfil: { pts: [[-0.6, -0.5], [-0.1, -0.82], [0.45, -0.62], [0.85, -0.32], [1.3, -0.2], [1.42, 0.0], [1.3, 0.18], [0.9, 0.3], [0.92, 0.45], [0.5, 0.62], [-0.05, 0.6], [-0.55, 0.3]], pivo: [0.05, 0.32], olho: [0.48, -0.32], olhoTam: 0.11, nariz: [1.36, -0.1], orelha: 'redonda', orelhaP: [-0.18, -0.8], almofada: [1.05, 0.05, 0.38, 0.2], ang: 8, corOlho: '#3A2418' }, claro: '#86603E', cor: '#6E4A2E', longe: '#553822', barriga: '#8A6040', comp: 230, frente: [94, 92], tras: [90, 76, 47], peito: [100, 92], anca: [92, 88], pescoco: [110, -10], cabeca: 68, focinho: [46, 28], orelha: 'redonda', corcova: true, focinhoCor: '#C9A882', cauda: { n: 2, seg: 16, w: 14, sobe: 0.3 }, passo: 180, pata: 28, garras: true },
    cachorro: { perfil: { pts: [[-0.6, -0.5], [-0.05, -0.8], [0.5, -0.56], [0.9, -0.24], [1.35, -0.16], [1.46, 0.04], [1.36, 0.22], [0.95, 0.3], [0.95, 0.45], [0.5, 0.56], [-0.05, 0.56], [-0.55, 0.3]], pivo: [0.05, 0.32], olho: [0.5, -0.3], olhoTam: 0.14, nariz: [1.42, -0.08], orelha: 'caida', orelhaP: [-0.15, -0.6], almofada: [1.12, 0.1, 0.32, 0.18], ang: 10, corOlho: '#5A3A1E' }, claro: '#D99A58', cor: '#C98A4A', longe: '#A86E36', barriga: '#E8C08A', comp: 170, frente: [79, 76], tras: [77, 63, 40], peito: [66, 62], anca: [58, 56], pescoco: [78, -66], cabeca: 54, focinho: [40, 22], orelha: 'caida', cauda: { n: 6, seg: 20, w: 8, sobe: 1.0 }, passo: 160, pata: 16, focinhoCor: '#E8C08A' },
    gato:     { perfil: { pts: [[-0.75, -0.42], [-0.2, -0.84], [0.45, -0.7], [0.85, -0.32], [1.04, -0.04], [1.0, 0.14], [0.86, 0.25], [0.66, 0.32], [0.66, 0.45], [0.35, 0.58], [-0.2, 0.6], [-0.75, 0.26]], pivo: [0.05, 0.3], olho: [0.48, -0.24], olhoTam: 0.2, nariz: [0.98, -0.02], orelha: 'pontuda', orelhaP: [-0.05, -0.82], orelhaAlta: 0.6, almofada: [0.8, 0.12, 0.22, 0.15], corNariz: '#D98A9A', corOlho: '#9ACD4A' }, claro: '#A0A0A8', cor: '#8A8A92', longe: '#6E6E76', barriga: '#C9C9CF', comp: 130, frente: [56, 54], tras: [56, 45, 31], peito: [46, 44], anca: [42, 42], pescoco: [54, -46], cabeca: 40, focinho: [18, 13], orelha: 'pontuda', cauda: { n: 10, seg: 18, w: 6, sobe: 0.8 }, passo: 110, pata: 11, listras: true },
    cavalo:   { perfil: { pts: [[-0.55, -0.6], [0.05, -0.76], [0.8, -0.5], [1.7, -0.22], [2.2, -0.08], [2.32, 0.14], [2.2, 0.32], [1.9, 0.38], [1.8, 0.55], [1.2, 0.5], [0.4, 0.6], [-0.45, 0.4]], pivo: [0.4, 0.42], olho: [0.45, -0.36], olhoTam: 0.13, nariz: [2.18, 0.04], orelha: 'pontuda', orelhaP: [-0.1, -0.78], orelhaAlta: 0.75, ang: 42, corOlho: '#2A1A12' }, claro: '#A06C46', cintura: 0.95, cor: '#8A5A3A', longe: '#6E4428', barriga: '#A87850', comp: 280, frente: [148, 144], tras: [135, 117, 68], peito: [92, 84], anca: [90, 84], pescoco: [140, -130], cabeca: 50, focinho: [74, 30], orelha: 'pontuda', cauda: { n: 7, seg: 24, w: 12, crina: true, sobe: -0.6 }, crina: '#2A1A12', passo: 260, pata: 18, casco: '#2A2A30' }
  };

  class Animal {
    constructor(parent, opts = {}) {
      this.E = { ...(ESPECIES[opts.especie] || ESPECIES.leao), ...(opts.cores || {}) };
      // alturas de pé tiradas do comprimento das pernas (quase esticadas, como num animal parado)
      const E = this.E;
      E.quadril = E.quadril ?? ((E.tras[0] + E.tras[1]) * 0.84 + E.tras[2] * 0.94 + 16);
      E.ombro = E.ombro ?? ((E.frente[0] + E.frente[1]) * 0.94 + E.pata * 1.3 + 22);
      this.especie = opts.especie || 'leao'; this.E.especie = this.especie;
      this.s = opts.escala ?? 1;
      this.acoes = []; this.cabecas = [];
      const rnd = mulberry32(opts.seed ?? 5);
      this.piscadas = []; for (let t = 0.6 + rnd() * 2; t < 3600; t += 2.5 + rnd() * 3) this.piscadas.push(t);
      this.fase0 = rnd();
      this.g = document.createElementNS(NS, 'g'); parent.appendChild(this.g);
      const camada = () => { const c = document.createElementNS(NS, 'g'); c.setAttribute('filter', 'url(#outline)'); this.g.appendChild(c); return c; };
      this.longeG = camada(); this.corpoG = camada(); this.cabecaG = camada(); this.pertoG = camada();   // cada camada com contorno próprio (dá profundidade)
      this.uid = 'an' + (Animal._n = (Animal._n || 0) + 1);
      this.det = document.createElementNS(NS, 'g'); this.g.appendChild(this.det);
    }
    base(t0, t1, tipo, p = {}) { this.acoes.push({ t0, t1, tipo, p }); this.acoes.sort((a, b) => a.t0 - b.t0); return this; }
    cabeca(t0, t1, p) { this.cabecas.push({ t0, t1, p }); return this; }

    // ---------- pose do corpo num instante (sem transição) ----------
    poseDe(a, t) {
      const E = this.E, s = this.s, p = a.p;
      const dur = Math.max(0.001, a.t1 - a.t0), u = clamp((t - a.t0) / dur, 0, 1);
      let x, y, dir = p.dir ?? 1, mov = 0, tipo = a.tipo;
      if (p.de) { x = lerp(p.de[0], p.ate[0], u); y = lerp(p.de[1], p.ate[1], u); dir = p.dir ?? Math.sign((p.ate[0] - p.de[0]) || 1); mov = Math.abs(p.ate[0] - p.de[0]) * u; }
      else { x = p.x ?? 0; y = p.y ?? 0; }
      const G = { andar: { duty: 0.62, off: [0, 0.5, 0.25, 0.75], bob: 5, alt: 26 }, trotar: { duty: 0.5, off: [0, 0.5, 0.5, 0], bob: 8, alt: 40 }, correr: { duty: 0.36, off: [0, 0.08, 0.5, 0.6], bob: 22, alt: 60 } }[tipo];
      // pés (ordem: tras-perto, tras-longe, frente-perto, frente-longe) relativos ao centro do corpo
      const meio = E.comp / 2;
      const base = [[-meio + 6, 0], [-meio + 40, 0], [meio - 6, 0], [meio + 30, 0]].map(([fx, fy]) => [fx * s, fy]);
      const pose = { x, y, dir, tipo, vista: p.vista || 'perfil', inclina: 0, sobe: 0, pes: base.map(b => [b[0], 0]), fase: 0, corre: 0, abaixa: 0, cauda: 0.3, respira: Math.sin(t * 2 * Math.PI / 3.2) };
      if (G) {
        const passo = (p.passo ?? E.passo) * s * (tipo === 'correr' ? 1.9 : tipo === 'trotar' ? 1.25 : 1);
        const ciclo = passo / G.duty;
        const fase = ((mov / ciclo) + this.fase0) % 1;
        pose.fase = fase; pose.corre = tipo === 'correr' ? 1 : tipo === 'trotar' ? 0.5 : 0.2;
        pose.pes = base.map((b, i) => {
          const ph = (fase + G.off[i] + (i % 2 ? 0.02 : 0)) % 1;
          let rx, ry = 0;
          if (ph < G.duty) { const k = ph / G.duty; rx = b[0] + passo * (0.5 - k); }
          else { const k = (ph - G.duty) / (1 - G.duty); rx = b[0] + passo * (-0.5 + suave(k)); ry = -G.alt * s * Math.sin(Math.PI * k); }
          return [rx, ry];
        });
        pose.sobe = -G.bob * s * Math.abs(Math.sin(2 * Math.PI * fase)) * (tipo === 'andar' ? 0.5 : 1);
        if (tipo === 'correr') { pose.inclina = Math.sin(2 * Math.PI * fase) * 6; pose.estica = Math.sin(2 * Math.PI * fase); }
        pose.cauda = tipo === 'correr' ? 0.9 : 0.5;
      } else if (tipo === 'sentar') {
        pose.inclina = -32; pose.sentado = 1;
      } else if (tipo === 'deitado') {
        pose.deitado = 1; pose.cauda = 0.15;
      } else if (tipo === 'pular') {
        // agacha (antecipação) → salto em arco com as patas da frente esticadas → aterrissa
        const alvoX = p.ate ? p.ate[0] : x;
        const k = u;
        if (k < 0.25) { pose.abaixa = suave(k / 0.25) * 50 * s; pose.inclina = 4 * suave(k / 0.25); pose.x = p.de ? p.de[0] : x; }
        else if (k < 0.85) { const v = (k - 0.25) / 0.6; pose.x = lerp(p.de ? p.de[0] : x, alvoX, suave(v)); pose.sobe = -Math.sin(Math.PI * v) * (p.altura ?? 160) * s; pose.inclina = lerp(-14, 12, v); pose.voo = 1; }
        else { const v = (k - 0.85) / 0.15; pose.x = alvoX; pose.abaixa = (1 - v) * 40 * s; }
      } else {
        // parado: troca o peso devagar
        pose.peso = Math.sin(t * 2 * Math.PI / 5.5) * 3 * s;
      }
      return pose;
    }
    pose(t) {
      const lista = this.acoes; if (!lista.length) return null;
      let i = lista.findIndex(a => t >= a.t0 && t < a.t1); if (i < 0) i = t < lista[0].t0 ? 0 : lista.length - 1;
      const a = lista[i], P1 = this.poseDe(a, t), trans = a.p.transicao ?? 0.3;
      if (i > 0 && t - a.t0 < trans) {
        const P0 = this.poseDe(lista[i - 1], a.t0), u = suave((t - a.t0) / trans);
        const mix = (k) => lerp(P0[k] ?? 0, P1[k] ?? 0, u);
        const r = { ...P1 };
        ['x', 'y', 'inclina', 'sobe', 'abaixa', 'sentado', 'deitado', 'cauda'].forEach(k => { r[k] = mix(k); });
        r.pes = P1.pes.map((pp, j) => [lerp(P0.pes[j][0], pp[0], u), lerp(P0.pes[j][1], pp[1], u)]);
        return r;
      }
      return P1;
    }
    cabecaEm(t) {
      let r = { olhar: [0, 0], baixar: 0, rugir: 0 };
      for (const c of this.cabecas) {
        if (t < c.t0 - 0.25 || t > c.t1 + 0.35) continue;
        const ent = clamp((t - c.t0 + 0.25) / 0.25, 0, 1), sai = clamp((c.t1 + 0.35 - t) / 0.35, 0, 1), w = suave(Math.min(ent, sai));
        if (c.p.olhar) r.olhar = [lerp(r.olhar[0], c.p.olhar[0], w), lerp(r.olhar[1], c.p.olhar[1], w)];
        if (c.p.baixar != null) r.baixar = lerp(r.baixar, c.p.baixar, w);
        if (c.p.rugir) { const k = clamp((t - c.t0) / Math.max(0.2, c.t1 - c.t0), 0, 1); r.rugir = Math.max(r.rugir, w * (0.75 + 0.25 * Math.sin(k * Math.PI * 6))); r.rugindo = w; }
      }
      return r;
    }

    // ---------- desenho ----------
    desenhar(t) {
      const Q = this.pose(t); if (!Q) return;
      if (Q.vista === 'frente') return this.desenharFrente(t, Q, this.cabecaEm(t));
      const E = this.E, s = this.s, dir = Q.dir, X = v => Q.x + v * dir;   // coordenada local → mundo (local +x = para a frente)
      const C = this.cabecaEm(t);
      const chao = Q.y;
      const respira = (Q.respira || 0) * 2.5 * s;
      // espinha: anca (H) e ombro (S)
      let hY = chao - E.quadril * s - (Q.sobe || 0) * -1, sY = chao - E.ombro * s;
      hY = chao - E.quadril * s + (Q.sobe || 0) + (Q.abaixa || 0) * 0.9; sY = chao - E.ombro * s + (Q.sobe || 0) + (Q.abaixa || 0);
      const meio = E.comp / 2 * s;
      let H = [-meio, hY], S = [meio, sY];
      if (Q.sentado) { H = [lerp(-meio, -meio + 20 * s, Q.sentado), lerp(hY, chao - E.anca[1] * s * 0.9, Q.sentado)]; S = [lerp(meio, meio - 40 * s, Q.sentado), lerp(sY, sY - 40 * s, Q.sentado)]; }
      if (Q.deitado) { H = [H[0], lerp(H[1], chao - E.anca[1] * s * 0.95, Q.deitado)]; S = [S[0], lerp(S[1], chao - E.peito[1] * s * 0.95, Q.deitado)]; }
      const inc = (Q.inclina || 0) * Math.PI / 180;
      const rot = (p, c) => { const dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(inc) - dy * Math.sin(inc) * -1, c[1] + dx * Math.sin(-inc) + dy * Math.cos(inc)]; };
      const meioC = [(H[0] + S[0]) / 2, (H[1] + S[1]) / 2];
      if (inc) { H = rot(H, meioC); S = rot(S, meioC); }
      if (Q.peso) { H[1] += Q.peso * 0.3; S[1] -= Q.peso * 0.3; }
      const W = p => [X(p[0]), p[1]];   // local → mundo
      // pés no mundo
      const pes = Q.pes.map(([px, py]) => [px, chao + py]);
      if (Q.sentado) { pes[0] = [lerp(pes[0][0], -meio + 70 * s, Q.sentado), chao]; pes[1] = [lerp(pes[1][0], -meio + 90 * s, Q.sentado), chao]; }
      if (Q.deitado) { pes[2] = [lerp(pes[2][0], meio + 90 * s, Q.deitado), chao]; pes[3] = [lerp(pes[3][0], meio + 110 * s, Q.deitado), chao]; pes[0] = [lerp(pes[0][0], -meio + 60 * s, Q.deitado), chao]; pes[1] = [lerp(pes[1][0], -meio + 80 * s, Q.deitado), chao]; }
      if (Q.voo) { pes[2] = [meio + 120 * s, sY + 40 * s]; pes[3] = [meio + 135 * s, sY + 30 * s]; pes[0] = [-meio - 90 * s, hY + 70 * s]; pes[1] = [-meio - 70 * s, hY + 80 * s]; }
      // pernas: frente (ombro→cotovelo para trás→pata), trás (quadril→soldra para frente→jarrete→pata)
      const [fa, fb] = E.frente.map(v => v * s), [ta, tb, tc] = E.tras.map(v => v * s);
      const perna = (i) => {
        const tras = i < 2, raiz = tras ? [H[0] + (i ? 10 * s : 0), H[1] + 16 * s] : [S[0] + (i === 3 ? 10 * s : 0), S[1] + 22 * s];
        const pe = pes[i];
        if (tras) {
          const levantado = pe[1] < chao - 1;
          const jarrete = [pe[0] - tc * 0.32 + (levantado ? -tc * 0.25 : 0), pe[1] - tc * 0.94 + (levantado ? tc * 0.2 : 0)];
          const joelho = ik2(raiz, jarrete, ta, tb, 1, 1);
          return { pts: [raiz, joelho, jarrete, pe], larg: [E.anca[0] * 0.55 * s, 20 * s, 14 * s] };
        }
        const levantado = pe[1] < chao - 1;
        const pulso = [pe[0] - (levantado ? 22 * s : 4 * s), pe[1] - E.pata * s * 1.3 + (levantado ? 6 * s : 0)];
        const cotovelo = ik2(raiz, pulso, fa, fb, -1, 1);
        return { pts: [raiz, cotovelo, pulso, pe], larg: [E.peito[0] * 0.42 * s, 18 * s, 14 * s] };
      };
      const L = [0, 1, 2, 3].map(perna);
      const T = '#1D1D2B', id = this.uid;
      // ---- formas com volume ----
      // segmento afinando (coxa → canela): lados levemente curvos (músculo) e juntas redondas
      const seg = (a, b, wa, wb, cor, bojo = 0.18) => {
        const A = W(a), B = W(b), dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
        const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], wm = (wa + wb) / 2 * (1 + bojo);
        return `<path d="M${P([A[0] + nx * wa / 2, A[1] + ny * wa / 2])} Q${P([m[0] + nx * wm / 2, m[1] + ny * wm / 2])} ${P([B[0] + nx * wb / 2, B[1] + ny * wb / 2])} L${P([B[0] - nx * wb / 2, B[1] - ny * wb / 2])} Q${P([m[0] - nx * wm / 2, m[1] - ny * wm / 2])} ${P([A[0] - nx * wa / 2, A[1] - ny * wa / 2])}Z" fill="${cor}"/><circle cx="${f(A[0])}" cy="${f(A[1])}" r="${f(wa / 2)}" fill="${cor}"/><circle cx="${f(B[0])}" cy="${f(B[1])}" r="${f(wb / 2)}" fill="${cor}"/>`;
      };
      // curva fechada suave passando pelos pontos (Catmull-Rom → Bézier)
      const curva = (pts, fechar = true) => {
        const n = pts.length; let d = `M${P(pts[0])}`;
        for (let i = 0; i < (fechar ? n : n - 1); i++) {
          const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
          d += ` C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`;
        }
        return d + (fechar ? 'Z' : '');
      };
      const LW = E.largura || {};
      const wF = (LW.frente || [0.66, 0.4, 0.28, 0.3]).map(v => v * E.peito[0] * s), wT = (LW.tras || [0.86, 0.44, 0.27, 0.28]).map(v => v * E.anca[0] * s);
      const pernaSVG = (l, i, cor) => {
        const w = i < 2 ? wT : wF, [a, b, c, p] = l.pts;
        let h = seg(a, b, w[0], w[1], cor, 0.25) + seg(b, c, w[1], w[2], cor, 0.08) + seg(c, p, w[2], w[3], cor, 0.05);
        const pe = W([p[0] + E.pata * 0.35 * s, p[1] - E.pata * 0.32 * s]);
        if (E.casco) h += `<path d="M${P([pe[0] - E.pata * s * 0.8, pe[1] - E.pata * s * 0.2])} L${P([pe[0] + E.pata * s * 0.8, pe[1] - E.pata * s * 0.2])} L${P([pe[0] + E.pata * s * 0.95, p[1]])} L${P([pe[0] - E.pata * s * 0.9, p[1]])}Z" fill="${E.casco}"/>`;
        else h += `<ellipse cx="${f(pe[0])}" cy="${f(pe[1])}" rx="${f(E.pata * s * 1.1)}" ry="${f(E.pata * s * 0.62)}" fill="${cor}"/>`;
        return h;
      };
      // ---- cauda afinando ----
      let cauda = '', ponta;
      { let p = [H[0] - E.anca[0] * 0.78 * s, H[1] - E.anca[1] * 0.5 * s], ang = Math.PI + (E.cauda.sobe || 0) * -0.6 - (Q.sentado ? 0.6 : 0);
        const pts = [p];
        for (let k = 0; k < E.cauda.n; k++) {
          const onda = Math.sin(t * (Q.corre ? 9 : 2.4) - k * 0.55) * (0.12 + 0.2 * (Q.cauda || 0.3)) * (k / E.cauda.n + 0.3);
          ang += (E.cauda.sobe < 0 ? 0.1 : -0.12 * (E.cauda.sobe || 0.3)) + onda + (Q.deitado ? 0.05 : 0);
          p = [p[0] + Math.cos(ang) * E.cauda.seg * s, p[1] + Math.sin(ang) * E.cauda.seg * s]; pts.push(p);
        }
        ponta = p;
        if (E.cauda.crina) { const d = pts.map((q, k) => (k ? 'L' : 'M') + P(W(q))).join(' '); cauda = `<path d="${d}" stroke="${E.crina}" stroke-width="${f(E.cauda.w * 3 * s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${E.crina}" stroke-width="${f(E.cauda.w * 1.6 * s)}" fill="none" stroke-linecap="round" transform="translate(${f(-dir * 8 * s)} ${f(14 * s)})"/>`; }
        else for (let k = 0; k < pts.length - 1; k++) { const w = E.cauda.w * s * (1.5 - 0.9 * k / pts.length); cauda += seg(pts[k], pts[k + 1], w, w * 0.92, E.cor, 0); }
        if (E.cauda.tufo) cauda += `<path d="${curva([...Array(7)].map((_, k) => { const a = k / 7 * Math.PI * 2, rr = (k % 2 ? 12 : 17) * s; return W([p[0] + Math.cos(a) * rr * 1.3 - 8 * s, p[1] + Math.sin(a) * rr]); }))}" fill="${E.cauda.tufo}"/>`;
      }
      // ---- cabeça (perfil desenhado por espécie, em unidades do raio r) ----
      const pesc = [S[0] + E.pescoco[0] * s * 0.35, S[1] - E.peito[1] * 0.35 * s];
      const avanco = C.rugir * 26 * s, baixa = (C.baixar || 0) * s + (Q.tipo === 'andar' ? Math.sin(2 * Math.PI * Q.fase * 2) * 4 * s : 0);
      const Hc = [S[0] + E.pescoco[0] * s + avanco, S[1] + E.pescoco[1] * s - C.rugir * 10 * s + baixa + (Q.deitado ? 30 * s * Q.deitado : 0) - (Q.sentado ? 20 * s : 0)];
      const r = E.cabeca * s, CB = E.perfil;
      const angC = ((CB.ang || 0) - C.rugir * 12 + (C.baixar || 0) * 1.2) * Math.PI / 180;
      const hp = ([u, v]) => W([Hc[0] + (u * Math.cos(angC) - v * Math.sin(angC)) * r, Hc[1] + (u * Math.sin(angC) + v * Math.cos(angC)) * r]);   // cabeça (unidades de r) → mundo
      const jaw = C.rugir * 0.85;
      const piv = CB.pivo;
      const jp = ([u, v]) => { const du = u - piv[0], dv = v - piv[1]; return hp([piv[0] + du * Math.cos(jaw) - dv * Math.sin(jaw), piv[1] + du * Math.sin(jaw) + dv * Math.cos(jaw)]); };
      const prof = CB.pts, mc = 7;
      const sup = [...prof.slice(11), ...prof.slice(0, mc + 1)].map(hp), inf = prof.slice(mc, 12).map(jp);
      // ---- corpo: uma silhueta só, com peito fundo, cintura e anca ----
      const [pr, pry] = E.peito.map(v => v * s), [ar, ary] = E.anca.map(v => v * s);
      const mid = [(H[0] + S[0]) / 2, (H[1] + S[1]) / 2], tuck = E.cintura ?? 0.82, resp = (Q.respira || 0) * 2 * s;
      const corpoPts = [
        [S[0] - 0.2 * pr, S[1] - 0.98 * pry], [mid[0], mid[1] - (pry + ary) / 2 * 0.86], [H[0] + 0.2 * ar, H[1] - 1.0 * ary],
        [H[0] - 0.75 * ar, H[1] - 0.62 * ary], [H[0] - 1.0 * ar, H[1] + 0.05 * ary], [H[0] - 0.55 * ar, H[1] + 0.8 * ary],
        [H[0] + 0.6 * ar, H[1] + 0.62 * ary * tuck], [mid[0] + 0.1 * pr, mid[1] + (pry + ary) / 2 * 0.62 * tuck + resp], [S[0] - 0.05 * pr, S[1] + 1.0 * pry + resp],
        [S[0] + 0.78 * pr, S[1] + 0.42 * pry]
      ].map(W).concat([hp([-0.1, 0.72]), hp([-0.62, -0.42])]);
      // ---- defs (gradiente de luz de cima) ----
      let g = `<defs><linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${E.claro || E.cor}"/><stop offset=".5" stop-color="${E.cor}"/><stop offset=".82" stop-color="${E.barriga}"/><stop offset="1" stop-color="${E.barriga}"/></linearGradient>
        <radialGradient id="${id}j" cx=".55" cy=".45" r=".6"><stop offset="0" stop-color="${E.juba || E.cor}"/><stop offset="1" stop-color="${E.jubaLonge || E.cor}"/></radialGradient></defs>`;
      // camada de longe: pernas do outro lado (mais escuras) e cauda
      let longe = pernaSVG(L[1], 1, E.longe) + pernaSVG(L[3], 3, E.longe) + cauda;
      // camada do corpo + cabeça
      let corpo = '';
      corpo += `<path d="${curva(corpoPts)}" fill="url(#${id}c)"/>`;
      if (E.corcova) corpo += `<ellipse cx="${f(X(S[0] - 0.1 * pr))}" cy="${f(S[1] - 0.85 * pry)}" rx="${f(0.75 * pr)}" ry="${f(0.42 * pry)}" fill="${E.claro || E.cor}"/>`;
      if (E.crina) corpo += `<path d="${curva([hp([-0.55, -0.62]), W([(S[0] + Hc[0]) / 2 - 20 * s, (S[1] + Hc[1]) / 2 - 34 * s]), W([S[0] - 0.25 * pr, S[1] - 1.05 * pry]), W([S[0] - 0.1 * pr, S[1] - 0.8 * pry]), W([(S[0] + Hc[0]) / 2, (S[1] + Hc[1]) / 2 - 12 * s]), hp([-0.3, -0.45])])}" fill="${E.crina}"/>`;
      let cab = '';
      if (E.juba) {   // juba de lado: UMA massa de pelo que sai da testa, cobre o alto da cabeça, a nuca, o pescoço, o ombro e o peito; o rosto fica para fora
        const cres = 1 + 0.08 * C.rugir;
        const chave = [   // contorno de fora (cabeça em unidades de r; corpo em pontos do mundo)
          hp([0.5, -0.8]), hp([0.15, -1.22 * cres]), hp([-0.5, -1.38 * cres]), hp([-1.15, -1.12 * cres]), hp([-1.55, -0.45 * cres]),
          W([S[0] - 0.62 * pr, S[1] - 0.92 * pry]), W([S[0] - 0.72 * pr, S[1] - 0.2 * pry]), W([S[0] - 0.4 * pr, S[1] + 0.6 * pry]),
          W([S[0] + 0.25 * pr, S[1] + 1.02 * pry]), W([S[0] + 0.85 * pr, S[1] + 0.62 * pry]), hp([0.55, 1.15 * cres]), hp([0.7, 0.72])
        ];
        // borda ondulada e fofa: densifica o contorno e alterna pequenas saliências arredondadas (animadas)
        const cen = hp([-0.5, 0.25]);
        const ond = [];
        for (let i = 0; i < chave.length - 1; i++) {
          const A0 = chave[i], A1 = chave[i + 1];
          for (let k = 0; k < 3; k++) {
            const u = k / 3, q = [lerp(A0[0], A1[0], u), lerp(A0[1], A1[1], u)];
            const dx = q[0] - cen[0], dy = q[1] - cen[1], dd = Math.hypot(dx, dy) || 1, n = ond.length;
            const amp = (n % 2 ? -0.01 : 0.09) * r * (1 + 0.6 * Math.sin(t * 4 - n * 0.9) * (0.25 + C.rugir));
            ond.push([q[0] + dx / dd * amp, q[1] + dy / dd * amp]);
          }
        }
        ond.push(chave[chave.length - 1]);
        // borda de dentro (fica escondida atrás do rosto)
        [[0.25, 0.4], [-0.1, 0.0], [0.15, -0.5]].forEach(q => ond.push(hp(q)));
        cab += `<defs><radialGradient id="${id}jm" gradientUnits="userSpaceOnUse" cx="${f(hp([0.2, 0])[0])}" cy="${f(hp([0.2, 0])[1])}" r="${f(r * 2.6)}"><stop offset="0" stop-color="${E.jubaClara || '#B8692E'}"/><stop offset=".55" stop-color="${E.juba}"/><stop offset="1" stop-color="${E.jubaLonge}"/></radialGradient></defs>`;
        cab += `<path d="${curva(ond)}" fill="url(#${id}jm)"/>`;
        this._jubaMechas = [];   // mechas: da borda do rosto para fora, seguindo o pelo (para trás e para baixo)
        for (let k = 0; k < 16; k++) {
          const a = (-80 - k * 13) * Math.PI / 180, bal = Math.sin(t * 4 - k * 0.6) * (0.04 + 0.12 * C.rugir);
          const ini = hp([0.05 + Math.cos(a) * 0.95, 0.1 + Math.sin(a) * 0.95]), fim = hp([-0.15 + Math.cos(a + bal) * 1.45, 0.15 + Math.sin(a + bal) * 1.4]);
          this._jubaMechas.push([ini, fim]);
        }
        for (let k = 0; k < 7; k++) { const u = k / 6, ini = W([lerp(S[0] + 0.5 * pr, S[0] - 0.4 * pr, u), lerp(S[1] - 0.3 * pry, S[1] + 0.2 * pry, u)]); this._jubaMechas.push([ini, [ini[0] - dir * 18 * s, ini[1] + 34 * s]]); }
      }
      // orelha de trás da cabeça (atrás do crânio)
      const ore = CB.orelha, oP = CB.orelhaP;
      if (ore === 'redonda') cab += `<circle cx="${f(hp(oP)[0])}" cy="${f(hp(oP)[1])}" r="${f(r * 0.3)}" fill="${E.cor}"/>`;
      else if (ore === 'pontuda') cab += `<path d="M${P(hp([oP[0] - 0.28, oP[1] + 0.3]))} L${P(hp([oP[0] + 0.02, oP[1] - (CB.orelhaAlta || 0.5)]))} L${P(hp([oP[0] + 0.3, oP[1] + 0.28]))}Z" fill="${E.cor}"/>`;
      // boca aberta: interior escuro + dentes, por baixo da cabeça
      if (jaw > 0.02) cab += `<path d="M${P(hp(prof[mc]))} L${P(hp([prof[4][0] - 0.05, prof[5][1]]))} L${P(jp([prof[6][0], prof[6][1] + 0.05]))} L${P(jp(prof[9]))} L${P(hp(piv))}Z" fill="#6E1414"/>`;
      cab += `<path d="${curva(inf.concat([hp(piv)]))}" fill="${E.focinhoCor || E.cor}"/>`;
      cab += `<path d="${curva(sup)}" fill="${E.cor}"/>`;
      if (ore === 'caida') cab += `<path d="${curva([hp([oP[0] - 0.1, oP[1]]), hp([oP[0] - 0.55, oP[1] + 0.45]), hp([oP[0] - 0.35, oP[1] + 1.15]), hp([oP[0] + 0.15, oP[1] + 0.5])])}" fill="${E.longe}"/>`;
      // camada de perto: pernas deste lado (com contorno próprio, por cima do corpo)
      let perto = pernaSVG(L[0], 0, E.cor) + pernaSVG(L[2], 2, E.cor);
      this.longeG.innerHTML = longe; this.corpoG.innerHTML = g + corpo; this.cabecaG.innerHTML = cab; this.pertoG.innerHTML = perto;
      // ---------- detalhes sem contorno ----------
      let d = '';
      // músculo do ombro e da coxa, luz nas costas, barriga
      d += `<path d="M${P(W([S[0] - 0.55 * pr, S[1] - 0.5 * pry]))} Q${P(W([S[0] + 0.15 * pr, S[1] - 0.2 * pry]))} ${P(W([S[0] + 0.05 * pr, S[1] + 0.5 * pry]))}" stroke="${E.longe}" stroke-width="${f(3.5 * s)}" fill="none" opacity=".45" stroke-linecap="round"/>`;
      d += `<path d="M${P(W([H[0] + 0.45 * ar, H[1] - 0.55 * ary]))} Q${P(W([H[0] - 0.35 * ar, H[1] - 0.2 * ary]))} ${P(W([H[0] - 0.15 * ar, H[1] + 0.6 * ary]))}" stroke="${E.longe}" stroke-width="${f(3.5 * s)}" fill="none" opacity=".45" stroke-linecap="round"/>`;
      d += `<path d="M${P(W([H[0] + 0.1 * ar, H[1] - 0.82 * ary]))} Q${P(W([mid[0], mid[1] - (pry + ary) / 2 * 0.74]))} ${P(W([S[0] - 0.25 * pr, S[1] - 0.84 * pry]))}" stroke="#FFFFFF" stroke-width="${f(5 * s)}" fill="none" opacity=".28" stroke-linecap="round"/>`;
      if (E.listras) for (let k = 0; k < 6; k++) { const u = 0.08 + k * 0.16, px = lerp(H[0], S[0], u), py = lerp(H[1], S[1], u) - pry * 0.95; d += `<path d="M${P(W([px, py]))} q${f(dir * 8 * s)} ${f(14 * s)} ${f(-dir * 2 * s)} ${f(30 * s)}" stroke="${E.longe}" stroke-width="${f(6 * s)}" fill="none" stroke-linecap="round"/>`; }
      // dedos nas patas de perto
      if (!E.casco) [L[0], L[2]].forEach(l => { const p = l.pts[3], pe = W([p[0] + E.pata * 0.35 * s, p[1] - E.pata * 0.32 * s]); d += [-0.35, 0.1, 0.55].map(k => `<path d="M${f(pe[0] + dir * k * E.pata * s)} ${f(pe[1] + E.pata * 0.15 * s)} v${f(E.pata * 0.4 * s)}" stroke="${T}" stroke-width="${f(2 * s)}" stroke-linecap="round" opacity=".6"/>`).join('') + (E.garras ? [0, 0.45, 0.9].map(k => `<path d="M${f(pe[0] + dir * (k + 0.3) * E.pata * s)} ${f(p[1] - 2 * s)} l${f(dir * 6 * s)} ${f(4 * s)}" stroke="#F2EEE2" stroke-width="${f(3 * s)}" stroke-linecap="round"/>`).join('') : ''); });
      // rosto
      if (ore === 'redonda') d += `<circle cx="${f(hp(oP)[0])}" cy="${f(hp(oP)[1])}" r="${f(r * 0.15)}" fill="${E.longe}"/>`;
      if (ore === 'pontuda') d += `<path d="M${P(hp([oP[0] - 0.13, oP[1] + 0.18]))} L${P(hp([oP[0] + 0.02, oP[1] - (CB.orelhaAlta || 0.5) * 0.6]))} L${P(hp([oP[0] + 0.15, oP[1] + 0.16]))}Z" fill="#E8A0A0"/>`;
      if (CB.almofada) { const [u, v, a, b] = CB.almofada; const c = hp([u, v]); d += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(a * r)}" ry="${f(b * r)}" fill="${E.focinhoCor || E.barriga}" opacity=".85" transform="rotate(${f(angC * 57.3 * dir)} ${f(c[0])} ${f(c[1])})"/>`; [0, 1, 2].forEach(k => { const q = hp([u + 0.05 + k * 0.08, v + 0.02 + (k % 2) * 0.06]); d += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(1.6 * s)}" fill="${T}" opacity=".7"/>`; }); }
      const nz = hp(CB.nariz);
      d += `<path d="M${P([nz[0] - dir * r * 0.14, nz[1] - r * 0.06])} Q${P([nz[0] + dir * r * 0.06, nz[1] - r * 0.12])} ${P([nz[0] + dir * r * 0.06, nz[1] + r * 0.02])} Q${P([nz[0] - dir * r * 0.02, nz[1] + r * 0.12])} ${P([nz[0] - dir * r * 0.14, nz[1] - r * 0.06])}Z" fill="${CB.corNariz || T}"/>`;
      if (jaw < 0.05) d += `<path d="M${P([nz[0] - dir * r * 0.04, nz[1] + r * 0.05])} Q${P(hp([CB.nariz[0] - 0.05, prof[mc][1] - 0.02]))} ${P(hp(prof[mc]))}" stroke="${T}" stroke-width="${f(3 * s)}" fill="none" stroke-linecap="round"/>`;
      else { const dt = (a, b2) => `<path d="M${P(a)} L${P([a[0] + dir * 2 * s, a[1] + b2])} L${P([a[0] + dir * 7 * s, a[1]])}Z" fill="#FFF" stroke="${T}" stroke-width="${f(1.4 * s)}"/>`; d += dt(hp([prof[5][0] - 0.12, prof[5][1] + 0.02]), 10 * s) + dt(jp([prof[8][0] + 0.05, prof[8][1] - 0.12]), -10 * s); }
      const pisca = this.piscadas.some(p => t >= p && t < p + 0.13);
      const ol = hp([CB.olho[0] + C.olhar[0] * 0.01, CB.olho[1] + C.olhar[1] * 0.01]), ow = (CB.olhoTam || 0.15) * r;
      if (pisca || C.rugir > 0.6) d += `<path d="M${P([ol[0] - ow, ol[1]])} q${f(ow)} ${f(ow * 0.5)} ${f(ow * 2)} 0" stroke="${T}" stroke-width="${f(3.5 * s)}" fill="none" stroke-linecap="round"/>`;
      else d += `<path d="M${P([ol[0] - ow, ol[1]])} Q${P([ol[0], ol[1] - ow * 0.9])} ${P([ol[0] + ow, ol[1]])} Q${P([ol[0], ol[1] + ow * 0.8])} ${P([ol[0] - ow, ol[1]])}Z" fill="${CB.corOlho || '#F2D27A'}" stroke="${T}" stroke-width="${f(2.5 * s)}"/><circle cx="${f(ol[0] + dir * ow * 0.15)}" cy="${f(ol[1])}" r="${f(ow * 0.45)}" fill="${T}"/><circle cx="${f(ol[0])}" cy="${f(ol[1] - ow * 0.25)}" r="${f(ow * 0.18)}" fill="#FFF"/>`;
      d += `<path d="M${P([ol[0] - dir * ow * 1.2, ol[1] - ow * (1.1 - C.rugir * 0.2)])} Q${P([ol[0], ol[1] - ow * (1.5 - C.rugir)])} ${P([ol[0] + dir * ow * 1.3, ol[1] - ow * (0.9 - C.rugir * 0.6)])}" stroke="${T}" stroke-width="${f(3 * s)}" fill="none" stroke-linecap="round"/>`;
      if (E.juba && this._jubaMechas) d += this._jubaMechas.map(([p0, p1], k) => `<path d="M${P(p0)} Q${P([(p0[0] + p1[0]) / 2 + dir * 4 * s, (p0[1] + p1[1]) / 2 + 6 * s])} ${P(p1)}" stroke="${k % 3 ? E.jubaLonge : '#C8783A'}" stroke-width="${f(3 * s)}" fill="none" opacity=".55" stroke-linecap="round"/>`).join('');
      this.det.innerHTML = d;
      this._boca = hp(prof[5]);
    }
    // ---------- vista de frente (parado/sentado olhando para a câmera): juba redonda em volta do rosto ----------
    desenharFrente(t, Q, C) {
      const E = this.E, s = this.s, id = this.uid, T = '#1D1D2B', x = Q.x, chao = Q.y;
      const f2 = v => f(v), pt = (a, b) => `${f(a)} ${f(b)}`;
      const [pr, pry] = E.peito.map(v => v * s), [ar, ary] = E.anca.map(v => v * s), r = E.cabeca * s * (E.especie === 'cavalo' ? 1 : 1);
      const resp = 1 + 0.02 * (Q.respira || 0), sh = E.ombro * s, hq = E.quadril * s;
      const wF = (E.largura?.frente || [0.66, 0.4, 0.28, 0.3]).map(v => v * pr);
      const seg = (a, b, wa, wb, cor) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d; return `<path d="M${pt(a[0] + nx * wa / 2, a[1] + ny * wa / 2)} L${pt(b[0] + nx * wb / 2, b[1] + ny * wb / 2)} L${pt(b[0] - nx * wb / 2, b[1] - ny * wb / 2)} L${pt(a[0] - nx * wa / 2, a[1] - ny * wa / 2)}Z" fill="${cor}"/><circle cx="${f(b[0])}" cy="${f(b[1])}" r="${f(wb / 2)}" fill="${cor}"/>`; };
      const sent = Q.tipo === 'sentar';
      let longe = '', corpo = '', cab = '', perto = '', d = '';
      // ancas atrás, patas de trás aparecendo dos lados, rabo caindo para um lado
      const hy = sent ? chao - ary * 0.9 : chao - hq;
      longe += `<ellipse cx="${f(x)}" cy="${f(hy)}" rx="${f(ar * 1.05)}" ry="${f(ary * 0.9)}" fill="${E.longe}"/>`;
      [-1, 1].forEach(sd => { longe += seg([x + sd * ar * 0.6, hy + ary * 0.3], [x + sd * ar * (sent ? 0.95 : 0.7), chao - E.pata * s * 0.4], ar * 0.55, ar * 0.26, E.longe) + `<ellipse cx="${f(x + sd * ar * (sent ? 1.0 : 0.72))}" cy="${f(chao - E.pata * s * 0.35)}" rx="${f(E.pata * s)}" ry="${f(E.pata * s * 0.55)}" fill="${E.longe}"/>`; });
      { const bal = Math.sin(t * 2.2) * 10 * s; longe += `<path d="M${pt(x + ar * 0.7, hy)} Q${pt(x + ar * 1.6 + bal, chao - ary * 0.6)} ${pt(x + ar * 1.25 + bal, chao - 8 * s)}" stroke="${E.crina || E.cor}" stroke-width="${f(E.cauda.w * s * (E.cauda.crina ? 3 : 1.3))}" fill="none" stroke-linecap="round"/>` + (E.cauda.tufo ? `<ellipse cx="${f(x + ar * 1.25 + bal)}" cy="${f(chao - 12 * s)}" rx="${f(14 * s)}" ry="${f(11 * s)}" fill="${E.cauda.tufo}"/>` : ''); }
      // peito
      const cy = chao - sh + pry * 0.15;
      corpo += `<defs><linearGradient id="${id}fc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${E.claro || E.cor}"/><stop offset=".55" stop-color="${E.cor}"/><stop offset="1" stop-color="${E.barriga}"/></linearGradient><radialGradient id="${id}fj" cx=".5" cy=".45" r=".55"><stop offset=".5" stop-color="${E.juba || E.cor}"/><stop offset="1" stop-color="${E.jubaLonge || E.cor}"/></radialGradient></defs>`;
      corpo += `<ellipse cx="${f(x)}" cy="${f(cy)}" rx="${f(pr * 0.95)}" ry="${f(pry * 1.12 * resp)}" fill="url(#${id}fc)"/>`;
      // patas da frente (colunas que afinam)
      [-1, 1].forEach(sd => { const top = [x + sd * pr * 0.52, cy + pry * 0.25], pe = [x + sd * pr * 0.46, chao - E.pata * s * 0.5]; perto += seg(top, [top[0] + sd * 2 * s, (top[1] + pe[1]) / 2], wF[0] * 0.68, wF[1] * 0.95, E.cor) + seg([top[0] + sd * 2 * s, (top[1] + pe[1]) / 2], pe, wF[1] * 0.95, wF[2] * 1.1, E.cor) + `<ellipse cx="${f(pe[0])}" cy="${f(chao - E.pata * s * 0.35)}" rx="${f(E.pata * s * 0.95)}" ry="${f(E.pata * s * 0.6)}" fill="${E.casco || E.cor}"/>`;
        if (!E.casco) d += [-0.4, 0, 0.4].map(k => `<path d="M${pt(pe[0] + k * E.pata * s, chao - E.pata * s * 0.2)} v${f(E.pata * 0.4 * s)}" stroke="${T}" stroke-width="${f(2 * s)}" opacity=".6" stroke-linecap="round"/>`).join(''); });
      // cabeça de frente
      const baixa = (C.baixar || 0) * s, Hf = [x + (C.olhar[0] || 0) * 0.5 * s, cy - pry * 1.1 - r * 0.55 + baixa - C.rugir * 6 * s];
      const cav = E.especie === 'cavalo', faceRy = cav ? r * 1.7 : r * 0.98;
      if (E.juba) {   // juba: círculo inteiro em volta do rosto, com mechas, balançando
        const nuv = (R, n, fase) => { let pts = []; for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * Math.PI * 2, bal = Math.sin(t * 5 + fase - k * 0.7) * (0.03 + 0.1 * C.rugir); const rr = R * (k % 2 ? 0.85 : 1.08) * (1 + bal); pts.push([Hf[0] + Math.cos(a) * rr, Hf[1] + 0.12 * r + Math.sin(a) * rr * 1.05]); } return pts; };
        const c = nuv(r * 1.62, 11, 0);
        let dd = `M${pt(...c[0])}`; c.forEach((q, k) => { const n = c[(k + 1) % c.length]; dd += ` Q${pt(q[0], q[1])} ${pt((q[0] + n[0]) / 2, (q[1] + n[1]) / 2)}`; });
        cab += `<path d="${dd}Z" fill="url(#${id}fj)"/>`;
        d += [...Array(22)].map((_, k) => { const a = k / 22 * Math.PI * 2; return `<path d="M${pt(Hf[0] + Math.cos(a) * r * 1.0, Hf[1] + 0.12 * r + Math.sin(a) * r * 1.05)} L${pt(Hf[0] + Math.cos(a) * r * 1.5, Hf[1] + 0.12 * r + Math.sin(a) * r * 1.55)}" stroke="${E.jubaLonge}" stroke-width="${f(2.5 * s)}" opacity=".55" stroke-linecap="round"/>`; }).join('');
      }
      if (E.crina) cab += `<path d="M${pt(Hf[0] - r * 0.35, Hf[1] - faceRy * 0.9)} Q${pt(Hf[0], Hf[1] - faceRy * 1.25)} ${pt(Hf[0] + r * 0.35, Hf[1] - faceRy * 0.9)} Z" fill="${E.crina}"/>`;
      // orelhas
      const ore = E.perfil.orelha;
      [-1, 1].forEach(sd => {
        const ox = Hf[0] + sd * r * 0.72, oy = Hf[1] - faceRy * 0.72;
        if (ore === 'redonda') { cab += `<circle cx="${f(ox)}" cy="${f(oy)}" r="${f(r * 0.3)}" fill="${E.cor}"/>`; d += `<circle cx="${f(ox)}" cy="${f(oy)}" r="${f(r * 0.15)}" fill="${E.longe}"/>`; }
        else if (ore === 'pontuda') { const h = (E.perfil.orelhaAlta || 0.5) * r; cab += `<path d="M${pt(ox - sd * r * 0.3, oy + r * 0.2)} L${pt(ox + sd * r * 0.05, oy - h)} L${pt(ox + sd * r * 0.3, oy + r * 0.25)}Z" fill="${E.cor}"/>`; d += `<path d="M${pt(ox - sd * r * 0.14, oy + r * 0.12)} L${pt(ox + sd * r * 0.04, oy - h * 0.6)} L${pt(ox + sd * r * 0.16, oy + r * 0.14)}Z" fill="#E8A0A0"/>`; }
      });
      // rosto
      cab += `<ellipse cx="${f(Hf[0])}" cy="${f(Hf[1])}" rx="${f(r * (cav ? 0.7 : 0.95))}" ry="${f(faceRy)}" fill="${E.cor}"/>`;
      if (ore === 'caida') [-1, 1].forEach(sd => { cab += `<path d="M${pt(Hf[0] + sd * r * 0.55, Hf[1] - r * 0.7)} Q${pt(Hf[0] + sd * r * 1.25, Hf[1] - r * 0.3)} ${pt(Hf[0] + sd * r * 0.95, Hf[1] + r * 0.5)} Q${pt(Hf[0] + sd * r * 0.7, Hf[1])} ${pt(Hf[0] + sd * r * 0.55, Hf[1] - r * 0.7)}Z" fill="${E.longe}"/>`; });
      const fz = [Hf[0], Hf[1] + faceRy * (cav ? 0.55 : 0.38)];
      if (C.rugir > 0.05) cab += `<ellipse cx="${f(fz[0])}" cy="${f(fz[1] + r * 0.3)}" rx="${f(r * 0.32)}" ry="${f(r * 0.38 * C.rugir)}" fill="#6E1414"/>`;
      cab += `<ellipse cx="${f(fz[0])}" cy="${f(fz[1])}" rx="${f(r * (cav ? 0.55 : 0.5))}" ry="${f(r * 0.34)}" fill="${E.focinhoCor || E.barriga}"/>`;
      // detalhes do rosto
      d += `<path d="M${pt(fz[0] - r * 0.17, fz[1] - r * 0.2)} H${f(fz[0] + r * 0.17)} L${pt(fz[0], fz[1] - r * 0.02)}Z" fill="${E.perfil.corNariz || T}"/>`;
      if (C.rugir < 0.05) d += `<path d="M${pt(fz[0], fz[1] - r * 0.02)} V${f(fz[1] + r * 0.12)} M${pt(fz[0] - r * 0.2, fz[1] + r * 0.18)} Q${pt(fz[0] - r * 0.1, fz[1] + r * 0.24)} ${pt(fz[0], fz[1] + r * 0.12)} Q${pt(fz[0] + r * 0.1, fz[1] + r * 0.24)} ${pt(fz[0] + r * 0.2, fz[1] + r * 0.18)}" stroke="${T}" stroke-width="${f(3 * s)}" fill="none" stroke-linecap="round"/>`;
      else d += [-1, 1].map(sd => `<path d="M${pt(fz[0] + sd * r * 0.2, fz[1] + r * 0.06)} l${f(sd * -3 * s)} ${f(10 * s)} l${f(sd * -4 * s)} ${f(-10 * s)}Z" fill="#FFF" stroke="${T}" stroke-width="${f(1.4 * s)}"/>`).join('');
      d += [-1, 1].map(sd => [0, 1, 2].map(k => `<circle cx="${f(fz[0] + sd * r * (0.22 + k * 0.07))}" cy="${f(fz[1] + r * (0.02 + (k % 2) * 0.07))}" r="${f(1.6 * s)}" fill="${T}" opacity=".7"/>`).join('')).join('');
      const pisca = this.piscadas.some(p => t >= p && t < p + 0.13), ow = (E.perfil.olhoTam || 0.15) * r;
      [-1, 1].forEach(sd => { const ex = Hf[0] + sd * r * (cav ? 0.42 : 0.36), ey = Hf[1] - faceRy * (cav ? 0.35 : 0.12);
        if (pisca || C.rugir > 0.6) d += `<path d="M${pt(ex - ow, ey)} q${f(ow)} ${f(ow * 0.5)} ${f(ow * 2)} 0" stroke="${T}" stroke-width="${f(3.5 * s)}" fill="none" stroke-linecap="round"/>`;
        else d += `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(ow)}" ry="${f(ow * 0.8)}" fill="${E.perfil.corOlho || '#F2D27A'}" stroke="${T}" stroke-width="${f(2.5 * s)}"/><circle cx="${f(ex + (C.olhar[0] || 0) * 0.2 * s)}" cy="${f(ey)}" r="${f(ow * 0.45)}" fill="${T}"/><circle cx="${f(ex - ow * 0.2)}" cy="${f(ey - ow * 0.25)}" r="${f(ow * 0.18)}" fill="#FFF"/>`;
        d += `<path d="M${pt(ex - sd * ow * 1.2, ey - ow * (1.4 - C.rugir * 0.5))} Q${pt(ex, ey - ow * (1.9 - C.rugir))} ${pt(ex + sd * ow * 1.3, ey - ow * (1.2 - C.rugir * 0.7))}" stroke="${T}" stroke-width="${f(3 * s)}" fill="none" stroke-linecap="round"/>`; });
      this.longeG.innerHTML = longe; this.corpoG.innerHTML = corpo; this.cabecaG.innerHTML = cab; this.pertoG.innerHTML = perto; this.det.innerHTML = d;
      this._boca = [fz[0], fz[1] + r * 0.2];
    }
    boca() { return this._boca || [0, 0]; }
  }
  Animal.ESPECIES = ESPECIES;
  global.Animal = Animal;
})(window);
