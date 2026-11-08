/*
  ilha.js — série "sobrevivente na ilha deserta" (skill cenario-ilustrado): praia com mar ao redor, coqueiros,
  avião (em voo, janela por dentro, destroços), malas e itens, SOS, abrigo, helicóptero.
  Acabamento do cenario-ilustrado: luz da esquerda, 3 tons, contorno #1D1D2B, sombra de contato.
  Origem dos objetos: centro da base, no chão. Classes animáveis: .onda .espuma .fumaca .rotor .folha
    const I = Ilha({ seed: 4 });
    I.praia({ horizonte: 900, areia: 1250 })  · I.mar({ horizonte })  (só céu e mar, para a cena do voo)
    I.coqueiro(x, base, k, { inclina }) · I.fuselagem(x, y, k) · I.asa(x, y, k) · I.cauda(x, y, k)
    I.aviao(x, y, k) (em voo, de lado) · I.janela() (vista de dentro, tela cheia) · I.mascara(x, y, k)
    I.mala(x, y, k, { cor, aberta }) · I.item(nome, x, y, k): roupas, garrafa, saco, espelho, isqueiro, colete, kit, celular, coco
    I.sos(x, y, k) · I.abrigo(x, y, k) · I.helicoptero(x, y, k)
*/
(function (global) {
  function Ilha({ seed = 4 } = {}) {
    const L = '#1D1D2B';
    let st = seed >>> 0 || 1;
    const rnd = (a = 0, b = 1) => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return a + (b - a) * (((t ^ (t >>> 14)) >>> 0) / 4294967296); };
    const rgb = c => [0, 2, 4].map(i => parseInt(c.slice(1).substr(i, 2), 16));
    const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    const tom = (c, k) => { const A = rgb(c), B = k >= 0 ? [255, 255, 255] : [20, 16, 26], t = Math.abs(k); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
    const f = v => Math.round(v * 10) / 10;
    let n = 0; const uid = p => `il${seed}_${p}${++n}`;
    const pos = (x, y, k, corpo) => `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${corpo}</g>`;
    const sombra = (w, op = 0.25) => `<ellipse cx="${f(w * 0.08)}" cy="4" rx="${f(w)}" ry="${f(w * 0.12)}" fill="#000" opacity="${op}"/>`;
    const I = {};

    // ---------- céu + mar (até o horizonte e além) ----------
    const ceuMar = (w, h, hz, ate) => {
      const gc = uid('c'), gm = uid('m');
      let s = `<defs><linearGradient id="${gc}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FA8E0"/><stop offset=".75" stop-color="#BFE6F7"/><stop offset="1" stop-color="#F1F8F4"/></linearGradient>`
        + `<linearGradient id="${gm}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F6FA8"/><stop offset=".55" stop-color="#2E9FC8"/><stop offset="1" stop-color="#4FD1D9"/></linearGradient></defs>`;
      s += `<rect width="${w}" height="${hz}" fill="url(#${gc})"/><circle cx="${w * 0.78}" cy="${hz * 0.28}" r="78" fill="#FFF3B0"/><circle cx="${w * 0.78}" cy="${hz * 0.28}" r="140" fill="#FFF3B0" opacity=".25"/>`;
      [[0.18, 0.22, 1.1], [0.55, 0.12, 0.8], [0.4, 0.42, 0.7]].forEach(([u, v, k]) => { const cx = w * u, cy = hz * v; s += `<g opacity=".95">${[[-60, 0, 46], [-15, -24, 58], [40, -6, 50], [80, 10, 36]].map(([dx, dy, r]) => `<circle cx="${f(cx + dx * k)}" cy="${f(cy + dy * k)}" r="${f(r * k)}" fill="#fff"/>`).join('')}<rect x="${f(cx - 100 * k)}" y="${f(cy)}" width="${f(220 * k)}" height="${f(40 * k)}" fill="#fff"/></g>`; });
      s += `<rect y="${hz}" width="${w}" height="${ate - hz}" fill="url(#${gm})"/><path d="M0 ${hz} H${w}" stroke="#1A5A8A" stroke-width="3"/>`;
      for (let i = 0; i < 28; i++) { const y = hz + 20 + (i / 28) ** 1.4 * (ate - hz - 30), x = rnd(0, w), l = 30 + (y - hz) * 0.25; s += `<path class="onda" d="M${f(x)} ${f(y)} q${f(l / 2)} -8 ${f(l)} 0" stroke="#fff" stroke-width="${f(2 + (y - hz) * 0.012)}" fill="none" opacity=".55" stroke-linecap="round"/>`; }
      return s;
    };
    I.mar = ({ w = 1080, h = 1920, horizonte = 1100 } = {}) => ceuMar(w, h, horizonte, h);
    I.praia = ({ w = 1080, h = 1920, horizonte = 900, areia = 1250 } = {}) => {
      let s = ceuMar(w, h, horizonte, areia + 40);
      // espuma da beira e areia molhada
      s += `<path d="M0 ${areia - 10} Q${w * 0.25} ${areia - 34} ${w * 0.5} ${areia - 12} T${w} ${areia - 20} V${areia + 40} H0Z" fill="#E7D3A0"/>`;
      s += `<path class="espuma" d="M0 ${areia - 10} Q${w * 0.25} ${areia - 34} ${w * 0.5} ${areia - 12} T${w} ${areia - 20}" stroke="#fff" stroke-width="12" fill="none" opacity=".85"/>`;
      s += `<rect y="${areia + 30}" width="${w}" height="${h - areia - 30}" fill="#F2DDA6"/><path d="M0 ${areia + 30} Q${w * 0.5} ${areia + 10} ${w} ${areia + 30}" stroke="#E1C688" stroke-width="10" fill="none"/>`;
      for (let i = 0; i < 160; i++) s += `<circle cx="${f(rnd(0, w))}" cy="${f(rnd(areia + 40, h))}" r="${f(rnd(1, 3))}" fill="${rnd() < 0.5 ? '#D9BE80' : '#FFF4D0'}" opacity=".8"/>`;
      for (let i = 0; i < 10; i++) { const x = rnd(40, w - 40), y = rnd(areia + 120, h - 60); s += rnd() < 0.5 ? `<path d="M${f(x - 10)} ${f(y)} q10 -16 20 0Z" fill="#F7E0E8" stroke="${L}" stroke-width="2"/>` : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rnd(10, 22))}" ry="${f(rnd(6, 12))}" fill="#B9B0A0" stroke="${L}" stroke-width="2"/>`; }
      return s;
    };

    // ---------- coqueiro: tronco curvo em anéis, folhas em leque, cocos ----------
    I.coqueiro = (x, base, k = 1, { inclina = 0.25, folhas = '#3E8A3A' } = {}) => {
      const h = 520, topo = [inclina * h, -h];
      let s = sombra(160, 0.18);
      const tronco = `M-22 0 Q${f(topo[0] * 0.2)} ${f(-h * 0.5)} ${f(topo[0] - 12)} ${f(-h)} L${f(topo[0] + 12)} ${f(-h)} Q${f(topo[0] * 0.2 + 34)} ${f(-h * 0.5)} 22 0Z`;
      s += `<path d="${tronco}" fill="#A8794A" stroke="${L}" stroke-width="6"/>`;
      for (let i = 1; i < 12; i++) { const u = i / 12, cx = (1 - u) * (1 - u) * 0 + 2 * (1 - u) * u * topo[0] * 0.2 + u * u * topo[0], cy = -h * u; s += `<path d="M${f(cx - 22 + u * 10)} ${f(cy)} q${f(22 - u * 10)} 8 ${f(44 - u * 20)} 0" stroke="#7A5232" stroke-width="4" fill="none"/>`; }
      s += `<path d="M-14 -20 Q${f(topo[0] * 0.15)} ${f(-h * 0.5)} ${f(topo[0] - 4)} ${f(-h + 20)}" stroke="#C9A06A" stroke-width="5" fill="none" opacity=".6"/>`;
      const folha = (ang, comp, cor) => { const a = ang * Math.PI / 180, ex = Math.cos(a) * comp, ey = Math.sin(a) * comp, cx = ex * 0.5 - Math.sin(a) * 40, cy = ey * 0.5 - 60;
        let p = `<path class="folha" d="M0 0 Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}" stroke="${tom(cor, -0.3)}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
        for (let i = 1; i < 9; i++) { const u = i / 9, px = 2 * (1 - u) * u * cx + u * u * ex, py = 2 * (1 - u) * u * cy + u * u * ey; p += `<path d="M${f(px)} ${f(py)} l${f(-Math.sin(a) * 50 * (1 - u * 0.5) + Math.cos(a) * 10)} ${f(Math.cos(a) * 50 * (1 - u * 0.5) + 26)}" stroke="${cor}" stroke-width="10" stroke-linecap="round"/>`; }
        return p; };
      s += `<g transform="translate(${f(topo[0])} ${f(-h)})">` + [[-170, 220, tom(folhas, -0.15)], [-120, 240, folhas], [-60, 230, folhas], [-10, 220, tom(folhas, 0.1)], [40, 200, folhas], [-200, 180, tom(folhas, -0.2)], [10, 180, tom(folhas, 0.15)]].map(([a, c, cor]) => folha(a, c, cor)).join('')
        + [[-16, 18], [10, 22], [-2, 34]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="18" fill="#6B8A2E" stroke="${L}" stroke-width="4"/>`).join('') + `</g>`;
      return pos(x, base, k, s);
    };

    // ---------- avião em voo (de lado, indo para a direita) ----------
    I.aviao = (x, y, k = 1) => {
      let s = `<path d="M-300 -40 Q-330 -40 -340 0 Q-330 40 -280 44 L260 44 Q330 40 360 0 Q330 -40 260 -44 L-280 -44Z" fill="#F4F6F8" stroke="${L}" stroke-width="7"/>`;
      s += `<path d="M-330 14 H340" stroke="#1F5FAF" stroke-width="12"/><path d="M-320 26 H330" stroke="${LARANJA}" stroke-width="6"/>`;
      for (let i = 0; i < 14; i++) s += `<rect x="${-240 + i * 36}" y="-22" width="18" height="22" rx="8" fill="#5A7A9A" stroke="${L}" stroke-width="3"/>`;
      s += `<path d="M300 -30 Q330 -28 345 -6 L310 -6Z" fill="#2A3A4A" stroke="${L}" stroke-width="4"/>`;   // cabine
      s += `<path d="M-280 -40 L-330 -150 L-260 -150 L-200 -42Z" fill="#1F5FAF" stroke="${L}" stroke-width="6"/><path d="M-300 -110 l40 0" stroke="${LARANJA}" stroke-width="10"/>`;   // cauda
      s += `<path d="M-40 20 L-160 130 L-100 130 L60 24Z" fill="#D9DEE3" stroke="${L}" stroke-width="6"/>`;   // asa
      s += `<g id="motor"><rect x="-120" y="64" width="110" height="44" rx="20" fill="#9AA0A8" stroke="${L}" stroke-width="5"/><ellipse cx="-10" cy="86" rx="8" ry="20" fill="#2A2E36"/></g>`;
      return pos(x, y, k, s);
    };
    const LARANJA = '#FF7A00';

    // ---------- janela do avião vista de dentro (tela cheia) ----------
    I.janela = ({ w = 1080, h = 1920 } = {}) => {
      const gp = uid('p');
      let s = `<defs><linearGradient id="${gp}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9CED4"/><stop offset=".5" stop-color="#E4E8EC"/><stop offset="1" stop-color="#B9BEC4"/></linearGradient>`
        + `<clipPath id="janela-vao"><rect x="290" y="560" width="500" height="720" rx="250"/></clipPath></defs>`;
      s += `<rect width="${w}" height="${h}" fill="url(#${gp})"/>`;
      s += `<rect x="250" y="520" width="580" height="800" rx="290" fill="#AEB4BA" stroke="${L}" stroke-width="8"/><rect x="270" y="540" width="540" height="760" rx="270" fill="#8E949A"/>`;
      s += `<g clip-path="url(#janela-vao)"><g id="lado-de-fora"></g></g>`;
      s += `<rect x="290" y="560" width="500" height="720" rx="250" fill="none" stroke="${L}" stroke-width="8"/><path d="M340 640 L420 600" stroke="#fff" stroke-width="16" opacity=".35" stroke-linecap="round"/>`;
      // painel de cima (luz de cinto) e encosto da poltrona
      s += `<rect x="0" y="0" width="${w}" height="240" fill="#B9BEC4" stroke="${L}" stroke-width="6"/><g id="aviso-cinto"><rect x="430" y="110" width="220" height="80" rx="14" fill="#2A2E36" stroke="${L}" stroke-width="5"/><rect id="aviso-luz" x="446" y="124" width="188" height="52" rx="10" fill="#555"/><path d="M500 150 h80 M520 138 v24 M560 138 v24" stroke="#888" stroke-width="7" stroke-linecap="round"/></g>`;
      s += `<path d="M0 1560 Q200 1500 420 1540 L420 ${h} H0Z" fill="#2E4A7A" stroke="${L}" stroke-width="6"/><rect x="40" y="1600" width="320" height="40" rx="10" fill="#1F3A60"/>`;
      return s;
    };
    I.mascara = (x, y, k = 1) => pos(x, y, k, `<path d="M0 -260 Q20 -150 0 -50" stroke="#F2F2EE" stroke-width="8" fill="none"/><path d="M-50 -40 Q0 -80 50 -40 L40 30 Q0 50 -40 30Z" fill="#F2D23A" stroke="${L}" stroke-width="6"/><path d="M-36 -10 Q0 -30 36 -10" stroke="#fff" stroke-width="6" opacity=".6" fill="none"/><path d="M-50 -20 Q-90 10 -60 40 M50 -20 Q90 10 60 40" stroke="#C9A24A" stroke-width="5" fill="none"/>`);

    // ---------- destroços na areia ----------
    I.fuselagem = (x, y, k = 1) => {
      let s = sombra(420, 0.22);
      s += `<path d="M-420 -20 Q-440 -150 -380 -240 L300 -260 L330 -230 L300 -200 L340 -170 L300 -130 L330 -90 L290 -50 L320 -10 L280 10 L-400 10Z" fill="#E9ECEF" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`;
      s += `<path d="M-380 -240 L300 -260 L300 -230 L-400 -210Z" fill="#fff" opacity=".6"/><path d="M-410 -60 L290 -70" stroke="#1F5FAF" stroke-width="14"/><path d="M-410 -40 L290 -50" stroke="${LARANJA}" stroke-width="7"/>`;
      for (let i = 0; i < 11; i++) s += `<rect x="${-340 + i * 58}" y="-180" width="26" height="34" rx="12" fill="${i === 4 || i === 7 ? '#1A1A1E' : '#5A7A9A'}" stroke="${L}" stroke-width="3"/>`;
      s += `<path d="M300 -260 L330 -230 L300 -200 L340 -170 L300 -130 L330 -90 L290 -50 L320 -10 L280 10 L250 10 Q270 -120 250 -250Z" fill="#2A2E36"/>`;   // interior escuro na quebra
      s += `<path d="M-200 0 L-120 -10 M40 -4 L120 -12" stroke="#9AA0A8" stroke-width="4"/><path d="M-60 -120 l30 20 l-10 30" stroke="#5A5F66" stroke-width="4" fill="none"/>`;   // amassados
      s += `<g class="fumaca">${[0, 1, 2, 3].map(i => `<circle cx="${280 + i * 18}" cy="${-280 - i * 70}" r="${36 + i * 16}" fill="#5A5A62" opacity="${0.55 - i * 0.1}"/>`).join('')}</g>`;
      return pos(x, y, k, s);
    };
    I.asa = (x, y, k = 1) => pos(x, y, k, sombra(260, 0.2) + `<path d="M-260 0 L-120 -70 L260 -40 L240 0Z" fill="#D9DEE3" stroke="${L}" stroke-width="7" stroke-linejoin="round"/><path d="M-200 -14 L220 -20" stroke="#9AA0A8" stroke-width="4"/><rect x="-60" y="-26" width="120" height="34" rx="16" fill="#9AA0A8" stroke="${L}" stroke-width="5"/>`);
    I.cauda = (x, y, k = 1) => pos(x, y, k, sombra(140, 0.2) + `<path d="M-130 0 L-90 -260 L10 -260 L130 0Z" fill="#1F5FAF" stroke="${L}" stroke-width="7" stroke-linejoin="round"/><path d="M-96 -200 L60 -200" stroke="${LARANJA}" stroke-width="14"/><path d="M-60 -30 L90 -24" stroke="#fff" stroke-width="5" opacity=".4"/>`);

    // ---------- malas ----------
    I.mala = (x, y, k = 1, { cor = '#C8553D', aberta = false } = {}) => {
      let s = sombra(130, 0.22);
      s += `<rect x="-120" y="-150" width="240" height="150" rx="18" fill="${cor}" stroke="${L}" stroke-width="6"/>`;
      s += [-60, 0, 60].map(dx => `<path d="M${dx} -146 V-4" stroke="${tom(cor, -0.25)}" stroke-width="5"/>`).join('') + `<rect x="-120" y="-150" width="40" height="150" rx="18" fill="#fff" opacity=".15"/>`;
      if (aberta) {
        s += `<path d="M-120 -150 L-140 -330 Q-140 -350 -120 -350 L100 -350 Q120 -350 120 -330 L120 -150Z" fill="${tom(cor, -0.15)}" stroke="${L}" stroke-width="6"/><rect x="-104" y="-330" width="208" height="160" rx="10" fill="${tom(cor, 0.25)}" opacity=".6"/>`;
        s += `<rect x="-106" y="-150" width="212" height="24" fill="#F4F1EA" stroke="${L}" stroke-width="3"/><path d="M-90 -150 q30 -26 60 0 q30 -26 60 0 q30 -26 60 0" fill="#3B7DD8" stroke="${L}" stroke-width="3"/>`;
      } else {
        s += `<path d="M-40 -150 V-182 H40 V-150" stroke="${L}" stroke-width="10" fill="none" stroke-linejoin="round"/><path d="M-40 -150 V-176 H40 V-150" stroke="#2A2E36" stroke-width="5" fill="none"/>`;
      }
      s += `<circle cx="-90" cy="4" r="12" fill="#2A2E36"/><circle cx="90" cy="4" r="12" fill="#2A2E36"/>`;
      return pos(x, y, k, s);
    };

    // ---------- itens (ícones grandes para os cartões e para a areia) ----------
    const IT = {
      roupas: `<rect x="-90" y="-40" width="180" height="40" rx="8" fill="#3B7DD8" stroke="${L}" stroke-width="5"/><rect x="-80" y="-78" width="160" height="40" rx="8" fill="#F2B705" stroke="${L}" stroke-width="5"/><rect x="-86" y="-116" width="172" height="40" rx="8" fill="#E9ECEF" stroke="${L}" stroke-width="5"/><path d="M-20 -116 q20 14 40 0" stroke="${L}" stroke-width="4" fill="none"/>`,
      garrafa: `<rect x="-34" y="-170" width="68" height="170" rx="16" fill="#CFEAF6" stroke="${L}" stroke-width="6"/><rect x="-20" y="-200" width="40" height="32" rx="6" fill="#3B7DD8" stroke="${L}" stroke-width="5"/><rect x="-34" y="-110" width="68" height="40" fill="#3B7DD8" opacity=".8"/><path d="M-18 -150 V-20" stroke="#fff" stroke-width="8" opacity=".6"/>`,
      saco: `<path d="M-70 0 Q-90 -90 -50 -150 L-30 -170 L30 -170 L50 -150 Q90 -90 70 0Z" fill="#E9F3F8" stroke="${L}" stroke-width="5" opacity=".95"/><path d="M-30 -170 q-10 -30 10 -36 M30 -170 q10 -30 -10 -36" stroke="${L}" stroke-width="5" fill="none"/><path d="M-40 -120 Q-50 -60 -30 -20" stroke="#fff" stroke-width="10" opacity=".7" fill="none"/>`,
      espelho: `<ellipse cx="0" cy="-70" rx="80" ry="70" fill="#F2B7C8" stroke="${L}" stroke-width="6"/><ellipse cx="0" cy="-70" rx="62" ry="54" fill="#CFEAF6" stroke="${L}" stroke-width="4"/><path d="M-30 -96 L10 -110" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="M-20 -60 L30 -80" stroke="#fff" stroke-width="6" opacity=".7" stroke-linecap="round"/>`,
      isqueiro: `<rect x="-36" y="-150" width="72" height="150" rx="12" fill="#D7263D" stroke="${L}" stroke-width="6"/><rect x="-30" y="-186" width="60" height="40" rx="6" fill="#9AA0A8" stroke="${L}" stroke-width="5"/><path d="M0 -200 q-24 -40 0 -80 q24 40 0 80Z" fill="${LARANJA}" stroke="${L}" stroke-width="4"/><path d="M0 -210 q-10 -20 0 -40 q10 20 0 40Z" fill="#FFE27A"/>`,
      colete: `<path d="M-90 0 L-100 -150 Q-60 -200 -30 -170 L-20 -60 L20 -60 L30 -170 Q60 -200 100 -150 L90 0Z" fill="#F2B705" stroke="${L}" stroke-width="6" stroke-linejoin="round"/><path d="M-80 -60 H80" stroke="${LARANJA}" stroke-width="10"/><circle cx="-60" cy="-110" r="14" fill="#FFF3B0" stroke="${L}" stroke-width="4"/><path d="M50 -120 l26 -6 l4 14 l-26 6Z" fill="#E9ECEF" stroke="${L}" stroke-width="4"/>`,
      kit: `<rect x="-100" y="-130" width="200" height="130" rx="16" fill="#F4F1EA" stroke="${L}" stroke-width="6"/><rect x="-40" y="-152" width="80" height="26" rx="8" fill="#9AA0A8" stroke="${L}" stroke-width="5"/><path d="M-14 -96 h28 v22 h22 v28 h-22 v22 h-28 v-22 h-22 v-28 h22Z" fill="#D7263D"/>`,
      celular: `<rect x="-50" y="-190" width="100" height="190" rx="16" fill="#16161C" stroke="${L}" stroke-width="6"/><rect x="-40" y="-176" width="80" height="150" rx="6" fill="#2A3A4A"/><text x="0" y="-96" font-family="'Anton', sans-serif" font-size="22" fill="#fff" text-anchor="middle">SEM SINAL</text>`,
      coco: `<circle cx="0" cy="-70" r="70" fill="#6B8A2E" stroke="${L}" stroke-width="6"/><circle cx="-24" cy="-96" r="18" fill="#8AAA4A" opacity=".7"/><path d="M-40 -40 q40 20 80 0" stroke="#4A6A1E" stroke-width="5" fill="none"/>`,
      lona: `<path d="M-160 -120 L160 -140 L130 -10 Q0 30 -130 -10Z" fill="#3B7DD8" stroke="${L}" stroke-width="6" opacity=".95"/><path d="M-60 -40 Q0 -10 60 -40" stroke="#fff" stroke-width="6" opacity=".5" fill="none"/>`,
    };
    I.item = (nome, x, y, k = 1) => pos(x, y, k, IT[nome]);

    // ---------- SOS na areia (letras feitas de pedras e troncos) ----------
    I.sos = (x, y, k = 1) => {
      const pedra = (px, py, r) => `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(r)}" ry="${f(r * 0.7)}" fill="${rnd() < 0.5 ? '#5A5F66' : '#7A7F86'}" stroke="${L}" stroke-width="3"/>`;
      // S = arco de cima (do canto superior direito, por cima e pela esquerda, até o meio) + arco de baixo (do meio, pela direita, até o canto inferior esquerdo)
      const tracoS = (ox) => { const r = 52, pts = [], rad = g => g * Math.PI / 180;
        for (let g = -20; g >= -270; g -= 25) pts.push([ox + Math.cos(rad(g)) * r, -148 + Math.sin(rad(g)) * r]);
        for (let g = -65; g <= 160; g += 25) pts.push([ox + Math.cos(rad(g)) * r, -52 + Math.sin(rad(g)) * r]);
        return pts.map(([px, py]) => pedra(px, py, 20)).join(''); };
      const O = ox => { let p = ''; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; p += pedra(ox + Math.cos(a) * 80, -100 + Math.sin(a) * 100, 22); } return p; };
      return pos(x, y, k, `<g id="sos-S1">${tracoS(-260)}</g><g id="sos-O">${O(0)}</g><g id="sos-S2">${tracoS(260)}</g>`);
    };
    // ---------- abrigo: painel do avião + folhas de coqueiro ----------
    I.abrigo = (x, y, k = 1) => pos(x, y, k, sombra(220, 0.25) + `<path d="M-220 0 L-60 -260 L200 -230 L220 0Z" fill="#E9ECEF" stroke="${L}" stroke-width="7" stroke-linejoin="round"/><path d="M-200 -40 L210 -40" stroke="#1F5FAF" stroke-width="10"/>`
      + [...Array(7)].map((_, i) => `<path d="M${-200 + i * 60} -10 Q${-140 + i * 60} -200 ${-60 + i * 50} -250" stroke="#3E8A3A" stroke-width="22" fill="none" stroke-linecap="round"/>`).join('')
      + `<path d="M-60 -260 L-60 0" stroke="#7A5232" stroke-width="14"/><rect x="-40" y="-120" width="200" height="120" fill="#000" opacity=".25"/>`);
    // ---------- helicóptero de resgate ----------
    I.helicoptero = (x, y, k = 1) => pos(x, y, k, `<path d="M-60 -10 Q-80 -90 0 -100 L120 -100 Q190 -90 190 -30 Q190 20 120 20 L-40 20 Q-60 18 -60 -10Z" fill="#D7263D" stroke="${L}" stroke-width="7"/>`
      + `<path d="M110 -90 Q170 -84 176 -40 L110 -40Z" fill="#CFEAF6" stroke="${L}" stroke-width="5"/><path d="M-60 -40 L-280 -60 L-290 -30 L-60 -10Z" fill="#D7263D" stroke="${L}" stroke-width="6"/><path d="M-300 -90 L-280 -20" stroke="${L}" stroke-width="10"/>`
      + `<text x="40" y="-24" font-family="'Anton', sans-serif" font-size="34" fill="#fff" text-anchor="middle">RESGATE</text><path d="M-30 40 H160 M-10 20 V40 M140 20 V40" stroke="${L}" stroke-width="8" stroke-linecap="round"/>`
      + `<path d="M40 -100 V-130" stroke="${L}" stroke-width="10"/><g class="rotor"><path d="M-220 -134 H300" stroke="${L}" stroke-width="12" stroke-linecap="round"/></g><g class="rotor-cauda"><path d="M-290 -110 V-10" stroke="${L}" stroke-width="7"/></g>`);
    return I;
  }
  global.Ilha = Ilha;
})(typeof window !== 'undefined' ? window : globalThis);
