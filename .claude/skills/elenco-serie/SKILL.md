---
name: elenco-serie
description: Elenco FIXO da série "O garoto do tênis laranja" (5 episódios) — Léo (o protagonista, = personagem Sobrevivente), Caio (o valentão alto, loiro, moletom vermelho), Duda (cabelo cacheado, camiseta verde, sempre com o celular filmando), Pedrão (grandão, moletom cinza largo, boné azul virado para trás), a menina do fundo (cabelo longo castanho, tiara amarela, camiseta roxa) e os alunos de fundo. Cada um tem figurino pronto no motor de bonecos e regras de escala, para aparecerem IGUAIS em todos os episódios. Use SEMPRE que fizer qualquer episódio da série, quando a narração citar Léo, Caio, Duda, Pedrão, "a menina", a escola, o refeitório, ou quando o usuário pedir para manter os personagens iguais entre episódios.
---

# elenco-serie — "O garoto do tênis laranja"

Pedido do usuário: "todos os personagens que você criar, assim como o protagonista, têm que manter a mesma
aparência nos próximos episódios". Aqui fica a ficha de cada um; nunca mude cor, cabelo ou roupa entre episódios.
Imagens de referência: `assets/trio.png` (Duda, Caio, Pedrão) e `assets/menina.png`.

| Personagem | Figurino no motor | Aparência fixa | Escala (× a do Léo) | Jeito |
|---|---|---|---|---|
| **Léo** (narrador) | `'sobrevivente'` | o Sobrevivente: cabelo militar, camiseta branca, calça cargo preta, **tênis laranja** (presente do pai), cachecol laranja, mochila preta, luvas pretas | 1,00 | tímido, cabeça baixa, quer passar despercebido |
| **Caio** | `'caio'` | **loiro** (cabelo curto `#D8A73A`), **moletom vermelho** `#B8322A`, calça jeans, tênis branco | **1,12** (o garoto alto) | valentão; ri, aponta, cruza os braços; apelidou o Léo de "cenourinha" |
| **Duda** | `'duda'` | **cabelo cacheado** escuro, **camiseta verde** `#2E9E5A`, calça bege, tênis preto | 0,97 | sempre com o **celular na mão filmando** (braço `contar` + mão `punho`, celular preso à mão) |
| **Pedrão** | `'pedrao'` | **boné azul virado para trás**, **moletom cinza largo** (`moletomLargo`), calça preta, tênis azul | 1,04 | grandão, ri alto, mãos na cintura |
| **A menina do fundo** | `'menina'` | **cabelo longo castanho**, **tiara amarela**, **camiseta roxa** `#7A4AA8`, calça jeans clara, tênis branco | 0,95 | a única que não ri; séria, preocupada (nome ainda não revelado — quando a narração disser, registrar aqui) |
| Alunos de fundo | `{ preset: 'aluno', cor, cabelo, ... }` | cores variadas **sem laranja** (o laranja é só do Léo) | 0,85–1,05 | riem, comem, passam no corredor |

## Regras de cena da série
- **Enquadramento grande** (como gravado no celular): Léo em plano inteiro com escala ≈ 1,45 (≈ 810 px), pés em
  y ≈ 1400, **legenda embaixo** em y ≈ 1500 (acima dos botões do app); títulos e palavras de impacto no alto (y 150–450).
- Câmera "na mão" (balanço leve) e aproximações nas reações (zoom no tênis, na mancha, no rosto da menina).
- Lugares fixos da série (`cenario-ilustrado/assets/escola.js`): fachada da ESCOLA ESTADUAL, corredor de armários
  azuis, refeitório (azulejo verde-água, cardápio, balcão de inox), quarto do Léo à noite (parede azul, lua, abajur).
- Física (skill `fisica-de-cena`): sentado sempre em banco/cama/chão; bandeja nas duas mãos; celular preso à mão.
- Episódio 1 (`videos/serie-ep1`): fila do refeitório, "OLHA O CENOURINHA!", Caio estica o pé, bandeja voa,
  suco na camisa, a menina não ri, à noite o vídeo do Duda (@duda.zuera) com 2 mil visualizações.
