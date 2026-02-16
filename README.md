# Chrome Dyno AI

Juego simple en el navegador: un cuadrado que salta triángulos. Los triángulos aparecen en pantalla y hay que evitarlos saltando.

**Roadmap:**
- [x] Juego base (cuadrado + triángulos)
- [x] Integración de AI que aprende a jugar

## Cómo correr

Necesitás un servidor local (los módulos ES no funcionan con `file://`):

```bash
# Con Python 3
python3 -m http.server 8000

# O con npx
npx serve .
```

- **Jugar:** http://localhost:8000/index.html
- **Entrenar la IA:** http://localhost:8000/train.html

## Entrenamiento

Abrí `train.html` para ver la IA aprendiendo en vivo. Usa TensorFlow.js con REINFORCE (policy gradient). Al principio la IA actuará al azar; con los episodios debería empezar a saltar obstáculos. La pantalla muestra episodio actual, mejor score y score del episodio en curso.
