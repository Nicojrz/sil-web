import asyncio
from unittest.mock import AsyncMock

from app.core.gemma_client import GemmaClient


def test_generate_reply_uses_fallback_when_provider_is_unavailable() -> None:
    client = GemmaClient(provider="cloud", model="gemma-test")
    client._call_provider = AsyncMock(return_value=None)

    response = asyncio.run(
        client.generate_reply(
            context=[{"speaker": "productor", "message": "Necesito ayuda"}],
            message="Necesito ayuda",
            speaker="productor",
        )
    )

    assert response["reply_es"]
    assert response["reply_translated"]
    assert response["suggested_actions"]


def test_generate_reply_uses_google_ai_studio_when_configured(monkeypatch) -> None:
    client = GemmaClient(provider="cloud", model="gemini-2.0-flash")
    client.api_key = "test-key"

    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"candidates": [{"content": {"parts": [{"text": "respuesta desde google"}]}}]}

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs) -> None:
            self.args = args
            self.kwargs = kwargs

        async def __aenter__(self) -> "DummyAsyncClient":
            return self

        async def __aexit__(self, exc_type, exc, tb) -> bool:
            return False

        async def post(self, url: str, json: dict) -> DummyResponse:
            assert "gemini-2.0-flash" in url
            assert "key=test-key" in url
            assert json["contents"][0]["parts"][0]["text"]
            return DummyResponse()

    monkeypatch.setattr("app.core.gemma_client.httpx.AsyncClient", DummyAsyncClient)

    response = asyncio.run(
        client.generate_reply(
            context=[{"speaker": "productor", "message": "Necesito ayuda"}],
            message="Necesito ayuda",
            speaker="productor",
        )
    )

    assert response["reply_es"] == "respuesta desde google"


def test_generate_reply_falls_back_to_secondary_model_when_primary_is_unavailable(monkeypatch) -> None:
    client = GemmaClient(provider="cloud", model="gemma-4-26b")
    client.api_key = "test-key"

    class DummyResponse:
        def __init__(self, text: str) -> None:
            self._text = text

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"candidates": [{"content": {"parts": [{"text": self._text}]}}]}

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs) -> None:
            self.args = args
            self.kwargs = kwargs

        async def __aenter__(self) -> "DummyAsyncClient":
            return self

        async def __aexit__(self, exc_type, exc, tb) -> bool:
            return False

        async def post(self, url: str, json: dict) -> DummyResponse:
            if "gemma-4-26b" in url:
                raise RuntimeError("unsupported model")
            assert "gemini-2.0-flash" in url
            return DummyResponse("respuesta desde fallback")

    monkeypatch.setattr("app.core.gemma_client.httpx.AsyncClient", DummyAsyncClient)

    response = asyncio.run(
        client.generate_reply(
            context=[{"speaker": "productor", "message": "Necesito ayuda"}],
            message="Necesito ayuda",
            speaker="productor",
        )
    )

    assert response["reply_es"] == "respuesta desde fallback"
