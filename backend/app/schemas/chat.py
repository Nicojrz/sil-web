from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    speaker: str = Field(..., pattern="^(productor|funcionario)$")


class ChatResponse(BaseModel):
    session_id: str
    reply_es: str
    reply_translated: str
    suggested_actions: list[str]
