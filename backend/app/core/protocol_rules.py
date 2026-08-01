from __future__ import annotations

from typing import List


def build_suggested_actions(message: str) -> List[str]:
    """Generate simple, actionable suggestions from the current conversation."""
    lowered = message.lower()
    actions: List[str] = []

    if "defunción" in lowered or "fallec" in lowered or "muert" in lowered:
        actions.append("Solicitar acta de defunción")
        actions.append("Verificar si corresponde trámite por sucesión")
    if "document" in lowered or "acta" in lowered:
        actions.append("Solicitar documentos faltantes")
    if "ayuda" in lowered or "necesito" in lowered:
        actions.append("Explicar el siguiente paso en lenguaje simple")

    if not actions:
        actions.append("Confirmar la intención del productor")
        actions.append("Explicar el siguiente paso")

    return actions
