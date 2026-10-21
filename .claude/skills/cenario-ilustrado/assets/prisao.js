/*
  prisao.js — pátio de presídio visto de dentro (skill "cenario-ilustrado"), no mesmo acabamento:
  luz de um lado, 3 tons, sombra de contato, textura com variação e sinais de uso.
  Depende de cenario.js.

  const P = Prisao(Cenario({ seed: 6, luz: -1, hora: 'tarde', prefixo: 'pr' }));
  const { fundo, grade, portao } = P.patio({ chao: 1380 });
  // camadas: fundo → quem está FORA do portão (zumbis) → grade → quem está no pátio
  portao = { x0, x1, y0, y1 } (vão do portão, para posicionar quem fica atrás das barras)
  Textos em português.
*/
(function (global) {
  function Prisao(C) {
    const tom = C.tom, rnd = C.rnd;
    const L = '#1D1D2B', f = v => Math.round(v * 10) / 10;
    const P = {};
    P.patio = ({ w = 1080, h = 1920, chao = 1380, muroTopo = 700, portao = [560, 1010] } = {}) => {
      const [gx0, gx1] = portao, gy0 = muroTopo + 120;
      // céu de fim de tarde com fumaça (apocalipse)
      let s = `<defs><linearGradient id="pr-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A4A6A"/><stop offset=".55" stop-color="#C9785A"/><stop offset="1" stop-color="#F2B07A"/></linearGradient></defs><rect width="${w}" height="${chao}" fill="url(#pr-ceu)"/>`;
      s += `<circle cx="820" cy="${muroTopo - 210}" r="70" fill="#FFD9A0" opacity=".9"/>`;
      [[180, 0.6], [760, 0.45], [980, 0.5]].forEach(([fx, op]) => { for (let k = 0; k < 6; k++) s += `<circle cx="${f(fx + k * 22 + rnd(-10, 10))}" cy="${f(muroTopo - 40 - k * 70)}" r="${f(30 + k * 14)}" fill="#3A3440" opacity="${f(op * (1 - k * 0.12))}"/>`; });
      // cidade ao longe (silhueta)
      let px = -20; while (px < w) { const pw = rnd(60, 130), ph = rnd(80, 220); s += `<rect x="${f(px)}" y="${f(muroTopo + 40 - ph)}" width="${f(pw)}" height="${f(ph + 80)}" fill="#6A5A6E" opacity=".75"/>`; px += pw + rnd(4, 18); }
      // chão de fora visto pelo vão do portão
      s += `<rect x="${gx0}" y="${gy0 + 200}" width="${gx1 - gx0}" height="${chao - gy0 - 200}" fill="#9A8A70"/>`;
      // muro de concreto em placas, com manchas de umidade e rachaduras
      const muro = '#B9B3A6';
      const placa = (x0, x1) => {
        let m = `<rect x="${f(x0)}" y="${muroTopo}" width="${f(x1 - x0)}" height="${chao - muroTopo}" fill="${muro}"/>`;
        for (let x = x0; x < x1; x += 180) m += `<path d="M${f(x)} ${muroTopo} V${chao}" stroke="${tom(muro, -0.25)}" stroke-width="4"/><path d="M${f(x + 6)} ${muroTopo} V${chao}" stroke="${tom(muro, 0.2)}" stroke-width="3"/>`;
        for (let i = 0; i < 12; i++) m += `<ellipse cx="${f(rnd(x0, x1))}" cy="${f(rnd(muroTopo + 40, chao))}" rx="${f(rnd(30, 90))}" ry="${f(rnd(40, 120))}" fill="${tom(muro, rnd(-0.18, -0.05))}" opacity=".45"/>`;
        for (let i = 0; i < 4; i++) { const cx = rnd(x0 + 20, x1 - 20), cy = rnd(muroTopo + 60, chao - 200); m += `<path d="M${f(cx)} ${f(cy)} l${f(rnd(-20, 20))} 40 l${f(rnd(-16, 16))} 36 l${f(rnd(-14, 14))} 30" stroke="${tom(muro, -0.45)}" stroke-width="3" fill="none"/>`; }
        m += `<rect x="${f(x0)}" y="${chao - 90}" width="${f(x1 - x0)}" height="90" fill="#000" opacity=".12"/>`;   // sujeira subindo do chão
        m += `<rect x="${f(x0)}" y="${muroTopo}" width="${f(x1 - x0)}" height="26" fill="${tom(muro, 0.15)}" stroke="${L}" stroke-width="5"/>`;   // capa do muro
        return m;
      };
      s += placa(0, gx0) + placa(gx1, w);
      // concertina (arame farpado em espiral) no topo
      for (let x = -30; x < w + 30; x += 34) s += `<ellipse cx="${x}" cy="${muroTopo - 26}" rx="30" ry="28" fill="none" stroke="#5E666E" stroke-width="4"/><path d="M${x - 6} ${muroTopo - 54} l8 -8 M${x + 10} ${muroTopo - 2} l8 6" stroke="#5E666E" stroke-width="3"/>`;
      s += [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080].map(x => `<path d="M${x} ${muroTopo} V${muroTopo - 60}" stroke="#4A4F55" stroke-width="7"/>`).join('');
      // placa
      s += `<rect x="70" y="${muroTopo + 120}" width="340" height="90" rx="6" fill="#2E5E9E" stroke="${L}" stroke-width="5"/><text x="240" y="${muroTopo + 180}" font-family="'Anton', sans-serif" font-size="46" fill="#fff" text-anchor="middle">PENITENCIÁRIA</text>`;
      s += `<rect x="90" y="${muroTopo + 240}" width="230" height="64" rx="6" fill="#F2B705" stroke="${L}" stroke-width="4"/><text x="205" y="${muroTopo + 283}" font-family="'Anton', sans-serif" font-size="32" fill="${L}" text-anchor="middle">ÁREA RESTRITA</text>`;
      // torre de vigia (à esquerda, atrás do muro) com holofote
      const tx = 150, ty = muroTopo - 330;
      s += `<rect x="${tx - 26}" y="${ty + 90}" width="22" height="${muroTopo - ty - 90}" fill="#6A6560" stroke="${L}" stroke-width="4"/><rect x="${tx + 70}" y="${ty + 90}" width="22" height="${muroTopo - ty - 90}" fill="#4E4A46" stroke="${L}" stroke-width="4"/>`;
      s += `<path d="M${tx - 40} ${ty + 90} H${tx + 110} V${ty + 150} H${tx - 40}Z" fill="#8A8278" stroke="${L}" stroke-width="5"/><rect x="${tx - 30}" y="${ty + 10}" width="130" height="80" fill="#2A2E36" stroke="${L}" stroke-width="5"/><rect x="${tx - 20}" y="${ty + 20}" width="110" height="34" fill="#FFE08A" opacity=".85"/>`;
      s += `<path d="M${tx - 60} ${ty + 12} L${tx + 35} ${ty - 40} L${tx + 130} ${ty + 12}Z" fill="#5A3A30" stroke="${L}" stroke-width="5"/>`;
      s += `<g id="holofote"><path d="M${tx + 40} ${ty + 70} L${tx + 620} ${ty + 380} L${tx + 520} ${ty + 520}Z" fill="#FFF3C4" opacity=".28"/></g><circle cx="${tx + 40}" cy="${ty + 70}" r="16" fill="#FFF3C4" stroke="${L}" stroke-width="4"/>`;
      // pátio: concreto com faixas pintadas e rachaduras
      s += `<rect y="${chao}" width="${w}" height="${h - chao}" fill="#8E8A80"/><rect y="${chao}" width="${w}" height="20" fill="#000" opacity=".2"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M0 ${chao + 60 + i * 110} H${w}" stroke="#7E7A70" stroke-width="3"/>`;
      s += `<path d="M120 ${chao + 260} H960" stroke="#F2B705" stroke-width="12" opacity=".7" stroke-dasharray="60 30"/>`;
      for (let i = 0; i < 5; i++) { const cx = rnd(50, w - 50), cy = rnd(chao + 80, h - 200); s += `<path d="M${f(cx)} ${f(cy)} l${f(rnd(30, 70))} ${f(rnd(-10, 10))} l${f(rnd(20, 50))} ${f(rnd(-12, 12))}" stroke="#6A665E" stroke-width="3" fill="none"/>`; }
      // grade do portão (camada da frente): moldura de aço, barras com brilho, travessas e cadeado
      let g = `<rect x="${gx0 - 24}" y="${gy0 - 24}" width="${gx1 - gx0 + 48}" height="${chao - gy0 + 24}" fill="none" stroke="${L}" stroke-width="10"/><rect x="${gx0 - 20}" y="${gy0 - 20}" width="${gx1 - gx0 + 40}" height="24" fill="#5E666E" stroke="${L}" stroke-width="5"/>`;
      g += `<rect x="${gx0 - 30}" y="${gy0 - 20}" width="26" height="${chao - gy0 + 20}" fill="#4A4F55" stroke="${L}" stroke-width="5"/><rect x="${gx1 + 4}" y="${gy0 - 20}" width="26" height="${chao - gy0 + 20}" fill="#4A4F55" stroke="${L}" stroke-width="5"/>`;
      for (let x = gx0 + 24; x < gx1; x += 46) g += `<rect x="${x - 7}" y="${gy0}" width="14" height="${chao - gy0}" fill="#5E666E" stroke="${L}" stroke-width="3"/><rect x="${x - 4}" y="${gy0}" width="4" height="${chao - gy0}" fill="#C9CFD5" opacity=".7"/>`;
      [gy0 + 160, gy0 + 380].forEach(yy => { g += `<rect x="${gx0}" y="${yy}" width="${gx1 - gx0}" height="20" fill="#4A4F55" stroke="${L}" stroke-width="4"/>`; });
      g += `<rect x="${(gx0 + gx1) / 2 - 26}" y="${gy0 + 230}" width="52" height="60" rx="8" fill="#C9A24A" stroke="${L}" stroke-width="4"/><path d="M${(gx0 + gx1) / 2 - 16} ${gy0 + 232} v-20 a16 16 0 0 1 32 0 v20" stroke="#8A9098" stroke-width="7" fill="none"/>`;
      g += `<path d="M${gx0 + 30} ${gy0 + 220} q60 30 120 0 q60 30 120 0 q60 30 120 0" stroke="#7A7F86" stroke-width="7" fill="none"/>`;   // corrente
      return { fundo: s, grade: g, portao: { x0: gx0, x1: gx1, y0: gy0, y1: chao } };
    };
    return P;
  }
  global.Prisao = Prisao;
})(typeof window !== 'undefined' ? window : globalThis);
