# Documentação de Miudezas

O catálogo ativo contém **dez jogos**, em duas páginas de até seis miniaturas. Peteca e Gato na Sombra estão fora da seleção, das partidas e da sequência. Recursos legados não representam conteúdo atualmente disponível.

## Guias

- [README principal](../README.md): identidade visual, catálogo, modos, arquitetura, dados e testes.
- [Publicação no GitHub Pages](github-pages.md): hospedagem, verificação e transferência de progresso.
- [Quintal](jogos/quintal/README.md): Goteira, Maré Miúda, Último Fio e Pipa.
- [Esquina](jogos/esquina/README.md): Rádio, Pão e Rastro.
- [Varanda](jogos/varanda/README.md): Luz, Três Petelecos e Pisca.
- [Dados, recordes e backup](dados/README.md): schema 2, seis recordes e compatibilidade com arquivos antigos.
- [Design e arte em código](design/README.md): inventário real de assets, sprites e aplicações.
- [Evolução visual](evolucao-visual.md): histórico das decisões aprovadas, separado do manual atual.
- [Testes](../tests/README.md): cobertura automática e roteiro manual.

## Referências visuais

![Capa Miudezas](../dist/artes/capas/miudezas-tijuca.png)

Esta é a arte aprovada, não uma captura da interface. Consulte [artes](../dist/artes/README.md) e [miniaturas](../dist/arte/README.md). Capturas antigas `inicio.jpg` e `pracinha.jpg` foram retiradas para não representar jogos indisponíveis. Novas capturas devem mostrar a versão efetivamente publicada, sem cursor e sem dados privados.

## Evolução dos modos e controles

Há seis modos Sem Parar: Goteira, Último Fio, Pipa, Pão, Pisca e Luz de Varanda. Na Luz, três botes errados encerram qualquer modo; só Sem Parar dispensa o prazo final. Maré, Rastro e Três Petelecos oferecem Caminho Novo com referência no Puxado, soluções verificadas e fallback limitado; os critérios específicos pertencem aos guias de cada módulo.

Rastro usa traçado a partir do caracol; Gude usa arrasto a partir da bola, sem lançar quando o gesto é cancelado. Teclado e botões permanecem como alternativa acessível. A captura de gestos fica no tabuleiro, sem bloquear a página. **Voltar às fases** na pausa mantém seleção e dados salvos. Os roteiros manuais distinguem testes simulados de testes em aparelhos físicos.

## Elementos dentro dos jogos

[Acervo de 47 famílias visuais](elementos-visuais/README.md): arquivos extraídos das partidas, separados dos ícones de seleção, com inventário, pranchas e explicação do método.
