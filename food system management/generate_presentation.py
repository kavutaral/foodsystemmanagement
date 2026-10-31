"""
TasteCrave Presentation & Screenshot Generator (Rich Full-Bleed Layouts)
Covers the whole slide with structured cards, metrics, features, and screenshots.
"""

import os
import zlib
import struct
import zipfile

# -------------------------------------------------------------
# 1. LIGHTWEIGHT NATIVE PYTHON PNG GRAPHICS ENGINE
# -------------------------------------------------------------

class Canvas:
    def __init__(self, width, height, bg=(248, 250, 252, 255)):
        self.width = width
        self.height = height
        self.pixels = bytearray(bg * (width * height))

    def set_pixel(self, x, y, color):
        if 0 <= x < self.width and 0 <= y < self.height:
            idx = (y * self.width + x) * 4
            self.pixels[idx:idx+4] = color

    def fill_rect(self, x, y, w, h, color):
        x1 = max(0, int(x))
        y1 = max(0, int(y))
        x2 = min(self.width, int(x + w))
        y2 = min(self.height, int(y + h))
        if x1 >= x2 or y1 >= y2:
            return
        row = color * (x2 - x1)
        for cur_y in range(y1, y2):
            idx = (cur_y * self.width + x1) * 4
            self.pixels[idx:idx + len(row)] = row

    def draw_rect_border(self, x, y, w, h, color, border_width=1):
        self.fill_rect(x, y, w, border_width, color)
        self.fill_rect(x, y + h - border_width, w, border_width, color)
        self.fill_rect(x, y, border_width, h, color)
        self.fill_rect(x + w - border_width, y, border_width, h, color)

    def draw_circle(self, cx, cy, r, color):
        cx, cy, r = int(cx), int(cy), int(r)
        for y in range(max(0, cy - r), min(self.height, cy + r + 1)):
            for x in range(max(0, cx - r), min(self.width, cx + r + 1)):
                if (x - cx)**2 + (y - cy)**2 <= r**2:
                    self.set_pixel(x, y, color)

    def draw_rounded_rect(self, x, y, w, h, r, color):
        x, y, w, h, r = int(x), int(y), int(w), int(h), int(r)
        self.fill_rect(x + r, y, w - 2*r, h, color)
        self.fill_rect(x, y + r, r, h - 2*r, color)
        self.fill_rect(x + w - r, y + r, r, h - 2*r, color)
        self.draw_circle(x + r, y + r, r, color)
        self.draw_circle(x + w - r, y + r, r, color)
        self.draw_circle(x + r, y + h - r, r, color)
        self.draw_circle(x + w - r, y + h - r, r, color)

    FONT = {
        'A': [" █ ", "█ █", "███", "█ █", "█ █"],
        'B': ["██ ", "█ █", "██ ", "█ █", "██ "],
        'C': [" ██", "█  ", "█  ", "█  ", " ██"],
        'D': ["██ ", "█ █", "█ █", "█ █", "██ "],
        'E': ["███", "█  ", "██ ", "█  ", "███"],
        'F': ["███", "█  ", "██ ", "█  ", "█  "],
        'G': [" ██", "█  ", "█ █", "█ █", " ██"],
        'H': ["█ █", "█ █", "███", "█ █", "█ █"],
        'I': ["███", " █ ", " █ ", " █ ", "███"],
        'J': ["  █", "  █", "  █", "█ █", " █ "],
        'K': ["█ █", "██ ", "█  ", "██ ", "█ █"],
        'L': ["█  ", "█  ", "█  ", "█  ", "███"],
        'M': ["█ █", "███", "█ █", "█ █", "█ █"],
        'N': ["█ █", "███", "███", "█ █", "█ █"],
        'O': [" █ ", "█ █", "█ █", "█ █", " █ "],
        'P': ["██ ", "█ █", "██ ", "█  ", "█  "],
        'Q': [" █ ", "█ █", "█ █", "██ ", "  █"],
        'R': ["██ ", "█ █", "██ ", "█ █", "█ █"],
        'S': [" ██", "█  ", " █ ", "  █", "██ "],
        'T': ["███", " █ ", " █ ", " █ ", " █ "],
        'U': ["█ █", "█ █", "█ █", "█ █", " █ "],
        'V': ["█ █", "█ █", "█ █", " █ ", " █ "],
        'W': ["█ █", "█ █", "█ █", "███", "█ █"],
        'X': ["█ █", " █ ", " █ ", " █ ", "█ █"],
        'Y': ["█ █", " █ ", " █ ", " █ ", " █ "],
        'Z': ["███", "  █", " █ ", "█  ", "███"],
        '0': [" █ ", "█ █", "█ █", "█ █", " █ "],
        '1': [" █ ", "██ ", " █ ", " █ ", "███"],
        '2': ["██ ", "  █", " █ ", "█  ", "███"],
        '3': ["██ ", "  █", "██ ", "  █", "██ "],
        '4': ["█ █", "█ █", "███", "  █", "  █"],
        '5': ["███", "█  ", "██ ", "  █", "██ "],
        '6': [" █ ", "█  ", "██ ", "█ █", " █ "],
        '7': ["███", "  █", " █ ", " █ ", " █ "],
        '8': [" █ ", "█ █", " █ ", "█ █", " █ "],
        '9': [" █ ", "█ █", " ██", "  █", " █ "],
        ' ': ["   ", "   ", "   ", "   ", "   "],
        ':': ["   ", " █ ", "   ", " █ ", "   "],
        '-': ["   ", "   ", "███", "   ", "   "],
        '.': ["   ", "   ", "   ", "   ", " █ "],
        '/': ["  █", " █ ", " █ ", "█  ", "█  "],
        '$': [" █ ", "███", " █ ", "███", " █ "],
        '%': ["█ █", "  █", " █ ", "█  ", "█ █"],
        '+': ["   ", " █ ", "███", " █ ", "   "],
        '(': [" █ ", "█  ", "█  ", "█  ", " █ "],
        ')': [" █ ", "  █", "  █", "  █", " █ "],
        '*': ["█ █", " █ ", "███", " █ ", "█ █"]
    }

    def draw_text(self, text, x, y, color, scale=2):
        cur_x = x
        for ch in text.upper():
            glyph = self.FONT.get(ch, self.FONT[' '])
            for row_idx, row in enumerate(glyph):
                for col_idx, pixel in enumerate(row):
                    if pixel == '█':
                        self.fill_rect(cur_x + col_idx * scale, y + row_idx * scale, scale, scale, color)
            cur_x += (len(glyph[0]) + 1) * scale

    def to_png(self):
        raw = bytearray()
        row_len = self.width * 4
        for y in range(self.height):
            raw.append(0)
            start = y * row_len
            raw.extend(self.pixels[start:start + row_len])
        compressed = zlib.compress(raw, level=6)

        png = bytearray(b'\x89PNG\r\n\x1a\n')
        ihdr = struct.pack('>IIBBBBB', self.width, self.height, 8, 6, 0, 0, 0)
        png.extend(struct.pack('>I', len(ihdr)) + b'IHDR' + ihdr + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr)))
        png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', zlib.crc32(b'IDAT' + compressed)))
        png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND')))
        return bytes(png)


def draw_browser_frame(c, title="TasteCrave - http://localhost:3000"):
    c.fill_rect(0, 0, c.width, 36, (226, 232, 240, 255))
    c.draw_circle(16, 18, 5, (239, 68, 68, 255))
    c.draw_circle(32, 18, 5, (245, 158, 11, 255))
    c.draw_circle(48, 18, 5, (16, 185, 129, 255))
    c.draw_rounded_rect(70, 7, c.width - 140, 22, 4, (255, 255, 255, 255))
    c.draw_text(title, 82, 11, (100, 116, 139, 255), scale=1)
    c.fill_rect(0, 36, c.width, 48, (255, 255, 255, 255))
    c.fill_rect(0, 83, c.width, 1, (226, 232, 240, 255))
    c.draw_text("TASTECRAVE", 20, 52, (255, 82, 26, 255), scale=2)
    c.draw_rounded_rect(200, 48, 280, 24, 12, (241, 245, 249, 255))
    c.draw_text("DELIVERING TO: 742 EVERGREEN TERRACE", 212, 55, (71, 85, 105, 255), scale=1)
    c.draw_rounded_rect(c.width - 150, 46, 130, 28, 14, (255, 82, 26, 255))
    c.draw_text("CART (3) $38.47", c.width - 140, 53, (255, 255, 255, 255), scale=1)


