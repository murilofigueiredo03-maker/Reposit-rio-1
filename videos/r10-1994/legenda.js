/*
  legenda.js — legenda dinâmica palavra por palavra para vídeo vertical (skill "legenda-dinamica").
  Estilo da marca (identidade-visual): fonte Luckiest Guy, branco com contorno preto, palavra falada em LARANJA.

  const leg = Legenda(document.querySelector('#legenda'), palavras, { y: 1450 });
  // palavras = transcript.json da transcrição: [{ text, start, end }, ...]  (segundos, tempo do áudio)
  // a cada quadro:  leg.seek(t)
  leg.esconder([[24.0, 26.0], [94.6, 99]])   // intervalos sem legenda (cartões, tela final)
  leg.mover([[61.0, 80.0, 1250]])            // muda a altura em trechos onde a ação ocupa a faixa padrão

  Regras (de caption-animation, remotion-captions e tiktok-captions, adaptadas):
  - tempo de cada palavra vem da transcrição (nunca dividir a frase igualmente);
  - 1 a 3 palavras por vez ("páginas"), quebrando em pontuação e em pausas da fala;
  - palavra falada = laranja e um pulinho (escala com leve passada do ponto); as outras brancas;
  - letra grossa com contorno preto grosso + sombra: lê no sol, sem som, em qualquer fundo;
  - faixa central-baixa (~75% da altura), dentro dos 80% do meio; longe dos 420 px de baixo (botões).
*/
(function (global) {
  const NS = 'http://www.w3.org/2000/svg';
  const LARANJA = '#FF7A00', PRETO = '#111111';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const back = u => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };   // easeOutBack

  function paginar(palavras, { maxPalavras = 3, maxLetras = 16, pausa = 0.35 } = {}) {
    const pags = []; let atual = [];
    const fecha = () => { if (atual.length) pags.push({ ini: atual[0].start, fim: atual[atual.length - 1].end, ps: atual }); atual = []; };
    palavras.forEach((w, i) => {
      const txt = w.text.trim(); if (!txt) return;
      const letras = atual.reduce((n, p) => n + p.text.length + 1, 0) + txt.length;
      const ant = atual[atual.length - 1];
      if (atual.length && (atual.length >= maxPalavras || letras > maxLetras || (ant && w.start - ant.end > pausa))) fecha();
      atual.push({ text: txt, start: w.start, end: w.end });
      if (/[.!?,;:]$/.test(txt)) fecha();
    });
    fecha();
    // cada página fica na tela até a próxima começar (sem piscar), no máximo 0,6 s depois da última palavra
    pags.forEach((p, i) => { const prox = pags[i + 1]; p.fimTela = prox ? Math.min(prox.ini, p.fim + 0.6) : p.fim + 0.6; });
    return pags;
  }

  function Legenda(grupo, palavras, opts = {}) {
    const o = { y: 1450, fs: 68, largura: 860, maiusculas: true, destaque: LARANJA, cor: '#FFFFFF', contorno: PRETO, fonte: "'Luckiest Guy', 'DejaVu Sans', sans-serif", enfase: [], ...opts };
    const pags = paginar(palavras, o);
    const enfase = new Set((o.enfase || []).map(s => s.toUpperCase()));
    const limpa = s => s.replace(/[.,;:!?"“”]/g, '');
    let esconde = [], moves = [];
    // monta todas as páginas uma vez (texto medido no navegador para centralizar)
    grupo.innerHTML = '';
    const els = pags.map(p => {
      const g = document.createElementNS(NS, 'g'); g.style.display = 'none'; grupo.appendChild(g);
      const palavrasEls = p.ps.map(w => {
        const t = document.createElementNS(NS, 'text');
        const txt = o.maiusculas ? limpa(w.text).toUpperCase() : limpa(w.text);
        t.textContent = txt;
        const forte = enfase.has(txt);
        const fs = o.fs * (forte ? 1.25 : 1);
        Object.entries({ 'font-family': o.fonte, 'font-size': fs, fill: forte ? o.destaque : o.cor, stroke: o.contorno, 'stroke-width': fs * 0.2, 'stroke-linejoin': 'round', 'paint-order': 'stroke', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }).forEach(([k, v]) => t.setAttribute(k, v));
        t.setAttribute('filter', 'drop-shadow(0 6px 0 rgba(0,0,0,.35))');
        g.appendChild(t); return { t, w, forte, fs };
      });
      return { g, p, ws: palavrasEls, medido: false };
    });
    function medir(E) {
      let larg = E.ws.map(x => x.t.getComputedTextLength());
      const esp = o.fs * 0.42 + 0.1 * Math.max(...larg);   // folga para o pulinho (escala) da palavra falada não encostar na vizinha
      let total = larg.reduce((a, b) => a + b, 0) + esp * (E.ws.length - 1);
      const k = total > o.largura ? o.largura / total : 1;     // encolhe se não couber
      let x = -total * k / 2;
      E.ws.forEach((x0, i) => { x0.cx = (x + larg[i] * k / 2); x += (larg[i] + esp) * k; x0.k = k; });
      E.medido = true;
    }
    const api = {
      paginas: pags,
      esconder(intervalos) { esconde = intervalos; return api; },
      mover(trechos) { moves = trechos; return api; },
      seek(t) {
        const oculto = esconde.some(([a, b]) => t >= a && t < b);
        const y = (moves.find(([a, b]) => t >= a && t < b) || [0, 0, o.y])[2];
        els.forEach(E => {
          const { p } = E;
          const vis = !oculto && t >= p.ini - 0.05 && t < p.fimTela;
          E.g.style.display = vis ? '' : 'none';
          if (!vis) { E.medido = false; return; }   // mede de novo quando reaparece (a fonte pode ter carregado depois)
          if (!E.medido) medir(E);
          const ent = clamp((t - (p.ini - 0.05)) / 0.16, 0, 1), sai = clamp((p.fimTela - t) / 0.08, 0, 1);
          const sc = 0.85 + 0.15 * back(ent);
          E.g.setAttribute('transform', `translate(540 ${y}) scale(${(sc).toFixed(3)})`);
          E.g.setAttribute('opacity', Math.min(1, ent * 2, sai).toFixed(3));
          E.ws.forEach(x => {
            const falando = t >= x.w.start && t < Math.max(x.w.end, x.w.start + 0.12);
            const ja = t >= x.w.start;
            const u = clamp((t - x.w.start) / 0.18, 0, 1);
            const pulo = falando ? 1 + 0.16 * Math.sin(Math.PI * u) : 1;
            x.t.setAttribute('fill', falando || x.forte ? o.destaque : o.cor);
            x.t.setAttribute('opacity', ja ? '1' : '0.55');
            x.t.setAttribute('transform', `translate(${x.cx.toFixed(1)} ${(falando ? -6 * Math.sin(Math.PI * u) : 0).toFixed(1)}) scale(${(x.k * pulo).toFixed(3)})`);
          });
        });
      }
    };
    return api;
  }
  Legenda.paginar = paginar;
  global.Legenda = Legenda;
})(window);
