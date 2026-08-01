from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class ConversationEntry:
    speaker: str
    message: str


@dataclass
class ContextStore:
    sessions: Dict[str, List[ConversationEntry]] = field(default_factory=dict)

    def create_session(self, session_id: str) -> None:
        self.sessions[session_id] = []

    def delete_session(self, session_id: str) -> None:
        self.sessions.pop(session_id, None)

    def add_message(self, session_id: str, speaker: str, message: str) -> None:
        if session_id not in self.sessions:
            self.create_session(session_id)
        self.sessions[session_id].append(ConversationEntry(speaker=speaker, message=message))

    def get_context(self, session_id: str) -> List[dict]:
        return [
            {"speaker": entry.speaker, "message": entry.message}
            for entry in self.sessions.get(session_id, [])
        ]
