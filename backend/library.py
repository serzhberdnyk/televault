from __future__ import annotations

from pathlib import Path
from typing import Any
from .parser import summarize_chat, load_chat_messages, to_dict


DEFAULT_SEARCH_LIMIT = 50
MAX_SEARCH_LIMIT = 100


def compact_value(value: Any) -> str:
    return " ".join(str(value or "").split())


def clamp_search_limit(value: int) -> int:
    try:
        limit = int(value)
    except (TypeError, ValueError):
        return DEFAULT_SEARCH_LIMIT
    return max(1, min(limit, MAX_SEARCH_LIMIT))


def message_search_text(message: dict[str, Any]) -> str:
    fields = (
        message.get("text"),
        message.get("from"),
        message.get("actor"),
        message.get("service_text"),
        message.get("service_kind"),
        message.get("service_action"),
        message.get("pinned_message_preview"),
        message.get("pinned_message_id"),
        message.get("media"),
        message.get("media_name"),
        message.get("media_kind"),
        message.get("media_type"),
        message.get("mime_type"),
        message.get("sticker_emoji"),
        message.get("forwarded_from"),
        message.get("forward_from"),
        message.get("forwarded_from_chat"),
        message.get("forward_from_chat"),
        message.get("saved_from"),
        message.get("saved_from_peer"),
        message.get("forward_author"),
        message.get("forward_signature"),
        message.get("via"),
        message.get("via_bot"),
    )
    return " ".join(compact_value(field) for field in fields).casefold()


def message_media_type(message: dict[str, Any]) -> str:
    return compact_value(
        message.get("media_kind")
        or message.get("media_type")
        or message.get("mime_type")
    )


def message_snippet(message: dict[str, Any]) -> str:
    for key in ("text", "service_text", "pinned_message_preview"):
        value = compact_value(message.get(key))
        if value:
            return value[:117].rstrip() + "..." if len(value) > 120 else value

    media_type = message_media_type(message)
    media_name = compact_value(message.get("media_name") or Path(str(message.get("media") or "")).name)
    if media_type and media_name:
        return f"{media_type}: {media_name}"
    return media_name or media_type or "сообщение"


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

    def search_messages(self, query: str, limit: int = DEFAULT_SEARCH_LIMIT) -> dict[str, Any]:
        q = compact_value(query)
        result_limit = clamp_search_limit(limit)
        results: list[dict[str, Any]] = []
        if not q or not self.root:
            return {"query": q, "limit": result_limit, "count": 0, "results": []}

        needle = q.casefold()
        for chat_id, chat in self.chats.items():
            for index, message in enumerate(self.messages.get(chat_id, [])):
                if needle not in message_search_text(message):
                    continue
                message_id = message.get("id", index)
                results.append({
                    "chat_id": chat_id,
                    "chat_title": chat.get("title", ""),
                    "message_id": message_id,
                    "sourceIndex": index,
                    "sender": message.get("from") or message.get("actor") or "",
                    "date": message.get("date", ""),
                    "snippet": message_snippet(message),
                    "media_type": message_media_type(message),
                })
                if len(results) >= result_limit:
                    return {
                        "query": q,
                        "limit": result_limit,
                        "count": len(results),
                        "results": results,
                    }

        return {
            "query": q,
            "limit": result_limit,
            "count": len(results),
            "results": results,
        }
