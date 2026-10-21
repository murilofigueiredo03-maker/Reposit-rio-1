/*
  paletas.js — cores de época/lugar e roteiro de cores (skill "paleta-de-epoca").
  Usado junto com cenario.js:  Cenario({ epoca: 'roma', hora: 'dia', clima: 'mediterraneo' })
  e para dar "clima emocional" a uma cena:  cena.innerHTML += Paleta.grade('perigo');

  Base (skill color-expert): luz quente / sombra fria no dia; luz de fogo puxa para laranja;
  cor conta história por associação e transição; uma cor saturada num cenário contido vira foco.
  O laranja da marca (#FF7A00) é o foco — o cenário evita laranja puro e muito saturado.
*/
(function (global) {
  // ---------- materiais por época (cor base; cenario.js cria luz e sombra a partir dela) ----------
  const EPOCAS = {
    roma: {
      nome: 'Roma Antiga (Mediterrâneo, séc. I)',
      reboco: '#E6CFA6', reboco2: '#D9B48A', tijolo: '#A9583F', telha: '#B5503A', madeira: '#7E5232',
      pedra: '#B3A894', marmore: '#EDE3CF', travertino: '#D8CBB3', calcada: '#A49B8C', piso: '#9A9387',
      vegetacao: '#3E6B45', cipreste: '#2F5A3A', ceramica: '#B8613A', bronze: '#A8822E',
      tecido: ['#9E2A22', '#3B5E8C', '#C9A24A', '#5C7A3A', '#E8DCC4'],      // vermelho pompeiano, azul egípcio, ocre, oliva, linho
      afresco: '#9E2A22', distante: '#B79E83', ceu: 'mediterraneo',
      notas: 'Pigmentos de terra (ocres, terra de siena, vermelho pompeiano/cinábrio), azul egípcio raro e caro, mármore e travertino claros, telhas de barro. Luz forte de sol mediterrâneo: sombras curtas e azuladas.'
    },
    egito: {
      nome: 'Egito Antigo',
      reboco: '#E8D3A2', reboco2: '#D6B97E', tijolo: '#B48A5A', telha: '#C9A46A', madeira: '#8A6236',
      pedra: '#D9C08C', marmore: '#EFE2C2', travertino: '#E2CC98', calcada: '#D2B983', piso: '#C9AE78',
      vegetacao: '#4E8A3E', cipreste: '#2F6B32', ceramica: '#A5643A', bronze: '#C9A23A',
      tecido: ['#F2EBDA', '#1F6F8B', '#C9A23A', '#B5402E', '#2E5E4E'],      // linho, azul/turquesa, ouro, vermelho, verde malaquita
      afresco: '#1F6F8B', distante: '#D8BE8A', ceu: 'deserto',
      notas: 'Areia, calcário e arenito; ouro; lápis-lazúli e turquesa (azul egípcio); linho branco; verde do Nilo e das palmeiras. Céu muito claro, luz dura, quase sem nuvem.'
    },
    grecia: {
      nome: 'Grécia Antiga',
      reboco: '#F2EEE6', reboco2: '#E4DCCB', tijolo: '#B07050', telha: '#B86A48', madeira: '#7A5A3A',
      pedra: '#C8C2B4', marmore: '#F4F1EA', travertino: '#E6DFD0', calcada: '#BDB6A6', piso: '#B5AE9E',
      vegetacao: '#6F7F4A', cipreste: '#36543A', ceramica: '#B5612E', bronze: '#9C7A3A',
      tecido: ['#F4F1EA', '#2F5E9E', '#B5402E', '#D9A441', '#6F7F4A'],
      afresco: '#2F5E9E', distante: '#AFC2CF', ceu: 'mediterraneo',
      notas: 'Mármore branco, céu e mar azul intenso, oliveiras verde-acinzentado, cerâmica laranja com preto (figuras negras/vermelhas).'
    },
    medieval: {
      nome: 'Idade Média (Europa)',
      reboco: '#D9CDB2', reboco2: '#C9B994', tijolo: '#8E5A44', telha: '#6E5A4A', madeira: '#4E3626',
      pedra: '#8C877C', marmore: '#BFB8A8', travertino: '#A8A090', calcada: '#7E786C', piso: '#857E70',
      vegetacao: '#4F6B3A', cipreste: '#33502E', ceramica: '#8A5A3A', bronze: '#7A6A3A',
      tecido: ['#7A1F2A', '#2B4A7A', '#5E6B2E', '#C9A24A', '#6B5A4A'],      // carmesim, azul pastel (woad), verde, ouro, burel
      afresco: '#2B4A7A', distante: '#8E9AA6', ceu: 'temperado',
      notas: 'Pedra cinza, madeira escura de enxaimel, palha, lama; tecidos de tinta natural (garança, pastel-dos-tintureiros, gualda); brasões vivos contra cenário apagado. Céu frequentemente nublado.'
    },
    'brasil-colonia': {
      nome: 'Brasil Colônia (séc. XVII–XVIII)',
      reboco: '#F2EEE4', reboco2: '#E9C46A', tijolo: '#A65A3A', telha: '#A84B32', madeira: '#5A3A22',
      pedra: '#9C9486', marmore: '#E8E2D4', travertino: '#D8CDB8', calcada: '#8E877A', piso: '#9A8F80',
      vegetacao: '#2F7A3A', cipreste: '#1F5A2E', ceramica: '#A65A3A', bronze: '#B88A2E',
      tecido: ['#F2EEE4', '#2E5E9E', '#C9A24A', '#7A3A2A', '#3E7B3A'],
      afresco: '#2E5E9E', distante: '#7FA38A', ceu: 'tropical',
      notas: 'Casario caiado de branco com portas e janelas azul colonial, verde ou amarelo; telha capa-e-canal; ouro do barroco; mata atlântica verde intensa; céu tropical com nuvens altas.'
    },
    'velho-oeste': {
      nome: 'Velho Oeste',
      reboco: '#C9A57A', reboco2: '#B98D5E', tijolo: '#9A5A3A', telha: '#7A5A3A', madeira: '#8A6A4A',
      pedra: '#B07A5A', marmore: '#D9C2A0', travertino: '#C9A880', calcada: '#C29A6A', piso: '#B48C5E',
      vegetacao: '#7A8A4A', cipreste: '#5A6A3A', ceramica: '#9A5A3A', bronze: '#8A6A3A',
      tecido: ['#8A3A2A', '#3A4A6A', '#C9A24A', '#E8DCC4', '#4A3A2A'],
      afresco: '#8A3A2A', distante: '#C9805A', ceu: 'deserto',
      notas: 'Madeira desbotada pelo sol, terra vermelha, poeira no ar (névoa quente), céu azul-claro desbotado, montanhas cor de ferrugem.'
    },
    anos20: {
      nome: 'Anos 1920',
      reboco: '#D8CDB8', reboco2: '#BFAE90', tijolo: '#8A4A3A', telha: '#3A3A44', madeira: '#3A2A22',
      pedra: '#9A968C', marmore: '#E8E0CC', travertino: '#CFC4AE', calcada: '#7A7A76', piso: '#2A2A2E',
      vegetacao: '#3E5A3E', cipreste: '#2A4A2E', ceramica: '#7A5A3A', bronze: '#C9A23A',
      tecido: ['#1E1E22', '#C9A23A', '#7A1F2A', '#2E4A3A', '#E8E0CC'],
      afresco: '#C9A23A', distante: '#8A8A94', ceu: 'urbano',
      notas: 'Art déco: preto, dourado, creme e verde-escuro; fumaça de cidade; luz de poste amarelada à noite.'
    }
  };

  // ---------- clima/céu: ajusta as paletas de hora do cenario.js ----------
  // cada entrada mistura sobre a hora: ceu [topo, horizonte], nevoa, luz, sombra
  const CLIMAS = {
    mediterraneo: { dia: { ceu: ['#3E9BE0', '#CBEBFF'], luz: '#FFF1CC', sombra: '#26306A' } },
    deserto:      { dia: { ceu: ['#6FB6E8', '#F4E6C4'], nevoa: '#F2E2BE', luz: '#FFF4DA', sombra: '#3A3260' } },
    temperado:    { dia: { ceu: ['#8FAFC9', '#DDE6EC'], nevoa: '#DCE3E8', luz: '#F4F1E8', sombra: '#2E3446' } },
    tropical:     { dia: { ceu: ['#2F95E0', '#D2F0FF'], nevoa: '#E0F2F0', luz: '#FFF6D8', sombra: '#1E3A5A' } },
    urbano:       { dia: { ceu: ['#9AA7B4', '#E2E2DA'], nevoa: '#D6D4CC', luz: '#F2EEDF', sombra: '#2A2A38' } }
  };

  // ---------- roteiro de cores: "clima emocional" de cada cena ----------
  //  sat: 1 = normal, 0.5 = metade da saturação  ·  tint/tintOp/modo: véu de cor por cima
  const EMOCOES = {
    neutro:     { sat: 1, tint: null },
    confusao:   { sat: 0.55, tint: '#8FA3B8', tintOp: 0.22, modo: 'soft-light', nevoa: 0.10, desc: 'acordar, não entender: cores apagadas, frias, um véu' },
    descoberta: { sat: 1, tint: '#FFC27A', tintOp: 0.22, modo: 'soft-light', desc: 'revelação, maravilha: quente e luminoso' },
    rotina:     { sat: 0.9, tint: '#F2D9B0', tintOp: 0.12, modo: 'soft-light', desc: 'dia a dia: quente e calmo' },
    esforco:    { sat: 0.85, tint: '#D9A65E', tintOp: 0.18, modo: 'multiply', desc: 'cansaço, poeira, suor: ocre empoeirado' },
    nojo:       { sat: 0.7, tint: '#9BBF4A', tintOp: 0.38, modo: 'soft-light', desc: 'repulsa: amarelo-esverdeado doentio' },
    tensao:     { sat: 0.6, tint: '#3A3A6A', tintOp: 0.30, modo: 'multiply', desc: 'ameaça: escuro, frio, dessaturado' },
    perigo:     { sat: 1, tint: '#FF5A1F', tintOp: 0.20, modo: 'soft-light', sombra: '#2A0E3A', desc: 'fogo/perigo: laranja contra roxo-escuro (cor nova = ruptura)' },
    alivio:     { sat: 0.9, tint: '#FFC9A8', tintOp: 0.24, modo: 'soft-light', desc: 'depois da tempestade: pêssego suave' },
    nostalgia:  { sat: 0.7, tint: '#E8C08A', tintOp: 0.28, modo: 'multiply', desc: 'lembrança: sépia leve' },
    misterio:   { sat: 0.7, tint: '#3A5A7A', tintOp: 0.25, modo: 'multiply', desc: 'segredo: azul-petróleo' }
  };

  const Paleta = {
    EPOCAS, CLIMAS, EMOCOES,
    materiais: epoca => EPOCAS[epoca] || EPOCAS.roma,
    // véu de cor da emoção (coloque por cima do cenário, antes dos textos/atores)
    grade: (nome, { w = 1080, h = 1920, id } = {}) => {
      const E = EMOCOES[nome] || EMOCOES.neutro;
      let s = `<g class="grade"${id ? ` id="${id}"` : ''} pointer-events="none">`;
      if (E.sat < 1) s += `<rect width="${w}" height="${h}" fill="#808080" style="mix-blend-mode:saturation" opacity="${(1 - E.sat).toFixed(2)}"/>`;
      if (E.tint) s += `<rect width="${w}" height="${h}" fill="${E.tint}" style="mix-blend-mode:${E.modo || 'soft-light'}" opacity="${E.tintOp}"/>`;
      if (E.sombra) s += `<rect width="${w}" height="${h}" fill="url(#grade-${nome}-v)" style="mix-blend-mode:multiply"/><defs><radialGradient id="grade-${nome}-v" cx=".5" cy=".45" r=".75"><stop offset=".5" stop-color="${E.sombra}" stop-opacity="0"/><stop offset="1" stop-color="${E.sombra}" stop-opacity=".55"/></radialGradient></defs>`;
      if (E.nevoa) s += `<rect width="${w}" height="${h}" fill="#DDE4EA" opacity="${E.nevoa}"/>`;
      return s + `</g>`;
    }
  };
  global.Paleta = Paleta;
})(window);
