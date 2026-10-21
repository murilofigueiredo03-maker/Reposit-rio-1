---
name: sons-de-ambiente
description: Coloca som de ambiente e efeitos sonoros nos vídeos e deixa a narração alta e clara. Gera (por síntese, sem internet) uma biblioteca de ambientes em loop — quarto, rua, mercado com multidão (walla em latim), praça com fonte, latrina, escada, noite com grilos, incêndio, fuga com coração batendo, amanhecer com pássaros — e efeitos (passos em pedra/madeira, moedas, splash, baque, fogo acendendo, respiração), usa sons de interface (pop, whoosh, impacto, chime) para os textos, e mistura tudo a partir de uma "partitura" JSON com ducking (ambiente baixa quando a voz fala) e volume final de redes sociais (-10 LUFS). Use sempre que um vídeo tiver narração/áudio, quando pedirem som ambiente, efeitos, trilha de fundo, "som de rua", "barulho de fogo", ou quando a narração estiver baixa.
---

# sons-de-ambiente — o lugar também se ouve

Fluxo em 3 passos, **depois** de renderizar o vídeo (o vídeo pode ser renderizado com a voz
crua; o áudio final é trocado no fim, sem renderizar de novo).

## 1. Narração alta e clara (masterização)
Padrão do usuário: voz em **-10 LUFS** (alto, de vídeo viral), pico máximo -1 dB.
```bash
CH="highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,equalizer=f=3000:t=q:w=1.2:g=3,equalizer=f=200:t=q:w=1:g=-2"
# passada 1 (medir) e passada 2 (aplicar) do loudnorm:
ffmpeg -i fala.mp3 -af "$CH,loudnorm=I=-10:TP=-1:LRA=7:print_format=json" -f null -
ffmpeg -i fala.mp3 -af "$CH,loudnorm=I=-10:TP=-1:LRA=7:measured_I=..:measured_TP=..:measured_LRA=..:measured_thresh=..:offset=..:linear=true" -ar 48000 fala_master.wav
```
Corta grave inútil (<80 Hz), comprime levemente (sobe as partes fracas), realça presença
(3 kHz = voz "salta" no celular) e normaliza. Só subir o ganho não funciona: o pico já encosta no máximo.

## 2. Biblioteca de sons
```bash
python3 scripts/sintetizar.py --saida biblioteca/roma --voz vozes_latim.wav --seed 7
python3 scripts/sintetizar.py --saida biblioteca/coliseu --voz vozes_coliseu.wav --seed 11 --conjunto coliseu
```
- `--voz`: vozes para a multidão (*walla*). Gere frases na língua/época com o TTS do
  HyperFrames (`npx hyperframes tts "..." --voice pm_alex|pm_santa|pf_dora`), várias vozes
  concatenadas. O script pica, muda o tom, inverte e sobrepõe até virar burburinho sem palavras.
- `biblioteca/roma/` já pronta (MP3).
- `biblioteca/coliseu/` já pronta: cela (gotas + multidão abafada), subsolo, túnel (coração), arena
  (multidão gigante), fim de tarde; efeitos: rugido de leão e de urso, corneta romana, clang (tridente
  no escudo), portão de ferro, areia caindo, respiração dentro do capacete, grito da multidão, passos na areia. `biblioteca/ui/`: pop, whoosh, impacto, chime, riser,
  sparkle (Pixabay, uso livre — ver CREDITS.md), vindos da skill `media-use`.
- Sons gravados reais (opcional, melhor qualidade): a skill `media-use` busca no Openverse
  (precisa liberar `api.openverse.org` na rede do ambiente) ou a skill `sound-effects` da
  ElevenLabs (precisa de chave). Coloque os arquivos na biblioteca com o mesmo padrão de nome.

## 3. Partitura + mixagem
```bash
python3 scripts/misturar.py partitura-sons.json --saida mix.wav --video video.mp4 --video-saida video_final.mp4
python3 scripts/misturar.py partitura-sons.json --saida so_amb.wav --so-ambiente   # medir equilíbrio
```
Formato da partitura: ver o cabeçalho de `scripts/misturar.py` (ambientes em loop com fade e
automação de volume, efeitos pontuais, sequências de passos, ducking, volume final).

## Regras de sound design
0. **Pedido do usuário: som ambiente com ênfase.** Ambiente+efeitos só ~5–7 dB abaixo da voz
   (`--so-ambiente` ≈ -17 LUFS com voz em -10), e **todo objeto que aparece fazendo algo tem som
   próprio**: espada caindo (`sfx_espada_madeira`, com quiques), tigela/copo na mesa (`sfx_ceramica`),
   beber (`sfx_goles`), capacete (`sfx_capacete`), corrente (`sfx_corrente`), corpo caindo
   (`sfx_queda_areia`), rede (`sfx_rede_cai`), tocha estalando (`amb_tocha`).
1. **Um ambiente por cena**, trocando com crossfade curto (0,3–0,6 s) junto com o corte de imagem.
   Cartões/telas de texto: ambiente quase mudo + whoosh/impacto.
2. **Equilíbrio**: ambiente+efeitos ~8–12 dB abaixo da voz no geral (`--so-ambiente` ≈ -18 a
   -22 LUFS com voz em -10). Ducking de ~6 dB quando a voz fala.
3. **Passos sincronizados** com o andar do boneco: intervalo = duração da ação ÷ número de
   passos (motor `movimento-humano`: passos = distância ÷ passo; contato no início da ação).
   Pedra para rua, madeira para escada; correndo = mais alto e mais rápido.
4. **Todo texto que "pula" na tela tem som**: pop (etiquetas), whoosh (entrada de faixa/cartão),
   impacto grave (carimbos, palavras de impacto), chime (conquista/final).
5. **Ação vista = som**: balde caindo, splash, moeda, fogo acendendo — no quadro exato.
6. **Emoção também no som** (acompanha o roteiro de cores da `paleta-de-epoca`): tensão = sons
   graves e coração; perigo = fogo + gritos; alívio = pássaros e silêncio.
7. Não usar música com letra sob narração; se usar trilha, abaixo do ambiente e com ducking.

## Conjunto "hoje" (`sintetizar.py --conjunto hoje`)
Ambientes: cidade em caos, sala, tensão, natureza, estrada, noite fria, banheiro. Efeitos: gemidos
de zumbi (1–4), tiro, clique vazio, moto, toc-toc, tique/taque (contagem regressiva), porta rangendo,
morte, goles, queda, passos na rua, fogo acendendo.
**Quiz com contagem regressiva**: tique/taque em cada segundo, um "riser" no último, som de morte na
palavra "morreu" e chime em "sobreviveu".

## Conjunto "escola" (`sintetizar.py --conjunto escola --voz fala.mp3`)
Série "O garoto do tênis laranja". Ambientes: pátio (crianças + pássaros), corredor, refeitório (falatório agudo +
talheres), quarto à noite. Efeitos: risadas da turma, risada do Caio, bandeja de metal caindo, tropeço, rangido do
tênis, celular vibrando, notificação, suco espirrando, passos no piso da escola. O falatório usa a própria narração
picada, com tom mais agudo (vozes de criança), sem palavras entendíveis.