SCREENSHOTS_DIR = 'presentation_screenshots'
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def generate_screen_menu():
    c = Canvas(800, 500)
    draw_browser_frame(c, "TasteCrave | Artisanal Food Menu")
    c.draw_rounded_rect(20, 96, 760, 110, 8, (15, 23, 42, 255))
    c.draw_text("SAVOR GOURMET DINING DELIVERED IN 25 MINS", 40, 114, (255, 120, 73, 255), scale=2)
    c.draw_text("HANDCRAFTED ARTISANAL BURGERS, PIZZAS & BOWLS BY MASTER CHEFS", 40, 140, (203, 213, 225, 255), scale=1)
    c.draw_rounded_rect(40, 165, 170, 26, 4, (255, 82, 26, 100))
    c.draw_rect_border(40, 165, 170, 26, (255, 82, 26, 255), 1)
    c.draw_text("PROMO: TASTY20 (20% OFF)", 50, 172, (255, 255, 255, 255), scale=1)

    cats = ["ALL DISHES", "BURGERS", "PIZZAS", "ASIAN BOWLS", "TACOS", "SALADS", "DESSERTS", "DRINKS"]
    x_pos = 20
    for i, cat in enumerate(cats):
        bg = (255, 82, 26, 255) if i == 0 else (255, 255, 255, 255)
        fg = (255, 255, 255, 255) if i == 0 else (71, 85, 105, 255)
        w = len(cat) * 8 + 18
        c.draw_rounded_rect(x_pos, 218, w, 26, 13, bg)
        c.draw_rect_border(x_pos, 218, w, 26, (226, 232, 240, 255), 1)
        c.draw_text(cat, x_pos + 10, 226, fg, scale=1)
        x_pos += w + 8

    c.draw_rounded_rect(20, 254, 760, 36, 6, (255, 255, 255, 255))
    c.draw_rect_border(20, 254, 760, 36, (226, 232, 240, 255), 1)
    c.draw_text("SEARCH: TRUFFLE...", 36, 266, (148, 163, 184, 255), scale=1)
    c.draw_rounded_rect(340, 260, 80, 24, 12, (236, 253, 245, 255))
    c.draw_text("PURE VEG", 350, 266, (5, 150, 105, 255), scale=1)
    c.draw_rounded_rect(430, 260, 65, 24, 12, (240, 253, 244, 255))
    c.draw_text("VEGAN", 442, 266, (22, 163, 74, 255), scale=1)
    c.draw_rounded_rect(505, 260, 65, 24, 12, (255, 247, 237, 255))
    c.draw_text("SPICY", 518, 266, (234, 88, 12, 255), scale=1)
    c.draw_rounded_rect(580, 260, 95, 24, 12, (254, 243, 199, 255))
    c.draw_text("BESTSELLER", 590, 266, (180, 83, 9, 255), scale=1)

    card_w = 238
    for i in range(3):
        cx = 20 + i * (card_w + 23)
        cy = 302
        c.draw_rounded_rect(cx, cy, card_w, 180, 8, (255, 255, 255, 255))
        c.draw_rect_border(cx, cy, card_w, 180, (226, 232, 240, 255), 1)
        img_color = (255, 126, 95, 255) if i == 0 else ((255, 65, 108, 255) if i == 1 else (248, 87, 166, 255))
        c.draw_rounded_rect(cx, cy, card_w, 85, 8, img_color)
        c.fill_rect(cx, cy + 75, card_w, 10, img_color)
        c.draw_rounded_rect(cx + 8, cy + 8, 75, 18, 4, (15, 23, 42, 220))
        c.draw_text("BESTSELLER", cx + 12, cy + 12, (255, 255, 255, 255), scale=1)
        titles = ["TRUFFLE SMASH BURGER", "MARGHERITA PIZZA", "TONKOTSU RAMEN"]
        prices = ["$13.99", "$15.99", "$14.99"]
        c.draw_text(titles[i], cx + 10, cy + 96, (15, 23, 42, 255), scale=1)
        c.draw_text("CHEF SPECIAL RECIPE - 4.9 (412)", cx + 10, cy + 112, (100, 116, 139, 255), scale=1)
        c.draw_text(prices[i], cx + 10, cy + 148, (15, 23, 42, 255), scale=2)
        c.draw_rounded_rect(cx + card_w - 90, cy + 142, 80, 26, 4, (255, 82, 26, 255))
        c.draw_text("+ CUSTOMISE", cx + card_w - 85, cy + 149, (255, 255, 255, 255), scale=1)

    return c.to_png()


def generate_screen_customizer():
    c = Canvas(800, 500)
    draw_browser_frame(c, "TasteCrave | Customise Your Dish")
    c.fill_rect(0, 84, c.width, c.height - 84, (15, 23, 42, 160))
    mx, my, mw, mh = 160, 105, 480, 375
    c.draw_rounded_rect(mx, my, mw, mh, 10, (255, 255, 255, 255))
    c.fill_rect(mx, my, mw, 42, (248, 250, 252, 255))
    c.draw_rect_border(mx, my, mw, 42, (226, 232, 240, 255), 1)
    c.draw_text("CUSTOMISE YOUR DISH", mx + 16, my + 14, (15, 23, 42, 255), scale=2)
    c.draw_text("X", mx + mw - 26, my + 14, (100, 116, 139, 255), scale=2)

    c.draw_rounded_rect(mx + 16, my + 54, mw - 32, 50, 6, (241, 245, 249, 255))
    c.draw_text("SIGNATURE TRUFFLE SMASH BURGER", mx + 26, my + 64, (15, 23, 42, 255), scale=1)
    c.draw_text("ANGUS BEEF, BLACK TRUFFLE BUTTER, CARAMELIZED ONIONS", mx + 26, my + 80, (100, 116, 139, 255), scale=1)

    c.draw_text("1. CHOOSE SIZE (REQUIRED):", mx + 16, my + 116, (15, 23, 42, 255), scale=1)
    c.draw_rounded_rect(mx + 16, my + 130, mw - 32, 28, 4, (255, 242, 237, 255))
    c.draw_rect_border(mx + 16, my + 130, mw - 32, 28, (255, 82, 26, 255), 1)
    c.draw_circle(mx + 30, my + 144, 5, (255, 82, 26, 255))
    c.draw_text("REGULAR SINGLE PATTY", mx + 46, my + 138, (15, 23, 42, 255), scale=1)
    c.draw_text("INCLUDED", mx + mw - 95, my + 138, (100, 116, 139, 255), scale=1)

    c.draw_rounded_rect(mx + 16, my + 162, mw - 32, 28, 4, (255, 255, 255, 255))
    c.draw_rect_border(mx + 16, my + 162, mw - 32, 28, (226, 232, 240, 255), 1)
    c.draw_circle(mx + 30, my + 176, 5, (203, 213, 225, 255))
    c.draw_text("DOUBLE DELUXE (+PATTY)", mx + 46, my + 170, (15, 23, 42, 255), scale=1)
    c.draw_text("+$3.50", mx + mw - 75, my + 170, (255, 82, 26, 255), scale=1)

    c.draw_text("2. ADD EXTRAS & TOPPINGS (OPTIONAL):", mx + 16, my + 202, (15, 23, 42, 255), scale=1)
    extras = [
        ("AGED CHEDDAR SLICE", "+$1.25", True),
        ("SMOKED BACON RASHERS", "+$1.95", True),
        ("HOUSE TRUFFLE AIOLI DIP", "+$0.75", False)
    ]
    for i, (name, price, checked) in enumerate(extras):
        ey = my + 218 + i * 30
        bg = (255, 242, 237, 255) if checked else (255, 255, 255, 255)
        border = (255, 82, 26, 255) if checked else (226, 232, 240, 255)
        c.draw_rounded_rect(mx + 16, ey, mw - 32, 26, 4, bg)
        c.draw_rect_border(mx + 16, ey, mw - 32, 26, border, 1)
        c.draw_rect_border(mx + 24, ey + 7, 12, 12, border, 1)
        if checked:
            c.fill_rect(mx + 26, ey + 9, 8, 8, (255, 82, 26, 255))
        c.draw_text(name, mx + 46, ey + 10, (15, 23, 42, 255), scale=1)
        c.draw_text(price, mx + mw - 75, ey + 10, (255, 82, 26, 255), scale=1)

    c.draw_text("SPECIAL COOKING NOTES:", mx + 16, my + 314, (15, 23, 42, 255), scale=1)
    c.draw_rounded_rect(mx + 16, my + 326, mw - 32, 22, 4, (248, 250, 252, 255))
    c.draw_rect_border(mx + 16, my + 326, mw - 32, 22, (203, 213, 225, 255), 1)
    c.draw_text("EXTRA CRISPY FRIES, SAUCE ON SIDE", mx + 24, my + 332, (71, 85, 105, 255), scale=1)

    c.draw_rounded_rect(mx + 16, my + mh - 44, mw - 32, 32, 6, (255, 82, 26, 255))
    c.draw_text("ADD TO ORDER - $17.19", mx + 150, my + mh - 34, (255, 255, 255, 255), scale=2)
    return c.to_png()


