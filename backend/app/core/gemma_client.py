from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List

import httpx
from dotenv import load_dotenv

from app.core.protocol_rules import build_suggested_actions

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "system_prompt_es.md"


class GemmaClient:
    """Thin wrapper around the model provider.

    For the MVP this uses a deterministic fallback so the API works even when no model is
    available. The provider abstraction keeps the door open for Ollama or cloud APIs later.
    """

    def __init__(self, provider: str | None = None, model: str | None = None) -> None:
        self.provider = (provider or os.getenv("GEMMA_PROVIDER", "ollama")).strip().lower()
        self.model = (model or os.getenv("GEMMA_MODEL", "gemma2")).strip()
        self.api_key = os.getenv("GEMMA_API_KEY", "").strip()

    def _build_prompt(self, context: List[Dict[str, Any]], message: str, speaker: str) -> str:
        system_prompt = PROMPT_PATH.read_text(encoding="utf-8") if PROMPT_PATH.exists() else ""
        history = "\n".join(
            f"- {entry.get('speaker', 'desconocido')}: {entry.get('message', '')}" for entry in context[-4:]
        )
        return (
            f"{system_prompt}\n\n"
            f"Historial reciente del trámite:\n{history or '- Sin historial previo'}\n\n"
            f"Mensaje actual ({speaker}): {message}\n\n"
            "Responde de forma breve, en español, orientada a avanzar el trámite."
        )

    async def _call_provider(self, prompt: str) -> str | None:
        if self.provider != "cloud":
            return None

        if not self.api_key:
            return None

        model_candidates = [self.model]
        if self.model != "gemini-2.0-flash":
            model_candidates.append("gemini-2.0-flash")

        last_error: Exception | None = None
        for model_name in model_candidates:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    url = (
                        "https://generativelanguage.googleapis.com/v1beta/models/"
                        f"{model_name}:generateContent?key={self.api_key}"
                    )
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.2},
                    }
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    candidates = data.get("candidates") or []
                    if not candidates:
                        return None
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if not parts:
                        return None
                    return parts[0].get("text")
            except Exception as exc:
                last_error = exc

        if last_error is not None:
            return None

        return None

    async def generate_reply(
        self,
        context: List[Dict[str, Any]],
        message: str,
        speaker: str,
    ) -> Dict[str, Any]:
        prompt = self._build_prompt(context=context, message=message, speaker=speaker)

        provider_response = await self._call_provider(prompt)
        if provider_response:
            reply_es = provider_response
            reply_translated = f"[traducción] {provider_response}"
            actions = build_suggested_actions(message)
            return {
                "reply_es": reply_es,
                "reply_translated": reply_translated,
                "suggested_actions": actions,
            }

        reply_es = (
            "Entiendo la intención del productor."
            " Resumo el mensaje en español y propongo un siguiente paso simple."
        )
        reply_translated = "Entiendo la intención del productor. Propongo un siguiente paso simple."
        actions = build_suggested_actions(message)

        return {
            "reply_es": reply_es,
            "reply_translated": reply_translated,
            "suggested_actions": actions,
        }
