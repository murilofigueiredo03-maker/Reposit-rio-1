/*
  palco.js — chão com perspectiva, faixas de profundidade e física simples de cena (skill "fisica-de-cena").

  const palco = Palco({ horizonte: 980, yRef: 1700, kRef: 0.62,
                        faixas: { calcadaFundo: 1390, rua: 1540, calcadaFrente: 1720 } });
  palco.k(1540)                  // escala de quem pisa em y = 1540 (mais longe = menor; regra do horizonte)
  palco.y('rua')                 // y do chão de uma faixa
  const z = new Boneco(g, { escala: palco.k(palco.y('rua')), ... })      // nasce com a escala da faixa
  palco.ator(g, { y: palco.y('rua') })                                  // registra para a ordem de pintura
  palco.atravessar(g, boneco, [[t0, 'rua'], [t1, 'calcadaFrente']])     // muda de faixa andando (escala e y juntos)
  palco.seek(t)                  // a cada quadro: ajusta profundidade e põe quem está mais perto na frente
  palco.girarRodas(grupoVeiculo, distancia)    // rodas (.roda) giram conforme a distância andada
  palco.pedivela(grupoBike, boneco, t)         // pedal (.pedivela) gira junto com os pés do ciclista
  Palco.caberTextos(svg)        // depois das fontes carregarem: encolhe todo <text data-caber="largura"> que passar
*/
(function (global) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = u => u * u * (3 - 2 * u);

  function Palco({ horizonte = 900, yRef = 1700, kRef = 0.6, faixas = {} } = {}) {
    const atores = [];
    const api = {
      horizonte, faixas,
      // perspectiva de 1 ponto: o tamanho na tela é proporcional à distância do pé até a linha do horizonte
      k: y => kRef * Math.max(0.02, (y - horizonte) / (yRef - horizonte)),
      y: nome => typeof nome === 'number' ? nome : faixas[nome],
      // grupo pintado na ordem do y do pé (quem está mais embaixo na tela está mais perto e fica na frente)
      ator(g, { y, ordem = 0 } = {}) { atores.push({ g, y0: y, y, ordem, trilha: null, b: null }); return api; },
      // o boneco anda normalmente na faixa y0 (com a escala de y0); o palco desloca e reescala o grupo
      // em volta do pé dele para chegar às faixas da trilha: [[t, faixaOuY], ...]
      atravessar(g, b, trilha) {
        let A = atores.find(a => a.g === g);
        if (!A) { const y0 = api.y(trilha[0][1]); api.ator(g, { y: y0 }); A = atores[atores.length - 1]; }
        A.trilha = trilha.map(([t, f]) => [t, api.y(f)]); A.b = b; return api;
      },
      yEm(A, t) {
        const tr = A.trilha; if (!tr) return A.y0;
        if (t <= tr[0][0]) return tr[0][1];
        for (let i = 1; i < tr.length; i++) if (t <= tr[i][0]) return lerp(tr[i - 1][1], tr[i][1], smooth((t - tr[i - 1][0]) / Math.max(0.01, tr[i][0] - tr[i - 1][0])));
        return tr[tr.length - 1][1];
      },
      seek(t) {
        const pais = new Set();
        atores.forEach(A => {
          A.y = api.yEm(A, t);
          if (A.trilha) {
            const P = A.b && A.b.pose(t);
            const px = P ? P.R[0] : 0;
            const r = api.k(A.y) / api.k(A.y0);
            A.g.setAttribute('transform', `translate(${px.toFixed(1)} ${A.y.toFixed(1)}) scale(${r.toFixed(4)}) translate(${(-px).toFixed(1)} ${(-A.y0).toFixed(1)})`);
          }
          pais.add(A.g.parentNode);
        });
        // ordem de pintura: mais longe primeiro
        pais.forEach(pai => {
          const meus = atores.filter(A => A.g.parentNode === pai).sort((a, b) => (a.y + a.ordem) - (b.y + b.ordem));
          meus.forEach(A => pai.appendChild(A.g));
        });
      },
      girarRodas(grupo, dist) {
        grupo.querySelectorAll('.roda').forEach(r => {
          const cx = +r.dataset.cx, cy = +r.dataset.cy, raio = +r.dataset.r || 50;
          r.setAttribute('transform', `rotate(${(dist / raio * 180 / Math.PI).toFixed(1)} ${cx} ${cy})`);
        });
      },
      // a pedivela gira no mesmo ângulo dos pés da pose 'montar' (rpm e fase iguais aos do boneco)
      pedivela(grupo, rpm, fase, t0, t) {
        const ang = fase + (t - t0) * rpm / 60 * 360;
        grupo.querySelectorAll('.pedivela').forEach(p => p.setAttribute('transform', `rotate(${ang.toFixed(1)} ${p.dataset.cx} ${p.dataset.cy})`));
      },
    };
    return api;
  }

  // mede cada <text data-caber="L"> e reduz a fonte até caber na largura L (mantém o centro)
  Palco.caberTextos = (raiz = document) => {
    raiz.querySelectorAll('text[data-caber]').forEach(el => {
      const L = +el.dataset.caber; let fs = +el.getAttribute('font-size');
      for (let i = 0; i < 30 && el.getComputedTextLength() > L; i++) { fs *= 0.95; el.setAttribute('font-size', fs.toFixed(1)); }
    });
  };

  // chão de uma rua em perspectiva com as faixas (calçada do fundo, asfalto, calçada da frente) — para usar
  // quando o cenário não tem chão próprio; retorna SVG. Linhas da rua fogem para o ponto de fuga (px, horizonte).
  Palco.chaoRua = ({ w = 1080, h = 1920, horizonte = 980, faixas, px = 540, noite = false } = {}) => {
    const F = faixas, c = noite ? 0.55 : 1;
    const cor = (hex) => { const n = parseInt(hex.slice(1), 16), m = v => Math.round(v * c); return `rgb(${m(n >> 16)},${m((n >> 8) & 255)},${m(n & 255)})`; };
    const meioFundo = (F.calcadaFundo + F.rua) / 2, meioFrente = (F.rua + F.calcadaFrente) / 2;
    let s = `<rect x="0" y="${horizonte}" width="${w}" height="${h - horizonte}" fill="${cor('#9A9A92')}"/>`;
    s += `<rect x="0" y="${meioFundo - 30}" width="${w}" height="${meioFrente - meioFundo + 30}" fill="${cor('#4A4D52')}"/>`;   // asfalto
    s += `<rect x="0" y="${meioFundo - 40}" width="${w}" height="12" fill="${cor('#C9C6BC')}"/><rect x="0" y="${meioFrente}" width="${w}" height="16" fill="${cor('#C9C6BC')}"/>`;   // meio-fios
    for (let i = -8; i <= 8; i++) { const xb = px + i * 220; s += `<path d="M${px + i * 40} ${horizonte} L${xb} ${h}" stroke="#000" stroke-opacity=".06" stroke-width="3"/>`; }   // juntas da calçada
    const yF = F.rua; for (let x = -40; x < w; x += 170) s += `<rect x="${x}" y="${yF - 6}" width="90" height="10" fill="${cor('#F2D04A')}"/>`;   // faixa amarela
    return s;
  };

  global.Palco = Palco;
})(typeof window !== 'undefined' ? window : globalThis);
