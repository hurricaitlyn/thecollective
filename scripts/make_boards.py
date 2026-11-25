"""Generate the two GttDrop ICU communication-board PDFs.

Usage: python3 scripts/make_boards.py
Writes to downloads/. Requires reportlab.
"""
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent.parent / "downloads"
INK = HexColor("#14213d")
MUTED = HexColor("#4a5470")
LINE = HexColor("#c9c3b5")
W, H = landscape(letter)
M = 30


def header(c, title, subtitle):
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(M, H - M - 18, title)
    c.setFont("Helvetica", 10)
    c.setFillColor(MUTED)
    c.drawString(M, H - M - 34, subtitle)
    c.drawRightString(W - M, H - M - 18, "GttDrop")


def footer(c):
    c.setFont("Helvetica", 8)
    c.setFillColor(MUTED)
    c.drawString(M, 16, "Point to what you want to say. Staff: confirm by repeating it back. "
                        "Education resource - follow your hospital's policies.")


def box(c, x, y, w, h, text, fill=None, size=16, color=INK, bold=True):
    if fill:
        c.setFillColor(fill)
        c.roundRect(x, y, w, h, 8, stroke=0, fill=1)
    c.setStrokeColor(LINE)
    c.setLineWidth(1.2)
    c.roundRect(x, y, w, h, 8, stroke=1, fill=0)
    c.setFillColor(color)
    font = "Helvetica-Bold" if bold else "Helvetica"
    lines = text.split("\n")
    widest = max(stringWidth(ln, font, size) for ln in lines)
    if widest > w - 12:  # shrink to fit the box
        size = size * (w - 12) / widest
    c.setFont(font, size)
    total = len(lines) * size * 1.15
    ty = y + h / 2 + total / 2 - size * 0.9
    for ln in lines:
        c.drawCentredString(x + w / 2, ty, ln)
        ty -= size * 1.15


def grid(c, items, x0, y0, w, h, cols, gap=8, size=14, fill=None):
    rows = (len(items) + cols - 1) // cols
    cw = (w - gap * (cols - 1)) / cols
    ch = (h - gap * (rows - 1)) / rows
    for i, t in enumerate(items):
        r, k = divmod(i, cols)
        box(c, x0 + k * (cw + gap), y0 + h - (r + 1) * ch - r * gap, cw, ch, t, fill=fill, size=size)


def needs_board(path):
    c = canvas.Canvas(str(path), pagesize=(W, H))
    c.setTitle("ICU Communication Board - Needs & Feelings")
    c.setAuthor("GttDrop")
    header(c, "ICU Communication Board - Needs & Feelings", "Point, nod, blink, or squeeze to answer.")
    top = H - M - 50
    # Yes / No
    box(c, M, top - 70, 170, 64, "YES", fill=HexColor("#1f8a5b"), size=32, color=white)
    box(c, M + 180, top - 70, 170, 64, "NO", fill=HexColor("#c0392b"), size=32, color=white)
    box(c, M + 360, top - 70, W - 2 * M - 360, 64, "I don't know        Wait        Repeat that", size=18)

    # Pain scale
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(M, top - 92, "My pain is:")
    colors = ["#e8f5ee", "#d4eedd", "#e6f2c9", "#f4f0b8", "#fbe3a6", "#fbd29a",
              "#f7b98a", "#f29e7d", "#ea7f72", "#de5f66", "#c9405a"]
    cw = (W - 2 * M - 10 * 5) / 11
    for n in range(11):
        box(c, M + n * (cw + 5), top - 150, cw, 50, str(n), fill=HexColor(colors[n]), size=22)
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(M, top - 162, "0 = no pain")
    c.drawRightString(W - M, top - 162, "10 = worst pain")

    # Needs + feelings
    needs = ["Pain medicine", "Suction", "Water / mouth\nswab", "Turn me", "Too hot", "Too cold",
             "Bathroom", "Glasses /\nhearing aid", "Call my family", "Lights off", "Itchy", "Can't breathe"]
    feelings = ["Scared", "Tired", "Sad", "Frustrated", "Confused", "OK / Better"]
    gw = (W - 2 * M) * 0.64
    grid_h = top - 175 - 40
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(INK)
    c.drawString(M, top - 178, "I need:")
    grid(c, needs, M, 40, gw, grid_h - 10, 4, size=14)
    fx = M + gw + 14
    c.drawString(fx, top - 178, "I feel:")
    grid(c, feelings, fx, 40, W - M - fx, grid_h - 10, 2, size=14, fill=HexColor("#f3efe6"))
    footer(c)

    # Page 2: body map
    c.showPage()
    header(c, "Where does it hurt?", "Point to the area. Staff: document location and pain score.")
    parts = ["Head", "Eyes", "Mouth / throat", "Neck", "Chest", "Back", "Stomach", "Arm (left)",
             "Arm (right)", "Hand", "Hip", "Leg (left)", "Leg (right)", "Foot", "Breathing tube",
             "IV / line site", "Skin", "Everywhere"]
    grid(c, parts, M, 40, W - 2 * M, H - 2 * M - 70, 6, size=16)
    footer(c)
    c.save()


def alphabet_board(path):
    c = canvas.Canvas(str(path), pagesize=(W, H))
    c.setTitle("ICU Communication Board - Alphabet & Phrases")
    c.setAuthor("GttDrop")
    header(c, "ICU Communication Board - Alphabet & Phrases", "Spell a word letter by letter. Staff: say each letter aloud as it's chosen.")
    top = H - M - 50
    letters = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    grid(c, letters, M, top - 260, W - 2 * M, 255, 9, size=30)
    nums = [str(n) for n in range(10)] + ["SPACE", "DELETE"]
    grid(c, nums, M, top - 330, W - 2 * M, 60, 12, size=18, fill=HexColor("#f3efe6"))
    phrases = ["What happened to me?", "Where am I?", "What day is it?", "When can the tube\ncome out?",
               "Is my family here?", "I want to sleep", "Please explain", "Thank you"]
    grid(c, phrases, M, 40, W - 2 * M, top - 345 - 40, 4, size=14)
    footer(c)
    c.save()


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    needs_board(OUT / "icu-communication-board-needs.pdf")
    alphabet_board(OUT / "icu-communication-board-alphabet.pdf")
    print("Wrote boards to", OUT)
