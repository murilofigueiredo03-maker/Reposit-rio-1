---
name: objetos-detalhados
description: Desenha alimentos, objetos e eletrodomésticos MUITO DETALHADOS em SVG (nada de "ícone chapado") — pão francês com pestana, miolo, farinha e mordida; pão romano de 8 gomos; queijo com olhos e fatia cortada; cacho de uvas; peixe com escamas; ânfora/jarro de barro com etiqueta; moeda antiga em relevo; geladeira com puxadores, painel, grade e ímãs; carrinho de supermercado de arame; micro-ondas; fogão; TV; celular; liquidificador. Usa o método "objeto de verdade, cheio de peças" (forma real, volume em 4 tons + brilho, peças, material, sinais de uso e de história, sombra de contato). Use SEMPRE que um alimento ou objeto aparecer grande ou em destaque no vídeo (cartão de desafio, close, comparação época × hoje, objeto citado na narração), quando pedirem "mais detalhe", "mais realista", "mais caprichado" ou disserem que um objeto está "simples", "chapado", "parecendo ícone". Trabalha junto com "objetos-de-cena" (objetos de fundo), "cenario-ilustrado", "paleta-de-epoca" e "identidade-visual".
---

# objetos-detalhados — objeto que dá vontade de olhar de perto

Pedido do usuário: alimentos, objetos e eletrodomésticos com **muito mais detalhe** nos vídeos
(o pão do desafio, a geladeira, o carrinho de mercado…). `assets/antes-depois.jpg` mostra a diferença.

Método adaptado da skill **anatomy** (wheresryan22/anatomy, licença MIT), achada com a find-skills:
"todo objeto é muito detalhado: um objeto real, feito de muitas peças pequenas e com propósito". Ela
desenha máquinas técnicas em 3D isométrico; aqui o método vira o nosso estilo de desenho animado
(contorno escuro, cores vivas, luz de um lado). Receita completa em `references/receita-de-detalhe.md`.

## Uso

```html
<script src="detalhes.js"></script>
```
```js
const D = Detalhes({ luz: -1, seed: 3 });               // luz: -1 vem da esquerda (padrão), 1 da direita; sombra: false = objeto na mão
s += D.paoFrances(540, 1100, 2.4, { mordida: true });   // (x, y da BASE, escala, opções)
s += D.geladeira(300, 1500, 1.2, { imas: true });
s += D.anfora(820, 1500, 1, { rotulo: 'MOLHO DE PEIXE' });   // etiqueta sempre em PORTUGUÊS
// tamanho real ao lado de um boneco de escala 0.62:
s += D.carrinhoMercado(700, 1700, D.escala('carrinhoMercado', 0.62));
```

- Origem de todo objeto = **centro da base, no chão** (`y` = linha do chão; o desenho sobe com y negativo).
- `seed` muda os detalhes aleatórios (farinha, poros, rachaduras) mas o desenho fica **igual em todos
  os quadros** do vídeo. Use uma `seed` por cena.
- Cada chamada cria gradientes com id único, então dá para pôr o mesmo objeto várias vezes.
- Com `luz: 1` o desenho espelha (brilho e sombra trocam de lado), mas os textos (4°C, 12:00, etiqueta)
  continuam legíveis.

| Objeto | Opções | Detalhes que ele já tem |
|---|---|---|
| `paoFrances` | `cor`, `mordida`, `migalhas` | crosta em degradê, pestana aberta com miolo e poros, orelha da crosta, rachadinhas, bolhas, farinha, base assada, migalhas, mordida |
| `paoRomano` | `cor`, `queimado` | pão de Pompeia: 8 gomos estufados, anel no centro, marca do barbante na lateral, partes tostadas, farinha |
| `queijo` | `cor`, `fatia` | casca, massa com olhos (com sombra dentro), duas faces do corte (luz/sombra), fatia deitada |
| `uvas` | `cor`, `folha` | bagos com volume, brilho, pó fosco, cabinho, galho, folha com nervuras |
| `peixe` | `cor` | costas escuras → barriga clara, escamas, linha lateral, guelra, olho com brilho, nadadeiras com raios |
| `anfora` | `cor`, `tipo` ('jarro' ou 'anfora'), `rotulo`, `escorrido` | anéis do torno, alças, boca escura, lasca na borda, escorrido, poros, etiqueta amarrada |
| `moeda` | `cor` | espessura, serrilha, borda dupla, pérolas, perfil em relevo com coroa de louros, desgaste, brilho |
| `geladeira` | `cor`, `imas` | lateral em sombra, portas com fresta e borracha, puxadores de metal com apoios e sombra, painel 4°C, plaquinha, grade, pés, reflexo, bilhete, desenho de criança, ímãs |
| `carrinhoMercado` | `corAlca` | grade de arame com brilho, aro em tubo, lado de trás (profundidade), cadeirinha, alça de plástico, bandeja, rodízios com garfo e cubo, para-choque |
| `microondas` | `cor`, `hora` | vidro com tela de furinhos, prato e caneca dentro, reflexo, puxador, visor, teclado, botão iniciar, ventilação, pés |
| `fogao` | `cor`, `aceso` | 4 bocas com trempe e queimador, espelho, botões com marcador, forno com grade e brilho do fogo, puxador, gaveta |
| `tv` | `ligada` | moldura, tela com reflexo (ou paisagem ligada), LED, lateral fina, pé |
| `celular` | `cor` | moldura, botões laterais, câmera, barra de status, ícones de app, dock, reflexo |
| `liquidificador` | `cor`, `suco` | base com botões e seletor, copo de vidro com medidas, alça, tampa, lâminas, suco com bolhas |

