/*
  arena.js — peças do Coliseu / anfiteatro romano (skill "cenario-ilustrado").
  Depende de cenario.js (usa luz, hora, tom e o gerador aleatório do cenário).

  const C = Cenario({ epoca: 'roma', hora: 'dia', luz: -1, seed: 3 });
  const A = Arena(C);
  s += A.blocos({ x: 0, y: 0, w: 1080, h: 1500 });          // parede de blocos de pedra (subsolo)
  s += A.tetoFrestas({ y: 0, h: 260, frestas: [220, 520, 840] }) // teto de tábuas = chão da arena, com luz entrando
  s += A.grade({ x, y, w, h })                              // grade de ferro (portão levadiço / cela)
  s += A.arco({ x, base, w, h, fundo: 'escuro' | 'luz' })   // arco de pedra com aduelas (túnel, portão)
  s += A.areia({ y }) · A.podio({ y }) · A.arquibancada({ y0, y1 }) · A.velario({ y }) · A.camarote({ x, y, w })
  Textos na cena sempre em português (regra da identidade-visual).
*/
(function (global) {
  function Arena(C) {
    const tom = C.tom, rnd = C.rnd, pick = C.pick, luz = C.luz, H = C.hora;
    const L = '#1D1D2B', f = v => Math.round(v * 10) / 10;
    const pedra = (C.mat && C.mat.travertino) || '#D8CBB3';
    const A = {};

    // ---------- parede de blocos grandes de pedra (opus quadratum), com juntas, lascas, umidade e musgo ----------
    A.blocos = ({ x = 0, y = 0, w = 1080, h = 1920, cor = '#9C8F7C', bloco = [150, 74], umido = 0.5 } = {}) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${tom(cor, -0.35)}"/>`;
      for (let yy = y, r = 0; yy < y + h; yy += bloco[1], r++) {
        for (let xx = x - (r % 2) * bloco[0] / 2 - rnd(0, 20); xx < x + w; ) {
          const bw = bloco[0] * rnd(0.75, 1.25), c = tom(cor, rnd(-0.12, 0.1));
          s += `<path d="M${f(xx + 4)} ${f(yy + 4)} H${f(xx + bw - 4)} Q${f(xx + bw)} ${f(yy + 4)} ${f(xx + bw - 2)} ${f(yy + bloco[1] / 2)} L${f(xx + bw - 4)} ${f(yy + bloco[1] - 4)} H${f(xx + 4)} Q${f(xx)} ${f(yy + bloco[1] - 6)} ${f(xx + 2)} ${f(yy + bloco[1] / 2)}Z" fill="${c}"/>`;
          s += `<path d="M${f(xx + 6)} ${f(yy + 7)} H${f(xx + bw - 8)}" stroke="${tom(c, 0.25)}" stroke-width="3" opacity=".7"/>`;                       // aresta de cima pega luz
          s += `<path d="M${f(xx + 6)} ${f(yy + bloco[1] - 6)} H${f(xx + bw - 6)}" stroke="${tom(c, -0.3)}" stroke-width="3" opacity=".6"/>`;
          if (rnd() < 0.18) s += `<path d="M${f(xx + bw * 0.6)} ${f(yy + 6)} l${f(rnd(-10, 10))} ${f(rnd(10, 22))} l${f(rnd(-8, 8))} ${f(rnd(8, 18))}" stroke="${tom(c, -0.45)}" stroke-width="2" fill="none"/>`;   // trinca
          if (rnd() < 0.12) s += `<path d="M${f(xx + bw - 4)} ${f(yy + 4)} l-14 0 l10 12Z" fill="${tom(c, -0.35)}"/>`;                                   // lasca no canto
          xx += bw;
        }
      }
      // umidade escorrendo e musgo perto do chão
      for (let i = 0; i < 8 * umido; i++) { const ux = rnd(x, x + w), uy = rnd(y, y + h * 0.5); s += `<path d="M${f(ux)} ${f(uy)} q${f(rnd(-6, 6))} ${f(rnd(60, 160))} ${f(rnd(-4, 4))} ${f(rnd(160, 320))}" stroke="${tom(cor, -0.5)}" stroke-width="${f(rnd(8, 20))}" opacity=".18" stroke-linecap="round" fill="none"/>`; }
      for (let i = 0; i < 14 * umido; i++) s += `<ellipse cx="${f(rnd(x, x + w))}" cy="${f(y + h - rnd(0, 120))}" rx="${f(rnd(14, 40))}" ry="${f(rnd(5, 12))}" fill="#4E6A3A" opacity=".35"/>`;
      return s;
    };

    // ---------- teto de tábuas (o chão da arena, visto por baixo) com frestas por onde entra luz e cai areia ----------
    // devolve o teto; os raios ficam num grupo com id `${id}-raios` (anime a opacidade)
    A.tetoFrestas = ({ y = 0, h = 260, w = 1080, frestas = [240, 560, 860], id = 'raios', chao = 1700 } = {}) => {
      let s = `<rect x="0" y="${y}" width="${w}" height="${h}" fill="#5A3A22"/>`;
      for (let xx = 0, i = 0; xx < w; xx += 92, i++) {
        const c = tom('#7A5232', rnd(-0.1, 0.12));
        s += `<rect x="${xx + 3}" y="${y}" width="86" height="${h - 30}" fill="${c}"/><path d="M${xx + 10} ${y} V${y + h - 34}" stroke="${tom(c, 0.25)}" stroke-width="3" opacity=".6"/>`;
        for (let k = 0; k < 3; k++) s += `<path d="M${f(xx + rnd(14, 76))} ${f(y + rnd(10, h - 60))} q${f(rnd(-6, 6))} 20 0 40" stroke="${tom(c, -0.35)}" stroke-width="2" fill="none" opacity=".6"/>`;   // veios
        s += `<circle cx="${xx + 20}" cy="${y + h - 46}" r="4" fill="#3A2A1E"/><circle cx="${xx + 70}" cy="${y + h - 46}" r="4" fill="#3A2A1E"/>`;   // pregos
      }
      s += `<rect x="0" y="${y + h - 34}" width="${w}" height="34" fill="#4A2E1A" stroke="${L}" stroke-width="5"/>`;   // viga
      frestas.forEach(fx => { s += `<rect x="${fx - 4}" y="${y}" width="8" height="${h - 34}" fill="#FFF4C9"/>`; });
      let r = `<g id="${id}">`;
      frestas.forEach((fx, i) => { const larg = rnd(60, 110), dx = -luz * rnd(80, 160); r += `<path d="M${fx - 4} ${y + h - 34} L${fx + 4} ${y + h - 34} L${f(fx + dx + larg)} ${chao} L${f(fx + dx - larg * 0.3)} ${chao}Z" fill="#FFF2C0" opacity=".22"/><ellipse cx="${f(fx + dx + larg * 0.35)}" cy="${chao}" rx="${f(larg * 0.8)}" ry="20" fill="#FFF2C0" opacity=".25"/>`; });
      r += `</g>`;
      return s + r;
    };

    // ---------- grade de ferro: barras verticais e travessas, rebites, ferrugem ----------
    A.grade = ({ x, y, w, h, barras = 7, travessas = 3, cor = '#3A3A40' } = {}) => {
      let s = '';
      for (let i = 0; i <= barras; i++) { const bx = x + i * w / barras; s += `<rect x="${f(bx - 7)}" y="${y}" width="14" height="${h}" fill="${cor}" stroke="${L}" stroke-width="3"/><path d="M${f(bx - 3)} ${y + 6} V${y + h - 6}" stroke="#8A8E96" stroke-width="2.5" opacity=".8"/>`; }
      for (let j = 0; j < travessas; j++) { const ty = y + 30 + j * (h - 60) / Math.max(1, travessas - 1); s += `<rect x="${x - 10}" y="${f(ty - 9)}" width="${w + 20}" height="18" fill="${tom(cor, 0.1)}" stroke="${L}" stroke-width="3"/>`;
        for (let i = 0; i <= barras; i++) s += `<circle cx="${f(x + i * w / barras)}" cy="${f(ty)}" r="5" fill="#6E727A" stroke="${L}" stroke-width="1.5"/>`; }
      for (let i = 0; i < barras * 2; i++) s += `<ellipse cx="${f(x + rnd(0, w))}" cy="${f(y + rnd(0, h))}" rx="${f(rnd(3, 7))}" ry="${f(rnd(6, 14))}" fill="#8A4A2A" opacity=".5"/>`;   // ferrugem
      return s;
    };

    // ---------- arco de pedra com aduelas e pedra-chave; fundo escuro (túnel) ou luz (saída) ----------
    A.arco = ({ x, base, w, h, fundo = 'escuro', cor = pedra, espessura = 46 } = {}) => {
      const r = w / 2, cx = x + r, topo = base - h, gid = `ar${Math.floor(rnd(1e5, 1e6))}`;
      const abert = `M${x} ${base} V${topo + r} A${r} ${r} 0 0 1 ${x + w} ${topo + r} V${base}Z`;
      let s = fundo === 'luz'
        ? `<defs><radialGradient id="${gid}" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#FFF2C0"/><stop offset="1" stop-color="#F2C878"/></radialGradient></defs><path d="${abert}" fill="url(#${gid})"/>`
        : `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0B10"/><stop offset="1" stop-color="#2A2024"/></linearGradient></defs><path d="${abert}" fill="url(#${gid})"/>`;
      const n = 11;
      for (let i = 0; i < n; i++) {   // aduelas
        const a0 = Math.PI + i * Math.PI / n, a1 = Math.PI + (i + 1) * Math.PI / n, R2 = r + espessura;
        const p = (a, rr) => `${f(cx + Math.cos(a) * rr)} ${f(topo + r + Math.sin(a) * rr)}`;
        const c = i === Math.floor(n / 2) ? tom(cor, 0.12) : tom(cor, rnd(-0.15, 0.05) + (Math.cos((a0 + a1) / 2) * -luz) * 0.08);
        s += `<path d="M${p(a0, r)} L${p(a0, R2 + (i === Math.floor(n / 2) ? 14 : 0))} L${p(a1, R2 + (i === Math.floor(n / 2) ? 14 : 0))} L${p(a1, r)}Z" fill="${c}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>`;
      }
      [x - espessura, x + w].forEach((px, i) => { for (let yy = topo + r; yy < base; yy += 60) s += `<rect x="${px}" y="${f(yy)}" width="${espessura}" height="60" fill="${tom(cor, (i === 0) === (luz < 0) ? 0.08 : -0.2) }" stroke="${L}" stroke-width="4"/>`; });   // ombreiras
      return s;
    };

    // ---------- chão de areia da arena: grãos, marcas de rastelo, pegadas, pedrinhas ----------
    A.areia = ({ y, h = 1920 - y, w = 1080, cor = '#E2C48A' } = {}) => {
      let s = `<rect x="0" y="${y}" width="${w}" height="${h}" fill="${cor}"/>`;
      s += `<rect x="0" y="${y}" width="${w}" height="${Math.min(h, 120)}" fill="${tom(cor, -0.12)}" opacity=".6"/>`;
      for (let k = 0; k < 10; k++) { const yy = y + 40 + k * (h / 10); s += `<path d="M0 ${f(yy)} Q${w / 2} ${f(yy + rnd(-14, 14))} ${w} ${f(yy)}" stroke="${tom(cor, -0.12)}" stroke-width="${2 + k * 0.4}" fill="none" opacity=".55"/>`; }   // rastelo
      for (let i = 0; i < 260; i++) s += `<circle cx="${f(rnd(0, w))}" cy="${f(rnd(y, y + h))}" r="${f(rnd(1, 3))}" fill="${pick([tom(cor, -0.25), tom(cor, 0.25), '#B89A62'])}" opacity="${f(rnd(0.3, 0.8))}"/>`;
      for (let i = 0; i < 12; i++) { const px = rnd(40, w - 40), py = rnd(y + 60, y + h - 40); s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="11" ry="6" fill="${tom(cor, -0.18)}" opacity=".7"/><ellipse cx="${f(px + 30)}" cy="${f(py - 18)}" rx="11" ry="6" fill="${tom(cor, -0.18)}" opacity=".7"/>`; }   // pegadas
      return s;
    };

    // ---------- muro do pódio (separa arena e plateia): mármore com faixa, portinhas e rede de proteção ----------
    A.podio = ({ y, h = 150, w = 1080, portas = [] } = {}) => {
      let s = `<rect x="0" y="${y}" width="${w}" height="${h}" fill="${tom('#E8DCC4', -0.05)}" stroke="${L}" stroke-width="5"/>`;
      s += `<rect x="0" y="${y + h * 0.18}" width="${w}" height="${h * 0.16}" fill="#9E2A22"/><rect x="0" y="${y + h * 0.7}" width="${w}" height="8" fill="${tom('#E8DCC4', -0.3)}"/>`;
      for (let xx = 0; xx < w; xx += 120) s += `<path d="M${xx} ${y + h * 0.34} V${y + h}" stroke="${tom('#E8DCC4', -0.25)}" stroke-width="3"/>`;
      portas.forEach(px => { s += `<path d="M${px - 40} ${y + h} V${y + 50} Q${px} ${y + 20} ${px + 40} ${y + 50} V${y + h}Z" fill="#2A1E18" stroke="${L}" stroke-width="5"/>`; });
      s += `<rect x="0" y="${y - 14}" width="${w}" height="16" fill="${tom('#E8DCC4', 0.15)}" stroke="${L}" stroke-width="4"/>`;
      // rede de proteção com postes no alto do pódio
      for (let xx = 30; xx < w; xx += 160) s += `<path d="M${xx} ${y - 14} V${y - 110}" stroke="#6E4524" stroke-width="8"/>`;
      for (let xx = 30; xx < w - 20; xx += 22) s += `<path d="M${xx} ${y - 104} L${xx + 22} ${y - 18} M${xx + 22} ${y - 104} L${xx} ${y - 18}" stroke="#C9B888" stroke-width="1.6" opacity=".7"/>`;
      return s;
    };

    // ---------- arquibancada cheia: fileiras de gente (cabeça + corpo colorido), algumas com braços para cima ----------
    // cada fileira vira <g class="torcida" data-f="i"> para animar (pular, ondular)
    A.arquibancada = ({ y0, y1, w = 1080, fileiras = 7, cor = '#CDB591', densidade = 1, bracos = 0.3, cores, tam = 1 } = {}) => {   // tam: tamanho das pessoas (close = 2–3)
      const pal = cores || ['#9E2A22', '#3B5E8C', '#E8DCC4', '#C9A24A', '#5C7A3A', '#7A5A9A', '#E86A3A', '#F2EBDA', '#6B4A2E', '#2E6B6B'];
      const pele = ['#F1C8A0', '#D9A877', '#B07A50', '#8A5A3A', '#F6D7B8'];
      let s = '';
      const hf = (y1 - y0) / fileiras;
      for (let i = 0; i < fileiras; i++) {
        const yy = y0 + i * hf, k = (0.55 + 0.45 * (i / (fileiras - 1))) * tam;          // de cima (longe, pequeno) para baixo (perto)
        const nev = (1 - i / fileiras) * 0.35;                                      // névoa: fileiras de cima mais claras
        s += `<rect x="0" y="${f(yy + hf * 0.62)}" width="${w}" height="${f(hf * 0.38 + 2)}" fill="${C.mix(tom(cor, -0.15), H.nevoa, nev)}"/><rect x="0" y="${f(yy + hf * 0.62)}" width="${w}" height="5" fill="${C.mix(tom(cor, 0.2), H.nevoa, nev)}"/>`;
        s += `<g class="torcida" data-f="${i}">`;
        const passo = 26 * k / densidade;
        for (let xx = rnd(-10, 10); xx < w + 20; xx += passo * rnd(0.85, 1.2)) {
          const c = C.mix(pick(pal), H.nevoa, nev), p = C.mix(pick(pele), H.nevoa, nev), by = yy + hf * 0.62, r = 9 * k;
          if (rnd() < bracos) s += `<path d="M${f(xx - 7 * k)} ${f(by - 20 * k)} l${f(-6 * k)} ${f(-26 * k)} M${f(xx + 7 * k)} ${f(by - 20 * k)} l${f(6 * k)} ${f(-26 * k)}" stroke="${p}" stroke-width="${f(5 * k)}" stroke-linecap="round"/>`;
          s += `<path d="M${f(xx - 11 * k)} ${f(by)} L${f(xx - 9 * k)} ${f(by - 24 * k)} Q${f(xx)} ${f(by - 30 * k)} ${f(xx + 9 * k)} ${f(by - 24 * k)} L${f(xx + 11 * k)} ${f(by)}Z" fill="${c}"/>`;
          s += `<circle cx="${f(xx)}" cy="${f(by - 30 * k - r)}" r="${f(r)}" fill="${p}"/>`;
          if (rnd() < 0.5) s += `<path d="M${f(xx - r)} ${f(by - 30 * k - r)} A${f(r)} ${f(r)} 0 0 1 ${f(xx + r)} ${f(by - 30 * k - r)}" fill="${C.mix(pick(['#2A1E16', '#4A3A2A', '#7A5A3A', '#1A1A1A']), H.nevoa, nev)}"/>`;
        }
        s += `</g>`;
      }
      return s;
    };

    // ---------- vomitório (entrada da plateia): arco escuro numa fileira ----------
    A.vomitorio = (x, y, w = 90, h = 110) => `<path d="M${x} ${y} V${y - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y - h + w / 2} V${y}Z" fill="#2A1E18" stroke="${L}" stroke-width="4"/>`;

    // ---------- velário: toldo de lona listrada no alto, com cordas ----------
    A.velario = ({ y = 0, w = 1080, h = 220, cores = ['#E8DCC4', '#C9A24A'] } = {}) => {
      let s = '';
      const n = 12;
      for (let i = 0; i < n; i++) { const x0 = i * w / n, x1 = (i + 1) * w / n; s += `<path d="M${f(x0)} ${y} H${f(x1)} L${f(x1 + 10)} ${y + h - 30} Q${f((x0 + x1) / 2 + 5)} ${y + h + 10} ${f(x0 + 10)} ${y + h - 30}Z" fill="${tom(cores[i % 2], i % 2 ? -0.05 : 0.05)}" stroke="${L}" stroke-width="4"/>`; }
      for (let i = 0; i <= n; i++) s += `<path d="M${f(i * w / n + 10)} ${y + h - 30} L${f(i * w / n + 10 + rnd(-30, 30))} ${y + h + 160}" stroke="#8A6A4A" stroke-width="3" opacity=".7"/>`;
      s += `<rect x="0" y="${y + h - 60}" width="${w}" height="70" fill="${H.sombra}" opacity=".12"/>`;
      return s;
    };

    // ---------- camarote do imperador (pulvinar): colunas, cortinas roxas, dossel, guirlanda ----------
    A.camarote = ({ x, y, w = 360, h = 300 } = {}) => {
      let s = `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="#3A1E3A"/>`;
      s += `<path d="M${x - 30} ${y - h} H${x + w + 30} L${x + w} ${y - h - 70} H${x}Z" fill="#6B2A6B" stroke="${L}" stroke-width="5"/>${[...Array(8)].map((_, i) => `<path d="M${f(x - 20 + i * (w + 40) / 8)} ${y - h} q${f((w + 40) / 16)} 30 ${f((w + 40) / 8)} 0" stroke="#C9A24A" stroke-width="5" fill="none"/>`).join('')}`;
      [x, x + w - 30].forEach(cx => { s += `<rect x="${cx}" y="${y - h}" width="30" height="${h}" fill="#EDE3CF" stroke="${L}" stroke-width="4"/><rect x="${cx + 4}" y="${y - h}" width="8" height="${h}" fill="#fff" opacity=".5"/>`; });
      s += `<path d="M${x + 30} ${y - h} Q${x + 60} ${y - h * 0.5} ${x + 34} ${y} H${x + 30}Z M${x + w - 30} ${y - h} Q${x + w - 60} ${y - h * 0.5} ${x + w - 34} ${y} H${x + w - 30}Z" fill="#8A2A6B" stroke="${L}" stroke-width="3"/>`;
      s += `<rect x="${x - 20}" y="${y - 70}" width="${w + 40}" height="70" fill="#EDE3CF" stroke="${L}" stroke-width="5"/><rect x="${x - 20}" y="${y - 54}" width="${w + 40}" height="16" fill="#6B2A6B"/>`;
      s += `<path d="M${x - 20} ${y - 76} Q${x + w / 4} ${y - 40} ${x + w / 2} ${y - 76} T${x + w + 20} ${y - 76}" stroke="#3E7B3A" stroke-width="10" fill="none"/>`;
      return s;
    };
    return A;
  }
  global.Arena = Arena;
})(window);
