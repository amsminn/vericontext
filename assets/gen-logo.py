"""
Generate VeriContext logo assets.

Deterministic Geometry: hash-grid lattice with a single mismatch rupture.
- Dark field, emerald accent, monospace typography
- Grid of hash-like blocks representing verified state
- One disrupted block representing fail-closed detection
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

FONTS_DIR = "/Users/chaewan/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/canvas-design/canvas-fonts"
OUT_DIR = "/Users/chaewan/dev/vericontext/assets"

# Colors
BG = "#0C0C0C"
ACCENT = "#00D26A"
MISMATCH = "#FF3B30"
WHITE = "#FFFFFF"

def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) == 8:
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4, 6))
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def load_font(name, size):
    path = os.path.join(FONTS_DIR, name)
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()


def create_hero_banner():
    """1280x640 hero banner for GitHub README / social preview."""
    W, H = 1280, 640
    img = Image.new("RGB", (W, H), hex_to_rgb(BG))
    draw = ImageDraw.Draw(img, "RGBA")

    font_hash = load_font("JetBrainsMono-Regular.ttf", 9)
    font_mono = load_font("GeistMono-Regular.ttf", 13)
    font_mono_bold = load_font("GeistMono-Bold.ttf", 14)
    font_title = load_font("BigShoulders-Bold.ttf", 80)
    font_tagline = load_font("InstrumentSans-Regular.ttf", 22)
    font_desc = load_font("InstrumentSans-Regular.ttf", 15)
    font_label = load_font("GeistMono-Regular.ttf", 10)
    font_pill = load_font("GeistMono-Regular.ttf", 11)

    # --- Subtle background dot grid ---
    for y in range(0, H, 24):
        for x in range(0, W, 24):
            cx, cy = W / 2, H / 2
            dist = math.sqrt((x - cx)**2 + (y - cy)**2)
            max_dist = math.sqrt(cx**2 + cy**2)
            fade = max(0, 1 - (dist / max_dist) * 1.4)
            if fade > 0.05:
                alpha = int(fade * 30)
                draw.ellipse([x-1, y-1, x+1, y+1], fill=(255, 255, 255, alpha))

    # --- Central verification grid (left side) ---
    cluster_x, cluster_y = 140, 170
    block_size = 30
    block_gap = 4
    cluster_cols, cluster_rows = 7, 7
    mis_row, mis_col = 4, 2

    for r in range(cluster_rows):
        for c in range(cluster_cols):
            bx = cluster_x + c * (block_size + block_gap)
            by = cluster_y + r * (block_size + block_gap)

            if r == mis_row and c == mis_col:
                # Mismatch block — shifted, red
                draw.rounded_rectangle(
                    [bx + 3, by + 3, bx + block_size + 3, by + block_size + 3],
                    radius=3,
                    fill=hex_to_rgb(MISMATCH),
                )
                # X mark
                m = 9
                draw.line([bx + m, by + m, bx + block_size - m + 3, by + block_size - m + 3],
                          fill=(255, 255, 255, 220), width=2)
                draw.line([bx + block_size - m + 3, by + m, bx + m, by + block_size - m + 3],
                          fill=(255, 255, 255, 220), width=2)
            else:
                # Verified blocks with varying opacity
                base_alpha = 100 + ((r * 7 + c * 11) % 80)
                fill_a = int(base_alpha * 0.12)
                border_a = int(base_alpha * 0.4)
                draw.rounded_rectangle(
                    [bx, by, bx + block_size, by + block_size],
                    radius=3,
                    fill=(0, 210, 106, fill_a),
                    outline=(0, 210, 106, border_a),
                    width=1
                )
                # Check marks in select blocks
                if (r + c) % 4 == 0:
                    cx_m = bx + block_size // 2
                    cy_m = by + block_size // 2
                    ca = int(base_alpha * 0.55)
                    draw.line([cx_m - 5, cy_m + 1, cx_m - 1, cy_m + 5],
                              fill=(0, 210, 106, ca), width=2)
                    draw.line([cx_m - 1, cy_m + 5, cx_m + 6, cy_m - 4],
                              fill=(0, 210, 106, ca), width=2)

    # --- Annotation from mismatch block ---
    mis_bx = cluster_x + mis_col * (block_size + block_gap) + block_size + 6
    mis_by = cluster_y + mis_row * (block_size + block_gap) + block_size // 2

    line_end_x = mis_bx + 50
    line_end_y = mis_by - 25
    draw.line([mis_bx, mis_by, line_end_x, line_end_y],
              fill=hex_to_rgb(MISMATCH), width=1)
    draw.line([line_end_x, line_end_y, line_end_x + 80, line_end_y],
              fill=hex_to_rgb(MISMATCH), width=1)
    draw.text((line_end_x + 85, line_end_y - 7), "hash_mismatch",
              fill=hex_to_rgb(MISMATCH), font=font_mono)

    # --- Citation token below grid ---
    token_y = cluster_y + cluster_rows * (block_size + block_gap) + 16
    draw.text((cluster_x, token_y),
              "[[vctx:src/handler.ts#L30-L45@",
              fill=(255, 255, 255, 100), font=font_mono)
    # Hash part in green
    offset_x = draw.textlength("[[vctx:src/handler.ts#L30-L45@", font=font_mono)
    draw.text((cluster_x + offset_x, token_y),
              "a1b2c3d4", fill=hex_to_rgb(ACCENT), font=font_mono_bold)
    offset_x2 = draw.textlength("a1b2c3d4", font=font_mono_bold)
    draw.text((cluster_x + offset_x + offset_x2, token_y),
              "]]", fill=(255, 255, 255, 100), font=font_mono)

    # --- Right side: title & tagline ---
    title_x = 580
    title_y = 190

    # Micro-label
    draw.text((title_x, title_y - 32), "DETERMINISTIC DOC VERIFICATION",
              fill=(255, 255, 255, 60), font=font_label)

    # Title
    draw.text((title_x, title_y), "vericontext",
              fill=hex_to_rgb(WHITE), font=font_title)

    # Accent underline
    title_w = draw.textlength("vericontext", font=font_title)
    ul_y = title_y + 84
    draw.rectangle([title_x, ul_y, title_x + title_w, ul_y + 3],
                   fill=hex_to_rgb(ACCENT))

    # Tagline
    draw.text((title_x, ul_y + 18), "Docs lie. Hashes don't.",
              fill=(255, 255, 255, 200), font=font_tagline)

    # Description
    draw.text((title_x, ul_y + 58),
              "Hash-based citation verification for documentation",
              fill=(255, 255, 255, 80), font=font_desc)
    draw.text((title_x, ul_y + 78),
              "that must stay true to code.",
              fill=(255, 255, 255, 80), font=font_desc)

    # --- Feature pills ---
    pills = ["fail-closed", "SHA-256", "root-jail", "MCP", "CLI"]
    pill_x = title_x
    pill_y = ul_y + 120

    for pill_text in pills:
        tw = draw.textlength(pill_text, font=font_pill)
        pw = tw + 16
        draw.rounded_rectangle(
            [pill_x, pill_y, pill_x + pw, pill_y + 24],
            radius=4,
            fill=(0, 210, 106, 18),
            outline=(0, 210, 106, 70)
        )
        draw.text((pill_x + 8, pill_y + 5), pill_text,
                  fill=(0, 210, 106, 190), font=font_pill)
        pill_x += pw + 12

    # --- Bottom accent bar ---
    draw.rectangle([0, H - 2, W, H], fill=hex_to_rgb(ACCENT))

    img.save(os.path.join(OUT_DIR, "hero-banner.png"), quality=95)
    print("hero-banner.png created")


def create_logo(variant="dark"):
    """Logo with grid icon + wordmark."""
    W, H = 480, 160
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    font_title = load_font("BigShoulders-Bold.ttf", 60)

    is_dark = (variant == "dark")
    text_color = (255, 255, 255, 235) if is_dark else (15, 15, 15, 235)
    grid_fill = (0, 210, 106, 50) if is_dark else (0, 180, 90, 70)
    grid_border = (0, 210, 106, 130) if is_dark else (0, 160, 80, 160)
    mis_color = (255, 59, 48, 210)

    # Grid icon (4x4)
    grid_x, grid_y = 30, 22
    block = 22
    g = 4

    for r in range(4):
        for c in range(4):
            bx = grid_x + c * (block + g)
            by = grid_y + r * (block + g)
            if r == 2 and c == 3:
                draw.rounded_rectangle(
                    [bx + 2, by + 2, bx + block + 2, by + block + 2],
                    radius=3, fill=mis_color
                )
            else:
                draw.rounded_rectangle(
                    [bx, by, bx + block, by + block],
                    radius=3, fill=grid_fill, outline=grid_border, width=1
                )

    # Wordmark
    text_x = grid_x + 4 * (block + g) + 20
    text_y = (H - 60) // 2 - 2
    draw.text((text_x, text_y), "vericontext", fill=text_color, font=font_title)

    img.save(os.path.join(OUT_DIR, f"logo-{variant}.png"))
    print(f"logo-{variant}.png created")


def create_logo_mark():
    """256x256 standalone icon."""
    S = 256
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    margin = 24
    block_count = 4
    total = S - margin * 2
    block_size = (total - (block_count - 1) * 6) // block_count
    gap = 6

    mis_r, mis_c = 2, 3

    for r in range(block_count):
        for c in range(block_count):
            bx = margin + c * (block_size + gap)
            by = margin + r * (block_size + gap)
            if r == mis_r and c == mis_c:
                draw.rounded_rectangle(
                    [bx + 3, by + 3, bx + block_size + 3, by + block_size + 3],
                    radius=5, fill=(255, 59, 48, 220)
                )
            else:
                alpha = 120 + ((r * 5 + c * 3) % 80)
                draw.rounded_rectangle(
                    [bx, by, bx + block_size, by + block_size],
                    radius=5,
                    fill=(0, 210, 106, int(alpha * 0.18)),
                    outline=(0, 210, 106, alpha),
                    width=2
                )

    img.save(os.path.join(OUT_DIR, "logo-mark.png"))
    print("logo-mark.png created")


if __name__ == "__main__":
    create_hero_banner()
    create_logo("dark")
    create_logo("light")
    create_logo_mark()
    print(f"\nAll assets generated in: {OUT_DIR}")
