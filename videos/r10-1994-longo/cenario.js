/*
  cenario.js — peças de cenário ilustrado em SVG (skill "cenario-ilustrado").
  Cada função devolve uma string SVG. Determinístico: mesma semente → mesmo desenho.

  const C = Cenario({ seed: 7, luz: 1, hora: 'dia' });   // luz: +1 vem da direita, -1 da esquerda
  svg.innerHTML = C.defs() + C.ceu(...) + C.distante(...) + C.insula(...) + C.calcada(...) + C.atmosfera(...);

  Regras que as peças seguem (ver SKILL.md): luz de um lado só (3 tons por volume), sombra
  projetada para o lado oposto à luz, profundidade com névoa (camadas de trás mais claras e
  menos saturadas), textura com variação (nada de padrão perfeito), desgaste e sinais de vida.
*/
(function (global) {
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // ---------- cor ----------
  const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgb2hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, u) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * u)); };
  const tom = (c, k) => (k >= 0 ? mix(c, '#FFF6E6', k) : mix(c, '#1A1424', -k));   // k>0 clareia (luz quente), k<0 escurece (sombra fria)
  const f1 = v => (Math.round(v * 10) / 10);

  // Paletas por hora do dia: céu (topo, horizonte), névoa, cor da luz, cor da sombra, intensidade
  const HORAS = {
    dia:       { ceu: ['#4FA8E8', '#CDEBFF'], nevoa: '#D7EEFF', luz: '#FFF4D6', sombra: '#2A2550', forca: 1 },
    tarde:     { ceu: ['#5C9FE0', '#FFE2B0'], nevoa: '#FBE6C8', luz: '#FFD9A0', sombra: '#3A2440', forca: 1 },
    amanhecer: { ceu: ['#F49C78', '#FFEBC4'], nevoa: '#FBD9B8', luz: '#FFD3A8', sombra: '#4A2D45', forca: 0.8 },
    noite:     { ceu: ['#0B0F2A', '#2D3168'], nevoa: '#3A3F78', luz: '#9FB3FF', sombra: '#05060F', forca: 0.5 },
    interior:  { ceu: ['#6B5A48', '#9C8A70'], nevoa: '#B9A68A', luz: '#FFE2A8', sombra: '#2A1E18', forca: 0.7 }
  };

  const MAT_PADRAO = { reboco: '#E3C9A0', reboco2: '#D9B48A', tijolo: '#B5654A', telha: '#C8553D', madeira: '#8A5A33', pedra: '#B3A894',
    marmore: '#EDE3CF', travertino: '#CDB591', calcada: '#A49B8C', piso: '#9A9387', vegetacao: '#3E6B45', cipreste: '#2F5A3A',
    ceramica: '#B8613A', distante: '#B79E83', ceu: null };
  function Cenario(opts = {}) {
    const R = mulberry32(opts.seed ?? 1);
    const rnd = (a = 0, b = 1) => a + (b - a) * R();
    const pick = arr => arr[Math.floor(R() * arr.length)];
    const luz = opts.luz ?? 1;
    // paleta de época (skill paleta-de-epoca): materiais + clima do céu
    const PAL = global.Paleta;
    const MAT = PAL && opts.epoca ? PAL.materiais(opts.epoca) : MAT_PADRAO;
    const horaNome = opts.hora || 'dia';
    const clima = PAL && PAL.CLIMAS[opts.clima || MAT.ceu];
    const H = { ...HORAS[horaNome], ...((clima && horaNome === 'dia' && clima.dia) || {}) };
    // luz quente nas partes iluminadas, sombra puxando para a cor fria do céu (color-expert: spectral bias)
    const tom = (c, k) => (k >= 0 ? mix(c, H.luz, k * 0.9) : mix(c, H.sombra, -k));
    const id = (opts.prefixo || 'cn') + Math.floor(rnd(1000, 9999));
    const C = { rnd, pick, tom, mix, luz, hora: H, id, mat: MAT };

    // ---------- defs: gradientes, grão, vinheta ----------
    C.defs = () => `
      <linearGradient id="${id}-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${H.ceu[0]}"/><stop offset="1" stop-color="${H.ceu[1]}"/></linearGradient>
      <linearGradient id="${id}-nevoa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${H.nevoa}" stop-opacity="0"/><stop offset="1" stop-color="${H.nevoa}" stop-opacity=".75"/></linearGradient>
      <linearGradient id="${id}-sujeira" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2A1E" stop-opacity="0"/><stop offset="1" stop-color="#3B2A1E" stop-opacity=".38"/></linearGradient>
      <linearGradient id="${id}-beiral" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${H.sombra}" stop-opacity=".45"/><stop offset="1" stop-color="${H.sombra}" stop-opacity="0"/></linearGradient>
      <radialGradient id="${id}-vinheta" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
      <radialGradient id="${id}-brilho" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${H.luz}" stop-opacity=".9"/><stop offset="1" stop-color="${H.luz}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fogo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFB347" stop-opacity=".9"/><stop offset="1" stop-color="#FF6A2B" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-luzParede" x1="${luz > 0 ? 1 : 0}" y1="0" x2="${luz > 0 ? 0 : 1}" y2="0"><stop offset="0" stop-color="${H.luz}" stop-opacity=".28"/><stop offset=".6" stop-color="${H.luz}" stop-opacity="0"/><stop offset="1" stop-color="${H.sombra}" stop-opacity=".18"/></linearGradient>
      <filter id="${id}-grao" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${opts.seed ?? 1}" result="r"/>
        <feColorMatrix in="r" type="matrix" values="0 0 0 0 .1  0 0 0 0 .08  0 0 0 0 .06  0 0 0 -1.6 .9" result="g"/>
        <feComposite in="g" in2="SourceGraphic" operator="in"/>
      </filter>
      <filter id="${id}-suave"><feGaussianBlur stdDeviation="6"/></filter>`;

    // ---------- céu ----------
    C.ceu = ({ w = 1080, h = 1920, astro = true, nuvens = 4, astroX, astroY } = {}) => {
      let s = `<rect width="${w}" height="${h}" fill="url(#${id}-ceu)"/>`;
      const noite = H === HORAS.noite;
      if (noite) for (let i = 0; i < 60; i++) s += `<circle cx="${f1(rnd(0, w))}" cy="${f1(rnd(0, h * 0.45))}" r="${f1(rnd(1, 3.2))}" fill="#FFF" opacity="${f1(rnd(0.35, 1))}"/>`;
      if (astro) {
        const ax = astroX ?? (luz > 0 ? w * 0.8 : w * 0.2), ay = astroY ?? h * 0.12;
        s += noite
          ? `<circle cx="${ax}" cy="${ay}" r="160" fill="url(#${id}-brilho)" opacity=".5"/><circle cx="${ax}" cy="${ay}" r="64" fill="#FFF4C9"/><circle cx="${ax + 26}" cy="${ay - 14}" r="56" fill="${H.ceu[0]}"/><circle cx="${ax - 22}" cy="${ay + 14}" r="7" fill="#E8DDB0"/>`
          : `<circle cx="${ax}" cy="${ay}" r="260" fill="url(#${id}-brilho)" opacity=".55"/><circle cx="${ax}" cy="${ay}" r="70" fill="${tom('#FFD45A', 0.15)}"/><circle cx="${ax - 16}" cy="${ay - 16}" r="40" fill="#FFF0A8" opacity=".6"/>`;
      }
      for (let i = 0; i < nuvens; i++) s += C.nuvem(rnd(-60, w), rnd(h * 0.05, h * 0.28), rnd(0.6, 1.3));
      return s;
    };
    C.nuvem = (x, y, k = 1) => {
      const base = H === HORAS.noite ? '#4A4F86' : '#FFFFFF', somb = H === HORAS.noite ? '#2E3266' : mix('#FFFFFF', H.ceu[0], 0.35);
      const bolhas = [[0, 0, 70], [60, -26, 56], [118, -6, 62], [170, 10, 44], [-56, 10, 46]];
      let s = `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(k)})" opacity=".95">`;
      s += bolhas.map(([dx, dy, r]) => `<circle cx="${dx}" cy="${dy + 10}" r="${r}" fill="${somb}"/>`).join('');
      s += bolhas.map(([dx, dy, r]) => `<circle cx="${dx - luz * 6}" cy="${dy}" r="${r * 0.92}" fill="${base}"/>`).join('');
      return s + `<rect x="-110" y="20" width="330" height="60" fill="${somb}" opacity="0"/></g>`;
    };

    // ---------- camadas distantes (perspectiva atmosférica) ----------
    // tipo: 'colinas' | 'roma' (silhueta com Coliseu, templo, cúpula, ciprestes) ; profundidade 0 (longe) … 1 (perto)
    C.distante = ({ y, w = 1080, tipo = 'roma', profundidade = 0.3, cor = MAT.distante } = {}) => {
      const c = mix(cor, H.nevoa, 0.75 - profundidade * 0.5);
      const c2 = mix(c, H.nevoa, 0.25);
      let s = `<g>`;
      if (tipo === 'colinas') {
        let d = `M0 ${y}`; for (let x = 0; x <= w; x += 120) d += ` Q${x + 60} ${f1(y - rnd(30, 110))} ${x + 120} ${f1(y - rnd(0, 40))}`;
        s += `<path d="${d} V${y + 600} H0Z" fill="${c}"/>`;
      } else {
        let x = -20;
        while (x < w) {
          const tipoP = pick(['casa', 'casa', 'torre', 'templo', 'cupula', 'cipreste', 'pinheiro', 'casa']);
          const hh = rnd(60, 150);
          if (tipoP === 'casa') { const ww = rnd(70, 140); s += `<rect x="${f1(x)}" y="${f1(y - hh)}" width="${f1(ww)}" height="${f1(hh + 400)}" fill="${pick([c, c2])}"/><path d="M${f1(x - 6)} ${f1(y - hh)} L${f1(x + ww / 2)} ${f1(y - hh - 22)} L${f1(x + ww + 6)} ${f1(y - hh)}Z" fill="${mix(c, '#B5503A', 0.25)}"/>`; x += ww - 4; }
          else if (tipoP === 'torre') { const ww = rnd(40, 60); s += `<rect x="${f1(x)}" y="${f1(y - hh - 60)}" width="${f1(ww)}" height="${f1(hh + 460)}" fill="${c2}"/>`; x += ww; }
          else if (tipoP === 'templo') { const ww = 150; s += `<path d="M${f1(x)} ${f1(y - 120)} L${f1(x + ww / 2)} ${f1(y - 165)} L${f1(x + ww)} ${f1(y - 120)}Z" fill="${c2}"/>` + [0, 1, 2, 3, 4].map(k => `<rect x="${f1(x + 10 + k * 30)}" y="${f1(y - 118)}" width="12" height="130" fill="${c2}"/>`).join('') + `<rect x="${f1(x)}" y="${f1(y + 10)}" width="${ww}" height="400" fill="${c}"/>`; x += ww + 10; }
          else if (tipoP === 'cupula') { const ww = 120; s += `<rect x="${f1(x)}" y="${f1(y - 90)}" width="${ww}" height="500" fill="${c}"/><path d="M${f1(x)} ${f1(y - 90)} A${ww / 2} ${ww / 2.4} 0 0 1 ${f1(x + ww)} ${f1(y - 90)}Z" fill="${c2}"/>`; x += ww; }
          else if (tipoP === 'cipreste') { s += `<path d="M${f1(x + 15)} ${f1(y + 10)} Q${f1(x - 6)} ${f1(y - 80)} ${f1(x + 15)} ${f1(y - hh - 40)} Q${f1(x + 36)} ${f1(y - 80)} ${f1(x + 15)} ${f1(y + 10)}Z" fill="${mix(c, '#2F5A3A', 0.35)}"/>`; x += 30; }
          else { s += `<rect x="${f1(x + 30)}" y="${f1(y - hh)}" width="6" height="${f1(hh)}" fill="${c2}"/><ellipse cx="${f1(x + 33)}" cy="${f1(y - hh)}" rx="50" ry="20" fill="${mix(c, '#3E6B45', 0.35)}"/>`; x += 66; }
        }
      }
      return s + `<rect x="0" y="${y - 200}" width="${w}" height="${600}" fill="url(#${id}-nevoa)" opacity="${f1(0.6 - profundidade * 0.4)}"/></g>`;
    };

    // ---------- parede de reboco com tijolo aparecendo, manchas e rachaduras ----------
    C.parede = ({ x, y, w, h, cor = MAT.reboco, tijolo = MAT.tijolo, desgaste = 1, recorte } = {}) => {
      const clip = `${id}-p${Math.floor(rnd(1e5, 1e6))}`;
      let s = `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${clip})">`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}"/>`;
      // variação suave de tom (manchas grandes)
      for (let i = 0; i < 5 * desgaste; i++) s += `<ellipse cx="${f1(rnd(x, x + w))}" cy="${f1(rnd(y, y + h))}" rx="${f1(rnd(40, 140))}" ry="${f1(rnd(30, 90))}" fill="${tom(cor, rnd(-0.12, 0.06))}" opacity=".55"/>`;
      // reboco caído mostrando tijolo romano (opus latericium)
      for (let i = 0; i < 3 * desgaste; i++) {
        const px = rnd(x, x + w - 80), py = rnd(y + 20, y + h - 60), pw = rnd(60, 130), ph = rnd(36, 70);
        let d = `M${f1(px)} ${f1(py + ph / 2)}`; for (let k = 1; k <= 10; k++) { const a = k / 10 * Math.PI * 2; d += ` L${f1(px + pw / 2 + Math.cos(a) * pw / 2 * rnd(0.75, 1))} ${f1(py + ph / 2 + Math.sin(a) * ph / 2 * rnd(0.7, 1))}`; }
        s += `<path d="${d}Z" fill="${tijolo}"/>`;
        for (let ry = py + 4; ry < py + ph; ry += 12) for (let rx = px + ((ry / 12) % 2) * 14; rx < px + pw; rx += 28) s += `<rect x="${f1(rx)}" y="${f1(ry)}" width="24" height="8" rx="1.5" fill="${tom(tijolo, rnd(-0.15, 0.1))}"/>`;
        s += `<path d="${d}Z" fill="none" stroke="${tom(cor, -0.35)}" stroke-width="3"/>`;
      }
      // rachaduras
      for (let i = 0; i < 3 * desgaste; i++) { let cx = rnd(x, x + w), cy = rnd(y, y + h), d = `M${f1(cx)} ${f1(cy)}`; for (let k = 0; k < 5; k++) { cx += rnd(-18, 18); cy += rnd(8, 26); d += ` L${f1(cx)} ${f1(cy)}`; } s += `<path d="${d}" stroke="${tom(cor, -0.45)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`; }
      // sujeira subindo do chão
      s += `<rect x="${x}" y="${f1(y + h * 0.72)}" width="${w}" height="${f1(h * 0.28)}" fill="url(#${id}-sujeira)"/>`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}-luzParede)"/>`;
      return s + `</g>`;
    };

    // ---------- janela romana: vão fundo, peitoril, verga, venezianas, vaso opcional ----------
    C.janela = ({ x, y, w = 130, h = 150, cor = MAT.reboco, madeira = MAT.madeira, aberta = true, vaso = false, noite = false, luzAcesa = false } = {}) => {
      const fundo = luzAcesa ? '#FFD27A' : noite ? '#0E0C18' : '#2A1C14';
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fundo}"/>`;
      if (luzAcesa) s += `<rect x="${x - w * 0.6}" y="${y - h * 0.4}" width="${w * 2.2}" height="${h * 1.8}" fill="url(#${id}-brilho)" opacity=".5"/>`;
      // sombra interna (o vão é fundo): lado da luz projeta sombra para dentro
      if (!luzAcesa) s += `<path d="M${x} ${y} H${x + w} V${y + 18} H${luz > 0 ? x + 16 : x} V${y + h} H${luz > 0 ? x : x + w - 16}" fill="#000" opacity=".25"/>`;
      // moldura/verga e peitoril
      s += `<rect x="${x - 10}" y="${y - 16}" width="${w + 20}" height="16" fill="${tom(cor, 0.12)}" stroke="#1D1D2B" stroke-width="4"/>`;
      s += `<rect x="${x - 14}" y="${y + h}" width="${w + 28}" height="14" fill="${tom(cor, 0.18)}" stroke="#1D1D2B" stroke-width="4"/><rect x="${x - 14}" y="${y + h + 14}" width="${w + 28}" height="8" fill="#000" opacity=".18"/>`;
      // venezianas de madeira
      const vs = (vx, lado) => {
        const vw = aberta ? w * 0.42 : w / 2;
        const xx = aberta ? (lado < 0 ? vx - vw - 4 : vx + 4) : vx - (lado < 0 ? vw : 0);
        let v = `<rect x="${f1(xx)}" y="${y}" width="${f1(vw)}" height="${h}" fill="${aberta ? tom(madeira, lado === luz ? 0.1 : -0.12) : madeira}" stroke="#1D1D2B" stroke-width="4"/>`;
        for (let k = y + 14; k < y + h - 6; k += 14) v += `<path d="M${f1(xx + 5)} ${k} H${f1(xx + vw - 5)}" stroke="${tom(madeira, -0.3)}" stroke-width="3"/>`;
        return v;
      };
      s += aberta ? vs(x, -1) + vs(x + w, 1) : vs(x + w / 2, -1) + vs(x + w / 2, 1);
      if (vaso) s += C.vaso(x + w / 2, y + h, pick(['#D7263D', '#F2A541', '#9B7BDB']));
      return s;
    };
    C.vaso = (x, y, flor = '#D7263D') => {
      let s = `<path d="M${x - 34} ${y - 30} H${x + 34} L${x + 26} ${y} H${x - 26}Z" fill="#B8613A" stroke="#1D1D2B" stroke-width="4"/><path d="M${x - 30} ${y - 22} H${x + 30}" stroke="#E7A57E" stroke-width="3"/>`;
      for (let i = 0; i < 7; i++) { const fx = x + rnd(-34, 34), fy = y - 30 - rnd(10, 40); s += `<path d="M${f1(x + (fx - x) * 0.4)} ${y - 30} Q${f1(fx)} ${f1(fy + 20)} ${f1(fx)} ${f1(fy)}" stroke="#3E7B3A" stroke-width="4" fill="none"/><circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(rnd(6, 10))}" fill="${flor}" stroke="#1D1D2B" stroke-width="2.5"/>`; }
      return s;
    };

    // ---------- telhado de telhas romanas (tegula + imbrex) com beiral e sombra ----------
    C.telhado = ({ x, y, w, h = 90, beiral = 30, cor = MAT.telha, duasAguas = true } = {}) => {
      let s = '';
      const x0 = x - beiral, x1 = x + w + beiral, topo = y - h;
      const path = duasAguas ? `M${x0} ${y} L${x + w / 2} ${topo} L${x1} ${y}Z` : `M${x0} ${y} L${x0 + 20} ${topo} L${x1 - 20} ${topo} L${x1} ${y}Z`;
      const clip = `${id}-t${Math.floor(rnd(1e5, 1e6))}`;
      s += `<clipPath id="${clip}"><path d="${path}"/></clipPath><path d="${path}" fill="${cor}"/>`;
      s += `<g clip-path="url(#${clip})">`;
      // fileiras de imbrex (meia-cana) com luz de um lado
      for (let ix = x0; ix < x1; ix += 26) s += `<rect x="${f1(ix)}" y="${topo}" width="14" height="${h + 4}" fill="${tom(cor, 0.12)}"/><rect x="${f1(ix + (luz > 0 ? 9 : 0))}" y="${topo}" width="5" height="${h + 4}" fill="${tom(cor, luz > 0 ? 0.28 : -0.2)}"/>`;
      for (let iy = topo + 18; iy < y; iy += 22) s += `<path d="M${x0} ${f1(iy)} H${x1}" stroke="${tom(cor, -0.3)}" stroke-width="3"/>`;
      // lado da sombra mais escuro
      if (duasAguas) s += `<path d="${luz > 0 ? `M${x0} ${y} L${x + w / 2} ${topo} L${x + w / 2} ${y}Z` : `M${x1} ${y} L${x + w / 2} ${topo} L${x + w / 2} ${y}Z`}" fill="${H.sombra}" opacity=".22"/>`;
      s += `</g><path d="${path}" fill="none" stroke="#1D1D2B" stroke-width="7" stroke-linejoin="round"/>`;
      // sombra do beiral na parede
      s += `<rect x="${x}" y="${y}" width="${w}" height="40" fill="url(#${id}-beiral)"/>`;
      return s;
    };

    // ---------- insula: prédio romano de vários andares ----------
    // janelas: matriz automática; pular: lista "andar-coluna" a não desenhar; lojas no térreo (tabernae) com arcos e balcão
    C.insula = ({ x, base = 1700, w = 600, top = 330, andares = 4, cor = MAT.reboco, telha = MAT.telha, lado = 46, noite = false, luzes = [], pular = [], sacada = 1, varal = false, grafite = null } = {}) => {
      const h = base - top, fh = h / andares;
      let s = '';
      // face lateral (volume): fica do lado oposto à luz, mais escura
      const lx = luz > 0 ? x - lado : x + w;
      s += `<path d="M${lx} ${top + 30} L${lx + lado} ${top} V${base} H${lx}Z" fill="${tom(cor, -0.35)}" stroke="#1D1D2B" stroke-width="5"/>`;
      if (luz < 0) s = `<path d="M${x + w} ${top} L${x + w + lado} ${top + 30} V${base} H${x + w}Z" fill="${tom(cor, -0.35)}" stroke="#1D1D2B" stroke-width="5"/>`;
      s += C.parede({ x, y: top, w, h, cor: noite ? tom(cor, -0.55) : cor, tijolo: noite ? '#4A2A26' : '#B5654A' });
      // faixas entre andares (cornijas) com sombra embaixo
      for (let f = 1; f < andares; f++) { const yy = top + f * fh; s += `<rect x="${x - 6}" y="${f1(yy - 10)}" width="${w + 12}" height="14" fill="${tom(cor, noite ? -0.4 : 0.1)}" stroke="#1D1D2B" stroke-width="4"/><rect x="${x}" y="${f1(yy + 4)}" width="${w}" height="16" fill="#000" opacity=".15"/>`; }
      // janelas
      const nCol = Math.max(1, Math.round(w / 260));
      for (let f = 0; f < andares - 1; f++) for (let k = 0; k < nCol; k++) {
        if (pular.includes(`${f}-${k}`)) continue;
        const ww = Math.min(150, w / nCol - 110), hh = Math.min(180, fh - 120);
        const wx = x + (k + 0.5) * (w / nCol) - ww / 2, wy = top + f * fh + (fh - hh) / 2 + 6;
        s += C.janela({ x: f1(wx), y: f1(wy), w: f1(ww), h: f1(hh), cor, aberta: R() < 0.7, vaso: !noite && R() < 0.45, noite, luzAcesa: luzes.includes(`${f}-${k}`) });
      }
      const ty = top + (andares - 1) * fh;
      // sacada de madeira (maenianum) no 2º andar
      if (sacada) { const sy = top + (andares - 2) * fh + 8; s += C.sacada(x + 20, f1(sy), w - 40); }
      // térreo: tabernae com arcos
      const nA = Math.max(1, Math.round(w / 280));
      for (let k = 0; k < nA; k++) {
        const aw = w / nA - 60, ax = x + 30 + k * (w / nA), at = ty + 50;
        s += `<path d="M${f1(ax)} ${base} V${f1(at + aw / 2)} A${f1(aw / 2)} ${f1(aw / 2)} 0 0 1 ${f1(ax + aw)} ${f1(at + aw / 2)} V${base}Z" fill="${noite ? '#0B0810' : '#2A1C14'}" stroke="#1D1D2B" stroke-width="5"/>`;
        s += `<path d="M${f1(ax - 8)} ${base} V${f1(at + aw / 2)} A${f1(aw / 2 + 8)} ${f1(aw / 2 + 8)} 0 0 1 ${f1(ax + aw + 8)} ${f1(at + aw / 2)} V${base}" fill="none" stroke="${tom(cor, 0.15)}" stroke-width="10"/>`;
        if (!noite) {
          s += `<rect x="${f1(ax + 10)}" y="${base - 120}" width="${f1(aw - 20)}" height="120" fill="#8A5A33" stroke="#1D1D2B" stroke-width="4"/><rect x="${f1(ax + 4)}" y="${base - 132}" width="${f1(aw - 8)}" height="16" fill="#B07A48" stroke="#1D1D2B" stroke-width="4"/>`;
          for (let a = 0; a < 2; a++) s += C.anfora(ax + aw * (0.3 + a * 0.4), base - 132, 0.5);
        }
      }
      s += C.telhado({ x, y: top, w, cor: noite ? tom(telha, -0.5) : telha });
      if (!noite && grafite) s += C.grafite(x + w * 0.5 - 70, ty + 34, grafite);
      if (varal) s += C.varal(x + w, top + fh * 1.3, x + w + 220, top + fh * 1.2);
      // contorno do volume
      s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="none" stroke="#1D1D2B" stroke-width="7"/>`;
      return s;
    };
    C.sacada = (x, y, w) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="18" fill="#7A4E2C" stroke="#1D1D2B" stroke-width="4"/><rect x="${x}" y="${y + 18}" width="${w}" height="16" fill="#000" opacity=".2"/>`;
      for (let k = x + 10; k < x + w - 4; k += 26) s += `<rect x="${k}" y="${y - 54}" width="8" height="56" fill="#8A5A33" stroke="#1D1D2B" stroke-width="2.5"/>`;
      s += `<rect x="${x}" y="${y - 62}" width="${w}" height="12" fill="#9A6A40" stroke="#1D1D2B" stroke-width="4"/>`;
      for (let k = 0; k < 3; k++) s += `<path d="M${x + 20 + k * (w - 40) / 2} ${y + 18} L${x + 20 + k * (w - 40) / 2 - 22} ${y + 70}" stroke="#5E3B1C" stroke-width="8"/>`;
      return s;
    };
    C.varal = (x0, y0, x1, y1) => {
      const my = Math.max(y0, y1) + 40;
      let s = `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${my} ${x1} ${y1}" stroke="#4A3A2A" stroke-width="3" fill="none"/>`;
      const cores = ['#F2E6C9', '#3B7DD8', '#C8553D', '#E0A030', '#F2E6C9'];
      for (let i = 1; i < 5; i++) { const u = i / 5, px = x0 + (x1 - x0) * u, py = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * my + u * u * y1; s += `<path d="M${f1(px - 18)} ${f1(py)} H${f1(px + 18)} L${f1(px + 14)} ${f1(py + 46)} H${f1(px - 14)}Z" fill="${cores[i]}" stroke="#1D1D2B" stroke-width="3"/>`; }
      return s;
    };
    C.grafite = (x, y, txt) => `<text x="${f1(x)}" y="${f1(y)}" font-family="'DejaVu Sans', sans-serif" font-size="30" font-weight="700" fill="#7A2E1F" opacity=".55" transform="rotate(${f1(rnd(-6, 4))} ${f1(x)} ${f1(y)})">${txt}</text>`;
    C.anfora = (x, yBase, k = 1) => `<g transform="translate(${f1(x)} ${f1(yBase)}) scale(${k})"><path d="M-22 -150 Q-48 -90 -26 -30 L0 0 L26 -30 Q48 -90 22 -150Z" fill="${MAT.ceramica}" stroke="#1D1D2B" stroke-width="5"/><path d="M${luz > 0 ? 6 : -18} -140 Q${luz > 0 ? 30 : -30} -90 ${luz > 0 ? 14 : -14} -40" stroke="#E7A57E" stroke-width="6" fill="none" opacity=".8"/><rect x="-14" y="-172" width="28" height="24" rx="5" fill="#9A4E2D" stroke="#1D1D2B" stroke-width="4"/><path d="M-14 -160 Q-40 -150 -24 -120 M14 -160 Q40 -150 24 -120" stroke="#1D1D2B" stroke-width="5" fill="none"/></g>`;

    // ---------- colunas (dórica, jônica, coríntia), arco, aqueduto, templo, coliseu ----------
    C.coluna = ({ x, base, h = 520, r = 34, ordem = 'dorica', cor = MAT.marmore } = {}) => {
      const topo = base - h;
      let s = `<rect x="${x - r - 14}" y="${base - 26}" width="${2 * r + 28}" height="26" fill="${tom(cor, -0.08)}" stroke="#1D1D2B" stroke-width="5"/>`;
      s += `<path d="M${x - r} ${base - 26} L${x - r * 0.86} ${topo + 40} H${x + r * 0.86} L${x + r} ${base - 26}Z" fill="${cor}" stroke="#1D1D2B" stroke-width="5"/>`;
      for (let k = -2; k <= 2; k++) s += `<path d="M${f1(x + k * r * 0.36)} ${base - 30} L${f1(x + k * r * 0.31)} ${topo + 44}" stroke="${tom(cor, -0.18)}" stroke-width="3"/>`;   // caneluras
      s += `<path d="M${luz > 0 ? x - r : x} ${base - 26} L${luz > 0 ? x - r * 0.86 : x} ${topo + 40} H${luz > 0 ? x - r * 0.2 : x + r * 0.86} L${luz > 0 ? x - r * 0.2 : x + r} ${base - 26}Z" fill="${H.sombra}" opacity=".22"/>`;
      if (ordem === 'dorica') s += `<rect x="${x - r - 8}" y="${topo + 20}" width="${2 * r + 16}" height="22" fill="${tom(cor, 0.05)}" stroke="#1D1D2B" stroke-width="5"/><rect x="${x - r - 14}" y="${topo}" width="${2 * r + 28}" height="22" fill="${tom(cor, 0.1)}" stroke="#1D1D2B" stroke-width="5"/>`;
      else if (ordem === 'jonica') s += `<rect x="${x - r - 10}" y="${topo + 16}" width="${2 * r + 20}" height="22" fill="${cor}" stroke="#1D1D2B" stroke-width="5"/><circle cx="${x - r - 6}" cy="${topo + 28}" r="16" fill="${cor}" stroke="#1D1D2B" stroke-width="5"/><circle cx="${x + r + 6}" cy="${topo + 28}" r="16" fill="${cor}" stroke="#1D1D2B" stroke-width="5"/><circle cx="${x - r - 6}" cy="${topo + 28}" r="6" fill="${tom(cor, -0.3)}"/><circle cx="${x + r + 6}" cy="${topo + 28}" r="6" fill="${tom(cor, -0.3)}"/><rect x="${x - r - 14}" y="${topo}" width="${2 * r + 28}" height="16" fill="${tom(cor, 0.1)}" stroke="#1D1D2B" stroke-width="5"/>`;
      else s += `<path d="M${x - r} ${topo + 44} Q${x - r - 20} ${topo + 20} ${x - r - 22} ${topo + 4} H${x + r + 22} Q${x + r + 20} ${topo + 20} ${x + r} ${topo + 44}Z" fill="${cor}" stroke="#1D1D2B" stroke-width="5"/>` + [-1, 0, 1].map(k => `<path d="M${x + k * r * 0.6} ${topo + 44} Q${x + k * r * 0.9} ${topo + 18} ${x + k * r * 1.1} ${topo + 8}" stroke="#7A9A5A" stroke-width="7" fill="none"/>`).join('') + `<rect x="${x - r - 16}" y="${topo - 12}" width="${2 * r + 32}" height="16" fill="${tom(cor, 0.1)}" stroke="#1D1D2B" stroke-width="5"/>`;
      return s;
    };
    C.templo = ({ x, base, w = 700, h = 640, ordem = 'corintia', cor = MAT.marmore, colunas = 6 } = {}) => {
      let s = `<rect x="${x - 30}" y="${base - 60}" width="${w + 60}" height="60" fill="${tom(cor, -0.12)}" stroke="#1D1D2B" stroke-width="6"/>`;
      for (let k = 0; k < 3; k++) s += `<path d="M${x - 30 + k * 14} ${base - 60 + k * 20} H${x + w + 30 - k * 14}" stroke="${tom(cor, -0.3)}" stroke-width="3"/>`;
      s += `<rect x="${x}" y="${base - h}" width="${w}" height="${h - 60}" fill="${tom(cor, -0.3)}"/>`;
      for (let k = 0; k < colunas; k++) s += C.coluna({ x: x + 40 + k * (w - 80) / (colunas - 1), base: base - 60, h: h - 160, r: 30, ordem, cor });
      const ty = base - h + 100 - 60;
      s += `<rect x="${x - 20}" y="${ty - 50}" width="${w + 40}" height="50" fill="${cor}" stroke="#1D1D2B" stroke-width="6"/><text x="${x + w / 2}" y="${ty - 14}" font-size="30" font-family="serif" font-weight="700" text-anchor="middle" fill="${tom(cor, -0.5)}" letter-spacing="6">SENADO E POVO</text>`;
      s += `<path d="M${x - 40} ${ty - 50} L${x + w / 2} ${ty - 190} L${x + w + 40} ${ty - 50}Z" fill="${cor}" stroke="#1D1D2B" stroke-width="6"/><path d="M${x + 20} ${ty - 62} L${x + w / 2} ${ty - 170} L${x + w - 20} ${ty - 62}Z" fill="${tom(cor, -0.15)}"/>`;
      return s;
    };
    C.aqueduto = ({ x, base, w = 900, h = 520, vaos = 5, cor = MAT.travertino } = {}) => {
      const vw = w / vaos;
      let s = `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${cor}" stroke="#1D1D2B" stroke-width="6"/>`;
      for (let k = 0; k < vaos; k++) { const ax = x + k * vw + vw * 0.16, aw = vw * 0.68; s += `<path d="M${f1(ax)} ${base} V${f1(base - h * 0.55)} A${f1(aw / 2)} ${f1(aw / 2)} 0 0 1 ${f1(ax + aw)} ${f1(base - h * 0.55)} V${base}Z" fill="url(#${id}-ceu)" stroke="#1D1D2B" stroke-width="5"/><path d="M${f1(ax + (luz > 0 ? 0 : aw - 14))} ${base} V${f1(base - h * 0.55)}" stroke="${H.sombra}" stroke-width="14" opacity=".2"/>`; }
      s += `<rect x="${x - 10}" y="${base - h - 30}" width="${w + 20}" height="30" fill="${tom(cor, 0.1)}" stroke="#1D1D2B" stroke-width="6"/>`;
      for (let yy = base - h + 30; yy < base; yy += 34) s += `<path d="M${x} ${yy} H${x + w}" stroke="${tom(cor, -0.15)}" stroke-width="2" opacity=".6"/>`;
      return s;
    };
    C.coliseu = ({ x, base, w = 640, h = 260, cor = MAT.travertino } = {}) => {
      let s = `<path d="M${x} ${base} V${base - h + 30} Q${x + w / 2} ${base - h - 30} ${x + w} ${base - h + 30} V${base}Z" fill="${cor}" stroke="#1D1D2B" stroke-width="6"/>`;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) { const ax = x + 20 + c * (w - 40) / 9, ay = base - 30 - r * (h / 3.4); s += `<path d="M${f1(ax)} ${f1(ay)} v-36 a${f1((w - 40) / 22)} ${f1((w - 40) / 22)} 0 0 1 ${f1((w - 40) / 11)} 0 v36z" fill="${tom(cor, -0.45)}"/>`; }
      for (let r = 1; r < 4; r++) s += `<path d="M${x} ${f1(base - r * (h / 3.4) + 4)} H${x + w}" stroke="${tom(cor, -0.25)}" stroke-width="4"/>`;
      s += `<path d="M${luz > 0 ? x : x + w * 0.65} ${base} V${base - h + 30} Q${luz > 0 ? x + w * 0.2 : x + w * 0.8} ${base - h - 10} ${luz > 0 ? x + w * 0.35 : x + w} ${base - h} V${base}Z" fill="${H.sombra}" opacity=".2"/>`;
      return s;
    };

    // ---------- chão ----------
    C.calcada = ({ y, w = 1080, h = 300, cor = MAT.calcada } = {}) => {
      let s = `<rect x="0" y="${y}" width="${w}" height="${h}" fill="${tom(cor, -0.25)}"/>`;
      let row = 0;
      for (let yy = y + 4; yy < y + h; yy += 30 + row * 3, row++) {
        const sh = 26 + row * 3;
        for (let xx = -rnd(0, 60); xx < w; ) { const sw = rnd(50, 95) + row * 6; const d = `M${f1(xx + 6)} ${f1(yy)} L${f1(xx + sw - 4)} ${f1(yy + rnd(-2, 2))} Q${f1(xx + sw + 2)} ${f1(yy + sh / 2)} ${f1(xx + sw - 6)} ${f1(yy + sh)} L${f1(xx + 4)} ${f1(yy + sh + rnd(-2, 2))} Q${f1(xx - 2)} ${f1(yy + sh / 2)} ${f1(xx + 6)} ${f1(yy)}Z`; s += `<path d="${d}" fill="${tom(cor, rnd(-0.12, 0.12))}"/><path d="M${f1(xx + 8)} ${f1(yy + 3)} H${f1(xx + sw - 8)}" stroke="${tom(cor, 0.3)}" stroke-width="3" opacity=".7"/>`; xx += sw + 4; }
      }
      return s + `<rect x="0" y="${y}" width="${w}" height="10" fill="#000" opacity=".2"/>`;
    };
    C.piso = ({ y, w = 1080, h = 600, cor = MAT.piso } = {}) => {
      let s = `<rect x="0" y="${y}" width="${w}" height="${h}" fill="${tom(cor, -0.2)}"/>`;
      for (let yy = y, r = 0; yy < y + h; yy += 70 + r * 8, r++) for (let xx = (r % 2) * -60; xx < w; xx += 130) s += `<rect x="${f1(xx + 3)}" y="${f1(yy + 3)}" width="124" height="${64 + r * 8}" rx="6" fill="${tom(cor, rnd(-0.1, 0.1))}"/>`;
      return s;
    };

    // ---------- vegetação e vida ----------
    C.cipreste = (x, base, h = 380) => `<path d="M${x} ${base} Q${x - 50} ${base - h * 0.45} ${x} ${base - h} Q${x + 50} ${base - h * 0.45} ${x} ${base}Z" fill="${MAT.cipreste}" stroke="#1D1D2B" stroke-width="5"/><path d="M${x + luz * 8} ${base - 20} Q${x + luz * 34} ${base - h * 0.45} ${x + luz * 4} ${base - h * 0.95}" stroke="#4E8A55" stroke-width="10" fill="none" opacity=".8"/>`;
    C.pinheiro = (x, base, h = 330) => `<path d="M${x - 8} ${base} L${x - 4} ${base - h} H${x + 4} L${x + 8} ${base}Z" fill="#6B4A2E" stroke="#1D1D2B" stroke-width="4"/><path d="M${x - 160} ${base - h + 10} Q${x - 120} ${base - h - 90} ${x} ${base - h - 70} Q${x + 120} ${base - h - 90} ${x + 160} ${base - h + 10} Q${x} ${base - h + 40} ${x - 160} ${base - h + 10}Z" fill="${MAT.vegetacao}" stroke="#1D1D2B" stroke-width="5"/><path d="M${x + luz * 20} ${base - h - 40} Q${x + luz * 90} ${base - h - 70} ${x + luz * 130} ${base - h - 10}" stroke="#6FA06A" stroke-width="12" fill="none"/>`;
    C.hera = (x, y, comprimento = 300) => { let s = '', cx = x, cy = y; for (let i = 0; i < comprimento / 18; i++) { cx += rnd(-12, 12); cy += 18; s += `<ellipse cx="${f1(cx + rnd(-14, 14))}" cy="${f1(cy)}" rx="12" ry="8" fill="${pick(['#3E7B3A', '#5DA052', '#2F6B32'])}" stroke="#1D1D2B" stroke-width="2" transform="rotate(${f1(rnd(-40, 40))} ${f1(cx)} ${f1(cy)})"/>`; } return s; };
    C.pombo = (x, y, k = 1, flip = 1) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k * flip} ${k})"><ellipse cx="0" cy="0" rx="22" ry="14" fill="#9AA0B0" stroke="#1D1D2B" stroke-width="3"/><circle cx="18" cy="-12" r="9" fill="#8A90A3" stroke="#1D1D2B" stroke-width="3"/><path d="M26 -12 l8 3 l-8 2Z" fill="#E0A030"/><circle cx="20" cy="-14" r="2" fill="#1D1D2B"/><path d="M-20 -2 l-14 -6 l2 12Z" fill="#7A8093" stroke="#1D1D2B" stroke-width="2"/><path d="M-4 14 v8 M6 14 v8" stroke="#D96B4B" stroke-width="3"/></g>`;
    C.toldo = (x, y, w, cores = ['#D7263D', '#F2E6C9']) => { let s = `<path d="M${x} ${y} H${x + w} L${x + w + 20} ${y + 90} H${x - 20}Z" fill="${cores[1]}" stroke="#1D1D2B" stroke-width="5"/>`; const n = Math.round(w / 60); for (let k = 0; k < n; k += 2) { const a = x + k * w / n, b = x + (k + 1) * w / n; s += `<path d="M${f1(a)} ${y} H${f1(b)} L${f1(b + (b - x - w / 2) / w * 40)} ${y + 90} H${f1(a + (a - x - w / 2) / w * 40)}Z" fill="${cores[0]}"/>`; } for (let k = 0; k <= n; k++) s += `<path d="M${f1(x - 20 + k * (w + 40) / n)} ${y + 90} q${f1((w + 40) / n / 2)} 24 ${f1((w + 40) / n)} 0" fill="${k % 2 ? cores[1] : cores[0]}" stroke="#1D1D2B" stroke-width="4"/>`; return s + `<rect x="${x - 20}" y="${y + 90}" width="${w + 40}" height="40" fill="url(#${id}-beiral)"/>`; };
    C.lamparina = (x, y, acesa = true) => `<g transform="translate(${x} ${y})">${acesa ? `<circle r="90" fill="url(#${id}-fogo)" opacity=".6"/>` : ''}<path d="M-30 6 Q0 26 30 6 Q24 -8 0 -8 Q-24 -8 -30 6Z" fill="#B88A3A" stroke="#1D1D2B" stroke-width="4"/><path d="M30 2 l18 -6 l-4 10Z" fill="#B88A3A" stroke="#1D1D2B" stroke-width="3"/>${acesa ? `<path d="M46 -6 q-8 -16 2 -30 q8 14 -2 30Z" fill="#FFC24B"/>` : ''}</g>`;

    // ---------- sombra projetada de um volume no chão (para o lado oposto à luz) ----------
    C.sombraChao = (x, w, yChao, comprimento = 160) => `<path d="M${x} ${yChao} H${x + w} L${x + w - luz * comprimento} ${yChao + 60} H${x - luz * comprimento}Z" fill="${H.sombra}" opacity=".28"/>`;

    // ---------- atmosfera final: luz quente, grão e vinheta ----------
    C.atmosfera = ({ w = 1080, h = 1920, grao = 0.35, vinheta = true, raios = false } = {}) => {
      let s = '';
      if (raios && H !== HORAS.noite) { const sx = luz > 0 ? w : 0; for (let k = 0; k < 4; k++) s += `<path d="M${sx} ${-50 + k * 60} L${sx - luz * w * 1.2} ${h * (0.35 + k * 0.12)} L${sx - luz * w * 1.2} ${h * (0.42 + k * 0.12)}Z" fill="${H.luz}" opacity=".07"/>`; }
      s += `<rect width="${w}" height="${h}" fill="${H.luz}" opacity="${H === HORAS.noite ? 0 : 0.06}" style="mix-blend-mode:soft-light"/>`;
      if (grao) s += `<rect width="${w}" height="${h}" filter="url(#${id}-grao)" opacity="${grao}"/>`;
      if (vinheta) s += `<rect width="${w}" height="${h}" fill="url(#${id}-vinheta)"/>`;
      return s;
    };
    return C;
  }
  Cenario.horas = Object.keys(HORAS);
  Cenario.tom = (c, k) => (k >= 0 ? mix(c, '#FFF6E6', k) : mix(c, '#1A1424', -k));
  global.Cenario = Cenario;
})(window);
