/*
  marca.js — identidade visual dos vídeos (skill "identidade-visual").
  Cores laranja e preto + fonte Luckiest Guy. Cada função devolve uma string SVG.

  No HTML:
    <style>@font-face { font-family: 'Luckiest Guy'; src: url(fontes/luckiest-guy.woff2); }</style>
    <script src="marca.js"></script>
  Uso:  grupo.innerHTML = Marca.impacto(540, 1000, 'FOGO!');
*/
(function (global) {
  const COR = { laranja: '#FF7A00', laranjaEscuro: '#C95A00', preto: '#111111', branco: '#FFFFFF', creme: '#FFF1E0' };
  const FONTE = "'Luckiest Guy', 'DejaVu Sans', sans-serif";
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // largura aproximada do texto na Luckiest Guy (para dimensionar faixas)
  const largura = (t, fs) => [...String(t)].reduce((w, c) => w + (c === ' ' ? 0.32 : /[IÍ1.,!:'|]/.test(c) ? 0.38 : /[MWmw]/.test(c) ? 0.92 : 0.66), 0) * fs;
  const texto = (x, y, t, { fs = 80, cor = COR.laranja, contorno = COR.preto, espessura, ancora = 'middle', rot = 0, sombra = true } = {}) => {
    const sw = espessura ?? Math.max(6, fs * 0.13);
    const tr = rot ? ` transform="rotate(${rot} ${x} ${y})"` : '';
    const base = `font-family="${FONTE}" font-size="${fs}" text-anchor="${ancora}"`;
    let s = '';
    if (sombra) s += `<text x="${x + fs * 0.05}" y="${y + fs * 0.07}" ${base} fill="${COR.preto}" stroke="${COR.preto}" stroke-width="${sw}" stroke-linejoin="round"${tr}>${esc(t)}</text>`;
    s += `<text x="${x}" y="${y}" ${base} fill="${cor}" stroke="${contorno}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke"${tr}>${esc(t)}</text>`;
    return s;
  };

  const Marca = {
    COR, FONTE, largura, texto,
    // Palavra de impacto: FOGO!, CUIDADO!, ECA! — laranja, contorno preto grosso, sombra dura
    impacto: (x, y, t, o = {}) => texto(x, y, t, { fs: 150, rot: -4, ...o }),
    // Frase curta de apoio: E VOCÊ?, AAAH! — branco com contorno preto
    apoio: (x, y, t, o = {}) => texto(x, y, t, { fs: 70, cor: COR.branco, ...o }),
    // Faixa de título/lugar: ROMA ANTIGA — faixa preta, texto laranja, fio laranja embaixo
    faixa: (x, y, t, { fs = 92, rot = -3, subtitulo = null } = {}) => {
      const w = largura(t, fs) + fs * 0.9, h = fs * 1.35;
      let s = `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2 + 10}" y="${-h / 2 + 12}" width="${w}" height="${h}" rx="${fs * 0.22}" fill="${COR.preto}" opacity=".35"/>`;
      s += `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${fs * 0.22}" fill="${COR.preto}"/><rect x="${-w / 2}" y="${h / 2 - fs * 0.14}" width="${w}" height="${fs * 0.14}" fill="${COR.laranja}"/>`;
      s += `<text x="0" y="${fs * 0.34}" font-family="${FONTE}" font-size="${fs}" text-anchor="middle" fill="${COR.laranja}">${esc(t)}</text>`;
      if (subtitulo) s += texto(0, h / 2 + fs * 0.62, subtitulo, { fs: fs * 0.42, cor: COR.branco, sombra: false });
      return s + `</g>`;
    },
    // Etiqueta pequena: 3º ANDAR, MOLHO, DURO — pílula preta, texto laranja
    etiqueta: (x, y, t, { fs = 46, cor = COR.laranja } = {}) => {
      const w = largura(t, fs) + fs * 1.1, h = fs * 1.55;
      return `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${COR.preto}"/><text y="${fs * 0.36}" font-family="${FONTE}" font-size="${fs}" text-anchor="middle" fill="${cor}">${esc(t)}</text></g>`;
    },
    // Carimbo: TODO DIA!, COMPARTILHADO — bloco laranja com texto preto, inclinado
    carimbo: (x, y, t, { fs = 96, rot = -8 } = {}) => {
      const w = largura(t, fs) + fs * 0.8, h = fs * 1.4;
      return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w}" height="${h}" rx="14" fill="${COR.preto}"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="${COR.laranja}" stroke="${COR.preto}" stroke-width="8"/><text y="${fs * 0.36}" font-family="${FONTE}" font-size="${fs}" text-anchor="middle" fill="${COR.preto}">${esc(t)}</text></g>`;
    },
    // Balão de fala com texto: "CUIDADO!" vindo de alguém
    balao: (x, y, t, { fs = 84, ponta = [-60, 130] } = {}) => {
      const w = largura(t, fs) + fs * 1.0, h = fs * 1.7;
      return `<g transform="translate(${x} ${y})"><path d="M${-w / 2} ${-h / 2} H${w / 2} Q${w / 2 + 30} ${-h / 2} ${w / 2 + 30} ${-h / 2 + 30} V${h / 2 - 30} Q${w / 2 + 30} ${h / 2} ${w / 2} ${h / 2} H${ponta[0] + 40} L${ponta[0]} ${ponta[1]} L${ponta[0] - 10} ${h / 2} H${-w / 2} Q${-w / 2 - 30} ${h / 2} ${-w / 2 - 30} ${h / 2 - 30} V${-h / 2 + 30} Q${-w / 2 - 30} ${-h / 2} ${-w / 2} ${-h / 2}Z" fill="${COR.branco}" stroke="${COR.preto}" stroke-width="9"/>${texto(0, fs * 0.36, t, { fs, sombra: false })}</g>`;
    },
    // Cartão de capítulo/desafio em tela cheia (1080x1920)
    cartao: ({ id, numero, rotulo = 'DESAFIO', titulo, icone = '', w = 1080, h = 1920 } = {}) => `<g id="${id}" class="scene"><rect width="${w}" height="${h}" fill="${COR.laranja}"/>
      <g opacity=".1" fill="${COR.preto}">${[0, 1, 2, 3, 4].map(k => `<rect x="${60 + k * 230}" y="0" width="70" height="${h}"/>`).join('')}</g>
      <g id="${id}-n"><circle cx="${w / 2}" cy="760" r="180" fill="${COR.preto}"/><text x="${w / 2}" y="830" font-family="${FONTE}" font-size="190" fill="${COR.laranja}" text-anchor="middle">${esc(numero)}</text></g>
      <g id="${id}-d">${texto(w / 2, 1050, rotulo, { fs: 84, cor: COR.preto, contorno: COR.preto, espessura: 0, sombra: false })}</g>
      <g id="${id}-t">${texto(w / 2, 1210, titulo, { fs: 140, cor: COR.branco })}</g>
      <g id="${id}-i" transform="translate(${w / 2} 1440)">${icone}</g></g>`,
    // Tela final com pergunta + chamada para comentar
    final: ({ id = 'fim', linhas = [], destaque = '', chamada = 'COMENTE AQUI ↓', w = 1080, h = 1920 } = {}) => {
      let s = `<g id="${id}" class="scene"><rect width="${w}" height="${h}" fill="${COR.preto}"/><g opacity=".14" fill="${COR.laranja}">${[0, 1, 2, 3, 4].map(k => `<rect x="${60 + k * 230}" y="0" width="70" height="${h}"/>`).join('')}</g><g id="${id}-t">`;
      linhas.forEach((l, i) => { s += texto(w / 2, 720 + i * 110, l, { fs: 92, cor: COR.branco, sombra: false }); });
      if (destaque) s += texto(w / 2, 720 + linhas.length * 110 + 30, destaque, { fs: 112, rot: -3 });
      s += `</g><g id="${id}-c" transform="translate(${w / 2} ${720 + linhas.length * 110 + 230})"><rect x="-300" y="-62" width="600" height="110" rx="55" fill="${COR.laranja}"/><text y="18" font-family="${FONTE}" font-size="54" text-anchor="middle" fill="${COR.preto}">${esc(chamada)}</text></g></g>`;
      return s;
    }
  };
  global.Marca = Marca;
})(window);
