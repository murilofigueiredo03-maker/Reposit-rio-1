---
name: fisica-de-cena
description: Faz a cena obedecer às leis da física e do corpo humano nos vídeos de bonecos 2D — chão em perspectiva com FAIXAS de profundidade (calçada do fundo, rua, calçada da frente) onde todo mundo pisa, tamanho pela distância (regra do horizonte), quem está mais perto passa na frente, personagens alternando faixas e atravessando a rua; poses de contato corretas (sentado em moto/bicicleta/carro com quadril no banco, pés na pedaleira ou no pedal girando, mãos no guidão ou volante; sentado sempre em algo; segurar objeto com a mão no cabo), rodas girando conforme a distância, e textos dentro de telas, placas e TVs que SEMPRE cabem (fonte de telejornal Anton). Use sempre que um vídeo tiver personagem andando na rua, veículo, alguém sentado, segurando ou carregando algo, TV/celular/placa com texto, ou quando o usuário reclamar que algo está "flutuando", "de pé na moto", "sentado no ar", "andando fora do chão", "texto maior que a TV" ou pedir "física", "profundidade", "perspectiva", "mais realista". Trabalha junto com movimento-humano (pose 'montar'), cenario-ilustrado (rua com faixas, carro em camadas, telaNoticia), objetos-detalhados (pontos de contato dos veículos) e identidade-visual.
---

# fisica-de-cena — tudo pisa no chão, tudo encosta onde deve

Pedido do usuário (vídeo do apocalipse zumbi): "se atente às leis da física… o zumbi tem que andar no chão…
alternar os lugares (rua, calçada)… a letra estava maior que a TV… na moto ele está de pé, tem que estar
sentado, segurando na moto". Regras tiradas das skills achadas com a find-skills e adaptadas ao nosso motor:
**pose-library-design** (calesthio/openmontage: poses como dados, preparação → ação → pausa → acomodação),
**parallax-depth-systems** (avnehsbhatia/ultraui: velocidade/tamanho pela distância numa conta, não no chute),
**animation-principles** (iart-ai: peso, arcos, "desenho sólido" = respeitar o espaço 3D) e
**directing-stickman-videos** (kaomei: no vertical, encenar em profundidade; todo objeto tem "dono" — onde
começa, quem pega, onde termina; nada atravessa nada).

## 1. Chão com profundidade (`assets/palco.js`)
```js
const FAIXAS = { calcadaFundo: 1330, rua: 1500, calcadaFrente: 1720 };   // y do PÉ em cada faixa
const palco = Palco({ horizonte: 760, yRef: 1720, kRef: 0.6, faixas: FAIXAS });
fundo.innerHTML = Z.rua({ chao: 1250, faixas: FAIXAS });                 // cidade.js desenha as 3 faixas
const k = palco.k(palco.y('rua'));                                       // escala de quem anda na rua
const z = new Boneco(g, { escala: k, ... }); z.base(0, 6, 'andar', { de: [100, 1500], ate: [700, 1500], passo: 70 * k });
palco.ator(g, { y: 1500 });                                              // entra na ordem de pintura
palco.atravessar(g, z, [[0.5, 'calcadaFundo'], [5.5, 'calcadaFrente']]); // atravessa a rua (escala muda junto)
// no __seek:  palco.seek(t);
```
- **Regra do horizonte**: o tamanho é proporcional à distância do pé até a linha do horizonte
  (`k = kRef · (y − horizonte) / (yRef − horizonte)`). Nunca escolher escala no olho.
- **Todo pé pisa numa faixa**: `y` do pé = `palco.y(faixa)`. Nada de boneco "solto" no meio do asfalto e da
  calçada ao mesmo tempo, nem pé abaixo/acima do chão.
- **Alternar faixas** quando há vários personagens (um na calçada do fundo, outro na rua, outro na frente) —
  dá profundidade e ninguém fica tampado. Protagonista de preferência na faixa da frente.
- **Quem está mais perto passa na frente** (`palco.seek` reordena pelo y do pé, a cada quadro).
- Passo proporcional à escala (`passo: 70 * k` para zumbi, `120 * k` andando normal).

## 2. Corpo e contato (pose certa para cada lugar)
Cada pose tem **pontos de contato**: as partes do corpo que encostam em algo e não podem flutuar nem atravessar.

