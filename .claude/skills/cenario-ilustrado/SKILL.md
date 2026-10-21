---
name: cenario-ilustrado
description: Monta cenários ilustrados em SVG com acabamento de ilustração (não "cru") para vídeos e animações — arquitetura histórica (Roma Antiga pronta: insula, telhas, colunas dórica/jônica/coríntia, templo, Coliseu, aqueduto, thermopolium, fonte), luz de um lado com 3 tons por volume, sombras projetadas, perspectiva atmosférica em camadas, paletas por hora do dia (dia, tarde, amanhecer, noite, interior), texturas com variação (reboco gasto com tijolo aparecendo, rachaduras, sujeira, calçamento irregular, telha sobreposta), detalhes de vida (vasos, varal, toldo, hera, pombos, ânforas, lamparinas, pichação), grão e vinheta. Use sempre que for desenhar ou melhorar o fundo/cenário de um vídeo ou cena (skills "edit", "movimento-humano", "hyperframes"), quando o usuário disser que o cenário está "simples", "cru", "sem detalhe", "chapado", ou pedir elementos de uma época/lugar.
---

# cenario-ilustrado — fundos com cara de ilustração

`assets/cenario.js` é uma caixa de peças: cada função devolve SVG pronto, já com luz, sombra,
textura e desgaste coerentes entre si. Determinístico (mesma `seed` → mesmo desenho), então
funciona no render quadro a quadro da skill `edit`.

## As 7 regras que tiram o cenário do "cru"

1. **Uma luz só.** Escolha de onde vem o sol (`luz: 1` direita, `-1` esquerda) e mantenha em
   tudo: lado iluminado mais claro e quente, lado oposto mais escuro e frio. Todo volume tem
   **3 tons** (luz, base, sombra), nunca uma cor chapada.
2. **Sombra projetada** no chão para o lado oposto à luz, e **sombra de contato** embaixo de
   beirais, sacadas, peitoris, toldos (faixa escura logo abaixo).
3. **Profundidade em camadas**: fundo (silhueta da cidade, morros) → meio (prédios) → frente
   (chão, objetos). Quanto mais longe, **mais clara, menos saturada e mais azulada/da cor da névoa**.
4. **Textura com variação**: nada de padrão perfeito. Pedras de tamanhos diferentes, tom
   variando, reboco com manchas, tijolo aparecendo onde o reboco caiu, rachaduras, sujeira subindo do chão.
5. **Sinais de vida**: vasos com flores, varal, toldo, pichação, pombos, ânforas na porta,
   plantas subindo na parede. Uma ou duas coisas por plano — não encha tudo.
6. **Hora do dia define a paleta inteira** (`hora`): céu, névoa, cor da luz e da sombra mudam
   juntos. Noite = janelas acesas e brilho quente; amanhecer = laranja e sombras longas.
7. **Acabamento**: `atmosfera()` no fim (grão leve, vinheta, raios de luz). É o que dá unidade.

## Uso

```html
<script src="cenario.js"></script>
```
```js
const C = Cenario({ seed: 8, luz: 1, hora: 'dia', prefixo: 'rua' });  // prefixo único por cena
let s = `<defs>${C.defs()}</defs>`;            // gradientes, grão, vinheta desta paleta
s += C.ceu({ astroX: 900, astroY: 230, nuvens: 3 });
s += C.distante({ y: 760, tipo: 'roma', profundidade: 0.15 });   // silhueta longe (enevoada)
s += C.distante({ y: 900, tipo: 'roma', profundidade: 0.45 });   // silhueta mais perto
s += C.insula({ x: 40, base: 1700, w: 600, top: 330, andares: 4, varal: true, grafite: 'CAVE CANEM' });
s += C.calcada({ y: 1700, h: 220 }) + C.sombraChao(40, 600, 1700, 100);
s += C.pombo(470, 1750) + C.toldo(740, 1440, 300);
s += C.atmosfera({ grao: 0.3, raios: true });
grupoDaCena.innerHTML = s;
```

**Peças:** `ceu`, `nuvem`, `distante` (`'roma'`/`'colinas'`), `parede`, `janela`, `vaso`,
`telhado`, `insula` (`pular: ['andar-coluna']`, `luzes` acesas à noite, `sacada`, `varal`,
`grafite`), `sacada`, `varal`, `grafite`, `anfora`, `coluna` (`ordem: 'dorica'|'jonica'|'corintia'`),
`templo`, `aqueduto`, `coliseu`, `calcada`, `piso`, `cipreste`, `pinheiro`, `hera`, `pombo`,
`toldo`, `lamparina`, `sombraChao`, `atmosfera`. Utilitários: `C.tom(cor, ±k)`, `C.mix(a, b, u)`.
Horas: `dia`, `tarde`, `amanhecer`, `noite`, `interior`.

- A mesma rua em outra hora: gere de novo com outra `hora` (ex.: dia e noite do mesmo lugar)
  — a geometria se mantém se a `seed` for a mesma.
- Para o personagem ficar **atrás** de algo (janela, balcão, banco), desenhe esse pedaço num
  grupo de primeiro plano acima dos atores. Prefira um objeto que faça sentido (floreira,
  balcão, mureta) a um retângulo da cor da parede.
- Elementos animados (fogo, fumaça, objetos que caem) ficam fora das peças, em grupos com id.