def generate_screen_cart():
    c = Canvas(800, 500)
    draw_browser_frame(c, "TasteCrave | Slide-Out Shopping Cart")
    c.fill_rect(0, 84, 460, c.height - 84, (15, 23, 42, 140))
    dx, dw = 460, 340
    c.fill_rect(dx, 84, dw, c.height - 84, (255, 255, 255, 255))
    c.draw_rect_border(dx, 84, dw, c.height - 84, (226, 232, 240, 255), 1)

    c.fill_rect(dx, 84, dw, 44, (248, 250, 252, 255))
    c.draw_text("YOUR FOOD CART (3)", dx + 16, 98, (15, 23, 42, 255), scale=2)
    c.draw_text("X", dx + dw - 28, 98, (100, 116, 139, 255), scale=2)

    c.draw_rounded_rect(dx + 12, 136, dw - 24, 38, 6, (236, 253, 245, 255))
    c.draw_rect_border(dx + 12, 136, dw - 24, 38, (167, 243, 208, 255), 1)
    c.draw_text("YOU UNLOCKED FREE DELIVERY!", dx + 22, 144, (6, 95, 70, 255), scale=1)
    c.draw_rounded_rect(dx + 22, 160, dw - 44, 6, 3, (16, 185, 129, 255))

    items = [
        ("TRUFFLE SMASH BURGER", "REGULAR + AGED CHEDDAR", "$15.24", 2),
        ("MARGHERITA PIZZA", "MEDIUM (10 INCH)", "$15.99", 1)
    ]
    for i, (name, opts, price, qty) in enumerate(items):
        iy = 186 + i * 58
        c.draw_rect_border(dx + 12, iy + 52, dw - 24, 1, (241, 245, 249, 255), 1)
        c.draw_text(name, dx + 14, iy + 6, (15, 23, 42, 255), scale=1)
        c.draw_text(opts, dx + 14, iy + 20, (100, 116, 139, 255), scale=1)
        c.draw_text(price, dx + 14, iy + 34, (255, 82, 26, 255), scale=1)
        c.draw_rounded_rect(dx + dw - 90, iy + 16, 75, 24, 4, (255, 82, 26, 255))
        c.draw_text("-", dx + dw - 82, iy + 22, (255, 255, 255, 255), scale=1)
        c.draw_text(str(qty), dx + dw - 57, iy + 22, (255, 255, 255, 255), scale=1)
        c.draw_text("+", dx + dw - 32, iy + 22, (255, 255, 255, 255), scale=1)

    c.draw_rounded_rect(dx + 12, 308, dw - 24, 26, 4, (236, 253, 245, 255))
    c.draw_rect_border(dx + 12, 308, dw - 24, 26, (167, 243, 208, 255), 1)
    c.draw_text("APPLIED: TASTY20 (-20%)", dx + 20, 316, (6, 95, 70, 255), scale=1)
    c.draw_text("REMOVE", dx + dw - 65, 316, (220, 38, 38, 255), scale=1)

    c.draw_text("DRIVER TIP: $2  $3  $5 (SELECTED: $3)", dx + 14, 342, (71, 85, 105, 255), scale=1)
    c.draw_text("SUBTOTAL:              $38.47", dx + 14, 360, (71, 85, 105, 255), scale=1)
    c.draw_text("PROMO SAVINGS:        -$7.69", dx + 14, 374, (16, 185, 129, 255), scale=1)
    c.draw_text("DELIVERY FEE:           FREE", dx + 14, 388, (16, 185, 129, 255), scale=1)
    c.draw_text("TAX (8.25%):           $2.54", dx + 14, 402, (71, 85, 105, 255), scale=1)
    c.draw_text("DRIVER TIP:            $3.00", dx + 14, 416, (71, 85, 105, 255), scale=1)
    c.draw_rect_border(dx + 12, 430, dw - 24, 1, (226, 232, 240, 255), 1)
    c.draw_text("TOTAL: $36.32", dx + 14, 438, (15, 23, 42, 255), scale=2)

    c.draw_rounded_rect(dx + 12, 458, dw - 24, 32, 6, (255, 82, 26, 255))
    c.draw_text("PROCEED TO CHECKOUT ->", dx + 45, 467, (255, 255, 255, 255), scale=2)
    return c.to_png()


def generate_screen_checkout():
    c = Canvas(800, 500)
    draw_browser_frame(c, "TasteCrave | Complete Your Order")
    c.fill_rect(0, 84, c.width, c.height - 84, (15, 23, 42, 140))
    mx, my, mw, mh = 140, 95, 520, 390
    c.draw_rounded_rect(mx, my, mw, mh, 10, (255, 255, 255, 255))
    c.fill_rect(mx, my, mw, 40, (248, 250, 252, 255))
    c.draw_text("CHECKOUT - ORDER CONFIRMATION", mx + 16, my + 13, (15, 23, 42, 255), scale=2)
    c.draw_text("X", mx + mw - 28, my + 13, (100, 116, 139, 255), scale=2)

    c.draw_text("1. DELIVERY ADDRESS & CONTACT", mx + 16, my + 52, (15, 23, 42, 255), scale=1)
    c.draw_rounded_rect(mx + 16, my + 66, 235, 26, 4, (248, 250, 252, 255))
    c.draw_rect_border(mx + 16, my + 66, 235, 26, (203, 213, 225, 255), 1)
    c.draw_text("ALEX MORGAN", mx + 24, my + 74, (15, 23, 42, 255), scale=1)

    c.draw_rounded_rect(mx + 265, my + 66, 235, 26, 4, (248, 250, 252, 255))
    c.draw_rect_border(mx + 265, my + 66, 235, 26, (203, 213, 225, 255), 1)
    c.draw_text("(555) 438-9201", mx + 273, my + 74, (15, 23, 42, 255), scale=1)

    c.draw_rounded_rect(mx + 16, my + 98, mw - 32, 26, 4, (248, 250, 252, 255))
    c.draw_rect_border(mx + 16, my + 98, mw - 32, 26, (203, 213, 225, 255), 1)
    c.draw_text("742 EVERGREEN TERRACE, APT 4B, DOWNTOWN", mx + 24, my + 106, (15, 23, 42, 255), scale=1)

    c.draw_text("2. DELIVERY SPEED", mx + 16, my + 136, (15, 23, 42, 255), scale=1)
    c.draw_rounded_rect(mx + 16, my + 150, 235, 34, 4, (255, 242, 237, 255))
    c.draw_rect_border(mx + 16, my + 150, 235, 34, (255, 82, 26, 255), 1)
    c.draw_circle(mx + 30, my + 167, 5, (255, 82, 26, 255))
    c.draw_text("STANDARD: 30-40 MIN ($3.99/FREE)", mx + 44, my + 162, (15, 23, 42, 255), scale=1)

    c.draw_rounded_rect(mx + 265, my + 150, 235, 34, 4, (255, 255, 255, 255))
    c.draw_rect_border(mx + 265, my + 150, 235, 34, (226, 232, 240, 255), 1)
    c.draw_circle(mx + 279, my + 167, 5, (203, 213, 225, 255))
    c.draw_text("PRIORITY EXPRESS: 15-25 MIN (+$2)", mx + 293, my + 162, (100, 116, 139, 255), scale=1)

    c.draw_text("3. SELECT PAYMENT METHOD", mx + 16, my + 196, (15, 23, 42, 255), scale=1)
    pay_methods = [("CREDIT/DEBIT CARD", True), ("INSTANT UPI / QR", False), ("CASH ON DELIVERY", False)]
    card_w = 156
    for i, (name, sel) in enumerate(pay_methods):
        px = mx + 16 + i * (card_w + 10)
        bg = (255, 242, 237, 255) if sel else (255, 255, 255, 255)
        border = (255, 82, 26, 255) if sel else (226, 232, 240, 255)
        c.draw_rounded_rect(px, my + 210, card_w, 36, 4, bg)
        c.draw_rect_border(px, my + 210, card_w, 36, border, 1)
        c.draw_text(name, px + 8, my + 222, (255, 82, 26, 255) if sel else (71, 85, 105, 255), scale=1)

    c.draw_rounded_rect(mx + 16, my + 254, mw - 32, 26, 4, (248, 250, 252, 255))
    c.draw_rect_border(mx + 16, my + 254, mw - 32, 26, (203, 213, 225, 255), 1)
    c.draw_text("CARD: 4532 **** **** 8891  EXP: 08/28  CVV: ***", mx + 24, my + 262, (15, 23, 42, 255), scale=1)

    c.draw_rounded_rect(mx + 16, my + 288, mw - 32, 45, 4, (241, 245, 249, 255))
    c.draw_text("ITEMS: 3 DISHES | PROMO: TASTY20 (-20%) | TIP: $3.00", mx + 24, my + 296, (71, 85, 105, 255), scale=1)
    c.draw_text("FINAL AMOUNT PAYABLE: $36.32", mx + 24, my + 312, (255, 82, 26, 255), scale=2)

    c.draw_rounded_rect(mx + 16, my + mh - 44, mw - 32, 34, 6, (16, 185, 129, 255))
    c.draw_text("CONFIRM & PLACE ORDER ($36.32)", mx + 90, my + mh - 34, (255, 255, 255, 255), scale=2)
    return c.to_png()


