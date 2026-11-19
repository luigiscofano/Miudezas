"""Confere a edição localizada da capa: python3 scripts/verificar-janelas-capa.py antes.png depois.png.

Requer Pillow. A região inclui somente a faixa das janelas da primeira casa laranja.
"""
import sys
from PIL import Image

antes, depois = (Image.open(caminho).convert('RGBA') for caminho in sys.argv[1:])
assert antes.size == depois.size == (1672, 941), 'As dimensões da composição mudaram.'
regiao = (148, 670, 306, 738)  # Limites direito e inferior exclusivos.
modificados = 0
for y in range(antes.height):
    for x in range(antes.width):
        if antes.getpixel((x, y)) == depois.getpixel((x, y)):
            continue
        assert regiao[0] <= x < regiao[2] and regiao[1] <= y < regiao[3], f'Pixel externo alterado: {x}, {y}'
        modificados += 1
assert modificados, 'Nenhum pixel foi editado.'
print(f'{modificados} pixels alterados dentro da região; zero alterações externas.')
