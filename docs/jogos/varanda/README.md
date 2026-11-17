# Varanda: luz, bolinha e memória

Implementação: [`dist/varanda.js`](../../../dist/varanda.js). Os modos respeitam o desenho em pixels e os controles anteriores.

| Jogo | Modos | Justificativa |
| --- | --- | --- |
| Luz de Varanda | Dificuldades autorais | A derrota existente é por prazo. Retirar o prazo não produz derrota natural; adicionar vidas arbitrárias mudaria a regra. Sem Parar não é oferecido. |
| Bolinha de Gude | Dificuldades autorais e Caminho Novo | Percurso completo, buraco e até três petelecos; outra fase pode ser gerada após a conclusão. |
| Pisca no Mato | Dificuldades autorais e Sem Parar | A memória cresce uma piscada por rodada e errar encerra naturalmente a partida. |

## Pisca no Mato: Sem Parar

Pontuação: tamanho da **maior sequência concluída**, não respostas de uma sequência incompleta. Não há meta final nem cronômetro de encerramento. Superar recorde não encerra a partida. A duração das piscadas continua legível, sem aceleração ilimitada. Clique/toque à esquerda/direita ou use as setas correspondentes. O gerenciador central registra `score()` no histórico separado do jogo e backup.

As dificuldades clássicas mantêm três, quatro e cinco piscadas. Foi declarado o desenho do vagalume: anteriormente o renderizador referenciava variável inexistente.

## Bolinha de Gude: Caminho Novo

`criarTerrenoGude(seed)` usa um gerador determinístico. A semente reconstrói alvo, pedras e certificado de solução com até três petelecos. As fases autorais não mudam. O gerenciador deve conservar a semente ao tentar novamente e fornecer outra somente ao pedir nova fase.

O certificado não é apenas conectividade: `validarTerrenoGude()` instancia **o mesmo jogo**, pressiona e solta controles públicos e executa a física real, incluindo alcance carregado, desaceleração, ricochetes, colisões e raio do buraco. Verifica 30, 60 e 120 atualizações/s e oito combinações de erro de ±15 ms ao soltar os três gestos. Geração limitada a 32 tentativas, seguida de percurso seguro também validado. Se até ele falhar, lança erro em vez de apresentar mapa sem certificado.

O trajeto de referência contorna pedras em três segmentos. O jogador pode encontrar outra solução; não há autopiloto. A variedade limita-se deliberadamente a esta família de trajetos validáveis. A prova garante a existência de uma sequência executável, não a vitória com qualquer força ou caminho.

### Controles

No teclado, mantenha uma seta e solte para dar força. No toque/mouse, arraste a partir da bolinha no sentido contrário e solte. Os trajetos gerados têm arrastos de referência inteiramente dentro do tabuleiro 96 × 96. O tamanho visual do canvas não altera coordenadas lógicas.

## Verificações

```sh
node --test tests/varanda-modos.test.mjs
```

- 200 sementes, reconstrução idêntica e mais de 190 layouts distintos;
- validação pelo motor real com três frequências e perturbações de tempo;
- 200 certificados repetidos por arrasto/toque, sem sair do canvas;
- Pisca ultrapassa 12 rodadas sem vitória artificial e mantém último resultado completo ao errar;
- metas clássicas e alvos autorais preservados;
- renderizadores exercitados com contexto instrumentado.

Testes automatizados não substituem inspeção visual em navegador nem teste físico em celular. Persistência e backup pertencem ao gerenciador central, sem alteração de esquema neste módulo.