def generate_screen_tracker():
    c = Canvas(800, 500)
    draw_browser_frame(c, "TasteCrave | Live Order Tracking")
    c.fill_rect(0, 84, c.width, c.height - 84, (15, 23, 42, 140))
    mx, my, mw, mh = 150, 95, 500, 390
    c.draw_rounded_rect(mx, my, mw, mh, 10, (255, 255, 255, 255))

    c.draw_rounded_rect(mx + 16, my + 16, mw - 32, 90, 8, (16, 185, 129, 255))
    c.draw_text("ORDER #ORD-83116", mx + 28, my + 26, (236, 253, 245, 255), scale=1)
    c.draw_text("ARRIVING IN APPROX 20 MINS", mx + 28, my + 44, (255, 255, 255, 255), scale=2)
    c.draw_text("CHEF IS HANDCRAFTING YOUR DISHES IN THE KITCHEN", mx + 28, my + 72, (236, 253, 245, 255), scale=1)

    steps = ["PLACED", "COOKING", "ON WAY", "DELIVERED"]
    line_y = my + 145
    c.fill_rect(mx + 50, line_y, mw - 100, 4, (226, 232, 240, 255))
    c.fill_rect(mx + 50, line_y, int((mw - 100) * 0.45), 4, (16, 185, 129, 255))

    for i, step in enumerate(steps):
        sx = mx + 50 + i * int((mw - 100) / 3)
        if i == 0:
            c.draw_circle(sx, line_y + 2, 12, (16, 185, 129, 255))
            c.draw_text("V", sx - 3, line_y - 3, (255, 255, 255, 255), scale=1)
        elif i == 1:
            c.draw_circle(sx, line_y + 2, 14, (255, 82, 26, 255))
            c.draw_text("*", sx - 3, line_y - 3, (255, 255, 255, 255), scale=1)
        else:
            c.draw_circle(sx, line_y + 2, 10, (255, 255, 255, 255))
            c.draw_rect_border(sx - 10, line_y - 8, 20, 20, (203, 213, 225, 255), 2)
        fg = (255, 82, 26, 255) if i == 1 else ((16, 185, 129, 255) if i == 0 else (100, 116, 139, 255))
        c.draw_text(step, sx - len(step)*4, line_y + 20, fg, scale=1)

    c.draw_rounded_rect(mx + 16, my + 185, mw - 32, 28, 4, (255, 247, 237, 255))
    c.draw_rect_border(mx + 16, my + 185, mw - 32, 28, (254, 215, 170, 255), 1)
    c.draw_text("LIVE DEMO: CLICK TO ADVANCE STATUS ->", mx + 24, my + 193, (154, 52, 18, 255), scale=1)
    c.draw_rounded_rect(mx + mw - 140, my + 188, 115, 22, 4, (255, 82, 26, 255))
    c.draw_text("ADVANCE STEP", mx + mw - 130, my + 194, (255, 255, 255, 255), scale=1)

    c.draw_rounded_rect(mx + 16, my + 222, mw - 32, 54, 6, (241, 245, 249, 255))
    c.draw_circle(mx + 46, my + 249, 18, (203, 213, 225, 255))
    c.draw_text("ALEX RIVERA", mx + 76, my + 234, (15, 23, 42, 255), scale=1)
    c.draw_text("DELIVERY COURIER - RATING 4.9* - (555) 234-8891", mx + 76, my + 248, (100, 116, 139, 255), scale=1)
    c.draw_rounded_rect(mx + mw - 85, my + 236, 60, 26, 13, (255, 255, 255, 255))
    c.draw_rect_border(mx + mw - 85, my + 236, 60, 26, (203, 213, 225, 255), 1)
    c.draw_text("CALL", mx + mw - 68, my + 244, (15, 23, 42, 255), scale=1)

    c.draw_rounded_rect(mx + 16, my + 284, mw - 32, 42, 4, (255, 255, 255, 255))
    c.draw_rect_border(mx + 16, my + 284, mw - 32, 42, (226, 232, 240, 255), 1)
    c.draw_text("DELIVERING TO: 742 EVERGREEN TERRACE, APT 4B", mx + 24, my + 292, (15, 23, 42, 255), scale=1)
    c.draw_text("NOTE: PLEASE RING BELL TWICE, LEAVE AT DOOR", mx + 24, my + 308, (100, 116, 139, 255), scale=1)

    c.draw_rounded_rect(mx + 16, my + mh - 44, mw - 32, 32, 6, (241, 245, 249, 255))
    c.draw_text("BACK TO FOOD MENU", mx + 160, my + mh - 34, (71, 85, 105, 255), scale=2)
    return c.to_png()


def generate_screen_admin():
    c = Canvas(800, 500)
    draw_browser_frame(c, "TasteCrave | Kitchen & Staff Admin Dashboard")

    c.draw_text("KITCHEN & LIVE ORDER MANAGEMENT", 20, 96, (15, 23, 42, 255), scale=2)
    c.draw_text("REAL-TIME INCOMING ORDERS, PREPARATION WORKFLOW & STORE SALES", 20, 116, (100, 116, 139, 255), scale=1)

    metrics = [
        ("TOTAL REVENUE", "$1,482.50", (255, 82, 26, 255)),
        ("ACTIVE ORDERS", "3 COOKING", (245, 158, 11, 255)),
        ("ORDERS TODAY", "42 ORDERS", (14, 165, 233, 255)),
        ("TOP DISH", "TRUFFLE BURGER", (16, 185, 129, 255))
    ]
    card_w = 180
    for i, (title, val, color) in enumerate(metrics):
        cx = 20 + i * (card_w + 13)
        c.draw_rounded_rect(cx, 136, card_w, 56, 6, (255, 255, 255, 255))
        c.draw_rect_border(cx, 136, card_w, 56, (226, 232, 240, 255), 1)
        c.draw_text(title, cx + 12, 146, (100, 116, 139, 255), scale=1)
        c.draw_text(val, cx + 12, 164, color, scale=2)

    columns = [
        ("INCOMING (1)", (239, 246, 255, 255), (37, 99, 235, 255)),
        ("COOKING (2)", (254, 243, 199, 255), (180, 83, 9, 255)),
        ("ON WAY (1)", (255, 247, 237, 255), (234, 88, 12, 255)),
        ("DELIVERED (5)", (236, 253, 245, 255), (16, 185, 129, 255))
    ]
    col_w = 180
    for i, (col_title, col_bg, col_fg) in enumerate(columns):
        cx = 20 + i * (col_w + 13)
        c.draw_rounded_rect(cx, 206, col_w, 280, 8, (241, 245, 249, 255))
        c.draw_rounded_rect(cx + 8, 214, col_w - 16, 24, 4, col_bg)
        c.draw_text(col_title, cx + 16, 222, col_fg, scale=1)

        if i == 0:
            c.draw_rounded_rect(cx + 8, 246, col_w - 16, 110, 6, (255, 255, 255, 255))
            c.draw_rect_border(cx + 8, 246, col_w - 16, 110, (226, 232, 240, 255), 1)
            c.draw_text("#ORD-83119", cx + 14, 254, (15, 23, 42, 255), scale=1)
            c.draw_text("SARAH J. ($28.50)", cx + 14, 268, (100, 116, 139, 255), scale=1)
            c.draw_text("2X TRUFFLE BURGER", cx + 14, 284, (15, 23, 42, 255), scale=1)
            c.draw_rounded_rect(cx + 14, 318, col_w - 28, 24, 4, (255, 82, 26, 255))
            c.draw_text("START COOKING", cx + 24, 325, (255, 255, 255, 255), scale=1)

        elif i == 1:
            c.draw_rounded_rect(cx + 8, 246, col_w - 16, 110, 6, (255, 255, 255, 255))
            c.draw_rect_border(cx + 8, 246, col_w - 16, 110, (226, 232, 240, 255), 1)
            c.draw_text("#ORD-83116", cx + 14, 254, (15, 23, 42, 255), scale=1)
            c.draw_text("ALEX M. ($36.32)", cx + 14, 268, (100, 116, 139, 255), scale=1)
            c.draw_text("1X SMASH BURGER", cx + 14, 284, (15, 23, 42, 255), scale=1)
            c.draw_text("1X MARGHERITA", cx + 14, 298, (15, 23, 42, 255), scale=1)
            c.draw_rounded_rect(cx + 14, 318, col_w - 28, 24, 4, (14, 165, 233, 255))
            c.draw_text("HAND TO DRIVER", cx + 22, 325, (255, 255, 255, 255), scale=1)

        elif i == 2:
            c.draw_rounded_rect(cx + 8, 246, col_w - 16, 110, 6, (255, 255, 255, 255))
            c.draw_rect_border(cx + 8, 246, col_w - 16, 110, (226, 232, 240, 255), 1)
            c.draw_text("#ORD-83112", cx + 14, 254, (15, 23, 42, 255), scale=1)
            c.draw_text("MICHAEL K. ($24.00)", cx + 14, 268, (100, 116, 139, 255), scale=1)
            c.draw_text("DRIVER: ALEX R.", cx + 14, 284, (234, 88, 12, 255), scale=1)
            c.draw_rounded_rect(cx + 14, 318, col_w - 28, 24, 4, (16, 185, 129, 255))
            c.draw_text("MARK DELIVERED", cx + 20, 325, (255, 255, 255, 255), scale=1)

        elif i == 3:
            c.draw_rounded_rect(cx + 8, 246, col_w - 16, 80, 6, (255, 255, 255, 255))
            c.draw_rect_border(cx + 8, 246, col_w - 16, 80, (226, 232, 240, 255), 1)
            c.draw_text("#ORD-83108", cx + 14, 254, (15, 23, 42, 255), scale=1)
            c.draw_text("DELIVERED 12M AGO", cx + 14, 268, (16, 185, 129, 255), scale=1)
            c.draw_text("TOTAL: $42.50", cx + 14, 284, (100, 116, 139, 255), scale=1)

    return c.to_png()


