/*
  padaria.js — padaria de bairro (interior e fachada) + ícones dos cartões, no acabamento do cenario-ilustrado:
  luz da esquerda, 3 tons por volume, contorno #1D1D2B, sombra de contato, textura com variação e sinais de uso.
  Depende de detalhes.js (pães).
    const P = Padaria({ seed: 3 });
    P.interior({ w: 1920, h: 1080, chao: 880 }) → { fundo, balcao }   // balcao vai POR CIMA de quem está atrás dele
    P.fachada({ w: 1920, h: 1080, chao: 900, nome: 'PADARIA DONA MARTA LTDA' })
    P.icone(nome, x, y, k)   // casa, carro, cofrinho, lampada, carrinho, escola, documento, escudo, maquina, loja, cadeado, balanca
*/
(function (global) {
  function Padaria({ seed = 3 } = {}) {
    const L = '#1D1D2B';
    let st = seed >>> 0 || 1;
    const rnd = (a = 0, b = 1) => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return a + (b - a) * (((t ^ (t >>> 14)) >>> 0) / 4294967296); };
    const rgb = c => [0, 2, 4].map(i => parseInt(c.slice(1).substr(i, 2), 16));
    const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    const tom = (c, k) => { const A = rgb(c), B = k >= 0 ? [255, 255, 255] : [20, 16, 26], t = Math.abs(k); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
    const f = v => Math.round(v * 10) / 10;
    const D = Detalhes({ luz: -1, seed: seed + 5, prefixo: 'pd', sombra: false });
    const txt = (x, y, t, fs, cor = '#fff', o = '') => `<text x="${f(x)}" y="${f(y)}" font-family="'Anton', sans-serif" font-size="${fs}" fill="${cor}" text-anchor="middle" ${o}>${t}</text>`;
    const P = {};

    // ---------- interior ----------
    P.interior = ({ w = 1920, h = 1080, chao = 880 } = {}) => {
      let s = '';
      // parede pintada em cima, azulejo creme embaixo
      s += `<rect width="${w}" height="${chao}" fill="#F3D9A8"/>`;
      for (let i = 0; i < 8; i++) s += `<ellipse cx="${f(rnd(0, w))}" cy="${f(rnd(0, 400))}" rx="${f(rnd(80, 200))}" ry="${f(rnd(40, 100))}" fill="${tom('#F3D9A8', rnd(-0.07, 0.04))}" opacity=".5"/>`;
      const az = 470;
      s += `<rect y="${az}" width="${w}" height="${chao - az}" fill="#F6EEDC"/>`;
      for (let x = 0; x < w; x += 46) s += `<path d="M${x} ${az} V${chao}" stroke="${tom('#F6EEDC', -0.12)}" stroke-width="2"/>`;
      for (let y = az; y < chao; y += 46) s += `<path d="M0 ${y} H${w}" stroke="${tom('#F6EEDC', -0.12)}" stroke-width="2"/>`;
      s += `<rect y="${az - 14}" width="${w}" height="16" fill="#C8553D" stroke="${L}" stroke-width="3"/>`;
      // luminárias pendentes com luz quente
      [300, 760, 1240, 1700].forEach(lx => { s += `<ellipse cx="${lx}" cy="150" rx="190" ry="90" fill="#FFF3C4" opacity=".35"/><path d="M${lx} 0 V70" stroke="${L}" stroke-width="3"/><path d="M${lx - 46} 110 Q${lx} 50 ${lx + 46} 110Z" fill="#2E5E4E" stroke="${L}" stroke-width="4"/><ellipse cx="${lx}" cy="112" rx="20" ry="9" fill="#FFF3C4"/>`; });
      // placa com o nome
      s += `<g><rect x="230" y="70" width="560" height="110" rx="16" fill="#5A3420" stroke="${L}" stroke-width="6"/><rect x="246" y="84" width="528" height="82" rx="10" fill="none" stroke="#C9A24A" stroke-width="3"/>${txt(510, 146, 'PADARIA DONA MARTA', 54, '#FFE9B0')}</g>`;
      s += `<g transform="translate(205 125)"><path d="M0 40 V-30" stroke="#C9A24A" stroke-width="5"/>${[-26, -10, 6, 22].map(y => `<ellipse cx="-8" cy="${y}" rx="7" ry="12" fill="#E8B84A" stroke="${L}" stroke-width="2" transform="rotate(-25 -8 ${y})"/><ellipse cx="8" cy="${y + 4}" rx="7" ry="12" fill="#E8B84A" stroke="${L}" stroke-width="2" transform="rotate(25 8 ${y + 4})"/>`).join('')}</g>`;
      // prateleiras de pão atrás do balcão (cestos com pães)
      [250, 380].forEach((py, r) => {
        s += `<rect x="60" y="${py + 70}" width="900" height="18" fill="#8A5A30" stroke="${L}" stroke-width="4"/><rect x="60" y="${py + 88}" width="900" height="10" fill="#000" opacity=".18"/>`;
        for (let i = 0; i < 6; i++) {
          const cx = 120 + i * 145;
          s += `<path d="M${cx - 58} ${py + 30} L${cx + 58} ${py + 30} L${cx + 48} ${py + 70} L${cx - 48} ${py + 70}Z" fill="#B07A44" stroke="${L}" stroke-width="3"/>` + [0, 1, 2].map(k => `<path d="M${cx - 50 + k * 4} ${py + 42 + k * 10} H${cx + 50 - k * 4}" stroke="#8A5A30" stroke-width="2"/>`).join('');
          for (let k = 0; k < 3; k++) s += `<g transform="rotate(${f(rnd(-12, 12))} ${cx - 30 + k * 30} ${py + 30})">${D.paoFrances(cx - 30 + k * 30, py + 34, 0.22 + (r ? 0 : 0.02))}</g>`;
        }
      });
      // quadro de giz com preços
      s += `<g transform="translate(1180 120)"><rect width="300" height="230" rx="10" fill="#8A5A30" stroke="${L}" stroke-width="5"/><rect x="14" y="14" width="272" height="202" fill="#2E3A33"/>${txt(150, 60, 'HOJE TEM', 32, '#F4F1E8')}${['PÃO FRANCÊS', 'SONHO', 'BOLO DE FUBÁ', 'CAFÉ COM LEITE'].map((t, i) => `<text x="34" y="${102 + i * 30}" font-family="'DejaVu Sans', sans-serif" font-size="20" fill="#F4F1E8">${t}</text><path d="M${200} ${96 + i * 30} h40" stroke="#F4F1E8" stroke-width="2" stroke-dasharray="4 4"/>`).join('')}</g>`;
      // porta de vidro e janela para a rua (lado direito)
      s += `<rect x="1560" y="190" width="300" height="${chao - 190}" fill="#9ED3F0" stroke="${L}" stroke-width="7"/><path d="M1560 ${chao - 200} L1650 ${chao - 280} L1720 ${chao - 240} L1800 ${chao - 320} L1860 ${chao - 280} V${chao} H1560Z" fill="#A9B8C4"/><path d="M1600 260 L1700 560" stroke="#fff" stroke-width="18" opacity=".35"/><rect x="1580" y="${chao - 330}" width="40" height="12" rx="6" fill="#C9A24A" stroke="${L}" stroke-width="3"/>`;
      s += `<g transform="rotate(-3 1710 330)"><rect x="1640" y="300" width="140" height="60" rx="6" fill="#fff" stroke="${L}" stroke-width="3"/>${txt(1710, 342, 'ABERTO', 30, '#2E9E5A')}</g>`;
      // chão de ladrilho xadrez
      s += `<rect y="${chao}" width="${w}" height="${h - chao}" fill="#D9CDB4"/>`;
      for (let x = 0, i = 0; x < w; x += 80, i++) for (let y = chao, j = 0; y < h; y += 50, j++) if ((i + j) % 2) s += `<rect x="${x}" y="${y}" width="80" height="50" fill="#B8A88A"/>`;
      s += `<rect y="${chao}" width="${w}" height="16" fill="#000" opacity=".18"/>`;
      // balcão (camada da frente): vitrine de vidro com sonhos e bolo, tampo de madeira, frente com ripas, caixa registradora
      const bx0 = 60, bx1 = 900, by = 640;
      let b = `<rect x="${bx0 + 20}" y="${by - 120}" width="${bx1 - bx0 - 220}" height="120" fill="#CFEAF6" opacity=".55" stroke="${L}" stroke-width="5"/>`;
      for (let i = 0; i < 7; i++) b += `<ellipse cx="${bx0 + 90 + i * 80}" cy="${by - 30}" rx="30" ry="20" fill="#E8B84A" stroke="${L}" stroke-width="3"/><ellipse cx="${bx0 + 90 + i * 80}" cy="${by - 40}" rx="24" ry="7" fill="#fff" opacity=".9"/>`;
      b += `<path d="M${bx0 + 40} ${by - 110} L${bx0 + 120} ${by - 10}" stroke="#fff" stroke-width="10" opacity=".45"/>`;
      b += `<rect x="${bx0}" y="${by}" width="${bx1 - bx0}" height="26" fill="#A86A3A" stroke="${L}" stroke-width="5"/><rect x="${bx0}" y="${by}" width="${bx1 - bx0}" height="7" fill="#fff" opacity=".3"/>`;
      b += `<rect x="${bx0 + 14}" y="${by + 26}" width="${bx1 - bx0 - 28}" height="${chao - by - 26}" fill="#8A5A30" stroke="${L}" stroke-width="5"/>`;
      for (let x = bx0 + 40; x < bx1 - 30; x += 56) b += `<path d="M${x} ${by + 34} V${chao - 6}" stroke="${tom('#8A5A30', -0.25)}" stroke-width="4"/>`;
      b += `<rect x="${bx0 + 14}" y="${chao - 30}" width="${bx1 - bx0 - 28}" height="30" fill="#000" opacity=".2"/>`;
      // caixa registradora em cima do balcão (ponta direita)
      b += `<g transform="translate(800 ${by})"><rect x="-70" y="-90" width="140" height="90" rx="10" fill="#C8553D" stroke="${L}" stroke-width="5"/><rect x="-54" y="-130" width="108" height="46" rx="6" fill="#2A2E36" stroke="${L}" stroke-width="4"/>${txt(0, -97, 'R$ 0,00', 22, '#7CFF9A')}<g fill="#F4F1E8">${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${-50 + c * 26}" y="${-74 + r * 20}" width="18" height="12" rx="3"/>`).join('')).join('')}</g><rect x="-80" y="-14" width="160" height="22" rx="4" fill="#8A3A2A" stroke="${L}" stroke-width="4"/></g>`;
      return { fundo: s, balcao: b };
    };

    // ---------- fachada ----------
    P.fachada = ({ w = 1920, h = 1080, chao = 900, nome = 'PADARIA DONA MARTA LTDA' } = {}) => {
      let s = `<defs><linearGradient id="pd-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8CCBF0"/><stop offset="1" stop-color="#FCEFD8"/></linearGradient></defs><rect width="${w}" height="${chao}" fill="url(#pd-ceu)"/>`;
      s += `<circle cx="1700" cy="130" r="70" fill="#FFF3C4"/>`;
      // prédios vizinhos
      s += `<rect x="0" y="260" width="330" height="${chao - 260}" fill="#C9B79A" stroke="${L}" stroke-width="5"/><rect x="1590" y="220" width="330" height="${chao - 220}" fill="#9AB0C4" stroke="${L}" stroke-width="5"/>`;
      [[40, 320], [180, 320], [40, 520], [180, 520]].forEach(([x, y]) => { s += `<rect x="${x}" y="${y}" width="100" height="120" fill="#5A7A9A" stroke="${L}" stroke-width="4"/>`; });
      [[1630, 280], [1770, 280], [1630, 480], [1770, 480]].forEach(([x, y]) => { s += `<rect x="${x}" y="${y}" width="100" height="120" fill="#3A5A7A" stroke="${L}" stroke-width="4"/>`; });
      // padaria: fachada de tijolinho + reboco
      s += `<rect x="330" y="150" width="1260" height="${chao - 150}" fill="#F3D9A8" stroke="${L}" stroke-width="6"/>`;
      for (let y = 560; y < chao; y += 30) for (let x = 330 + ((y / 30) % 2) * 30; x < 1590; x += 60) s += `<rect x="${x}" y="${y}" width="56" height="26" fill="#C8704A" opacity=".9"/>`;
      s += `<rect x="330" y="545" width="1260" height="18" fill="#8A5A30" stroke="${L}" stroke-width="4"/>`;
      // letreiro
      s += `<rect x="470" y="180" width="980" height="130" rx="18" fill="#5A3420" stroke="${L}" stroke-width="7"/><rect x="488" y="196" width="944" height="98" rx="12" fill="none" stroke="#C9A24A" stroke-width="4"/>${txt(960, 270, nome, 68, '#FFE9B0')}`;
      // toldo listrado
      let toldo = ''; for (let i = 0; i < 14; i++) toldo += `<path d="M${380 + i * 83} 330 h83 l-8 110 h-83Z" fill="${i % 2 ? '#F4F1E8' : '#C8553D'}" stroke="${L}" stroke-width="3"/>`;
      s += toldo + `<path d="M372 330 H1546" stroke="${L}" stroke-width="6"/>` + [...Array(14)].map((_, i) => `<path d="M${372 + i * 83} 440 q41 26 83 0" fill="${i % 2 ? '#F4F1E8' : '#C8553D'}" stroke="${L}" stroke-width="3"/>`).join('');
      // vitrine com pães e porta
      s += `<rect x="400" y="480" width="640" height="${chao - 560}" fill="#CFEAF6" stroke="${L}" stroke-width="6" opacity=".95"/>`;
      for (let i = 0; i < 5; i++) s += D.paoFrances(470 + i * 120, chao - 120, 0.34);
      s += `<path d="M430 500 L560 ${chao - 90}" stroke="#fff" stroke-width="16" opacity=".35"/>`;
      s += `<rect x="1120" y="470" width="300" height="${chao - 470}" fill="#8A5A30" stroke="${L}" stroke-width="6"/><rect x="1150" y="500" width="240" height="220" fill="#CFEAF6" stroke="${L}" stroke-width="4"/><circle cx="1150" cy="${chao - 200}" r="10" fill="#C9A24A" stroke="${L}" stroke-width="3"/>`;
      s += `<g transform="rotate(-4 1270 600)"><rect x="1190" y="570" width="160" height="60" rx="6" fill="#fff" stroke="${L}" stroke-width="3"/>${txt(1270, 612, 'ABERTO', 32, '#2E9E5A')}</g>`;
      // calçada
      s += `<rect y="${chao}" width="${w}" height="${h - chao}" fill="#C9C2B4"/><rect y="${chao}" width="${w}" height="16" fill="#000" opacity=".18"/>` + [...Array(12)].map((_, i) => `<path d="M${i * 170} ${chao} l-40 ${h - chao}" stroke="#A9A294" stroke-width="3"/>`).join('');
      // vaso com planta
      s += `<path d="M1460 ${chao} l12 -70 h60 l12 70Z" fill="#B0603A" stroke="${L}" stroke-width="4"/>` + [0, 1, 2, 3, 4].map(k => `<ellipse cx="${1500 + (k - 2) * 18}" cy="${chao - 96 - (k % 2) * 20}" rx="22" ry="34" fill="${k % 2 ? '#3E8A4A' : '#2E7A3E'}" stroke="${L}" stroke-width="3"/>`).join('');
      return s;
    };

    // ---------- ícones (para os cartões): origem no centro, ~120 px com k = 1 ----------
    const I = {
      casa: () => `<path d="M-55 0 V-60 L0 -105 L55 -60 V0Z" fill="#F3D9A8" stroke="${L}" stroke-width="6"/><path d="M-72 -55 L0 -118 L72 -55" fill="none" stroke="#C8553D" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><rect x="-16" y="-44" width="32" height="44" fill="#8A5A30" stroke="${L}" stroke-width="4"/><rect x="18" y="-70" width="26" height="24" fill="#9ED3F0" stroke="${L}" stroke-width="4"/>`,
      carro: () => `<path d="M-70 -14 Q-72 -40 -50 -44 L-30 -46 Q-16 -76 14 -76 Q44 -76 54 -46 L70 -42 Q78 -40 76 -14Z" fill="#3B7DD8" stroke="${L}" stroke-width="6" stroke-linejoin="round"/><path d="M-24 -48 Q-12 -68 10 -68 V-48Z M18 -68 Q40 -68 48 -48 H18Z" fill="#CFEAF6" stroke="${L}" stroke-width="4"/><circle cx="-38" cy="-12" r="16" fill="#22252A" stroke="${L}" stroke-width="4"/><circle cx="44" cy="-12" r="16" fill="#22252A" stroke="${L}" stroke-width="4"/><circle cx="-38" cy="-12" r="6" fill="#9AA0A8"/><circle cx="44" cy="-12" r="6" fill="#9AA0A8"/>`,
      cofrinho: () => `<ellipse cx="0" cy="-48" rx="62" ry="44" fill="#F49AB0" stroke="${L}" stroke-width="6"/><circle cx="58" cy="-52" r="16" fill="#F7B8C8" stroke="${L}" stroke-width="5"/><circle cx="54" cy="-54" r="3" fill="${L}"/><circle cx="63" cy="-54" r="3" fill="${L}"/><path d="M-20 -86 l14 -18 l10 18" fill="#F49AB0" stroke="${L}" stroke-width="5"/><rect x="-14" y="-96" width="30" height="7" rx="3" fill="${L}"/><path d="M-36 -8 v10 M28 -8 v10" stroke="${L}" stroke-width="12" stroke-linecap="round"/><circle cx="26" cy="-70" r="5" fill="${L}"/><circle cx="2" cy="-118" r="14" fill="#F2C230" stroke="${L}" stroke-width="4"/>`,
      lampada: () => `<circle cx="0" cy="-70" r="40" fill="#FFE27A" stroke="${L}" stroke-width="6"/><rect x="-20" y="-34" width="40" height="30" rx="6" fill="#9AA0A8" stroke="${L}" stroke-width="5"/><path d="M-12 -70 q12 -20 24 0" stroke="#C9A24A" stroke-width="4" fill="none"/>${[0, 60, 120, 180].map(a => `<path d="M${f(Math.cos((a - 90) * Math.PI / 180) * 54)} ${f(-70 + Math.sin((a - 90) * Math.PI / 180) * 54)} l${f(Math.cos((a - 90) * Math.PI / 180) * 14)} ${f(Math.sin((a - 90) * Math.PI / 180) * 14)}" stroke="#F2B705" stroke-width="6" stroke-linecap="round"/>`).join('')}`,
      carrinho: () => `<path d="M-64 -100 h22 l18 70 h66 l14 -50 h-88" fill="none" stroke="${L}" stroke-width="8" stroke-linejoin="round"/><path d="M-30 -80 h88 l-12 44 h-64Z" fill="#FF7A00" stroke="${L}" stroke-width="5"/><circle cx="-14" cy="-14" r="11" fill="${L}"/><circle cx="40" cy="-14" r="11" fill="${L}"/>`,
      escola: () => `<rect x="-50" y="-100" width="100" height="90" rx="6" fill="#2E9E5A" stroke="${L}" stroke-width="6"/><rect x="-36" y="-100" width="12" height="90" fill="#1E6E3E"/><path d="M-10 -76 h44 M-10 -58 h44 M-10 -40 h30" stroke="#F4F1E8" stroke-width="5"/><path d="M40 -30 l30 -70 l14 6 l-30 70 l-16 6Z" fill="#F2C230" stroke="${L}" stroke-width="4"/>`,
      documento: () => `<path d="M-46 -112 h66 l26 26 v86 h-92Z" fill="#fff" stroke="${L}" stroke-width="6" stroke-linejoin="round"/><path d="M20 -112 v26 h26" fill="none" stroke="${L}" stroke-width="5"/>${[0, 1, 2, 3].map(i => `<path d="M-30 ${-80 + i * 18} h${i === 3 ? 34 : 58}" stroke="#9AA0A8" stroke-width="5"/>`).join('')}<path d="M-30 -12 q14 -14 24 0 t26 -4" stroke="#3B5E8C" stroke-width="4" fill="none"/>`,
      escudo: () => `<path d="M0 -130 L60 -106 V-56 Q60 -10 0 10 Q-60 -10 -60 -56 V-106Z" fill="#FF7A00" stroke="${L}" stroke-width="7" stroke-linejoin="round"/><path d="M0 -112 L44 -94 V-58 Q44 -24 0 -8Z" fill="#FFA24D"/><path d="M-22 -60 l16 16 l30 -34" stroke="${L}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      maquina: () => `<rect x="-50" y="-30" width="100" height="30" rx="6" fill="#9AA0A8" stroke="${L}" stroke-width="5"/><path d="M-36 -30 V-100 Q-36 -118 -10 -118 H40 V-96 H-10 V-30" fill="#C8553D" stroke="${L}" stroke-width="5" stroke-linejoin="round"/><path d="M-6 -60 h50 l-6 30 h-38Z" fill="#CFD5DB" stroke="${L}" stroke-width="4"/><path d="M20 -96 v30" stroke="${L}" stroke-width="5"/>`,
      loja: () => `<rect x="-58" y="-80" width="116" height="80" fill="#F3D9A8" stroke="${L}" stroke-width="6"/><path d="M-66 -80 h132 l-8 -30 h-116Z" fill="#C8553D" stroke="${L}" stroke-width="5"/><path d="M-50 -96 h100" stroke="#F4F1E8" stroke-width="6" stroke-dasharray="14 12"/><rect x="-14" y="-46" width="28" height="46" fill="#8A5A30" stroke="${L}" stroke-width="4"/><rect x="-48" y="-62" width="26" height="26" fill="#9ED3F0" stroke="${L}" stroke-width="4"/><rect x="22" y="-62" width="26" height="26" fill="#9ED3F0" stroke="${L}" stroke-width="4"/>`,
      cadeado: () => `<path d="M-30 -60 V-84 a30 30 0 0 1 60 0 V-60" fill="none" stroke="#9AA0A8" stroke-width="12"/><rect x="-46" y="-62" width="92" height="66" rx="12" fill="#F2C230" stroke="${L}" stroke-width="6"/><circle cx="0" cy="-36" r="9" fill="${L}"/><path d="M0 -32 v16" stroke="${L}" stroke-width="7"/>`,
      balanca: () => `<path d="M0 -120 V-10 M-40 0 h80" stroke="${L}" stroke-width="8" stroke-linecap="round"/><path d="M-70 -100 H70" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M-70 -100 l-24 46 h48Z M70 -100 l-24 46 h48Z" fill="#F2C230" stroke="${L}" stroke-width="5" stroke-linejoin="round"/><circle cx="0" cy="-120" r="10" fill="#F2C230" stroke="${L}" stroke-width="4"/>`,
    };
    P.icone = (nome, x, y, k = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${I[nome]()}</g>`;
    return P;
  }
  global.Padaria = Padaria;
})(typeof window !== 'undefined' ? window : globalThis);
