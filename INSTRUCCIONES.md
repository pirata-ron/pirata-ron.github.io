# Cómo publicar el portal (Google Sheets + Apps Script)

## 1. Crear la hoja de cálculo
1. Entra a https://sheets.google.com y crea una hoja nueva.
2. Ponle nombre, por ejemplo: **Registro Pláticas Pirata y Ron 2026**.

## 2. Pegar el código
1. En la hoja, ve a **Extensiones → Apps Script**.
2. Borra lo que trae el archivo `Código.gs` y pega todo el contenido de **Code.gs**.
3. Da clic en **＋ (Agregar archivo) → HTML** y llámalo exactamente **Index** (sin .html).
4. Borra lo que trae y pega todo el contenido de **Index.html**.
5. Guarda (ícono de disco o Ctrl+S).

## 3. Preparar las hojas
1. Arriba, en el selector de funciones, elige **prepararHojas** y da clic en **Ejecutar**.
2. Google te pedirá permisos: **Revisar permisos → tu cuenta → Configuración avanzada → Ir a (proyecto) → Permitir**.
3. En tu hoja aparecerán 3 pestañas:
   - **Registros**: un renglón por alumno.
   - **Inscripciones**: un renglón por alumno y plática (sirve para pasar lista; filtra por "ID plática").
   - **Cupos**: cuántos inscritos y lugares disponibles tiene cada plática.

## 4. Publicar
1. Da clic en **Implementar → Nueva implementación**.
2. En el engrane, elige **Aplicación web**.
3. Configura:
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier usuario
4. Da clic en **Implementar** y copia la **URL de la aplicación web**. Ese es el link para los alumnos.

## 5. Si cambias algo después
**Implementar → Gestionar implementaciones → ✏️ Editar → Versión: Nueva versión → Implementar.**
Así el link sigue siendo el mismo.

## Para ajustar
En `Code.gs`, al inicio:
- `CUPO = 30`: lugares por plática.
- `MAX_POR_DIA = 3`: pláticas máximas por día.
- `PLATICAS`: horarios y títulos.

## Vista previa sin publicar
Abre **Index.html** con doble clic en tu computadora. Se ve con datos de ejemplo y no guarda nada.

## Notas
- No se puede registrar dos veces la misma matrícula ni el mismo correo.
- El cupo se revisa en el servidor al confirmar, así que nunca habrá más de 30 por plática aunque muchos se registren al mismo tiempo.
- Para borrar las pruebas antes de abrir el registro, elimina los renglones (no el encabezado) de **Registros** e **Inscripciones**.