# Read the REAL, ACTUAL screenshots captured directly from the live Chrome browser
print("Loading real Chrome-captured project screenshots...")
with open(os.path.join(SCREENSHOTS_DIR, 'screen_menu.png'), 'rb') as f:
    png_menu = f.read()

with open(os.path.join(SCREENSHOTS_DIR, 'screen_customizer.png'), 'rb') as f:
    png_customizer = f.read()

with open(os.path.join(SCREENSHOTS_DIR, 'screen_cart.png'), 'rb') as f:
    png_cart = f.read()

with open(os.path.join(SCREENSHOTS_DIR, 'screen_checkout.png'), 'rb') as f:
    png_checkout = f.read()

with open(os.path.join(SCREENSHOTS_DIR, 'screen_tracker.png'), 'rb') as f:
    png_tracker = f.read()

with open(os.path.join(SCREENSHOTS_DIR, 'screen_admin.png'), 'rb') as f:
    png_admin = f.read()

print("All real project screenshots loaded successfully!")


# -------------------------------------------------------------
# 2. FULL-BLEED SLIDE XML BUILDER
# -------------------------------------------------------------

def xml_escape(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def build_shape(sp_id, x, y, cx, cy, fill_color, border_color=None, border_w=12700, shape="roundRect"):
    ln_xml = f'<a:ln w="{border_w}"><a:solidFill><a:srgbClr val="{border_color}"/></a:solidFill></a:ln>' if border_color else '<a:ln><a:noFill/></a:ln>'
    return f"""
      <p:sp>
        <p:nvSpPr><p:cNvPr id="{sp_id}" name="Box_{sp_id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="{shape}"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="{fill_color}"/></a:solidFill>
          {ln_xml}
        </p:spPr>
      </p:sp>
    """

def build_textbox(sp_id, x, y, cx, cy, paragraphs):
    p_xml = ""
    for p in paragraphs:
        runs_xml = ""
        for r in p.get("runs", []):
            b_attr = ' b="1"' if r.get("bold") else ''
            i_attr = ' i="1"' if r.get("italic") else ''
            sz_attr = f' sz="{r.get("size", 1400)}"'
            clr = r.get("color", "0f172a")
            text = xml_escape(r.get("text", ""))
            runs_xml += f"""
              <a:r>
                <a:rPr lang="en-US"{sz_attr}{b_attr}{i_attr}>
                  <a:solidFill><a:srgbClr val="{clr}"/></a:solidFill>
                </a:rPr>
                <a:t>{text}</a:t>
              </a:r>
            """
        bullet_attr = ''
        if p.get("bullet"):
            bullet_attr = ' marL="240000" indent="-240000"><a:buChar char="•"/>'
        else:
            bullet_attr = '><a:buNone/>'
        space_before = f' spaceBefore="{p.get("spaceBefore", 60000)}"' if "spaceBefore" in p else ''
        algn_attr = f' algn="{p.get("align", "l")}"'
        p_xml += f"""
          <a:p>
            <a:pPr{algn_attr}{space_before}{bullet_attr}</a:pPr>
            {runs_xml}
          </a:p>
        """

    return f"""
      <p:sp>
        <p:nvSpPr><p:cNvPr id="{sp_id}" name="Text_{sp_id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr anchor="top"/>
          {p_xml}
        </p:txBody>
      </p:sp>
    """

def build_picture(sp_id, x, y, cx, cy, r_id="rId2"):
    return f"""
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="{sp_id}" name="Screenshot_{sp_id}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="{r_id}"/>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
          <a:ln w="25400"><a:solidFill><a:srgbClr val="cbd5e1"/></a:solidFill></a:ln>
          <a:effectLst>
            <a:outerShdw blurRad="150000" dist="80000" dir="5400000" algn="b">
              <a:srgbClr val="000000"><a:alpha val="20000"/></a:srgbClr>
            </a:outerShdw>
          </a:effectLst>
        </p:spPr>
      </p:pic>
    """


# Generate the 10 Full-Coverage Slides
def generate_all_slides():
    slides = []

    # ---------------------------------------------------------
    # SLIDE 1: TITLE & EXECUTIVE SUMMARY (FULL COVERAGE)
    # ---------------------------------------------------------
    sp_list_1 = []
    # Header Banner across top
    sp_list_1.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    # Big Title
    sp_list_1.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System", "size": 3400, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "Full-Stack Web Architecture, Real-Time Delivery Tracking & Kitchen Management", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))
    # 4 Metric Cards across width
    card_w = 2673000
    gap = 233000
    metrics_data = [
        ("ZERO DEPENDENCIES", "0 NPM PACKAGES", "100% Native Node.js & SQLite", "ff521a"),
        ("FAST DISPATCH", "<25 MIN DELIVERY", "Optimized Kitchen Operations", "10b981"),
        ("DIETARY ENGINE", "100% COVERAGE", "Veg, Vegan, Spicy & Special", "0ea5e9"),
        ("TEST VERIFIED", "100% TEST PASS", "Zero Bugs In Order Math", "f59e0b")
    ]
    for i, (tag, val, desc, col) in enumerate(metrics_data):
        x = 400000 + i * (card_w + gap)
        sp_list_1.append(build_shape(10 + i, x, 1450000, card_w, 1100000, "f8fafc", border_color="e2e8f0"))
        sp_list_1.append(build_textbox(20 + i, x + 120000, 1550000, card_w - 240000, 950000, [
            {"runs": [{"text": tag, "size": 1100, "bold": True, "color": "64748b"}]},
            {"runs": [{"text": val, "size": 2200, "bold": True, "color": col}], "spaceBefore": 40000},
            {"runs": [{"text": desc, "size": 1150, "color": "334155"}], "spaceBefore": 30000}
        ]))

    # 3 Large Feature Pillar Cards filling middle-to-bottom
    pillar_w = 3640000
    pillar_gap = 236000
    pillars = [
        ("1. ARCHITECTURE & SPEED", "Zero-dependency Node.js 26 HTTP server with native SQLite (DatabaseSync). Boots in under 1 second, runs completely offline or online without npm install overhead."),
        ("2. CUSTOMER ORDERING SUITE", "7 curated culinary categories, debounced search, granular customizer modal (sizes, crusts, toppings), cart drawer with free delivery progress meter, and multi-payment gateway."),
        ("3. REAL-TIME TRACKING & OPS", "Dual-sided synchronized ecosystem: live 4-stage customer tracking timeline with driver profile + live Kitchen Kanban management dashboard with revenue analytics.")
    ]
    for i, (p_title, p_body) in enumerate(pillars):
        x = 400000 + i * (pillar_w + pillar_gap)
        sp_list_1.append(build_shape(30 + i, x, 2750000, pillar_w, 3450000, "ffffff", border_color="cbd5e1"))
        sp_list_1.append(build_shape(40 + i, x, 2750000, pillar_w, 550000, "1e293b", shape="rect"))
        sp_list_1.append(build_textbox(50 + i, x + 160000, 2830000, pillar_w - 320000, 420000, [
            {"runs": [{"text": p_title, "size": 1400, "bold": True, "color": "ff521a"}]}
        ]))
        sp_list_1.append(build_textbox(60 + i, x + 160000, 3450000, pillar_w - 320000, 2600000, [
            {"runs": [{"text": p_body, "size": 1350, "color": "1e293b"}]}
        ]))

    # Footer
    sp_list_1.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Pair Programming Project | Slide 1 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_1), "image": None})


    # ---------------------------------------------------------
    # SLIDE 2: PROBLEM VS SOLUTION FULL-WIDTH MATRIX
    # ---------------------------------------------------------
    sp_list_2 = []
    sp_list_2.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_2.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "Problem Statement & Project Objectives", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "Bridging the gap between cumbersome delivery apps and high-performance artisanal ordering", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    col_w = 5576000
    # Left Column: Conventional Apps (The Problem)
    sp_list_2.append(build_shape(10, 400000, 1450000, col_w, 4800000, "fef2f2", border_color="fecaca"))
    sp_list_2.append(build_shape(11, 400000, 1450000, col_w, 550000, "dc2626", shape="rect"))
    sp_list_2.append(build_textbox(12, 550000, 1530000, col_w - 300000, 420000, [
        {"runs": [{"text": "❌ THE PROBLEM: CONVENTIONAL FOOD APPS", "size": 1600, "bold": True, "color": "ffffff"}]}
    ]))
    problems = [
        ("Bloated Dependency Footprint:", "Heavy packages, npm install failures, breaking version conflicts, and vulnerable node_modules trees."),
        ("Opaque Calculations & Hidden Fees:", "Unclear delivery fees, unexpected service charges at the last step, and confusing coupon policies."),
        ("Friction-Heavy Customizations:", "Inflexible item modifiers that force rigid combinations and fail to capture culinary preferences."),
        ("Static, Unsynchronized Tracking:", "Static text statuses ('Order Received') with zero visibility into kitchen workflow or courier movement."),
        ("Complex Setup Requirements:", "Require external database servers (MongoDB, MySQL), complex environment files, and cloud credentials.")
    ]
    p_body = []
    for title, desc in problems:
        p_body.append({"runs": [{"text": title + " ", "size": 1300, "bold": True, "color": "991b1b"}, {"text": desc, "size": 1250, "color": "7f1d1d"}], "bullet": True, "spaceBefore": 70000})
    sp_list_2.append(build_textbox(13, 550000, 2150000, col_w - 300000, 3950000, p_body))

    # Right Column: The TasteCrave Solution
    rx = 400000 + col_w + 240000
    sp_list_2.append(build_shape(20, rx, 1450000, col_w, 4800000, "f0fdf4", border_color="bbf7d0"))
    sp_list_2.append(build_shape(21, rx, 1450000, col_w, 550000, "059669", shape="rect"))
    sp_list_2.append(build_textbox(22, rx + 150000, 1530000, col_w - 300000, 420000, [
        {"runs": [{"text": "✅ THE SOLUTION: TASTECRAVE ARCHITECTURE", "size": 1600, "bold": True, "color": "ffffff"}]}
    ]))
    solutions = [
        ("Zero NPM Dependencies:", "Runs exclusively on standard Node.js built-in modules (node:http, node:sqlite, node:fs) — boots instantly."),
        ("Live Transparent Cart & Promo Math:", "Interactive Free Delivery threshold meter ($35.00), automatic discount formulas, and clear tax itemization."),
        ("Granular Customizer Modal:", "Choose sizes, dough crusts, extra toppings, and cooking notes with instantaneous line-item price updating."),
        ("Live 4-Stage Synchronized Lifecycle:", "Interactive timeline (Placed -> Cooking -> On Way -> Delivered) linked to kitchen staff Kanban dashboard."),
        ("100% Self-Contained Portability:", "Built-in SQLite file storage requires zero external database installation, and works seamlessly offline or online.")
    ]
    s_body = []
    for title, desc in solutions:
        s_body.append({"runs": [{"text": title + " ", "size": 1300, "bold": True, "color": "065f46"}, {"text": desc, "size": 1250, "color": "14532d"}], "bullet": True, "spaceBefore": 70000})
    sp_list_2.append(build_textbox(23, rx + 150000, 2150000, col_w - 300000, 3950000, s_body))

    # Footer
    sp_list_2.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Problem vs Solution | Slide 2 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_2), "image": None})


    # ---------------------------------------------------------
    # SLIDE 3: SYSTEM ARCHITECTURE & TECHNICAL STACK
    # ---------------------------------------------------------
    sp_list_3 = []
    sp_list_3.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_3.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "System Architecture & Technical Stack", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "4-Tier Full-Stack Engineering: Client SPA, REST API, Business Engine, and SQLite", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    # 4 Architecture Tier Boxes stacked across the full page
    tier_w = 11392000
    tier_h = 1080000
    tier_gap = 140000
    tiers_data = [
        ("TIER 1: CLIENT PRESENTATION (SPA)", "Modular Vanilla ES6 Components (menu.js, cart.js, checkout.js, tracker.js, admin.js) + Tailwind-inspired CSS custom property tokens. Instant client rendering with localStorage state persistence and offline fallback SVG artwork.", "0ea5e9"),
        ("TIER 2: HIGH-THROUGHPUT REST API", "Pure Node.js HTTP server (server.js) handling route dispatching, JSON body parsing, CORS headers, and MIME-type static asset streaming. Features automatic fallback to port 3001 if port 3000 is occupied.", "ff521a"),
        ("TIER 3: CORE BUSINESS ENGINE", "Server-side pricing engine with dynamic tax calculation (8.25%), tiered delivery logic (standard vs priority), coupon discount formulas (percentage, fixed, free shipping), and driver assignment dispatcher.", "10b981"),
        ("TIER 4: NATIVE PERSISTENCE LAYER", "In-process SQLite database (database.js via node:sqlite DatabaseSync) with WAL mode, foreign keys, and ACID transactions. Stores categories, 24 artisanal food dishes, promo codes, orders, and item breakdowns.", "8b5cf6")
    ]
    for i, (t_title, t_desc, col) in enumerate(tiers_data):
        y = 1450000 + i * (tier_h + tier_gap)
        sp_list_3.append(build_shape(10 + i, 400000, y, tier_w, tier_h, "ffffff", border_color="cbd5e1"))
        sp_list_3.append(build_shape(20 + i, 400000, y, 3200000, tier_h, col, shape="rect"))
        sp_list_3.append(build_textbox(30 + i, 520000, y + 250000, 2960000, tier_h - 400000, [
            {"runs": [{"text": t_title, "size": 1500, "bold": True, "color": "ffffff"}]}
        ]))
        sp_list_3.append(build_textbox(40 + i, 3800000, y + 160000, 7750000, tier_h - 300000, [
            {"runs": [{"text": t_desc, "size": 1350, "color": "1e293b"}]}
        ]))

    # Footer
    sp_list_3.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Technical Architecture | Slide 3 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_3), "image": None})


    # ---------------------------------------------------------
    # SLIDE 4: FOOD MENU & FILTERING (WITH SCREENSHOT)
    # ---------------------------------------------------------
    sp_list_4 = []
    sp_list_4.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_4.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "Feature 1: Interactive Menu & Smart Filtering Engine", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "Artisanal culinary categories, dietary badges, and instant search debounce", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    # Left Column: 4 Feature Highlight Cards filling vertical space
    card_h = 1100000
    card_gap = 120000
    menu_highlights = [
        ("7 Culinary Categories", "Burgers, Woodfired Pizzas, Asian Bowls, Tacos, Salads, Desserts, and Craft Drinks with icon indicators and active state styling."),
        ("Instant Dietary Filtering", "One-click filter pills: Pure Veg (green badge), Vegan (leaf badge), Spicy (heat meter levels 1-3), and Bestseller stars."),
        ("Debounced Search & Sort", "300ms debounced live search by title, ingredient, or culinary tag. Sort by Top Rated, Price (Low/High), and Fastest Prep Time."),
        ("Resilient Image Engine", "High-definition culinary photography with automated in-memory SVG artwork fallback if network is unreachable.")
    ]
    for i, (h_title, h_desc) in enumerate(menu_highlights):
        y = 1450000 + i * (card_h + card_gap)
        sp_list_4.append(build_shape(10 + i, 400000, y, 5200000, card_h, "ffffff", border_color="cbd5e1"))
        sp_list_4.append(build_textbox(20 + i, 550000, y + 140000, 4900000, card_h - 260000, [
            {"runs": [{"text": f"• {h_title}: ", "size": 1400, "bold": True, "color": "ff521a"}, {"text": h_desc, "size": 1300, "color": "1e293b"}]}
        ]))

    # Right Column: Big UI Screenshot covering the right half
    sp_list_4.append(build_picture(50, 5800000, 1450000, 5992000, 4760000, r_id="rId2"))

    # Footer
    sp_list_4.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Menu & Smart Discovery | Slide 4 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_4), "image": "screen_menu.png"})


    # ---------------------------------------------------------
    # SLIDE 5: ITEM CUSTOMIZER (WITH SCREENSHOT)
    # ---------------------------------------------------------
    sp_list_5 = []
    sp_list_5.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_5.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "Feature 2: Item Customizer & Dynamic Pricing", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "Personalized dining with size options, crusts, toppings, and chef notes", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    custom_highlights = [
        ("Tiered Size Options", "Radio selectors for sizes: Regular Single Patty, Double Deluxe (+Patty, +$3.50), Medium (10\"), Large (14\", +$4.50), Monster (18\")."),
        ("Artisanal Crusts & Bases", "Woodfired Thin Crust, Stuffed Garlic Crust (+2.50), Gluten-Free Cauliflower (+3.00), Jasmine Rice, and Quinoa Mix."),
        ("Multi-Select Add-On Toppings", "Aged Cheddar, Smoked Bacon Rashers, Caramelized Onions, Avocado Slices, and House Truffle Aioli with independent pricing."),
        ("Special Instructions & Live Math", "Customer cooking notes (e.g. 'Sauce on side, extra crispy fries') with live subtotaling updated on every click.")
    ]
    for i, (h_title, h_desc) in enumerate(custom_highlights):
        y = 1450000 + i * (card_h + card_gap)
        sp_list_5.append(build_shape(10 + i, 400000, y, 5200000, card_h, "ffffff", border_color="cbd5e1"))
        sp_list_5.append(build_textbox(20 + i, 550000, y + 140000, 4900000, card_h - 260000, [
            {"runs": [{"text": f"• {h_title}: ", "size": 1400, "bold": True, "color": "ff521a"}, {"text": h_desc, "size": 1300, "color": "1e293b"}]}
        ]))

    sp_list_5.append(build_picture(50, 5800000, 1450000, 5992000, 4760000, r_id="rId2"))
    sp_list_5.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Item Customizer & Pricing | Slide 5 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_5), "image": "screen_customizer.png"})


    # ---------------------------------------------------------
    # SLIDE 6: CART DRAWER & COUPON ENGINE (WITH SCREENSHOT)
    # ---------------------------------------------------------
    sp_list_6 = []
    sp_list_6.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_6.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "Feature 3: Real-Time Cart Drawer & Smart Coupon Engine", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "Slide-out drawer with free delivery progress meter and promo discounts", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    cart_highlights = [
        ("Quantity Steppers & Cart Sync", "Seamless item increment, decrement, and removal in drawer with automatic two-way synchronization on menu cards."),
        ("Free Delivery Threshold Meter", "Visual progress bar showing remaining balance needed to unlock free shipping ($35.00 limit), boosting average order value."),
        ("Validated Promo Code Engine", "Server-validated coupons: TASTY20 (20% off over $25), FIRSTBITE ($5 off over $15), FREESHIP, and FEAST10 storewide."),
        ("Itemized Bill & Driver Tip", "Transparent calculation of line items, savings in green, delivery fee, tax (8.25%), driver tip ($0, $2, $3, $5), and grand total.")
    ]
    for i, (h_title, h_desc) in enumerate(cart_highlights):
        y = 1450000 + i * (card_h + card_gap)
        sp_list_6.append(build_shape(10 + i, 400000, y, 5200000, card_h, "ffffff", border_color="cbd5e1"))
        sp_list_6.append(build_textbox(20 + i, 550000, y + 140000, 4900000, card_h - 260000, [
            {"runs": [{"text": f"• {h_title}: ", "size": 1400, "bold": True, "color": "ff521a"}, {"text": h_desc, "size": 1300, "color": "1e293b"}]}
        ]))

    sp_list_6.append(build_picture(50, 5800000, 1450000, 5992000, 4760000, r_id="rId2"))
    sp_list_6.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Cart & Promo Engine | Slide 6 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_6), "image": "screen_cart.png"})


    # ---------------------------------------------------------
    # SLIDE 7: CHECKOUT & MULTI-PAYMENT (WITH SCREENSHOT)
    # ---------------------------------------------------------
    sp_list_7 = []
    sp_list_7.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_7.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "Feature 4: Seamless Checkout & Multi-Payment Gateway", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "Fast 2-minute ordering with multiple payment methods and celebration feedback", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    checkout_highlights = [
        ("Delivery Details & Address", "Full name, contact phone, delivery street address, apt/suite, area, and delivery drop-off instructions with auto-fill memory."),
        ("Delivery Speed Selector", "Standard Delivery (30-40 min, $3.99/Free) vs Priority Express (15-25 min, +$2.00) with dynamic total adjustments."),
        ("Multi-Payment Options", "Triple payment support: Credit/Debit Card (formatted inputs with CVV), Instant UPI QR Code scanner prompt, and Cash on Delivery."),
        ("Celebration Confetti Feedback", "Native HTML5 Canvas particle confetti animation fires upon placing order, delivering delightful UX confirmation.")
    ]
    for i, (h_title, h_desc) in enumerate(checkout_highlights):
        y = 1450000 + i * (card_h + card_gap)
        sp_list_7.append(build_shape(10 + i, 400000, y, 5200000, card_h, "ffffff", border_color="cbd5e1"))
        sp_list_7.append(build_textbox(20 + i, 550000, y + 140000, 4900000, card_h - 260000, [
            {"runs": [{"text": f"• {h_title}: ", "size": 1400, "bold": True, "color": "ff521a"}, {"text": h_desc, "size": 1300, "color": "1e293b"}]}
        ]))

    sp_list_7.append(build_picture(50, 5800000, 1450000, 5992000, 4760000, r_id="rId2"))
    sp_list_7.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Checkout & Payments | Slide 7 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_7), "image": "screen_checkout.png"})


    # ---------------------------------------------------------
    # SLIDE 8: LIVE ORDER TRACKING (WITH SCREENSHOT)
    # ---------------------------------------------------------
    sp_list_8 = []
    sp_list_8.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_8.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "Feature 5: Live Order Tracking & Real-Time Simulation", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "4-stage visual progress timeline, driver profile, and live demo advances", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    tracker_highlights = [
        ("4-Stage Visual Timeline", "Step-by-step progress nodes: Placed -> Kitchen Cooking -> Courier Out for Delivery -> Delivered with dynamic progress bar."),
        ("Assigned Courier Profile", "Displays driver name (e.g. Alex Rivera), vehicle icon, driver rating (4.9*), and one-click direct phone link."),
        ("Evaluator Step Simulator", "Includes a prominent 'Advance Step' demo button, allowing evaluators to step through the order lifecycle in real time."),
        ("Background Polling Engine", "Automatically polls database every 4 seconds, so any status advance in the kitchen reflects immediately on customer screen.")
    ]
    for i, (h_title, h_desc) in enumerate(tracker_highlights):
        y = 1450000 + i * (card_h + card_gap)
        sp_list_8.append(build_shape(10 + i, 400000, y, 5200000, card_h, "ffffff", border_color="cbd5e1"))
        sp_list_8.append(build_textbox(20 + i, 550000, y + 140000, 4900000, card_h - 260000, [
            {"runs": [{"text": f"• {h_title}: ", "size": 1400, "bold": True, "color": "ff521a"}, {"text": h_desc, "size": 1300, "color": "1e293b"}]}
        ]))

    sp_list_8.append(build_picture(50, 5800000, 1450000, 5992000, 4760000, r_id="rId2"))
    sp_list_8.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Live Order Tracking | Slide 8 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_8), "image": "screen_tracker.png"})


    # ---------------------------------------------------------
    # SLIDE 9: KITCHEN KANBAN DASHBOARD (WITH SCREENSHOT)
    # ---------------------------------------------------------
    sp_list_9 = []
    sp_list_9.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_9.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "Feature 6: Kitchen & Staff Admin Kanban Dashboard", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "Centralized order operations and store analytics for restaurant staff", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    admin_highlights = [
        ("1-Click Mode Switcher", "Dedicated button in top navigation bar toggles seamlessly between Customer View and Kitchen Mode."),
        ("Live Store Financial Metrics", "Real-time KPI cards: Total Revenue ($), Active Kitchen Cooking Orders, Lifetime Order Count, and Top Selling Food Items."),
        ("4-Column Kanban Columns", "Orders dynamically categorized into Incoming, In Preparation, Out with Courier, and Completed Delivered columns."),
        ("Staff Workflow Triggers", "Direct one-click workflow buttons for staff: 'Start Cooking' -> 'Hand to Driver' -> 'Mark Delivered'.")
    ]
    for i, (h_title, h_desc) in enumerate(admin_highlights):
        y = 1450000 + i * (card_h + card_gap)
        sp_list_9.append(build_shape(10 + i, 400000, y, 5200000, card_h, "ffffff", border_color="cbd5e1"))
        sp_list_9.append(build_textbox(20 + i, 550000, y + 140000, 4900000, card_h - 260000, [
            {"runs": [{"text": f"• {h_title}: ", "size": 1400, "bold": True, "color": "ff521a"}, {"text": h_desc, "size": 1300, "color": "1e293b"}]}
        ]))

    sp_list_9.append(build_picture(50, 5800000, 1450000, 5992000, 4760000, r_id="rId2"))
    sp_list_9.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Kitchen Kanban Dashboard | Slide 9 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_9), "image": "screen_admin.png"})


    # ---------------------------------------------------------
    # SLIDE 10: KEY RESULTS & FUTURE ROADMAP (FULL COVERAGE)
    # ---------------------------------------------------------
    sp_list_10 = []
    sp_list_10.append(build_shape(2, 0, 0, 12192000, 240000, "ff521a", shape="rect"))
    sp_list_10.append(build_textbox(3, 400000, 380000, 11392000, 950000, [
        {"runs": [{"text": "Key Results, Business Value & Future Roadmap", "size": 3200, "bold": True, "color": "0f172a"}]},
        {"runs": [{"text": "Production-grade quality, stellar user experience, and future horizons", "size": 1600, "italic": True, "color": "64748b"}], "spaceBefore": 40000}
    ]))

    # Top 4 Performance Cards
    p_metrics = [
        ("BOOT TIME", "<1.0s LAUNCH", "Instant Startup Zero Install", "10b981"),
        ("DEPENDENCY RISK", "0 NPM DEPS", "100% Native Standard Library", "ff521a"),
        ("TEST VERIFICATION", "100% PASS RATE", "Validated via test-database.js", "0ea5e9"),
        ("DB LATENCY", "<2ms QUERIES", "SQLite WAL Mode In-Memory Sync", "8b5cf6")
    ]
    for i, (tag, val, desc, col) in enumerate(p_metrics):
        x = 400000 + i * (card_w + gap)
        sp_list_10.append(build_shape(10 + i, x, 1450000, card_w, 1100000, "f8fafc", border_color="e2e8f0"))
        sp_list_10.append(build_textbox(20 + i, x + 120000, 1550000, card_w - 240000, 950000, [
            {"runs": [{"text": tag, "size": 1100, "bold": True, "color": "64748b"}]},
            {"runs": [{"text": val, "size": 2200, "bold": True, "color": col}], "spaceBefore": 40000},
            {"runs": [{"text": desc, "size": 1150, "color": "334155"}], "spaceBefore": 30000}
        ]))

    # 3 Large Bottom Pillars: Business Impact, Reliability, Future Roadmap
    pillars_10 = [
        ("BUSINESS & COMMERCE VALUE", [
            ("Higher Average Order Value:", "Visual Free Delivery meter directly incentivizes basket size expansion past $35 threshold."),
            ("Transparent Conversion Funnel:", "Itemized breakdown of taxes, discounts, and delivery speeds reduces abandoned carts."),
            ("Immediate Staff Productivity:", "Kitchen Kanban columns prevent missed orders and streamline courier dispatch handoffs.")
        ]),
        ("ENGINEERING RELIABILITY", [
            ("Zero Vulnerability Attack Surface:", "Eliminating third-party npm dependencies prevents supply-chain exploits completely."),
            ("Atomic Order Transactions:", "SQLite BEGIN / COMMIT transactions prevent race conditions and partial line-item failures."),
            ("100% Offline Portability:", "Embedded vector SVG fallbacks ensure dishes always look stunning even during CDN network outages.")
        ]),
        ("FUTURE PRODUCT HORIZONS", [
            ("WebSocket Bi-Directional Push:", "Upgrade background polling to real-time WebSockets for zero-delay instant synchronization."),
            ("GPS Courier Map Routing:", "Interactive Leaflet / Mapbox GPS navigation tracking courier scooter movement on a live map."),
            ("Multi-Tenant Cloud Operations:", "Scale from a single kitchen to multi-restaurant branch routing with kitchen prep load-balancing.")
        ])
    ]
    for i, (p_title, bullet_items) in enumerate(pillars_10):
        x = 400000 + i * (pillar_w + pillar_gap)
        sp_list_10.append(build_shape(30 + i, x, 2750000, pillar_w, 3450000, "ffffff", border_color="cbd5e1"))
        sp_list_10.append(build_shape(40 + i, x, 2750000, pillar_w, 550000, "1e293b", shape="rect"))
        sp_list_10.append(build_textbox(50 + i, x + 160000, 2830000, pillar_w - 320000, 420000, [
            {"runs": [{"text": p_title, "size": 1350, "bold": True, "color": "ff521a"}]}
        ]))
        b_body = []
        for b_t, b_d in bullet_items:
            b_body.append({"runs": [{"text": b_t + " ", "size": 1200, "bold": True, "color": "0f172a"}, {"text": b_d, "size": 1150, "color": "334155"}], "bullet": True, "spaceBefore": 50000})
        sp_list_10.append(build_textbox(60 + i, x + 160000, 3450000, pillar_w - 320000, 2600000, b_body))

    sp_list_10.append(build_textbox(99, 400000, 6380000, 11392000, 300000, [
        {"runs": [{"text": "TasteCrave Online Food Ordering System | Conclusion & Roadmap | Slide 10 of 10", "size": 1100, "color": "94a3b8"}]}
    ]))
    slides.append({"xml": "".join(sp_list_10), "image": None})

    return slides


