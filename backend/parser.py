from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote
import json
import mimetypes


SERVICE_PREVIEW_LIMIT = 76
CREATE_CHANNEL_ACTIONS = {"create_channel"}
CREATE_CHAT_ACTIONS = {"create_chat", "create_group"}
PHOTO_UPDATE_ACTIONS = {"edit_channel_photo", "edit_chat_photo", "edit_group_photo", "update_photo"}
FORWARDED_FIELDS = (
    "forwarded_from",
    "forward_from",
    "forwarded_from_chat",
    "forward_from_chat",
    "saved_from",
    "saved_from_peer",
    "forward_author",
    "forward_signature",
    "forward_date",
    "via",
    "via_bot",
)
GENERIC_SERVICE_TEXT = "системное событие Telegram"


@dataclass
class ChatSummary:
    id: str
    title: str
    path: str
    message_count: int
    media_count: int
    first_date: str
    last_date: str


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def text_to_string(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        parts: list[str] = []
        for item in value:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                parts.append(str(item.get("text", "")))
        return "".join(parts)
    return str(value)


def compact_text(value: Any) -> str:
    return " ".join(text_to_string(value).split())


def short_preview(value: Any, limit: int = SERVICE_PREVIEW_LIMIT) -> str:
    text = compact_text(value)
    if len(text) <= limit:
        return text
    return text[: max(0, limit - 3)].rstrip() + "..."


def normalize_date(value: Any) -> str:
    if not value:
        return ""
    text = str(value)
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return text


def get_chat_title(data: dict[str, Any], json_path: Path) -> str:
    for key in ("name", "title"):
        value = data.get(key)
        if value:
            return str(value)
    return json_path.parent.name


def get_messages(data: dict[str, Any]) -> list[dict[str, Any]]:
    messages = data.get("messages", [])
    if isinstance(messages, list):
        return [m for m in messages if isinstance(m, dict)]
    return []


def get_full_export_sources(data: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str]]:
    sources: list[dict[str, Any]] = []
    errors: list[str] = []
    for section_name in ("chats", "left_chats"):
        section = data.get(section_name)
        if section is None:
            continue
        if not isinstance(section, dict):
            errors.append(f"{section_name} has unexpected format")
            continue
        items = section.get("list", [])
        if items is None:
            continue
        if not isinstance(items, list):
            errors.append(f"{section_name}.list has unexpected format")
            continue
        for index, item in enumerate(items):
            if isinstance(item, dict):
                sources.append(item)
            else:
                errors.append(f"{section_name}.list[{index}] skipped: expected object")
    return sources, errors


def get_chat_sources(data: Any) -> tuple[list[dict[str, Any]], list[str]]:
    if not isinstance(data, dict):
        return [], ["result.json root must be an object"]

    if "messages" in data:
        return [data], []

    if "chats" in data or "left_chats" in data:
        return get_full_export_sources(data)

    return [data], []


def get_media_field(message: dict[str, Any]) -> str:
    for key in ("file", "photo", "thumbnail"):
        if message.get(key):
            return key
    return ""


def get_media_file(message: dict[str, Any]) -> str:
    field = get_media_field(message)
    if not field:
        return ""
    return str(message.get(field) or "")


def metadata_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(metadata_text(item) for pair in value.items() for item in pair)
    if isinstance(value, list):
        return " ".join(metadata_text(item) for item in value)
    return str(value)


def forwarded_field_text(value: Any) -> str:
    if isinstance(value, dict):
        for key in ("name", "title", "username", "id"):
            candidate = compact_text(value.get(key))
            if candidate:
                return candidate
        return compact_text(metadata_text(value))
    return compact_text(value)


def normalize_forwarded_fields(message: dict[str, Any]) -> dict[str, Any]:
    fields: dict[str, Any] = {}
    for key in FORWARDED_FIELDS:
        value = message.get(key)
        if value in (None, "", [], {}):
            continue
        text = forwarded_field_text(value)
        if text:
            fields[key] = text
    return fields


def media_extension(filename: str) -> str:
    return Path(str(filename or "")).suffix.lower()


def media_path_has_sticker_dir(filename: str) -> bool:
    normalized = str(filename or "").replace("\\", "/").lower()
    return "stickers" in [part for part in normalized.split("/") if part]


def encode_media_path(relative_path: Path | str) -> str:
    normalized = str(relative_path).replace("\\", "/")
    return "/".join(quote(unquote(part), safe="") for part in normalized.split("/"))


def media_url_for(library_root: Path, media_path: Path) -> str:
    root = library_root.resolve()
    target = media_path.resolve()
    relative = target.relative_to(root)
    return "/media/" + encode_media_path(relative.as_posix())


