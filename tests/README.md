# Testes de comportamento e compatibilidade

Execute na raiz com Node moderno, sem pacotes externos:

```sh
node --test tests/*.test.mjs
```

| Arquivo | Cobertura |
|---|---|
| `navegacao.test.mjs` | Galeria, catálogo ativo, migração por IDs, sequência e resumo das dez paradas em navegador simulado. |
| `backup.test.mjs` | Exportação/importação, validação de entradas e compatibilidade do progresso. |
| `capa.test.mjs` | Dimensões do PNG, proporção preservada e título acessível sem sobreposição. |
| `pao.test.mjs` | Três dificuldades em 30/60/120 atualizações/s, identidades, utensílios, toque, reposições, troca, erro único, derrota e reinício. |
| `esquina-modos.test.mjs` | Metas separadas e vitória imediata; 20 minutos de Sem Parar; 1.000 sementes de Rastro resolvidas pelos controles reais. |
| `quintal-modos.test.mjs` | Quarta/quinta gotas, alagamento, limites, Pipa contínua e colisão, Último Fio contínuo, 300 sementes de Maré com estados de maré. |
| `varanda-modos.test.mjs` | Pisca contínuo, pontuação por sequência completa, Gude com 200 sementes validadas por controles e física. |
| `pracinha.test.mjs` | Regressões do código legado e integridade do catálogo. Peteca/Gato não voltam ao aplicativo por esses testes. |

Os geradores são testados pela execução da solução no jogo, não só por verificar conectividade abstrata. Sementes determinísticas permitem reproduzir uma falha. Testes de partidas longas conferem continuidade e encerramento único; não equivalem a um benchmark em todos os celulares.

## Verificação manual complementar

- Abrir o catálogo e completar a volta sem entradas para jogos removidos.
- Usar teclado e toque, incluindo escolha de utensílio e arrasto da bolinha.
- Conferir pausa ao ocultar aba, reinício, resultado, recorde e recarregamento.
- Repetir fase gerada e depois pedir outra, observando a semente.
- Exportar e importar backup antigo e novo sem trocar resultados entre jogos.
- Inspecionar colisões/desenhos, legibilidade do HUD e controles em tela estreita.

A suíte automatizada não substitui inspeção visual, teste em aparelho real nem verificação da versão publicada. Registre no PR quais verificações foram de fato executadas.

[Manual principal](../README.md)
