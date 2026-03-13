#!/usr/bin/env python3
"""
Generate sci-fi themed playing card images for a 52-card deck.

Design:
- 222×323 RGBA (transparent background)
- Dark space background per suit with procedural starfield
- Suit palette: Hearts=neon crimson, Diamonds=neon orange-red,
                Clubs=neon green, Spades=neon cyan
- Number cards (2-10): standard pip layout with glowing suit symbols
- Aces: oversized glowing suit sigil + orbital circuit ring
- Face cards (J/Q/K): alien humanoid figures with neon armor
- Corner indices: rank + suit with neon glow, top-left and bottom-right
"""

import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter

# ── Constants ─────────────────────────────────────────────────────────────────
W, H = 222, 323
RADIUS = 14  # corner-rounded rectangle radius

SUIT_ACCENT = {
    "S": (60,  220, 255),   # neon cyan
    "H": (242,  70,  95),   # neon crimson
    "D": (240, 130,  55),   # neon orange-red
    "C": (55,  245, 110),   # neon green
}
SUIT_BG = {
    "S": (4,   10,  22),    # deep navy
    "H": (22,   4,   8),    # deep maroon
    "D": (22,  10,   4),    # deep amber-black
    "C": (4,   18,   8),    # deep forest-black
}

RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
SUITS = ["S", "H", "D", "C"]

