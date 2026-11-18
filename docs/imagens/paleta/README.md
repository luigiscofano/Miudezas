# Amostras da paleta da interface

As oito amostras originais de interface são cores reais de [dist/style.css](../../../dist/style.css), apresentadas junto aos códigos hexadecimais na seção **Paleta da interface** do [README principal](../../../README.md).

Cada bloco mede 72 × 24 pixels. O preenchimento representa a cor exata; o contorno neutro fino serve apenas para manter as cores claras visíveis no GitHub. A imagem não depende de serviços externos, não contém scripts e inclui título acessível. Os códigos e as descrições continuam disponíveis em texto na tabela.

## Fonte e manutenção

Tinta, Papel, Creme, Borda, Verde, Texto secundário e Ouro correspondem às variáveis `--ink`, `--paper`, `--cream`, `--edge`, `--green`, `--muted` e `--gold`. Área de trabalho corresponde a `background-color` de `.desktop`.

Ao alterar a paleta, confira os valores na folha de estilos e atualize os preenchimentos, títulos e códigos do README no mesmo PR. Não altere o CSS apenas para adequá-lo à documentação.

## Cores recorrentes dos jogos

Oito amostras adicionais representam cores com pelo menos três ocorrências literais nos módulos ativos `quintal.js`, `esquina.js` e `varanda.js`. Foram conferidos também a folha de estilos, o catálogo e o módulo de aves. O código legado `pracinha.js` não participou da seleção. As ocorrências foram normalizadas para maiúsculas, sem confundir tons diferentes.

A frequência de literais não mede área pintada, tempo de exposição nem importância de marca. A tabela do README principal informa a função real de cada tom; não afirma que todos os jogos compartilham essas cores. Foram selecionados oito exemplos para manter a leitura compacta, além das oito cores originais de interface.

Para manter essas amostras, confira os preenchimentos nas funções `draw` e nas paletas dos sprites dos módulos indicados. Preserve a distinção entre paleta estrutural da interface, cores recorrentes de desenho e cores de enquadramento do catálogo.