def message_has_sticker_metadata(message: dict[str, Any], media_type: str = "") -> bool:
    if message.get("sticker_emoji") or message.get("sticker"):
        return True
    fields = (
        media_type,
        message.get("media_type"),
        message.get("type"),
        message.get("media"),
        message.get("sticker"),
    )
    return any("sticker" in metadata_text(value).lower() for value in fields)


def is_telegram_sticker(
    message: dict[str, Any],
    filename: str,
    media_type: str = "",
) -> bool:
    ext = media_extension(filename)
    has_sticker_metadata = message_has_sticker_metadata(message, media_type)
    has_sticker_path = media_path_has_sticker_dir(filename)

    if has_sticker_metadata or has_sticker_path or ext == ".tgs":
        return True
    return False


def media_kind(
    filename: str,
    mime_type: str = "",
    media_type: str = "",
    media_field: str = "",
    message: dict[str, Any] | None = None,
) -> str:
    mime = (mime_type or "").lower()
    media = (media_type or "").lower()
    if message and is_telegram_sticker(message, filename, media_type):
        return "sticker"
    if mime.startswith("image/") or media_field in ("photo", "thumbnail") or "photo" in media or "image" in media:
        return "image"
    if mime.startswith("video/") or "video" in media:
        return "video"
    if mime.startswith("audio/") or "audio" in media or "voice" in media:
        return "audio"
    if not filename:
        return ""
    mt, _ = mimetypes.guess_type(filename)
    if not mt:
        lower = filename.lower()
        if lower.endswith((".ogg", ".opus", ".mp3", ".wav", ".m4a")):
            return "audio"
        if lower.endswith((".mp4", ".webm", ".mov", ".avi", ".mkv")):
            return "video"
        if lower.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
            return "image"
        return "file"
    if mt.startswith("image/"):
        return "image"
    if mt.startswith("video/"):
        return "video"
    if mt.startswith("audio/"):
        return "audio"
    return "file"


def referenced_message_preview(message: dict[str, Any]) -> str:
    text = short_preview(message.get("text", ""))
    if text:
        return text

    media_field = get_media_field(message)
    filename = get_media_file(message)
    mime_type = str(message.get("mime_type") or "")
    media_type = str(message.get("media_type") or "")
    kind = media_kind(filename, mime_type, media_type, media_field, message)

    if kind == "sticker":
        return "стикер"
    if kind == "image":
        return "фото"
    if kind == "video":
        return "видео"
    if kind == "audio":
        return "аудио"
    if kind == "file":
        return "файл"
    return ""


