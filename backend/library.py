from __future__ import annotations

from collections import deque
import os
from pathlib import Path
from typing import Any
from .parser import (
    get_chat_sources,
    load_chat_messages_from_data,
    read_json,
    summarize_chat_data,
    to_dict,
)


DEFAULT_SEARCH_LIMIT = 50
MAX_SEARCH_LIMIT = 100
MEDIA_PATH_FIELDS = ("media", "photo", "thumbnail")
RESULT_JSON_NAME = "result.json"
MAX_RESULT_JSON_SEARCH_DEPTH = 2
MAX_RESULT_JSON_SEARCH_DIRS = 200
MAX_RESULT_JSON_SEARCH_ENTRIES = 5000
WRONG_EXPORT_FOLDER_MESSAGE = (
    "Похоже, это не папка экспорта Telegram Desktop. "
    "Выберите папку, где лежит result.json."
)
TOO_BROAD_EXPORT_FOLDER_MESSAGE = (
    "Похоже, выбрана слишком широкая папка, а не экспорт Telegram Desktop. "
    "Выберите папку, где лежит result.json."
)


class ResultJsonSearchLimitError(Exception):
    pass


def compact_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(part for part in (compact_value(item) for item in value) if part)
    if isinstance(value, dict):
        for key in ("text", "value", "name", "title", "username", "id"):
            if key in value:
                text = compact_value(value.get(key))
                if text:
                    return text
        return " ".join(part for part in (compact_value(item) for item in value.values()) if part)
    return " ".join(str(value).split())


def compact_values(values: tuple[Any, ...]) -> str:
    return " ".join(part for part in (compact_value(value) for value in values) if part)


def path_basename(value: Any) -> str:
    raw = compact_value(value)
    if not raw:
        return ""
    return Path(raw.replace("\\", "/")).name or raw


def error_without_local_path(error: Any, path: Path) -> str:
    text = compact_value(error)
    if not text:
        return ""
    return text.replace(str(path), path.name)


def audio_metadata_label(message: dict[str, Any]) -> str:
    performer = compact_value(message.get("performer"))
    title = compact_value(message.get("title"))
    if performer and title:
        return f"{performer} — {title}"
    return title or performer


def clamp_search_limit(value: int) -> int:
    try:
        limit = int(value)
    except (TypeError, ValueError):
        return DEFAULT_SEARCH_LIMIT
    return max(1, min(limit, MAX_SEARCH_LIMIT))