| `pacoteArroz` | `cor`, `nome`, `peso` | plástico em pé, emenda soldada com serrilha e furinho, faixa do rótulo, janela com grãos, selo do peso, vincos |
| `pacoteFeijao` | `cor`, `nome`, `peso` | plástico transparente com feijão carioca rajado, rótulo, emenda serrilhada, brilho do plástico |
| `bandejaOvos` | `cor`, `ovo`, `faltando` | papelão moldado 2 × 6, ovos com brilho e pintinhas, divisórias, sombra dentro da bandeja |
| `sacoPao` | `paes` (1–3) | papel pardo com dobra na boca, vincos, mancha de gordura, pães franceses saindo |

| `tigela` | `cor`, `colher`, `vapor` | tigela de barro com cevada e feijão, anéis do torno, colher de pau, vapor |
| `copo` | `cor`, `cinza` | copo de barro com água acinzentada e flocos de cinza |
| `capacete` | `cor` | capacete de secutor: casco liso, crista baixa, dois furinhos, aba, rebites, amassadinhos |
| `rudis` / `gladio` | `rot` | espada de treino de madeira (veios, cabo amarrado) / espada curta de ferro (para a mão) |
| `escudo` | `cor`, `cor2` | escudo curvo com borda de metal, faixas e umbo de bronze (para a mão) |
| `tridente` / `rede` | `abertura` | arma e rede do reciário (rede com malha e pesos de chumbo) |
| `corneta` | — | corneta romana (cornu) em G com travessa de madeira |
| `palma` | — | folha de palmeira do vencedor |
| `leao` / `urso` | `rugindo`, `cor` | feras de lado: juba em mechas, pelo em tufos, garras, boca aberta ao rugir |

`assets/vitrine.html` (e `vitrine.jpg`) mostra todos lado a lado.

`assets/vitrine2.html` mostra os objetos de gladiador / Coliseu.

## Regras (o que faz um objeto parecer caprichado)

1. **Objeto de verdade.** Reconhecível só pela silhueta, com a proporção real. Pense em como ele é
   construído de verdade: geladeira tem fresta entre as portas, borracha, dobradiça, pés, grade.
2. **Volume em 4 tons + brilho.** Luz de um lado só (a mesma da cena): lado claro, tom base, lado
   escuro e um escuro bem fundo nos cantos/encaixes. Um brilho (reflexo) do lado da luz; em superfície
   lisa e brilhante (esmalte, vidro, metal), faixas diagonais de reflexo.
3. **Peças com função.** Densidade vem de peças que pertencem ao objeto (puxador com apoio, parafuso,
   botão, rodinha com cubo, alça, tampa), nunca de rabisco. Toda peça encosta em outra peça.
4. **Material conta.** Pão = crosta em degradê + miolo claro + farinha. Metal = faixas claro/escuro ao
   longo do comprimento. Vidro = escuro com reflexo diagonal. Cerâmica = anéis do torno. Fruta = brilho
   pequeno e nítido + pó fosco.
5. **Sinais de uso e de história.** Mordida, migalhas, lasca, escorrido, bilhete na geladeira, desenho
   de criança — um ou dois por objeto, contando algo da cena.
6. **Textura termina numa borda ou some aos poucos.** Anéis, escamas e riscos não podem parar "no meio
   do nada" (regra da anatomy): recorte a textura na forma (`clipPath`) ou faça ela desbotar.
7. **Duas leituras.** De longe (celular) lê na hora pela forma e pela cor. De perto (zoom 4×) sempre
   tem alguma coisa para achar. Canto vazio e superfície lisa demais = trabalho inacabado.
8. **Sombra de contato** macia no chão, um pouco deslocada para o lado oposto da luz.
9. **Texto no objeto em português** (etiqueta, visor), pequeno, só quando ajuda (regra da `identidade-visual`).
10. **Destaque ≠ fundo.** Objeto em destaque usa esta skill; objeto pequeno no fundo da cena pode usar
    a versão simples da `objetos-de-cena` (não compete com o personagem).

## Criar um objeto novo
1. Liste as peças do objeto real (escreva antes de desenhar).
2. Desenhe a silhueta como um `path` e use `clip()` para recortar texturas e brilhos dentro dela.
3. Aplique tons com `lin()`/`rad()` e `tom(cor, ±k)`; brilhos com branco em opacidade baixa.
4. Peças por cima, contorno `#1D1D2B` (5 no contorno externo, 2–4 nas peças), sombra com `contato()`.
5. Ponha na tabela `REAL` (largura do desenho, largura real em metros) e na vitrine; renderize a
   vitrine e **olhe o PNG** de longe e de perto antes de usar no vídeo.

Novos (hoje): `revolver`, `peDeCabra`, `bicicleta`, `moto`.
Veículos têm **pontos de contato** (`DT.pontos`, `DT.ponto('moto', 'guidao', k)`): assento, pé/pedivela e guidão,
para a pose `montar` do boneco; rodas com classe `roda` e pedal com classe `pedivela` para girar (skill `fisica-de-cena`).
