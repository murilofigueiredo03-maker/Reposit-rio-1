/*
  escola.js — cenários de ESCOLA de hoje para a série "O garoto do tênis laranja" (skill "cenario-ilustrado").
  Depende de cenario.js. Pensado para o ENQUADRAMENTO GRANDE (personagem grande, chão alto, legenda embaixo):
  `chao` = onde a parede do fundo encontra o piso; os pés de quem está na frente ficam mais embaixo (≈ 1380).

  const E = Escola(Cenario({ seed: 3, luz: -1, hora: 'dia' }));
  s += E.fachada({ chao: 1250 })        // portão, muro, prédio com placa ESCOLA ESTADUAL, árvores, calçada
  s += E.corredor({ chao: 1160 })       // armários de metal, mural de recados, janelas, piso de granilite
  s += E.refeitorio({ chao: 1150 })     // azulejo, balcão de comida com cubas, cardápio, mesas e bancos ao fundo
  s += E.quarto({ chao: 1200, noite: true })   // cama, janela com lua, mesa, pôster, abajur
  s += E.mesa(x, yPiso, k) · E.banco(x, yPiso, k)   // móveis soltos (para pôr na ordem de profundidade)
  s += E.bandeja(x, y, k, { suco: true })           // bandeja com prato de arroz e feijão + copo de suco
  s += E.telaCelular(x, y, w, h, { views: '2 MIL', usuario: '@duda' })   // tela de vídeo (tipo TikTok) com o vídeo postado
  Textos em português; letreiros em fonte Anton (cabem no lugar: data-caber, skill fisica-de-cena).
*/
(function (global) {
  function Escola(C) {
    const tom = C.tom, rnd = C.rnd, pick = C.pick;
    const L = '#1D1D2B', f = v => Math.round(v * 10) / 10;
    const E = {};
    const clip = (x, y, w, h, corpo) => { const id = `ce${Math.floor(rnd(1e5, 1e6))}`; return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${corpo}</g>`; };
    const texto = (t, cx, cy, larg, alt, cor = '#fff', fonte = 'Anton') => { const fs = Math.min(alt, larg / Math.max(1, t.length * 0.5)); return `<text x="${f(cx)}" y="${f(cy)}" font-family="'${fonte}', 'DejaVu Sans Condensed', sans-serif" font-size="${f(fs)}" fill="${cor}" text-anchor="middle" dominant-baseline="central" data-caber="${f(larg)}">${t}</text>`; };
    const parede = (x, y, w, h, cor) => { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}"/>`; for (let i = 0; i < 7; i++) s += `<ellipse cx="${f(rnd(x, x + w))}" cy="${f(rnd(y, y + h))}" rx="${f(rnd(80, 200))}" ry="${f(rnd(50, 120))}" fill="${tom(cor, rnd(-0.07, 0.04))}" opacity=".45"/>`; return s; };
    // piso em perspectiva: linhas horizontais cada vez mais espaçadas para baixo + juntas fugindo para o centro
    const piso = (x, y, w, h, cor, { juntas = true, granilite = false } = {}) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}"/>`;
      for (let k = 1, yy = y; yy < y + h; k++) { yy = y + h * Math.pow(k / 9, 1.7); s += `<path d="M${x} ${f(yy)} H${x + w}" stroke="${tom(cor, -0.14)}" stroke-width="${f(1.5 + k * 0.5)}"/>`; }
      if (juntas) for (let i = -6; i <= 6; i++) s += `<path d="M${f(x + w / 2 + i * 70)} ${y} L${f(x + w / 2 + i * 260)} ${y + h}" stroke="${tom(cor, -0.12)}" stroke-width="3"/>`;
      if (granilite) for (let i = 0; i < 160; i++) { const yy = y + rnd(0, h), sz = 1 + (yy - y) / h * 3; s += `<circle cx="${f(rnd(x, x + w))}" cy="${f(yy)}" r="${f(sz)}" fill="${pick(['#8A8A88', '#F2F2EE', '#6A6A6C'])}" opacity=".5"/>`; }
      return s;
    };
    const rodape = (x, y, w, cor) => `<rect x="${x}" y="${f(y - 34)}" width="${w}" height="34" fill="${cor}"/><path d="M${x} ${f(y - 34)} H${x + w}" stroke="${tom(cor, -0.25)}" stroke-width="4"/>`;
    const janela = (x, y, w, h, ceu = '#9ED3F0', noite = false) => {
      let s = `<rect x="${f(x - 10)}" y="${f(y - 10)}" width="${f(w + 20)}" height="${f(h + 20)}" rx="6" fill="#E9ECEF" stroke="${L}" stroke-width="5"/><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${noite ? '#14183A' : ceu}"/>`;
      if (!noite) s += `<path d="M${f(x + w * 0.1)} ${f(y + h * 0.85)} L${f(x + w * 0.5)} ${f(y + h * 0.1)}" stroke="#fff" stroke-width="10" opacity=".35"/>`;
      return s + `<path d="M${f(x + w / 2)} ${f(y)} V${f(y + h)} M${f(x)} ${f(y + h / 2)} H${f(x + w)}" stroke="#E9ECEF" stroke-width="8"/>`;
    };

    // ---------- utilidades de acabamento (skill cenario-ilustrado: luz única, 3 tons, sombras, camadas, vida) ----------
    const LZ = C.luz || -1;                                 // de onde vem a luz (-1 = esquerda)
    const uid = p => `${p}${Math.floor(rnd(1e5, 1e6))}`;
    // volume com 3 tons: face base + faixa iluminada do lado da luz + faixa de sombra do outro lado
    const vol = (x, y, w, h, cor, borda = 10, sw = 5) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${cor}" stroke="${L}" stroke-width="${sw}"/>` +
      `<rect x="${f(LZ < 0 ? x + 2 : x + w - borda - 2)}" y="${f(y + 2)}" width="${borda}" height="${f(h - 4)}" fill="${tom(cor, 0.22)}"/><rect x="${f(LZ < 0 ? x + w - borda - 2 : x + 2)}" y="${f(y + 2)}" width="${borda}" height="${f(h - 4)}" fill="${tom(cor, -0.25)}"/>`;
    const contato = (x, y, w, op = 0.25) => `<ellipse cx="${f(x)}" cy="${f(y + 3)}" rx="${f(w / 2)}" ry="${f(Math.max(6, w * 0.06))}" fill="#1A1424" opacity="${op}"/>`;
    // feixe de luz (janela → chão), suave
    const feixe = (x0, y0, w0, x1, y1, w1, cor = '#FFF4D6', op = 0.16) => `<path d="M${f(x0)} ${f(y0)} L${f(x0 + w0)} ${f(y0)} L${f(x1 + w1)} ${f(y1)} L${f(x1)} ${f(y1)}Z" fill="${cor}" opacity="${op}" style="mix-blend-mode:screen"/>`;
    // sujeira subindo do chão na parede (desgaste)
    const sujeiraParede = (x, chao, w, cor) => { let s = `<rect x="${x}" y="${f(chao - 70)}" width="${w}" height="70" fill="${tom(cor, -0.12)}" opacity=".35"/>`; for (let i = 0; i < 8; i++) s += `<ellipse cx="${f(rnd(x, x + w))}" cy="${f(chao - rnd(10, 60))}" rx="${f(rnd(30, 90))}" ry="${f(rnd(8, 20))}" fill="${tom(cor, -0.2)}" opacity=".25"/>`; return s; };
    const acabamento = (grao = 0.22) => C.atmosfera({ grao, vinheta: false });
    const defs = () => `<defs>${C.defs()}</defs>`;
    const cartaz = (x, y, w, h, cor, titulo, rot = 0, corT = '#FFFFFF') => `<g transform="rotate(${rot} ${f(x + w / 2)} ${f(y + h / 2)})"><rect x="${f(x + 6)}" y="${f(y + 8)}" width="${f(w)}" height="${f(h)}" fill="#000" opacity=".15"/><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${cor}" stroke="${L}" stroke-width="4"/>${texto(titulo, x + w / 2, y + h * 0.28, w * 0.85, h * 0.2, corT)}<rect x="${f(x + w * 0.15)}" y="${f(y + h * 0.48)}" width="${f(w * 0.7)}" height="${f(h * 0.08)}" fill="${tom(cor, 0.35)}"/><rect x="${f(x + w * 0.15)}" y="${f(y + h * 0.62)}" width="${f(w * 0.55)}" height="${f(h * 0.08)}" fill="${tom(cor, 0.35)}"/><circle cx="${f(x + w / 2)}" cy="${f(y + 8)}" r="5" fill="#D7263D" stroke="${L}" stroke-width="2"/></g>`;
    const relogio = (x, y, r = 46) => `<g><circle cx="${f(x + 4)}" cy="${f(y + 6)}" r="${r}" fill="#000" opacity=".15"/><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#FFFFFF" stroke="${L}" stroke-width="7"/>${[...Array(12)].map((_, i) => { const a = i / 12 * Math.PI * 2; return `<path d="M${f(x + Math.cos(a) * r * 0.78)} ${f(y + Math.sin(a) * r * 0.78)} L${f(x + Math.cos(a) * r * 0.9)} ${f(y + Math.sin(a) * r * 0.9)}" stroke="${L}" stroke-width="3"/>`; }).join('')}<g class="ponteiro" data-cx="${f(x)}" data-cy="${f(y)}"><path d="M${f(x)} ${f(y)} L${f(x)} ${f(y - r * 0.7)}" stroke="#D7263D" stroke-width="3" stroke-linecap="round"/></g><path d="M${f(x)} ${f(y)} L${f(x + r * 0.42)} ${f(y + r * 0.2)}" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M${f(x)} ${f(y)} L${f(x - r * 0.1)} ${f(y - r * 0.55)}" stroke="${L}" stroke-width="5" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r="5" fill="${L}"/></g>`;
    const vaso = (x, y, k = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${contato(0, 0, 110, 0.3)}<path d="M-40 0 L-50 -80 H50 L40 0Z" fill="#B8613A" stroke="${L}" stroke-width="5"/><rect x="-56" y="-96" width="112" height="20" fill="#C9743A" stroke="${L}" stroke-width="5"/>${[[-50, -230, -25], [0, -280, 0], [45, -220, 20], [-20, -200, -40], [30, -250, 35]].map(([dx, dy, r]) => `<path d="M0 -90 Q${dx * 0.4} ${(dy - 90) / 2} ${dx} ${dy} Q${dx + 26} ${dy + 50} 4 -90Z" fill="${tom('#3E8A4A', r / 200)}" stroke="${L}" stroke-width="4" transform="rotate(${r * 0.2} 0 -90)"/>`).join('')}</g>`;
    const lixeira = (x, y, k = 1, cor = '#2E7D4A', rotulo = '') => `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">${contato(0, 0, 100)}<path d="M-38 0 L-44 -120 H44 L38 0Z" fill="${cor}" stroke="${L}" stroke-width="5"/><path d="M-44 -120 L-38 0" stroke="${tom(cor, 0.25)}" stroke-width="8"/><rect x="-50" y="-136" width="100" height="18" rx="6" fill="${tom(cor, -0.2)}" stroke="${L}" stroke-width="5"/>${rotulo ? texto(rotulo, 0, -62, 60, 22) : ''}</g>`;

    // ---------- FACHADA: manhã, luz da esquerda. Prédio de 2 andares com volume, marquise na entrada,
    // faixa BEM-VINDOS, mastro com bandeira, mural pintado, bicicletário, van escolar, árvores, calçada gasta ----------
    E.fachada = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.65, nome = 'ESCOLA ESTADUAL' } = {}) => {
      const gc = uid('ceu');
      let s = defs() + `<defs><linearGradient id="${gc}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8CCBF0"/><stop offset=".7" stop-color="#DDF0FA"/><stop offset="1" stop-color="#FCEFD8"/></linearGradient></defs>`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${gc})"/>`;
      s += `<circle cx="${f(x + 120)}" cy="${f(y + 250)}" r="70" fill="#FFF3C4"/><circle cx="${f(x + 120)}" cy="${f(y + 250)}" r="130" fill="#FFF3C4" opacity=".3"/>`;
      s += [[0.35, 0.1, 1], [0.78, 0.17, 0.8]].map(([u, v, k]) => C.nuvem ? C.nuvem(x + w * u, y + (chao - y) * v + 100, k) : '').join('');
      // cidade ao fundo em 2 camadas de névoa (perspectiva atmosférica)
      [[0.42, '#B9CBD8', 0.62], [0.36, '#A3B6C6', 0.8]].forEach(([alt, cor, op]) => { let px = x - 30; while (px < x + w) { const pw = rnd(70, 150), ph = (chao - y) * rnd(alt * 0.6, alt); s += `<rect x="${f(px)}" y="${f(chao - 140 - ph)}" width="${f(pw)}" height="${f(ph + 140)}" fill="${cor}" opacity="${op}"/>`; for (let r = 0; r < 4; r++) s += `<rect x="${f(px + 12)}" y="${f(chao - 120 - ph + 30 + r * 50)}" width="${f(pw - 24)}" height="10" fill="#fff" opacity=".18"/>`; px += pw + rnd(4, 20); } });
      // prédio (volume: fachada + lateral em fuga à direita, mais escura)
      const py = y + (chao - y) * 0.3, bx0 = x + 30, bx1 = x + w - 130;
      s += `<path d="M${f(bx1)} ${f(py)} L${f(bx1 + 90)} ${f(py + 40)} L${f(bx1 + 90)} ${f(chao)} L${f(bx1)} ${f(chao)}Z" fill="${tom('#F2E3C4', -0.32)}" stroke="${L}" stroke-width="5"/>`;
      s += `<rect x="${f(bx0)}" y="${f(py)}" width="${f(bx1 - bx0)}" height="${f(chao - py)}" fill="#F2E3C4" stroke="${L}" stroke-width="6"/>`;
      s += `<rect x="${f(bx0)}" y="${f(py)}" width="${f(bx1 - bx0)}" height="${f((chao - py) * 0.07)}" fill="${tom('#F2E3C4', -0.15)}"/>`;   // sombra do beiral
      for (let i = 0; i < 10; i++) s += `<ellipse cx="${f(rnd(bx0, bx1))}" cy="${f(rnd(py, chao))}" rx="${f(rnd(60, 140))}" ry="${f(rnd(30, 80))}" fill="${tom('#F2E3C4', rnd(-0.08, 0.04))}" opacity=".5"/>`;
      s += `<rect x="${f(bx0 - 14)}" y="${f(py - 36)}" width="${f(bx1 - bx0 + 118)}" height="44" fill="#C9603A" stroke="${L}" stroke-width="5"/><rect x="${f(bx0 - 14)}" y="${f(py + 8)}" width="${f(bx1 - bx0 + 28)}" height="14" fill="#000" opacity=".18"/>`;
      // faixa de ladrilho embaixo + sujeira subindo
      s += `<rect x="${f(bx0)}" y="${f(chao - 170)}" width="${f(bx1 - bx0)}" height="170" fill="#E2A65A"/>` + [...Array(Math.ceil((bx1 - bx0) / 40))].map((_, k) => `<path d="M${f(bx0 + k * 40)} ${f(chao - 170)} V${f(chao)}" stroke="${tom('#E2A65A', -0.18)}" stroke-width="2"/>`).join('') + `<path d="M${f(bx0)} ${f(chao - 170)} H${f(bx1)}" stroke="${L}" stroke-width="4"/>` + sujeiraParede(bx0, chao, bx1 - bx0, '#E2A65A');
      // janelas (algumas abertas, cortina, ar-condicionado), peitoril com sombra
      const jan = (jx, jy, jw, jh, aberta, cortina) => { let j = `<rect x="${f(jx - 12)}" y="${f(jy - 12)}" width="${f(jw + 24)}" height="${f(jh + 24)}" fill="#E9ECEF" stroke="${L}" stroke-width="5"/><rect x="${f(jx)}" y="${f(jy)}" width="${f(jw)}" height="${f(jh)}" fill="${aberta ? '#3A4A5A' : '#9ED3F0'}"/>`;
        if (!aberta) j += `<path d="M${f(jx + jw * 0.15)} ${f(jy + jh * 0.9)} L${f(jx + jw * 0.55)} ${f(jy + jh * 0.1)}" stroke="#fff" stroke-width="12" opacity=".4"/>`;
        if (cortina) j += `<path d="M${f(jx)} ${f(jy)} Q${f(jx + jw * 0.25)} ${f(jy + jh * 0.5)} ${f(jx + jw * 0.12)} ${f(jy + jh)} H${f(jx)}Z" fill="${cortina}" stroke="${L}" stroke-width="3"/>`;
        j += `<path d="M${f(jx + jw / 2)} ${f(jy)} V${f(jy + jh)} M${f(jx)} ${f(jy + jh / 2)} H${f(jx + jw)}" stroke="#E9ECEF" stroke-width="7"/><rect x="${f(jx - 18)}" y="${f(jy + jh + 12)}" width="${f(jw + 36)}" height="14" fill="#D9D2C4" stroke="${L}" stroke-width="4"/><rect x="${f(jx - 14)}" y="${f(jy + jh + 26)}" width="${f(jw + 28)}" height="12" fill="#000" opacity=".15"/>`;
        return j; };
      for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) s += jan(bx0 + 55 + k * 210, py + 75 + r * 205, 140, 120, (r + k) % 3 === 0, (r * 4 + k) % 3 === 1 ? '#F2C230' : null);
      s += `<rect x="${f(bx0 + 55 + 210 + 10)}" y="${f(py + 75 + 205 - 70)}" width="90" height="46" rx="6" fill="#F4F6F8" stroke="${L}" stroke-width="4"/><path d="M${f(bx0 + 290)} ${f(py + 75 + 205 - 40)} h60" stroke="#9AA0A8" stroke-width="3"/>`;   // ar-condicionado
      // placa com o nome (letras na fachada)
      s += `<rect x="${f(x + w / 2 - 270)}" y="${f(py - 150)}" width="540" height="100" rx="12" fill="#2E5E9E" stroke="${L}" stroke-width="6"/><rect x="${f(x + w / 2 - 262)}" y="${f(py - 142)}" width="12" height="84" fill="#5A8ACE"/>` + texto(nome, x + w / 2, py - 100, 480, 66);
      // mural pintado pelos alunos no ladrilho
      s += `<g opacity=".95"><circle cx="${f(bx0 + 90)}" cy="${f(chao - 100)}" r="40" fill="#FFD23F"/>${[...Array(8)].map((_, i) => { const a = i / 8 * Math.PI * 2; return `<path d="M${f(bx0 + 90 + Math.cos(a) * 50)} ${f(chao - 100 + Math.sin(a) * 50)} l${f(Math.cos(a) * 18)} ${f(Math.sin(a) * 18)}" stroke="#FFD23F" stroke-width="6"/>`; }).join('')}<path d="M${f(bx0 + 170)} ${f(chao - 40)} q60 -90 120 0 q60 -90 120 0" stroke="#3E8A4A" stroke-width="16" fill="none"/>${[0, 1, 2].map(i => `<circle cx="${f(bx0 + 520 + i * 70)}" cy="${f(chao - 110)}" r="16" fill="${['#D7263D', '#3B7DD8', '#8E44AD'][i]}"/><path d="M${f(bx0 + 520 + i * 70)} ${f(chao - 94)} v40 m-16 -26 h32 m-24 26 l8 -0 m0 0 l8 0" stroke="${['#D7263D', '#3B7DD8', '#8E44AD'][i]}" stroke-width="6"/>`).join('')}</g>`;
      // marquise da entrada + porta
      const ex = x + w * 0.5;
      s += `<rect x="${f(ex - 110)}" y="${f(chao - 330)}" width="220" height="330" fill="#3A2A20" stroke="${L}" stroke-width="5"/><rect x="${f(ex - 96)}" y="${f(chao - 316)}" width="92" height="316" fill="#6E4A2E"/><rect x="${f(ex + 4)}" y="${f(chao - 316)}" width="92" height="316" fill="#5E3E26"/><rect x="${f(ex - 80)}" y="${f(chao - 290)}" width="60" height="110" fill="#9ED3F0" opacity=".7"/><rect x="${f(ex + 20)}" y="${f(chao - 290)}" width="60" height="110" fill="#9ED3F0" opacity=".7"/>`;
      s += `<path d="M${f(ex - 190)} ${f(chao - 350)} H${f(ex + 190)} L${f(ex + 220)} ${f(chao - 320)} H${f(ex - 220)}Z" fill="#C9603A" stroke="${L}" stroke-width="5"/><path d="M${f(ex - 210)} ${f(chao - 320)} H${f(ex + 210)} L${f(ex + 170)} ${f(chao - 230)} H${f(ex - 250)}Z" fill="#000" opacity=".12"/>`;
      // faixa BEM-VINDOS presa na marquise (balança)
      s += `<g class="faixa-balanca" data-cx="${f(ex)}" data-cy="${f(chao - 320)}"><path d="M${f(ex - 170)} ${f(chao - 318)} Q${f(ex)} ${f(chao - 290)} ${f(ex + 170)} ${f(chao - 318)} L${f(ex + 160)} ${f(chao - 250)} Q${f(ex)} ${f(chao - 226)} ${f(ex - 160)} ${f(chao - 250)}Z" fill="#FFFFFF" stroke="${L}" stroke-width="4"/>${texto('BEM-VINDOS!', ex, chao - 278, 290, 40, '#2E5E9E')}</g>`;
      // mastro com bandeira da escola
      const mx = x + w - 70;
      s += `<path d="M${f(mx)} ${f(chao)} V${f(py - 220)}" stroke="#B9BEC6" stroke-width="10"/><path d="M${f(mx - 3)} ${f(chao)} V${f(py - 220)}" stroke="#fff" stroke-width="3" opacity=".7"/><circle cx="${f(mx)}" cy="${f(py - 226)}" r="10" fill="#E2B33C" stroke="${L}" stroke-width="3"/>`;
      s += `<g class="bandeira" data-cx="${f(mx)}" data-cy="${f(py - 210)}"><path d="M${f(mx)} ${f(py - 210)} Q${f(mx - 60)} ${f(py - 230)} ${f(mx - 120)} ${f(py - 205)} L${f(mx - 120)} ${f(py - 120)} Q${f(mx - 60)} ${f(py - 145)} ${f(mx)} ${f(py - 125)}Z" fill="#2E7D4A" stroke="${L}" stroke-width="4"/><circle cx="${f(mx - 60)}" cy="${f(py - 168)}" r="20" fill="#FFD23F" stroke="${L}" stroke-width="3"/></g>`;
      // muro baixo com grade, portão aberto, pichação
      s += vol(x, chao - 130, w * 0.3, 130, '#D9D2C4', 12) + vol(x + w * 0.7, chao - 130, w * 0.3, 130, '#D9D2C4', 12);
      s += `<text x="${f(x + 60)}" y="${f(chao - 50)}" font-family="'DejaVu Sans', sans-serif" font-weight="800" font-size="34" fill="#3B7DD8" opacity=".75" transform="rotate(-6 ${f(x + 60)} ${f(chao - 50)})">3ºB ♥</text>`;
      for (let k = 0; k < 6; k++) s += `<path d="M${f(x + w * 0.7 + 30 + k * 45)} ${f(chao - 130)} V${f(chao - 210)}" stroke="#3A4A5A" stroke-width="6"/>`;
      s += `<path d="M${f(x + w * 0.7 + 20)} ${f(chao - 200)} H${f(x + w - 10)}" stroke="#3A4A5A" stroke-width="6"/>`;
      s += `<g transform="translate(${f(x + w * 0.3)} ${f(chao)}) skewY(-12)">${[...Array(6)].map((_, k) => `<path d="M${k * 22} 0 V-200" stroke="#3A4A5A" stroke-width="7"/>`).join('')}<path d="M0 -196 H112" stroke="#3A4A5A" stroke-width="9"/></g>`;
      // árvores com copa em 3 tons e sombra no chão
      [[x + 10, 1.1], [x + w - 10, 0.95]].forEach(([tx, k]) => { s += `<ellipse cx="${f(tx + 60)}" cy="${f(chao + 30)}" rx="${f(150 * k)}" ry="26" fill="#1A1424" opacity=".18"/><path d="M${f(tx - 16)} ${f(chao)} L${f(tx - 10)} ${f(chao - 330 * k)} H${f(tx + 10)} L${f(tx + 16)} ${f(chao)}Z" fill="#7A5432" stroke="${L}" stroke-width="5"/>`;
        [[0, -400, 130, '#4E9A4A'], [-60, -440, 80, '#5FB25A'], [60, -360, 90, '#3E7A3A'], [10, -470, 70, '#6FC26A']].forEach(([dx, dy, r, c]) => { s += `<circle cx="${f(tx + dx * k)}" cy="${f(chao + dy * k)}" r="${f(r * k)}" fill="${c}" stroke="${L}" stroke-width="5"/>`; }); });
      // calçada gasta (perspectiva), grama nas juntas, meio-fio, rua e van escolar parada
      s += piso(x, chao, w, y + h - chao, '#C9C4B8');
      for (let i = 0; i < 14; i++) { const gx = rnd(x, x + w), gy = rnd(chao + 20, y + h - 140); s += `<path d="M${f(gx)} ${f(gy)} l-6 -14 M${f(gx)} ${f(gy)} l2 -16 M${f(gx)} ${f(gy)} l8 -12" stroke="#5E9A4A" stroke-width="3"/>`; }
      s += `<path d="M${f(x + w * 0.62)} ${f(chao + 60)} l40 30 l-10 24 l50 40" stroke="${tom('#C9C4B8', -0.3)}" stroke-width="3" fill="none"/>`;
      s += `<rect x="${x}" y="${f(y + h - 110)}" width="${w}" height="110" fill="#5A5A62"/><rect x="${x}" y="${f(y + h - 124)}" width="${w}" height="18" fill="#E2DED4"/>`;
      // bicicletário com duas bicicletas
      s += `<g transform="translate(${f(x + w * 0.83)} ${f(chao + 90)}) scale(.42)"><path d="M-300 0 V-160 H300 V0" stroke="#8A9098" stroke-width="14" fill="none"/></g>`;
      return clip(x, y, w, h, s + acabamento(0.18));
    };

    // ---------- CORREDOR em perspectiva de um ponto: armários à esquerda, portas de sala à direita, luzes no teto,
    // janela clara no fundo (contraluz), bebedouro, extintor, cartazes, piso de granilite com reflexo das luzes ----------
    E.corredor = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.6, fuga = [x + w * 0.56, y + h * 0.43] } = {}) => {
      const [vx, vy] = fuga, fundoW = 300, fundoH = 380;
      const fx0 = vx - fundoW / 2, fx1 = vx + fundoW / 2, fy0 = vy - fundoH * 0.6, fy1 = vy + fundoH * 0.4;   // parede do fundo
      const P = (u, side, yy) => [lerp(side, side === x ? fx0 : fx1, u), yy];
      let s = defs();
      // teto, parede esquerda, parede direita, chão (4 trapézios fugindo para o ponto de fuga)
      s += `<path d="M${x} ${y} H${x + w} L${f(fx1)} ${f(fy0)} H${f(fx0)}Z" fill="#E9E6DE"/>`;
      s += `<path d="M${x} ${y} L${f(fx0)} ${f(fy0)} V${f(fy1)} L${x} ${f(chao + 260)}Z" fill="#D9D3C2"/>`;
      s += `<path d="M${x + w} ${y} L${f(fx1)} ${f(fy0)} V${f(fy1)} L${x + w} ${f(chao + 260)}Z" fill="#C9C2B0"/>`;
      s += `<path d="M${x} ${f(chao + 260)} L${f(fx0)} ${f(fy1)} H${f(fx1)} L${x + w} ${f(chao + 260)} V${y + h} H${x}Z" fill="#D6D2C8"/>`;
      // granilite + linhas do piso em perspectiva
      for (let i = 0; i < 200; i++) { const yy = rnd(fy1, y + h), sz = 0.6 + (yy - fy1) / (y + h - fy1) * 3.5; s += `<circle cx="${f(rnd(x, x + w))}" cy="${f(yy)}" r="${f(sz)}" fill="${pick(['#8A8A88', '#F2F2EE', '#6A6A6C'])}" opacity=".45"/>`; }
      for (let k = 1; k < 9; k++) { const u = Math.pow(k / 9, 1.8), yy = lerp(fy1, y + h, u); s += `<path d="M${f(lerp(fx0, x - 400, u))} ${f(yy)} H${f(lerp(fx1, x + w + 400, u))}" stroke="#BDB7AA" stroke-width="${f(1 + u * 3)}"/>`; }
      for (let i = -4; i <= 4; i++) s += `<path d="M${f(vx + i * 30)} ${f(fy1)} L${f(vx + i * 320)} ${f(y + h)}" stroke="#BDB7AA" stroke-width="3"/>`;
      // faixa azul nas paredes (barra lavável) — também em perspectiva
      const barra = (lado) => { const xa = lado < 0 ? x : x + w, xb = lado < 0 ? fx0 : fx1; return `<path d="M${xa} ${f(chao - 380)} L${f(xb)} ${f(lerp(fy0, fy1, 0.55))} V${f(fy1)} L${xa} ${f(chao + 260)}Z" fill="${lado < 0 ? '#6F98BA' : '#5F88AA'}"/><path d="M${xa} ${f(chao - 380)} L${f(xb)} ${f(lerp(fy0, fy1, 0.55))}" stroke="${L}" stroke-width="4"/>`; };
      s += barra(-1) + barra(1);
      // parede do fundo com janela grande (luz forte) e bebedouro
      s += `<rect x="${f(fx0)}" y="${f(fy0)}" width="${fundoW}" height="${fundoH}" fill="#E2DCCB"/><rect x="${f(vx - 100)}" y="${f(fy0 + 40)}" width="200" height="170" fill="#FFF8E2" stroke="${L}" stroke-width="4"/><path d="M${f(vx)} ${f(fy0 + 40)} V${f(fy0 + 210)} M${f(vx - 100)} ${f(fy0 + 125)} H${f(vx + 100)}" stroke="#E9ECEF" stroke-width="6"/>`;
      s += `<circle cx="${f(vx)}" cy="${f(fy0 + 125)}" r="260" fill="#FFF4D6" opacity=".22"/>` + feixe(vx - 100, fy0 + 210, 200, vx - 300, y + h, 600, '#FFF4D6', 0.12);
      s += `<rect x="${f(vx + 60)}" y="${f(fy1 - 90)}" width="50" height="90" fill="#C9CED6" stroke="${L}" stroke-width="3"/><rect x="${f(vx + 56)}" y="${f(fy1 - 96)}" width="58" height="14" rx="3" fill="#9AA0A8" stroke="${L}" stroke-width="3"/>`;
      // ARMÁRIOS na parede esquerda (cada um um trapézio em perspectiva, 3 tons, cadeado, adesivos)
      const nA = 9;
      for (let k = 0; k < nA; k++) { const u0 = Math.pow(k / nA, 0.75), u1 = Math.pow((k + 1) / nA, 0.75);
        const xa = lerp(x - 30, fx0, u0), xb = lerp(x - 30, fx0, u1);
        const ta = lerp(chao - 640, lerp(fy0, fy1, 0.2), u0), tb = lerp(chao - 640, lerp(fy0, fy1, 0.2), u1);
        const ba = lerp(chao + 230, fy1, u0), bb = lerp(chao + 230, fy1, u1);
        const c = k % 3 === 1 ? '#3E6E9E' : '#4A7FB0';
        s += `<path d="M${f(xa)} ${f(ta)} L${f(xb)} ${f(tb)} L${f(xb)} ${f(bb)} L${f(xa)} ${f(ba)}Z" fill="${c}" stroke="${L}" stroke-width="${f(5 * (1 - u0 * 0.7))}"/>`;
        s += `<path d="M${f(xa + 4)} ${f(ta + 4)} L${f(xa + 4)} ${f(ba - 4)}" stroke="${tom(c, 0.25)}" stroke-width="${f(8 * (1 - u0 * 0.7))}"/>`;
        for (let v = 0; v < 3; v++) { const yy0 = lerp(ta, ba, 0.08 + v * 0.03), yy1 = lerp(tb, bb, 0.08 + v * 0.03); s += `<path d="M${f(lerp(xa, xb, 0.25))} ${f(lerp(yy0, yy1, 0.25))} L${f(lerp(xa, xb, 0.75))} ${f(lerp(yy0, yy1, 0.75))}" stroke="${tom(c, -0.3)}" stroke-width="${f(4 * (1 - u0 * 0.6))}"/>`; }
        const my = lerp(lerp(ta, ba, 0.5), lerp(tb, bb, 0.5), 0.8); s += `<rect x="${f(lerp(xa, xb, 0.75))}" y="${f(my)}" width="${f(8 * (1 - u0 * 0.6))}" height="${f(30 * (1 - u0 * 0.6))}" fill="#D9DEE4" stroke="${L}" stroke-width="2"/>`;
        if (k === 1) s += `<circle cx="${f(lerp(xa, xb, 0.45))}" cy="${f(lerp(ta, ba, 0.35))}" r="18" fill="#FFD23F" stroke="${L}" stroke-width="3"/><circle cx="${f(lerp(xa, xb, 0.55))}" cy="${f(lerp(ta, ba, 0.45))}" r="14" fill="#FF6B8A" stroke="${L}" stroke-width="3"/>`;   // adesivos
      }
      // PORTAS de sala na parede direita + cartazes + extintor
      [[0.12, 'SALA 7'], [0.5, 'SALA 8']].forEach(([u, nomeSala], i) => { const u1 = u + 0.18;
        const xa = lerp(x + w + 30, fx1, u), xb = lerp(x + w + 30, fx1, u1);
        const ta = lerp(chao - 560, lerp(fy0, fy1, 0.25), u), tb = lerp(chao - 560, lerp(fy0, fy1, 0.25), u1);
        const ba = lerp(chao + 230, fy1, u), bb = lerp(chao + 230, fy1, u1);
        s += `<path d="M${f(xa)} ${f(ta - 16)} L${f(xb)} ${f(tb - 10)} L${f(xb)} ${f(bb)} L${f(xa)} ${f(ba)}Z" fill="#5E3E26" stroke="${L}" stroke-width="5"/><path d="M${f(lerp(xa, xb, 0.08))} ${f(lerp(ta, tb, 0.08))} L${f(lerp(xa, xb, 0.92))} ${f(lerp(ta, tb, 0.92))} L${f(lerp(xa, xb, 0.92))} ${f(lerp(ba, bb, 0.92))} L${f(lerp(xa, xb, 0.08))} ${f(lerp(ba, bb, 0.08))}Z" fill="#8A5A34"/>`;
        s += `<path d="M${f(lerp(xa, xb, 0.3))} ${f(lerp(ta, tb, 0.3) + 40 * (1 - u))} L${f(lerp(xa, xb, 0.7))} ${f(lerp(ta, tb, 0.7) + 40 * (1 - u))} L${f(lerp(xa, xb, 0.7))} ${f(lerp(ta, tb, 0.7) + 160 * (1 - u))} L${f(lerp(xa, xb, 0.3))} ${f(lerp(ta, tb, 0.3) + 160 * (1 - u))}Z" fill="#9ED3F0" opacity=".8"/>`;
        s += texto(nomeSala, lerp(xa, xb, 0.5), lerp(ta, tb, 0.5) - 50 * (1 - u), 120 * (1 - u * 0.6), 34 * (1 - u * 0.6), '#2A2A30'); });
      const ext = lerp(x + w + 30, fx1, 0.36); s += `<rect x="${f(ext - 16)}" y="${f(chao - 210)}" width="32" height="90" rx="10" fill="#D7263D" stroke="${L}" stroke-width="4"/><rect x="${f(ext - 22)}" y="${f(chao - 240)}" width="44" height="24" fill="#2A2A30"/><rect x="${f(ext - 40)}" y="${f(chao - 330)}" width="80" height="70" fill="#D7263D" stroke="${L}" stroke-width="3"/>${texto('EXTINTOR', ext, chao - 295, 70, 16)}`;
      s += cartaz(x + w - 230, chao - 560, 150, 190, '#3B7DD8', 'FEIRA DE CIÊNCIAS', 3) + cartaz(lerp(x + w + 30, fx1, 0.74) - 40, lerp(chao - 420, fy0, 0.6), 70, 90, '#E2B33C', 'TORNEIO', -2, '#2A2A30');
      // luminárias no teto (em perspectiva) + poças de luz no chão
      for (let k = 0; k < 4; k++) { const u = Math.pow(k / 4, 0.8), ly = lerp(y + 40, fy0 + 10, u), lw = lerp(300, 60, u);
        s += `<rect x="${f(vx - lw / 2)}" y="${f(ly)}" width="${f(lw)}" height="${f(lerp(26, 6, u))}" rx="4" fill="#FFFDF0" stroke="${L}" stroke-width="3" class="lampada"/><ellipse cx="${f(vx)}" cy="${f(lerp(y + h - 160, fy1 + 10, u))}" rx="${f(lw * 0.9)}" ry="${f(lerp(60, 8, u))}" fill="#FFFFFF" opacity=".18"/>`; }
      return clip(x, y, w, h, s + acabamento(0.2));
    };

    // ---------- REFEITÓRIO: parede de azulejo com rejunte, janelas altas com feixes de luz, relógio, cartazes,
    // balcão de inox com vidro, cubas fumegantes (classe "vapor"), bandejas empilhadas, suqueira, lixeiras, vaso ----------
    E.refeitorio = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.6, balcao = true, mesasFundo = true, cartazes = true } = {}) => {
      let s = defs() + parede(x, y, w, chao - y, '#F1EEE6');
      // viga e teto com luminárias penduradas
      s += `<rect x="${x}" y="${y}" width="${w}" height="70" fill="#D9D3C2"/><rect x="${x}" y="${y + 70}" width="${w}" height="16" fill="#000" opacity=".12"/>`;
      const az = y + (chao - y) * 0.52;
      // janelas altas + feixes de luz diagonais (luz da esquerda)
      for (let k = 0; k < 3; k++) { const jx = x + 70 + k * 340, jy = y + 140; s += `<rect x="${f(jx - 10)}" y="${f(jy - 10)}" width="230" height="170" fill="#E9ECEF" stroke="${L}" stroke-width="5"/><rect x="${f(jx)}" y="${f(jy)}" width="210" height="150" fill="#BFE3F7"/><path d="M${f(jx + 20)} ${f(jy + 140)} L${f(jx + 110)} ${f(jy + 10)}" stroke="#fff" stroke-width="12" opacity=".5"/><path d="M${f(jx + 105)} ${f(jy)} V${f(jy + 150)}" stroke="#E9ECEF" stroke-width="7"/>`;
        s += feixe(jx, jy + 150, 210, jx + 260, y + h, 320, '#FFF4D6', 0.13); }
      // azulejo com rejunte e brilho
      s += `<rect x="${x}" y="${f(az)}" width="${w}" height="${f(chao - az)}" fill="#BFDCD5"/>`;
      for (let yy = az; yy < chao; yy += 44) for (let xx = x; xx < x + w; xx += 44) s += `<rect x="${xx + 2}" y="${f(yy + 2)}" width="40" height="40" fill="${tom('#D3EAE4', rnd(-0.05, 0.03))}"/><path d="M${xx + 6} ${f(yy + 8)} h10" stroke="#fff" stroke-width="3" opacity=".6"/>`;
      s += `<rect x="${x}" y="${f(az - 6)}" width="${w}" height="12" fill="#7FB3A8" stroke="${L}" stroke-width="3"/>` + sujeiraParede(x, chao, w, '#BFDCD5');
      // relógio, cardápio, cartazes
      s += relogio(x + w * 0.86, y + 420, 50);
      const cx = x + w * 0.5 - 180, cy = y + 360;
      s += `<rect x="${f(cx + 8)}" y="${f(cy + 10)}" width="360" height="210" rx="10" fill="#000" opacity=".15"/><rect x="${f(cx)}" y="${f(cy)}" width="360" height="210" rx="10" fill="#2E4A3A" stroke="#8A5A34" stroke-width="14"/>` + texto('CARDÁPIO DO DIA', cx + 180, cy + 44, 300, 42, '#FFFFFF') + texto('ARROZ • FEIJÃO • FRANGO', cx + 180, cy + 104, 310, 30, '#F2E9A0') + texto('SUCO DE LARANJA', cx + 180, cy + 152, 310, 30, '#F2E9A0') + `<path d="M${f(cx + 40)} ${f(cy + 190)} q20 -10 40 0 t40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`;
      if (cartazes) s += cartaz(x + 50, az - 260, 140, 180, '#E2B33C', 'LAVE AS MÃOS', -3, '#2A2A30') + cartaz(x + w - 210, az - 250, 150, 170, '#3E8A4A', 'COMA FRUTAS', 2);
      if (balcao) {   // balcão de comida (inox, 3 tons) com cubas fumegantes, vidro, bandejas empilhadas e suqueira
        const by = chao - 200;
        s += `<rect x="${x}" y="${f(by)}" width="${w}" height="200" fill="#B9BEC6" stroke="${L}" stroke-width="6"/><rect x="${x}" y="${f(by)}" width="${w}" height="30" fill="#E4E8EC" stroke="${L}" stroke-width="4"/><rect x="${x}" y="${f(by + 30)}" width="${w}" height="16" fill="#000" opacity=".12"/>`;
        for (let k = 0; k < 7; k++) s += `<path d="M${f(x + 40 + k * 150)} ${f(by + 70)} V${f(by + 190)}" stroke="#8A9098" stroke-width="4"/><path d="M${f(x + 46 + k * 150)} ${f(by + 70)} V${f(by + 190)}" stroke="#E4E8EC" stroke-width="2"/>`;
        const comidas = ['#F4F1E8', '#6A3A22', '#E8B04A', '#7AB04A', '#F2A65A'];
        for (let k = 0; k < 5; k++) { const cx2 = x + 60 + k * 190;
          s += `<rect x="${f(cx2)}" y="${f(by - 16)}" width="160" height="32" rx="6" fill="#8A9098" stroke="${L}" stroke-width="4"/><ellipse cx="${f(cx2 + 80)}" cy="${f(by - 16)}" rx="72" ry="13" fill="${comidas[k]}"/>${[...Array(6)].map(() => `<circle cx="${f(cx2 + rnd(20, 140))}" cy="${f(by - 16 + rnd(-6, 6))}" r="${f(rnd(3, 6))}" fill="${tom(comidas[k], rnd(-0.25, 0.15))}"/>`).join('')}`;
          s += `<g class="vapor" data-fase="${k * 0.37}">${[0, 1, 2].map(i => `<path d="M${f(cx2 + 40 + i * 40)} ${f(by - 30)} q-14 -30 0 -60 q14 -30 0 -60" stroke="#FFFFFF" stroke-width="7" fill="none" opacity=".55" stroke-linecap="round"/>`).join('')}</g>`; }
        s += `<path d="M${x} ${f(by - 140)} H${x + w}" stroke="#D6F2FA" stroke-width="12" opacity=".75"/><path d="M${x} ${f(by - 146)} H${x + w}" stroke="${L}" stroke-width="3"/>` + [...Array(5)].map((_, k) => `<path d="M${f(x + 40 + k * 230)} ${f(by - 140)} V${f(by - 20)}" stroke="#9AA0A8" stroke-width="5"/>`).join('');
        s += `<g transform="translate(${f(x + w - 90)} ${f(by - 16)})">${[0, 1, 2, 3, 4].map(i => `<rect x="-60" y="${-i * 10 - 10}" width="120" height="10" rx="3" fill="#C9603A" stroke="${L}" stroke-width="2"/>`).join('')}</g>`;
      }
      s += rodape(x, chao, w, '#7FB3A8');
      // piso com reflexo do sol das janelas e das luminárias
      s += piso(x, chao, w, y + h - chao, '#E2D8C4');
      for (let k = 0; k < 3; k++) s += `<path d="M${f(x + 70 + k * 340 + 160)} ${f(chao + 20)} L${f(x + 70 + k * 340 + 380)} ${f(chao + 20)} L${f(x + 70 + k * 340 + 560)} ${f(y + h)} L${f(x + 70 + k * 340 + 260)} ${f(y + h)}Z" fill="#FFF8E2" opacity=".18"/>`;
      // lixeiras de reciclagem e planta no canto
      s += lixeira(x + w - 70, chao + 10, 0.8, '#3B7DD8', 'PAPEL') + lixeira(x + w - 160, chao + 10, 0.8, '#D7263D', 'PLÁST.') + vaso(x + 60, chao + 20, 0.85);
      if (mesasFundo) s += E.mesa(x + w * 0.22, chao + 40, 0.55) + E.mesa(x + w * 0.62, chao + 40, 0.55);
      return clip(x, y, w, h, s + acabamento(0.18));
    };
    const lerp = (a, b, u) => a + (b - a) * u;

    // ---------- móveis do refeitório (pés no piso yPiso; k = escala pela distância) ----------
    E.mesa = (x, yPiso, k = 1, { cor = '#E9E4D8' } = {}) => {
      const W = 420 * k, H = 150 * k, t = 22 * k;
      return `<g><ellipse cx="${f(x)}" cy="${f(yPiso + 2)}" rx="${f(W * 0.55)}" ry="${f(12 * k)}" fill="#000" opacity=".18"/><rect x="${f(x - W / 2 + 20 * k)}" y="${f(yPiso - H)}" width="${f(14 * k)}" height="${f(H)}" fill="#8A9098" stroke="${L}" stroke-width="${f(4 * k + 1)}"/><rect x="${f(x + W / 2 - 34 * k)}" y="${f(yPiso - H)}" width="${f(14 * k)}" height="${f(H)}" fill="#8A9098" stroke="${L}" stroke-width="${f(4 * k + 1)}"/><rect x="${f(x - W / 2)}" y="${f(yPiso - H - t)}" width="${f(W)}" height="${f(t)}" rx="${f(6 * k)}" fill="${cor}" stroke="${L}" stroke-width="${f(5 * k + 1)}"/></g>`;
    };
    E.banco = (x, yPiso, k = 1, { largura = 420 } = {}) => {
      const W = largura * k, H = 84 * k, t = 18 * k;
      return `<g><rect x="${f(x - W / 2 + 16 * k)}" y="${f(yPiso - H)}" width="${f(12 * k)}" height="${f(H)}" fill="#8A9098" stroke="${L}" stroke-width="${f(4 * k + 1)}"/><rect x="${f(x + W / 2 - 28 * k)}" y="${f(yPiso - H)}" width="${f(12 * k)}" height="${f(H)}" fill="#8A9098" stroke="${L}" stroke-width="${f(4 * k + 1)}"/><rect x="${f(x - W / 2)}" y="${f(yPiso - H - t)}" width="${f(W)}" height="${f(t)}" rx="${f(5 * k)}" fill="#C9A26A" stroke="${L}" stroke-width="${f(5 * k + 1)}"/></g>`;
    };
    E.banco.altura = 102;   // topo do assento acima do piso (× k)

    // ---------- bandeja do refeitório: prato com arroz/feijão/frango + copo de suco de laranja ----------
    E.bandeja = (x, y, k = 1, { suco = true, prato = true } = {}) => {
      let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">`;
      s += `<rect x="-90" y="-8" width="180" height="16" rx="5" fill="#C9603A" stroke="${L}" stroke-width="4"/>`;
      if (prato) s += `<ellipse cx="-20" cy="-12" rx="56" ry="12" fill="#F4F6F8" stroke="${L}" stroke-width="3"/><ellipse cx="-38" cy="-18" rx="22" ry="8" fill="#FBF8EE"/><ellipse cx="-4" cy="-17" rx="16" ry="6" fill="#5A2E1A"/><ellipse cx="14" cy="-18" rx="12" ry="6" fill="#E0A04A"/>`;
      if (suco) s += `<path d="M48 -10 L44 -58 H76 L72 -10Z" fill="#FF9A3C" fill-opacity=".85" stroke="${L}" stroke-width="3"/><path d="M44 -58 H76" stroke="#fff" stroke-width="3"/>`;
      return s + `</g>`;
    };
    E.arrozNoChao = (x, y, k = 1) => { let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${k})"><ellipse cx="0" cy="0" rx="120" ry="20" fill="#FBF8EE" opacity=".9"/>`; for (let i = 0; i < 40; i++) s += `<ellipse cx="${f(rnd(-150, 150))}" cy="${f(rnd(-18, 22))}" rx="4" ry="2" fill="#FFFFFF" stroke="#CFC8B8" stroke-width="1"/>`; return s + `<ellipse cx="60" cy="8" rx="50" ry="12" fill="#5A2E1A" opacity=".85"/><path d="M-200 30 Q-120 10 -60 26 Q20 40 120 28" stroke="#FF9A3C" stroke-width="16" fill="none" opacity=".7" stroke-linecap="round"/></g>`; };

    // ---------- QUARTO do Léo à noite: luar azul pela janela (com cortina e cidade lá fora), varal de luzinhas,
    // estante com livros e troféu, pôster, mesa com abajur aceso, cadeira com roupa, tapete, porta-retrato do pai ----------
    E.quarto = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.62, noite = true } = {}) => {
      const pc = noite ? '#2E3A66' : '#8FB0D9';
      let s = defs() + parede(x, y, w, chao - y, pc);
      for (let k = 0; k < 14; k++) s += `<path d="M${f(x + k * 80)} ${y} V${f(chao)}" stroke="${tom(pc, 0.06)}" stroke-width="18" opacity=".35"/>`;   // papel de parede listrado
      // janela com cidade à noite, lua, cortinas e o feixe de luar no chão
      const jx = x + w * 0.55, jy = y + (chao - y) * 0.16, jw = 320, jh = 300;
      s += `<rect x="${f(jx - 12)}" y="${f(jy - 12)}" width="${jw + 24}" height="${jh + 24}" fill="#E9ECEF" stroke="${L}" stroke-width="5"/><rect x="${f(jx)}" y="${f(jy)}" width="${jw}" height="${jh}" fill="${noite ? '#14183A' : '#9ED3F0'}"/>`;
      if (noite) { s += [...Array(14)].map(() => `<circle cx="${f(jx + rnd(10, jw - 10))}" cy="${f(jy + rnd(10, jh * 0.6))}" r="${f(rnd(1.5, 3))}" fill="#fff" opacity="${f(rnd(0.4, 1))}"/>`).join('') + `<circle cx="${f(jx + jw * 0.72)}" cy="${f(jy + 70)}" r="38" fill="#F4EFD6"/><circle cx="${f(jx + jw * 0.72 + 16)}" cy="${f(jy + 60)}" r="34" fill="#14183A"/>`;
        let bx = jx; while (bx < jx + jw) { const bw = rnd(26, 60), bh = rnd(50, 130); s += `<rect x="${f(bx)}" y="${f(jy + jh - bh)}" width="${f(bw)}" height="${f(bh)}" fill="#20264A"/>${[...Array(4)].map(() => `<rect x="${f(bx + rnd(4, bw - 10))}" y="${f(jy + jh - rnd(10, bh - 8))}" width="5" height="7" fill="#FFD27A" opacity=".8"/>`).join('')}`; bx += bw + 3; } }
      s += `<path d="M${f(jx + jw / 2)} ${f(jy)} V${f(jy + jh)} M${f(jx)} ${f(jy + jh / 2)} H${f(jx + jw)}" stroke="#E9ECEF" stroke-width="8"/>`;
      s += `<path d="M${f(jx - 40)} ${f(jy - 30)} Q${f(jx + 20)} ${f(jy + jh * 0.5)} ${f(jx - 10)} ${f(jy + jh + 60)} H${f(jx - 60)} Z" fill="#5A3A6A" stroke="${L}" stroke-width="4"/><path d="M${f(jx + jw + 40)} ${f(jy - 30)} Q${f(jx + jw - 20)} ${f(jy + jh * 0.5)} ${f(jx + jw + 10)} ${f(jy + jh + 60)} H${f(jx + jw + 60)} Z" fill="#5A3A6A" stroke="${L}" stroke-width="4"/><path d="M${f(jx - 70)} ${f(jy - 34)} H${f(jx + jw + 70)}" stroke="#8A5A34" stroke-width="10" stroke-linecap="round"/>`;
      if (noite) s += feixe(jx, jy + jh, jw, jx - 260, y + h, jw + 220, '#9FB8FF', 0.16);
      // varal de luzinhas (classe "luzinha" para piscar)
      s += `<path d="M${f(x + 30)} ${f(y + 120)} Q${f(x + w * 0.3)} ${f(y + 230)} ${f(x + w * 0.52)} ${f(y + 130)}" stroke="#2A2A30" stroke-width="3" fill="none"/>` + [...Array(9)].map((_, i) => { const u = (i + 0.5) / 9, px = lerp(x + 30, x + w * 0.52, u), py = y + 120 + Math.sin(u * Math.PI) * 100 + (u * 10); return `<g class="luzinha" data-fase="${(i * 0.7).toFixed(2)}"><circle cx="${f(px)}" cy="${f(py + 10)}" r="16" fill="${['#FFD27A', '#FF9A6A', '#9FE0FF'][i % 3]}" opacity=".35"/><circle cx="${f(px)}" cy="${f(py + 10)}" r="6" fill="${['#FFD27A', '#FF9A6A', '#9FE0FF'][i % 3]}"/></g>`; }).join('');
      // pôster de futebol e estante com livros, troféu e plantinha
      s += `<g transform="rotate(-3 ${f(x + 160)} ${f(y + 470)})"><rect x="${f(x + 60)}" y="${f(y + 340)}" width="200" height="270" fill="#3E8A4A" stroke="${L}" stroke-width="5"/><circle cx="${f(x + 160)}" cy="${f(y + 450)}" r="50" fill="#fff" stroke="${L}" stroke-width="4"/><path d="M${f(x + 160)} ${f(y + 425)} l18 14 -7 22 h-22 l-7 -22Z" fill="${L}"/>${texto('CRAQUE', x + 160, y + 560, 160, 40, '#FFD23F')}</g>`;
      const ex = x + 70, ey = chao - 470;
      s += vol(ex, ey, 300, 22, '#8A5A34', 8, 4) + vol(ex, ey + 150, 300, 22, '#8A5A34', 8, 4);
      ['#D7263D', '#3B7DD8', '#E2B33C', '#3E8A4A', '#8E44AD', '#F2F2EE'].forEach((c, i) => { s += `<rect x="${f(ex + 12 + i * 30)}" y="${f(ey - 90 - (i % 2) * 14)}" width="26" height="${90 + (i % 2) * 14}" fill="${c}" stroke="${L}" stroke-width="3"/><path d="M${f(ex + 16 + i * 30)} ${f(ey - 70)} h18" stroke="#fff" stroke-width="2" opacity=".6"/>`; });
      s += `<g transform="translate(${f(ex + 250)} ${f(ey)})"><path d="M-22 -70 h44 q0 40 -22 46 q-22 -6 -22 -46Z" fill="#E2B33C" stroke="${L}" stroke-width="3"/><rect x="-6" y="-24" width="12" height="14" fill="#C9963A"/><rect x="-18" y="-10" width="36" height="10" fill="#8A5A34" stroke="${L}" stroke-width="2"/></g>`;
      s += `<g transform="translate(${f(ex + 60)} ${f(ey + 150)}) scale(.45)">${vaso(0, 0, 1)}</g><rect x="${f(ex + 130)}" y="${f(ey + 70)}" width="140" height="80" fill="#F2EEE6" stroke="${L}" stroke-width="3"/>${texto('CAIXA DO TÊNIS', ex + 200, ey + 110, 120, 20, '#C9603A')}`;
      // luz do abajur
      if (noite) s += `<circle cx="${f(x + w * 0.88)}" cy="${f(chao - 330)}" r="320" fill="#FFD27A" opacity=".14"/><circle cx="${f(x + w * 0.88)}" cy="${f(chao - 330)}" r="160" fill="#FFD27A" opacity=".12"/>`;
      // piso de madeira com tábuas em perspectiva e tapete redondo
      s += `<rect x="${x}" y="${f(chao)}" width="${w}" height="${f(y + h - chao)}" fill="${noite ? '#4A3A32' : '#A8835A'}"/>`;
      for (let k = 1, yy = chao; yy < y + h; k++) { yy = chao + (y + h - chao) * Math.pow(k / 8, 1.6); s += `<path d="M${x} ${f(yy)} H${x + w}" stroke="${noite ? '#3A2A24' : '#8A6A44'}" stroke-width="3"/>`; }
      for (let i = -5; i <= 5; i++) s += `<path d="M${f(x + w / 2 + i * 90)} ${f(chao)} L${f(x + w / 2 + i * 260)} ${f(y + h)}" stroke="${noite ? '#3A2A24' : '#8A6A44'}" stroke-width="2" opacity=".6"/>`;
      s += `<ellipse cx="${f(x + w * 0.55)}" cy="${f(chao + (y + h - chao) * 0.42)}" rx="360" ry="90" fill="${noite ? '#6A3A5A' : '#C96A8A'}" stroke="${L}" stroke-width="5"/><ellipse cx="${f(x + w * 0.55)}" cy="${f(chao + (y + h - chao) * 0.42)}" rx="290" ry="66" fill="none" stroke="${noite ? '#8A5A7A' : '#E89AB0'}" stroke-width="8"/>`;
      // mesa com abajur, caderno, estojo e o porta-retrato do pai
      const mx = x + w * 0.88;
      s += vol(mx - 130, chao - 210, 260, 22, '#8A5A34', 8, 5) + `<rect x="${f(mx - 120)}" y="${f(chao - 188)}" width="16" height="188" fill="#6A4428" stroke="${L}" stroke-width="3"/><rect x="${f(mx + 104)}" y="${f(chao - 188)}" width="16" height="188" fill="#6A4428" stroke="${L}" stroke-width="3"/>`;
      s += `<path d="M${f(mx + 30)} ${f(chao - 210)} v-90" stroke="${L}" stroke-width="6"/><path d="M${f(mx - 20)} ${f(chao - 300)} L${f(mx - 4)} ${f(chao - 360)} H${f(mx + 64)} L${f(mx + 80)} ${f(chao - 300)}Z" fill="#FFE08A" stroke="${L}" stroke-width="5"/>`;
      s += `<rect x="${f(mx - 110)}" y="${f(chao - 222)}" width="90" height="12" fill="#3B7DD8" stroke="${L}" stroke-width="2" transform="rotate(-4 ${f(mx - 65)} ${f(chao - 216)})"/>`;
      s += `<g transform="translate(${f(mx - 70)} ${f(chao - 212)})"><rect x="-34" y="-86" width="68" height="86" fill="#C9963A" stroke="${L}" stroke-width="4"/><rect x="-26" y="-78" width="52" height="66" fill="#F4E6C4"/><circle cx="-8" cy="-56" r="10" fill="#fff" stroke="${L}" stroke-width="2"/><path d="M-8 -46 v24" stroke="${L}" stroke-width="3"/><circle cx="12" cy="-50" r="7" fill="#fff" stroke="${L}" stroke-width="2"/><path d="M12 -43 v16" stroke="${L}" stroke-width="3"/><path d="M8 -46 l-12 6" stroke="${L}" stroke-width="2"/></g>`;   // foto: o pai e o Léo pequeno
      // cadeira com moletom jogado
      s += `<g transform="translate(${f(x + w * 0.66)} ${f(chao)})"><rect x="-60" y="-260" width="14" height="260" fill="#6A4428" stroke="${L}" stroke-width="3"/><rect x="-60" y="-120" width="130" height="18" fill="#8A5A34" stroke="${L}" stroke-width="4"/><rect x="56" y="-102" width="14" height="102" fill="#6A4428" stroke="${L}" stroke-width="3"/><rect x="-60" y="-102" width="14" height="102" fill="#6A4428"/><path d="M-66 -250 q40 10 70 70 q10 40 -30 60 h-40Z" fill="#3B5E8C" stroke="${L}" stroke-width="4"/></g>`;
      return clip(x, y, w, h, s + acabamento(0.22));
    };
    // cama (de lado): cabeceira à esquerda; assento/colchão em yPiso - 150*k
    E.cama = (x, yPiso, k = 1, { noite = true } = {}) => {
      const W = 620 * k;
      return `<g><ellipse cx="${f(x)}" cy="${f(yPiso + 2)}" rx="${f(W * 0.55)}" ry="${f(14 * k)}" fill="#000" opacity=".25"/><rect x="${f(x - W / 2)}" y="${f(yPiso - 300 * k)}" width="${f(30 * k)}" height="${f(300 * k)}" fill="#7A4E2C" stroke="${L}" stroke-width="5"/><rect x="${f(x - W / 2)}" y="${f(yPiso - 110 * k)}" width="${f(W)}" height="${f(110 * k)}" fill="#8A5A34" stroke="${L}" stroke-width="5"/><rect x="${f(x - W / 2 + 20 * k)}" y="${f(yPiso - 160 * k)}" width="${f(W - 30 * k)}" height="${f(60 * k)}" rx="${f(18 * k)}" fill="${noite ? '#C9C2DA' : '#F2EEF8'}" stroke="${L}" stroke-width="5"/><rect x="${f(x - W / 2 + 40 * k)}" y="${f(yPiso - 196 * k)}" width="${f(150 * k)}" height="${f(46 * k)}" rx="${f(20 * k)}" fill="#F4F6F8" stroke="${L}" stroke-width="4"/><path d="M${f(x - W / 2 + 230 * k)} ${f(yPiso - 158 * k)} Q${f(x + 80 * k)} ${f(yPiso - 176 * k)} ${f(x + W / 2 - 10 * k)} ${f(yPiso - 156 * k)} V${f(yPiso - 100 * k)} H${f(x - W / 2 + 230 * k)}Z" fill="${noite ? '#3E6E9E' : '#5A8EC9'}" stroke="${L}" stroke-width="4"/></g>`;
    };
    E.cama.assento = 150;

    // ---------- tela de celular em close: vídeo postado (tipo rede social), visualizações, curtidas ----------
    E.telaCelular = (x, y, w, h, { views = '2 MIL', usuario = '@duda', legenda = 'KKKKK O CENOURINHA', conteudo = '' } = {}) => {
      let s = `<rect x="${f(x - 26)}" y="${f(y - 60)}" width="${f(w + 52)}" height="${f(h + 120)}" rx="60" fill="#1A1C22" stroke="${L}" stroke-width="8"/><rect x="${f(x + w / 2 - 70)}" y="${f(y - 40)}" width="140" height="22" rx="11" fill="#0A0A0E"/>`;
      s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="20" fill="#000"/>`;
      s += `<g>${conteudo}</g>`;
      s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h * 0.12)}" fill="#000" opacity=".35"/>` + texto('PARA VOCÊ', x + w / 2, y + h * 0.06, w * 0.4, h * 0.035, '#FFFFFF');
      // lateral: curtir, comentar, compartilhar
      const icones = [
        (cx, cy) => `<path d="M${f(cx)} ${f(cy + 16)} C${f(cx - 34)} ${f(cy - 6)} ${f(cx - 22)} ${f(cy - 30)} ${f(cx)} ${f(cy - 14)} C${f(cx + 22)} ${f(cy - 30)} ${f(cx + 34)} ${f(cy - 6)} ${f(cx)} ${f(cy + 16)}Z" fill="#FF3B5C"/>`,
        (cx, cy) => `<path d="M${f(cx - 22)} ${f(cy - 16)} H${f(cx + 22)} Q${f(cx + 28)} ${f(cy - 16)} ${f(cx + 28)} ${f(cy - 8)} V${f(cy + 8)} Q${f(cx + 28)} ${f(cy + 14)} ${f(cx + 22)} ${f(cy + 14)} H${f(cx - 6)} L${f(cx - 16)} ${f(cy + 24)} V${f(cy + 14)} H${f(cx - 22)} Q${f(cx - 28)} ${f(cy + 14)} ${f(cx - 28)} ${f(cy + 8)} V${f(cy - 8)} Q${f(cx - 28)} ${f(cy - 16)} ${f(cx - 22)} ${f(cy - 16)}Z" fill="#FFFFFF"/>`,
        (cx, cy) => `<path d="M${f(cx - 20)} ${f(cy + 14)} Q${f(cx - 16)} ${f(cy - 10)} ${f(cx + 6)} ${f(cy - 10)} V${f(cy - 22)} L${f(cx + 26)} ${f(cy - 2)} L${f(cx + 6)} ${f(cy + 18)} V${f(cy + 6)} Q${f(cx - 10)} ${f(cy + 4)} ${f(cx - 20)} ${f(cy + 14)}Z" fill="#FFFFFF"/>`];
      [['1,2 MIL'], ['348'], ['210']].forEach(([n], i) => { const cy = y + h * (0.5 + i * 0.12); s += `<circle cx="${f(x + w - 60)}" cy="${f(cy)}" r="38" fill="#000" opacity=".35"/>` + icones[i](x + w - 60, cy) + texto(n, x + w - 60, cy + 58, 100, 24); });
      s += texto(usuario, x + w * 0.3, y + h * 0.84, w * 0.5, h * 0.035, '#FFFFFF') + texto(legenda, x + w * 0.42, y + h * 0.9, w * 0.78, h * 0.03, '#EEEEEE');
      s += `<g class="views"><rect x="${f(x + 24)}" y="${f(y + h * 0.31)}" width="${f(w * 0.56)}" height="${f(h * 0.065)}" rx="${f(h * 0.032)}" fill="#000" opacity=".8"/><text class="views-num" x="${f(x + 24 + w * 0.28)}" y="${f(y + h * 0.3425)}" font-family="'Anton', sans-serif" font-size="${f(h * 0.035)}" fill="#fff" text-anchor="middle" dominant-baseline="central" data-caber="${f(w * 0.5)}">${views} VISUALIZAÇÕES</text></g>`;
      return s;
    };
    return E;
  }
  global.Escola = Escola;
})(typeof window !== 'undefined' ? window : globalThis);
