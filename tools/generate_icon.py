from __future__ import annotations

from pathlib import Path
import argparse
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
ICON_SIZES = (16, 32, 48, 256)
WEB_ICON_SIZES = (192, 256, 512)


RGBA = tuple[int, int, int, int]


def blend_pixel(buffer: bytearray, width: int, x: int, y: int, color: RGBA) -> None:
    r, g, b, a = color
    index = (y * width + x) * 4
    if a == 255:
        buffer[index : index + 4] = bytes((r, g, b, a))
        return
    if a == 0:
        return

    dst_r, dst_g, dst_b, dst_a = buffer[index : index + 4]
    inv_a = 255 - a
    out_a = a + (dst_a * inv_a + 127) // 255
    if out_a == 0:
        buffer[index : index + 4] = b"\x00\x00\x00\x00"
        return

    out_r = (r * a + dst_r * dst_a * inv_a // 255 + out_a // 2) // out_a
    out_g = (g * a + dst_g * dst_a * inv_a // 255 + out_a // 2) // out_a
    out_b = (b * a + dst_b * dst_a * inv_a // 255 + out_a // 2) // out_a
    buffer[index : index + 4] = bytes((out_r, out_g, out_b, out_a))


def inside_rounded_rect(
    x: int,
    y: int,
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    radius: int,
) -> bool:
    if radius <= 0:
        return x0 <= x < x1 and y0 <= y < y1

    px = x + 0.5
    py = y + 0.5
    if x0 + radius <= px <= x1 - radius:
        return y0 <= py <= y1
    if y0 + radius <= py <= y1 - radius:
        return x0 <= px <= x1

    cx = x0 + radius if px < x0 + radius else x1 - radius
    cy = y0 + radius if py < y0 + radius else y1 - radius
    return (px - cx) ** 2 + (py - cy) ** 2 <= radius**2


def fill_rounded_rect(
    buffer: bytearray,
    width: int,
    height: int,
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    radius: int,
    color: RGBA,
) -> None:
    x0 = max(0, x0)
    y0 = max(0, y0)
    x1 = min(width, x1)
    y1 = min(height, y1)
    for y in range(y0, y1):
        for x in range(x0, x1):
            if inside_rounded_rect(x, y, x0, y0, x1, y1, radius):
                blend_pixel(buffer, width, x, y, color)


def fill_circle(
    buffer: bytearray,
    width: int,
    height: int,
    center_x: int,
    center_y: int,
    radius: int,
    color: RGBA,
) -> None:
    radius_sq = radius * radius
    for y in range(max(0, center_y - radius), min(height, center_y + radius + 1)):
        for x in range(max(0, center_x - radius), min(width, center_x + radius + 1)):
            if (x + 0.5 - center_x) ** 2 + (y + 0.5 - center_y) ** 2 <= radius_sq:
                blend_pixel(buffer, width, x, y, color)


def draw_icon(size: int) -> bytes:
    scale = 4
    high = size * scale
    buffer = bytearray(high * high * 4)

    def u(value: float) -> int:
        return int(round(value * high / 256))

    background = (8, 15, 29, 255)
    background_edge = (20, 58, 88, 255)
    panel = (15, 32, 52, 255)
    panel_inner = (11, 24, 41, 255)
    cyan = (104, 232, 255, 255)
    cyan_shadow = (21, 122, 169, 210)
    blue = (57, 113, 255, 255)

    fill_rounded_rect(buffer, high, high, u(12), u(12), u(244), u(244), u(48), background_edge)
    fill_rounded_rect(buffer, high, high, u(18), u(18), u(238), u(238), u(42), background)

    fill_rounded_rect(buffer, high, high, u(48), u(58), u(208), u(214), u(26), blue)
    fill_rounded_rect(buffer, high, high, u(56), u(66), u(200), u(206), u(20), panel)
    fill_rounded_rect(buffer, high, high, u(70), u(82), u(186), u(192), u(16), panel_inner)

    fill_rounded_rect(buffer, high, high, u(82), u(92), u(174), u(119), u(8), cyan_shadow)
    fill_rounded_rect(buffer, high, high, u(88), u(86), u(168), u(111), u(8), cyan)
    fill_rounded_rect(buffer, high, high, u(115), u(104), u(141), u(178), u(8), cyan_shadow)
    fill_rounded_rect(buffer, high, high, u(110), u(100), u(136), u(174), u(8), cyan)

    if size >= 32:
        fill_circle(buffer, high, high, u(174), u(154), u(19), blue)
        fill_circle(buffer, high, high, u(174), u(154), u(10), panel_inner)
        fill_circle(buffer, high, high, u(174), u(154), u(4), cyan)

    return downsample(buffer, high, size, scale)


def downsample(buffer: bytearray, high_width: int, target_size: int, scale: int) -> bytes:
    output = bytearray(target_size * target_size * 4)
    sample_count = scale * scale
    for y in range(target_size):
        for x in range(target_size):
            total_r = total_g = total_b = total_a = 0
            for sy in range(scale):
                for sx in range(scale):
                    source_index = ((y * scale + sy) * high_width + x * scale + sx) * 4
                    total_r += buffer[source_index]
                    total_g += buffer[source_index + 1]
                    total_b += buffer[source_index + 2]
                    total_a += buffer[source_index + 3]
            target_index = (y * target_size + x) * 4
            output[target_index : target_index + 4] = bytes(
                (
                    total_r // sample_count,
                    total_g // sample_count,
                    total_b // sample_count,
                    total_a // sample_count,
                )
            )
    return bytes(output)


def rgba_to_ico_dib(rgba: bytes, width: int, height: int) -> bytes:
    bitmap_header = struct.pack(
        "<IIIHHIIIIII",
        40,
        width,
        height * 2,
        1,
        32,
        0,
        width * height * 4,
        0,
        0,
        0,
        0,
    )

    xor = bytearray()
    for y in range(height - 1, -1, -1):
        for x in range(width):
            index = (y * width + x) * 4
            r, g, b, a = rgba[index : index + 4]
            xor.extend((b, g, r, a))

    mask_stride = ((width + 31) // 32) * 4
    and_mask = bytearray()
    for y in range(height - 1, -1, -1):
        row = bytearray(mask_stride)
        for x in range(width):
            alpha = rgba[(y * width + x) * 4 + 3]
            if alpha < 128:
                row[x // 8] |= 1 << (7 - (x % 8))
        and_mask.extend(row)

    return bitmap_header + bytes(xor) + bytes(and_mask)


def build_ico() -> bytes:
    images = [(size, rgba_to_ico_dib(draw_icon(size), size, size)) for size in ICON_SIZES]
    header = struct.pack("<HHH", 0, 1, len(images))
    offset = len(header) + 16 * len(images)
    entries = bytearray()
    payload = bytearray()

    for size, data in images:
        width_byte = size if size < 256 else 0
        height_byte = size if size < 256 else 0
        entries.extend(
            struct.pack(
                "<BBBBHHII",
                width_byte,
                height_byte,
                0,
                0,
                1,
                32,
                len(data),
                offset,
            )
        )
        payload.extend(data)
        offset += len(data)

    return header + bytes(entries) + bytes(payload)


def png_chunk(chunk_type: bytes, payload: bytes) -> bytes:
    checksum = zlib.crc32(chunk_type + payload) & 0xFFFFFFFF
    return struct.pack(">I", len(payload)) + chunk_type + payload + struct.pack(">I", checksum)


def rgba_to_png(rgba: bytes, width: int, height: int) -> bytes:
    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    stride = width * 4
    rows = bytearray()
    for y in range(height):
        row_start = y * stride
        rows.append(0)
        rows.extend(rgba[row_start : row_start + stride])

    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", header)
        + png_chunk(b"IDAT", zlib.compress(bytes(rows), level=9))
        + png_chunk(b"IEND", b"")
    )


def default_targets(include_favicon: bool) -> list[Path]:
    targets = [ROOT / "assets" / "TeleVault.ico"]
    if include_favicon:
        targets.append(ROOT / "frontend" / "favicon.ico")
    return targets


def web_icon_targets() -> list[tuple[int, Path]]:
    return [
        (size, ROOT / "frontend" / "icons" / f"televault-{size}.png")
        for size in WEB_ICON_SIZES
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the TeleVault Windows icon.")
    parser.add_argument(
        "--no-favicon",
        action="store_true",
        help="only create assets/TeleVault.ico and skip frontend/favicon.ico",
    )
    args = parser.parse_args()

    ico = build_ico()
    for target in default_targets(include_favicon=not args.no_favicon):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(ico)
        print(f"created {target.relative_to(ROOT)} ({len(ico)} bytes)")
    for size, target in web_icon_targets():
        target.parent.mkdir(parents=True, exist_ok=True)
        png = rgba_to_png(draw_icon(size), size, size)
        target.write_bytes(png)
        print(f"created {target.relative_to(ROOT)} ({len(png)} bytes)")
    print("icon sizes: " + ", ".join(f"{size}x{size}" for size in ICON_SIZES))
    print("web icon sizes: " + ", ".join(f"{size}x{size}" for size in WEB_ICON_SIZES))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
