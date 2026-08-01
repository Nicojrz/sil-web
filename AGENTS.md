# agents.md — Copiloto de IA para trámites agrícolas (Fertilizantes para el Bienestar)

Este archivo define el contexto, las convenciones y las reglas de trabajo para cualquier agente
(humano o IA) que vaya a codificar o extender el **backend** de este proyecto.

---

## 1. Resumen del proyecto

Aplicación que actúa como copiloto para servidores públicos durante trámites del programa
"Fertilizantes para el Bienestar", ayudando a comunicarse con productores agrícolas que hablan
principalmente una lengua indígena (náhuatl, maya o tsotsil) en lugar de español.

- **Objetivo final:** app Android 100% on-device, usando **LiteRT-LM** + **Gemma 4 E2B IT**,
  sin conexión a internet ni servicios en la nube.
- **Objetivo del hackday / MVP actual:** validar el flujo y la experiencia de usuario con una
  **webapp local** que simula la app móvil, antes de invertir en el desarrollo nativo Android.

El agente debe recordar en todo momento que el MVP es un **puente temporal**, no la arquitectura
final. Cualquier decisión de diseño debe dejar claro qué parte es "solo para el MVP" y qué parte
sobrevivirá a la migración a Android.

---

## 2. Alcance de este repositorio (backend)

El backend es responsable de:

1. Recibir el texto transcrito de lo que dice el productor (o el funcionario).
2. Mantener el **historial/contexto** de la conversación durante todo el trámite.
3. Construir el prompt / instrucciones de sistema para Gemma 4, incluyendo:
   - Traducción entre español y la lengua indígena correspondiente.
   - Interpretación de las reglas de operación del programa.
   - Eliminación de tecnicismos legales.
   - Generación de instrucciones simples y accionables para el funcionario
     (ej. "Verificar si corresponde trámite por sucesión", "Solicitar acta de defunción", etc.)
4. Exponer una API HTTP simple para que el frontend (HTML/JS sobre Tomcat) la consuma.
5. **No persistir** conversaciones, nombres ni documentos personales una vez terminado el trámite.

Fuera de alcance de este repo (por ahora): reconocimiento de voz, síntesis de voz y la app Android
nativa — quedan documentados como trabajo futuro, pero el backend debe diseñarse pensando en que
esos componentes se conectarán después.

---

## 3. Stack técnico (MVP)

| Componente     | Tecnología                                   |
|----------------|-----------------------------------------------|
| Backend        | Python + **FastAPI**                          |
| Frontend       | HTML5 + JavaScript Vanilla + CSS (sobre Tomcat)|
| Comunicación   | HTTP local entre frontend y backend            |
| Modelo         | Gemma 4 (invocado desde el backend)            |

> Nota: en la arquitectura final, el backend FastAPI **desaparece** y Gemma 4 corre directamente
> en el dispositivo vía LiteRT-LM. El agente debe evitar acoplar lógica de negocio importante
> a FastAPI de forma que sea difícil de portar luego a Kotlin/Android.

---

## 4. Estructura de carpetas sugerida

```
/backend
  /app
    main.py              # instancia de FastAPI, routers
    /api
      routes_chat.py      # endpoints de conversación/trámite
      routes_health.py     # healthcheck
    /core
      config.py            # variables de entorno, settings
      gemma_client.py       # wrapper para llamar a Gemma 4
      protocol_rules.py      # reglas del trámite / "reglas de operación" resumidas
      context_store.py        # manejo del historial en memoria (NO persistente)
    /schemas
      chat.py               # modelos Pydantic de request/response
    /prompts
      system_prompt_es.md     # instrucciones base del asistente
  requirements.txt
  .env.example
/frontend
  index.html
  app.js
  styles.css
agents.md
README.md
```

El agente puede ajustar nombres, pero debe respetar la separación:
- **core/gemma_client.py**: única capa que habla con el modelo (facilita cambiar de proveedor
  de inferencia sin tocar el resto del código).
- **core/context_store.py**: historial en memoria (dict/objeto en RAM), nunca en disco ni DB.

---

## 5. Contrato de la API (mínimo viable)

