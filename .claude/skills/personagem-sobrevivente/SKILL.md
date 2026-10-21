---
name: personagem-sobrevivente
description: O SOBREVIVENTE — personagem principal OFICIAL dos vídeos do usuário (stickman cartoon 2D). Identidade fixa e obrigatória em toda cena — cabeça grande, redonda e branca; cabelo preto curto estilo militar, espetado e inclinado para um lado; olhos pretos ovais; sobrancelhas expressivas; camiseta branca simples de manga curta; calça cargo preta com bolso lateral; tênis laranja de sola branca; CACHECOL LARANJA com pontas esvoaçando; MOCHILA PRETA pequena com detalhes laranja; luvas pretas. Já pronto no motor de bonecos como figurino 'sobrevivente'. Use SEMPRE que um vídeo, cena, thumbnail ou imagem tiver o protagonista/personagem principal, quando o usuário disser "Sobrevivente", "nosso personagem", "o personagem principal", ou pedir para criar/animar o herói. Trabalha com movimento-humano (poses), figurino, fisica-de-cena e identidade-visual.
---

# personagem-sobrevivente — o protagonista oficial

Ficha oficial enviada pelo usuário: `assets/ficha-oficial.png` (vistas, expressões, poses, detalhes, o que usar e
o que não usar). Como ele fica no nosso motor: `assets/ficha-no-motor.png` (gerada por `assets/teste.html`).

**Regra absoluta**: o Sobrevivente é um personagem FIXO — reconhecível em qualquer cena, ângulo, emoção ou ação.
Ele substitui o antigo protagonista careca com a roupa da marca (o preset `marca` continua existindo, mas o
personagem principal agora é o Sobrevivente). Ele é o mesmo em qualquer época: não troca de roupa para "ficar de época".

## Como usar no motor
```js
const heroi = new Boneco(g, { escala: k, figurino: 'sobrevivente' });
// ou com ajustes pontuais (raros): { figurino: { preset: 'sobrevivente', ... } }
```
O figurino `sobrevivente` (em `movimento-humano/assets/boneco.js`) já traz tudo:
| Peça | Como está no motor |
|---|---|
| Cabeça | grande, redonda, branca, contorno preto; **sem bochecha rosada** (`semBochecha`) |
| Cabelo | `cabelo: 'militar'` — preto, curto, só no alto da cabeça, fios em ponta inclinados para um lado; gira com a cabeça |
| Rosto | olhos pretos ovais + sobrancelhas pretas (expressões do motor) |
| Camiseta | branca, manga curta, sem estampa |
| Calça | cargo preta (`#26262B`) com **bolso lateral** na coxa (`cargo: true`) |
| Tênis | laranja `#FF7A00`, sola branca, detalhe preto |
| Cachecol | `extras: ['cachecol']` — laranja, nó no pescoço, 2 pontas largas que **esvoaçam para trás**; balançam mais correndo, pulando ou de moto/bicicleta |
| Mochila | `extras: ['mochila']` — preta, pequena, detalhes laranja; **de perfil aparece inteira** nas costas, **de frente só as alças** no peito |
| Mãos | `luvas: true` — pretas |

## Expressões (ficha → motor)
neutro → `normal` · feliz → `alegre`/`feliz` · surpreso → `surpreso` · assustado → `medo`/`susto` ·
bravo → `bravo` · triste → `triste` · confuso → `confuso` · determinado → `determinado` ·
pensativo → `pensando` + braço `queixo`.

## Poses (ficha → motor)
andando `andar` · correndo `correr` · pulando `pular` · apontando braço `apontar` · explorando `andar` + objeto na
mão · subindo `subir` (ou pé em pedra) · agachado `agachar` · sentado `sentar` (**sempre em algo**: pedra, banco,
tronco — skill fisica-de-cena) · comemorando braços `cima` + `alegre` · moto/bicicleta/carro `montar`.

## O que NÃO fazer (da ficha)
Outras cores de roupa · roupas complexas · chapéu ou boné · óculos · barba ou bigode · armaduras · muitas estampas ·
estilo realista ou 3D · tirar o cachecol ou a mochila · trocar o tênis laranja · mãos sem luva.
Exceção só se o usuário pedir explicitamente (ex.: "ele vira zumbi" → pele verde, mas mantendo cabelo, cachecol e mochila).

## Conferir em toda cena
Cabelo militar? Cabeça branca redonda? Camiseta branca? Calça escura? Tênis laranja? Cachecol laranja? Mochila preta
(visível de perfil)? Luvas pretas? Se faltar algo, a cena está errada.

## Mãos, gestos e movimentos (guia oficial: `assets/guia-maos-oficial.png`)
As mãos são **luvas pretas cartoon** (4 dedos + polegar, sem unha, sem pele), um pouco maiores que a bolinha
padrão, e mudam de forma conforme o gesto. No motor (`luvas: true` no figurino), a forma sai do gesto do braço
automaticamente, ou é escolhida à mão com `b.formaMao(lado, t0, t1, forma)`. Teste: `assets/maos.html` →
`assets/maos-no-motor.png`.

| Forma (`formaMao`) | Uso |
|---|---|
| `aberta` | cumprimentar, explicar, apresentar, surpresa |
| `punho` | correr (automático), determinação, comemorar, raiva |
| `apontar` | indicar caminho/objeto/perigo (dedo na direção do braço) |
| `indicador` / `n1` | destacar uma ideia, "número 1" |
| `joinha` / `baixo` | aprovação / erro |
| `paz`, `ok` | vitória, despedida / confirmação |
| `n1`…`n5` | contagem com os dedos |
| `palma` | parar, alertar, perigo |
| `relaxada` | parado, braços soltos (padrão) |

| Movimento (`braco(lado, t0, t1, gesto)`) | Mão automática | Quando usar na narração |
|---|---|---|
| `explicar` (ambos) | aberta | explicar, comparar (um braço para cada lado) |
| `parar` | palma | indicar perigo, "pare" |
| `levantar` | indicador | chamar atenção, pedir a palavra, descoberta |
| `apontar` | apontar | mostrar lugar/objeto/perigo |
| `queixo` | punho | pensativo, dúvida |
| `cintura` (ambos) | punho | confiança, impaciência |
| `cruzar` (ambos) | punho | sério, desconfiado, irritado |
| `joinha` | joinha | concluir, concordar |
| `chamar` | aberta | "vem cá" |
| `cabeca` | aberta | decepcionado, "ai não" |
| `contar` + `{ n: 3 }` | n3 | contar itens/testes |
| `acenar` | aberta | olá, tchau |
| `cima` (ambos) | punho | comemorar |
| `encolher` (ambos) | aberta | dúvida (ombros erguidos, palmas para cima) |
| `desespero` | aberta | assustado (mãos à frente, proteção) |

Emoção e mão andam juntas: feliz = braços abertos/levantados; assustado = mãos abertas à frente; bravo = punhos;
triste = braços caídos; confuso = palmas para cima; pensativo = mão no queixo; determinado = punhos; decepcionado =
mão na cabeça. Segurando objeto: a mão fica em `punho` em volta do cabo (o objeto segue `b.mao(lado)`); objeto grande = as duas mãos.
Nunca: mão de pele, luva colorida, dedos a mais, mão gigante, mão solta do braço.
