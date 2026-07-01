from __future__ import annotations

from pathlib import Path
from typing import Any
from .parser import summarize_chat, load_chat_messages, to_dict


class ExportLibrary:
    def __init__(self) -> None:
        self.root: Path | None = None
        self.chats: dict[str, dict[str, Any]] = {}
        self.messages: dict[str, list[dict[str, Any]]] = {}

    def load_folder(self, folder: str) -> dict[str, Any]:
        root = Path(folder).expanduser().resolve()
        if not root.exists() or not root.is_dir():
            raise ValueError("папка не найдена")

        json_files = sorted(root.rglob("result.json"))
        if not json_files:
            raise ValueError("в выбранной папке не найден result.json")

        self.root = root
        self.chats.clear()
        self.messages.clear()

        errors: list[str] = []
        for i, path in enumerate(json_files):
            chat_id = f"chat_{i}"
            try:
                summary = summarize_chat(path, chat_id)
                self.chats[chat_id] = to_dict(summary)
                self.messages[chat_id] = load_chat_messages(path, root)
            except Exception as e:
                errors.append(f"{path}: {e}")

        if not self.chats:
            raise ValueError("result.json найдены, но не удалось прочитать ни один экспорт")

        return {
            "root": str(root),
            "count": len(self.chats),
            "chats": list(self.chats.values()),
            "errors": errors,
        }

    def get_chat(self, chat_id: str, query: str = "", sender: str = "", media_only: bool = False) -> dict[str, Any]:
        if chat_id not in self.chats:
            raise ValueError("чат не найден")

        items = self.messages.get(chat_id, [])
        q = query.strip().lower()
        s = sender.strip().lower()

        filtered = []
        for m in items:
            if media_only and not m.get("media"):
                continue
            if q and q not in (m.get("text", "") + " " + m.get("from", "")).lower():
                continue
            if s and s != str(m.get("from", "")).lower():
                continue
            filtered.append(m)

        senders = sorted({str(m.get("from", "")) for m in items if m.get("from")})
        return {
            "chat": self.chats[chat_id],
            "messages": filtered,
            "total": len(items),
            "shown": len(filtered),
            "senders": senders,
        }
