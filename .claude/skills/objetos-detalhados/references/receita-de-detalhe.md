# Receita de detalhe (por objeto)

Adaptada de `anatomy` (wheresryan22/anatomy, MIT): "o objeto é a explicação; todo objeto é muito
detalhado; leia a coisa real; duas leituras (1× e 4×); detalhe com propósito, nunca ruído;
textura termina numa borda ou some; confira por último no zoom".

## Passo a passo
1. **Peças primeiro.** Antes de desenhar, liste as peças reais. Ex.: geladeira = corpo, lateral,
   porta do congelador, porta de baixo, fresta, borracha, 2 puxadores com apoios, painel, plaquinha,
   grade de ventilação, pés + história (ímãs, bilhete, desenho).
2. **Silhueta** num `path` só (vira `clipPath` para texturas e brilhos não vazarem).
3. **Tons** (luz da esquerda por padrão):
   | Parte | Tom |
   |---|---|
   | lado da luz / topo | base + 0,3 a 0,6 |
   | face principal | base |
   | lado oposto à luz | base − 0,2 a − 0,35 |
   | cantos, frestas, buracos, base assada | base − 0,5 a − 0,65 |
   | brilho/reflexo | branco, opacidade 0,1–0,45 |
4. **Material:**
   - pão: crosta (degradê de cima dourado a baixo marrom), corte com miolo claro e poros, orelha
     escura, farinha (pontinhos brancos), bolhas, rachadinhas, migalhas;
   - metal: faixas claro/escuro (`metal()`), apoios escuros nas pontas, sombra do puxador na porta;
   - vidro: escuro + 1 ou 2 faixas diagonais brancas; o que está atrás aparece fraco;
   - cerâmica: degradê de torno, anéis que somem nas bordas, poros, escorrido, lasca;
   - fruta: degradê redondo, brilho pequeno e nítido, pó fosco, cabinho;
   - peixe: costas escuras, barriga clara, escamas em fileiras recortadas no corpo.
5. **Detalhes de história:** 1–2 por objeto (mordida, bilhete, ímã, lasca, migalha, etiqueta).
6. **Contorno:** externo 5, peças 2–4, detalhes finos sem contorno.
7. **Sombra de contato:** elipse com degradê radial (`contato()`), deslocada para o lado da sombra.
8. **Conferir:** renderize a vitrine, olhe o PNG inteiro (lê de longe?) e um recorte ampliado
   (tem o que achar? alguma textura parando no meio? algo vazando da silhueta?).

## Erros que já aconteceram (não repetir)
- Pestana do pão desenhada no alto demais: ficou escondida na borda. O corte tem que ficar **dentro**
  da silhueta, um pouco abaixo do topo, para o miolo aparecer.
- Mordida feita com círculo branco: aparece branco sobre fundo colorido. Use `mask` (o fundo aparece
  de verdade) e desenhe a borda de miolo dentro do recorte.
- Contorno da lateral do pão romano fechando com `Z` por cima do topo: risco atravessando o pão.
  Desenhe o contorno da lateral antes do topo.
- Etiqueta com texto maior que o papel: calcule a largura pelo número de letras.
- Fatia de queijo deitada em cima da roda: objetos auxiliares ficam ao lado, no chão, sem se cruzar.
