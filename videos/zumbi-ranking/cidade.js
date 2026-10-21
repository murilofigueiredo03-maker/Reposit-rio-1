/*
  cidade.js — cenários de HOJE (cidade, casa, banheiro, lago, estrada) e de apocalipse (skill "cenario-ilustrado").
  Depende de cenario.js. Todas as peças aceitam a área (x, y, w, h) para caber em tela cheia ou em meia tela.

  const C = Cenario({ hora: 'dia', luz: -1, seed: 4 });  const Z = Cidade(C);
  s += Z.sala({ x: 0, y: 0, w: 1080, h: 1920, chao: 1700, cortina: 'aberta' | 'fechada', tv: 'noticia' | false, porta: 'trancada' | 'aberta' | false })
  s += Z.rua({ x: 0, y: 0, w: 1080, h: 1920, chao: 1600, caos: true })   // prédios, carros parados, fumaça, lixo
  s += Z.banheiro({...}) · Z.lago({...}) · Z.estrada({..., noite: true}) · Z.fachada({...}) · Z.noite({...}) · Z.fogueira(x, y, k)
  Textos sempre em português (identidade-visual).
*/
(function (global) {
  function Cidade(C) {
    const tom = C.tom, rnd = C.rnd, pick = C.pick, H = C.hora, luz = C.luz;
    const L = '#1D1D2B', f = v => Math.round(v * 10) / 10;
    const Z = {};
    const clip = (x, y, w, h, corpo) => { const id = `cz${Math.floor(rnd(1e5, 1e6))}`; return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${corpo}</g>`; };
    // ---------- parede pintada com rodapé e textura leve ----------
    const parede = (x, y, w, h, cor) => { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}"/>`; for (let i = 0; i < 6; i++) s += `<ellipse cx="${f(rnd(x, x + w))}" cy="${f(rnd(y, y + h))}" rx="${f(rnd(60, 160))}" ry="${f(rnd(40, 100))}" fill="${tom(cor, rnd(-0.08, 0.05))}" opacity=".5"/>`; return s; };
    const piso = (x, y, w, h, cor = '#A8835A') => { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}"/>`; for (let yy = y + 8, k = 0; yy < y + h; yy += 26 + k * 4, k++) s += `<path d="M${x} ${yy} H${x + w}" stroke="${tom(cor, -0.18)}" stroke-width="3"/>`; for (let i = 0; i < 14; i++) { const yy = y + rnd(0, h); s += `<path d="M${f(rnd(x, x + w))} ${f(yy)} v14" stroke="${tom(cor, -0.18)}" stroke-width="3"/>`; } return s; };

    // ---------- sala: janela com cortina, TV com noticiário, sofá, porta com tranca ----------
    Z.sala = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.88, cortina = 'aberta', tv = 'noticia', manchete = 'ATAQUES NA CIDADE', porta = false, noite = false, cor = '#E8D9B8' } = {}) => {
      let s = parede(x, y, w, chao - y, noite ? tom(cor, -0.45) : cor) + `<rect x="${x}" y="${chao - 30}" width="${w}" height="30" fill="${tom(cor, -0.35)}"/>` + piso(x, chao, w, y + h - chao);
      // janela
      const jx = x + w * 0.08, jy = y + (chao - y) * 0.22, jw = w * 0.36, jh = (chao - y) * 0.42;
      s += `<rect x="${f(jx)}" y="${f(jy)}" width="${f(jw)}" height="${f(jh)}" fill="${noite ? '#1B2148' : '#9ED3F0'}"/>`;
      if (!noite) s += `<path d="M${f(jx)} ${f(jy + jh * 0.75)} L${f(jx + jw * 0.3)} ${f(jy + jh * 0.45)} L${f(jx + jw * 0.45)} ${f(jy + jh * 0.6)} L${f(jx + jw * 0.7)} ${f(jy + jh * 0.35)} L${f(jx + jw)} ${f(jy + jh * 0.62)} V${f(jy + jh)} H${f(jx)}Z" fill="#8A9AAA"/><path d="M${f(jx + jw * 0.62)} ${f(jy + jh * 0.42)} q-14 -40 6 -80 q-24 20 -6 80" fill="#6E6E78" opacity=".7"/>`;
      s += `<rect x="${f(jx)}" y="${f(jy)}" width="${f(jw)}" height="${f(jh)}" fill="none" stroke="#F4F1EA" stroke-width="14"/><path d="M${f(jx + jw / 2)} ${f(jy)} V${f(jy + jh)}" stroke="#F4F1EA" stroke-width="10"/>`;
      const cc = '#B8463A';
      if (cortina === 'fechada') s += `<path d="M${f(jx - 30)} ${f(jy - 20)} H${f(jx + jw + 30)} V${f(jy + jh + 40)} H${f(jx - 30)}Z" fill="${cc}"/>` + [...Array(8)].map((_, k) => `<path d="M${f(jx - 20 + k * (jw + 40) / 8)} ${f(jy - 10)} V${f(jy + jh + 36)}" stroke="${tom(cc, -0.3)}" stroke-width="5"/>`).join('');
      else s += `<path d="M${f(jx - 30)} ${f(jy - 20)} H${f(jx + 30)} Q${f(jx + 10)} ${f(jy + jh / 2)} ${f(jx + 20)} ${f(jy + jh + 40)} H${f(jx - 30)}Z M${f(jx + jw + 30)} ${f(jy - 20)} H${f(jx + jw - 30)} Q${f(jx + jw - 10)} ${f(jy + jh / 2)} ${f(jx + jw - 20)} ${f(jy + jh + 40)} H${f(jx + jw + 30)}Z" fill="${cc}"/>`;
      s += `<rect x="${f(jx - 46)}" y="${f(jy - 30)}" width="${f(jw + 92)}" height="14" rx="6" fill="#5A3A22"/>`;
      // porta
      if (porta) {
        const px = x + w * 0.72, pw = w * 0.2, ph = (chao - y) * 0.62;
        s += `<rect x="${f(px)}" y="${f(chao - ph)}" width="${f(pw)}" height="${f(ph)}" fill="#8A5A30" stroke="${L}" stroke-width="6"/><rect x="${f(px + pw * 0.12)}" y="${f(chao - ph * 0.92)}" width="${f(pw * 0.76)}" height="${f(ph * 0.36)}" fill="none" stroke="${tom('#8A5A30', -0.3)}" stroke-width="4"/><rect x="${f(px + pw * 0.12)}" y="${f(chao - ph * 0.48)}" width="${f(pw * 0.76)}" height="${f(ph * 0.38)}" fill="none" stroke="${tom('#8A5A30', -0.3)}" stroke-width="4"/>`;
        s += `<circle cx="${f(px + pw * 0.15)}" cy="${f(chao - ph * 0.48)}" r="9" fill="#C9A24A" stroke="${L}" stroke-width="3"/>`;
        if (porta === 'trancada') s += `<rect x="${f(px + pw * 0.06)}" y="${f(chao - ph * 0.62)}" width="${f(pw * 0.2)}" height="12" rx="4" fill="#9AA0A8" stroke="${L}" stroke-width="3"/><path d="M${f(px + pw * 0.08)} ${f(chao - ph * 0.56)} q${f(pw * 0.1)} 30 ${f(pw * 0.2)} 0" stroke="#9AA0A8" stroke-width="5" fill="none"/>` + `<rect x="${f(px - pw * 0.15)}" y="${f(chao - ph * 0.42)}" width="${f(pw * 0.5)}" height="${f(ph * 0.42)}" fill="#7A5A3A" stroke="${L}" stroke-width="5" transform="rotate(-4 ${f(px)} ${f(chao)})"/>`;   // corrente + móvel escorando a porta
      }
      // TV no rack
      if (tv) {
        const tx = x + w * 0.6, ty = chao - (chao - y) * 0.34, tw = w * 0.36, th = tw * 0.58;
        s += `<rect x="${f(tx - 20)}" y="${f(ty + th + 10)}" width="${f(tw + 40)}" height="${f((chao - y) * 0.34 - th - 10)}" fill="#6E4A2E" stroke="${L}" stroke-width="5"/>`;
        s += `<rect x="${f(tx)}" y="${f(ty)}" width="${f(tw)}" height="${f(th)}" rx="6" fill="#15171B" stroke="${L}" stroke-width="5"/>`;
        if (tv === 'noticia') s += Z.telaNoticia(tx + 8, ty + 8, tw - 16, th - 16, manchete);
      }
      // sofá
      const sx = x + w * 0.06, sw = w * 0.5, sy = chao;
      s += `<path d="M${f(sx)} ${f(sy - 200)} q0 -30 30 -30 H${f(sx + sw - 30)} q30 0 30 30 V${f(sy - 40)} H${f(sx)}Z" fill="#3B5E8C" stroke="${L}" stroke-width="6"/><rect x="${f(sx - 20)}" y="${f(sy - 130)}" width="${f(sw + 40)}" height="90" rx="20" fill="#4A6E9E" stroke="${L}" stroke-width="6"/><rect x="${f(sx)}" y="${f(sy - 40)}" width="16" height="40" fill="${L}"/><rect x="${f(sx + sw - 16)}" y="${f(sy - 40)}" width="16" height="40" fill="${L}"/>`;
      return clip(x, y, w, h, s);
    };

    // texto que SEMPRE cabe numa caixa (largura e altura máximas). Estima a largura pela fonte e marca data-caber
    // para o ajuste fino no navegador (Palco.caberTextos na skill fisica-de-cena mede de verdade e encolhe se precisar).
    Z.textoCaber = (txt, cx, cy, larg, alt, { fonte = 'Anton', cor = '#fff', peso = 400, ancora = 'middle', larguraLetra = 0.5 } = {}) => {
      const fs = Math.min(alt, larg / Math.max(1, txt.length * larguraLetra));
      return `<text x="${f(cx)}" y="${f(cy)}" font-family="'${fonte}', 'DejaVu Sans Condensed', sans-serif" font-weight="${peso}" font-size="${f(fs)}" fill="${cor}" text-anchor="${ancora}" dominant-baseline="central" data-caber="${f(larg)}">${txt}</text>`;
    };

    // tela de telejornal (cabe em qualquer TV): imagem ao fundo, selo AO VIVO, faixa vermelha URGENTE + manchete branca, letreiro
    Z.telaNoticia = (x, y, w, h, manchete = 'ATAQUES NA CIDADE') => {
      let s = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#2E4A78"/>`;
      s += `<path d="M${f(x)} ${f(y + h * 0.62)} L${f(x + w * 0.22)} ${f(y + h * 0.38)} L${f(x + w * 0.36)} ${f(y + h * 0.5)} L${f(x + w * 0.58)} ${f(y + h * 0.26)} L${f(x + w * 0.78)} ${f(y + h * 0.44)} L${f(x + w)} ${f(y + h * 0.3)} V${f(y + h)} H${f(x)}Z" fill="#1E2E4E"/>`;   // silhueta da cidade
      s += `<path d="M${f(x + w * 0.6)} ${f(y + h * 0.42)} q-${f(w * 0.03)} -${f(h * 0.14)} ${f(w * 0.02)} -${f(h * 0.24)} q-${f(w * 0.07)} ${f(h * 0.07)} -${f(w * 0.02)} ${f(h * 0.24)}" fill="#FF8A3A"/>`;   // fogo
      const bx = x + w * 0.04, bw = w * 0.92, hb = h * 0.2, yb = y + h * 0.6;
      s += `<rect x="${f(x + w * 0.04)}" y="${f(y + h * 0.06)}" width="${f(w * 0.26)}" height="${f(h * 0.13)}" rx="3" fill="#D7263D"/>` + Z.textoCaber('● AO VIVO', x + w * 0.17, y + h * 0.125, w * 0.22, h * 0.1);
      s += `<rect x="${f(bx)}" y="${f(yb)}" width="${f(bw * 0.34)}" height="${f(hb)}" fill="#D7263D"/>` + Z.textoCaber('URGENTE', bx + bw * 0.17, yb + hb / 2, bw * 0.3, hb * 0.72);
      s += `<rect x="${f(bx + bw * 0.34)}" y="${f(yb)}" width="${f(bw * 0.66)}" height="${f(hb)}" fill="#F4F6F8"/>` + Z.textoCaber(manchete, bx + bw * 0.67, yb + hb / 2, bw * 0.6, hb * 0.72, { cor: '#111' });
      s += `<rect x="${f(x)}" y="${f(y + h * 0.86)}" width="${f(w)}" height="${f(h * 0.14)}" fill="#111"/>` + Z.textoCaber('FIQUEM EM CASA • TRANQUEM AS PORTAS', x + w / 2, y + h * 0.93, w * 0.9, h * 0.09, { cor: '#FFD23F' });
      return s;
    };

    // ---------- rua: prédios, carros abandonados, fumaça, lixo; caos = portas abertas, fogo, papel ----------
    Z.rua = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.82, caos = true, noite = false, faixas = null } = {}) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${noite ? '#1B1E3A' : '#B8C2CC'}"/>`;
      if (!noite) s += `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.6}" fill="#E8B88A" opacity=".45"/>`;   // céu alaranjado de fumaça
      // prédios ao fundo (névoa)
      let px = x - 20;
      while (px < x + w) { const pw = rnd(120, 220), ph = rnd(0.3, 0.55) * (chao - y); const c = noite ? '#2A2E50' : tom('#9AA4B0', rnd(-0.1, 0.05)); s += `<rect x="${f(px)}" y="${f(chao - ph - 120)}" width="${f(pw)}" height="${f(ph + 120)}" fill="${c}"/>`; for (let r = 0; r < ph / 50; r++) for (let k = 0; k < pw / 40 - 1; k++) if (rnd() < 0.7) s += `<rect x="${f(px + 14 + k * 40)}" y="${f(chao - ph - 100 + r * 50)}" width="20" height="26" fill="${noite ? (rnd() < 0.15 ? '#FFD27A' : '#1A1C30') : tom(c, -0.25)}"/>`; px += pw + rnd(0, 20); }
      // prédio da frente
      s += `<rect x="${x}" y="${f(chao - (chao - y) * 0.62)}" width="${f(w * 0.42)}" height="${f((chao - y) * 0.62)}" fill="${noite ? '#3A3046' : '#C9A88A'}" stroke="${L}" stroke-width="6"/>`;
      for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) { const wx = x + 40 + k * w * 0.2, wy = chao - (chao - y) * 0.55 + r * (chao - y) * 0.12; s += `<rect x="${f(wx)}" y="${f(wy)}" width="${f(w * 0.12)}" height="${f((chao - y) * 0.08)}" fill="${noite ? '#14162A' : '#3A4A5A'}" stroke="${L}" stroke-width="4"/>`; if (caos && (r + k) % 3 === 1) s += `<path d="M${f(wx + 8)} ${f(wy + 6)} l20 30 l14 -20 l18 26" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`; }
      // calçada e asfalto. Com faixas ({ calcadaFundo, rua, calcadaFrente } = y do pé em cada faixa, skill fisica-de-cena):
      // chão em profundidade — calçada do fundo encostada nos prédios, asfalto com faixa amarela, calçada da frente
      if (faixas) {
        const F = faixas, c1 = (F.calcadaFundo + F.rua) / 2, c2 = (F.rua + F.calcadaFrente) / 2, esc = noite ? 0.6 : 1;
        const cc = hex => tom(hex, noite ? -0.4 : 0);
        s += `<rect x="${x}" y="${f(chao)}" width="${w}" height="${f(c1 - chao)}" fill="${cc('#A9A69C')}"/>`;
        for (let k = 0; k * 34 < c1 - chao; k++) s += `<path d="M${x} ${f(chao + k * 34 * (1 + k * 0.15))} H${x + w}" stroke="#000" stroke-opacity=".08" stroke-width="2"/>`;
        s += `<rect x="${x}" y="${f(c1)}" width="${w}" height="${f(c2 - c1)}" fill="${cc('#4A4A52')}"/><rect x="${x}" y="${f(c1)}" width="${w}" height="${f(10 * esc + 4)}" fill="${cc('#C9C6BC')}"/>`;
        for (let k = 0; k < 7; k++) s += `<rect x="${f(x - 30 + k * 180)}" y="${f(F.rua - 6)}" width="100" height="10" fill="${cc('#F2D04A')}"/>`;
        s += `<rect x="${x}" y="${f(c2)}" width="${w}" height="${f(y + h - c2)}" fill="${cc('#B4B1A6')}"/><rect x="${x}" y="${f(c2)}" width="${w}" height="18" fill="${cc('#D6D3C8')}"/>`;
        for (let k = 0; k < 8; k++) s += `<path d="M${f(x + k * 160 - 20)} ${f(c2 + 18)} L${f(x + k * 200 - 160)} ${f(y + h)}" stroke="#000" stroke-opacity=".08" stroke-width="3"/>`;
      } else
      s += `<rect x="${x}" y="${f(chao)}" width="${w}" height="${f(y + h - chao)}" fill="#4A4A52"/><rect x="${x}" y="${f(chao)}" width="${w}" height="24" fill="#8A8A90"/>` + [...Array(6)].map((_, k) => `<rect x="${f(x + 40 + k * 190)}" y="${f(chao + (y + h - chao) * 0.55)}" width="100" height="12" fill="#E8D06A" opacity=".8"/>`).join('');
      if (caos) {
        // fumaça subindo, fogo num carro, papéis e lixo
        s += `<g class="fumaca-rua" opacity=".7">${[0, 1, 2, 3].map(k => `<circle cx="${f(x + w * 0.7 + k * 30)}" cy="${f(chao - (chao - y) * (0.6 + k * 0.1))}" r="${70 + k * 20}" fill="#5A5A62"/>`).join('')}</g>`;
        for (let i = 0; i < 12; i++) s += `<rect x="${f(rnd(x, x + w))}" y="${f(chao + rnd(10, y + h - chao - 10))}" width="${f(rnd(14, 30))}" height="${f(rnd(10, 20))}" fill="${pick(['#F2EEE2', '#D9C9A0', '#8A8A90'])}" transform="rotate(${f(rnd(-30, 30))} ${f(x + w / 2)} ${f(chao)})"/>`;
      }
      return clip(x, y, w, h, s);
    };

    // carro de hoje, de lado (sedã), cor escolhida; porta aberta opcional
    // carro de lado. camada: 'tudo' (padrão) | 'fundo' (lataria + interior: banco e volante) | 'frente' (porta, vidro e rodas)
    // Com motorista: desenhe 'fundo', depois o boneco com a pose 'montar' (Z.carro.pontos), depois 'frente'.
    Z.carro = (x, y, k = 1, { cor = '#3B7DD8', portaAberta = false, quebrado = false, dir = 1, camada = 'tudo' } = {}) => {
      const fundo = camada !== 'frente', frente = camada !== 'fundo', interior = camada !== 'tudo';
      let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${k * dir} ${k})">`;
      const lataria = `<path d="M-230 -40 Q-232 -110 -170 -118 L-110 -124 Q-70 -200 20 -200 Q110 -200 150 -126 L210 -116 Q240 -110 238 -40 Z" fill="${cor}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`;
      const vidros = (fill, op) => `<path d="M-96 -128 Q-62 -186 14 -186 V-128Z" fill="${fill}" fill-opacity="${op}" stroke="${L}" stroke-width="5"/><path d="M28 -186 Q96 -186 130 -128 H28Z" fill="${fill}" fill-opacity="${op}" stroke="${L}" stroke-width="5"/>`;
      if (fundo) {
        s += `<ellipse cx="0" cy="4" rx="230" ry="14" fill="#000" opacity=".25"/>` + lataria;
        if (interior) {
          s += `<path d="M-96 -128 Q-62 -186 14 -186 V-128Z M28 -186 Q96 -186 130 -128 H28Z" fill="#2A3038"/>`;   // interior escuro
          s += `<path d="M-4 -60 L4 -168 Q8 -180 20 -176 L22 -60Z" fill="#4A4A52" stroke="${L}" stroke-width="4"/><rect x="-4" y="-60" width="86" height="16" rx="6" fill="#4A4A52" stroke="${L}" stroke-width="4"/><path d="M-90 -60 L-84 -140 Q-80 -150 -70 -147 L-66 -60Z" fill="#3A3A42" stroke="${L}" stroke-width="4"/>`;   // banco
          s += `<path d="M150 -96 L122 -132" stroke="${L}" stroke-width="7" stroke-linecap="round"/><ellipse cx="120" cy="-134" rx="7" ry="24" transform="rotate(-28 120 -134)" fill="none" stroke="${L}" stroke-width="7"/>`;   // volante
        } else s += vidros('#9ED3F0', 1);
      }
      if (frente) {
        if (interior) {
          s += vidros('#9ED3F0', 0.32) + `<path d="M-226 -116 L-110 -124 L-100 -128 H130 L150 -126 L210 -116 Q240 -110 238 -40 H-230 Q-232 -110 -226 -116Z" fill="${cor}" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`;   // porta/lataria de baixo por cima das pernas
          s += `<path d="M14 -186 V-128 M28 -186 V-128" stroke="${L}" stroke-width="6"/>`;
        }
        if (quebrado) s += `<path d="M40 -170 l20 18 l-12 10 l26 16 M60 -152 l24 -8" stroke="#fff" stroke-width="3" fill="none"/>`;
        s += `<path d="M-230 -70 H238" stroke="${tom(cor, -0.3)}" stroke-width="4"/><rect x="-30" y="-108" width="30" height="8" rx="3" fill="${tom(cor, -0.4)}"/><rect x="110" y="-108" width="30" height="8" rx="3" fill="${tom(cor, -0.4)}"/>`;
        s += `<path d="M-200 -110 Q-110 -120 60 -120" stroke="#fff" stroke-width="6" fill="none" opacity=".35"/><rect x="214" y="-90" width="24" height="18" rx="4" fill="#FFE27A" stroke="${L}" stroke-width="3"/><rect x="-232" y="-90" width="16" height="18" rx="4" fill="#D7263D" stroke="${L}" stroke-width="3"/>`;
        if (portaAberta) s += `<path d="M28 -128 L-30 -150 L-36 -40 L28 -40Z" fill="${tom(cor, -0.15)}" stroke="${L}" stroke-width="5"/>`;
        [-140, 150].forEach(rx => { s += `<g class="roda" data-cx="${rx}" data-cy="-30" data-r="44"><circle cx="${rx}" cy="-30" r="44" fill="#22252A" stroke="${L}" stroke-width="6"/><circle cx="${rx}" cy="-30" r="20" fill="#B9BEC6" stroke="${L}" stroke-width="4"/><path d="M${rx - 18} -30 H${rx + 18}" stroke="${L}" stroke-width="4"/></g>`; });
      }
      return s + `</g>`;
    };
    // pontos do motorista (unidades do desenho; multiplique por k e some x, y): quadril no banco, pé no pedal, mãos no volante
    Z.carro.pontos = { assento: [36, -62], pe: [160, -50], guidao: [118, -140] };

    // ---------- banheiro: azulejo, privada com a CAIXA DA DESCARGA (tampa aberta), pia; abandonado = sujeira ----------
    Z.banheiro = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.86, abandonado = true, tampaAberta = true } = {}) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${chao - y}" fill="#CFE0DC"/>`;
      for (let yy = y; yy < chao; yy += 60) for (let xx = x; xx < x + w; xx += 60) s += `<rect x="${xx + 2}" y="${yy + 2}" width="56" height="56" fill="${tom('#DCEAE6', rnd(-0.05, 0.04))}"/>`;
      if (abandonado) { for (let i = 0; i < 7; i++) s += `<ellipse cx="${f(rnd(x, x + w))}" cy="${f(rnd(y, chao))}" rx="${f(rnd(40, 120))}" ry="${f(rnd(30, 80))}" fill="#7A7A5A" opacity=".2"/>`; s += `<path d="M${f(x + w * 0.2)} ${f(y + 60)} l30 80 l-20 40 l40 70" stroke="#5A5A50" stroke-width="3" fill="none"/>`; }
      s += `<rect x="${x}" y="${chao}" width="${w}" height="${y + h - chao}" fill="#9AA8A4"/>` + [...Array(10)].map((_, k) => `<path d="M${x + k * 120} ${chao} V${y + h}" stroke="#7A8884" stroke-width="3"/>`).join('');
      // privada (de lado, olhando para a direita) com a caixa acoplada atrás
      const px = x + w * 0.52, py = chao;
      s += `<g transform="translate(${f(px)} ${f(py)})">`;
      s += `<path d="M-130 -270 H-10 V-120 H-130Z" fill="#F4F6F8" stroke="${L}" stroke-width="6"/>`;   // caixa
      s += tampaAberta ? `<path d="M-140 -272 L-4 -272 L30 -330 L-110 -330Z" fill="#E4E8EC" stroke="${L}" stroke-width="5"/><rect x="-122" y="-262" width="104" height="26" fill="#5DB7EE"/><path d="M-122 -262 h104" stroke="#BDE6FF" stroke-width="4"/>` : `<rect x="-140" y="-286" width="140" height="18" rx="5" fill="#E4E8EC" stroke="${L}" stroke-width="5"/>`;
      s += `<rect x="-30" y="-250" width="28" height="12" rx="4" fill="#B9BEC6" stroke="${L}" stroke-width="3"/>`;   // alavanca
      s += `<path d="M-120 -120 H120 Q130 -80 90 -60 L60 -10 H-60 L-80 -60 Q-120 -80 -120 -120Z" fill="#F4F6F8" stroke="${L}" stroke-width="6"/><path d="M-110 -128 H124" stroke="${L}" stroke-width="10" stroke-linecap="round"/><path d="M-60 -10 L-50 0 H50 L60 -10" fill="#E4E8EC" stroke="${L}" stroke-width="5"/>`;
      s += `<path d="M-100 -100 Q0 -96 100 -100" stroke="#fff" stroke-width="5" opacity=".7" fill="none"/></g>`;
      // pia
      s += `<rect x="${f(x + w * 0.8)}" y="${f(chao - 330)}" width="160" height="40" rx="10" fill="#F4F6F8" stroke="${L}" stroke-width="5"/><rect x="${f(x + w * 0.8 + 66)}" y="${f(chao - 290)}" width="28" height="290" fill="#E4E8EC" stroke="${L}" stroke-width="5"/><path d="M${f(x + w * 0.8 + 70)} ${f(chao - 330)} v-40 h30" stroke="#9AA0A8" stroke-width="10" fill="none"/>`;
      return clip(x, y, w, h, s);
    };

    // ---------- lago: céu, morros, árvores, água "parecendo limpa" (brilhos) com margem ----------
    Z.lago = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.7, bacterias = false } = {}) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#9ED3F0"/><rect x="${x}" y="${y + (chao - y) * 0.5}" width="${w}" height="${(chao - y) * 0.5}" fill="#CDEBFF"/>`;
      s += `<path d="M${x} ${f(chao - (chao - y) * 0.25)} Q${f(x + w * 0.25)} ${f(chao - (chao - y) * 0.45)} ${f(x + w * 0.5)} ${f(chao - (chao - y) * 0.3)} T${x + w} ${f(chao - (chao - y) * 0.35)} V${chao} H${x}Z" fill="#7FA36A"/>`;
      for (let i = 0; i < 9; i++) { const tx = x + rnd(0, w), th = rnd(80, 160); s += `<path d="M${f(tx)} ${f(chao + 4)} Q${f(tx - 36)} ${f(chao - th * 0.5)} ${f(tx)} ${f(chao - th)} Q${f(tx + 36)} ${f(chao - th * 0.5)} ${f(tx)} ${f(chao + 4)}Z" fill="${pick(['#3E6B45', '#4F7F4A', '#2F5A3A'])}" stroke="${L}" stroke-width="4"/>`; }
      s += `<rect x="${x}" y="${chao}" width="${w}" height="${y + h - chao}" fill="#7FB86A"/>`;
      const ly = chao + (y + h - chao) * 0.15;
      s += `<ellipse cx="${f(x + w / 2)}" cy="${f(ly + (y + h - ly) * 0.45)}" rx="${f(w * 0.62)}" ry="${f((y + h - ly) * 0.5)}" fill="${bacterias ? '#6E9A5A' : '#4FA8D8'}" stroke="${L}" stroke-width="6"/>`;
      for (let i = 0; i < 8; i++) s += `<path d="M${f(x + rnd(w * 0.15, w * 0.8))} ${f(ly + rnd(30, (y + h - ly) * 0.8))} h${f(rnd(40, 90))}" stroke="#fff" stroke-width="5" opacity=".7" stroke-linecap="round"/>`;
      if (bacterias) for (let i = 0; i < 26; i++) { const bx = x + rnd(w * 0.1, w * 0.9), by = ly + rnd(20, (y + h - ly) * 0.85); s += `<g transform="translate(${f(bx)} ${f(by)}) rotate(${f(rnd(0, 180))})"><rect x="-16" y="-7" width="32" height="14" rx="7" fill="#9BCB3A" stroke="#3A5A1A" stroke-width="3"/><path d="M16 0 q8 -6 14 0" stroke="#3A5A1A" stroke-width="2.5" fill="none"/></g>`; }
      return clip(x, y, w, h, s);
    };

    // ---------- estrada saindo da cidade: asfalto em perspectiva, placa, árvores; noite opcional ----------
    Z.estrada = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.55, noite = false } = {}) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${noite ? '#14183A' : '#F2C89A'}"/>`;
      if (!noite) s += `<circle cx="${f(x + w * 0.75)}" cy="${f(y + (chao - y) * 0.55)}" r="70" fill="#FFE08A"/>`;
      s += `<path d="M${x} ${chao} L${f(x + w * 0.15)} ${f(chao - 60)} L${f(x + w * 0.3)} ${f(chao - 20)} L${f(x + w * 0.5)} ${f(chao - 90)} L${f(x + w * 0.7)} ${f(chao - 30)} L${x + w} ${f(chao - 70)} V${chao}Z" fill="${noite ? '#2A2E50' : '#8A9AAA'}"/>`;   // cidade ao longe
      s += `<rect x="${x}" y="${chao}" width="${w}" height="${y + h - chao}" fill="${noite ? '#2A3A2A' : '#9AB86A'}"/>`;
      s += `<path d="M${f(x + w * 0.46)} ${chao} L${f(x + w * 0.54)} ${chao} L${f(x + w * 0.95)} ${y + h} L${f(x + w * 0.05)} ${y + h}Z" fill="${noite ? '#2A2A30' : '#5A5A62'}"/>`;
      for (let k = 0; k < 6; k++) { const t0 = k / 6, t1 = t0 + 0.08; s += `<path d="M${f(x + w * 0.5)} ${f(chao + (y + h - chao) * t0 * t0)} L${f(x + w * 0.5)} ${f(chao + (y + h - chao) * t1 * t1)}" stroke="#E8D06A" stroke-width="${f(4 + 14 * t0)}"/>`; }
      s += `<g transform="translate(${f(x + w * 0.82)} ${f(chao + (y + h - chao) * 0.25)})"><rect x="-4" y="0" width="8" height="120" fill="#8A8A90"/><rect x="-90" y="-60" width="180" height="70" rx="8" fill="#2E7D4A" stroke="#fff" stroke-width="4"/><text y="-16" font-family="'DejaVu Sans', sans-serif" font-weight="800" font-size="26" fill="#fff" text-anchor="middle">SAÍDA ➜</text></g>`;
      return clip(x, y, w, h, s);
    };

    // ---------- fachada da casa (porta de entrada vista de fora, com degrau e luz) ----------
    Z.fachada = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.86, noite = true } = {}) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${noite ? '#1B1E3A' : '#9ED3F0'}"/>`;
      s += parede(x, y + (chao - y) * 0.12, w, (chao - y) * 0.88, noite ? '#5A4E6A' : '#D9C49A');
      const px = x + w * 0.36, pw = w * 0.28, ph = (chao - y) * 0.55;
      s += `<rect x="${f(px - 20)}" y="${f(chao - ph - 20)}" width="${f(pw + 40)}" height="${f(ph + 20)}" fill="#3A2A20"/><rect x="${f(px)}" y="${f(chao - ph)}" width="${f(pw)}" height="${f(ph)}" fill="#8A5A30" stroke="${L}" stroke-width="6"/><circle cx="${f(px + pw * 0.85)}" cy="${f(chao - ph * 0.48)}" r="10" fill="#C9A24A" stroke="${L}" stroke-width="3"/>`;
      s += `<rect x="${f(px + pw * 0.35)}" y="${f(chao - ph * 0.85)}" width="${f(pw * 0.3)}" height="${f(ph * 0.12)}" rx="6" fill="#2A2A30"/>`;   // olho mágico/visor
      if (noite) s += `<circle cx="${f(px + pw / 2)}" cy="${f(chao - ph - 60)}" r="16" fill="#FFE27A"/><path d="M${f(px - 120)} ${chao} L${f(px + pw / 2)} ${f(chao - ph - 60)} L${f(px + pw + 120)} ${chao}Z" fill="#FFE27A" opacity=".12"/>`;
      s += `<rect x="${x}" y="${chao}" width="${w}" height="${y + h - chao}" fill="${noite ? '#3A3A42' : '#9A9A90'}"/><rect x="${f(px - 60)}" y="${chao}" width="${f(pw + 120)}" height="22" fill="${noite ? '#5A5A62' : '#BDBDB0'}" stroke="${L}" stroke-width="4"/>`;
      return clip(x, y, w, h, s);
    };

    // ---------- noite fria ao ar livre (campo com árvores secas, lua, estrelas) ----------
    Z.noite = ({ x = 0, y = 0, w = 1080, h = 1920, chao = y + h * 0.82 } = {}) => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0E1230"/>`;
      for (let i = 0; i < 70; i++) s += `<circle cx="${f(x + rnd(0, w))}" cy="${f(y + rnd(0, (chao - y) * 0.7))}" r="${f(rnd(1, 3))}" fill="#fff" opacity="${f(rnd(0.3, 1))}"/>`;
      s += `<circle cx="${f(x + w * 0.78)}" cy="${f(y + (chao - y) * 0.22)}" r="60" fill="#F4EFD6"/><circle cx="${f(x + w * 0.78 + 22)}" cy="${f(y + (chao - y) * 0.22 - 12)}" r="54" fill="#0E1230"/>`;
      s += `<path d="M${x} ${f(chao - 80)} Q${f(x + w * 0.3)} ${f(chao - 160)} ${f(x + w * 0.6)} ${f(chao - 90)} T${x + w} ${f(chao - 120)} V${chao} H${x}Z" fill="#1A2040"/>`;
      for (let i = 0; i < 4; i++) { const tx = x + rnd(0, w), th = rnd(180, 320); s += `<path d="M${f(tx)} ${chao} V${f(chao - th)} M${f(tx)} ${f(chao - th * 0.6)} l-40 -60 M${f(tx)} ${f(chao - th * 0.75)} l50 -50 M${f(tx - 25)} ${f(chao - th * 0.6 - 38)} l-16 -30" stroke="#2A2E48" stroke-width="10" stroke-linecap="round"/>`; }
      s += `<rect x="${x}" y="${chao}" width="${w}" height="${y + h - chao}" fill="#1E2A26"/>` + [...Array(30)].map(() => `<path d="M${f(x + rnd(0, w))} ${f(chao + rnd(4, y + h - chao))} l-4 -14 M${f(x + rnd(0, w))} ${f(chao + rnd(4, y + h - chao))} l5 -12" stroke="#2E3E36" stroke-width="3"/>`).join('');
      return clip(x, y, w, h, s);
    };

    // ---------- fogueira: lenha cruzada, pedras, chamas (classe "chama" para animar), brilho ----------
    Z.fogueira = (x, y, k = 1, { acesa = true } = {}) => {
      let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${k})">`;
      if (acesa) s += `<circle cx="0" cy="-60" r="420" fill="#FF9A3C" opacity=".14"/><circle cx="0" cy="-60" r="230" fill="#FFB347" opacity=".2"/>`;
      s += [...Array(8)].map((_, i) => `<ellipse cx="${f(Math.cos(i / 8 * Math.PI * 2) * 110)}" cy="${f(Math.sin(i / 8 * Math.PI * 2) * 22)}" rx="30" ry="18" fill="#7A7A82" stroke="${L}" stroke-width="4"/>`).join('');
      s += `<path d="M-100 -10 L90 -60 M-90 -60 L100 -10" stroke="${L}" stroke-width="30" stroke-linecap="round"/><path d="M-100 -10 L90 -60 M-90 -60 L100 -10" stroke="#7A4E2C" stroke-width="22" stroke-linecap="round"/>`;
      if (acesa) s += `<g class="chama"><path d="M0 -20 C-90 -40 -60 -160 -10 -260 C-20 -180 30 -170 20 -250 C90 -160 80 -40 0 -20Z" fill="#FF6A2B" stroke="${L}" stroke-width="5"/><path d="M0 -30 C-44 -40 -36 -120 -6 -170 C0 -120 30 -110 22 -160 C56 -100 44 -40 0 -30Z" fill="#FFD24B"/></g>`;
      return s + `</g>`;
    };
    return Z;
  }
  global.Cidade = Cidade;
})(window);
