"""
TasteCrave Presentation Generator - Pure Project Screenshots Only
Each slide features the actual, real Chrome screenshot of the project covering the full page.
No outer filler boxes, no artificial side columns.
"""

import os
import zipfile

SCREENSHOTS_DIR = 'presentation_screenshots'

slides_config = [
    {
        "slide_num": 1,
        "title": "TasteCrave Project - Homepage & Promotional Hero",
        "subtitle": "Brand navigation bar, location selector, real-time cart badge, hero promotion & active coupon chips",
        "image_file": "slide1_home.png"
    },
    {
        "slide_num": 2,
        "title": "TasteCrave Project - Gourmet Food Menu & Categories",
        "subtitle": "7 culinary categories, high-resolution food cards, chef ratings, prep times, calories & pricing",
        "image_file": "screen_menu.png"
    },
    {
        "slide_num": 3,
        "title": "TasteCrave Project - Menu Grid & Dish Details",
        "subtitle": "Detailed dish cards with calorie counters, prep duration badges, and quick-add action triggers",
        "image_file": "slide2_menu.png"
    },
    {
        "slide_num": 4,
        "title": "TasteCrave Project - Smart Dietary Filtering Engine",
        "subtitle": "Active dietary filter chips: Pure Veg (🥦), Vegan (🌱), Spicy heat meter (🌶️), and Bestseller stars",
        "image_file": "slide3_filter.png"
    },
    {
        "slide_num": 5,
        "title": "TasteCrave Project - Interactive Dish Customizer Modal",
        "subtitle": "Size selection options (Regular / Double Deluxe) and artisanal crust types with dynamic price additions",
        "image_file": "slide4_customizer.png"
    },
    {
        "slide_num": 6,
        "title": "TasteCrave Project - Customizer Toppings & Special Notes",
        "subtitle": "Multi-select toppings (Aged Cheddar, Smoked Bacon, Aioli), special cooking instructions textarea & live total",
        "image_file": "slide5_extras.png"
    },
    {
        "slide_num": 7,
        "title": "TasteCrave Project - Slide-Out Cart & Free Delivery Meter",
        "subtitle": "Real-time quantity steppers, unlocked free delivery progress bar ($35 threshold), and line items",
        "image_file": "screen_cart.png"
    },
    {
        "slide_num": 8,
        "title": "TasteCrave Project - Customer Checkout & Multi-Payment Flow",
        "subtitle": "Delivery address capture, Standard vs Priority express speed, Credit Card / UPI QR / Cash on Delivery",
        "image_file": "screen_checkout.png"
    },
    {
        "slide_num": 9,
        "title": "TasteCrave Project - Live Order Tracking & Status Timeline",
        "subtitle": "4-stage visual progress timeline (Placed ➔ Cooking ➔ On Way ➔ Delivered), courier profile card & live demo advance",
        "image_file": "screen_tracker.png"
    },
    {
        "slide_num": 10,
        "title": "TasteCrave Project - Kitchen & Staff Admin Kanban Dashboard",
        "subtitle": "Real-time store revenue metrics, active orders counter, and 4-column Kanban board with staff action triggers",
        "image_file": "screen_admin.png"
    }
]

def xml_escape(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def build_presentation():
    print("Building TasteCrave_Presentation.pptx (Pure Project Screenshots Only - Full Coverage)...")

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
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TasteCraveTheme">
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

        # Store all 10 images into ppt/media/
        for cfg in slides_config:
            idx = cfg["slide_num"]
            img_path = os.path.join(SCREENSHOTS_DIR, cfg["image_file"])
            with open(img_path, 'rb') as f:
                img_data = f.read()
            z.writestr(f'ppt/media/image{idx}.png', img_data)

        # Build each of the 10 slides
        for cfg in slides_config:
            idx = cfg["slide_num"]
            title_escaped = xml_escape(cfg["title"])
            sub_escaped = xml_escape(cfg["subtitle"])

            rel_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image{idx}.png"/>
</Relationships>"""

            # Slide layout:
            # Total slide size: 12,192,000 x 6,858,000
            # Header bar height: 680,000
            # Screenshot size: cx = 11,712,000, cy = 5,920,000 (covers 95%+ of the slide area)
            slide_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>

      <!-- Top Orange Brand Line -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="BrandLine"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="90000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="ff521a"/></a:solidFill>
          <a:ln><a:noFill/></a:ln>
        </p:spPr>
      </p:sp>

      <!-- Slide Title & Subtitle (Compact) -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="TitleBlock"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="240000" y="140000"/><a:ext cx="10200000" cy="550000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr anchor="top"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="2200" b="1">
                <a:solidFill><a:srgbClr val="0f172a"/></a:solidFill>
              </a:rPr>
              <a:t>{title_escaped}</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:pPr spaceBefore="30000"/>
            <a:r>
              <a:rPr lang="en-US" sz="1150" i="1">
                <a:solidFill><a:srgbClr val="64748b"/></a:solidFill>
              </a:rPr>
              <a:t>{sub_escaped}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Slide Number Badge -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Badge"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="10750000" y="160000"/><a:ext cx="1200000" cy="400000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="f1f5f9"/></a:solidFill>
          <a:ln w="12700"><a:solidFill><a:srgbClr val="cbd5e1"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr anchor="ctr"/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r>
              <a:rPr lang="en-US" sz="1200" b="1">
                <a:solidFill><a:srgbClr val="ff521a"/></a:solidFill>
              </a:rPr>
              <a:t>Slide {idx} / 10</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- FULL-PAGE PROJECT SCREENSHOT (COVERS THE ENTIRE CANVAS) -->
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="5" name="ProjectScreenshot_{idx}"/>
          <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rId2"/>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm><a:off x="240000" y="720000"/><a:ext cx="11712000" cy="5960000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
          <a:ln w="25400"><a:solidFill><a:srgbClr val="94a3b8"/></a:solidFill></a:ln>
          <a:effectLst>
            <a:outerShdw blurRad="180000" dist="90000" dir="5400000" algn="b">
              <a:srgbClr val="000000"><a:alpha val="22000"/></a:srgbClr>
            </a:outerShdw>
          </a:effectLst>
        </p:spPr>
      </p:pic>

    </p:spTree>
  </p:cSld>
</p:sld>"""

            z.writestr(f'ppt/slides/slide{idx}.xml', slide_xml)
            z.writestr(f'ppt/slides/_rels/slide{idx}.xml.rels', rel_xml)

    print("Success! TasteCrave_Presentation.pptx built with pure project screenshots covering each page!")
    print("File size:", os.path.getsize('TasteCrave_Presentation.pptx'), "bytes")

build_presentation()