def message_search_text(message: dict[str, Any]) -> str:
    fields = (
        message.get("text"),
        message.get("caption"),
        message.get("from"),
        message.get("sender"),
        message.get("author"),
        message.get("actor"),
        message.get("from_id"),
        message.get("actor_id"),
        message.get("service_text"),
        message.get("service_kind"),
        message.get("service_action"),
        message.get("special_type"),
        message.get("special_text"),
        message.get("special_label"),
        message.get("special_detail"),
        message.get("special_fields"),
        message.get("pinned_message_preview"),
        message.get("pinned_message_id"),
        message.get("reply_to_message_from"),
        message.get("reply_to_message_author"),
        message.get("reply_to_message_preview"),
        path_basename(message.get("media")),
        path_basename(message.get("media_name")),
        message.get("media_kind"),
        message.get("media_type"),
        message.get("mime_type"),
        message.get("performer"),
        message.get("title"),
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
    return compact_values(fields).casefold()


def message_media_type(message: dict[str, Any]) -> str:
    return compact_value(
        message.get("media_kind")
        or message.get("media_type")
        or message.get("mime_type")
    )


def message_snippet(message: dict[str, Any]) -> str:
    for key in ("text", "caption", "special_text", "service_text", "pinned_message_preview", "reply_to_message_preview"):
        value = compact_value(message.get(key))
        if value:
            return value[:117].rstrip() + "..." if len(value) > 120 else value

    media_type = message_media_type(message)
    audio_label = audio_metadata_label(message)
    if audio_label:
        return audio_label
    media_name = path_basename(message.get("media_name") or message.get("media"))
    if media_type and media_name:
        return f"{media_type}: {media_name}"
    return media_name or media_type or "сообщение"


def normalize_relative_media_path(relative_path: Path | str) -> str:
    normalized = str(relative_path).replace("\\", "/")
    return os.path.normcase(normalized).replace("\\", "/")


def media_path_from_reference(library_root: Path, base_root: Path, value: Any) -> str:
    media = str(value or "")
    if not media:
        return ""

    candidate = Path(media.replace("\\", "/"))
    try:
        target = candidate.resolve() if candidate.is_absolute() else (base_root / candidate).resolve()
        relative = target.relative_to(library_root)
    except (OSError, RuntimeError, ValueError):
        return ""

    if not target.exists() or not target.is_file():
        return ""

    normalized = normalize_relative_media_path(relative.as_posix())
    if Path(normalized).name.lower() == "result.json":
        return ""
    return normalized


def collect_media_paths(library_root: Path, base_root: Path, messages: list[dict[str, Any]]) -> set[str]:
    paths: set[str] = set()
    resolved_library_root = library_root.resolve()
    resolved_base_root = base_root.resolve()
    for message in messages:
        for field in MEDIA_PATH_FIELDS:
            media_path = media_path_from_reference(resolved_library_root, resolved_base_root, message.get(field))
            if media_path:
                paths.add(media_path)
    return paths


def find_result_json_files(root: Path) -> list[Path]:
    direct_result = root / RESULT_JSON_NAME
    if direct_result.is_file():
        return [direct_result]

    found: list[Path] = []
    pending: deque[tuple[Path, int]] = deque([(root, 0)])
    checked_dirs = 0
    checked_entries = 0

    while pending:
        current, depth = pending.popleft()
        checked_dirs += 1
        if checked_dirs > MAX_RESULT_JSON_SEARCH_DIRS:
            raise ResultJsonSearchLimitError()

        current_results: list[Path] = []
        child_dirs: list[Path] = []

        try:
            with os.scandir(current) as entries:
                for entry in entries:
                    checked_entries += 1
                    if checked_entries > MAX_RESULT_JSON_SEARCH_ENTRIES:
                        raise ResultJsonSearchLimitError()

                    try:
                        if entry.is_file(follow_symlinks=False) and entry.name.casefold() == RESULT_JSON_NAME:
                            current_results.append(Path(entry.path))
                        elif depth < MAX_RESULT_JSON_SEARCH_DEPTH and entry.is_dir(follow_symlinks=False):
                            child_dirs.append(Path(entry.path))
                    except OSError:
                        continue
        except OSError:
            continue

        found.extend(current_results)
        if current_results:
            continue
        pending.extend((child_dir, depth + 1) for child_dir in child_dirs)

    return sorted(set(found), key=lambda path: str(path).casefold())


class ExportLibrary:
    def __init__(self) -> None:
        self.root: Path | None = None
        self.chats: dict[str, dict[str, Any]] = {}
        self.messages: dict[str, list[dict[str, Any]]] = {}
        self.media_paths: set[str] = set()

    def load_folder(self, folder: str) -> dict[str, Any]:
        root = Path(folder).expanduser().resolve()
        if not root.exists() or not root.is_dir():
            raise ValueError("папка не найдена")

        try:
            json_files = find_result_json_files(root)
        except ResultJsonSearchLimitError:
            raise ValueError(TOO_BROAD_EXPORT_FOLDER_MESSAGE) from None
        if not json_files:
            raise ValueError(WRONG_EXPORT_FOLDER_MESSAGE)

        next_root = root
        next_chats: dict[str, dict[str, Any]] = {}
        next_messages: dict[str, list[dict[str, Any]]] = {}
        next_media_paths: set[str] = set()

        errors: list[str] = []
        for path in json_files:
            try:
                data = read_json(path)
                sources, source_errors = get_chat_sources(data)
                errors.extend(f"{path.name}: {error}" for error in source_errors)
                if not sources:
                    if not source_errors:
                        errors.append(f"{path.name}: no readable chats found")
                    continue

                for source_data in sources:
                    chat_id = f"chat_{len(next_chats)}"
                    summary = summarize_chat_data(source_data, path, chat_id)
                    messages = load_chat_messages_from_data(source_data, path.parent, next_root)
                    next_chats[chat_id] = to_dict(summary)
                    next_messages[chat_id] = messages
                    next_media_paths.update(collect_media_paths(next_root, path.parent, messages))
            except Exception as e:
                errors.append(f"{path.name}: {error_without_local_path(e, path)}")

        if not next_chats:
            raise ValueError("result.json найдены, но не удалось прочитать ни один экспорт")

        self.root = next_root
        self.chats = next_chats
        self.messages = next_messages
        self.media_paths = next_media_paths

        return {
            "root": str(root),
            "count": len(next_chats),
            "chats": list(next_chats.values()),
            "errors": errors,
        }

    def is_media_file_allowed(self, file_path: Path) -> bool:
        if not self.root:
            return False

        try:
            relative = file_path.resolve().relative_to(self.root.resolve())
        except (OSError, RuntimeError, ValueError):
            return False

        return normalize_relative_media_path(relative.as_posix()) in self.media_paths

    def get_chat(self, chat_id: str, query: str = "", sender: str = "", media_only: bool = False) -> dict[str, Any]:
        if chat_id not in self.chats:
            raise ValueError("чат не найден")

        items = self.messages.get(chat_id, [])
        q = compact_value(query).casefold()
        s = compact_value(sender).casefold()

        filtered = []
        for m in items:
            if media_only and not m.get("media"):
                continue
            if q and q not in message_search_text(m):
                continue
            if s and s != compact_value(m.get("from")).casefold():
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
