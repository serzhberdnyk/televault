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
PHOTO_DELETE_ACTIONS = {"delete_channel_photo", "delete_chat_photo", "delete_group_photo"}
TITLE_UPDATE_ACTIONS = {"edit_channel_title", "edit_chat_title", "edit_group_title"}
COMMON_SERVICE_ACTIONS = {
    *TITLE_UPDATE_ACTIONS,
    *PHOTO_DELETE_ACTIONS,
    "invite_members",
    "remove_members",
    "join_group_by_link",
    "join_group_by_request",
    "migrate_to_supergroup",
    "migrate_from_group",
    "phone_call",
    "group_call",
    "invite_to_group_call",
    "group_call_scheduled",
    "set_messages_ttl",
    "topic_created",
    "topic_edit",
    "edit_chat_theme",
    "clear_history",
}
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


def plural_ru(count: int, one: str, few: str, many: str) -> str:
    value = abs(count) % 100
    last = value % 10
    if 10 < value < 20:
        return many
    if last == 1:
        return one
    if 1 < last < 5:
        return few
    return many


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


def first_service_value(message: dict[str, Any], keys: tuple[str, ...]) -> str:
    for key in keys:
        value = compact_text(message.get(key))
        if value:
            return value
    return ""


def service_person_name(value: Any) -> str:
    if isinstance(value, dict):
        for key in ("name", "title", "username", "first_name", "last_name", "id"):
            candidate = compact_text(value.get(key))
            if candidate:
                return candidate
        return compact_text(value.get("text", ""))
    return compact_text(value)


def service_members_text(message: dict[str, Any], limit: int = 3) -> str:
    raw_members = message.get("members")
    if raw_members in (None, "", [], {}):
        raw_members = message.get("member")
    if raw_members in (None, "", [], {}):
        return ""

    values = raw_members if isinstance(raw_members, list) else [raw_members]
    names = [service_person_name(value) for value in values]
    names = [name for name in names if name]
    if not names:
        return ""

    visible = names[:limit]
    suffix = ""
    remaining = len(names) - len(visible)
    if remaining > 0:
        suffix = f" и ещё {remaining}"
    return ", ".join(visible) + suffix


def service_with_actor(message: dict[str, Any], text: str) -> str:
    actor = compact_text(message.get("actor", ""))
    return f"{actor}: {text}" if actor else text


def service_title_text(message: dict[str, Any]) -> str:
    return first_service_value(message, ("new_title", "title"))


def format_duration_seconds(value: Any) -> str:
    try:
        seconds = int(float(value))
    except (TypeError, ValueError):
        return ""
    if seconds <= 0:
        return ""

    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    parts: list[str] = []
    if hours:
        parts.append(f"{hours} ч")
    if minutes:
        parts.append(f"{minutes} мин")
    if not parts and seconds:
        parts.append(f"{seconds} с")
    return " ".join(parts)


def format_service_period(value: Any) -> str:
    try:
        seconds = int(float(value))
    except (TypeError, ValueError):
        return ""
    if seconds <= 0:
        return ""

    units = (
        (24 * 60 * 60, "день", "дня", "дней"),
        (60 * 60, "час", "часа", "часов"),
        (60, "минуту", "минуты", "минут"),
    )
    for unit_seconds, one, few, many in units:
        if seconds >= unit_seconds and seconds % unit_seconds == 0:
            count = seconds // unit_seconds
            return f"{count} {plural_ru(count, one, few, many)}"
    return f"{seconds} с"


def service_seconds(value: Any) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def format_schedule_date(value: Any) -> str:
    raw = compact_text(value)
    if not raw:
        return ""
    if raw.isdigit() and len(raw) in (10, 13):
        try:
            timestamp = int(raw)
            if len(raw) == 13:
                timestamp = timestamp // 1000
            return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")
        except (OSError, OverflowError, ValueError):
            return raw
    return normalize_date(raw)


def service_notice_with_detail(label: str, detail: str) -> str:
    return f"{label}: {detail}" if detail else label


def phone_call_service_label(message: dict[str, Any]) -> str:
    duration = format_duration_seconds(message.get("duration_seconds"))
    if duration:
        return service_notice_with_detail("звонок", duration)

    discard_reason = compact_text(message.get("discard_reason", "")).lower()
    if "miss" in discard_reason:
        return "пропущенный звонок"
    if "busy" in discard_reason:
        return "звонок не принят"
    return "звонок"


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
    if service_kind in COMMON_SERVICE_ACTIONS:
        return common_service_text(message, service_kind)
    return existing_text or GENERIC_SERVICE_TEXT


