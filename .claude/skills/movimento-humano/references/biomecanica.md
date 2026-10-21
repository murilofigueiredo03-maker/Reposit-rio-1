# Biomecânica para animação 2D — números de referência

Valores aproximados de marcha humana adulta, adaptados para stickman (não precisa ser realista,
mas a lógica do movimento sim). O motor `boneco.js` já usa estes números em `GAIT`.

## Proporções (boneco com altura ≈ 570)
| Parte | Medida | Observação |
|---|---|---|
| Cabeça (raio) | 62 | cabeça grande = simpático; humano real ≈ 1/8 da altura |
| Tronco (quadril→pescoço) | 190 | |
| Coxa / canela | 118 / 112 | perna ≈ 40% da altura |
| Braço / antebraço | 96 / 90 | mão chega no meio da coxa com o braço estendido |
| Pé | 44 | aponta para frente no perfil |
| Quadril em pé | 238 do chão | perna quase reta (joelho ~5°) |

## Caminhada (1 ciclo = 2 passos)
- **Ritmo**: ~1 a 1,2 s por ciclo (0,5–0,6 s por passo). Passo ≈ metade do comprimento da perna (no motor, 120 unidades).
- **Fases de cada perna**: apoio 60–62% (pé no chão) · balanço 38–40% (pé no ar).
  Há duplo apoio (os dois pés no chão) logo após cada contato.
- **Quatro poses-chave** (por passo): *contato* (calcanhar da frente toca, pernas mais abertas) →
  *descida* (peso cai, joelho da frente flexiona ~15°, quadril no ponto mais baixo) →
  *passagem* (pé de trás passa ao lado do de apoio, joelho do balanço ~60°, quadril no ponto
  mais alto) → *subida/impulso* (calcanhar de apoio sobe, ponta empurra).
- **Pé**: no contato a ponta está ~15–20° para cima; no impulso o calcanhar sobe até ~35–40°.
  Altura máxima do pé no balanço é pequena (~6% da perna) — gente não "marcha".
- **Quadril**: sobe e desce ~5 unidades (2 vezes por ciclo).
- **Braços**: balanço ±20° a partir do ombro, oposto à perna; cotovelo 10–25°.
- **Tronco**: inclinação ~3° à frente; cabeça estável (compensa o balanço).

## Corrida
- Apoio ~35–40% (há fase de voo, os dois pés no ar). Passo maior (~175).
- Joelho do balanço dobra muito (calcanhar perto do glúteo, 90–120°).
- Tronco ~10° à frente, braços com cotovelo ~90°, balanço ±35–40°.
- Pisa com o meio do pé (sem calcanhar marcado).

## Escada
- Subindo: tronco inclina ~9° à frente, joelho levanta mais (altura do degrau + folga),
  pé apoia inteiro no degrau. Descendo: pés tocam com a ponta primeiro, joelho amortece.
- Um passo por degrau; o pé cai no meio do degrau.

## Limites articulares (o motor respeita)
| Articulação | Faixa natural |
|---|---|
| Joelho | 0° (reto) a ~150° — só para trás |
| Cotovelo | 0° a ~150° — só para frente |
| Ombro | gira quase 360°, mas acima de ~170° parece deslocado |
| Tornozelo | ~20° para cima, ~40° para baixo |
| Tronco | ~15° para trás, ~90° para frente (agachar/pegar) |

## Sentar, levantar, pular
- **Sentar**: coxa horizontal, canela vertical, pés no chão um pouco à frente do joelho;
  tronco quase reto. Ao sentar o quadril desce e vai para trás.
- **Levantar do chão**: rola de lado / apoia, tronco sobe primeiro, depois as pernas estendem.
- **Pular**: antecipação (agacha ~40), impulso (estende tudo), voo, aterrissagem com
  amortecimento (joelhos flexionam de novo). Braços sobem no impulso.

## Gestos
- Acenar: braço acima do ombro (~145°), antebraço oscila ±25° a ~2,5 Hz.
- Encolher os ombros: braços ~40° para fora, antebraços para cima, palmas para cima.
- Pensar: mão no queixo, cotovelo apoiado/baixo, cabeça levemente inclinada.
- Nojo: mão tampa o nariz ou abana na frente do rosto; sobrancelhas franzidas.
- Apontar: braço reto, alinhado com o olhar.