# Pip (x, y) positions as fractions of (W, H) for each rank
# Positions are normalised to [0,1]; actual coords = (int(x*W), int(y*H))
PIP_POSITIONS = {
    "A":  [(0.5, 0.5)],
    "2":  [(0.5, 0.27), (0.5, 0.73)],
    "3":  [(0.5, 0.22), (0.5, 0.5),  (0.5, 0.78)],
    "4":  [(0.32, 0.27), (0.68, 0.27), (0.32, 0.73), (0.68, 0.73)],
    "5":  [(0.32, 0.25), (0.68, 0.25), (0.5, 0.5),
           (0.32, 0.75), (0.68, 0.75)],
    "6":  [(0.32, 0.25), (0.68, 0.25),
           (0.32, 0.5),  (0.68, 0.5),
           (0.32, 0.75), (0.68, 0.75)],
    "7":  [(0.32, 0.22), (0.68, 0.22), (0.5, 0.38),
           (0.32, 0.54), (0.68, 0.54),
           (0.32, 0.73), (0.68, 0.73)],
    "8":  [(0.32, 0.22), (0.68, 0.22), (0.5,  0.36),
           (0.32, 0.50), (0.68, 0.50),
           (0.5,  0.64), (0.32, 0.78), (0.68, 0.78)],
    "9":  [(0.32, 0.20), (0.68, 0.20),
           (0.32, 0.38), (0.68, 0.38),
           (0.5,  0.50),
           (0.32, 0.62), (0.68, 0.62),
           (0.32, 0.80), (0.68, 0.80)],
    "10": [(0.32, 0.18), (0.68, 0.18), (0.5, 0.30),
           (0.32, 0.42), (0.68, 0.42),
           (0.32, 0.58), (0.68, 0.58),
           (0.5,  0.70), (0.32, 0.82), (0.68, 0.82)],
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _rng(seed: int) -> random.Random:
    return random.Random(seed)


def _alpha(color, a: int):
    return (*color, a)


def add_starfield(img: Image.Image, suit: str, seed: int = 0) -> None:
    """Scatter small white/cyan dots as stars."""
    rng = _rng(seed)
    accent = SUIT_ACCENT[suit]
    draw = ImageDraw.Draw(img, "RGBA")
    for _ in range(60):
        sx = rng.randint(4, W - 4)
        sy = rng.randint(4, H - 4)
        brightness = rng.randint(80, 200)
        size = rng.choice([1, 1, 1, 2])
        col = (brightness, brightness, brightness, rng.randint(120, 220))
        if rng.random() < 0.25:
            col = (*accent, rng.randint(100, 180))
        draw.ellipse([sx, sy, sx + size, sy + size], fill=col)


def draw_rounded_border(img: Image.Image, suit: str) -> None:
    """Draw a rounded-rect border with neon glow."""
    accent = SUIT_ACCENT[suit]
    draw = ImageDraw.Draw(img, "RGBA")
    for width, alpha in [(6, 40), (4, 80), (2, 160), (1, 255)]:
        col = (*accent, alpha)
        draw.rounded_rectangle(
            [width // 2, width // 2, W - width // 2, H - width // 2],
            radius=RADIUS,
            outline=col,
            width=1,
        )


def draw_suit_symbol(draw: ImageDraw.Draw, suit: str,
                     cx: int, cy: int, size: int,
                     accent, alpha: int = 255,
                     glow: bool = True) -> None:
    """Draw a parametric suit symbol centred at (cx, cy) with given half-size."""
    col = (*accent, alpha)

    if glow:
        gcol = (*accent, alpha // 4)
        _draw_suit_raw(draw, suit, cx, cy, int(size * 1.35), gcol)
        gcol2 = (*accent, alpha // 2)
        _draw_suit_raw(draw, suit, cx, cy, int(size * 1.15), gcol2)

    _draw_suit_raw(draw, suit, cx, cy, size, col)


def _draw_suit_raw(draw: ImageDraw.Draw, suit: str,
                   cx: int, cy: int, size: int, col) -> None:
    s = size
    if suit == "H":
        # Heart: two circles + triangle
        lx, rx = cx - s // 2, cx + s // 2
        ty = cy - s // 2
        by = cy + int(s * 0.55)
        draw.ellipse([lx - s // 2, ty - s // 3, lx + s // 2, ty + s // 2], fill=col)
        draw.ellipse([rx - s // 2, ty - s // 3, rx + s // 2, ty + s // 2], fill=col)
        draw.polygon([(cx - s, ty + s // 4),
                      (cx + s, ty + s // 4),
                      (cx, by)], fill=col)
    elif suit == "D":
        # Diamond: rotated square
        draw.polygon([(cx, cy - s),
                      (cx + int(s * 0.7), cy),
                      (cx, cy + s),
                      (cx - int(s * 0.7), cy)], fill=col)
    elif suit == "S":
        # Spade: inverted heart + stem
        lx, rx = cx - s // 2, cx + s // 2
        ty = cy - int(s * 0.4)
        draw.polygon([(cx, cy - s),
                      (cx + s, ty + s // 2),
                      (cx - s, ty + s // 2)], fill=col)
        draw.ellipse([lx - s // 2, ty, lx + s // 2, ty + s], fill=col)
        draw.ellipse([rx - s // 2, ty, rx + s // 2, ty + s], fill=col)
        stem_x = int(s * 0.4)
        draw.rectangle([cx - stem_x, cy + s // 4,
                        cx + stem_x, cy + s], fill=col)
        draw.rectangle([cx - s // 2, cy + s - 2,
                        cx + s // 2, cy + s + 2], fill=col)
    elif suit == "C":
        # Club: three circles + stem
        for dx, dy in [(-s // 2, 0), (s // 2, 0), (0, -int(s * 0.55))]:
            r = int(s * 0.5)
            draw.ellipse([cx + dx - r, cy + dy - r,
                          cx + dx + r, cy + dy + r], fill=col)
        stem_x = int(s * 0.35)
        draw.rectangle([cx - stem_x, cy + s // 5,
                        cx + stem_x, cy + s], fill=col)
        draw.rectangle([cx - s // 2, cy + s - 2,
                        cx + s // 2, cy + s + 2], fill=col)


def draw_rank_text(draw: ImageDraw.Draw, rank: str, suit: str,
                   x: int, y: int, size: int,
                   accent, alpha: int = 255) -> None:
    """Render rank text using simple pixel patterns at given top-left (x, y)."""
    col = (*accent, alpha)
    # pixel-art glyphs stored as rows of binary bits
    glyphs = {
        "A": ["010", "101", "111", "101", "101"],
        "2": ["110", "001", "010", "100", "111"],
        "3": ["110", "001", "110", "001", "110"],
        "4": ["101", "101", "111", "001", "001"],
        "5": ["111", "100", "110", "001", "110"],
        "6": ["011", "100", "110", "101", "010"],
        "7": ["111", "001", "010", "010", "010"],
        "8": ["010", "101", "010", "101", "010"],
        "9": ["010", "101", "011", "001", "110"],
        "10": ["11 010", "10 111", "10 001", "10 110", "11 010"],
        "J": ["011", "001", "001", "101", "010"],
        "Q": ["010", "101", "101", "110", "011"],
        "K": ["101", "110", "100", "110", "101"],
    }
    glyph = glyphs.get(rank, [])
    if not glyph:
        return
    # determine grid width from first row
    gw = len(glyph[0])
    gh = len(glyph)
    px = max(1, size // max(gw, gh))
    for row_i, row_bits in enumerate(glyph):
        for col_i, bit in enumerate(row_bits):
            if bit == "1":
                rx0 = x + col_i * px
                ry0 = y + row_i * px
                draw.rectangle([rx0, ry0, rx0 + px - 1, ry0 + px - 1], fill=col)


def draw_corner_index(img: Image.Image, rank: str, suit: str,
                      accent, flipped: bool = False) -> None:
    """Draw rank + mini suit in a corner; if flipped, rotate 180°."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    margin = 8
    text_size = 4   # pixel per bit in glyph
    suit_size = 9   # half-size for corner suit icon

    # rank
    draw_rank_text(draw, rank, suit, margin, margin,
                   text_size, accent, alpha=255)
    # suit icon below rank label
    glyph_h = 5 * text_size + 2
    draw_suit_symbol(draw, suit, margin + suit_size, margin + glyph_h + suit_size,
                     suit_size, accent, alpha=220, glow=False)

    if flipped:
        overlay = overlay.rotate(180)
    img.alpha_composite(overlay)


def draw_circuit_ring(draw: ImageDraw.Draw, cx: int, cy: int,
                      r: int, accent, n_nodes: int = 8) -> None:
    """Orbital circuit node ring around (cx, cy) with radius r."""
    col_line = (*accent, 60)
    col_node = (*accent, 180)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                 outline=(*accent, 50), width=1)
    for i in range(n_nodes):
        angle = 2 * math.pi * i / n_nodes
        nx = cx + int(r * math.cos(angle))
        ny = cy + int(r * math.sin(angle))
        draw.ellipse([nx - 3, ny - 3, nx + 3, ny + 3], fill=col_node)
        # tick line toward center
        tx = cx + int((r - 12) * math.cos(angle))
        ty = cy + int((r - 12) * math.sin(angle))
        draw.line([nx, ny, tx, ty], fill=col_line, width=1)


def draw_hex_circuit(draw: ImageDraw.Draw, cx: int, cy: int,
                     size: int, accent) -> None:
    """Small hexagonal circuit motif centred at (cx, cy)."""
    col = (*accent, 55)
    verts = [
        (cx + int(size * math.cos(math.radians(a))),
         cy + int(size * math.sin(math.radians(a))))
        for a in range(0, 360, 60)
    ]
    draw.polygon(verts, outline=col)
    for v in verts:
        draw.line([cx, cy, *v], fill=col, width=1)


# ── Face card artwork ─────────────────────────────────────────────────────────

def draw_face_card_art(draw: ImageDraw.Draw, rank: str, suit: str,
                       accent) -> None:
    """Draw alien humanoid artwork for J/Q/K face cards."""
    col = (*accent, 220)
    col_dim = (*accent, 90)
    col_dark = (*[max(0, c - 30) for c in accent], 180)

    # Body centre
    bx, by = W // 2, H // 2 + 10

    # --- Head ---
    head_r = 28
    draw.ellipse([bx - head_r, by - 80 - head_r,
                  bx + head_r, by - 80 + head_r],
                 outline=col, width=2)
    # visor / eyes (different per rank)
    if rank == "K":
        # Three eyes
        for ex in [bx - 12, bx, bx + 12]:
            draw.ellipse([ex - 4, by - 88, ex + 4, by - 80], fill=col)
        # Spiked crown
        for spike_x in range(bx - 20, bx + 21, 10):
            draw.polygon([(spike_x, by - 108 - head_r),
                          (spike_x + 5, by - 118 - head_r),
                          (spike_x + 10, by - 108 - head_r)], fill=col)
        draw.rectangle([bx - 22, by - 110 - head_r,
                        bx + 22, by - 107 - head_r], fill=col_dim)
    elif rank == "Q":
        # Arc crown + almond eyes
        draw.arc([bx - 22, by - 128 - head_r,
                  bx + 22, by - 104 - head_r],
                 start=200, end=340, fill=col, width=3)
        for ex, ew in [(bx - 13, 10), (bx + 3, 10)]:
            draw.ellipse([ex, by - 87, ex + ew, by - 82], fill=col)
    else:  # J
        # Cyclops visor
        draw.arc([bx - 18, by - 90,
                  bx + 18, by - 74],
                 start=0, end=180, fill=col, width=2)
        draw.ellipse([bx - 6, by - 86, bx + 6, by - 78], fill=col)

    # --- Neck ---
    draw.rectangle([bx - 6, by - 52, bx + 6, by - 42], fill=col_dim)

    # --- Torso / armour ---
    draw.rounded_rectangle([bx - 28, by - 42, bx + 28, by + 30],
                            radius=6, outline=col, width=2)
    # chest emblem = small suit symbol
    draw_suit_symbol(draw, suit, bx, by - 10, 12, accent, alpha=200, glow=True)

    # Armour plates
    for plate_y in [by - 35, by - 20, by - 5]:
        draw.line([bx - 26, plate_y, bx + 26, plate_y],
                  fill=col_dim, width=1)

    # --- Arms ---
    for side in [-1, 1]:
        ax = bx + side * 28
        # upper arm
        draw.line([ax, by - 35, ax + side * 14, by],
                  fill=col, width=3)
        # lower arm / biotech tentacle
        for seg in range(3):
            sx = ax + side * (14 + seg * 8)
            sy = by + seg * 10
            draw.ellipse([sx - 3, sy - 3, sx + 3, sy + 3], fill=col_dim)
            if seg < 2:
                draw.line([sx, sy, sx + side * 8, sy + 10],
                          fill=col_dim, width=1)

    # --- Lower body ---
    draw.rounded_rectangle([bx - 20, by + 30, bx + 20, by + 72],
                            radius=4, outline=col, width=1)
    # legs
    for side in [-1, 1]:
        lx = bx + side * 12
        draw.line([lx, by + 72, lx + side * 4, by + 98],
                  fill=col, width=3)

    # --- Energy aura / halo lines ---
    for angle_deg in range(0, 360, 45):
        a = math.radians(angle_deg)
        x1 = bx + int(42 * math.cos(a))
        y1 = by - 30 + int(42 * math.sin(a))
        x2 = bx + int(52 * math.cos(a))
        y2 = by - 30 + int(52 * math.sin(a))
        draw.line([x1, y1, x2, y2], fill=(*accent, 80), width=1)


# ── Main card builder ─────────────────────────────────────────────────────────

def make_card(rank: str, suit: str) -> Image.Image:
    bg_col = SUIT_BG[suit]
    accent = SUIT_ACCENT[suit]

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Background (rounded rectangle)
    bg_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_layer)
    bg_draw.rounded_rectangle([0, 0, W - 1, H - 1], radius=RADIUS,
                               fill=(*bg_col, 255))
    img.alpha_composite(bg_layer)

    # Subtle radial gradient tint toward centre
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    steps = 18
    for i in range(steps):
        frac = i / steps
        r2 = int(max(W, H) * 0.75 * (1 - frac))
        alpha = int(28 * frac)
        col = (*[min(255, c + 18) for c in bg_col], alpha)
        gdraw.ellipse([W // 2 - r2, H // 2 - r2,
                       W // 2 + r2, H // 2 + r2], fill=col)
    img.alpha_composite(grad)

    # Starfield
    add_starfield(img, suit, seed=ord(rank[0]) * 13 + ord(suit) * 7)

    # Neon border
    draw_rounded_border(img, suit)

    # Central artwork
    draw_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(draw_layer)

    if rank == "A":
        # Oversized suit sigil
        draw_suit_symbol(draw, suit, W // 2, H // 2, 52, accent,
                         alpha=240, glow=True)
        # Orbital circuit ring
        draw_circuit_ring(draw, W // 2, H // 2, 80, accent, n_nodes=12)

    elif rank in ("J", "Q", "K"):
        draw_face_card_art(draw, rank, suit, accent)

    else:
        # Number card: hex circuit motif in centre + pips
        draw_hex_circuit(draw, W // 2, H // 2, 32, accent)

        pip_size = 13 if rank in ("2", "3") else 11
        for (fx, fy) in PIP_POSITIONS[rank]:
            px = int(fx * W)
            py = int(fy * H)
            draw_suit_symbol(draw, suit, px, py, pip_size, accent,
                             alpha=230, glow=True)

    img.alpha_composite(draw_layer)

    # Corner indices (top-left + bottom-right)
    draw_corner_index(img, rank, suit, accent, flipped=False)
    draw_corner_index(img, rank, suit, accent, flipped=True)

    # Soft vignette
    vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette)
    for ring in range(12):
        frac = ring / 12
        vig_r = int(ring * 6)
        vig_a = int(frac * 50)
        vd.rounded_rectangle(
            [vig_r, vig_r, W - vig_r, H - vig_r],
            radius=max(2, RADIUS - ring),
            outline=(0, 0, 0, vig_a),
            width=2,
        )
    img.alpha_composite(vignette)

    return img


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "cards")
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)

    total = len(RANKS) * len(SUITS)
    done = 0
    for suit in SUITS:
        for rank in RANKS:
            card_id = f"{rank}{suit}"
            out_path = os.path.join(out_dir, f"{card_id}.png")
            img = make_card(rank, suit)
            img.save(out_path, optimize=True)
            done += 1
            print(f"[{done:2d}/{total}] Written {out_path}")

    print(f"\nDone — {total} sci-fi cards written to {out_dir}")


if __name__ == "__main__":
    main()
