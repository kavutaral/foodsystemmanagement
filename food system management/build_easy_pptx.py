"""
TasteCrave Easy Presentation Generator
Generates a super clean, easy-to-read, beginner-friendly PowerPoint presentation:
TasteCrave_Easy_Presentation.pptx
Each slide features:
1. Clear, simple title
2. Big, crisp real project screenshot
3. Easy 2-3 line explanation in simple words
"""

import os
import zipfile

SCREENSHOTS_DIR = 'presentation_screenshots'

slides = [
    {
        "num": 1,
        "title": "Slide 1: Online Food Ordering System - Home Page",
        "bullets": [
            "Users can open the website to browse delicious food items.",
            "Features top navigation, delivery address selector, and active promo offers (TASTY20, FIRSTBITE)."
        ],
        "image": "slide1_home.png"
    },
    {
        "num": 2,
        "title": "Slide 2: Viewing Food Items & Categories",
        "bullets": [
            "7 categories: Burgers, Pizzas, Asian Bowls, Tacos, Salads, Desserts, and Drinks.",
            "Each item displays high-definition photo, price, calories, prep time, and chef rating."
        ],
        "image": "screen_menu.png"
    },
    {
        "num": 3,
        "title": "Slide 3: Search & Dietary Filters (Veg, Vegan, Spicy)",
        "bullets": [
            "Search bar with live instant filtering as user types dish names.",
            "One-click filter buttons for Pure Veg (🥦), Vegan (🌱), Spicy (🌶️), and Bestseller (⭐) dishes."
        ],
        "image": "slide3_filter.png"
    },
    {
        "num": 4,
        "title": "Slide 4: Customizing Dishes (Size & Crust Options)",
        "bullets": [
            "Clicking 'Customise' opens this modal dialog for the selected dish.",
            "Users choose size (Regular / Double Deluxe) and crust (Woodfired / Garlic Stuffed / Gluten-Free)."
        ],
        "image": "slide4_customizer.png"
    },
    {
        "num": 5,
        "title": "Slide 5: Adding Extra Toppings & Special Notes",
        "bullets": [
            "Users can check extra toppings (Aged Cheddar, Smoked Bacon, Truffle Aioli).",
            "Special cooking instructions textarea (e.g. 'Sauce on side, extra crispy fries'). Price updates live."
        ],
        "image": "slide5_extras.png"
    },
    {
        "num": 6,
        "title": "Slide 6: Shopping Cart Drawer & Free Delivery Meter",
        "bullets": [
            "Slide-out cart drawer lets users increase/decrease quantity (- / +) or delete items.",
            "Visual progress bar shows remaining amount needed to unlock Free Delivery ($35 threshold)."
        ],
        "image": "screen_cart.png"
    },
    {
        "num": 7,
        "title": "Slide 7: Applying Promo Coupons & Driver Tip",
        "bullets": [
            "Users enter promo codes like 'TASTY20' to get an instant 20% discount on their order.",
            "Driver tip selection pills ($0, $2, $3, $5) and transparent itemized bill breakdown."
        ],
        "image": "slide6_cart.png"
    },
    {
        "num": 8,
        "title": "Slide 8: Checkout & Multiple Payment Methods",
        "bullets": [
            "Customer enters delivery address, contact phone, and chooses standard or priority speed.",
            "Supports 3 payment methods: Credit/Debit Card, Instant UPI QR Code, and Cash on Delivery (COD)."
        ],
        "image": "screen_checkout.png"
    },
    {
        "num": 9,
        "title": "Slide 9: Live Order Tracking & Status Timeline",
        "bullets": [
            "4-stage visual timeline: Order Placed -> Cooking in Kitchen -> Out for Delivery -> Delivered.",
            "Shows assigned courier name, phone number, live ETA countdown, and itemized receipt."
        ],
        "image": "screen_tracker.png"
    },
    {
        "num": 10,
        "title": "Slide 10: Kitchen Dashboard & Order Management",
        "bullets": [
            "Restaurant staff can switch to Kitchen Mode to view live store revenue and active orders.",
            "Kanban columns (Incoming, Cooking, On Way, Delivered) with buttons to advance order status."
        ],
        "image": "screen_admin.png"
    }
]

