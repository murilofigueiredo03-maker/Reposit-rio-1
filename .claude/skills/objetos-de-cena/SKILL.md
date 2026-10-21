---
name: objetos-de-cena
description: Enche a cena de objetos com sentido — de época (Roma Antiga: estátua, busto, mosaico, braseiro, triclínio, mesa, banco, balança, moedas, tábua de cera, pergaminho, louros, escudo, estandarte com ROMA, carroça, cesto de pão, vaso grego, obelisco, barril, baú, caixote, saco, tocha) e de hoje (celular, notebook, geladeira, TV, sofá, cadeira de escritório, carro, semáforo, mochila, xícara, garrafa, luminária, carrinho de mercado) — desenhados em SVG no mesmo estilo dos cenários, na escala real ao lado do boneco, e regras de "set dressing" (grupos que contam uma história, densidade por plano, desgaste de uso). Use sempre que uma cena parecer vazia ou genérica, quando a narração citar um objeto, para comparar época × hoje ("não tinha geladeira"), ou quando pedirem esculturas, móveis, utensílios, detalhes ou "deixar a cena mais rica". Trabalha com "cenario-ilustrado", "paleta-de-epoca" e "movimento-humano".
---

# objetos-de-cena — detalhes que contam a história

`assets/objetos.js` cria `Objetos(C)` a partir de um cenário (`cenario.js`), então cada objeto
herda a **luz**, a **hora** e os **materiais da época** da cena.

```html
<script src="paletas.js"></script><script src="cenario.js"></script><script src="objetos.js"></script>
```
```js
const C = Cenario({ epoca: 'roma', hora: 'dia', luz: 1, seed: 4 });
const O = Objetos(C);
s += O.estatua(160, 1300, 0.7);          // (x, y da base no chão, escala)
s += O.balanca(820, 1270, 0.55) + O.moedas(630, 1272, 0.5);
s += O.mosaico(40, 1730, 1000, 170);     // painel de chão: (x, y, largura, altura)
```

**Escala:** use a **mesma escala do boneco** da cena (`Boneco({ escala })`). O desenho já está
em tamanho real (boneco ≈ 1,75 m; 1 m = `O.metro(escala)` unidades). Objeto mais ao fundo =
escala menor e mais alto na tela.

`assets/catalogo.html` (e `catalogo.jpg`) mostra todos os objetos ao lado do boneco.

**Objeto em destaque (grande na tela, close, cartão de desafio, citado na narração)?** Use a skill
**`objetos-detalhados`** (`detalhes.js`): pão, queijo, uvas, peixe, jarro, moeda, geladeira, carrinho
de mercado, micro-ondas, fogão, TV, celular e liquidificador com muito mais detalhe. Esta skill aqui
fica para objetos de fundo e de apoio.

## Regras de composição (set dressing)
Adaptadas das skills `set-dressing` e `prop-artist` (arjun988/blender-skills, MIT):

1. **Cada grupo conta um momento.** Escolha a "batida" da história e ponha 3–7 objetos que
   a vendam: *refeição abandonada* (mesa, pão mordido, jarro tombado, banco afastado),
   *oficina* (bancada, ferramentas, serragem), *fuga apressada* (baú aberto, roupas caídas, tocha no chão).
2. **Densidade por plano:** perto da ação = poucos objetos e bem escolhidos (não competir com o
   personagem); meio = grupos de apoio; fundo = poucos, só silhueta. Deixe livre o caminho por
   onde o personagem anda.
3. **Escala real e silhueta legível:** o objeto tem que ser reconhecido só pela forma, no celular.
4. **Sinais de uso:** bordas gastas, sujeira no contato com o chão, objeto um pouco torto. Nada
   novinho e alinhado demais (a não ser que a cena peça: museu, loja).
5. **Narração manda:** se a fala cita um objeto ("pão duro", "jarro de barro", "esponja"),
   ele aparece e ganha destaque (pop + etiqueta da `identidade-visual`).
6. **Época × hoje:** para comparar, mostre o objeto atual riscado (como a geladeira com X) ao
   lado do equivalente da época.
7. **Coerência de época:** confira em `references/catalogo.md` se o objeto existia naquele tempo.

## Criar objetos novos
Siga o padrão das funções existentes: origem na base (centro, no chão), tamanho real em
unidades com `metro`, contorno `#1D1D2B`, uma face de sombra do lado oposto a `C.luz`
(use `caixa()` para volumes retos), cor dos materiais da época (`C.mat`) e sombra de contato
(`grupo()` já desenha). Acrescente ao catálogo de referências.