## Coliseu / arena (`assets/arena.js`)
`Arena(C)` (carregue depois de `cenario.js`) traz as peças do anfiteatro: `blocos` (parede de pedra do
subsolo com juntas, trincas, umidade e musgo), `tetoFrestas` (tábuas da arena vistas por baixo, com
raios de luz e id para animar), `grade` (ferro com rebites e ferrugem), `arco` (aduelas e pedra-chave,
fundo escuro ou de luz), `areia`, `podio` (muro com faixa vermelha e rede de proteção),
`arquibancada` (fileiras de gente em `<g class="torcida">` para animar; `tam` aumenta as pessoas no
close), `vomitorio`, `velario` (toldo listrado) e `camarote` (do imperador). Usado em `videos/coliseu`.

## Texto no cenário = português

Placas, pichações, inscrições e letreiros do cenário são sempre escritos em **português**
(pedido do usuário), mesmo numa cena de Roma ou de outra época: `grafite: 'VIVA ROMA'`,
templo com `SENADO E POVO`, placa `LANCHONETE`. Nunca latim nem outra língua.

## Outras épocas

`references/epocas.md` lista o vocabulário visual por época (Roma, Egito, Grécia, Idade Média,
Brasil Colônia, Velho Oeste, anos 1920…). Para uma época nova, crie as peças que faltam
seguindo o mesmo padrão das funções existentes (luz, 3 tons, contorno #1D1D2B, textura
com `rnd`) e acrescente aqui.

## Verificar

Gere quadros de prévia e olhe: a luz vem do mesmo lado em tudo? O fundo está mais claro que a
frente? Há pelo menos 2 sinais de vida por cena? Algo ficou chapado (uma cor só num volume grande)?
`assets/demo-rua.html?hora=dia|tarde|amanhecer|noite` mostra uma rua romana completa.

## Hoje / cidade (`assets/cidade.js`)
`const cid = Cidade(C)` desenha cenários atuais no mesmo acabamento: `sala({tv:'noticia', porta:'trancada', noite})`,
`rua({caos, noite})` (prédios, carros batidos, fumaça), `carro(x, y, k, {cor, portaAberta, quebrado})`,
`banheiro({abandonado, tampaAberta})`, `lago({bacterias})`, `estrada({noite})`, `fachada({noite})`,
`noite()` e `fogueira(x, y, k)` (chamas com classe `chama` para animar). Usado no quiz do apocalipse zumbi.
- `rua({ faixas: { calcadaFundo, rua, calcadaFrente } })`: chão em profundidade com as 3 faixas onde os
  personagens pisam (use com `Palco` da skill `fisica-de-cena`).
- `carro(x, y, k, { camada: 'fundo' | 'frente' })`: carro em duas camadas para pôr o motorista dentro
  (banco e volante no fundo, porta e vidro na frente); `Z.carro.pontos` = assento, pé e volante.
- `sala({ tv: 'noticia', manchete })` e `telaNoticia(x, y, w, h, manchete)`: telejornal em fonte Anton que
  sempre cabe na TV; `textoCaber(txt, cx, cy, larg, alt)` para qualquer texto de tela/placa.

## Escola de hoje (`assets/escola.js`) — série "O garoto do tênis laranja"
`Escola(Cenario({ seed, luz: -1, hora: 'dia' | 'noite', prefixo }))`: `fachada` (prédio com volume, marquise, faixa
BEM-VINDOS que balança, mastro com bandeira, mural dos alunos, árvores em 3 tons, calçada gasta), `corredor`
(perspectiva de um ponto: armários, portas SALA 7/8, extintor, cartazes, luminárias e reflexo no granilite),
`refeitorio` (azulejo com rejunte, feixes de luz das janelas, relógio com ponteiro, cardápio, cartazes, balcão de
inox com cubas FUMEGANTES, lixeiras de reciclagem, planta), `quarto` (luar azul, cidade na janela, varal de
luzinhas, estante, troféu, pôster, caixa do tênis, mesa com abajur e a foto do pai), `cama`, `mesa`, `banco`,
`bandeja`, `arrozNoChao`, `telaCelular`. Classes animáveis: `.vapor`, `.ponteiro`, `.bandeira`, `.faixa-balanca`,
`.luzinha`, `.lampada`.

## Checklist de CENA PREENCHIDA (pedido do usuário: "o vídeo ficou simples demais")
Antes de renderizar, cada plano precisa ter:
1. **Luz única + 3 tons + sombra** (inclusive sombra de contato embaixo de cada personagem — o motor já desenha).
2. **3 camadas de profundidade**: fundo (névoa/arquitetura), meio (gente e móveis), frente (personagem principal) e,
   quando couber, **um elemento em primeiro plano desfocado** na borda (folhagem, coluna, quina de mesa).
3. **Vida no fundo**: pessoas fazendo coisas (comendo, conversando, servindo, passando) — nunca o fundo vazio.
4. **Objetos que contam a história** (3–7 por grupo) com sinais de uso; o objeto citado na fala em destaque.
5. **Algo se mexendo no cenário**: vapor, ponteiro, bandeira, luzes, cortina, fumaça.
6. **Cor da emoção** (`Paleta.grade`): rotina, nostalgia, tensão, alívio, mistério… mudando com a história.
7. **Acabamento**: `atmosfera()` (grão) + vinheta.
