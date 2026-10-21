---
name: animacao-animal
description: Anima animais quadrúpedes 2D em SVG (leão, urso, cachorro, gato, cavalo) no mesmo estilo dos bonecos — com anatomia certa (pulso da pata da frente dobra para trás, joelho de trás para a frente, jarrete para trás), andaduras de verdade (andar em 4 tempos, trote em pares diagonais, galope com fase no ar), pulo com antecipação, sentar, deitar, rugir (boca abre, cabeça avança, juba balança), olhar e farejar, e "sinais de vida" (respiração, troca de peso, rabo e juba com atraso). Use sempre que um vídeo tiver animal se mexendo (fera na arena, cachorro na rua, cavalo puxando carroça, gato no telhado), quando a narração citar um animal, ou quando pedirem animal "mais vivo", "andando de verdade" ou "rugindo". Trabalha junto com "movimento-humano" (bonecos), "objetos-detalhados" (animais parados em destaque) e "sons-de-ambiente" (rugidos).
---

# animacao-animal — bicho que parece vivo

Pedido do usuário: animação de animais. Achados com a find-skills e adaptados ao nosso estilo:
- **naturalistic-motion** (dylantarre/animation-principles): ser vivo nunca fica parado — respira,
  troca o peso, pisca; partes moles (rabo, juba, orelha) chegam **depois** do corpo (follow-through);
  nada de simetria perfeita; antecipação antes de toda ação (o gato se encolhe antes de pular).
- **creature-artist** (arjun988/blender-skills, MIT): anatomia de quadrúpede — o "joelho" da frente é
  o **pulso** (dobra para trás), o cotovelo aponta para trás, a soldra (joelho de trás) dobra para a
  frente e o jarrete para trás; predador tem massa na frente (ombros), presa atrás (ancas).
- **creature-design** (omer-metin): andaduras — andar = um pé de cada vez; trote = pares diagonais;
  galope = pares da frente/de trás com fase no ar; o movimento conta a personalidade (confiante =
  passo lento e firme; nervoso = curto e rápido; agressivo = cabeça baixa, focado).

## Uso
```html
<script src="animal.js"></script>   <!-- precisa do filtro #outline na página (o mesmo dos bonecos) -->
```
```js
const leao = new Animal(document.querySelector('#atores'), { especie: 'leao', escala: 0.6, seed: 3 });
leao.base(0, 3, 'parado', { x: 300, y: 1700, dir: 1 });                   // respira, rabo, troca o peso
leao.base(3, 6, 'andar',  { de: [300, 1700], ate: [700, 1700] });         // trotar | correr: mesmo formato
leao.base(6, 7.5, 'pular', { de: [700, 1700], ate: [950, 1700], altura: 160 });
leao.base(7.5, 9, 'sentar', { x: 950, y: 1700, dir: 1 });                 // 'deitado' também
leao.base(9, 12, 'parado', { x: 950, y: 1700, vista: 'frente' });       // de frente para a câmera (parado ou sentado)
leao.cabeca(1.0, 2.4, { rugir: true });                                   // boca abre + cabeça avança + juba balança
leao.cabeca(4.0, 5.0, { baixar: 14, olhar: [6, 4] });                     // farejar o chão
// a cada quadro (dentro do __seek do vídeo):
leao.desenhar(t);
leao.boca()   // ponto da boca no mundo (para pôr "GRRR!", baba, fumaça…)
```
- `escala`: com 1, o leão tem ~260 unidades de altura no ombro. Use a mesma lógica de perspectiva
  dos bonecos (mais longe = menor e com os pés mais para cima).
- `dir`: 1 olha para a direita, -1 para a esquerda (em `andar/trotar/correr` sai do movimento).
- Transição de 0,3 s entre ações (`transicao` para mudar). O passo encaixa na distância: o pé no
  chão **não escorrega** (avança exatamente o que o corpo anda).
- `assets/demo.html` mostra tudo; `assets/retratos.html` (e `retratos.jpg`) mostra cada bicho de lado e de frente.

| Espécie | Jeito |
|---|---|
| `leao` | juba em mechas que balança (mais quando ruge), tufo no rabo, passo largo e confiante |
| `urso` | corcova no ombro, patas grossas com garras, rabo curtinho, passo pesado |
| `cachorro` | orelha caída, rabo para cima abanando |
| `gato` | magro, orelhas pontudas, listras, rabo comprido em S |
| `cavalo` | pernas longas com cascos, pescoço comprido, crina e rabo de pelo |
Cores: `new Animal(g, { especie: 'cachorro', cores: { cor: '#3A3A3A', longe: '#2A2A2A', barriga: '#8A8A8A' } })`.

## Regras
0. **Juba (e todo pelo grande) envolve a cabeça**: de lado, a juba aparece em volta do rosto (testa,
   nuca, bochecha, queixo) e desce cobrindo o pescoço e o peito do lado que a gente vê — não só atrás
   da cabeça; de frente, faz um círculo inteiro em volta da cara (pedido do usuário).
1. **Nunca parado**: em cena, todo animal tem pelo menos respiração + rabo (o `parado` já faz).
   Ponha olhares e farejadas (`cabeca`) a cada 2–4 s.
2. **Antecipação → ação → recuperação**: antes de rugir, a cabeça recua (o rugido já faz); antes
   de pular, agacha (o `pular` já faz); depois de correr, um passo ou dois antes de parar.
3. **Andadura pela velocidade**: devagar = `andar`; médio = `trotar`; fugindo/atacando = `correr`.
4. **Peso**: bicho grande (urso, cavalo) = movimentos mais lentos e passos mais longos; bicho pequeno
   (gato) = rápido. Não acelere um urso como um gato.
5. **Som junto**: rugido (`sfx_rugido_leao`, `sfx_rugido_urso` da `sons-de-ambiente`) no quadro em
   que a boca abre; passos em `andar/correr`.
6. **Animal parado em destaque** (cartão, close sem movimento): use `leao`/`urso` da
   `objetos-detalhados`, que têm mais detalhe de pelo.

## Criar uma espécie nova
Copie uma entrada de `ESPECIES` e ajuste: `comp` (ombro↔anca), `frente: [braço, antebraço]`,
`tras: [coxa, canela, pata]`, `peito/anca` (raios do corpo), `pescoco: [frente, altura]`, `cabeca`,
`focinho`, `orelha` (`redonda` | `pontuda` | `caida`), `cauda: { n, seg, w, sobe }`, extras
(`juba`, `crina`, `corcova`, `garras`, `listras`, `casco`). A altura de pé sai das pernas sozinha.
Teste no `demo.html` e olhe os quadros: pé no chão sem escorregar, joelhos dobrando para o lado certo.
