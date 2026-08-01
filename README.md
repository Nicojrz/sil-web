# SIL (web)

Webapp local que simula la futura app Android: un copiloto que ayuda a servidores públicos y
productores agrícolas hablantes de lenguas indígenas (náhuatl, maya, tsotsil) a comunicarse
durante trámites como *Fertilizantes para el Bienestar*, usando **Gemma 4** para traducir,
mantener el contexto y simplificar el lenguaje burocrático.

> Este MVP corre en dos servicios locales (backend FastAPI + frontend estático sobre Tomcat)
> que se comunican por HTTP. La versión final ejecutará Gemma 4 directamente en el celular vía
> LiteRT-LM, sin backend ni nube.

---

## Requisitos previos

### 1. Python (backend)
- **Python 3.11 o superior**
- `pip` actualizado
- (Recomendado) `venv` o `virtualenv` para aislar dependencias

### 2. Java + Apache Tomcat (frontend)
- **JDK 17 o superior** (requerido por Tomcat)
- **Apache Tomcat 10.x** — para servir los archivos estáticos (`index.html`, `app.js`, `styles.css`)
  simulando el comportamiento de la futura app móvil.
  - Alternativa más ligera si no quieres instalar Tomcat: cualquier servidor estático
    (`python -m http.server`, `live-server` de Node, etc.). Tomcat se usa aquí porque así se
    definió en el prototipo del hackday.

### 3. Acceso al modelo Gemma 4
Necesitas una forma de invocar Gemma 4 desde el backend. Dos opciones típicas:

- **Opción A — Local (recomendado para simular offline):**
  Instalar [Ollama](https://ollama.com) y descargar un modelo Gemma:
  ```bash
  ollama pull gemma
  ```
  El backend llamará a Ollama en `http://localhost:11434`.

- **Opción B — API en la nube (más rápido de probar, pero requiere internet y API key):**
  Crear una cuenta en [Google AI Studio](https://aistudio.google.com) y generar una API key
  para usar Gemma/Gemini. Guardarla como variable de entorno (ver abajo).

> Nota: la elección de proveedor debe quedar aislada en `backend/app/core/gemma_client.py`
> (ver `agents.md`), así que puedes usar cualquiera de las dos sin afectar el resto del código.

### 4. Git (opcional, para clonar el repositorio)

---

## Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd <nombre-del-repositorio>
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Dependencias mínimas esperadas en `requirements.txt`:
```
fastapi
uvicorn[standard]
pydantic
python-dotenv
httpx
```
(Agrega `google-generativeai` u otro SDK si usas la Opción B de la sección anterior.)

### 3. Variables de entorno
Copia el archivo de ejemplo y complétalo:
```bash
cp .env.example .env
```
Variables típicas:
```
GEMMA_PROVIDER=ollama          # "ollama" o "cloud"
GEMMA_MODEL=gemma2             # nombre del modelo local
GEMMA_API_KEY=                 # solo si usas la Opción B (API en la nube)
BACKEND_PORT=8000
```

### 4. Frontend (Tomcat)
1. Descarga e instala [Apache Tomcat](https://tomcat.apache.org/download-10.cgi).
2. Copia el contenido de la carpeta `frontend/` dentro de
   `<tomcat>/webapps/copiloto/` (o el nombre de app que prefieras).
3. Verifica en `frontend/app.js` que la URL del backend apunte a
   `http://localhost:8000` (o el puerto que configures).

---

## Ejecución

### 1. Levantar el modelo (si usas Ollama)
```bash
ollama serve
```
(en otra terminal, deja este proceso corriendo)

### 2. Levantar el backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
Verifica que funciona entrando a: `http://localhost:8000/api/health`

### 3. Levantar el frontend
```bash
cd <tomcat>/bin
./startup.sh        # En Windows: startup.bat
```
Abre en el navegador: `http://localhost:8080/copiloto/`

---

## Flujo de prueba rápido

1. Abre el frontend en el navegador.
2. Escribe (o pega) un mensaje simulando lo que diría el productor.
3. El frontend lo envía al backend (`POST /api/chat`).
4. El backend arma el contexto, llama a Gemma 4 y responde con:
   - la traducción/interpretación,
   - instrucciones simples para el funcionario.
5. Al terminar el trámite, cierra la sesión desde la interfaz para que el backend
   borre el historial en memoria (nada se guarda en disco).

---

## Privacidad

- Ninguna conversación, nombre o documento se almacena de forma persistente.
- El historial vive solo en memoria mientras dura la sesión del trámite.
- Si usas la Opción B (API en la nube), ten en cuenta que los datos sí viajan a un servicio
  externo — esto es aceptable únicamente para pruebas del hackday, no para el uso real en campo,
  que debe ser 100% on-device.

---

## Problemas comunes

| Problema                                   | Posible causa / solución                                   |
|--------------------------------------------|--------------------------------------------------------------|
| `Connection refused` al llamar a Gemma      | ¿Está corriendo `ollama serve`? ¿Puerto correcto en `.env`?  |
| CORS bloqueado en el navegador              | Habilitar CORS en FastAPI (`fastapi.middleware.cors`) para el origen de Tomcat (`localhost:8080`). |
| Tomcat no sirve los archivos                | Confirma que copiaste `frontend/` a `webapps/<app>/` y reiniciaste Tomcat. |
| Respuestas muy lentas                       | El modelo local puede ser pesado para tu equipo; prueba con una versión más pequeña de Gemma. |

---

## Próximos pasos (fuera de este MVP)

- Migrar a app Android nativa con **LiteRT-LM** + **Gemma 4 E2B IT** on-device.
- Agregar reconocimiento y síntesis de voz 100% locales.
- Pruebas de campo con hablantes de náhuatl, maya y tsotsil.

Para más detalle sobre arquitectura y convenciones de código, consulta [`agents.md`](./agents.md).