---
name: identidade-visual
description: Identidade visual dos vídeos do usuário — cores LARANJA (#FF7A00) e PRETO (#111111) com branco de apoio, e a fonte Luckiest Guy (divertida, cartunesca, lê bem no celular). Define e entrega prontos os estilos de texto na tela: palavra de impacto (FOGO!), frase de apoio (E VOCÊ?), faixa de título/lugar (ROMA ANTIGA), etiqueta (3º ANDAR), carimbo (TODO DIA!), balão de fala, cartão de capítulo/desafio e tela final com chamada para comentar. Use SEMPRE que um vídeo, animação, thumbnail, slide ou imagem tiver texto na tela, título, número, chamada ou cartão — inclusive junto das skills "edit", "movimento-humano", "cenario-ilustrado" e "hyperframes".
---

# identidade-visual — laranja, preto e Luckiest Guy

Escolhas do usuário: **laranja e preto** como cores de referência e a fonte **Luckiest Guy**
(opção 1 da comparação). Tudo que for texto na tela segue este padrão, em qualquer vídeo.

## Cores
| Papel | Cor | Uso |
|---|---|---|
| Laranja | `#FF7A00` | texto de destaque, fundos de cartão, carimbos, fios |
| Preto | `#111111` | contornos, faixas, pílulas, sombras duras |
| Branco | `#FFFFFF` | frases de apoio e títulos sobre laranja (sempre com contorno preto) |
| Laranja escuro | `#C95A00` | detalhes/sombras dentro de áreas laranja |

Não usar vermelho, amarelo ou verde em **texto** (no cenário pode). Exceção: nenhuma — até "ECA!"
fica laranja; a emoção vem do rosto do boneco.

## Fonte
`assets/fontes/luckiest-guy.woff2` (licença Apache 2.0, ao lado). Tem acentos e "º".
Copie para o projeto e declare:
```html
<style>
  @font-face { font-family: 'Luckiest Guy'; src: url(fontes/luckiest-guy.woff2); }
  text:not([font-family]) { font-family: 'Luckiest Guy', 'DejaVu Sans', sans-serif; }
</style>
```
O seletor `:not([font-family])` mantém textos que fazem parte do cenário (inscrição de
templo, pichação, placa) com a fonte própria deles.

## Estilos de texto (`assets/marca.js`)
| Função | Quando | Visual |
|---|---|---|
| `Marca.impacto(x, y, 'FOGO!')` | palavra-chave forte, susto, ação | laranja, contorno preto grosso, sombra dura, inclinado −4° |
| `Marca.apoio(x, y, 'E VOCÊ?')` | frase curta, grito secundário | branco com contorno preto |
| `Marca.faixa(x, y, 'ROMA ANTIGA')` | lugar, época, título de cena | faixa preta, texto laranja, fio laranja embaixo |
| `Marca.etiqueta(x, y, '3º ANDAR')` | rótulo de objeto/lugar pequeno | pílula preta, texto laranja |
| `Marca.carimbo(x, y, 'TODO DIA!')` | conclusão, ironia | bloco laranja, texto preto, inclinado |
| `Marca.balao(x, y, 'CUIDADO!')` | fala de alguém fora de cena | balão branco, texto laranja |
| `Marca.cartao({ id, numero: '1º', titulo: 'A FOME', icone })` | capítulo/desafio | tela laranja, número em círculo preto, título branco |
| `Marca.final({ linhas, destaque, chamada })` | pergunta final + CTA | tela preta, texto branco, destaque laranja, botão laranja |

## Regras
- **Pouco texto**: palavras de impacto e rótulos. A fala entra só como **legenda dinâmica**
  (skill `legenda-dinamica`: 1–3 palavras por vez, palavra falada em laranja, faixa baixa e pequena) —
  o usuário pediu esse formato; nada de bloco de texto.
- **Tudo em PORTUGUÊS** — qualquer palavra que aparece na tela (etiquetas, placas, pichações no muro,
  inscrições em templo/estátua/estandarte, nomes de objetos) é escrita em português, mesmo em cena
  de outra época. Nada de latim ou outra língua (ex.: TERSORIUM → ESPONJA, GARUM → MOLHO DE PEIXE,
  THERMOPOLIVM → LANCHONETE, SPQR → ROMA, CAVE CANEM → CUIDADO: CÃO BRAVO).
- **Tudo em MAIÚSCULAS**, no máximo 3–4 palavras por elemento.
- **Nada de letras espaçadas** (tracking largo) nem linhas de texto decorativo embaixo de títulos.
- Texto sempre com **contorno preto** ou sobre **fundo preto/laranja** — nunca solto sobre o cenário.
- Tamanhos no vídeo vertical 1080×1920: impacto 130–210, faixa 80–100, apoio 60–80, etiqueta 40–50.
- Zona segura do TikTok/Reels: evite os 220 px de cima e os 420 px de baixo, e a faixa de 140 px
  da direita (botões).
- Entrada com "pop" (escala 0,2 → 1, `back.out`) e saída rápida; pode pulsar de leve enquanto fica na tela.

**Texto que faz parte da cena** (TV, celular, placa, jornal): fonte **Anton** (`assets/fontes/anton.woff2`,
estilo telejornal), sempre do tamanho da tela onde está (skill `fisica-de-cena`). A Luckiest Guy continua
sendo a fonte da marca para palavras de impacto, cartões e legenda.
