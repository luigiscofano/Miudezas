# Aplicação jogável

Esta é a raiz que o servidor entrega ao navegador. Para executar a partir desta pasta, rode `python3 -m http.server 8000 --bind 127.0.0.1` e abra http://localhost:8000. Os arquivos JavaScript são módulos ES nativos.

| Arquivo | Leia quando precisar de… |
|---|---|
| [index.html](index.html) | Entrada do aplicativo, metadados, favicon, regiões de tela e rodapé. |
| [style.css](style.css) | Paleta, fonte, janela, estados de foco, galeria e adaptação a telas estreitas ou baixas. |
| [app.js](app.js) | Navegação, avanço e retomada da volta, pausa, eventos de entrada e animação. |
| [catalogo.js](catalogo.js) | Ordem dos jogos, IDs, regras, controles, nomes de nível e cores de palco. |
| [progresso.js](progresso.js) | Migração da volta antiga por IDs, sem trocar resultados entre jogos. |
| [interface.js](interface.js) | Ícones da barra, texto seguro para HTML e funções de armazenamento. |
| [quintal.js](quintal.js) | Chuva, maré, fios do bem-te-vi e pipa. |
| [esquina.js](esquina.js) | Sintonia, chapa e caminhos do caracol. |
| [varanda.js](varanda.js) | Bote, bolinha e sequências luminosas. |
| [pracinha.js](pracinha.js) | Peteca e sombra do gato. |
| [arte/](arte/README.md) | Imagens do menu e fonte local. |

Uma fábrica recebe o nível de 1 a 3 e uma API com callbacks de som e conclusão. Ela devolve controles, atualização, desenho e indicador. A interface central transforma eventos de teclado e toque no mesmo vocabulário. Para uma alteração de regra, revise a fábrica e o texto correspondente no catálogo. Para uma alteração de arte, confira a miniatura e o desenho da partida separadamente.

[Manual completo do projeto](../README.md)

