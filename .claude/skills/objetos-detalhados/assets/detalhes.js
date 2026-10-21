/*
  detalhes.js — alimentos, objetos e eletrodomésticos MUITO DETALHADOS em SVG (skill "objetos-detalhados").
  Feito para aparecer grande na tela (cartão de desafio, close, comparação época × hoje) sem parecer "ícone".

  const D = Detalhes({ luz: -1, seed: 3 });          // luz: -1 = vem da esquerda (padrão), 1 = da direita
  svg.innerHTML += D.paoFrances(540, 1000, 2.2);     // (x, y da BASE do objeto, escala)
  svg.innerHTML += D.geladeira(300, 1400, 0.9, { imas: true });
  D.escala('geladeira', 0.62)                         // escala para ficar em tamanho real ao lado de um boneco de escala 0.62

  Método (adaptado da skill "anatomy", wheresryan22/anatomy, MIT — ver references/receita-de-detalhe.md):
  forma real reconhecível → volume em 4 tons + brilho → peças de verdade (puxador, borracha, rodinha,
  parafuso…) → material (crosta, farinha, metal escovado, vidro, cerâmica de torno) → sinais de uso e
  de história (ímã, bilhete, migalha, lasca) → sombra de contato. De longe lê na hora; de perto tem o que achar.
  Origem de todo objeto: centro da base, no chão (y = 0, desenho para cima com y negativo).
*/
(function (global) {
  function Detalhes({ luz = -1, seed = 7, prefixo = 'dt', sombra = true } = {}) {   // sombra: false para objeto na mão (sem sombra no chão)
    const L = '#1D1D2B';
    let n = 0; const uid = () => `${prefixo}${seed}_${++n}`;
    const f = v => Math.round(v * 10) / 10;
    // gerador aleatório com semente (o mesmo desenho em todo quadro do vídeo)
    let st = seed >>> 0 || 1;
    const rnd = (a = 0, b = 1) => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return a + (b - a) * (((t ^ (t >>> 14)) >>> 0) / 4294967296); };
    // cores
    const rgb = c => { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
    const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
    const tom = (c, k) => k >= 0 ? mix(c, '#FFFFFF', k) : mix(c, '#14101A', -k);      // + clareia, − escurece
    // gradientes (defs inline; id único por objeto)
    const stops = s => s.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join('');
    const lin = (s, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => { const i = uid(); return { id: `url(#${i})`, def: `<linearGradient id="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>` }; };
    const rad = (s, cx = 0.5, cy = 0.5, r = 0.5, fx = cx, fy = cy) => { const i = uid(); return { id: `url(#${i})`, def: `<radialGradient id="${i}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${stops(s)}</radialGradient>` }; };
    const clip = d => { const i = uid(); return { id: `url(#${i})`, def: `<clipPath id="${i}"><path d="${d}"/></clipPath>` }; };
    // sombra de contato macia no chão
    const contato = (w, h = 14, op = 0.35) => { if (!sombra) return ''; const g = rad([[0, '#000', op], [0.6, '#000', op * 0.45], [1, '#000', 0]]); return `<defs>${g.def}</defs><ellipse cx="${f(w * 0.06)}" cy="2" rx="${f(w)}" ry="${h}" fill="${g.id}"/>`; };
    // texto que não espelha quando a luz vem da direita
    const T = (x, y, txt, { fs = 20, cor = L, peso = 700, fonte = "'DejaVu Sans', Arial, sans-serif", anc = 'middle', extra = '' } = {}) =>
      `<text x="${f(luz > 0 ? -x : x)}" y="${f(y)}" font-size="${fs}" font-family="${fonte}" font-weight="${peso}" fill="${cor}" text-anchor="${anc}" ${extra}>${txt}</text>`;
    // monta: posição + escala; o corpo é desenhado com luz da esquerda e espelhado se a luz vier da direita
    const pos = (x, y, k, corpo, txt = '') => `<g transform="translate(${f(x)} ${f(y)}) scale(${k})"><g transform="scale(${luz > 0 ? -1 : 1} 1)">${corpo}</g>${txt}</g>`;
    // pontinhos espalhados numa área (farinha, poros, sujeira)
    const pontos = (qtd, x0, x1, y0, y1, cor, r0, r1, op0, op1, ok = () => true) => { let s = ''; for (let i = 0; i < qtd; i++) { const x = rnd(x0, x1), y = rnd(y0, y1); if (!ok(x, y)) continue; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rnd(r0, r1))}" fill="${cor}" opacity="${f(rnd(op0, op1) * 100) / 100}"/>`; } return s; };
    // fio de metal com brilho (carrinho, grelha)
    const fio = (x1, y1, x2, y2, w = 3.2, cor = '#5E6670', brilho = '#EEF1F4', op = 1) =>
      `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/><path d="M${f(x1 - w * 0.22)} ${f(y1 - w * 0.22)} L${f(x2 - w * 0.22)} ${f(y2 - w * 0.22)}" stroke="${brilho}" stroke-width="${f(w * 0.34)}" stroke-linecap="round" opacity="${f(op * 0.85)}"/>`;
    // barra de metal escovado (puxador): faixas claro/escuro ao longo do comprimento
    const metal = (vertical = true) => lin([[0, '#7E868E'], [0.22, '#F4F6F8'], [0.45, '#BCC3CA'], [0.7, '#8C949C'], [1, '#5E666E']], 0, 0, vertical ? 1 : 0, vertical ? 0 : 1);
    // tamanho real: largura do desenho (unidades) e largura real (m) → escala ao lado do boneco (1 m = 326 × escala do boneco)
    const REAL = {
      paoFrances: [320, 0.18], paoRomano: [320, 0.24], uvas: [190, 0.16], peixe: [360, 0.35], anfora: [210, 0.4], moeda: [210, 0.022],
      queijo: [430, 0.3], geladeira: [270, 0.75], carrinhoMercado: [460, 0.95], microondas: [330, 0.5], fogao: [300, 0.6],
      tv: [440, 1.0], celular: [130, 0.075], liquidificador: [190, 0.2],
      pacoteArroz: [210, 0.24], pacoteFeijao: [160, 0.15], bandejaOvos: [330, 0.3], sacoPao: [200, 0.2],
      tigela: [300, 0.2], copo: [120, 0.1], capacete: [300, 0.4], rudis: [370, 0.75], gladio: [52, 0.08], escudo: [180, 0.65], tridente: [100, 0.2], rede: [320, 2.5], corneta: [330, 1.2], palma: [160, 0.5], leao: [640, 2.2], urso: [600, 2.0], revolver: [220, 0.25], peDeCabra: [130, 0.6], bicicleta: [480, 1.7], moto: [500, 2.0]
    };

    const D = {
      tom, mix, rnd,
      escala: (nome, escalaBoneco) => { const r = REAL[nome]; return r ? escalaBoneco * 326 * r[1] / r[0] : escalaBoneco; },

      // ===================== ALIMENTOS =====================
      // pão francês / filão: crosta dourada em degradê, pestana (corte) aberta mostrando o miolo, orelha da pestana,
      // rachadinhas, bolhas, farinha, base mais escura e assada, migalhas no chão
      paoFrances: (x, y, k = 1, { cor = '#D9963F', mordida = false, migalhas = true } = {}) => {
        const corpo = 'M-160 -18 C-172 -50 -142 -94 -90 -108 C-40 -122 40 -122 96 -108 C150 -94 174 -52 162 -18 C152 0 -150 0 -160 -18Z';
        const c = clip(corpo);
        const g = lin([[0, tom(cor, 0.3)], [0.4, cor], [0.78, tom(cor, -0.3)], [1, tom(cor, -0.52)]]);
        const brilho = rad([[0, '#FFF6DE', 0.55], [1, '#FFF6DE', 0]], 0.3, 0.12, 0.38);
        const miolo = lin([[0, '#E2BE82'], [0.35, '#F8EACB'], [1, '#EFD8A8']]);
        // a pestana: um corte comprido no topo que abriu no forno — miolo claro aparecendo e a "orelha" de crosta por cima
        const [x1, y1, x2, y2] = [-124, -56, 130, -62];
        const corte = `M${x1} ${y1} Q-6 -126 ${x2} ${y2} Q4 -70 ${x1} ${y1}Z`;
        let s = `<defs>${c.def}${g.def}${brilho.def}${miolo.def}</defs>` + contato(160, 12, 0.32);
        let m = '';
        if (mordida) { const i = uid(); s += `<defs><mask id="${i}"><rect x="-200" y="-200" width="400" height="220" fill="#fff"/><circle cx="168" cy="-92" r="26" fill="#000"/><circle cx="176" cy="-56" r="24" fill="#000"/><circle cx="170" cy="-22" r="20" fill="#000"/></mask></defs>`; m = ` mask="url(#${i})"`; }
        s += `<g${m}><path d="${corpo}" fill="${g.id}"/><g clip-path="${c.id}">`;
        s += `<ellipse cx="0" cy="-6" rx="175" ry="18" fill="${tom(cor, -0.55)}" opacity=".45"/>`;                    // base mais assada
        s += pontos(70, -160, 160, -112, -24, tom(cor, -0.35), 1, 2.6, 0.15, 0.4);                                      // bolhas/poros
        s += `<path d="${corte}" fill="${miolo.id}"/>`;
        s += pontos(50, -100, 110, -92, -60, '#C7974F', 0.8, 1.8, 0.35, 0.7, (px, py) => py > -90 + Math.abs(px) * 0.2 && py < -66 + Math.abs(px) * 0.1);   // poros do miolo
        s += `<path d="M${x1 + 10} ${y1 + 2} Q0 -72 ${x2 - 10} ${y2 + 1}" stroke="${tom(cor, -0.15)}" stroke-width="3" fill="none" opacity=".7"/>`;   // borda de baixo do corte
        s += `<path d="M${x1 - 4} ${y1 - 3} Q-6 -132 ${x2 + 4} ${y2 - 3}" stroke="${tom(cor, -0.5)}" stroke-width="7" fill="none" stroke-linecap="round"/>`;   // orelha (crosta mais assada)
        s += `<path d="M${x1 + 6} ${y1 - 9} Q-6 -138 ${x2 - 6} ${y2 - 10}" stroke="${tom(cor, 0.45)}" stroke-width="2.5" fill="none" opacity=".75"/>`;
        for (let i = 0; i < 7; i++) { const t = 0.12 + i * 0.12, px = x1 + (x2 - x1) * t, py = -58 - 36 * (1 - Math.pow(2 * t - 1, 2)); s += `<path d="M${f(px)} ${f(py - 4)} l${f(rnd(-7, 7))} ${f(rnd(-12, -6))}" stroke="${tom(cor, -0.45)}" stroke-width="1.6" opacity=".55"/>`; }   // rachadinhas
        s += `<path d="${corpo}" fill="${brilho.id}"/>`;
        s += pontos(110, -150, 150, -124, -40, '#FFFDF5', 0.7, 2.2, 0.35, 0.85, (px, py) => py < -96 + Math.abs(px) * 0.18 || py > -40 - Math.abs(px) * 0.05);                                         // farinha
        s += `</g><path d="${corpo}" fill="none" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        if (mordida) s += `<g clip-path="${c.id}"><circle cx="168" cy="-92" r="26" fill="none" stroke="#F8EACB" stroke-width="14"/><circle cx="176" cy="-56" r="24" fill="none" stroke="#F8EACB" stroke-width="14"/><circle cx="170" cy="-22" r="20" fill="none" stroke="#F8EACB" stroke-width="14"/><circle cx="168" cy="-92" r="26" fill="none" stroke="${L}" stroke-width="5"/><circle cx="176" cy="-56" r="24" fill="none" stroke="${L}" stroke-width="5"/><circle cx="170" cy="-22" r="20" fill="none" stroke="${L}" stroke-width="5"/></g>`;
        s += `</g>`;
        if (migalhas) [[186, -4, 7], [202, -2, 4], [-186, -3, 5], [172, 0, 3]].forEach(([mx, my, r]) => { s += `<path d="M${mx - r} ${my} L${mx - r * 0.3} ${my - r * 1.1} L${mx + r} ${my - r * 0.4} L${mx + r * 0.6} ${my}Z" fill="${tom(cor, -0.15)}" stroke="${L}" stroke-width="2"/>`; });
        return pos(x, y, k, s);
      },

      // pão romano (panis quadratus, achado em Pompeia): redondo, 8 gomos marcados, anel no centro
      // e a marca do barbante em volta da lateral — visto de cima em ¾
      paoRomano: (x, y, k = 1, { cor = '#C98A3E', queimado = 0.5 } = {}) => {
        const cy = -96, rx = 150, ry = 62;
        const lado = `M${-rx} ${cy} C${-rx - 6} ${cy + 34} ${-rx + 2} ${cy + 62} ${-rx + 14} ${cy + 76} A${rx - 14} 40 0 0 0 ${rx - 14} ${cy + 76} C${rx - 2} ${cy + 62} ${rx + 6} ${cy + 34} ${rx} ${cy}Z`;
        const gl = lin([[0, tom(cor, 0.05)], [0.5, tom(cor, -0.25)], [1, tom(cor, -0.5)]], 0, 0, 1, 0);
        const gt = rad([[0, tom(cor, 0.42)], [0.55, tom(cor, 0.1)], [1, tom(cor, -0.22)]], 0.4, 0.35, 0.7);
        const topo = `M${-rx} ${cy} A${rx} ${ry} 0 0 1 ${rx} ${cy} A${rx} ${ry} 0 0 1 ${-rx} ${cy}Z`;
        const ct = clip(topo), cl = clip(lado);
        let s = `<defs>${gl.def}${gt.def}${ct.def}${cl.def}</defs>` + contato(160, 16, 0.35);
        s += `<path d="${lado}" fill="${gl.id}"/><g clip-path="${cl.id}">`;
        s += `<path d="M${-rx - 4} ${cy + 40} A${rx + 4} 50 0 0 0 ${rx + 4} ${cy + 40}" stroke="${tom(cor, -0.62)}" stroke-width="7" fill="none"/>`;     // sulco do barbante
        s += `<path d="M${-rx - 4} ${cy + 46} A${rx + 4} 50 0 0 0 ${rx + 4} ${cy + 46}" stroke="${tom(cor, 0.3)}" stroke-width="2" fill="none" opacity=".7"/>`;
        s += pontos(40, -rx, rx, cy, cy + 80, tom(cor, -0.55), 1, 2.4, 0.15, 0.35) + `</g><path d="${lado}" fill="none" stroke="${L}" stroke-width="5"/>`;
        s += `<path d="${topo}" fill="${gt.id}"/><g clip-path="${ct.id}">`;
        // 8 gomos: sulcos do centro até a borda; cada gomo estufado tem um brilho do lado da luz
        for (let i = 0; i < 8; i++) {
          const a = (i + 0.5) * Math.PI / 4, ex = rx * 1.05 * Math.cos(a), ey = cy + ry * 1.05 * Math.sin(a);
          const sx0 = 26 * Math.cos(a), sy0 = cy + 11 * Math.sin(a);
          s += `<path d="M${f(sx0)} ${f(sy0)} L${f(ex)} ${f(ey)}" stroke="${tom(cor, -0.6)}" stroke-width="6" stroke-linecap="round"/>`;
          s += `<path d="M${f(sx0 + 3)} ${f(sy0 + 2)} L${f(ex + 3)} ${f(ey + 2)}" stroke="${tom(cor, 0.45)}" stroke-width="1.6" opacity=".6"/>`;
          const am = (i + 1) * Math.PI / 4, mx = rx * 0.6 * Math.cos(am), my = cy + ry * 0.6 * Math.sin(am);
          const lit = Math.max(0, -Math.cos(am - 2.4));
          s += `<ellipse cx="${f(mx)}" cy="${f(my - 3)}" rx="22" ry="8" transform="rotate(${f(am * 57.3 * 0.35)} ${f(mx)} ${f(my)})" fill="#FFF3D6" opacity="${f(0.08 + lit * 0.18)}"/>`;
        }
        s += pontos(Math.round(30 * queimado), -rx, rx, cy - ry, cy + ry, tom(cor, -0.65), 3, 9, 0.12, 0.3);          // manchas mais tostadas
        s += pontos(70, -rx, rx, cy - ry, cy + ry, '#FFF9EC', 0.7, 2, 0.3, 0.8);                                          // farinha
        s += `<ellipse cx="0" cy="${cy}" rx="30" ry="13" fill="none" stroke="${tom(cor, -0.6)}" stroke-width="6"/><ellipse cx="-2" cy="${cy - 2}" rx="18" ry="7" fill="${tom(cor, 0.35)}"/>`;   // anel do centro
        s += `</g><path d="${topo}" fill="none" stroke="${L}" stroke-width="5"/>`;
        return pos(x, y, k, s);
      },

      // ===================== ELETRODOMÉSTICOS =====================
      // geladeira duplex: lateral em sombra, duas portas com fresta e borracha, puxadores de metal escovado com
      // sombra na porta, painel com temperatura, plaquinha, grade de ventilação, pés, reflexo do esmalte,
      // e a "história" (ímãs, bilhete, desenho de criança)
      geladeira: (x, y, k = 1, { cor = '#F4F6F8', imas = true } = {}) => {
        const W = 115, H = 640;
        const frente = `M${-W} ${-H + 14} Q${-W} ${-H} ${-W + 14} ${-H} H${W - 14} Q${W} ${-H} ${W} ${-H + 14} V-6 H${-W}Z`;
        const gf = lin([[0, tom(cor, 0.6)], [0.55, cor], [1, tom(cor, -0.12)]], 0, 0, 1, 0);
        const gl = lin([[0, tom(cor, -0.22)], [1, tom(cor, -0.34)]]);
        const cf = clip(frente);
        const mt = metal(false);
        let s = `<defs>${gf.def}${gl.def}${cf.def}${mt.def}</defs>` + contato(150, 16, 0.4);
        s += `<path d="M${W} ${-H + 10} L${W + 32} ${-H + 26} V-12 L${W} -4Z" fill="${gl.id}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;   // lateral
        s += `<path d="M${W + 8} ${-H + 60} V-60" stroke="${tom(cor, -0.45)}" stroke-width="1.5" opacity=".5"/>`;
        s += `<path d="${frente}" fill="${gf.id}"/><g clip-path="${cf.id}">`;
        const porta = (y0, y1) => `<rect x="${-W + 7}" y="${y0}" width="${2 * W - 14}" height="${y1 - y0}" rx="10" fill="none" stroke="${tom(cor, -0.2)}" stroke-width="2.5"/><rect x="${-W + 11}" y="${y0 + 4}" width="${2 * W - 22}" height="${y1 - y0 - 8}" rx="8" fill="none" stroke="${tom(cor, -0.08)}" stroke-width="1.5"/><path d="M${-W + 12} ${y1 - 8} V${y0 + 12} Q${-W + 12} ${y0 + 5} ${-W + 20} ${y0 + 5} H${W - 20}" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".9"/>`;
        s += porta(-H + 8, -446) + porta(-438, -64);
        s += `<path d="M${-W} -442 H${W}" stroke="${tom(cor, -0.55)}" stroke-width="4"/><path d="M${-W} -438 H${W}" stroke="#fff" stroke-width="1.5"/>`;   // fresta entre as portas
        // painel de temperatura no congelador
        s += `<rect x="-88" y="${-H + 40}" width="74" height="44" rx="8" fill="#232A33" stroke="${L}" stroke-width="3"/><rect x="-82" y="${-H + 46}" width="62" height="20" rx="4" fill="#0E1A24"/>`;
        s += `<circle cx="-74" cy="${-H + 75}" r="3.5" fill="#6C7A88"/><circle cx="-62" cy="${-H + 75}" r="3.5" fill="#6C7A88"/><circle cx="-26" cy="${-H + 75}" r="3.5" fill="#3DDC84"/>`;
        // puxadores com apoios e sombra na porta
        const puxador = (y0, y1) => `<rect x="${W - 34}" y="${y0 + 6}" width="12" height="${y1 - y0}" rx="6" fill="#000" opacity=".12"/>` +
          `<rect x="${W - 44}" y="${y0 - 6}" width="14" height="14" rx="3" fill="${tom(cor, -0.35)}" stroke="${L}" stroke-width="2.5"/><rect x="${W - 44}" y="${y1 - 8}" width="14" height="14" rx="3" fill="${tom(cor, -0.35)}" stroke="${L}" stroke-width="2.5"/>` +
          `<rect x="${W - 46}" y="${y0}" width="12" height="${y1 - y0}" rx="6" fill="${mt.id}" stroke="${L}" stroke-width="3"/>`;
        s += puxador(-H + 60, -476) + puxador(-420, -250);
        s += `<rect x="-26" y="-470" width="52" height="9" rx="4" fill="#C9CFD5" stroke="${tom(cor, -0.45)}" stroke-width="1.5"/><path d="M-22 -468 H22" stroke="#fff" stroke-width="1.5"/>`;   // plaquinha
        // grade de ventilação e pés
        s += `<rect x="${-W + 10}" y="-56" width="${2 * W - 20}" height="44" rx="6" fill="#3A4149" stroke="${L}" stroke-width="3"/>`;
        for (let i = 0; i < 5; i++) s += `<path d="M${-W + 24} ${-48 + i * 7.5} H${W - 24}" stroke="#202529" stroke-width="3"/><path d="M${-W + 24} ${-46 + i * 7.5} H${W - 24}" stroke="#5C656E" stroke-width="1"/>`;
        // reflexo do esmalte (duas faixas diagonais)
        s += `<path d="M${-W} ${-H + 120} L${-W + 90} ${-H} H${-W + 140} L${-W} ${-H + 210}Z" fill="#fff" opacity=".45"/><path d="M${-W} ${-H + 250} L${-W + 160} ${-H + 40} V${-H + 70} L${-W} ${-H + 285}Z" fill="#fff" opacity=".25"/>`;
        s += `<path d="M${W - 20} ${-H + 100} V-80" stroke="${tom(cor, -0.18)}" stroke-width="8" opacity=".25"/>`;
        if (imas) {
          // bilhete preso com ímã, desenho de criança, ímãs de fruta e estrela
          s += `<g transform="rotate(-5 -50 -350)"><rect x="-92" y="-392" width="80" height="96" fill="#FFF8D8" stroke="${L}" stroke-width="2.5"/>`;
          for (let i = 0; i < 6; i++) s += `<path d="M-84 ${-372 + i * 12} H${-20 - (i === 5 ? 30 : rnd(0, 14))}" stroke="#7FA7D9" stroke-width="2"/>`;
          for (let i = 0; i < 5; i++) s += `<path d="M-82 ${-370 + i * 12} q8 -5 16 0 t16 0 t${f(rnd(8, 14))} 0" stroke="#3C4A66" stroke-width="1.6" fill="none"/>`;
          s += `<circle cx="-52" cy="-388" r="9" fill="#D7263D" stroke="${L}" stroke-width="2.5"/><circle cx="-55" cy="-391" r="3" fill="#fff" opacity=".7"/></g>`;
          s += `<g transform="rotate(4 30 -330)"><rect x="0" y="-372" width="74" height="62" fill="#fff" stroke="${L}" stroke-width="2.5"/><circle cx="58" cy="-357" r="9" fill="#FFC21A"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M58 -357 l${f(14 * Math.cos(i))} ${f(14 * Math.sin(i))}" stroke="#FFC21A" stroke-width="2"/>`).join('')}<path d="M12 -318 H64" stroke="#3E9A4A" stroke-width="4"/><path d="M18 -322 V-342 L32 -354 L46 -342 V-322Z" fill="#E86A3A" stroke="#7A2E1F" stroke-width="2"/><rect x="28" y="-334" width="8" height="12" fill="#7A4E2C"/></g>`;
          s += `<rect x="26" y="-378" width="12" height="10" rx="2" fill="#3B7DD8" stroke="${L}" stroke-width="2"/>`;
          s += `<g transform="translate(-60 -250)"><circle r="12" fill="#E8302F" stroke="${L}" stroke-width="2.5"/><path d="M0 -12 q2 -7 8 -9" stroke="#5E3B1C" stroke-width="2.5" fill="none"/><ellipse cx="7" cy="-15" rx="6" ry="3" fill="#3E9A4A" transform="rotate(-25 7 -15)"/><circle cx="-4" cy="-4" r="3.5" fill="#fff" opacity=".6"/></g>`;
          s += `<path d="M30 -560 l5 11 12 1.5 -9 8 2.5 12 -10.5 -6 -10.5 6 2.5 -12 -9 -8 12 -1.5Z" fill="#FFC21A" stroke="${L}" stroke-width="2.5"/>`;
        }
        s += `</g><path d="${frente}" fill="none" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        s += `<rect x="${-W + 14}" y="-6" width="24" height="7" rx="2" fill="#2A2F36"/><rect x="${W - 34}" y="-6" width="24" height="7" rx="2" fill="#2A2F36"/>`;
        const txt = T(-51, -H + 61.5, '4°C', { fs: 14, cor: '#59C3FF', fonte: "'DejaVu Sans Mono', monospace" });
        return pos(x, y, k, s, txt);
      },

      // carrinho de supermercado de arame (de lado, em ¾): cesto com grade de fios com brilho, aro de cima em tubo,
      // lado de trás mais claro (profundidade), cadeirinha de criança, alça de plástico, bandeja de baixo,
      // rodízios com garfo, cubo e borracha, protetor de para-choque
      carrinhoMercado: (x, y, k = 1, { corAlca = '#D7263D' } = {}) => {
        const P = [[-190, -380], [205, -362], [178, -196], [-150, -204]];      // cesto (lado de perto): topo trás, topo frente, baixo frente, baixo trás
        const off = [26, -18];                                                   // lado de longe
        const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const grade = (Q, w, cor, op) => {
          let s = '';
          for (let i = 0; i <= 16; i++) { const t = i / 16, a = lerp(Q[0], Q[1], t), b = lerp(Q[3], Q[2], t); s += fio(a[0], a[1], b[0], b[1], w, cor, '#EEF1F4', op); }
          for (let j = 1; j <= 5; j++) { const t = j / 6, a = lerp(Q[0], Q[3], t), b = lerp(Q[1], Q[2], t); s += fio(a[0], a[1], b[0], b[1], w, cor, '#EEF1F4', op); }
          return s;
        };
        const longe = P.map(p => [p[0] + off[0], p[1] + off[1]]);
        const roda = (cx, cy, r, escuro = 0) => {
          const gh = rad([[0, '#E3E7EB'], [1, '#7C858E']], 0.35, 0.35, 0.6);
          return `<defs>${gh.def}</defs><path d="M${cx - 9} ${cy} L${cx - 7} ${cy - r - 18} H${cx + 9} L${cx + 9} ${cy}" fill="${tom('#3A3F45', escuro)}" stroke="${L}" stroke-width="3"/><rect x="${cx - 14}" y="${cy - r - 24}" width="28" height="8" rx="2" fill="${tom('#596169', escuro)}" stroke="${L}" stroke-width="2.5"/>` +
            `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${tom('#22252A', escuro)}" stroke="${L}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="#3E444B" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r * 0.38}" fill="${gh.id}" stroke="${L}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="${L}"/><path d="M${cx - r * 0.7} ${cy - r * 0.45} A${r * 0.8} ${r * 0.8} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.8}" stroke="#6A727B" stroke-width="2.5" fill="none"/>`;
        };
        const ga = lin([[0, tom(corAlca, 0.35)], [0.5, corAlca], [1, tom(corAlca, -0.4)]]);
        let s = `<defs>${ga.def}</defs>` + contato(220, 16, 0.32);
        // rodas de longe (mais escuras) e chassi de longe
        s += roda(-150 + off[0], -24 + off[1], 20, -0.25) + roda(150 + off[0], -24 + off[1], 20, -0.25);
        s += fio(-155 + off[0], -60 + off[1], 160 + off[0], -60 + off[1], 6, '#7A828B', '#C9CFD5', 0.6);
        s += grade(longe, 2.4, '#8A929B', 0.55);
        s += fio(longe[0][0], longe[0][1], longe[1][0], longe[1][1], 7, '#7A828B', '#E1E5E9', 0.7);
        // bandeja de baixo
        for (let i = 0; i <= 10; i++) { const xx = -150 + i * 31; s += fio(xx, -62, xx + off[0], -62 + off[1], 2.2, '#6E767E', '#E6EAEE', 0.8); }
        s += fio(-158, -62, 162, -62, 6, '#5E6670');
        // pernas do chassi
        s += fio(-150, -204, -156, -48, 7, '#5E6670') + fio(178, -196, 156, -48, 7, '#5E6670') + fio(-156, -48, 156, -48, 7, '#5E6670');
        // ligações entre o lado de perto e o de longe (dá volume)
        P.forEach((p, i) => { s += fio(p[0], p[1], longe[i][0], longe[i][1], 3, '#6E767E', '#EEF1F4', 0.85); });
        // fundo do cesto
        s += fio(P[3][0], P[3][1], P[2][0], P[2][1], 5, '#5E6670');
        // grade de perto + aro de cima em tubo
        s += grade(P, 3.2, '#5E6670', 1);
        s += fio(P[0][0], P[0][1], P[1][0], P[1][1], 10, '#5E6670', '#F4F6F8') + fio(P[1][0], P[1][1], P[2][0], P[2][1], 7, '#5E6670', '#F4F6F8') + fio(P[0][0], P[0][1], P[3][0], P[3][1], 7, '#5E6670', '#F4F6F8');
        // cadeirinha de criança (painel de plástico com furos para as pernas) perto da alça
        s += `<path d="M-182 -372 L-120 -368 L-108 -300 L-166 -300Z" fill="${tom(corAlca, -0.1)}" stroke="${L}" stroke-width="3" opacity=".95"/><ellipse cx="-150" cy="-318" rx="10" ry="6" fill="#2A2F36"/><ellipse cx="-128" cy="-318" rx="10" ry="6" fill="#2A2F36"/><path d="M-176 -366 L-124 -363" stroke="#fff" stroke-width="2" opacity=".6"/>`;
        // braço da alça e alça de plástico
        s += fio(-190, -380, -218, -400, 8, '#5E6670', '#F4F6F8') + fio(-190 + off[0], -380 + off[1], -218 + off[0], -400 + off[1], 6, '#7A828B', '#E1E5E9', 0.7);
        s += `<path d="M-224 -398 L${-224 + off[0] + 4} ${-398 + off[1] - 2}" stroke="${L}" stroke-width="22" stroke-linecap="round"/><path d="M-224 -398 L${-224 + off[0] + 4} ${-398 + off[1] - 2}" stroke="${ga.id}" stroke-width="16" stroke-linecap="round"/><path d="M-228 -403 L${-228 + off[0] + 4} ${-403 + off[1] - 2}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;
        // protetor de para-choque na frente
        s += `<rect x="196" y="-372" width="18" height="26" rx="6" fill="#3A3F45" stroke="${L}" stroke-width="3"/><rect x="171" y="-206" width="16" height="22" rx="5" fill="#3A3F45" stroke="${L}" stroke-width="3"/>`;
        // rodas de perto
        s += roda(-150, -24, 22) + roda(150, -24, 22);
        return pos(x, y, k, s);
      },

      // cacho de uvas: bagos com volume (degradê redondo), brilho, "pó" fosco, cabinho, galho e folha com nervuras
      uvas: (x, y, k = 1, { cor = '#6B2E86', folha = true } = {}) => {
        const gb = rad([[0, tom(cor, 0.45)], [0.55, cor], [1, tom(cor, -0.45)]], 0.38, 0.32, 0.65);
        const gf = lin([[0, '#7DBA4A'], [1, '#3E7A2E']], 0, 0, 1, 1);
        let s = `<defs>${gb.def}${gf.def}</defs>` + contato(80, 10, 0.3);
        if (folha) {
          const fl = 'M10 -250 C40 -290 90 -300 120 -270 C105 -262 112 -246 128 -238 C108 -222 112 -206 120 -192 C92 -196 70 -205 52 -222 C46 -205 30 -200 18 -204 C26 -222 22 -238 10 -250Z';
          s += `<path d="${fl}" fill="${gf.id}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>`;
          s += `<path d="M14 -246 L112 -232 M50 -240 L92 -276 M74 -236 L118 -200 M40 -242 L36 -206" stroke="#B8E08A" stroke-width="2.5" fill="none" opacity=".8"/>`;
        }
        s += `<path d="M0 -236 C2 -260 12 -272 24 -282" stroke="#6B4A2A" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-1 -238 C1 -258 10 -270 20 -279" stroke="#A47A4E" stroke-width="2" fill="none"/>`;
        // bagos de cima para baixo (os de baixo cobrem os de cima); cacho afina para baixo
        const bagos = [];
        [[-1.5, 0], [-0.5, 0], [0.5, 0], [1.5, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [-1.5, 2], [-0.5, 2], [0.5, 2], [1.5, 2], [-1, 3], [0, 3], [1, 3], [-0.5, 4], [0.5, 4], [0, 5]]
          .forEach(([c, r]) => bagos.push([c * 30 + rnd(-4, 4), -220 + r * 36 + rnd(-3, 3), 20 + rnd(-1.5, 1.5)]));
        bagos.forEach(([bx, by, r], i) => {
          s += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(r)}" fill="${gb.id}" stroke="${L}" stroke-width="3.5"/>`;
          s += `<ellipse cx="${f(bx - r * 0.35)}" cy="${f(by - r * 0.4)}" rx="${f(r * 0.28)}" ry="${f(r * 0.18)}" fill="#fff" opacity=".75" transform="rotate(-35 ${f(bx - r * 0.35)} ${f(by - r * 0.4)})"/>`;
          s += `<circle cx="${f(bx + r * 0.25)}" cy="${f(by + r * 0.3)}" r="${f(r * 0.55)}" fill="#C9B3E0" opacity=".12"/>`;     // pó fosco (pruína)
          if (i % 5 === 2) s += `<circle cx="${f(bx + r * 0.1)}" cy="${f(by - r * 0.85)}" r="2" fill="${tom(cor, -0.5)}"/>`;
        });
        return pos(x, y, k, s);
      },

      // peixe (de lado): costas escuras → barriga clara, escamas em fileiras, linha lateral, guelra,
      // olho com brilho, nadadeiras com raios translúcidos
      peixe: (x, y, k = 1, { cor = '#5E7F96' } = {}) => {
        const corpo = 'M-150 -70 C-110 -122 10 -140 100 -98 C126 -86 140 -76 150 -70 C140 -60 126 -50 100 -40 C10 0 -110 -14 -150 -70Z';
        const c = clip(corpo);
        const g = lin([[0, tom(cor, -0.35)], [0.45, tom(cor, 0.25)], [0.75, '#E6ECEE'], [1, '#F6F8F8']]);
        const nad = lin([[0, tom(cor, -0.1), 0.95], [1, tom(cor, 0.35), 0.75]]);
        let s = `<defs>${c.def}${g.def}${nad.def}</defs>` + contato(150, 8, 0.25);
        s += `<path d="M-148 -70 L-196 -112 Q-184 -70 -196 -26Z" fill="${nad.id}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>`;        // rabo
        for (let i = 0; i < 6; i++) s += `<path d="M-152 -70 L-192 ${-106 + i * 16}" stroke="${tom(cor, -0.4)}" stroke-width="1.5" opacity=".6"/>`;
        s += `<path d="M-60 -122 C-40 -150 20 -150 40 -126Z" fill="${nad.id}" stroke="${L}" stroke-width="4"/>`;                                   // dorsal
        for (let i = 0; i < 6; i++) s += `<path d="M${-54 + i * 16} -124 L${-46 + i * 13} -146" stroke="${tom(cor, -0.4)}" stroke-width="1.5" opacity=".6"/>`;
        s += `<path d="M-40 -22 C-30 0 0 6 14 -14Z" fill="${nad.id}" stroke="${L}" stroke-width="3.5"/>`;                                        // ventral
        s += `<path d="${corpo}" fill="${g.id}"/><g clip-path="${c.id}">`;
        for (let r = 0; r < 7; r++) for (let q = 0; q < 14; q++) { const sx = -110 + q * 16 + (r % 2) * 8, sy = -126 + r * 14; s += `<path d="M${sx} ${sy} a9 9 0 0 0 0 14" stroke="${tom(cor, -0.3)}" stroke-width="1.4" fill="none" opacity="${f(0.35 - r * 0.03)}"/>`; }
        s += `<path d="M-120 -76 C-60 -84 40 -84 112 -74" stroke="${tom(cor, -0.5)}" stroke-width="2" fill="none" stroke-dasharray="5 4" opacity=".6"/>`;   // linha lateral
        s += `<path d="M-130 -106 C-60 -128 40 -126 104 -96" stroke="#fff" stroke-width="6" fill="none" opacity=".35"/>`;
        s += `</g><path d="${corpo}" fill="none" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        s += `<path d="M84 -108 C70 -88 70 -60 86 -42" stroke="${L}" stroke-width="3.5" fill="none"/><path d="M78 -104 C66 -86 66 -62 80 -46" stroke="${tom(cor, -0.2)}" stroke-width="2" fill="none" opacity=".6"/>`;   // guelra
        s += `<path d="M40 -66 C30 -50 40 -36 58 -40 C50 -48 48 -58 40 -66Z" fill="${nad.id}" stroke="${L}" stroke-width="3"/>`;                 // peitoral
        s += `<circle cx="114" cy="-84" r="11" fill="#F6F2E6" stroke="${L}" stroke-width="3"/><circle cx="116" cy="-84" r="6" fill="${L}"/><circle cx="113" cy="-87" r="2.2" fill="#fff"/>`;   // olho
        s += `<path d="M150 -70 L138 -66" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
        return pos(x, y, k, s);
      },

      // queijo em roda com uma fatia tirada: casca, massa com olhos (buracos) com sombra dentro,
      // as duas faces do corte (uma na luz, outra na sombra) e a fatia deitada na frente
      queijo: (x, y, k = 1, { cor = '#F2C14E', fatia = true } = {}) => {
        const cy = -142, rx = 140, ry = 54, h = 86;
        const a0 = 0.45, a1 = 1.45;                                    // fatia tirada da frente (ângulos na elipse; π/2 = frente)
        const P = (a, dy = 0) => [f(rx * Math.cos(a)), f(cy + ry * Math.sin(a) + dy)];
        const casca = tom(cor, -0.12), massa = tom(cor, 0.18);
        const gs = lin([[0, tom(casca, 0.12)], [0.6, casca], [1, tom(casca, -0.35)]], 0, 0, 1, 0);
        const gt = rad([[0, tom(cor, 0.35)], [1, tom(cor, -0.04)]], 0.38, 0.4, 0.7);
        const olho = (px, py, r, esc = 0.8) => `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${r}" ry="${f(r * esc)}" fill="${tom(cor, -0.32)}"/><ellipse cx="${f(px + r * 0.18)}" cy="${f(py + r * 0.18)}" rx="${f(r * 0.68)}" ry="${f(r * esc * 0.62)}" fill="${tom(cor, -0.08)}"/>`;
        let s = `<defs>${gs.def}${gt.def}</defs>` + contato(160, 14, 0.32);
        // lateral (casca) dos dois lados do buraco
        const lado = (p, q) => `<path d="M${P(p)} A${rx} ${ry} 0 0 1 ${P(q)} L${P(q, h)} A${rx} ${ry} 0 0 0 ${P(p, h)}Z" fill="${gs.id}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        s += lado(0, a0) + lado(a1, Math.PI);
        // faces do corte: a de a0 olha para a esquerda (luz), a de a1 para a direita (sombra)
        const face = (a, fill) => `<path d="M0 ${cy} L${P(a)} L${P(a, h)} L0 ${cy + h}Z" fill="${fill}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>`;
        s += face(a1, tom(massa, -0.22)) + face(a0, massa);
        const [ax, ay] = P(a0); [[0.3, 0.35, 8], [0.62, 0.62, 6], [0.72, 0.22, 5], [0.45, 0.8, 4]].forEach(([t, v, r]) => { s += olho(ax * t, cy + (ay - cy) * t + h * v, r); });
        const [bx, by] = P(a1); [[0.5, 0.4, 6], [0.8, 0.7, 4]].forEach(([t, v, r]) => { s += olho(bx * t, cy + (by - cy) * t + h * v, r * 0.7, 1.1); });
        s += `<path d="M${P(a0)} L${P(a0, h)}" stroke="${tom(casca, -0.3)}" stroke-width="5"/><path d="M${P(a1)} L${P(a1, h)}" stroke="${tom(casca, -0.3)}" stroke-width="5"/>`;   // casca vista no corte
        // topo sem a fatia
        s += `<path d="M0 ${cy} L${P(a1)} A${rx} ${ry} 0 1 1 ${P(a0)}Z" fill="${gt.id}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        [[-70, -158, 9], [10, -180, 6], [-110, -138, 5], [70, -170, 5], [-30, -130, 4]].forEach(([px, py, r]) => { s += olho(px, py, r, 0.45); });
        s += `<path d="M${-rx + 18} ${cy - 6} A${rx - 18} ${ry - 10} 0 0 1 ${-30} ${cy - ry + 8}" stroke="#fff" stroke-width="4" fill="none" opacity=".4" stroke-linecap="round"/>`;
        if (fatia) {   // a fatia tirada, deitada na frente (topo, face do corte e casca)
          const T = [158, -34], B1 = [266, -56], B2 = [282, -28], hh = 30, d = ([px, py], dy = 0) => `${px} ${py + dy}`;
          s += contato(70, 8, 0.25).replace('<ellipse cx="4.2"', '<ellipse cx="220"');
          s += `<path d="M${d(B1)} L${d(B2)} L${d(B2, hh)} L${d(B1, hh)}Z" fill="${tom(casca, -0.15)}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>`;
          s += `<path d="M${d(T)} L${d(B2)} L${d(B2, hh)} L${d(T, hh)}Z" fill="${massa}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>` + olho(226, -14, 6) + olho(190, -8, 4);
          s += `<path d="M${d(T)} L${d(B1)} L${d(B2)}Z" fill="${tom(cor, 0.25)}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>` + olho(240, -42, 4, 0.45);
        }
        return pos(x, y, k, s);
      },

      // ânfora / jarro de barro: corpo de torno com degradê, anéis do torno que somem nas bordas,
      // alças, boca com interior escuro, lasca na borda, escorrido e etiqueta opcional (em português)
      anfora: (x, y, k = 1, { cor = '#B8613A', tipo = 'jarro', rotulo = '', escorrido = true } = {}) => {
        const pe = tipo === 'anfora' ? 'L18 -14 L0 0 L-18 -14' : 'Q52 -6 46 0 H-46 Q-52 -6';
        const corpo = `M-26 -400 H26 L24 -360 C30 -330 98 -320 100 -230 C102 -130 62 -60 40 -30 ${pe} -40 -30 C-62 -60 -102 -130 -100 -230 C-98 -320 -30 -330 -24 -360Z`;
        const c = clip(corpo);
        const g = lin([[0, tom(cor, 0.25)], [0.3, tom(cor, 0.12)], [0.62, cor], [1, tom(cor, -0.5)]], 0, 0, 1, 0);
        const anel = lin([[0, '#000', 0], [0.2, '#000', 0.25], [0.8, '#000', 0.25], [1, '#000', 0]], 0, 0, 1, 0);
        let s = `<defs>${c.def}${g.def}${anel.def}</defs>` + contato(80, 10, 0.35);
        const alca = (sx) => `<path d="M${sx * 22} -366 C${sx * 70} -380 ${sx * 96} -350 ${sx * 80} -300" stroke="${L}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M${sx * 22} -366 C${sx * 70} -380 ${sx * 96} -350 ${sx * 80} -300" stroke="${sx < 0 ? tom(cor, 0.1) : tom(cor, -0.35)}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
        s += alca(-1) + alca(1);
        s += `<path d="${corpo}" fill="${g.id}"/><g clip-path="${c.id}">`;
        for (let i = 0; i < 9; i++) { const yy = -300 + i * 26; s += `<path d="M-104 ${yy} Q0 ${yy + 8} 104 ${yy}" stroke="${anel.id}" stroke-width="${i % 3 ? 1.5 : 3}" fill="none"/>`; }   // anéis do torno
        s += `<path d="M-60 -312 C-90 -260 -90 -170 -58 -100" stroke="#fff" stroke-width="10" fill="none" opacity=".25" stroke-linecap="round"/>`;
        if (escorrido) s += `<path d="M10 -360 C12 -320 4 -290 8 -250 C10 -235 18 -235 18 -250 C16 -290 22 -330 18 -360Z" fill="${tom(cor, -0.55)}" opacity=".45"/>`;
        s += pontos(40, -100, 100, -330, -40, tom(cor, -0.5), 1, 2.5, 0.12, 0.3);
        s += `</g><path d="${corpo}" fill="none" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        s += `<ellipse cx="0" cy="-400" rx="34" ry="10" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="5"/><ellipse cx="0" cy="-400" rx="22" ry="5.5" fill="#2A1A14"/>`;                // boca
        s += `<path d="M18 -409 l6 3 -3 7Z" fill="${tom(cor, 0.4)}" stroke="${L}" stroke-width="2"/>`;   // lasca
        let txt = '';
        if (rotulo) {   // etiqueta amarrada no gargalo, do tamanho do texto (sempre em português)
          const w = rotulo.length * 9.6 + 22, cx = -30;
          s += `<path d="M-16 -360 Q-26 -330 ${cx} -296" stroke="#6B4A2A" stroke-width="2.5" fill="none"/><g transform="rotate(-6 ${cx} -276)"><rect x="${f(cx - w / 2)}" y="-298" width="${f(w)}" height="40" rx="5" fill="#EFE2C4" stroke="${L}" stroke-width="3"/><circle cx="${cx}" cy="-290" r="3" fill="none" stroke="${L}" stroke-width="2"/></g>`;
          txt = `<g transform="rotate(${luz > 0 ? 6 : -6} ${luz > 0 ? -cx : cx} -276)">${T(cx, -266, rotulo, { fs: 16, cor: '#3A2418' })}</g>`;
        }
        return pos(x, y, k, s, txt);
      },

      // moeda antiga (close): borda com serrilha e pérolas, perfil em relevo (sombra + luz), desgaste no alto relevo, brilho
      moeda: (x, y, k = 1, { cor = '#E2B33C' } = {}) => {
        const R = 100, cy = -112;
        const gf = rad([[0, tom(cor, 0.45)], [0.6, cor], [1, tom(cor, -0.3)]], 0.38, 0.32, 0.75);
        const gb = rad([[0, '#fff', 0.55], [1, '#fff', 0]], 0.3, 0.25, 0.35);
        let s = `<defs>${gf.def}${gb.def}</defs>` + contato(80, 9, 0.3);
        s += `<ellipse cx="0" cy="${cy + 10}" rx="${R}" ry="${R}" fill="${tom(cor, -0.45)}" stroke="${L}" stroke-width="5"/>`;      // espessura
        for (let i = 0; i < 40; i++) { const a = Math.PI * (0.05 + 0.9 * i / 39); s += `<path d="M${f(R * Math.cos(a))} ${f(cy + R * Math.sin(a))} v9" stroke="${tom(cor, -0.65)}" stroke-width="2"/>`; }   // serrilha
        s += `<circle cx="0" cy="${cy}" r="${R}" fill="${gf.id}" stroke="${L}" stroke-width="5"/>`;
        s += `<circle cx="0" cy="${cy}" r="${R - 9}" fill="none" stroke="${tom(cor, -0.3)}" stroke-width="3"/><circle cx="0" cy="${cy}" r="${R - 11}" fill="none" stroke="${tom(cor, 0.5)}" stroke-width="1.5"/>`;
        for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; s += `<circle cx="${f((R - 20) * Math.cos(a))}" cy="${f(cy + (R - 20) * Math.sin(a))}" r="2.6" fill="${tom(cor, -0.25)}"/><circle cx="${f((R - 20) * Math.cos(a) - 0.8)}" cy="${f(cy + (R - 20) * Math.sin(a) - 0.8)}" r="1.2" fill="${tom(cor, 0.5)}"/>`; }   // pérolas
        const cab = `M-10 -60 C-34 -60 -44 -40 -40 -20 C-38 -8 -30 0 -32 10 L-28 18 C-26 26 -18 30 -14 40 L18 42 C14 30 16 22 22 16 C26 16 30 12 28 8 L32 2 C34 -2 28 -4 32 -8 C40 -14 36 -18 34 -22 C36 -34 26 -58 -10 -60Z`;
        const at = (dx, dy) => `transform="translate(${dx} ${cy - 4 + dy}) scale(1.05)"`;
        s += `<path d="${cab}" ${at(3, 3)} fill="${tom(cor, -0.45)}"/><path d="${cab}" ${at(0, 0)} fill="${tom(cor, 0.05)}"/><path d="${cab}" ${at(-1.5, -1.5)} fill="none" stroke="${tom(cor, 0.55)}" stroke-width="1.8"/>`;   // relevo
        for (let i = 0; i < 7; i++) { const a = 3.6 + i * 0.32, lx = -6 + 30 * Math.cos(a), ly = cy - 26 + 30 * Math.sin(a); s += `<ellipse cx="${f(lx)}" cy="${f(ly)}" rx="7" ry="3" transform="rotate(${f(a * 57.3 + 90)} ${f(lx)} ${f(ly)})" fill="${tom(cor, -0.2)}" stroke="${tom(cor, -0.5)}" stroke-width="1"/>`; }   // coroa de louros
        s += `<circle cx="20" cy="${cy - 30}" r="2.5" fill="${tom(cor, -0.55)}"/><ellipse cx="-14" cy="${cy - 34}" rx="18" ry="12" fill="#fff" opacity=".18"/>`;
        s += `<circle cx="0" cy="${cy}" r="${R}" fill="${gb.id}"/>`;
        return pos(x, y, k, s);
      },

      // micro-ondas: porta com vidro escuro, tela de furinhos, prato giratório e caneca lá dentro, reflexo,
      // puxador, painel com visor, teclado numérico e botão de iniciar, ventilação na lateral, pés
      microondas: (x, y, k = 1, { cor = '#E9ECEF', hora = '12:00' } = {}) => {
        const gb = lin([[0, tom(cor, 0.5)], [1, tom(cor, -0.12)]], 0, 0, 1, 0);
        const gv = lin([[0, '#2E3A44'], [1, '#141A20']], 0, 0, 0.6, 1);
        const i = uid();
        let s = `<defs>${gb.def}${gv.def}<pattern id="${i}" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.6" fill="#000" opacity=".45"/></pattern></defs>` + contato(170, 12, 0.35);
        s += `<path d="M150 -196 L172 -210 V-16 L150 -6Z" fill="${tom(cor, -0.3)}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/><path d="M-150 -196 L-128 -210 H172 L150 -196Z" fill="${tom(cor, 0.2)}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>`;
        for (let j = 0; j < 8; j++) s += `<path d="M156 ${-180 + j * 9} L166 ${-187 + j * 9}" stroke="${tom(cor, -0.55)}" stroke-width="3" stroke-linecap="round"/>`;   // ventilação
        s += `<rect x="-150" y="-196" width="300" height="190" rx="8" fill="${gb.id}" stroke="${L}" stroke-width="5"/>`;
        s += `<rect x="-140" y="-184" width="196" height="166" rx="8" fill="${tom(cor, 0.1)}" stroke="${tom(cor, -0.35)}" stroke-width="2.5"/>`;   // porta
        s += `<rect x="-126" y="-170" width="160" height="138" rx="10" fill="${gv.id}" stroke="${L}" stroke-width="3"/>`;
        s += `<ellipse cx="-46" cy="-50" rx="62" ry="10" fill="#B9C6CF" opacity=".25"/><path d="M-62 -54 V-86 H-34 V-54Z" fill="#C7503A" opacity=".55"/><path d="M-34 -80 a9 9 0 0 1 0 18" stroke="#C7503A" stroke-width="4" fill="none" opacity=".55"/>`;   // prato e caneca lá dentro
        s += `<rect x="-126" y="-170" width="160" height="138" rx="10" fill="url(#${i})"/>`;
        s += `<path d="M-120 -100 L-60 -166 H-34 L-120 -72Z" fill="#fff" opacity=".18"/><path d="M-120 -56 L-20 -166 H-10 L-120 -46Z" fill="#fff" opacity=".1"/>`;
        s += `<rect x="40" y="-170" width="10" height="138" rx="5" fill="${tom(cor, -0.25)}" stroke="${L}" stroke-width="2.5"/><path d="M43 -164 V-40" stroke="#fff" stroke-width="2" opacity=".8"/>`;
        s += `<rect x="68" y="-176" width="70" height="28" rx="4" fill="#0E1418" stroke="${L}" stroke-width="3"/>`;     // visor
        for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) s += `<rect x="${72 + q * 22}" y="${-138 + r * 20}" width="17" height="14" rx="3" fill="${tom(cor, 0.4)}" stroke="${tom(cor, -0.45)}" stroke-width="1.8"/><circle cx="${80.5 + q * 22}" cy="${-131 + r * 20}" r="2" fill="${tom(cor, -0.5)}"/>`;
        s += `<rect x="72" y="-54" width="62" height="20" rx="5" fill="#3DBE6B" stroke="${L}" stroke-width="2.5"/><path d="M98 -49 v10 l9 -5Z" fill="#fff"/>`;
        s += `<rect x="-140" y="-6" width="26" height="7" rx="2" fill="#2A2F36"/><rect x="114" y="-6" width="26" height="7" rx="2" fill="#2A2F36"/>`;
        const txt = T(103, -156, hora, { fs: 18, cor: '#4CFF8A', fonte: "'DejaVu Sans Mono', monospace" });
        return pos(x, y, k, s, txt);
      },

      // fogão de 4 bocas: mesa em perspectiva com trempes e queimadores, espelho de trás, botões com marcador,
      // porta do forno com vidro (grade e brilho do fogo lá dentro), puxador, gaveta, pés
      fogao: (x, y, k = 1, { cor = '#EEF0F2', aceso = true } = {}) => {
        const gf = lin([[0, tom(cor, 0.45)], [1, tom(cor, -0.12)]], 0, 0, 1, 0);
        const gm = lin([[0, tom(cor, 0.2)], [1, tom(cor, -0.2)]]);
        const gv = lin([[0, '#30261F'], [0.7, aceso ? '#7A3A16' : '#2A2A2E'], [1, aceso ? '#C8641E' : '#1E1E22']]);
        const mt = metal(false);
        let s = `<defs>${gf.def}${gm.def}${gv.def}${mt.def}</defs>` + contato(170, 14, 0.38);
        s += `<rect x="-140" y="-470" width="280" height="62" rx="6" fill="${tom(cor, -0.08)}" stroke="${L}" stroke-width="4"/><path d="M-130 -460 H130" stroke="#fff" stroke-width="2" opacity=".8"/>`;   // espelho de trás
        s += `<path d="M-150 -360 L-130 -410 H130 L150 -360Z" fill="${gm.id}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        [[-62, -395, 0.8], [62, -395, 0.8], [-72, -373, 1], [72, -373, 1]].forEach(([bx, by, e]) => {
          s += `<ellipse cx="${bx}" cy="${by}" rx="${46 * e}" ry="${12 * e}" fill="#2B2E33" stroke="${L}" stroke-width="2.5"/>`;
          s += `<ellipse cx="${bx}" cy="${by - 2}" rx="${20 * e}" ry="${5.5 * e}" fill="#55595F" stroke="${L}" stroke-width="2"/><ellipse cx="${bx - 3}" cy="${by - 3.5}" rx="${9 * e}" ry="${2.2 * e}" fill="#9AA0A6"/>`;
          s += `<path d="M${bx - 44 * e} ${by} H${bx + 44 * e} M${bx} ${by - 12 * e} V${by + 12 * e} M${bx - 30 * e} ${by - 9 * e} L${bx + 30 * e} ${by + 9 * e} M${bx + 30 * e} ${by - 9 * e} L${bx - 30 * e} ${by + 9 * e}" stroke="#15171A" stroke-width="${4 * e}" stroke-linecap="round"/>`;   // trempe
        });
        s += `<rect x="-150" y="-360" width="300" height="352" rx="6" fill="${gf.id}" stroke="${L}" stroke-width="5"/>`;
        s += `<rect x="-142" y="-352" width="284" height="44" rx="5" fill="${tom(cor, -0.06)}" stroke="${tom(cor, -0.35)}" stroke-width="2"/>`;
        for (let i = 0; i < 5; i++) { const bx = -110 + i * 52; s += `<circle cx="${bx}" cy="-330" r="15" fill="#2B2E33" stroke="${L}" stroke-width="3"/><circle cx="${bx - 3}" cy="-333" r="10" fill="#4A4F55"/><path d="M${bx} -330 L${bx + 9 * Math.cos(-1.2 + i * 0.4)} ${-330 + 9 * Math.sin(-1.2 + i * 0.4)}" stroke="#F2F4F6" stroke-width="3" stroke-linecap="round"/>`; }
        s += `<rect x="-140" y="-294" width="280" height="232" rx="8" fill="${tom(cor, 0.15)}" stroke="${tom(cor, -0.35)}" stroke-width="2.5"/>`;     // porta do forno
        s += `<rect x="-112" y="-248" width="224" height="140" rx="10" fill="${gv.id}" stroke="${L}" stroke-width="3"/>`;
        s += `<path d="M-100 -160 H100 M-100 -140 H100" stroke="#8A8F96" stroke-width="2.5" opacity=".55"/>${[...Array(10)].map((_, j) => `<path d="M${-90 + j * 20} -160 V-140" stroke="#8A8F96" stroke-width="1.5" opacity=".45"/>`).join('')}`;   // grade do forno
        if (aceso) s += `<path d="M-90 -116 H90" stroke="#FF9A3C" stroke-width="5" opacity=".8" stroke-dasharray="10 6"/>`;
        s += `<path d="M-108 -190 L-50 -246 H-20 L-108 -160Z" fill="#fff" opacity=".18"/>`;
        s += `<rect x="-104" y="-282" width="12" height="18" rx="3" fill="${tom(cor, -0.35)}" stroke="${L}" stroke-width="2.5"/><rect x="92" y="-282" width="12" height="18" rx="3" fill="${tom(cor, -0.35)}" stroke="${L}" stroke-width="2.5"/><rect x="-112" y="-288" width="224" height="12" rx="6" fill="${mt.id}" stroke="${L}" stroke-width="3"/>`;   // puxador
        s += `<rect x="-140" y="-54" width="280" height="40" rx="5" fill="${tom(cor, -0.05)}" stroke="${tom(cor, -0.35)}" stroke-width="2.5"/><rect x="-30" y="-40" width="60" height="8" rx="4" fill="${tom(cor, -0.4)}"/>`;
        s += `<rect x="-142" y="-8" width="28" height="9" rx="2" fill="#2A2F36"/><rect x="114" y="-8" width="28" height="9" rx="2" fill="#2A2F36"/>`;
        return pos(x, y, k, s);
      },

      // TV de tela fina: moldura, tela com degradê e reflexo (ou ligada com uma imagem), LED, lateral fina, pé
      tv: (x, y, k = 1, { ligada = false } = {}) => {
        const gt = ligada ? lin([[0, '#3E9BE0'], [0.6, '#F7C873'], [1, '#E86A3A']]) : lin([[0, '#25303D'], [1, '#0B0F14']], 0, 0, 0.5, 1);
        let s = `<defs>${gt.def}</defs>` + contato(150, 10, 0.3);
        s += `<path d="M-40 -6 L-24 -60 H24 L40 -6Z" fill="#2B2F35" stroke="${L}" stroke-width="4" stroke-linejoin="round"/><ellipse cx="0" cy="-6" rx="96" ry="10" fill="#3A3F46" stroke="${L}" stroke-width="4"/><path d="M-70 -10 H60" stroke="#6A717A" stroke-width="2"/>`;   // pé
        s += `<path d="M210 -306 L218 -300 V-66 L210 -60Z" fill="#2A2E34" stroke="${L}" stroke-width="3"/>`;
        s += `<rect x="-212" y="-310" width="424" height="252" rx="8" fill="#15171B" stroke="${L}" stroke-width="5"/>`;
        s += `<rect x="-202" y="-300" width="404" height="226" rx="3" fill="${gt.id}"/>`;
        if (ligada) s += `<circle cx="80" cy="-170" r="34" fill="#FFE08A"/><path d="M-202 -120 Q-100 -160 0 -126 T202 -136 V-74 H-202Z" fill="#3E7A2E"/><path d="M-202 -96 Q-60 -130 80 -100 T202 -110 V-74 H-202Z" fill="#2C5E22"/>`;
        s += `<path d="M-202 -150 L-60 -300 H-10 L-202 -96Z" fill="#fff" opacity="${ligada ? 0.1 : 0.12}"/><path d="M-202 -84 L-30 -300 H-18 L-202 -72Z" fill="#fff" opacity=".07"/>`;
        s += `<rect x="-14" y="-66" width="28" height="4" rx="2" fill="#5A626C"/><circle cx="196" cy="-64" r="2.5" fill="${ligada ? '#3DDC84' : '#FF3B3B'}"/>`;
        return pos(x, y, k, s);
      },

      // celular (close): moldura de metal, botões laterais, tela com barra de status, ícones de app, câmera, reflexo
      celular: (x, y, k = 1, { cor = '#2A2E34' } = {}) => {
        const gt = lin([[0, '#4B6CB7'], [1, '#182848']], 0, 0, 0.4, 1);
        let s = `<defs>${gt.def}</defs>` + contato(60, 6, 0.25);
        s += `<rect x="-66" y="-66" width="6" height="22" rx="2" fill="${tom(cor, -0.2)}" stroke="${L}" stroke-width="2" transform="translate(0 -110)"/><rect x="60" y="-196" width="6" height="34" rx="2" fill="${tom(cor, -0.2)}" stroke="${L}" stroke-width="2"/><rect x="60" y="-150" width="6" height="20" rx="2" fill="${tom(cor, -0.2)}" stroke="${L}" stroke-width="2"/>`;
        s += `<rect x="-62" y="-250" width="124" height="246" rx="22" fill="${cor}" stroke="${L}" stroke-width="5"/><rect x="-58" y="-246" width="116" height="238" rx="19" fill="none" stroke="${tom(cor, 0.4)}" stroke-width="2"/>`;
        s += `<rect x="-54" y="-242" width="108" height="230" rx="16" fill="${gt.id}"/>`;
        s += `<circle cx="0" cy="-230" r="4.5" fill="#0A0C10"/><circle cx="-1" cy="-231" r="1.5" fill="#5A7BC0"/>`;
        s += `<rect x="-44" y="-236" width="14" height="5" rx="2" fill="#fff" opacity=".85"/><rect x="28" y="-236" width="16" height="6" rx="2" fill="none" stroke="#fff" stroke-width="1.5"/><rect x="30" y="-234" width="10" height="2" fill="#3DDC84"/>`;
        const cores = ['#FF5A5F', '#FFB400', '#00A699', '#3B7DD8', '#8E44AD', '#2ECC71', '#E67E22', '#1ABC9C', '#E84393', '#F1C40F', '#34495E', '#16A085', '#D35400', '#27AE60', '#C0392B', '#7F8C8D'];
        for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) { const ix = -44 + q * 24, iy = -214 + r * 30, c = cores[r * 4 + q]; s += `<rect x="${ix}" y="${iy}" width="18" height="18" rx="5" fill="${c}"/><circle cx="${ix + 9}" cy="${iy + 9}" r="4" fill="#fff" opacity=".85"/><rect x="${ix + 3}" y="${iy + 21}" width="12" height="2" rx="1" fill="#fff" opacity=".5"/>`; }
        s += `<rect x="-48" y="-60" width="96" height="30" rx="12" fill="#fff" opacity=".18"/>${[0, 1, 2, 3].map(q => `<rect x="${-42 + q * 22}" y="-55" width="18" height="18" rx="5" fill="${cores[q + 4]}"/>`).join('')}`;
        s += `<rect x="-20" y="-22" width="40" height="4" rx="2" fill="#fff" opacity=".8"/>`;
        s += `<path d="M-54 -120 L40 -242 H54 V-232 L-54 -96Z" fill="#fff" opacity=".1"/>`;
        return pos(x, y, k, s);
      },

      // liquidificador: base com botões e botão giratório, copo de vidro com marcas de medida e alça,
      // tampa com sobretampa, lâminas no fundo, suco opcional com bolhas
      liquidificador: (x, y, k = 1, { cor = '#D7263D', suco = '#FF9A3C' } = {}) => {
        const gb = lin([[0, tom(cor, 0.3)], [0.5, cor], [1, tom(cor, -0.45)]], 0, 0, 1, 0);
        const copo = 'M-70 -380 H70 L54 -140 H-54Z';
        const c = clip(copo);
        let s = `<defs>${gb.def}${c.def}</defs>` + contato(100, 10, 0.35);
        s += `<path d="M-80 -6 L-66 -130 H66 L80 -6Z" fill="${gb.id}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        s += `<rect x="-40" y="-100" width="80" height="54" rx="10" fill="#22262B" stroke="${L}" stroke-width="3"/>`;
        [-24, 0, 24].forEach((bx, i) => { s += `<rect x="${bx - 9}" y="-92" width="18" height="12" rx="3" fill="${i === 1 ? '#3DDC84' : '#9AA2AA'}" stroke="${L}" stroke-width="1.5"/>`; });
        s += `<circle cx="0" cy="-62" r="10" fill="#C9CFD5" stroke="${L}" stroke-width="2.5"/><path d="M0 -62 V-70" stroke="${L}" stroke-width="2.5"/>`;
        s += `<rect x="-58" y="-146" width="116" height="18" rx="4" fill="#2B2F35" stroke="${L}" stroke-width="3"/>`;    // encaixe do copo
        s += `<path d="M64 -350 C120 -340 120 -200 60 -190" stroke="${L}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M64 -350 C120 -340 120 -200 60 -190" stroke="#2B2F35" stroke-width="15" fill="none" stroke-linecap="round"/>`;   // alça
        s += `<path d="${copo}" fill="#DDEFF7" opacity=".55"/><g clip-path="${c.id}">`;
        if (suco) { s += `<rect x="-80" y="-250" width="160" height="120" fill="${suco}" opacity=".85"/><path d="M-80 -250 Q0 -238 80 -250" stroke="${tom(suco, 0.4)}" stroke-width="5" fill="none"/>` + pontos(20, -50, 50, -240, -150, '#fff', 1.5, 4, 0.3, 0.7); }
        s += `<path d="M-30 -150 L30 -160 M-26 -160 L26 -150" stroke="#9AA2AA" stroke-width="5" stroke-linecap="round"/>`;   // lâminas
        for (let i = 0; i < 6; i++) s += `<path d="M-60 ${-200 - i * 30} H${i % 2 ? -48 : -40}" stroke="#3A4650" stroke-width="2"/>`;   // marcas de medida
        s += `<path d="M-52 -370 L-40 -150" stroke="#fff" stroke-width="8" opacity=".5" stroke-linecap="round"/><path d="M30 -370 L24 -160" stroke="#fff" stroke-width="3" opacity=".35"/>`;
        s += `</g><path d="${copo}" fill="none" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        s += `<rect x="-76" y="-396" width="152" height="22" rx="6" fill="#2B2F35" stroke="${L}" stroke-width="4"/><rect x="-22" y="-410" width="44" height="16" rx="4" fill="#4A4F55" stroke="${L}" stroke-width="3"/><path d="M-66 -390 H60" stroke="#6A717A" stroke-width="2"/>`;
        return pos(x, y, k, s);
      },

      // ===================== GLADIADORES / COLISEU =====================
      // tigela de barro com cevada e feijão (a comida dos gladiadores, "hordearii" = comedores de cevada) + colher de pau
      tigela: (x, y, k = 1, { cor = '#A8603A', colher = true, vapor = true } = {}) => {
        const g = lin([[0, tom(cor, 0.25)], [0.5, cor], [1, tom(cor, -0.45)]], 0, 0, 1, 0);
        const papa = rad([[0, '#E9D29A'], [1, '#B99A5E']], 0.4, 0.4, 0.7);
        let s = `<defs>${g.def}${papa.def}</defs>` + contato(150, 12, 0.35);
        s += `<path d="M-150 -120 Q-140 -20 -60 -6 H60 Q140 -20 150 -120Z" fill="${g.id}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        s += `<path d="M-50 -6 L-44 6 H44 L50 -6Z" fill="${tom(cor, -0.35)}" stroke="${L}" stroke-width="4"/>`;     // pé da tigela
        for (let i = 0; i < 3; i++) s += `<path d="M${-140 + i * 6} ${-96 + i * 26} Q0 ${-70 + i * 30} ${140 - i * 6} ${-96 + i * 26}" stroke="#000" stroke-width="1.6" fill="none" opacity=".15"/>`;   // anéis do torno
        s += `<path d="M-128 -90 Q-118 -40 -70 -24" stroke="#fff" stroke-width="7" fill="none" opacity=".3" stroke-linecap="round"/>`;
        s += `<ellipse cx="0" cy="-120" rx="150" ry="34" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="5"/>`;
        s += `<ellipse cx="0" cy="-118" rx="134" ry="26" fill="${papa.id}"/>`;
        for (let i = 0; i < 70; i++) { const a = rnd(0, Math.PI * 2), rr = Math.sqrt(rnd(0, 1)); const px = Math.cos(a) * rr * 124, py = -118 + Math.sin(a) * rr * 22; s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="4.2" ry="2.6" fill="${rnd() < 0.5 ? '#D9BE7E' : '#F2E2B4'}" stroke="#A88A50" stroke-width="0.8" transform="rotate(${f(rnd(0, 180))} ${f(px)} ${f(py)})"/>`; }   // grãos de cevada
        for (let i = 0; i < 16; i++) { const a = rnd(0, Math.PI * 2), rr = Math.sqrt(rnd(0, 1)); const px = Math.cos(a) * rr * 110, py = -118 + Math.sin(a) * rr * 18; s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="8" ry="5" fill="#7A3A2A" stroke="${L}" stroke-width="1.5" transform="rotate(${f(rnd(-30, 30))} ${f(px)} ${f(py)})"/><ellipse cx="${f(px - 2)}" cy="${f(py - 1.5)}" rx="3" ry="1.4" fill="#fff" opacity=".45"/>`; }   // feijões
        if (colher) s += `<path d="M40 -130 L170 -250" stroke="${L}" stroke-width="16" stroke-linecap="round"/><path d="M40 -130 L170 -250" stroke="#9A6A3A" stroke-width="10" stroke-linecap="round"/><ellipse cx="34" cy="-124" rx="26" ry="14" fill="#9A6A3A" stroke="${L}" stroke-width="4" transform="rotate(-42 34 -124)"/>`;
        if (vapor) s += `<g stroke="#fff" stroke-width="6" fill="none" opacity=".55" stroke-linecap="round"><path d="M-50 -160 q-16 -30 0 -60 q16 -30 0 -60"/><path d="M10 -170 q-16 -30 0 -60 q16 -30 0 -55"/></g>`;
        return pos(x, y, k, s);
      },

      // copo de barro com água misturada com cinza (bebida de "ossos fortes"): água acinzentada, flocos de cinza boiando
      copo: (x, y, k = 1, { cor = '#9A5A3A', cinza = true } = {}) => {
        const g = lin([[0, tom(cor, 0.3)], [0.55, cor], [1, tom(cor, -0.5)]], 0, 0, 1, 0);
        let s = `<defs>${g.def}</defs>` + contato(70, 8, 0.32);
        s += `<path d="M-60 -200 L-48 -8 Q0 4 48 -8 L60 -200Z" fill="${g.id}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>`;
        s += `<path d="M-56 -150 Q0 -140 56 -150 M-54 -110 Q0 -100 54 -110" stroke="${tom(cor, -0.4)}" stroke-width="3" fill="none" opacity=".6"/><path d="M-40 -180 L-32 -30" stroke="#fff" stroke-width="7" opacity=".28" stroke-linecap="round"/>`;
        s += `<ellipse cx="0" cy="-200" rx="60" ry="14" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="5"/><ellipse cx="0" cy="-198" rx="50" ry="9" fill="${cinza ? '#8E8E86' : '#5DB7EE'}"/>`;
        if (cinza) { s += pontos(26, -44, 44, -204, -192, '#3A3A38', 1.2, 3, 0.5, 0.9) + `<path d="M-30 -199 q14 -4 26 0" stroke="#C9C9C0" stroke-width="2" fill="none"/>`; }
        s += `<path d="M38 -200 l8 8 -6 4Z" fill="${tom(cor, 0.35)}" stroke="${L}" stroke-width="2"/>`;
        return pos(x, y, k, s);
      },

      // capacete de secutor (objeto, de lado): casco liso de bronze, crista baixa, dois furinhos, aba da nuca, rebites
      capacete: (x, y, k = 1, { cor = '#C3C6CD' } = {}) => {
        const g = rad([[0, '#FFFFFF'], [0.35, cor], [1, tom(cor, -0.5)]], 0.35, 0.3, 0.75);
        let s = `<defs>${g.def}</defs>` + contato(130, 12, 0.35);
        s += `<path d="M-150 -40 Q-170 -10 -120 0 H120 Q170 -10 150 -40 Q60 -70 0 -70 Q-60 -70 -150 -40Z" fill="${tom(cor, -0.25)}" stroke="${L}" stroke-width="5"/>`;    // aba
        s += `<path d="M-90 -250 Q0 -360 90 -250 Q20 -300 -90 -250Z" fill="${tom(cor, -0.1)}" stroke="${L}" stroke-width="5"/>`;                                     // crista
        s += `<path d="M-130 -40 C-150 -200 -60 -290 0 -290 C80 -290 150 -200 130 -40 Q0 -10 -130 -40Z" fill="${g.id}" stroke="${L}" stroke-width="6"/>`;
        s += `<path d="M-110 -110 Q0 -84 110 -110" stroke="${tom(cor, -0.35)}" stroke-width="3" fill="none"/>`;
        [-40, 40].forEach(ex => { s += `<ellipse cx="${ex}" cy="-150" rx="14" ry="16" fill="#0E0E14" stroke="${tom(cor, -0.5)}" stroke-width="3"/><path d="M${ex - 14} -170 q14 -8 28 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/>`; });
        for (let i = 0; i < 9; i++) { const px = -110 + i * 27.5; s += `<circle cx="${f(px)}" cy="${f(-60 - Math.sin((i / 8) * Math.PI) * 14)}" r="4.5" fill="${tom(cor, -0.4)}"/><circle cx="${f(px - 1.2)}" cy="${f(-61.5 - Math.sin((i / 8) * Math.PI) * 14)}" r="1.8" fill="#fff" opacity=".8"/>`; }
        s += `<path d="M-90 -200 Q-80 -260 -20 -275" stroke="#fff" stroke-width="10" fill="none" opacity=".7" stroke-linecap="round"/>`;
        s += pontos(14, -110, 110, -260, -60, tom(cor, -0.45), 1, 3, 0.15, 0.35);   // amassadinhos
        return pos(x, y, k, s);
      },

      // espada de treino (rudis, de madeira) — deitada no chão (origem = centro, no chão)
      rudis: (x, y, k = 1, { rot = 0 } = {}) => {
        const g = lin([[0, '#C9945A'], [1, '#8A5A2E']]);
        let s = `<defs>${g.def}</defs>` + contato(140, 8, 0.3);
        s += `<g transform="rotate(${rot})"><path d="M-150 -14 L90 -18 L130 -8 L90 2 L-150 -2Z" fill="${g.id}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/><path d="M-140 -10 L84 -12" stroke="#E2B57A" stroke-width="2.5" opacity=".7"/>${[...Array(5)].map((_, i) => `<path d="M${-120 + i * 45} -14 q10 4 22 1" stroke="#6E4524" stroke-width="1.5" fill="none" opacity=".6"/>`).join('')}`;
        s += `<rect x="-166" y="-30" width="14" height="44" rx="4" fill="#6E4524" stroke="${L}" stroke-width="4"/><rect x="-216" y="-15" width="52" height="16" rx="6" fill="#5A3A1E" stroke="${L}" stroke-width="4"/>${[0, 1, 2].map(i => `<path d="M${-208 + i * 15} -15 v16" stroke="#3A2414" stroke-width="2"/>`).join('')}<circle cx="-222" cy="-7" r="9" fill="#6E4524" stroke="${L}" stroke-width="3"/></g>`;
        return pos(x, y, k, s);
      },

      // gládio (espada curta de ferro) — na vertical, ponta para cima; origem = punho (para segurar na mão)
      gladio: (x, y, k = 1) => {
        const g = lin([[0, '#F4F6F8'], [0.45, '#AEB4BC'], [0.55, '#7E848C'], [1, '#C9CED4']], 0, 0, 1, 0);
        let s = `<defs>${g.def}</defs>`;
        s += `<path d="M-13 -24 L-12 -190 L0 -222 L12 -190 L13 -24Z" fill="${g.id}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/><path d="M0 -30 V-205" stroke="#6E747C" stroke-width="2"/>`;
        s += `<rect x="-26" y="-28" width="52" height="12" rx="5" fill="#C9A24A" stroke="${L}" stroke-width="3.5"/><rect x="-8" y="-16" width="16" height="34" rx="4" fill="#6E4524" stroke="${L}" stroke-width="3"/><circle cx="0" cy="24" r="10" fill="#C9A24A" stroke="${L}" stroke-width="3"/>`;
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${s}</g>`;
      },

      // escudo de secutor (scutum retangular curvo): madeira coberta de couro pintado, borda de metal, umbo no centro
      escudo: (x, y, k = 1, { cor = '#9E2A22', cor2 = '#FF7A00' } = {}) => {
        const g = lin([[0, tom(cor, 0.3)], [0.5, cor], [1, tom(cor, -0.45)]], 0, 0, 1, 0);
        const um = rad([[0, '#FFF3C4'], [0.5, '#C9A24A'], [1, '#7A5A1A']], 0.35, 0.35, 0.7);
        let s = `<defs>${g.def}${um.def}</defs>`;
        s += `<path d="M-90 -170 Q0 -184 90 -170 V170 Q0 184 -90 170Z" fill="${g.id}" stroke="${L}" stroke-width="6"/>`;
        s += `<path d="M-90 -170 Q0 -184 90 -170 V170 Q0 184 -90 170Z" fill="none" stroke="#B9BCC4" stroke-width="5" transform="scale(.94)"/>`;
        s += `<path d="M-70 -120 L70 120 M70 -120 L-70 120" stroke="${cor2}" stroke-width="12" opacity=".9"/><path d="M-60 -150 Q0 -160 60 -150 M-60 150 Q0 160 60 150" stroke="${cor2}" stroke-width="8" fill="none"/>`;
        s += `<circle r="40" fill="${um.id}" stroke="${L}" stroke-width="5"/><circle cx="-10" cy="-12" r="10" fill="#fff" opacity=".6"/>`;
        s += pontos(24, -84, 84, -160, 160, tom(cor, -0.5), 2, 5, 0.12, 0.3) + `<path d="M-80 -150 V140" stroke="#fff" stroke-width="6" opacity=".2"/>`;
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${s}</g>`;
      },

      // tridente do reciário — vertical, origem = onde a mão segura (meio do cabo)
      tridente: (x, y, k = 1) => {
        const mt = metal(true);
        let s = `<defs>${mt.def}</defs><rect x="-6" y="-200" width="12" height="420" rx="5" fill="#8A5A2E" stroke="${L}" stroke-width="3.5"/><path d="M-2 -196 V210" stroke="#C9945A" stroke-width="2.5"/>`;
        s += `<path d="M-40 -210 V-290 L-46 -282 M40 -210 V-290 L46 -282 M0 -210 V-310" stroke="${L}" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M-40 -210 V-290 M40 -210 V-290 M0 -210 V-310" stroke="#C9CED4" stroke-width="6" stroke-linecap="round"/>`;
        s += `<path d="M-52 -296 L-40 -318 L-28 -296Z M28 -296 L40 -318 L52 -296Z M-12 -316 L0 -340 L12 -316Z" fill="#DDE1E6" stroke="${L}" stroke-width="3.5" stroke-linejoin="round"/>`;
        s += `<path d="M-46 -200 Q0 -226 46 -200" stroke="${L}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M-46 -200 Q0 -226 46 -200" stroke="#B9BCC4" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="-10" y="-208" width="20" height="24" rx="3" fill="#8E949C" stroke="${L}" stroke-width="3"/>`;
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${s}</g>`;
      },

      // rede de pesca do reciário (aberta no ar): malha que segue a forma, pesos de chumbo na borda
      rede: (x, y, k = 1, { abertura = 1 } = {}) => {
        const R = 160 * abertura, n = 9;
        let s = '';
        const pt = (u, v) => [u * R * (1 - 0.15 * v * v), (v * R * 0.62) + Math.sin(u * 3) * 10 * abertura];
        for (let i = -n; i <= n; i += 2) { let d = ''; for (let j = -n; j <= n; j++) { const [px, py] = pt(i / n, j / n); d += (d ? ' L' : 'M') + f(px) + ' ' + f(py); } s += `<path d="${d}" stroke="#D9C9A0" stroke-width="3" fill="none"/>`; }
        for (let j = -n; j <= n; j += 2) { let d = ''; for (let i = -n; i <= n; i++) { const [px, py] = pt(i / n, j / n); d += (d ? ' L' : 'M') + f(px) + ' ' + f(py); } s += `<path d="${d}" stroke="#C9B888" stroke-width="3" fill="none"/>`; }
        for (let i = -n; i <= n; i += 3) { const [px, py] = pt(i / n, 1); s += `<circle cx="${f(px)}" cy="${f(py + 6)}" r="7" fill="#6E727A" stroke="${L}" stroke-width="2.5"/>`; }
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})" stroke-linecap="round">${s}</g>`;
      },

      // corneta romana (cornu): tubo de bronze em forma de G com travessa de madeira; origem = bocal
      corneta: (x, y, k = 1) => {
        const g = lin([[0, '#F2D27A'], [0.5, '#C9A24A'], [1, '#7A5A1A']]);
        let s = `<defs>${g.def}</defs>`;
        s += `<path d="M0 0 C-40 -20 -150 -10 -170 -120 C-190 -230 -60 -290 40 -250 C120 -220 130 -120 90 -70" stroke="${L}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M0 0 C-40 -20 -150 -10 -170 -120 C-190 -230 -60 -290 40 -250 C120 -220 130 -120 90 -70" stroke="${g.id}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M-4 -6 C-40 -24 -146 -16 -164 -120" stroke="#FFF3C4" stroke-width="3" fill="none" opacity=".8"/>`;
        s += `<path d="M90 -70 L150 -20 L60 -40Z" fill="${g.id}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/><ellipse cx="108" cy="-28" rx="44" ry="16" transform="rotate(38 108 -28)" fill="#7A5A1A" stroke="${L}" stroke-width="4"/>`;   // campânula
        s += `<path d="M-150 -60 L60 -200" stroke="${L}" stroke-width="12" stroke-linecap="round"/><path d="M-150 -60 L60 -200" stroke="#8A5A2E" stroke-width="7" stroke-linecap="round"/>`;
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${s}</g>`;
      },

      // folha de palmeira (prêmio do vencedor) — origem = cabo (na mão), folha para cima
      palma: (x, y, k = 1) => {
        let s = `<path d="M0 30 Q6 -120 30 -300" stroke="${L}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M0 30 Q6 -120 30 -300" stroke="#8A9A3A" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        for (let i = 0; i < 14; i++) { const t = 0.15 + i * 0.06, px = 6 * t * 2 + 30 * t * t, py = 30 - 330 * t; [-1, 1].forEach(sd => { const L2 = 80 - i * 4; s += `<path d="M${f(px)} ${f(py)} Q${f(px + sd * L2 * 0.6)} ${f(py - 6)} ${f(px + sd * L2)} ${f(py + 26 - i)}" stroke="${L}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${f(px)} ${f(py)} Q${f(px + sd * L2 * 0.6)} ${f(py - 6)} ${f(px + sd * L2)} ${f(py + 26 - i)}" stroke="${i % 2 ? '#5DA052' : '#3E8A3A'}" stroke-width="5" fill="none" stroke-linecap="round"/>`; }); }
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${s}</g>`;
      },

      // leão (de lado, olhando para a direita): juba em mechas com volume, corpo em degradê, focinho, olho, cauda com tufo
      leao: (x, y, k = 1, { rugindo = false } = {}) => {
        const g = lin([[0, '#E8B860'], [1, '#B07A30']]);
        const jb = rad([[0, '#B0602A'], [1, '#6E3418']], 0.6, 0.45, 0.6);
        let s = `<defs>${g.def}${jb.def}</defs>` + contato(220, 14, 0.35);
        s += `<path d="M-230 -240 Q-300 -270 -290 -190 Q-286 -150 -306 -120" stroke="${L}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M-230 -240 Q-300 -270 -290 -190 Q-286 -150 -306 -120" stroke="#C88A3A" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="-308" cy="-112" rx="16" ry="20" fill="#6E3418" stroke="${L}" stroke-width="4"/>`;
        // pernas (as de longe mais escuras), patas com dedos
        [[-60, -36, 0.8], [150, 184, 0.8], [-170, -134, 1], [62, 98, 1]].forEach(([a, b, e]) => { s += `<path d="M${a + 4} -120 Q${a - 6} -60 ${a} -14 Q${a - 4} 0 ${a + 8} 0 H${b + 4} Q${b + 6} -10 ${b} -16 Q${b + 6} -70 ${b - 2} -120Z" fill="${e < 1 ? '#B07A30' : '#D89A48'}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>${[0, 1, 2].map(i => `<path d="M${a + 12 + i * 9} 0 v-7" stroke="${L}" stroke-width="2.5"/>`).join('')}`; });
        s += `<g transform="translate(0 -70)">`;
        s += `<path d="M-240 -170 Q-250 -236 -150 -232 Q-20 -222 120 -240 Q200 -236 210 -170 Q216 -60 170 -44 Q0 -20 -200 -44 Q-246 -60 -240 -170Z" fill="${g.id}" stroke="${L}" stroke-width="6"/>`;
        s += `<path d="M-200 -60 Q0 -40 160 -60" stroke="#F4D89A" stroke-width="10" fill="none" opacity=".5"/>`;
        // juba: mechas
        for (let i = 0; i < 16; i++) { const a = -Math.PI * 0.95 + i * 0.13 * Math.PI, rr = 118; const px = 200 + Math.cos(a) * rr * 0.9, py = -230 + Math.sin(a) * rr; s += `<path d="M200 -230 Q${f(200 + Math.cos(a + 0.2) * rr * 0.6)} ${f(-230 + Math.sin(a + 0.2) * rr * 0.6)} ${f(px)} ${f(py)}" stroke="${L}" stroke-width="34" stroke-linecap="round"/>`; }
        s += `<ellipse cx="200" cy="-230" rx="110" ry="120" fill="${jb.id}"/>`;
        for (let i = 0; i < 16; i++) { const a = -Math.PI * 0.95 + i * 0.13 * Math.PI, rr = 112; s += `<path d="M200 -230 Q${f(200 + Math.cos(a + 0.2) * rr * 0.6)} ${f(-230 + Math.sin(a + 0.2) * rr * 0.6)} ${f(200 + Math.cos(a) * rr * 0.88)} ${f(-230 + Math.sin(a) * rr)}" stroke="${i % 2 ? '#8A4520' : '#A85A28'}" stroke-width="26" stroke-linecap="round"/>`; }
        // cara
        s += `<path d="M220 -290 Q300 -300 320 -240 Q340 -220 330 -196 Q${rugindo ? '300 -150 250 -170' : '300 -176 260 -176'} Q210 -180 206 -230 Q206 -280 220 -290Z" fill="#E2AA52" stroke="${L}" stroke-width="5"/>`;
        s += `<path d="M312 -246 Q336 -236 334 -212 L318 -214Z" fill="#3A2418" stroke="${L}" stroke-width="3"/>`;   // nariz
        if (rugindo) s += `<path d="M330 -196 Q300 -140 250 -170 Q290 -176 330 -196Z" fill="#7A1A1A" stroke="${L}" stroke-width="4"/><path d="M322 -192 l-6 12 -6 -10 M268 -172 l4 -12 6 10" fill="#fff" stroke="${L}" stroke-width="2"/>`;
        s += `<ellipse cx="270" cy="-258" rx="11" ry="${rugindo ? 6 : 9}" fill="#F6E2A0" stroke="${L}" stroke-width="3"/><circle cx="273" cy="-258" r="5" fill="${L}"/><path d="M252 -276 Q270 ${rugindo ? -282 : -272} 290 -270" stroke="${L}" stroke-width="5" fill="none"/>`;
        s += `<path d="M232 -300 Q226 -330 252 -318" fill="#C88A3A" stroke="${L}" stroke-width="4"/>${[0, 1, 2].map(i => `<circle cx="${296 + i * 9}" cy="${-210 + i * 3}" r="2" fill="${L}"/>`).join('')}</g>`;
        return pos(x, y, k, s);
      },

      // urso (de lado, em pé nas quatro patas, olhando para a direita): pelo em tufos, corcova, focinho claro, garras
      urso: (x, y, k = 1, { rugindo = false, cor = '#6E4A2E' } = {}) => {
        const g = lin([[0, tom(cor, 0.25)], [1, tom(cor, -0.35)]]);
        let s = `<defs>${g.def}</defs>` + contato(220, 14, 0.38);
        s += `<path d="M-170 -110 L-180 0 H-120 L-110 -110 M-60 -100 L-66 0 H-10 L-6 -100 M80 -110 L76 0 H136 L138 -110 M170 -120 L172 0 H232 L226 -130" fill="${tom(cor, -0.15)}" stroke="${L}" stroke-width="5" stroke-linejoin="round"/><g transform="translate(0 -50)">`;
        [-150, -38, 106, 202].forEach(px => { s += [0, 1, 2].map(i => `<path d="M${px + i * 14} 0 l4 8" stroke="#E8E2D0" stroke-width="4" stroke-linecap="round"/>`).join(''); });
        s += `<path d="M-230 -150 Q-240 -270 -120 -290 Q0 -330 90 -290 Q200 -280 230 -190 Q250 -70 200 -50 H-180 Q-236 -70 -230 -150Z" fill="${g.id}" stroke="${L}" stroke-width="6"/>`;
        for (let i = 0; i < 40; i++) { const px = rnd(-210, 200), py = rnd(-290, -70); s += `<path d="M${f(px)} ${f(py)} q${f(rnd(-4, 4))} ${f(rnd(8, 14))} ${f(rnd(4, 9))} ${f(rnd(14, 20))}" stroke="${tom(cor, rnd() < 0.5 ? -0.4 : 0.3)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`; }
        s += `<path d="M190 -250 Q260 -300 320 -250 Q350 -226 360 -200 Q${rugindo ? '340 -150 290 -160' : '340 -176 300 -176'} Q240 -170 210 -200Z" fill="${tom(cor, 0.05)}" stroke="${L}" stroke-width="5"/>`;
        s += `<path d="M310 -230 Q350 -224 360 -200 Q330 -190 304 -196Z" fill="#C9A882" stroke="${L}" stroke-width="3.5"/><ellipse cx="352" cy="-212" rx="10" ry="7" fill="#1D1D2B"/>`;
        if (rugindo) s += `<path d="M360 -200 Q340 -150 290 -160 Q320 -182 360 -200Z" fill="#7A1A1A" stroke="${L}" stroke-width="4"/><path d="M350 -196 l-4 12 -6 -10" fill="#fff" stroke="${L}" stroke-width="2"/>`;
        s += `<circle cx="280" cy="-244" r="7" fill="${L}"/><circle cx="278" cy="-246" r="2.2" fill="#fff"/><circle cx="236" cy="-282" r="18" fill="${tom(cor, -0.1)}" stroke="${L}" stroke-width="4"/><circle cx="236" cy="-282" r="8" fill="${tom(cor, -0.5)}"/></g>`;
        return pos(x, y, k, s);
      },

      // ===================== HOJE / APOCALIPSE =====================
      // revólver (de lado, cano para a direita): tambor com 6 câmaras, cano, mira, gatilho, cabo de madeira; origem = cabo (mão)
      revolver: (x, y, k = 1) => {
        const mt = metal(false), mad = lin([[0, '#9A6A3A'], [1, '#5A3A1E']], 0, 0, 1, 0);
        let s = `<defs>${mt.def}${mad.def}</defs>`;
        s += `<path d="M-30 -4 L-50 70 Q-52 84 -36 86 L-6 86 Q6 84 6 70 L14 0Z" fill="${mad.id}" stroke="${L}" stroke-width="4"/>${[0, 1, 2, 3].map(i => `<path d="M${-36 + i * 6} ${20 + i * 12} l20 0" stroke="#3A2414" stroke-width="2"/>`).join('')}`;
        s += `<path d="M-6 6 Q2 34 18 30" stroke="${L}" stroke-width="5" fill="none"/><path d="M-6 6 Q2 34 18 30 L22 10Z" fill="none"/><path d="M4 8 q4 14 -4 18" stroke="#5E666E" stroke-width="4" fill="none"/>`;   // gatilho e guarda
        s += `<rect x="-40" y="-30" width="70" height="36" rx="8" fill="${mt.id}" stroke="${L}" stroke-width="4"/>`;
        s += `<rect x="-8" y="-38" width="54" height="44" rx="10" fill="#8A9098" stroke="${L}" stroke-width="4"/>${[0, 1, 2].map(i => `<path d="M${-2 + i * 16} -36 V2" stroke="#5E666E" stroke-width="3"/>`).join('')}`;   // tambor
        s += `<rect x="40" y="-30" width="120" height="18" rx="4" fill="${mt.id}" stroke="${L}" stroke-width="4"/><rect x="40" y="-14" width="90" height="10" rx="3" fill="#6E747C" stroke="${L}" stroke-width="3"/><rect x="146" y="-40" width="8" height="12" fill="#5E666E" stroke="${L}" stroke-width="2"/>`;
        s += `<path d="M-46 -30 l-18 -10 l6 14Z" fill="#5E666E" stroke="${L}" stroke-width="3"/><path d="M-30 -24 H150" stroke="#fff" stroke-width="3" opacity=".6"/>`;
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${s}</g>`;
      },

      // pé de cabra (alavanca de ferro): haste hexagonal pintada, ponta em gancho com fenda, ponta chata; origem = meio (mão)
      peDeCabra: (x, y, k = 1, { cor = '#C8302E' } = {}) => {
        let s = `<path d="M0 220 L0 -200 Q0 -260 -50 -270 Q-90 -270 -100 -236" stroke="${L}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M0 220 L0 -200 Q0 -260 -50 -270 Q-90 -270 -100 -236" stroke="${cor}" stroke-width="20" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M-6 200 L-6 -190 Q-6 -250 -50 -260" stroke="#fff" stroke-width="5" fill="none" opacity=".45"/>`;
        s += `<path d="M-100 -236 l-12 22 l14 -6 l10 10Z" fill="#9AA0A8" stroke="${L}" stroke-width="3"/><path d="M-96 -250 l-10 30" stroke="${L}" stroke-width="3"/>`;   // fenda do gancho
        s += `<path d="M-10 200 L10 200 L18 250 L-4 250Z" fill="#9AA0A8" stroke="${L}" stroke-width="4"/>`;   // ponta chata
        s += pontos(10, -8, 8, -150, 180, '#7A2A1A', 1.5, 3, 0.3, 0.6);   // tinta descascada
        return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${s}</g>`;
      },

      // bicicleta (de lado, para a direita): quadro, 2 rodas com raios, guidão, selim, corrente e coroa; origem = chão no meio
      bicicleta: (x, y, k = 1, { cor = '#2E7D4A', raios = 0, pedal = 0 } = {}) => {
        let s = contato(200, 10, 0.25);
        const roda = (cx) => `<g class="roda" data-cx="${cx}" data-cy="-90" data-r="88" transform="rotate(${f(raios)} ${cx} -90)"><circle cx="${cx}" cy="-90" r="88" fill="none" stroke="#22252A" stroke-width="14"/><circle cx="${cx}" cy="-90" r="80" fill="none" stroke="#5A5A62" stroke-width="3"/>${[...Array(12)].map((_, i) => `<path d="M${cx} -90 l${f(Math.cos(i / 12 * Math.PI * 2) * 80)} ${f(Math.sin(i / 12 * Math.PI * 2) * 80)}" stroke="#B9BEC6" stroke-width="2"/>`).join('')}<circle cx="${cx}" cy="-90" r="10" fill="#9AA0A8" stroke="${L}" stroke-width="3"/></g>`;
        s += roda(-150) + roda(150);
        s += `<path d="M-150 -90 L-30 -90 L60 -210 L-70 -210 Z M-30 -90 L-80 -230 M60 -210 L150 -90 M60 -210 L70 -250" stroke="${L}" stroke-width="16" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M-150 -90 L-30 -90 L60 -210 L-70 -210 Z M-30 -90 L-80 -230 M60 -210 L150 -90 M60 -210 L70 -250" stroke="${cor}" stroke-width="9" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
        s += `<path d="M-112 -238 H-50" stroke="${L}" stroke-width="14" stroke-linecap="round"/><path d="M50 -258 Q80 -262 96 -244" stroke="${L}" stroke-width="10" fill="none" stroke-linecap="round"/>`;   // selim e guidão
        s += `<circle cx="-30" cy="-90" r="22" fill="#9AA0A8" stroke="${L}" stroke-width="4"/><path d="M-30 -112 L-150 -98 M-30 -68 L-150 -82" stroke="#5A5A62" stroke-width="3"/><g class="pedivela" data-cx="-30" data-cy="-90" transform="rotate(${f(pedal)} -30 -90)"><path d="M-30 -90 h32 M-30 -90 h-32" stroke="${L}" stroke-width="6" stroke-linecap="round"/><rect x="-6" y="-95" width="16" height="8" rx="2" fill="#22252A" transform="translate(32 0)"/><rect x="-6" y="-95" width="16" height="8" rx="2" fill="#22252A" transform="translate(-60 0)"/></g>`;
        return pos(x, y, k, s);
      },

      // ===================== MERCADO =====================
      // pacote de arroz (plástico em pé): emenda soldada em cima com serrilha, janela mostrando os grãos, faixa do rótulo, vincos do plástico
      pacoteArroz: (x, y, k = 1, { cor = '#1F5FAF', nome = 'ARROZ', peso = '5 kg' } = {}) => {
        const corpo = 'M-96 -268 Q-104 -150 -102 -14 Q-60 4 0 4 Q60 4 102 -14 Q104 -150 96 -268 Z';
        const c = clip(corpo), gv = lin([[0, '#FFFFFF'], [0.55, '#EEF0F2'], [1, '#B9C0C8']], 0, 0, 1, 0);
        let s = `<defs>${c.def}${gv.def}</defs>` + contato(110, 12, 0.3);
        s += `<path d="${corpo}" fill="${gv.id}" stroke="${L}" stroke-width="6"/>`;
        s += `<g clip-path="${c.id}">`;
        // janela transparente com grãos (arroz = bastonetes claros com sombra)
        s += `<rect x="-70" y="-120" width="140" height="92" rx="14" fill="#F3EBD8" stroke="${tom('#F3EBD8', -0.3)}" stroke-width="3"/>`;
        for (let i = 0; i < 70; i++) { const gx = rnd(-62, 62), gy = rnd(-112, -36), a = rnd(0, 180); s += `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="5" ry="2" transform="rotate(${f(a)} ${f(gx)} ${f(gy)})" fill="${rnd() < 0.5 ? '#FFFDF6' : '#E8DCC0'}" stroke="#C9B994" stroke-width=".8"/>`; }
        s += `<path d="M-60 -116 L-30 -36" stroke="#fff" stroke-width="9" opacity=".45"/>`;
        // faixa do rótulo
        s += `<rect x="-120" y="-232" width="240" height="96" fill="${cor}"/><rect x="-120" y="-232" width="240" height="12" fill="${tom(cor, 0.25)}"/><rect x="-120" y="-148" width="240" height="12" fill="${tom(cor, -0.35)}"/>`;
        s += `<path d="M-120 -146 Q0 -128 120 -146" stroke="#E8B400" stroke-width="7" fill="none"/>`;
        // lado escuro (volume) e vincos
        s += `<path d="M58 -268 Q70 -140 66 -6 L120 -6 L120 -268Z" fill="#000" opacity=".12"/><path d="M-80 -260 Q-86 -150 -84 -20" stroke="#fff" stroke-width="10" opacity=".55" fill="none"/>`;
        s += [[-40, -250, -10, -238], [30, -40, 60, -24], [-70, -60, -46, -30]].map(([a, b, c2, d]) => `<path d="M${a} ${b} L${c2} ${d}" stroke="#9AA3AD" stroke-width="2.5" opacity=".7"/>`).join('');
        s += `</g>`;
        // emenda soldada em cima (serrilha) e furinho de pendurar
        s += `<path d="M-98 -268 L98 -268 L98 -296 L-98 -296Z" fill="#E3E7EB" stroke="${L}" stroke-width="5"/>` + [...Array(14)].map((_, i) => `<path d="M${-92 + i * 13.2} -294 v24" stroke="#B4BCC4" stroke-width="2"/>`).join('') + `<ellipse cx="0" cy="-284" rx="14" ry="6" fill="#B4BCC4" stroke="${L}" stroke-width="2.5"/>`;
        const txt = T(0, -186, nome, { fs: 44, cor: '#fff', peso: 900, fonte: "'Anton', 'DejaVu Sans Condensed', sans-serif" }) + T(0, -152, 'TIPO 1', { fs: 18, cor: '#FFE27A', peso: 700 })
          + `<g><circle cx="${luz > 0 ? -62 : 62}" cy="-70" r="30" fill="#E8B400" stroke="${L}" stroke-width="4"/>${T(62, -62, peso, { fs: 20, cor: L, peso: 900 })}</g>`;
        return pos(x, y, k, s, txt);
      },

      // pacote de feijão (plástico transparente): grãos marrons rajados aparecendo, rótulo vermelho, emenda com serrilha
      pacoteFeijao: (x, y, k = 1, { cor = '#C8282E', nome = 'FEIJÃO', peso = '1 kg' } = {}) => {
        const corpo = 'M-72 -200 Q-80 -110 -78 -12 Q-40 4 0 4 Q40 4 78 -12 Q80 -110 72 -200 Z';
        const c = clip(corpo), gb = lin([[0, '#9A5A36'], [1, '#5E321D']], 0, 0, 1, 0);
        let s = `<defs>${c.def}${gb.def}</defs>` + contato(84, 10, 0.3);
        s += `<path d="${corpo}" fill="${gb.id}" stroke="${L}" stroke-width="6"/>`;
        s += `<g clip-path="${c.id}">`;
        for (let i = 0; i < 95; i++) {                   // feijão carioca: bege com rajas marrons
          const gx = rnd(-76, 76), gy = rnd(-196, 0), a = rnd(0, 180), base = rnd() < 0.7 ? '#C99A6A' : '#B07A4C';
          s += `<g transform="rotate(${f(a)} ${f(gx)} ${f(gy)})"><ellipse cx="${f(gx)}" cy="${f(gy)}" rx="9" ry="6" fill="${base}" stroke="#5E321D" stroke-width="1.2"/><path d="M${f(gx - 5)} ${f(gy - 2)} q4 3 9 0" stroke="#7A4526" stroke-width="1.6" fill="none"/></g>`;
        }
        s += `<rect x="-90" y="-176" width="180" height="70" fill="${cor}"/><rect x="-90" y="-176" width="180" height="10" fill="${tom(cor, 0.25)}"/><path d="M-90 -104 Q0 -92 90 -104" stroke="#FFD23F" stroke-width="6" fill="none"/>`;
        s += `<path d="M40 -200 Q50 -100 48 -6 L90 -6 L90 -200Z" fill="#000" opacity=".18"/><path d="M-58 -96 Q-62 -50 -60 -18" stroke="#fff" stroke-width="8" opacity=".5" fill="none"/><path d="M-60 -196 L-40 -186" stroke="#fff" stroke-width="5" opacity=".5"/>`;
        s += `</g>`;
        s += `<path d="M-74 -200 L74 -200 L74 -222 L-74 -222Z" fill="#E3E7EB" stroke="${L}" stroke-width="5"/>` + [...Array(11)].map((_, i) => `<path d="M${-68 + i * 13.6} -220 v18" stroke="#B4BCC4" stroke-width="2"/>`).join('');
        const txt = T(0, -128, nome, { fs: 36, cor: '#fff', peso: 900, fonte: "'Anton', 'DejaVu Sans Condensed', sans-serif" }) + T(0, -60, peso, { fs: 22, cor: '#fff', peso: 900, extra: `stroke="${L}" stroke-width="5" paint-order="stroke"` });
        return pos(x, y, k, s, txt);
      },

      // bandeja de ovos (papelão moldado, 2 × 6, vista de cima em ângulo): ovos com brilho e pintinhas, divisórias, borda da bandeja
      bandejaOvos: (x, y, k = 1, { cor = '#C9B79A', ovo = '#F3E2C8', faltando = 0 } = {}) => {
        const gb = lin([[0, tom(cor, 0.15)], [1, tom(cor, -0.3)]]);
        let s = `<defs>${gb.def}</defs>` + contato(170, 12, 0.3);
        s += `<path d="M-165 -70 L165 -70 L150 -6 L-150 -6Z" fill="${gb.id}" stroke="${L}" stroke-width="5"/>`;      // laterais
        s += `<path d="M-165 -70 L165 -70 L140 -118 L-140 -118Z" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="5"/>`; // tampo
        for (let i = 0; i < 6; i++) s += `<path d="M${-150 + i * 55 + 27} -64 q0 40 0 52" stroke="${tom(cor, -0.35)}" stroke-width="3" opacity=".7"/>`;
        let n = 0;
        [0, 1].forEach(row => {                           // fileira de trás primeiro
          for (let i = 0; i < 6; i++) {
            if (n++ < faltando) continue;
            const ex = (-125 + i * 50) * (row ? 1.06 : 0.92), ey = row ? -66 : -100, r = row ? 24 : 21;
            const go = rad([[0, '#FFFFFF'], [0.45, ovo], [1, tom(ovo, -0.3)]], 0.35, 0.3, 0.75);
            s += `<defs>${go.def}</defs><ellipse cx="${f(ex)}" cy="${f(ey + r * 0.35)}" rx="${f(r * 1.05)}" ry="${f(r * 0.45)}" fill="${tom(cor, -0.45)}" opacity=".6"/>`;
            s += `<ellipse cx="${f(ex)}" cy="${f(ey - r * 0.25)}" rx="${f(r * 0.86)}" ry="${f(r * 1.08)}" fill="${go.id}" stroke="${L}" stroke-width="3.5"/><ellipse cx="${f(ex - r * 0.3)}" cy="${f(ey - r * 0.7)}" rx="${f(r * 0.18)}" ry="${f(r * 0.28)}" fill="#fff" opacity=".85"/>`;
            s += pontos(3, ex - r * 0.5, ex + r * 0.5, ey - r, ey + r * 0.3, tom(ovo, -0.4), 0.8, 1.6, 0.4, 0.7);
          }
        });
        s += `<path d="M-150 -6 L150 -6" stroke="${tom(cor, -0.5)}" stroke-width="3"/><path d="M-160 -60 L-148 -12" stroke="#fff" stroke-width="4" opacity=".4"/>`;
        return pos(x, y, k, s);
      },

      // saco de pão (papel pardo): dobra na boca, vincos, pães franceses saindo, mancha de gordura
      sacoPao: (x, y, k = 1, { paes = 3 } = {}) => {
        const corpo = 'M-86 -230 L86 -230 L94 -8 Q0 6 -94 -8 Z';
        const c = clip(corpo), gp = lin([[0, '#E2B98A'], [0.5, '#D3A574'], [1, '#A97C4E']], 0, 0, 1, 0);
        let s = `<defs>${c.def}${gp.def}</defs>` + contato(100, 11, 0.3);
        // pães atrás da boca do saco (desenhados antes do papel da frente)
        const dp = Detalhes({ luz: -1, seed: seed + 11, prefixo: prefixo + 'sp', sombra: false });   // o saco inteiro já espelha em pos()
        const pos3 = [[-40, -222, -18, 0.42], [30, -238, 14, 0.44], [-5, -258, -4, 0.4]];
        for (let i = 0; i < Math.min(paes, 3); i++) { const [px, py, rot, kk] = pos3[i]; s += `<g transform="rotate(${rot} ${px} ${py})">${dp.paoFrances(px, py, kk)}</g>`; }
        s += `<path d="${corpo}" fill="${gp.id}" stroke="${L}" stroke-width="6"/>`;
        s += `<g clip-path="${c.id}">`;
        s += `<path d="M-86 -230 L86 -230 L88 -196 L-88 -196Z" fill="${tom('#D3A574', -0.18)}"/><path d="M-88 -196 L88 -196" stroke="${tom('#D3A574', -0.4)}" stroke-width="3"/>`;   // dobra
        s += [[-50, -180, -54, -20], [10, -186, 6, -12], [52, -182, 58, -18]].map(([a, b, c2, d]) => `<path d="M${a} ${b} L${c2} ${d}" stroke="${tom('#D3A574', -0.25)}" stroke-width="2.5" opacity=".7"/>`).join('');
        s += `<ellipse cx="34" cy="-80" rx="26" ry="18" fill="#8E6236" opacity=".25"/>`;    // mancha de gordura
        s += `<path d="M-70 -186 L-74 -24" stroke="#fff" stroke-width="7" opacity=".3"/>`;
        s += pontos(40, -80, 80, -190, -14, '#8E6236', 0.6, 1.6, 0.15, 0.35);
        s += `</g>`;
        const txt = T(0, -110, 'PADARIA', { fs: 24, cor: '#8E3B12', peso: 900, fonte: "'Anton', 'DejaVu Sans Condensed', sans-serif" });
        return pos(x, y, k, s, txt);
      },

      // moto (de lado, para a direita): tanque, banco, motor, escapamento, farol, rodas largas; fumaça opcional
      moto: (x, y, k = 1, { cor = '#D7263D', fumaca = false } = {}) => {
        const g = lin([[0, tom(cor, 0.3)], [1, tom(cor, -0.35)]]);
        let s = `<defs>${g.def}</defs>` + contato(220, 12, 0.3);
        const roda = cx => `<g class="roda" data-cx="${cx}" data-cy="-80" data-r="80"><circle cx="${cx}" cy="-80" r="80" fill="#22252A" stroke="${L}" stroke-width="6"/><circle cx="${cx}" cy="-80" r="44" fill="#9AA0A8" stroke="${L}" stroke-width="4"/>${[...Array(6)].map((_, i) => `<path d="M${cx} -80 l${f(Math.cos(i / 6 * Math.PI * 2) * 40)} ${f(Math.sin(i / 6 * Math.PI * 2) * 40)}" stroke="#5E666E" stroke-width="5"/>`).join('')}</g>`;
        s += roda(-170) + roda(170);
        s += `<path d="M-170 -80 L-60 -150 M170 -80 L110 -250" stroke="${L}" stroke-width="16" stroke-linecap="round"/><path d="M-170 -80 L-60 -150 M170 -80 L110 -250" stroke="#8A9098" stroke-width="9" stroke-linecap="round"/>`;
        s += `<rect x="-90" y="-150" width="130" height="80" rx="14" fill="#3A3F45" stroke="${L}" stroke-width="5"/>${[0, 1, 2, 3].map(i => `<path d="M${-80 + i * 30} -148 v76" stroke="#5E666E" stroke-width="4"/>`).join('')}`;   // motor
        s += `<path d="M-60 -100 L-230 -110 L-236 -90 L-60 -78Z" fill="#B9BEC6" stroke="${L}" stroke-width="4"/>`;   // escapamento
        s += `<path d="M-20 -190 Q20 -240 100 -220 L110 -170 Q40 -150 -20 -160Z" fill="${g.id}" stroke="${L}" stroke-width="5"/><path d="M0 -200 Q40 -228 90 -214" stroke="#fff" stroke-width="5" opacity=".5" fill="none"/>`;   // tanque
        s += `<path d="M-150 -180 Q-90 -200 -20 -186 L-20 -164 Q-90 -170 -150 -160Z" fill="#22252A" stroke="${L}" stroke-width="5"/>`;   // banco
        s += `<path d="M100 -250 L140 -262" stroke="${L}" stroke-width="10" stroke-linecap="round"/><ellipse cx="140" cy="-220" rx="20" ry="24" fill="#FFE27A" stroke="${L}" stroke-width="4"/>`;
        if (fumaca) s += [0, 1, 2].map(i => `<circle cx="${-260 - i * 50}" cy="${-110 - i * 20}" r="${20 + i * 12}" fill="#8A8A90" opacity="${0.6 - i * 0.15}"/>`).join('');
        return pos(x, y, k, s);
      },
    };
    // Pontos de contato dos veículos (unidades do desenho, origem = chão no meio; multiplique por k).
    // Usados pela pose 'montar' do boneco (skill fisica-de-cena): quadril no assento, pé na pedaleira/pedal, mãos no guidão.
    D.pontos = {
      moto: { assento: [-80, -188], pe: [-40, -74], guidao: [118, -256] },
      bicicleta: { assento: [-80, -246], pedivela: { c: [-30, -90], r: 32 }, guidao: [92, -248] },
    };
    // ponto do veículo já posicionado: D.ponto('moto', 'guidao', k) → [x, y] no grupo do veículo
    D.ponto = (obj, nome, k = 1) => { const v = D.pontos[obj][nome]; return v.c ? { ...v, c: [v.c[0] * k, v.c[1] * k], r: v.r * k } : [v[0] * k, v[1] * k]; };
    D.lista = Object.keys(D).filter(k => typeof D[k] === 'function' && !['tom', 'mix', 'rnd', 'escala', 'ponto'].includes(k));
    return D;
  }
  global.Detalhes = Detalhes;
})(typeof window !== 'undefined' ? window : globalThis);