# Build OpenXML PPTX
def build_pptx():
    print("Building TasteCrave_Presentation.pptx (Full-Bleed 10 Slides)...")

    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
"""
    for i in range(1, 11):
        content_types += f'  <Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n'
    content_types += "</Types>"

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>"""

    pres_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
"""
    for i in range(1, 11):
        pres_rels += f'  <Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>\n'
    pres_rels += "</Relationships>"

    pres = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
"""
    for i in range(1, 11):
        pres += f'    <p:sldId id="{255 + i}" r:id="rId{i+1}"/>\n'
    pres += """  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>"""

    slide_master_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>"""

    slide_master = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>"""

    slide_layout_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>"""

    slide_layout = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMap/></p:clrMapOvr>
</p:sldLayout>"""

    theme = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TasteCrave">
  <a:themeElements>
    <a:clrScheme name="TasteCrave">
      <a:dk1><a:srgbClr val="0f172a"/></a:dk1>
      <a:lt1><a:srgbClr val="ffffff"/></a:lt1>
      <a:dk2><a:srgbClr val="334155"/></a:dk2>
      <a:lt2><a:srgbClr val="f8fafc"/></a:lt2>
      <a:accent1><a:srgbClr val="ff521a"/></a:accent1>
      <a:accent2><a:srgbClr val="10b981"/></a:accent2>
      <a:accent3><a:srgbClr val="0ea5e9"/></a:accent3>
      <a:accent4><a:srgbClr val="f59e0b"/></a:accent4>
      <a:accent5><a:srgbClr val="8b5cf6"/></a:accent5>
      <a:accent6><a:srgbClr val="ec4899"/></a:accent6>
      <a:hlink><a:srgbClr val="2563eb"/></a:hlink>
      <a:folHlink><a:srgbClr val="7c3aed"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Modern">
      <a:majorFont><a:latin typeface="Segoe UI"/></a:majorFont>
      <a:minorFont><a:latin typeface="Segoe UI"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Format">
      <a:fillStyleLst><a:solidFill><a:srgbClr val="ff521a"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln><a:solidFill><a:srgbClr val="e2e8f0"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:srgbClr val="f8fafc"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>"""

    all_slides = generate_all_slides()

    image_mapping = {
        "screen_menu.png": ("image1.png", png_menu),
        "screen_customizer.png": ("image2.png", png_customizer),
        "screen_cart.png": ("image3.png", png_cart),
        "screen_checkout.png": ("image4.png", png_checkout),
        "screen_tracker.png": ("image5.png", png_tracker),
        "screen_admin.png": ("image6.png", png_admin)
    }

    with zipfile.ZipFile('TasteCrave_Presentation.pptx', 'w') as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('ppt/presentation.xml', pres)
        z.writestr('ppt/_rels/presentation.xml.rels', pres_rels)
        z.writestr('ppt/slideMasters/slideMaster1.xml', slide_master)
        z.writestr('ppt/slideMasters/_rels/slideMaster1.xml.rels', slide_master_rels)
        z.writestr('ppt/slideLayouts/slideLayout1.xml', slide_layout)
        z.writestr('ppt/slideLayouts/_rels/slideLayout1.xml.rels', slide_layout_rels)
        z.writestr('ppt/theme/theme1.xml', theme)

        # Store media images
        for orig_name, (zip_name, png_data) in image_mapping.items():
            z.writestr(f'ppt/media/{zip_name}', png_data)

        # Write each slide
        for idx, s in enumerate(all_slides, start=1):
            has_image = bool(s["image"])
            rel_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
"""
            if has_image:
                zip_img = image_mapping[s["image"]][0]
                rel_xml += f'  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/{zip_img}"/>\n'
            rel_xml += "</Relationships>"

            slide_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      {s["xml"]}
    </p:spTree>
  </p:cSld>
</p:sld>"""

            z.writestr(f'ppt/slides/slide{idx}.xml', slide_xml)
            z.writestr(f'ppt/slides/_rels/slide{idx}.xml.rels', rel_xml)

    print("TasteCrave_Presentation.pptx built successfully! File size:", os.path.getsize('TasteCrave_Presentation.pptx'))

build_pptx()
