/*
  objetos.js — objetos de cena em SVG, de época e atuais (skill "objetos-de-cena").
  Depende de cenario.js (usa a luz, a hora, os materiais da época e o gerador aleatório do cenário).

  const C = Cenario({ epoca: 'roma', hora: 'dia', luz: 1, seed: 4 });
  const O = Objetos(C);
  s += O.estatua(300, 1700, 0.9);     // (x, yDaBase, escala) — base no chão, centro em x
  // escala = a MESMA escala do boneco da cena → tamanho real coerente (boneco ≈ 1,75 m)

  Todos seguem: contorno #1D1D2B, 3 tons (luz/base/sombra) com luz vinda de C.luz,
  desgaste nas bordas de uso, sombra de contato no chão.
*/
(function (global) {
  function Objetos(C) {
    const tom = C.tom, luz = C.luz, rnd = C.rnd, MAT = C.mat || {};
    const L = '#1D1D2B';
    const f = v => Math.round(v * 10) / 10;
    // 1 metro em unidades de desenho com escala k (boneco ≈ 570 unid. = 1,75 m)
    const metro = k => 326 * k;
    const grupo = (x, y, k, corpo, contato = 0.5) => `<g transform="translate(${f(x)} ${f(y)}) scale(${k})"><ellipse cx="${luz * -14}" cy="2" rx="${f(contato * 160)}" ry="10" fill="${C.hora.sombra}" opacity=".28"/>${corpo}</g>`;
    // volume simples com lado de luz e lado de sombra
    const caixa = (x, y, w, h, cor, sw = 5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}" stroke="${L}" stroke-width="${sw}"/><rect x="${luz > 0 ? x : x + w * 0.72}" y="${y}" width="${w * 0.28}" height="${h}" fill="${C.hora.sombra}" opacity=".22"/>`;
    const madeira = MAT.madeira || '#7E5232', marmore = MAT.marmore || '#EDE3CF', bronze = MAT.bronze || '#A8822E', ceramica = MAT.ceramica || '#B8613A';

    const O = {
      metro,
      // ===================== ROMA / ANTIGUIDADE =====================
      // estátua de mármore de um romano de toga sobre pedestal (≈ 2,6 m com pedestal)
      estatua: (x, y, k = 1, { pose = 'orador', cor = marmore } = {}) => grupo(x, y, k, `
        ${caixa(-90, -230, 180, 230, tom(cor, -0.05))}<rect x="-104" y="-250" width="208" height="24" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="5"/><rect x="-104" y="-18" width="208" height="18" fill="${tom(cor, -0.12)}" stroke="${L}" stroke-width="5"/>
        <text x="0" y="-110" font-family="serif" font-size="30" font-weight="700" text-anchor="middle" fill="${tom(cor, -0.45)}">AUGUSTO</text>
        <path d="M-46 -250 L-56 -520 Q-20 -560 40 -540 L58 -250Z" fill="${cor}" stroke="${L}" stroke-width="6"/>
        <path d="M-40 -500 Q10 -440 50 -380 M-30 -440 Q10 -380 30 -300 M20 -520 Q40 -440 46 -260" stroke="${tom(cor, -0.25)}" stroke-width="4" fill="none"/>
        <path d="M${luz > 0 ? -56 : 20} -520 L${luz > 0 ? -46 : 58} -250 L${luz > 0 ? -10 : 30} -250 L${luz > 0 ? -30 : 40} -520Z" fill="${C.hora.sombra}" opacity=".18"/>
        ${pose === 'orador' ? `<path d="M36 -526 L118 -640" stroke="${L}" stroke-width="36" stroke-linecap="round"/><path d="M36 -526 L118 -640" stroke="${cor}" stroke-width="26" stroke-linecap="round"/><circle cx="122" cy="-650" r="17" fill="${cor}" stroke="${L}" stroke-width="5"/>` : ''}
        <path d="M-50 -520 L-70 -380" stroke="${L}" stroke-width="34" stroke-linecap="round"/><path d="M-50 -520 L-70 -380" stroke="${cor}" stroke-width="24" stroke-linecap="round"/>
        <rect x="-16" y="-582" width="32" height="40" fill="${cor}" stroke="${L}" stroke-width="5"/>
        <ellipse cx="0" cy="-622" rx="44" ry="50" fill="${cor}" stroke="${L}" stroke-width="6"/><path d="M-40 -640 Q0 -690 40 -640" stroke="${tom(cor, -0.3)}" stroke-width="10" fill="none"/>
        <path d="M-20 -620 h10 M10 -620 h10 M-8 -598 h16" stroke="${tom(cor, -0.35)}" stroke-width="4"/>`, 0.7),
      // busto sobre coluna (≈ 1,7 m)
      busto: (x, y, k = 1, { cor = marmore } = {}) => grupo(x, y, k, `
        <path d="M-40 0 L-34 -420 H34 L40 0Z" fill="${tom(cor, -0.05)}" stroke="${L}" stroke-width="5"/>${[-1, 0, 1].map(i => `<path d="M${i * 18} -10 V-410" stroke="${tom(cor, -0.2)}" stroke-width="3"/>`).join('')}
        <rect x="-56" y="-440" width="112" height="24" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="5"/>
        <path d="M-70 -440 Q-70 -500 -30 -510 H30 Q70 -500 70 -440Z" fill="${cor}" stroke="${L}" stroke-width="5"/>
        <rect x="-14" y="-530" width="28" height="26" fill="${cor}" stroke="${L}" stroke-width="5"/>
        <ellipse cx="0" cy="-566" rx="38" ry="44" fill="${cor}" stroke="${L}" stroke-width="5"/><path d="M-34 -580 Q0 -626 34 -580" stroke="${tom(cor, -0.3)}" stroke-width="9" fill="none"/>
        <path d="M${luz > 0 ? -38 : 0} -566 A38 44 0 0 0 0 -522 V-610 A38 44 0 0 0 ${luz > 0 ? -38 : 38} -566Z" fill="${C.hora.sombra}" opacity=".15"/>`, 0.35),
      // mosaico de chão (painel retangular; w,h em unidades)
      mosaico: (x, y, w = 600, h = 180, { cores = ['#E8DCC4', '#1D1D2B', '#9E2A22', '#C9A24A', '#3B5E8C'] } = {}) => {
        let s = `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cores[0]}" stroke="${L}" stroke-width="4"/>`;
        const t = 14;
        for (let i = 0; i < w / t; i++) for (let j = 0; j < h / t; j++) {
          const bx = x + i * t, by = y + j * t, borda = i < 1 || j < 1 || i > w / t - 2 || j > h / t - 2;
          const cx2 = (i - w / t / 2) / (w / t / 2), cy2 = (j - h / t / 2) / (h / t / 2);
          const anel = Math.abs(Math.hypot(cx2 * 1.4, cy2) - 0.55) < 0.12;
          const onda = j === Math.round(h / t / 2) && (i % 6 < 3);
          const c = borda ? cores[1] : anel ? cores[2] : onda ? cores[4] : (i + j) % 7 === 0 ? cores[3] : cores[0];
          s += `<rect x="${f(bx + 1)}" y="${f(by + 1)}" width="${t - 2}" height="${t - 2}" fill="${tom(c, rnd(-0.08, 0.06))}"/>`;
        }
        return s + `</g>`;
      },
      // braseiro de bronze com brasas (≈ 0,9 m)
      braseiro: (x, y, k = 1, { aceso = true } = {}) => grupo(x, y, k, `
        ${[-1, 0, 1].map(i => `<path d="M${i * 50} -150 L${i * 70} 0" stroke="${tom(bronze, -0.2)}" stroke-width="12" stroke-linecap="round"/>`).join('')}
        <path d="M-100 -200 Q0 -130 100 -200 L80 -150 Q0 -110 -80 -150Z" fill="${bronze}" stroke="${L}" stroke-width="5"/>
        ${aceso ? `<circle cx="0" cy="-200" r="150" fill="url(#${C.id}-fogo)" opacity=".5"/><path d="M-70 -196 Q-40 -230 -10 -196 Q20 -236 60 -196Z" fill="#C9401E"/><circle cx="-30" cy="-204" r="10" fill="#FFB347"/><circle cx="20" cy="-206" r="8" fill="#FFD27A"/><path d="M-10 -210 q-20 -40 10 -80 q10 30 30 20 q-10 30 -40 60Z" fill="#FF8A2B" opacity=".9"/>` : `<path d="M-70 -196 Q0 -220 60 -196Z" fill="#3A3030"/>`}`, 0.5),
      // triclínio: o sofá onde os romanos comiam deitados (≈ 2,2 m)
      triclinio: (x, y, k = 1, { tecido = (MAT.tecido || ['#9E2A22'])[0] } = {}) => grupo(x, y, k, `
        ${[-300, 300].map(px => `<rect x="${px - 14}" y="-120" width="28" height="120" fill="${madeira}" stroke="${L}" stroke-width="4"/>`).join('')}
        ${caixa(-340, -170, 680, 60, madeira)}
        <path d="M-340 -170 Q-360 -280 -300 -300 L-280 -170Z" fill="${madeira}" stroke="${L}" stroke-width="5"/>
        <rect x="-330" y="-206" width="660" height="40" rx="18" fill="${tecido}" stroke="${L}" stroke-width="5"/><path d="M-300 -186 H300" stroke="${tom(tecido, 0.25)}" stroke-width="4"/>
        <ellipse cx="-250" cy="-226" rx="60" ry="26" fill="${tom(tecido, 0.15)}" stroke="${L}" stroke-width="5"/>`, 1.2),
      // mesa redonda de três pés com pão, uvas e jarro (≈ 0,75 m)
      mesa: (x, y, k = 1, { comida = true } = {}) => grupo(x, y, k, `
        ${[-1, 0, 1].map(i => `<path d="M${i * 60} -220 Q${i * 80} -100 ${i * 90} 0" stroke="${madeira}" stroke-width="16" fill="none"/>`).join('')}
        <ellipse cx="0" cy="-230" rx="150" ry="28" fill="${tom(madeira, 0.15)}" stroke="${L}" stroke-width="5"/><path d="M-150 -230 v16 a150 28 0 0 0 300 0 v-16" fill="${tom(madeira, -0.2)}" stroke="${L}" stroke-width="5"/>
        ${comida ? `<ellipse cx="-60" cy="-262" rx="44" ry="24" fill="#D9A15B" stroke="${L}" stroke-width="4"/><path d="M-80 -270 l8 12 M-58 -276 l8 12" stroke="#A56E2E" stroke-width="4"/>${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${30 + (i % 3) * 14}" cy="${-250 - Math.floor(i / 3) * 14}" r="9" fill="#6B3A7A" stroke="${L}" stroke-width="2"/>`).join('')}<path d="M90 -236 Q76 -270 92 -300 H112 Q128 -270 114 -236Z" fill="${ceramica}" stroke="${L}" stroke-width="4"/>` : ''}`, 0.6),
      // banquinho (sella) — ≈ 0,45 m
      banco: (x, y, k = 1) => grupo(x, y, k, `<path d="M-70 0 L60 -140 M70 0 L-60 -140" stroke="${madeira}" stroke-width="14"/><rect x="-80" y="-160" width="160" height="26" rx="8" fill="${tom(madeira, 0.15)}" stroke="${L}" stroke-width="5"/>`, 0.4),
      // balança de pratos (libra) — ≈ 0,6 m
      balanca: (x, y, k = 1, { inclina = 6 } = {}) => grupo(x, y, k, `
        <rect x="-50" y="-16" width="100" height="16" fill="${tom(bronze, -0.15)}" stroke="${L}" stroke-width="4"/><rect x="-6" y="-200" width="12" height="186" fill="${bronze}" stroke="${L}" stroke-width="3"/>
        <g transform="rotate(${inclina} 0 -200)"><path d="M-120 -200 H120" stroke="${bronze}" stroke-width="10" stroke-linecap="round"/>
        ${[-110, 110].map((px, i) => `<path d="M${px} -200 L${px - 30} ${-120 + (i ? -inclina * 3 : inclina * 3) * 0} M${px} -200 L${px + 30} -120" stroke="${L}" stroke-width="2"/><path d="M${px - 40} -120 Q${px} -96 ${px + 40} -120Z" fill="${bronze}" stroke="${L}" stroke-width="4"/>`).join('')}</g>`, 0.4),
      // pilha de moedas (denários)
      moedas: (x, y, k = 1, n = 6) => grupo(x, y, k, [...Array(n)].map((_, i) => `<ellipse cx="${f(rnd(-6, 6) + (i > 3 ? 40 : 0))}" cy="${-8 - (i % 4) * 10}" rx="26" ry="9" fill="${i % 2 ? '#C9A24A' : '#DDB85A'}" stroke="${L}" stroke-width="3"/>`).join(''), 0.25),
      // tábua de cera com estilete (escrita do dia a dia)
      tabuaCera: (x, y, k = 1) => grupo(x, y, k, `<rect x="-90" y="-12" width="180" height="12" fill="${madeira}" stroke="${L}" stroke-width="3" transform="skewX(-30)"/><rect x="-84" y="-20" width="168" height="10" fill="#3A2A1A" transform="skewX(-30)"/><path d="M-40 -16 h50 M-30 -12 h60" stroke="#C9A24A" stroke-width="2" transform="skewX(-30)"/><path d="M60 -24 L130 -60" stroke="${bronze}" stroke-width="6" stroke-linecap="round"/>`, 0.4),
      // pergaminho (rolo)
      pergaminho: (x, y, k = 1) => grupo(x, y, k, `<rect x="-90" y="-60" width="180" height="50" fill="#EADBB4" stroke="${L}" stroke-width="4"/><circle cx="-90" cy="-35" r="26" fill="#D9C79A" stroke="${L}" stroke-width="4"/><circle cx="90" cy="-35" r="26" fill="#D9C79A" stroke="${L}" stroke-width="4"/><path d="M-60 -46 h100 M-60 -32 h80 M-60 -20 h110" stroke="#7A6A4A" stroke-width="3"/>`, 0.4),
      // coroa de louros
      louros: (x, y, k = 1) => grupo(x, y, k, `<path d="M-60 -40 A60 40 0 0 0 60 -40" fill="none" stroke="#8A6A2A" stroke-width="5"/>${[...Array(12)].map((_, i) => { const a = Math.PI * (0.05 + i / 12 * 0.9); const px = -Math.cos(a) * 60, py = -40 + Math.sin(a) * 40; return `<ellipse cx="${f(px)}" cy="${f(py)}" rx="14" ry="6" fill="${i % 2 ? '#5C7A3A' : '#7A9A4A'}" stroke="${L}" stroke-width="2" transform="rotate(${f(a * 57 - 90)} ${f(px)} ${f(py)})"/>`; }).join('')}`, 0.3),
      // escudo retangular curvo (scutum) — ≈ 1,1 m
      escudo: (x, y, k = 1) => grupo(x, y, k, `<path d="M-100 -360 Q0 -380 100 -360 V-20 Q0 0 -100 -20Z" fill="#9E2A22" stroke="${L}" stroke-width="6"/><path d="M-80 -340 Q0 -356 80 -340 V-40 Q0 -22 -80 -40Z" fill="none" stroke="#C9A24A" stroke-width="6"/><circle cx="0" cy="-190" r="34" fill="${bronze}" stroke="${L}" stroke-width="5"/><path d="M-60 -300 l30 30 M60 -300 l-30 30 M-60 -80 l30 -30 M60 -80 l-30 -30" stroke="#C9A24A" stroke-width="6"/><rect x="${luz > 0 ? -100 : 40}" y="-360" width="60" height="340" fill="${C.hora.sombra}" opacity=".15"/>`, 0.5),
      // estandarte com águia (aquila) — ≈ 2,6 m
      estandarte: (x, y, k = 1) => grupo(x, y, k, `<path d="M0 0 V-820" stroke="${madeira}" stroke-width="16"/>
        <path d="M-90 -660 H90 V-520 L0 -470 L-90 -520Z" fill="#9E2A22" stroke="${L}" stroke-width="5"/><text x="0" y="-560" font-family="serif" font-size="56" font-weight="700" text-anchor="middle" fill="#E8C060">ROMA</text>
        <path d="M-90 -660 H90" stroke="#C9A24A" stroke-width="10"/>${[-60, -20, 20, 60].map(px => `<path d="M${px} -470 v30" stroke="#C9A24A" stroke-width="5"/>`).join('')}
        <path d="M0 -830 Q-80 -880 -110 -850 Q-60 -850 -40 -820 Q-20 -860 0 -840 Q20 -860 40 -820 Q60 -850 110 -850 Q80 -880 0 -830Z" fill="#C9A24A" stroke="${L}" stroke-width="5"/><circle cx="0" cy="-850" r="14" fill="#C9A24A" stroke="${L}" stroke-width="4"/>`, 0.3),
      // carroça de madeira com sacos (≈ 1,3 m de altura)
      carroca: (x, y, k = 1, { carga = true } = {}) => grupo(x, y, k, `
        <path d="M-260 -230 L-420 -150" stroke="${madeira}" stroke-width="14" stroke-linecap="round"/>
        ${caixa(-240, -330, 480, 140, madeira)}${[0, 1, 2, 3].map(i => `<path d="M${-240 + i * 120} -330 V-190" stroke="${tom(madeira, -0.3)}" stroke-width="4"/>`).join('')}
        ${carga ? [[-150, '#C9B48A'], [-20, '#B9A47A'], [110, '#C9B48A']].map(([px, c]) => `<path d="M${px - 60} -330 Q${px - 70} -420 ${px} -430 Q${px + 70} -420 ${px + 60} -330Z" fill="${c}" stroke="${L}" stroke-width="4"/><path d="M${px - 20} -428 q20 -14 40 0" stroke="${L}" stroke-width="3" fill="none"/>`).join('') : ''}
        ${[-140, 140].map(px => `<circle cx="${px}" cy="-120" r="118" fill="none" stroke="${tom(madeira, -0.2)}" stroke-width="18"/><circle cx="${px}" cy="-120" r="118" fill="none" stroke="${L}" stroke-width="4"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${px} -120 L${f(px + Math.cos(i / 6 * 6.283) * 112)} ${f(-120 + Math.sin(i / 6 * 6.283) * 112)}" stroke="${madeira}" stroke-width="8"/>`).join('')}<circle cx="${px}" cy="-120" r="20" fill="${tom(madeira, -0.2)}" stroke="${L}" stroke-width="4"/>`).join('')}`, 1.1),
      // cesto de pães
      cestoPao: (x, y, k = 1) => grupo(x, y, k, `<path d="M-90 -90 L-70 0 H70 L90 -90Z" fill="#B88A4A" stroke="${L}" stroke-width="5"/>${[-60, -30, 0, 30, 60].map(px => `<path d="M${px} -88 L${px * 0.8} -4" stroke="#8A6234" stroke-width="3"/>`).join('')}${[-50, 0, 50].map((px, i) => `<ellipse cx="${px}" cy="${-104 - (i % 2) * 10}" rx="38" ry="22" fill="#D9A15B" stroke="${L}" stroke-width="4"/>`).join('')}`, 0.4),
      // vaso grego de figuras negras
      vasoGrego: (x, y, k = 1) => grupo(x, y, k, `<path d="M-50 -320 Q-110 -220 -60 -60 L-40 0 H40 L60 -60 Q110 -220 50 -320Z" fill="#C9692E" stroke="${L}" stroke-width="5"/><rect x="-36" y="-360" width="72" height="44" fill="#C9692E" stroke="${L}" stroke-width="5"/><path d="M-80 -190 H80" stroke="${L}" stroke-width="40" opacity=".85"/><path d="M-60 -200 l14 -20 l10 26 l14 -26 l10 20" stroke="#C9692E" stroke-width="5" fill="none"/><path d="M-36 -330 Q-90 -330 -80 -260 M36 -330 Q90 -330 80 -260" stroke="${L}" stroke-width="10" fill="none"/>`, 0.4),

      // ===================== OBJETOS GERAIS DE ÉPOCA =====================
      barril: (x, y, k = 1) => grupo(x, y, k, `<path d="M-90 -300 Q-120 -150 -90 0 H90 Q120 -150 90 -300Z" fill="${madeira}" stroke="${L}" stroke-width="5"/>${[-50, 0, 50].map(px => `<path d="M${px} -300 Q${px * 1.25} -150 ${px} 0" stroke="${tom(madeira, -0.3)}" stroke-width="3" fill="none"/>`).join('')}${[-260, -40].map(py => `<path d="M-100 ${py} Q0 ${py + 14} 100 ${py}" stroke="#4A4A50" stroke-width="12" fill="none"/>`).join('')}<ellipse cx="0" cy="-300" rx="90" ry="16" fill="${tom(madeira, 0.15)}" stroke="${L}" stroke-width="5"/>`, 0.6),
      bau: (x, y, k = 1) => grupo(x, y, k, `${caixa(-150, -160, 300, 160, madeira)}<path d="M-150 -160 Q0 -250 150 -160Z" fill="${tom(madeira, 0.1)}" stroke="${L}" stroke-width="5"/><path d="M-110 -205 V0 M110 -205 V0" stroke="#4A4A50" stroke-width="12"/><rect x="-20" y="-150" width="40" height="44" fill="${bronze}" stroke="${L}" stroke-width="4"/>`, 0.9),
      caixote: (x, y, k = 1) => grupo(x, y, k, `${caixa(-110, -200, 220, 200, tom(madeira, 0.15))}<path d="M-110 -200 L110 0 M110 -200 L-110 0" stroke="${tom(madeira, -0.15)}" stroke-width="10"/><rect x="-110" y="-200" width="220" height="200" fill="none" stroke="${L}" stroke-width="5"/>`, 0.7),
      saco: (x, y, k = 1, cor = '#C9B48A') => grupo(x, y, k, `<path d="M-80 0 Q-110 -120 -50 -200 Q0 -230 50 -200 Q110 -120 80 0Z" fill="${cor}" stroke="${L}" stroke-width="5"/><path d="M-40 -205 q40 -16 80 0" stroke="${L}" stroke-width="4" fill="none"/><path d="M-60 -60 q30 10 60 -6" stroke="${tom(cor, -0.25)}" stroke-width="3" fill="none"/>`, 0.6),
      tocha: (x, y, k = 1) => grupo(x, y, k, `<path d="M0 0 V-260" stroke="${madeira}" stroke-width="16"/><path d="M-20 -260 H20 L14 -300 H-14Z" fill="#4A4A50" stroke="${L}" stroke-width="4"/><circle cx="0" cy="-330" r="120" fill="url(#${C.id}-fogo)" opacity=".55"/><path d="M0 -300 q-36 -40 0 -110 q14 50 30 30 q0 50 -30 80Z" fill="#FF8A2B"/><path d="M2 -304 q-14 -30 0 -60 q12 30 0 60Z" fill="#FFD27A"/>`, 0.2),
      obelisco: (x, y, k = 1) => grupo(x, y, k, `<path d="M-60 0 L-44 -900 L0 -980 L44 -900 L60 0Z" fill="${MAT.pedra || '#D9C08C'}" stroke="${L}" stroke-width="6"/><path d="M${luz > 0 ? -60 : 0} 0 L${luz > 0 ? -44 : 0} -900 L0 -980 L0 0Z" fill="${C.hora.sombra}" opacity=".18"/>${[...Array(10)].map((_, i) => `<path d="M-14 ${-120 - i * 72} h28 M-8 ${-100 - i * 72} v-20" stroke="${tom(MAT.pedra || '#D9C08C', -0.4)}" stroke-width="4"/>`).join('')}`, 0.4),

      // ===================== HOJE EM DIA =====================
      celular: (x, y, k = 1) => grupo(x, y, k, `<rect x="-26" y="-110" width="52" height="104" rx="10" fill="#22242A" stroke="${L}" stroke-width="4"/><rect x="-20" y="-100" width="40" height="80" rx="4" fill="#4FA8E8"/><circle cx="0" cy="-14" r="3" fill="#888"/>`, 0.15),
      notebook: (x, y, k = 1) => grupo(x, y, k, `<path d="M-130 -10 L-110 -200 H110 L130 -10Z" fill="#B9BCC4" stroke="${L}" stroke-width="5"/><path d="M-96 -24 L-80 -184 H80 L96 -24Z" fill="#3E7BC8"/><rect x="-170" y="-14" width="340" height="16" rx="6" fill="#9A9EA8" stroke="${L}" stroke-width="5"/>`, 0.5),
      geladeira: (x, y, k = 1) => grupo(x, y, k, `${caixa(-110, -580, 220, 580, '#F2F4F6')}<path d="M-110 -380 H110" stroke="${L}" stroke-width="5"/><rect x="70" y="-540" width="14" height="110" rx="7" fill="#9A9EA8" stroke="${L}" stroke-width="3"/><rect x="70" y="-340" width="14" height="160" rx="7" fill="#9A9EA8" stroke="${L}" stroke-width="3"/><circle cx="-60" cy="-500" r="12" fill="#FF7A00"/><rect x="-80" y="-470" width="40" height="30" fill="#FFD27A" transform="rotate(-6 -60 -455)"/>`, 0.7),
      tv: (x, y, k = 1) => grupo(x, y, k, `${caixa(-160, -60, 320, 60, '#5A4A3A')}<rect x="-220" y="-330" width="440" height="250" rx="10" fill="#1E2026" stroke="${L}" stroke-width="6"/><rect x="-204" y="-316" width="408" height="222" fill="#2E5E9E"/><path d="M-204 -316 L-60 -316 L-204 -180Z" fill="#FFF" opacity=".12"/><rect x="-14" y="-80" width="28" height="22" fill="#2A2C32"/>`, 1),
      sofa: (x, y, k = 1, cor = '#3B5E8C') => grupo(x, y, k, `<rect x="-300" y="-40" width="20" height="40" fill="${L}"/><rect x="280" y="-40" width="20" height="40" fill="${L}"/>${caixa(-320, -280, 640, 150, tom(cor, -0.1))}${caixa(-320, -170, 640, 130, cor)}<rect x="-360" y="-230" width="80" height="190" rx="24" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="5"/><rect x="280" y="-230" width="80" height="190" rx="24" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="5"/><path d="M0 -270 V-140" stroke="${tom(cor, -0.3)}" stroke-width="4"/>`, 1.2),
      cadeiraEscritorio: (x, y, k = 1) => grupo(x, y, k, `${[-1, 1].map(i => `<path d="M0 -40 L${i * 90} -6" stroke="#2A2C32" stroke-width="12"/><circle cx="${i * 90}" cy="-8" r="10" fill="#2A2C32"/>`).join('')}<rect x="-8" y="-180" width="16" height="140" fill="#6A6E78" stroke="${L}" stroke-width="3"/><rect x="-110" y="-210" width="220" height="40" rx="14" fill="#2A2C32" stroke="${L}" stroke-width="5"/><rect x="-90" y="-480" width="180" height="250" rx="40" fill="#2A2C32" stroke="${L}" stroke-width="5"/>`, 0.6),
      carro: (x, y, k = 1, cor = '#D7263D') => grupo(x, y, k, `<path d="M-470 -80 V-200 Q-460 -250 -380 -260 L-260 -270 L-160 -390 H200 L300 -270 L440 -250 Q480 -240 480 -180 V-80Z" fill="${cor}" stroke="${L}" stroke-width="6"/><path d="M-140 -370 H40 V-270 H-240Z M70 -370 H190 L270 -270 H70Z" fill="#9FD3F2" stroke="${L}" stroke-width="5"/><path d="M-470 -170 H480" stroke="${tom(cor, -0.3)}" stroke-width="5"/>${[-280, 300].map(px => `<circle cx="${px}" cy="-80" r="80" fill="#22242A" stroke="${L}" stroke-width="5"/><circle cx="${px}" cy="-80" r="36" fill="#B9BCC4"/>`).join('')}<rect x="440" y="-230" width="34" height="20" rx="4" fill="#FFF3A8"/>`, 1.6),
      semaforo: (x, y, k = 1, aceso = 'vermelho') => grupo(x, y, k, `<rect x="-10" y="-760" width="20" height="760" fill="#3A3C44" stroke="${L}" stroke-width="4"/><rect x="-60" y="-1000" width="120" height="280" rx="20" fill="#22242A" stroke="${L}" stroke-width="5"/>${[['vermelho', '#E23B3B', -940], ['amarelo', '#F2C14E', -860], ['verde', '#3BB273', -780]].map(([n, c, cy]) => `<circle cx="0" cy="${cy}" r="30" fill="${aceso === n ? c : tom(c, -0.6)}" stroke="${L}" stroke-width="3"/>`).join('')}`, 0.3),
      mochila: (x, y, k = 1, cor = '#3B7DD8') => grupo(x, y, k, `<path d="M-90 0 V-220 Q-90 -300 0 -300 Q90 -300 90 -220 V0Z" fill="${cor}" stroke="${L}" stroke-width="5"/><rect x="-60" y="-120" width="120" height="90" rx="16" fill="${tom(cor, -0.15)}" stroke="${L}" stroke-width="4"/><path d="M-30 -300 Q0 -340 30 -300" stroke="${L}" stroke-width="8" fill="none"/>`, 0.5),
      xicara: (x, y, k = 1) => grupo(x, y, k, `<ellipse cx="0" cy="-4" rx="70" ry="12" fill="#E8E8EC" stroke="${L}" stroke-width="4"/><path d="M-48 -100 Q-50 -10 0 -10 Q50 -10 48 -100Z" fill="#FFFFFF" stroke="${L}" stroke-width="4"/><path d="M48 -86 q34 0 30 30 q-4 24 -34 20" stroke="${L}" stroke-width="6" fill="none"/><ellipse cx="0" cy="-100" rx="48" ry="10" fill="#6A3E22" stroke="${L}" stroke-width="4"/><path d="M-10 -120 q-14 -20 0 -40 M14 -120 q-14 -20 0 -40" stroke="#B9BCC4" stroke-width="4" fill="none"/>`, 0.25),
      garrafa: (x, y, k = 1, cor = '#7FC4A0') => grupo(x, y, k, `<path d="M-40 0 V-200 Q-40 -240 -16 -260 V-300 H16 V-260 Q40 -240 40 -200 V0Z" fill="${cor}" stroke="${L}" stroke-width="4" opacity=".9"/><rect x="-18" y="-320" width="36" height="22" fill="#3B7DD8" stroke="${L}" stroke-width="3"/><rect x="-40" y="-170" width="80" height="70" fill="#FFF" opacity=".8"/><path d="M-30 -230 V-30" stroke="#FFF" stroke-width="6" opacity=".5"/>`, 0.2),
      luminaria: (x, y, k = 1, acesa = true) => grupo(x, y, k, `<ellipse cx="0" cy="-6" rx="70" ry="12" fill="#3A3C44" stroke="${L}" stroke-width="4"/><path d="M0 -10 L-60 -200 L40 -300" stroke="#3A3C44" stroke-width="12" fill="none"/><path d="M10 -330 L90 -290 L60 -240 L-10 -280Z" fill="#FF7A00" stroke="${L}" stroke-width="4"/>${acesa ? `<path d="M60 -250 L160 -40 L-60 -40Z" fill="#FFF3A8" opacity=".25"/>` : ''}`, 0.4),
      carrinhoMercado: (x, y, k = 1) => grupo(x, y, k, `<path d="M-200 -320 H-150 L-110 -60 H150 L190 -260 H-140" stroke="${L}" stroke-width="10" fill="none" stroke-linejoin="round"/>${[...Array(6)].map((_, i) => `<path d="M${-120 + i * 52} -255 L${-100 + i * 46} -70" stroke="#6A6E78" stroke-width="4"/>`).join('')}<path d="M-130 -200 H170 M-118 -130 H160" stroke="#6A6E78" stroke-width="4"/>${[-90, 120].map(px => `<circle cx="${px}" cy="-20" r="22" fill="#22242A"/>`).join('')}`, 0.8)
    };
    O.lista = Object.keys(O).filter(n => typeof O[n] === 'function');
    return O;
  }
  global.Objetos = Objetos;
})(window);
