# 🔥 TasteCrave - Online Food Ordering System

A full-stack, zero-dependency **Online Food Ordering System** built with modern Node.js, SQLite, and responsive HTML5/CSS3/ES6 JavaScript. Users can browse artisanal food dishes across 7 categories, customize meals with sizes and toppings, manage a real-time cart with promo coupons, checkout with multiple payment methods, and monitor their order with live delivery tracking and kitchen management.

---

## 🌟 Key Features

### 1. 🍽️ Interactive Food Menu & Browsing
- **7 Culinary Categories**: Gourmet Burgers 🍔, Woodfired Pizzas 🍕, Bowls & Asian 🍜, Tacos & Mexican 🌮, Salads & Healthy 🥗, Sweet Treats 🍰, and Craft Drinks 🥤.
- **Dietary Filter Badges**: Filter dishes instantly by **🥦 Pure Veg**, **🌱 Vegan**, **🌶️ Spicy**, or **⭐ Bestsellers**.
- **Real-time Search & Sort**: Instant keyword search by title or ingredients, with sorting by Top Rated, Price (Low to High / High to Low), and Fastest Prep Time.
- **Dish Details**: High-resolution photography, calories count, prep time in minutes, chef ratings, and dietary labels with offline SVG fallback support.

### 2. 🛠️ Item Customizer Modal
- Select dish sizes (e.g., *Regular*, *Double Deluxe (+Patty)*, *Large 14"*).
- Select artisanal crusts and bases (Woodfired Thin, Stuffed Garlic Crust, Cauliflower GF).
- Select extra toppings (Aged Cheddar, Smoked Bacon, Avocado Slices, Truffle Aioli).
- Add custom cooking notes (e.g. *"Sauce on side, extra crispy fries"*).
- Live pricing updates as options are toggled.

### 3. 🛒 Real-Time Cart Drawer
- **Quantity Steppers**: Easily adjust quantities (`−` / `+`) or remove items.
- **Free Delivery Progress Meter**: Visual bar indicating how close the order is to unlocking free delivery (threshold: $35.00).
- **Promo Coupon Engine**:
  - `TASTY20`: 20% off on orders over $25
  - `FIRSTBITE`: $5 flat off on orders over $15
  - `FREESHIP`: Free shipping on orders over $20
  - `FEAST10`: 10% off storewide
- **Driver Tip Selector**: $0, $2, $3, $5.
- **Itemized Bill Breakdown**: Subtotal, Promo savings, Delivery fee, Estimated tax (8.25%), Tip, and Grand Total.
- **Persistent Cart**: Automatically saves items to `localStorage` across page refreshes.

### 4. 💳 Multi-Method Checkout Flow
- Delivery details: Full name, phone number, email, street address, area/city, and delivery instructions.
- Delivery speed option: Standard (30–40 min, $3.99) vs Priority Express (15–25 min, $5.99).
- Payment methods:
  - **Credit / Debit Card**: Formatted card inputs with expiry and CVV.
  - **Instant UPI / QR Code**: Interactive scanner prompt for contactless payments.
  - **Cash on Delivery (COD)**: Pay upon courier delivery.
- Animated Confetti celebration upon placing the order!

### 5. 🛵 Live Order Tracking
- Unique friendly order ID (e.g. `ORD-82914`).
- Visual 4-stage progress timeline:
  1. 📋 **Order Placed**: Kitchen accepted order
  2. 👨‍🍳 **Cooking in Kitchen**: Chef preparing meal
  3. 🛵 **Out for Delivery**: Courier on the way with live ETA
  4. 🏠 **Delivered**: Completed
- **Assigned Driver Card**: Courier name, rating, vehicle, and one-click call button.
- **Live Demo Step Simulator**: Advance order status step-by-step with one click.
- Automatic live polling every 4 seconds.

### 6. 👨‍🍳 Kitchen & Staff Admin Dashboard
- Toggle between **Customer View** and **Kitchen Mode** with one click.
- Live store metrics: Total Revenue, Active Kitchen Orders, Lifetime Orders, and Top Selling Dishes.
- Kanban columns: *Incoming*, *Cooking*, *Out for Delivery*, and *Delivered*.
- Staff can advance order status in real time (`Start Cooking` ➔ `Hand to Driver` ➔ `Mark Delivered`), instantly syncing to the customer's live tracker!

### 7. 📋 Order History
- View past orders with date, item summary, total, and live status.
- Re-track any past or active order.

### 8. 📊 10-Slide Project Presentation Deck
- **PowerPoint File**: `TasteCrave_Presentation.pptx` (16:9 widescreen, ready for Microsoft PowerPoint, Google Slides, or Keynote).
- **Interactive Web Slides**: Available in browser at `http://localhost:3000/presentation.html` with keyboard navigation, presenter notes mode (`[S]`), fullscreen mode (`[F]`), and print to PDF support.
- **Embedded Screenshots**: 6 high-definition UI screenshots covering Menu, Customizer, Cart, Checkout, Live Tracking, and Kitchen Dashboard saved in `presentation_screenshots/`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js version 18+ (Node.js 22+ recommended; tested and validated on Node.js 26.7.0).
- No external `npm install` packages required! (Zero external dependencies).

### Run the Server
From the project folder, run:

```bash
node server.js
```

Or double-click `start.bat` on Windows.

Then open your browser at:
```
http://localhost:3000
```

---

## 🧪 Running Unit Tests
To run the automated test suite verifying database schemas, ordering calculations, coupons, and status transitions:

```bash
npm test
# or: node test-database.js
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/categories` | Retrieve all food categories |
| `GET` | `/api/items` | Retrieve food items with optional filters (`category`, `search`, `isVeg`, `isVegan`, `isSpicy`, `isBestseller`, `sortBy`) |
| `GET` | `/api/items/:id` | Get details and customization options for a single food item |
| `GET` | `/api/coupons/validate?code=XYZ&subtotal=30` | Validate promo code and calculate discount amount |
| `POST` | `/api/orders` | Place a new food order |
| `GET` | `/api/orders` | List all orders (most recent first) |
| `GET` | `/api/orders/:id` | Get status and itemized receipt for an order |
| `PATCH` | `/api/orders/:id/status` | Update order status (`received`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`) |
| `POST` | `/api/orders/:id/advance` | Advance order status to the next stage (demo simulation) |
| `GET` | `/api/stats` | Get kitchen dashboard metrics (revenue, order counts, top items) |

---

## 📂 Project Architecture

```
food system management/
├── database.js          # SQLite schema, 24 gourmet seed items, queries, and order logic
├── server.js            # Zero-dependency Node.js HTTP server & REST API
├── start.bat            # Quick one-click Windows launcher
├── package.json         # Scripts and project metadata
├── test-database.js     # Comprehensive unit tests for logic & calculations
├── README.md            # Documentation and API reference
└── public/              # Modern frontend assets
    ├── index.html       # Single-page application structure & modals
    ├── css/
    │   └── styles.css   # Responsive UI design system, animations & dark slate theme
    └── js/
        ├── app.js       # App bootstrap, address picker & global modal handlers
        ├── data.js      # API fetch client, SVG artwork fallbacks & toast notifications
        ├── cart.js      # Cart manager, price math, promo engine & drawer UI
        ├── menu.js      # Categories, search, filter chips & item customizer modal
        ├── checkout.js  # Address validation, payment selectors & confetti effect
        ├── tracker.js   # Live order timeline tracker & order history modal
        └── admin.js     # Kitchen Kanban dashboard & store analytics
```

---

## 🔒 Reliability & Offline Support
- **Zero NPM Dependencies**: Relies exclusively on Node.js built-in modules (`node:http`, `node:sqlite`, `node:fs`, `node:path`), preventing any dependency conflicts or network installation issues.
- **Automatic Fallback SVGs**: If external CDN food photos are unreachable or offline, the app dynamically renders crisp vector illustrations so the UI always looks polished.