### `POST /api/chat`
Request:
```json
{
  "session_id": "string",
  "message": "texto transcrito del habla",
  "speaker": "productor | funcionario"
}
```
Response:
```json
{
  "session_id": "string",
  "reply_es": "respuesta en español para el funcionario",
  "reply_translated": "traducción a la lengua indígena (si aplica)",
  "suggested_actions": ["Verificar...", "Solicitar..."]
}
```

### `POST /api/session`
Crea una nueva sesión de trámite (nuevo `session_id`), reinicia el contexto.

### `DELETE /api/session/{session_id}`
Finaliza el trámite y **borra el historial de memoria** (requisito de privacidad).

### `GET /api/health`
Healthcheck simple para confirmar que el backend y la conexión a Gemma están activos.

El agente debe mantener este contrato estable; si necesita cambiarlo, debe actualizar también
este archivo y el README.

---

## 6. Reglas de negocio importantes para el agente

- Gemma **no debe** devolver artículos completos de las reglas de operación: siempre resumir en
  acciones concretas y breves para el funcionario.
- El prompt de sistema debe instruir a Gemma para:
  1. Comprender la intención del productor.
  2. Mantener el contexto de todo el trámite (no responder de forma aislada, turno por turno).
  3. Traducir entre español y la lengua correspondiente.
  4. Aplicar las reglas del programa sin tecnicismos legales.
  5. Generar instrucciones simples y accionables.
- Lenguas objetivo iniciales: **Nawatlahtolli (náhuatl)**, **Maayat'aan (maya)**,
  **Bats'i k'op (tsotsil)**. El diseño del prompt/config debe permitir agregar más lenguas sin
  reescribir lógica (pensar en "paquetes de lengua" descargables, como en la versión Android).

---

## 7. Privacidad y seguridad (no negociable)

- No se debe guardar la conversación en disco, logs persistentes ni bases de datos.
- El historial vive únicamente en memoria del proceso y se destruye al cerrar la sesión
  (`DELETE /api/session/{id}`) o al reiniciar el servidor.
- No loguear datos personales (nombres, actas, documentos) ni el contenido completo de los
  mensajes en logs de producción/debug que persistan.
- Pensar siempre en la restricción de conectividad limitada: evitar dependencias que requieran
  llamadas constantes a servicios externos en la nube para el flujo principal.
- Cualquier llamada a un proveedor externo de Gemma (API en la nube) debe estar claramente
  marcada como **solo para el MVP/hackday**, ya que la versión final es 100% on-device.

---

## 8. Convenciones de código

- Python 3.11+, tipado con Pydantic para requests/responses.
- Formato: `black` + `ruff` (o `flake8`) antes de cada commit.
- Nombrar variables y funciones en inglés; los textos/prompts orientados al usuario final,
  en español (y las traducciones correspondientes).
- Comentar claramente qué partes del código son "MVP temporal" vs. "reutilizable en Android".
- Escribir tests básicos para `core/gemma_client.py` y `core/protocol_rules.py` usando mocks
  (no depender de que el modelo real esté corriendo para poder testear la lógica de negocio).

---

## 9. Tareas pendientes (backlog para agentes)

- [ ] Definir e implementar `gemma_client.py` (elegir proveedor: local vía Ollama/llama.cpp o
      API en la nube tipo Google AI Studio — dejar la elección detrás de una interfaz).
- [ ] Implementar `context_store.py` en memoria con expiración por inactividad.
- [ ] Escribir `system_prompt_es.md` con las instrucciones completas para Gemma.
- [ ] Implementar endpoints `/api/session`, `/api/chat`, `/api/health`.
- [ ] Conectar el frontend estático (HTML/JS/Tomcat) a estos endpoints vía `fetch`.
- [ ] Documentar en README cómo levantar todo localmente.
- [ ] (Futuro, fuera de este repo) Migrar a Android nativo + LiteRT-LM + STT/TTS locales.

---

## 10. Notas para el agente de IA que use este archivo

- Prioriza simplicidad: es un MVP de hackday, no un sistema productivo.
- No introduzcas dependencias pesadas (bases de datos, colas, microservicios) que no aporten
  valor a la validación del flujo.
- Cuando tengas dudas de diseño, favorece la opción que sea más fácil de portar luego a Android/
  Kotlin + LiteRT-LM.
- Actualiza este `agents.md` y el `README.md` si cambias el contrato de la API o el stack.