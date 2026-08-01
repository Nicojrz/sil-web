from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.context_store import ContextStore
from app.core.gemma_client import GemmaClient
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/api", tags=["chat"])
context_store = ContextStore()
gemma_client = GemmaClient()


@router.post("/session", response_model=dict)
def create_session() -> dict:
    session_id = "session-" + str(len(context_store.sessions) + 1)
    context_store.create_session(session_id)
    return {"session_id": session_id}


@router.delete("/session/{session_id}")
def delete_session(session_id: str) -> dict:
    context_store.delete_session(session_id)
    return {"status": "deleted", "session_id": session_id}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    context_store.add_message(request.session_id, request.speaker, request.message)
    context = context_store.get_context(request.session_id)

    reply_payload = await gemma_client.generate_reply(
        context=context,
        message=request.message,
        speaker=request.speaker,
    )

    if not reply_payload.get("reply_es"):
        raise HTTPException(status_code=500, detail="Unable to generate reply")

    return ChatResponse(
        session_id=request.session_id,
        reply_es=reply_payload["reply_es"],
        reply_translated=reply_payload["reply_translated"],
        suggested_actions=reply_payload["suggested_actions"],
    )