def message_id_key(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


def message_id_map(messages: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_id: dict[str, dict[str, Any]] = {}
    for message in messages:
        key = message_id_key(message.get("id"))
        if key:
            by_id[key] = message
    return by_id


def normalize_service_fields(
    message: dict[str, Any],
    messages_by_id: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    action = str(message.get("action") or "").strip()
    service_kind = normalize_service_kind(action)
    fields: dict[str, Any] = {
        "message_kind": "service",
        "service_kind": service_kind,
        "service_action": action,
        "actor": message.get("actor") or "",
        "actor_id": message.get("actor_id") or "",
        "service_title": message.get("title") or "",
        "service_old_title": message.get("old_title") or "",
        "service_new_title": message.get("new_title") or "",
        "service_text": service_notice_text(message, service_kind),
        "pinned_message_id": "",
        "pinned_message_preview": "",
        "pinned_message_found": False,
    }
    if service_kind != "pin_message":
        return fields

    pinned_message_id = message.get("message_id")
    fields["pinned_message_id"] = pinned_message_id if pinned_message_id is not None else ""
    referenced = (messages_by_id or {}).get(message_id_key(pinned_message_id))
    fields["pinned_message_found"] = referenced is not None
    if referenced:
        fields["pinned_message_preview"] = referenced_message_preview(referenced)
    return fields


def normalize_service_kind(action: str) -> str:
    normalized = action.strip().lower()
    if normalized in CREATE_CHANNEL_ACTIONS:
        return "create_channel"
    if normalized in CREATE_CHAT_ACTIONS:
        return "create_chat"
    if normalized in PHOTO_UPDATE_ACTIONS:
        return normalized
    return normalized or "generic_service"


def service_notice_text(message: dict[str, Any], service_kind: str) -> str:
    existing_text = compact_text(message.get("text", ""))
    if service_kind == "pin_message":
        return existing_text

    actor = compact_text(message.get("actor", ""))
    if service_kind == "create_channel":
        return f"{actor} создал(а) канал" if actor else "канал создан"
    if service_kind == "create_chat":
        return f"{actor} создал(а) чат" if actor else "чат создан"
    if service_kind in PHOTO_UPDATE_ACTIONS:
        return photo_update_service_text(message, service_kind)
    return existing_text or GENERIC_SERVICE_TEXT


def photo_update_service_text(message: dict[str, Any], service_kind: str) -> str:
    actor_id = compact_text(message.get("actor_id", "")).lower()
    if service_kind == "edit_channel_photo" or actor_id.startswith("channel"):
        return "Фотография канала обновлена"
    if service_kind in {"edit_chat_photo", "edit_group_photo"}:
        return "Фотография чата обновлена"
    return "Фотография обновлена"


def summarize_chat_data(data: dict[str, Any], json_path: Path, chat_id: str) -> ChatSummary:
    messages = get_messages(data)
    dates = [str(m.get("date", "")) for m in messages if m.get("date")]
    media_count = sum(1 for m in messages if get_media_file(m))
    return ChatSummary(
        id=chat_id,
        title=get_chat_title(data, json_path),
        path=str(json_path),
        message_count=len(messages),
        media_count=media_count,
        first_date=normalize_date(dates[0]) if dates else "",
        last_date=normalize_date(dates[-1]) if dates else "",
    )


def summarize_chat(json_path: Path, chat_id: str) -> ChatSummary:
    data = read_json(json_path)
    return summarize_chat_data(data, json_path, chat_id)


def build_media_ref(root: Path, filename: Any, library_root: Path | None = None) -> dict[str, Any]:
    media = str(filename or "")
    if not media:
        return {"path": "", "url": "", "exists": False, "name": ""}
    media_path = (root / media).resolve()
    safe_root = (library_root or root).resolve()
    try:
        url = media_url_for(safe_root, media_path)
        exists = media_path.exists() and media_path.is_file()
    except Exception:
        url = ""
        exists = False
    return {"path": media, "url": url, "exists": exists, "name": Path(media).name}


def normalize_message(
    message: dict[str, Any],
    index: int,
    root: Path,
    library_root: Path | None = None,
    messages_by_id: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    media_field = get_media_field(message)
    media = get_media_file(message)
    media_url = ""
    kind = ""
    exists = False
    file_size = message.get("file_size") or message.get("size")
    mime_type = str(message.get("mime_type") or "")
    media_type = str(message.get("media_type") or "")
    if media:
        media_ref = build_media_ref(root, media, library_root)
        media_url = media_ref["url"]
        exists = bool(media_ref["exists"])
        if file_size is None and exists:
            try:
                file_size = (root / media).resolve().stat().st_size
            except Exception:
                file_size = None
        kind = media_kind(media, mime_type, media_type, media_field, message)

    photo_ref = build_media_ref(root, message.get("photo"), library_root)
    thumbnail_ref = build_media_ref(root, message.get("thumbnail"), library_root)

    normalized = {
        "id": message.get("id", index),
        "type": message.get("type", "message"),
        "message_kind": "message",
        "date": normalize_date(message.get("date", "")),
        "date_unixtime": message.get("date_unixtime") or "",
        "from": message.get("from") or message.get("actor") or "",
        "text": text_to_string(message.get("text", "")),
        "media": media,
        "media_url": media_url,
        "media_kind": kind,
        "media_field": media_field,
        "media_type": media_type,
        "mime_type": mime_type,
        "duration_seconds": message.get("duration_seconds"),
        "width": message.get("width"),
        "height": message.get("height"),
        "sticker_emoji": message.get("sticker_emoji") or "",
        "file_size": file_size,
        "media_exists": exists,
        "media_name": Path(media).name if media else "",
        "photo": photo_ref["path"],
        "photo_url": photo_ref["url"],
        "photo_exists": photo_ref["exists"],
        "thumbnail": thumbnail_ref["path"],
        "thumbnail_url": thumbnail_ref["url"],
        "thumbnail_exists": thumbnail_ref["exists"],
    }
    normalized.update(normalize_forwarded_fields(message))
    if message.get("type") == "service":
        normalized.update(normalize_service_fields(message, messages_by_id))
    return normalized


def load_chat_messages_from_data(
    data: dict[str, Any],
    root: Path,
    library_root: Path | None = None,
) -> list[dict[str, Any]]:
    messages = get_messages(data)
    messages_by_id = message_id_map(messages)
    return [normalize_message(m, i, root, library_root, messages_by_id) for i, m in enumerate(messages)]


def load_chat_messages(json_path: Path, library_root: Path | None = None) -> list[dict[str, Any]]:
    data = read_json(json_path)
    return load_chat_messages_from_data(data, json_path.parent, library_root)


def to_dict(obj: ChatSummary) -> dict[str, Any]:
    return asdict(obj)