def xml_escape(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def build_easy_presentation():
    print("Building TasteCrave_Easy_Presentation.pptx...")

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
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="EasyTheme">
  <a:themeElements>
    <a:clrScheme name="Easy">
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
    <a:fontScheme name="Standard">
      <a:majorFont><a:latin typeface="Calibri"/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Format">
      <a:fillStyleLst><a:solidFill><a:srgbClr val="ff521a"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln><a:solidFill><a:srgbClr val="e2e8f0"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:srgbClr val="f8fafc"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>"""

    out_file = 'TasteCrave_Easy_Presentation.pptx'
    with zipfile.ZipFile(out_file, 'w') as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('ppt/presentation.xml', pres)
        z.writestr('ppt/_rels/presentation.xml.rels', pres_rels)
        z.writestr('ppt/slideMasters/slideMaster1.xml', slide_master)
        z.writestr('ppt/slideMasters/_rels/slideMaster1.xml.rels', slide_master_rels)
        z.writestr('ppt/slideLayouts/slideLayout1.xml', slide_layout)
        z.writestr('ppt/slideLayouts/_rels/slideLayout1.xml.rels', slide_layout_rels)
        z.writestr('ppt/theme/theme1.xml', theme)

        # Store images into ppt/media
        for s in slides:
            idx = s["num"]
            img_path = os.path.join(SCREENSHOTS_DIR, s["image"])
            with open(img_path, 'rb') as f:
                img_data = f.read()
            z.writestr(f'ppt/media/image{idx}.png', img_data)

        # Build each slide
        for s in slides:
            idx = s["num"]
            title_esc = xml_escape(s["title"])

            rel_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image{idx}.png"/>
</Relationships>"""

            # Easy Layout:
            # Top: Big, clear title bar (y: 150000, h: 550000)
            # Center: Screenshot of project (x: 400000, y: 750000, w: 11392000, h: 4800000)
            # Bottom: 2-line simple bullet points explanation (y: 5650000, h: 1050000)
            bullet_xml = ""
            for b in s["bullets"]:
                b_esc = xml_escape(b)
                bullet_xml += f"""
          <a:p>
            <a:pPr lvl="0" spaceBefore="40000" marL="240000" indent="-240000">
              <a:buChar char="✔"/>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1350" b="1">
                <a:solidFill><a:srgbClr val="0f172a"/></a:solidFill>
              </a:rPr>
              <a:t>{b_esc}</a:t>
            </a:r>
          </a:p>
"""

            slide_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>

      <!-- Top Title -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="400000" y="150000"/><a:ext cx="11392000" cy="550000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr anchor="top"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="2400" b="1">
                <a:solidFill><a:srgbClr val="ff521a"/></a:solidFill>
              </a:rPr>
              <a:t>{title_esc}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Big Project Screenshot -->
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="3" name="ProjectScreenshot_{idx}"/>
          <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rId2"/>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm><a:off x="400000" y="750000"/><a:ext cx="11392000" cy="4800000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
          <a:ln w="19050"><a:solidFill><a:srgbClr val="cbd5e1"/></a:solidFill></a:ln>
          <a:effectLst>
            <a:outerShdw blurRad="120000" dist="60000" dir="5400000" algn="b">
              <a:srgbClr val="000000"><a:alpha val="15000"/></a:srgbClr>
            </a:outerShdw>
          </a:effectLst>
        </p:spPr>
      </p:pic>

      <!-- Bottom Simple Bullet Explanations Box -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="BulletsBox"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="400000" y="5650000"/><a:ext cx="11392000" cy="1050000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="f8fafc"/></a:solidFill>
          <a:ln w="12700"><a:solidFill><a:srgbClr val="e2e8f0"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr anchor="ctr"/>
          {bullet_xml}
        </p:txBody>
      </p:sp>

    </p:spTree>
  </p:cSld>
</p:sld>"""

            z.writestr(f'ppt/slides/slide{idx}.xml', slide_xml)
            z.writestr(f'ppt/slides/_rels/slide{idx}.xml.rels', rel_xml)

    print(f"Success! {out_file} created successfully! Size: {os.path.getsize(out_file)} bytes")

build_easy_presentation()
