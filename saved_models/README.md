# Modelos guardados

Podés guardar el último modelo entrenado de dos maneras:

1. **Desde el navegador (recomendado)**  
   En [train.html](../train.html) hacé clic en **Guardar modelo**. El modelo se guarda en IndexedDB y podés verlo en acción en [play-ia.html](../play-ia.html) sin copiar archivos.

2. **Archivos en este directorio**  
   Si al guardar se descargan `model.json` y `dino-ai-model.weights.bin`, copialos a esta carpeta (`saved_models/`). Así play-ia también puede cargar el modelo desde aquí (por ejemplo si abrís el proyecto en otro navegador o dispositivo).

Nombres esperados:
- `model.json`
- `dino-ai-model.weights.bin` (o el nombre que indique `model.json`)