def common_service_text(message: dict[str, Any], service_kind: str) -> str:
    if service_kind in TITLE_UPDATE_ACTIONS:
        title = service_title_text(message)
        if service_kind == "edit_channel_title":
            prefix = "название канала изменено"
        elif service_kind == "edit_chat_title":
            prefix = "название чата изменено"
        else:
            prefix = "название группы изменено"
        label = service_notice_with_detail(prefix, title)
        return service_with_actor(message, label)

    if service_kind in PHOTO_DELETE_ACTIONS:
        actor_id = compact_text(message.get("actor_id", "")).lower()
        if service_kind == "delete_channel_photo" or actor_id.startswith("channel"):
            return service_with_actor(message, "фото канала удалено")
        if service_kind == "delete_chat_photo":
            return service_with_actor(message, "фото чата удалено")
        return service_with_actor(message, "фото группы удалено")

    if service_kind == "invite_members":
        members = service_members_text(message)
        label = service_notice_with_detail("добавлены участники", members)
        return service_with_actor(message, label)

    if service_kind == "remove_members":
        members = service_members_text(message)
        if not members:
            label = "участник удалён"
        elif "," not in members and " и ещё " not in members:
            label = f"участник удалён: {members}"
        else:
            label = service_notice_with_detail("участники удалены", members)
        return service_with_actor(message, label)

    if service_kind == "join_group_by_link":
        actor = compact_text(message.get("actor", ""))
        return f"{actor} присоединился(ась) по ссылке" if actor else "участник присоединился по ссылке"

    if service_kind == "join_group_by_request":
        actor = compact_text(message.get("actor", ""))
        return f"{actor} присоединился(ась) по заявке" if actor else "участник присоединился по заявке"

    if service_kind == "migrate_to_supergroup":
        return "группа преобразована в супергруппу"

    if service_kind == "migrate_from_group":
        return "история перенесена из группы"

    if service_kind == "phone_call":
        return service_with_actor(message, phone_call_service_label(message))

    if service_kind == "group_call":
        duration = format_duration_seconds(message.get("duration_seconds"))
        return service_with_actor(message, service_notice_with_detail("групповой звонок", duration))

    if service_kind == "invite_to_group_call":
        members = service_members_text(message)
        label = service_notice_with_detail("приглашение в групповой звонок", members)
        return service_with_actor(message, label)

    if service_kind == "group_call_scheduled":
        schedule = format_schedule_date(message.get("schedule_date"))
        label = service_notice_with_detail("запланирован групповой звонок", schedule)
        return service_with_actor(message, label)

    if service_kind == "set_messages_ttl":
        seconds = service_seconds(message.get("period"))
        if seconds is not None and seconds <= 0:
            return service_with_actor(message, "автоудаление сообщений отключено")
        period = format_service_period(message.get("period"))
        if period:
            return service_with_actor(message, f"включено автоудаление сообщений: {period}")
        return service_with_actor(message, "включено автоудаление сообщений")

    if service_kind == "topic_created":
        title = service_title_text(message)
        label = service_notice_with_detail("создана тема", title)
        return service_with_actor(message, label)

    if service_kind == "topic_edit":
        title = service_title_text(message)
        label = service_notice_with_detail("тема изменена", title)
        return service_with_actor(message, label)

    if service_kind == "edit_chat_theme":
        emoticon = first_service_value(message, ("emoticon", "emoji"))
        label = service_notice_with_detail("тема чата изменена", emoticon)
        return service_with_actor(message, label)

    if service_kind == "clear_history":
        return service_with_actor(message, "история очищена")

    return GENERIC_SERVICE_TEXT


def photo_update_service_text(message: dict[str, Any], service_kind: str) -> str:
    actor_id = compact_text(message.get("actor_id", "")).lower()
    if service_kind == "edit_channel_photo" or actor_id.startswith("channel"):
        return service_with_actor(message, "фото канала изменено")
    if service_kind == "edit_chat_photo":
        return service_with_actor(message, "фото чата изменено")
    if service_kind == "edit_group_photo":
        return service_with_actor(message, "фото группы изменено")
    return service_with_actor(message, "фото изменено")


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
