# Capa oficial: Tijuca

![Capa completa](miudezas-tijuca.png)

`miudezas-tijuca.png`: PNG, 1672 × 941 pixels. Composição, sem recorte. Revisão pontual: removidas as janelas sobrepostas às portas das casas verde, laranja e amarela; as demais janelas permanecem.

## Elementos

Título Miudezas com iluminação pixelada; árvores enraizadas no solo; Cristo sutil no topo da montanha; Ritual do Vento com pequenas dobras sugeridas no alto das formas; bem-te-vi e nota musical; pipa na posição original com linha partindo de trás de uma casa.

## Inventário

Esta pasta contém um único recurso visual: [miudezas-tijuca.png](miudezas-tijuca.png), **PNG de 1672 × 941 pixels**, dimensão conferida no arquivo. É uma composição estática, não uma captura atual de partida nem uma folha de sprites.

## Integração

A função de abertura em [app.js](../../app.js) aponta diretamente para este PNG, com largura e altura declaradas. O [CSS](../../style.css) usa `object-fit: contain` para preservar a proporção. O título não é redesenhado por HTML. Há um `h1` exclusivo para leitura assistiva. Não substitua o arquivo por uma captura do navegador.

[Índice das artes](../README.md) · [Manual principal](../../../README.md)

### Porta da lojinha na capa

A entrada sob o toldo listrado usa verde discreto e maçaneta clara para se distinguir da fachada escura e da vitrine âmbar. A porta chega à calçada, sem parecer uma extensão solta da fachada. A revisão é apenas na imagem: proporção, controles, regras e dados dos jogos permanecem inalterados.

### Duas janelas na primeira casa laranja

A casa sob o bem-te-vi agora tem duas janelas largas, mantendo altura, tons escuros e iluminação clara do desenho original. A edição fica exclusivamente no retângulo `x=148..305, y=670..737` do PNG de 1672 × 941. Telhado, pássaro, porta, calçada e demais casas conservam todos os pixels originais. O PNG é a única cópia ativa da capa; os READMEs o referenciam diretamente.

A comparação com a arte do commit `c19148ec82b5b161dc409ca9205b98fa36ac0419` confirmou **zero pixels alterados fora da região** (1.562.608 pixels externos preservados). Para reproduzir, extraia a capa anterior com `git show` e execute `python3 scripts/verificar-janelas-capa.py antes.png dist/artes/capas/miudezas-tijuca.png` a partir da raiz; requer Pillow. A verificação compara RGBA decodificado, não os bytes comprimidos do PNG.
