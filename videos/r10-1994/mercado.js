/*
  mercado.js — corredor de supermercado (fundo) no acabamento do cenario-ilustrado:
  luz da esquerda, 3 tons por volume, sombra de contato, piso brilhante com reflexo, sinais de uso.
  Mercado({ seed, era: '1994' | '2026' }).fundo({ chao }) → SVG
  1994: etiquetas de papel escritas à mão e cartaz de PROMOÇÃO; 2026: etiquetas digitais e cartaz OFERTA.
*/
(function (global) {
  function Mercado({ seed = 3, era = '2026' } = {}) {
    const L = '#1D1D2B';
    let st = seed >>> 0 || 1;
    const rnd = (a = 0, b = 1) => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return a + (b - a) * (((t ^ (t >>> 14)) >>> 0) / 4294967296); };
    const pick = a => a[Math.floor(rnd(0, a.length))];
    const rgb = c => [0, 2, 4].map(i => parseInt(c.slice(1).substr(i, 2), 16));
    const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    const tom = (c, k) => { const A = rgb(c), B = k >= 0 ? [255, 255, 255] : [20, 16, 26], t = Math.abs(k); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
    const f = v => Math.round(v * 10) / 10;
    const CORES = ['#D7263D', '#1F5FAF', '#2E9E5A', '#F2B705', '#7A4AA8', '#E86A1C', '#13A3B5', '#C8282E', '#F4F1E8'];

    // um produto genérico de prateleira (caixa, lata, garrafa, pacote) com 3 tons
    const produto = (x, base, tipo, cor) => {
      const cl = tom(cor, 0.25), ce = tom(cor, -0.3);
      if (tipo === 'caixa') { const w = rnd(46, 62), h = rnd(80, 110); return `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h)}" fill="${cor}" stroke="${L}" stroke-width="3"/><rect x="${f(x)}" y="${f(base - h)}" width="${f(w * 0.22)}" height="${f(h)}" fill="${cl}"/><rect x="${f(x + w * 0.8)}" y="${f(base - h)}" width="${f(w * 0.2)}" height="${f(h)}" fill="${ce}"/><rect x="${f(x + 6)}" y="${f(base - h * 0.62)}" width="${f(w - 12)}" height="${f(h * 0.26)}" rx="4" fill="#fff" opacity=".85"/>`; }
      if (tipo === 'lata') { const w = rnd(34, 42), h = rnd(48, 58); return `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h)}" rx="4" fill="${cor}" stroke="${L}" stroke-width="3"/><rect x="${f(x + 4)}" y="${f(base - h)}" width="${f(w * 0.25)}" height="${f(h)}" fill="#fff" opacity=".35"/><rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="7" fill="#B9C0C8" stroke="${L}" stroke-width="2"/><rect x="${f(x)}" y="${f(base - h * 0.62)}" width="${f(w)}" height="${f(h * 0.3)}" fill="#fff" opacity=".8"/>`; }
      if (tipo === 'garrafa') { const w = rnd(30, 36), h = rnd(100, 120); return `<path d="M${f(x)} ${f(base)} V${f(base - h * 0.62)} Q${f(x)} ${f(base - h * 0.75)} ${f(x + w * 0.3)} ${f(base - h * 0.82)} V${f(base - h)} H${f(x + w * 0.7)} V${f(base - h * 0.82)} Q${f(x + w)} ${f(base - h * 0.75)} ${f(x + w)} ${f(base - h * 0.62)} V${f(base)}Z" fill="${cor}" stroke="${L}" stroke-width="3" opacity=".95"/><rect x="${f(x + w * 0.28)}" y="${f(base - h - 8)}" width="${f(w * 0.44)}" height="10" fill="${ce}" stroke="${L}" stroke-width="2"/><rect x="${f(x + 4)}" y="${f(base - h * 0.5)}" width="${f(w - 8)}" height="${f(h * 0.22)}" fill="#fff" opacity=".85"/><path d="M${f(x + 6)} ${f(base - h * 0.6)} V${f(base - 8)}" stroke="#fff" stroke-width="4" opacity=".4"/>`; }
      const w = rnd(54, 70), h = rnd(70, 90);   // pacote
      return `<path d="M${f(x)} ${f(base)} Q${f(x - 3)} ${f(base - h * 0.5)} ${f(x + 2)} ${f(base - h)} H${f(x + w - 2)} Q${f(x + w + 3)} ${f(base - h * 0.5)} ${f(x + w)} ${f(base)}Z" fill="${cor}" stroke="${L}" stroke-width="3"/><rect x="${f(x + 2)}" y="${f(base - h)}" width="${f(w - 4)}" height="9" fill="#E3E7EB" stroke="${L}" stroke-width="2"/><ellipse cx="${f(x + w / 2)}" cy="${f(base - h * 0.45)}" rx="${f(w * 0.3)}" ry="${f(h * 0.17)}" fill="#fff" opacity=".85"/><path d="M${f(x + w - 10)} ${f(base - h + 12)} V${f(base - 4)}" stroke="#000" stroke-width="6" opacity=".12"/>`;
    };
    // etiqueta de preço na borda da prateleira
    const etiqueta = (x, y) => era === '1994'
      ? `<rect x="${f(x)}" y="${f(y)}" width="44" height="22" fill="#FFF7C2" stroke="${L}" stroke-width="2" transform="rotate(${f(rnd(-4, 4))} ${f(x + 22)} ${f(y + 11)})"/><path d="M${f(x + 6)} ${f(y + 12)} q8 -6 14 0 t14 0" stroke="#C8282E" stroke-width="2.5" fill="none"/>`
      : `<rect x="${f(x)}" y="${f(y)}" width="46" height="22" rx="3" fill="#20242A" stroke="${L}" stroke-width="2"/><rect x="${f(x + 4)}" y="${f(y + 4)}" width="38" height="14" rx="2" fill="#E9F6EC"/><rect x="${f(x + 8)}" y="${f(y + 8)}" width="22" height="6" fill="#20242A" opacity=".7"/>`;

    const M = {};
    M.fundo = ({ w = 1080, h = 1920, chao = 1360 } = {}) => {
      const parede = era === '1994' ? '#E8DCC2' : '#EEF1F4';
      let s = `<rect width="${w}" height="${chao}" fill="${parede}"/>`;
      // teto rebaixado com placas e luminárias tubulares acesas
      s += `<rect width="${w}" height="250" fill="${tom(parede, -0.1)}"/>` + [0, 1, 2, 3, 4].map(i => `<path d="M${i * 270 - 20} 0 V250" stroke="${tom(parede, -0.25)}" stroke-width="3"/>`).join('') + `<path d="M0 250 H${w}" stroke="${tom(parede, -0.35)}" stroke-width="5"/>`;
      [[150, 140], [560, 160], [930, 140]].forEach(([lx, ly]) => { s += `<ellipse cx="${lx}" cy="${ly + 16}" rx="230" ry="80" fill="#FFFBE8" opacity=".35"/><rect x="${lx - 150}" y="${ly}" width="300" height="26" rx="8" fill="#F7F7F2" stroke="${L}" stroke-width="4"/><rect x="${lx - 140}" y="${ly + 6}" width="280" height="8" rx="4" fill="#fff"/>`; });
      // placa do corredor pendurada
      const placa = era === '1994' ? '#2E7D4F' : '#1F5FAF';
      s += `<rect x="380" y="186" width="320" height="58" rx="10" fill="${placa}" stroke="${L}" stroke-width="5"/><rect x="380" y="186" width="320" height="12" rx="6" fill="${tom(placa, 0.25)}"/>`
        + `<text x="540" y="229" font-family="'Anton', sans-serif" font-size="32" fill="#fff" text-anchor="middle">CORREDOR 3 · MERCEARIA</text>`;
      // gôndola: 4 prateleiras com produtos
      const g0 = 420, g1 = chao - 10, xs = [0, w];
      s += `<rect x="0" y="${g0 - 30}" width="${w}" height="${g1 - g0 + 30}" fill="${tom(parede, -0.18)}"/><rect x="0" y="${g0 - 30}" width="${w}" height="30" fill="${era === '1994' ? '#C8282E' : '#F2B705'}" stroke="${L}" stroke-width="4"/>`;
      s += `<rect x="0" y="${g0}" width="${w}" height="${g1 - g0}" fill="${tom(parede, -0.32)}"/>`;
      const prat = [g0 + 190, g0 + 400, g0 + 610, g1 - 30];
      prat.forEach((py, k) => {
        let x = 10;
        while (x < w - 50) {
          const tipo = pick(['caixa', 'caixa', 'lata', 'garrafa', 'pacote']), cor = pick(CORES);
          const n = Math.floor(rnd(2, 4)); let x0 = x;
          for (let j = 0; j < n && x < w - 50; j++) { const p = produto(x, py, tipo, cor); s += p; x += tipo === 'lata' ? 40 : tipo === 'garrafa' ? 36 : tipo === 'caixa' ? 58 : 68; }
          if (rnd() < 0.18) x += rnd(30, 70);   // buraco na prateleira (alguém levou)
          s += etiqueta(x0 + 4, py + 6);
          x += 6;
        }
        s += `<rect x="0" y="${py}" width="${w}" height="34" fill="${tom('#B9C0C8', -0.05)}" stroke="${L}" stroke-width="4"/><rect x="0" y="${py}" width="${w}" height="8" fill="#fff" opacity=".6"/><rect x="0" y="${py + 34}" width="${w}" height="16" fill="#000" opacity=".2"/>`;
        // as etiquetas ficam por cima da borda
        let ex = 30; while (ex < w - 60) { s += etiqueta(ex, py + 6); ex += rnd(150, 230); }
      });
      // cartaz pendurado na gôndola
      s += era === '1994'
        ? `<g transform="rotate(-5 200 520)"><rect x="80" y="470" width="250" height="110" fill="#FFE27A" stroke="${L}" stroke-width="5"/><text x="205" y="525" font-family="'DejaVu Sans', sans-serif" font-weight="900" font-size="36" fill="#C8282E" text-anchor="middle">PROMOÇÃO</text><text x="205" y="565" font-family="'DejaVu Sans', sans-serif" font-weight="700" font-size="22" fill="${L}" text-anchor="middle">LEVE 3 PAGUE 2</text></g>`
        : `<g transform="rotate(4 880 520)"><rect x="770" y="470" width="220" height="100" rx="10" fill="#D7263D" stroke="${L}" stroke-width="5"/><text x="880" y="535" font-family="'Anton', sans-serif" font-size="46" fill="#fff" text-anchor="middle">OFERTA</text></g>`;
      // piso brilhante em perspectiva + reflexo da gôndola
      s += `<rect y="${chao}" width="${w}" height="${h - chao}" fill="${era === '1994' ? '#D9CDB4' : '#E4E7EA'}"/>`;
      s += `<rect y="${chao}" width="${w}" height="70" fill="${tom(parede, -0.32)}" opacity=".25"/>`;
      for (let i = -8; i <= 8; i++) s += `<path d="M${540 + i * 70} ${chao} L${540 + i * 260} ${h}" stroke="#000" stroke-width="2" opacity=".08"/>`;
      [0, 60, 150, 280, 450].forEach(dy => { s += `<path d="M0 ${chao + dy} H${w}" stroke="#000" stroke-width="2" opacity=".08"/>`; });
      s += `<path d="M0 ${chao} H${w}" stroke="${L}" stroke-width="5"/><rect y="${chao}" width="${w}" height="14" fill="#000" opacity=".2"/>`;
      [[150, 140], [560, 160], [930, 140]].forEach(([lx]) => { s += `<ellipse cx="${lx}" cy="${chao + 230}" rx="120" ry="26" fill="#fff" opacity=".35"/>`; });
      return s;
    };
    return M;
  }
  global.Mercado = Mercado;
})(typeof window !== 'undefined' ? window : globalThis);