| Situação | Contatos obrigatórios | Como fazer |
|---|---|---|
| Em pé / andando | sola dos pés no chão da faixa | `parado` / `andar` com `y` da faixa |
| Sentado em cadeira, banco, sofá | quadril no assento, pés no chão | `sentar` com `y` = altura do assento e `chao`; **sempre desenhar o assento** |
| Moto | quadril no banco, pés na pedaleira, mãos no guidão, tronco inclinado para a frente | `montar` + `DT.ponto('moto', …)` |
| Bicicleta | quadril no selim, pés nos pedais **girando** (opostos), mãos no guidão | `montar` com `pedivela` + `palco.pedivela` |
| Carro (motorista) | quadril no banco da frente, pé no pedal, mãos no volante, cabeça no vidro da frente | `Z.carro(..., {camada:'fundo'})` → boneco `montar` com `Z.carro.pontos` → `camada:'frente'` |
| Segurando objeto | mão no cabo/alça; o objeto anda com a mão | `braco(..., 'alcancar', { alvo })` ou objeto preso a `b.mao(lado)` |
| Carregando peso | tronco inclina para o lado oposto ao peso, passos menores | `inclina` + `passo` menor |
| Deitado | corpo inteiro apoiado no chão/cama | `deitado` com `y` da superfície |

```js
const KM = 0.8;                                   // escala do desenho da moto
motoG.innerHTML = DT.moto(0, 0, KM);              // grupo da moto: origem = chão no meio
const b = new Boneco(gDentroDaMoto, { escala: 0.6, figurino: HEROI });
b.base(t0, t1, 'montar', { assento: DT.ponto('moto', 'assento', KM), pe: DT.ponto('moto', 'pe', KM),
                           guidao: DT.ponto('moto', 'guidao', KM), chao: 0 });
// bicicleta: pedivela: { ...DT.ponto('bicicleta', 'pedivela', KB), rpm: 70 }  e  palco.pedivela(bikeG, 70, 0, t0, t)
```
- A pose `montar` calcula sozinha quanto o tronco inclina para a mão alcançar o guidão (sem esticar o braço
  além do comprimento real). Joelho sempre dobrado para a frente; nunca "de pé" no veículo.
- **Veículo andando = rodas girando** pela distância: `palco.girarRodas(grupo, distancia / k)`.
- **Escala real entre pessoa e objeto**: roda de bicicleta ≈ 40% da altura da pessoa; banco da moto na altura
  do quadril; carro ≈ 2,6× a altura da pessoa de comprimento.
- **Peso e tempo** (animation-principles): preparação antes de pular/arremessar, pausa curta no fim do gesto,
  objetos caem acelerando e quicam pouco; ninguém para ou começa a andar "do nada".
- **Dono do objeto** (directing-stickman-videos): todo objeto tem lugar de início, quem pega e onde termina;
  não some, não aparece do nada, não atravessa corpo nem parede.

## 3. Texto dentro da cena (TV, celular, placa)
- Texto de tela é da **cena**, não da marca: fonte **Anton** (estreita, de telejornal) — `identidade-visual/assets/fontes/anton.woff2`.
- **Sempre cabe**: `Z.textoCaber(texto, cx, cy, largura, altura)` estima o tamanho; depois que as fontes
  carregarem, `Palco.caberTextos(svg)` mede de verdade e encolhe o que passar (`document.fonts.ready.then(...)`).
- TV de notícia pronta: `Z.sala({ tv: 'noticia', manchete: 'ATAQUES ZUMBIS NA CIDADE' })` ou
  `Z.telaNoticia(x, y, w, h, manchete)` — selo AO VIVO, faixa URGENTE, manchete e letreiro, tudo dentro da tela.
- Etiqueta grande da marca (Luckiest Guy) **não vai por cima da TV**: se precisar reforçar a manchete, ponha
  acima/abaixo da TV, sem cobrir a tela.

## Verificar
`assets/demo.html` mostra tudo (rua com 3 faixas e zumbi atravessando, moto, bicicleta, carro, TV):
`node ../edit/scripts/render.mjs assets/demo.html x.mp4 --frames 1,5,8,12,16,20 --outdir prev`.
Em cada quadro confira: pé na linha da faixa? quem está na frente é maior e está por cima? quadril no banco,
mãos no guidão/volante, pés na pedaleira/pedal? texto inteiro dentro da tela?
