# Motion de qualidade — guia prático (GSAP)

## Sumário
1. Tempos (em quadros)
2. Easings por situação
3. Os princípios que mais importam
4. Câmera e profundidade
5. Texto e motion graphics
6. Transições entre cenas
7. Checklist antes do render

## 1. Tempos (a 30 fps)
| Ação | Duração |
|---|---|
| piscada (fecha+abre) | 0.12s (4 quadros) |
| virar a cabeça | 0.25–0.4s |
| gesto de mão | 0.35–0.6s |
| passo de caminhada | 0.25–0.35s por passo (ciclo = 2 passos) |
| corrida | 0.15–0.2s por passo |
| pulo (agacha → ar → aterrissa) | 0.15 + 0.4 + 0.2s |
| entrada de título | 0.5–0.8s |
| segurar um texto para leitura | ~0.3s por palavra, mínimo 1.5s |
| pausa dramática | 0.4–0.8s de quase imobilidade |

Ritmo: alterne ações rápidas com momentos de pausa — tudo na mesma velocidade fica monótono.

## 2. Easings por situação
- **Entrar em cena / chegar a uma pose**: `power3.out`, `expo.out` (desacelera no fim).
- **Sair de cena**: `power2.in` (acelera saindo).
- **Mover de A para B dentro da cena**: `power2.inOut` / `sine.inOut`.
- **Parada com vida (overshoot)**: `back.out(1.4–2)`.
- **Mola / balanço / assentar**: `elastic.out(1, 0.35–0.5)` — use com parcimônia.
- **Ciclos (respirar, balançar, caminhar)**: `sine.inOut` com `yoyo`.
- **Movimento contínuo de câmera / nuvens / parallax**: `none` (linear) — único caso.
- Nunca use `linear` para partes do corpo: parece robô.

## 3. Princípios que mais importam
**Antecipação** — antes do movimento principal, um pequeno movimento oposto:
```js
tl.to(arm, { rotation: 6, duration: 0.15, ease: 'power1.in' })           // recua
  .to(arm, { rotation: -150, duration: 0.35, ease: 'back.out(1.6)' });   // ação
```
Pulo: agacha (`scaleY .85, scaleX 1.1`) antes de subir.

**Overlap e follow-through** — partes presas (antebraço, cabeça, cabelo, roupa, rabo) chegam
depois e passam um pouco do ponto:
```js
tl.to(arm,  { rotation: -150, duration: 0.35 }, t)
  .to(fore, { rotation: -10,  duration: 0.35 }, t + 0.05)   // atrasa 1–3 quadros
  .to(head, { rotation: 5, duration: 0.15 }, stop).to(head, { rotation: 0, duration: 0.6, ease: 'elastic.out(1,.4)' });
```
Use a posição relativa `"<0.05"` para defasar de forma legível.

**Squash & stretch** — conserve o volume: se `scaleY` diminui, `scaleX` aumenta
(`scaleY: .9, scaleX: 1.08`). Pivô na base (pés) para não "flutuar".

**Arcos** — membros giram em pivôs, então já fazem arcos; para objetos voando use
`MotionPathPlugin` (em `assets/MotionPathPlugin.min.js`, registrar com `gsap.registerPlugin`)
em vez de mover x e y em linha reta.

**Ação secundária** — enquanto fala: cabeça balança levemente, sobrancelhas sobem em
palavras fortes, mão gesticula. Enquanto espera: respiração e piscadas.

**Staging** — uma ação importante por vez; o olho do espectador segue o que se move mais.
Diminua o movimento do resto quando algo importante acontece.

**Poses-chave primeiro** — defina as poses principais (`gsap.set` em tempos marcados),
confira com `--frames`, e só depois refine os intermediários.

**Pesos diferentes** — objetos pesados: antecipação maior, movimento mais lento, parada
seca. Leves: rápidos, com mais overshoot e balanço.

## 4. Câmera e profundidade
- Push-in lento (`scale 1.08 → 1` ao longo da cena, `ease: none`) dá sensação cinematográfica.
- Parallax: camadas distantes movem menos que as próximas (fundo 0.2×, meio 0.5×, frente 1×).
- "Câmera seguindo personagem": mova o grupo de cenário no sentido oposto ao personagem.
- Shake de impacto: 4–6 quadros de `x/y` ±8px com `rough`/valores alternados, decaindo.
- Desfoque de profundidade: `filter="url(#soft)"` em camadas distantes (custa render).

## 5. Texto e motion graphics
- Divida o texto em palavras/letras (`<tspan>` ou `<span>`) e anime com `stagger: 0.03–0.06`.
- Entrada típica: `y: 40→0, opacity 0→1, ease power3.out`; saída mais rápida que a entrada.
- Contraste mínimo: texto branco sobre faixa escura semitransparente; tamanho ≥ 48px em 1080p.
- Safe area: mantenha texto a 5–8% das bordas; em vertical (Reels/TikTok) evite os 15%
  de baixo e a faixa direita (interface do app).
- Números contando: tweene um objeto `{v:0}` e escreva `Math.round(v)` no `onUpdate`
  — dentro da `tl`, então funciona no seek.

## 6. Transições entre cenas
Mantenha tudo numa página: cada cena num `<g class="scene">` e a transição na timeline.
- Corte seco: `tl.set(cenaA, {display:'none'}).set(cenaB, {display:''})`.
- Wipe: um retângulo colorido cruza a tela (`x: -1920 → 1920`), troca de cena no meio.
- Zoom-through: `scale` alto + `opacity` na cena que sai.
- Match cut: mesmo objeto/forma na mesma posição nas duas cenas.
Use `tl.addLabel('cena2')` para organizar e posicionar tweens por rótulo.

## 7. Checklist antes do render
- [ ] Quadros de prévia nos momentos-chave conferidos visualmente
- [ ] Nenhum `repeat: -1`, CSS animation, `Math.random` solto
- [ ] Personagem nunca 100% parado (respira, pisca)
- [ ] Toda ação grande tem antecipação; toda parada tem assentamento
- [ ] Texto legível e dentro da safe area
- [ ] Duração final coerente com a narração (+ ~1.5s de respiro no fim)
