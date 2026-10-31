const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'food_system.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for durability and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS food_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 4.5,
      review_count INTEGER NOT NULL DEFAULT 50,
      prep_time_minutes INTEGER NOT NULL DEFAULT 20,
      calories INTEGER NOT NULL DEFAULT 450,
      is_veg INTEGER NOT NULL DEFAULT 0,
      is_vegan INTEGER NOT NULL DEFAULT 0,
      is_spicy INTEGER NOT NULL DEFAULT 0,
      is_bestseller INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      customization_options TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL, -- 'percentage', 'fixed', 'free_shipping'
      discount_value REAL NOT NULL,
      min_order_amount REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_city TEXT NOT NULL,
      delivery_notes TEXT,
      delivery_speed TEXT NOT NULL DEFAULT 'standard',
      payment_method TEXT NOT NULL DEFAULT 'card',
      payment_status TEXT NOT NULL DEFAULT 'completed',
      status TEXT NOT NULL DEFAULT 'received', -- 'received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      tip REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      coupon_code TEXT,
      estimated_delivery_time TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      food_item_id INTEGER,
      item_name TEXT NOT NULL,
      item_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      selected_size TEXT,
      selected_extras TEXT,
      special_instructions TEXT,
      item_total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (categoryCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (id, name, icon, display_order) VALUES (?, ?, ?, ?)');
    const categories = [
      ['burgers', 'Gourmet Burgers', '🍔', 1],
      ['pizzas', 'Woodfired Pizzas', '🍕', 2],
      ['asian', 'Bowls & Asian', '🍜', 3],
      ['mexican', 'Tacos & Mexican', '🌮', 4],
      ['healthy', 'Salads & Healthy', '🥗', 5],
      ['desserts', 'Sweet Treats', '🍰', 6],
      ['beverages', 'Craft Drinks', '🥤', 7]
    ];
    for (const cat of categories) {
      insertCat.run(...cat);
    }
  }

  const couponCount = db.prepare('SELECT COUNT(*) as count FROM coupons').get().count;
  if (couponCount === 0) {
    const insertCoupon = db.prepare('INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, description, is_active) VALUES (?, ?, ?, ?, ?, 1)');
    const coupons = [
      ['TASTY20', 'percentage', 20, 25.0, '20% off on all orders over $25'],
      ['FIRSTBITE', 'fixed', 5.0, 15.0, '$5 off on your order over $15'],
      ['FREESHIP', 'free_shipping', 3.99, 20.0, 'Free delivery on orders over $20'],
      ['FEAST10', 'percentage', 10, 10.0, '10% off storewide']
    ];
    for (const cp of coupons) {
      insertCoupon.run(...cp);
    }
  }

  const itemCount = db.prepare('SELECT COUNT(*) as count FROM food_items').get().count;
  if (itemCount === 0) {
    const insertItem = db.prepare(`
      INSERT INTO food_items (
        category_id, name, description, price, image_url, rating, review_count,
        prep_time_minutes, calories, is_veg, is_vegan, is_spicy, is_bestseller, is_featured,
        customization_options
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const standardBurgerCustomization = JSON.stringify({
      sizes: [
        { name: 'Regular (Single Patty)', price: 0 },
        { name: 'Double Deluxe (+Patty)', price: 3.50 }
      ],
      extras: [
        { name: 'Aged Cheddar Slice', price: 1.25 },
        { name: 'Smoked Bacon Rashers', price: 1.95 },
        { name: 'Caramelized Onion Jam', price: 0.95 },
        { name: 'Fresh Avocado Slices', price: 1.75 },
        { name: 'Pickled Jalapeños', price: 0.75 }
      ],
      sauces: [
        { name: 'House Truffle Aioli', price: 0.75 },
        { name: 'Smoky Chipotle BBQ', price: 0.50 },
        { name: 'Garlic Herb Mayo', price: 0.50 }
      ]
    });

    const standardPizzaCustomization = JSON.stringify({
      sizes: [
        { name: 'Medium (10")', price: 0 },
        { name: 'Large (14")', price: 4.50 },
        { name: 'Family Monster (18")', price: 8.00 }
      ],
      crusts: [
        { name: 'Woodfired Thin Crust', price: 0 },
        { name: 'Stuffed Garlic Crust', price: 2.50 },
        { name: 'Gluten-Free Cauliflower Crust', price: 3.00 }
      ],
      extras: [
        { name: 'Extra Mozzarella Di Bufala', price: 2.00 },
        { name: 'Hot Honey Drizzle', price: 1.25 },
        { name: 'Kalamata Olives & Basil', price: 1.50 },
        { name: 'Crispy Pepperoni Cups', price: 2.25 }
      ]
    });

    const standardBowlCustomization = JSON.stringify({
      sizes: [
        { name: 'Regular Bowl', price: 0 },
        { name: 'Proteins Boost (+50% Meat/Tofu)', price: 3.75 }
      ],
      bases: [
        { name: 'Jasmine Rice', price: 0 },
        { name: 'Brown Quinoa Mix', price: 1.00 },
        { name: 'Zucchini Noodles', price: 1.50 }
      ],
      extras: [
        { name: 'Ramen Soft-Boiled Egg', price: 1.50 },
        { name: 'Spicy Edamame', price: 1.25 },
        { name: 'Fried Crispy Wontons', price: 1.00 }
      ]
    });

    const standardMexicanCustomization = JSON.stringify({
      sizes: [
        { name: 'Standard Platter', price: 0 },
        { name: 'Super Combo with Chips & Salsa', price: 3.25 }
      ],
      extras: [
        { name: 'House Guacamole Scoop', price: 2.25 },
        { name: 'Queso Blanco Dip', price: 1.95 },
        { name: 'Sour Cream & Cilantro', price: 0.75 },
        { name: 'Extra Birria Consomé', price: 1.75 }
      ]
    });

    const standardSweetCustomization = JSON.stringify({
      sizes: [
        { name: 'Single Serving', price: 0 },
        { name: 'Sharing Duo', price: 3.99 }
      ],
      extras: [
        { name: 'Vanilla Bean Ice Cream Scoop', price: 1.95 },
        { name: 'Warm Belgian Chocolate Ganache', price: 1.50 },
        { name: 'Toasted Crushed Hazelnuts', price: 1.00 }
      ]
    });

    const standardDrinkCustomization = JSON.stringify({
      sizes: [
        { name: 'Regular (16 oz)', price: 0 },
        { name: 'Grande (24 oz)', price: 1.50 }
      ],
      sweetness: [
        { name: '100% Regular Sweetness', price: 0 },
        { name: '50% Half Sweet', price: 0 },
        { name: 'Zero Sugar / Stevia', price: 0 }
      ],
      extras: [
        { name: 'Extra Boba Pearls', price: 0.95 },
        { name: 'Espresso Double Shot', price: 1.50 },
        { name: 'Coconut Cream Foam', price: 1.00 }
      ]
    });

    const foodItems = [
      // BURGERS
      [
        'burgers',
        'Signature Truffle Smash Burger',
        'Double dry-aged Angus beef smashed patties, black truffle butter, caramelized sweet onions, smoked provolone, and brioche bun.',
        13.99,
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
        4.9, 412, 18, 720, 0, 0, 0, 1, 1, standardBurgerCustomization
      ],
      [
        'burgers',
        'Nashville Hot Crispy Chicken',
        'Buttermilk fried chicken breast drenched in fiery Nashville cayenne chili oil, cooling dill slaw, pickles, and brioche bun.',
        12.49,
        'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=700&q=80',
        4.8, 320, 15, 680, 0, 0, 2, 1, 0, standardBurgerCustomization
      ],
      [
        'burgers',
        'Smoked Bacon BBQ Double Cheddar',
        'Two flame-grilled beef patties, applewood thick-cut bacon, sharp Vermont cheddar, crispy onion rings, and honey bourbon BBQ sauce.',
        14.99,
        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=700&q=80',
        4.7, 280, 20, 840, 0, 0, 0, 0, 0, standardBurgerCustomization
      ],
      [
        'burgers',
        'Portobello & Garlic Herb Vegan Burger',
        'Balsamic-glazed roasted portobello cap, plant-based patty, avocado smash, wild arugula, and vegan roasted garlic mayo on whole grain bun.',
        11.99,
        'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=700&q=80',
        4.7, 195, 15, 510, 1, 1, 0, 0, 0, standardBurgerCustomization
      ],

      // PIZZAS
      [
        'pizzas',
        'Artisanal Margherita Di Bufala',
        'San Marzano tomato coulis, fresh mozzarella di bufala, fragrant sweet basil, extra virgin olive oil, and sea salt on sourdough crust.',
        15.99,
        'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=700&q=80',
        4.9, 530, 20, 620, 1, 0, 0, 1, 1, standardPizzaCustomization
      ],
      [
        'pizzas',
        'Pepperoni & Mike’s Hot Honey',
        'Crispy cupped pepperoni, whole-milk mozzarella, crushed red pepper, and sweet-heat artisanal hot honey drizzle.',
        17.49,
        'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=700&q=80',
        4.9, 610, 22, 780, 0, 0, 1, 1, 0, standardPizzaCustomization
      ],
      [
        'pizzas',
        'Quattro Formaggi White Truffle',
        'Creamy garlic ricotta base, fontina, gorgonzola dolce, aged pecorino, cracked black pepper, and white truffle oil.',
        16.99,
        'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=700&q=80',
        4.8, 240, 20, 710, 1, 0, 0, 0, 0, standardPizzaCustomization
      ],
      [
        'pizzas',
        'Rustic Wild Mushroom & Herb',
        'Roasted cremini and shiitake mushrooms, fresh thyme, caramelized leeks, dairy-free cashew mozzarella, and balsamic reduction.',
        16.50,
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80',
        4.7, 180, 18, 560, 1, 1, 0, 0, 0, standardPizzaCustomization
      ],

      // ASIAN & BOWLS
      [
        'asian',
        'Tokyo Rich Tonkotsu Ramen',
        '18-hour simmered silky pork bone broth, hand-crafted springy noodles, chashu pork belly, marinated ajitsuke tamago egg, bamboo shoots, and scallions.',
        14.99,
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80',
        4.9, 470, 15, 690, 0, 0, 1, 1, 1, standardBowlCustomization
      ],
      [
        'asian',
        'Teriyaki Glazed Salmon Poke Bowl',
        'Wild Atlantic grilled salmon, steamed sushi rice, edamame beans, hass avocado, pickled ginger, wakame seaweed, and toasted sesame teriyaki.',
        16.50,
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
        4.8, 350, 14, 590, 0, 0, 0, 1, 0, standardBowlCustomization
      ],
      [
        'asian',
        'Bangkok Royal Pad Thai Prawns',
        'Wok-tossed rice noodles with succulent tiger prawns, pressed tofu, eggs, crushed peanuts, tamarind glaze, and fresh lime wedges.',
        15.50,
        'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=700&q=80',
        4.8, 290, 16, 640, 0, 0, 1, 0, 0, standardBowlCustomization
      ],
      [
        'asian',
        'Fiery Kung Pao Crispy Tofu',
        'Golden pan-seared organic tofu, toasted Sichuan peppercorns, roasted peanuts, bell peppers, scallions, and sweet-tangy kung pao sauce with Jasmine rice.',
        12.99,
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80',
        4.7, 215, 14, 490, 1, 1, 2, 0, 0, standardBowlCustomization
      ],

      // MEXICAN & TACOS
      [
        'mexican',
        'Jalisco Braised Beef Birria Tacos (3 pcs)',
        'Slow-braised tender beef short rib folded in griddled corn tortillas with melted Oaxaca cheese, cilantro, onion, and rich consomé dipping broth.',
        13.99,
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=700&q=80',
        4.9, 620, 15, 750, 0, 0, 1, 1, 1, standardMexicanCustomization
      ],
      [
        'mexican',
        'California Carne Asada Burrito',
        'Marinated charbroiled skirt steak, seasoned crispy french fries, melted cheese blend, pico de gallo, and creamy avocado salsa wrapped in a warm flour tortilla.',
        12.99,
        'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=80',
        4.8, 380, 12, 820, 0, 0, 1, 0, 0, standardMexicanCustomization
      ],
      [
        'mexican',
        'Baja Crispy Wild Cod Tacos (3 pcs)',
        'Beer-battered golden cod fillets, purple cabbage slaw, chipotle crema, cotija cheese, and fresh pico in warm soft corn tortillas.',
        13.50,
        'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=700&q=80',
        4.7, 260, 14, 580, 0, 0, 1, 0, 0, standardMexicanCustomization
      ],

      // HEALTHY & SALADS
      [
        'healthy',
        'Mediterranean Lemon Herb Chicken Salad',
        'Herb-marinated grilled chicken strips, crisp romaine, Persian cucumbers, Kalamata olives, sheep’s milk feta, cherry tomatoes, and Greek lemon oregano vinaigrette.',
        12.99,
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
        4.8, 310, 12, 420, 0, 0, 0, 1, 0, standardBowlCustomization
      ],
      [
        'healthy',
        'Superfood Roasted Sweet Potato Quinoa Bowl',
        'Tri-color quinoa, baby spinach, spiced roasted sweet potatoes, edamame, toasted pumpkin seeds, sliced avocado, and creamy ginger tahini dressing.',
        11.99,
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80',
        4.8, 230, 10, 380, 1, 1, 0, 0, 0, standardBowlCustomization
      ],
      [
        'healthy',
        'Wild Acai Bowl with Chia & Fresh Berries',
        'Pure organic Amazonian acai puree blended with banana, topped with organic granola, chia seeds, fresh strawberries, blueberries, and honey drizzle.',
        9.99,
        'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=700&q=80',
        4.9, 190, 8, 310, 1, 1, 0, 0, 0, standardBowlCustomization
      ],

      // DESSERTS
      [
        'desserts',
        'Warm Belgian Chocolate Molten Lava Cake',
        'Decadent dark chocolate soufflé cake with a rich liquid ganache center, dusted with powdered sugar, served with fresh raspberry.',
        7.99,
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80',
        4.9, 580, 10, 480, 1, 0, 0, 1, 1, standardSweetCustomization
      ],
      [
        'desserts',
        'New York Creamy Cheesecake',
        'Velvety smooth Philadelphia cream cheese filling on buttery graham cracker crust, topped with wild strawberry compote.',
        6.99,
        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=80',
        4.8, 340, 5, 410, 1, 0, 0, 0, 0, standardSweetCustomization
      ],
      [
        'desserts',
        'Cinnamon Churros con Dulce de Leche',
        'Six golden crispy fried pastry sticks rolled in fragrant cinnamon sugar, served with warm Mexican chocolate & dulce de leche dips.',
        6.50,
        'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=700&q=80',
        4.8, 270, 8, 440, 1, 0, 0, 0, 0, standardSweetCustomization
      ],

      // BEVERAGES
      [
        'beverages',
        'Sparkling Passionfruit Mint Cooler',
        'Freshly pressed tropical passionfruit puree, muddled spearmint leaves, cane sugar syrup, and effervescent sparkling soda.',
        4.99,
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80',
        4.8, 320, 5, 120, 1, 1, 0, 1, 0, standardDrinkCustomization
      ],
      [
        'beverages',
        'Madagascar Vanilla Sweet Cream Cold Brew',
        'Slow-steeped 20-hour dark roast cold brew coffee topped with a thick layer of house-whipped Madagascar vanilla sweet cream.',
        4.50,
        'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80',
        4.9, 410, 5, 140, 1, 0, 0, 1, 0, standardDrinkCustomization
      ],
      [
        'beverages',
        'Ceremonial Japanese Iced Matcha Latte',
        'Single-origin Uji green tea matcha whisked with oat milk and a touch of organic agave nectar over crystalline ice cubes.',
        5.25,
        'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=700&q=80',
        4.7, 260, 5, 110, 1, 1, 0, 0, 0, standardDrinkCustomization
      ]
    ];

    for (const item of foodItems) {
      insertItem.run(...item);
    }
  }
}

// Helper methods for application queries
function getCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
}

function getFoodItems(filter = {}) {
  let sql = 'SELECT * FROM food_items WHERE 1=1';
  const params = [];

  if (filter.category && filter.category !== 'all') {
    sql += ' AND category_id = ?';
    params.push(filter.category);
  }

  if (filter.search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    const term = `%${filter.search}%`;
    params.push(term, term);
  }

  if (filter.isVeg) {
    sql += ' AND is_veg = 1';
  }

  if (filter.isVegan) {
    sql += ' AND is_vegan = 1';
  }

  if (filter.isSpicy) {
    sql += ' AND is_spicy > 0';
  }

  if (filter.isBestseller) {
    sql += ' AND is_bestseller = 1';
  }

  // Sort
  if (filter.sortBy === 'price_asc') {
    sql += ' ORDER BY price ASC';
  } else if (filter.sortBy === 'price_desc') {
    sql += ' ORDER BY price DESC';
  } else if (filter.sortBy === 'rating') {
    sql += ' ORDER BY rating DESC';
  } else if (filter.sortBy === 'prep_time') {
    sql += ' ORDER BY prep_time_minutes ASC';
  } else {
    sql += ' ORDER BY is_featured DESC, is_bestseller DESC, id ASC';
  }

  const items = db.prepare(sql).all(...params);
  return items.map(item => ({
    ...item,
    customization_options: item.customization_options ? JSON.parse(item.customization_options) : null
  }));
}

function getFoodItemById(id) {
  const item = db.prepare('SELECT * FROM food_items WHERE id = ?').get(id);
  if (!item) return null;
  return {
    ...item,
    customization_options: item.customization_options ? JSON.parse(item.customization_options) : null
  };
}

function validateCoupon(code, subtotal) {
  if (!code) return { valid: false, message: 'Coupon code required' };
  const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(code);
  if (!coupon) {
    return { valid: false, message: 'Invalid or expired coupon code' };
  }
  if (subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      message: `Minimum order amount of $${coupon.min_order_amount.toFixed(2)} required for coupon ${coupon.code}`
    };
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (subtotal * coupon.discount_value) / 100;
  } else if (coupon.discount_type === 'fixed') {
    discount = Math.min(coupon.discount_value, subtotal);
  } else if (coupon.discount_type === 'free_shipping') {
    discount = coupon.discount_value;
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.discount_type,
    discountAmount: Math.round(discount * 100) / 100,
    description: coupon.description
  };
}

function createOrder(orderData) {
  const {
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryCity = 'Metro Area',
    deliveryNotes = '',
    deliverySpeed = 'standard',
    paymentMethod = 'card',
    tip = 0,
    couponCode = null,
    items = []
  } = orderData;

  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Calculate totals from database
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const dbItem = db.prepare('SELECT * FROM food_items WHERE id = ?').get(item.id);
    if (!dbItem) {
      throw new Error(`Item ID ${item.id} not found`);
    }

    let unitPrice = dbItem.price;
    // Calculate size adjustment if selected
    if (item.selectedSize && item.selectedSize.price) {
      unitPrice += Number(item.selectedSize.price);
    }

    // Calculate extras adjustment
    if (Array.isArray(item.selectedExtras)) {
      for (const extra of item.selectedExtras) {
        if (extra && extra.price) {
          unitPrice += Number(extra.price);
        }
      }
    }

    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const itemTotal = Math.round(unitPrice * qty * 100) / 100;
    subtotal += itemTotal;

    processedItems.push({
      foodItemId: dbItem.id,
      itemName: dbItem.name,
      itemPrice: unitPrice,
      quantity: qty,
      selectedSize: item.selectedSize ? item.selectedSize.name : 'Regular',
      selectedExtras: JSON.stringify(item.selectedExtras || []),
      specialInstructions: item.specialInstructions || '',
      itemTotal: itemTotal
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // Coupon discount
  let discount = 0;
  let validatedCoupon = null;
  if (couponCode) {
    validatedCoupon = validateCoupon(couponCode, subtotal);
    if (validatedCoupon.valid) {
      discount = validatedCoupon.discountAmount;
    }
  }

  // Standard delivery $3.99, priority $5.99; free delivery over $35 or free shipping coupon
  let deliveryFee = deliverySpeed === 'priority' ? 5.99 : 3.99;
  if (subtotal >= 35.0 || (validatedCoupon && validatedCoupon.type === 'free_shipping')) {
    deliveryFee = 0;
  }

  // 8.25% tax on taxable subtotal (after discount)
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.0825 * 100) / 100;
  const tipAmount = Math.max(0, Number(tip) || 0);
  const total = Math.round((taxableAmount + tax + deliveryFee + tipAmount) * 100) / 100;

  // Generate friendly Order ID e.g. ORD-78241
  const orderNumber = Math.floor(10000 + Math.random() * 90000);
  const orderId = `ORD-${orderNumber}`;

  // Estimate delivery time
  const prepMinutes = deliverySpeed === 'priority' ? 20 : 35;
  const estTime = new Date(Date.now() + prepMinutes * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Assign friendly driver
  const drivers = [
    { name: 'Alex Rivera', phone: '(555) 234-8891' },
    { name: 'Marcus Chen', phone: '(555) 749-3320' },
    { name: 'Sarah Jenkins', phone: '(555) 812-4467' },
    { name: 'Elena Gomez', phone: '(555) 901-2244' }
  ];
  const driver = drivers[Math.floor(Math.random() * drivers.length)];

  // Begin transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, delivery_address,
        delivery_city, delivery_notes, delivery_speed, payment_method, payment_status,
        status, subtotal, tax, delivery_fee, tip, discount, total, coupon_code,
        estimated_delivery_time, driver_name, driver_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryCity,
      deliveryNotes,
      deliverySpeed,
      paymentMethod,
      'completed',
      'received',
      subtotal,
      tax,
      deliveryFee,
      tipAmount,
      discount,
      total,
      couponCode || null,
      estTime,
      driver.name,
      driver.phone
    );

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (
        order_id, food_item_id, item_name, item_price, quantity,
        selected_size, selected_extras, special_instructions, item_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of processedItems) {
      insertOrderItem.run(
        orderId,
        item.foodItemId,
        item.itemName,
        item.itemPrice,
        item.quantity,
        item.selectedSize,
        item.selectedExtras,
        item.specialInstructions,
        item.itemTotal
      );
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return getOrderById(orderId);
}

function getOrderById(id) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return {
    ...order,
    items: items.map(item => ({
      ...item,
      selected_extras: item.selected_extras ? JSON.parse(item.selected_extras) : []
    }))
  };
}

function getAllOrders(limit = 50) {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?').all(limit);
  return orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return {
      ...order,
      items: items.map(item => ({
        ...item,
        selected_extras: item.selected_extras ? JSON.parse(item.selected_extras) : []
      }))
    };
  });
}

function updateOrderStatus(id, newStatus) {
  const allowed = ['received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status "${newStatus}". Allowed: ${allowed.join(', ')}`);
  }

  const update = db.prepare(`
    UPDATE orders
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  const res = update.run(newStatus, id);
  if (res.changes === 0) {
    return null;
  }
  return getOrderById(id);
}

function getStats() {
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != 'cancelled'").get().revenue;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const activeOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('received', 'preparing', 'out_for_delivery')").get().count;
  const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'").get().count;

  const popularItems = db.prepare(`
    SELECT item_name, SUM(quantity) as total_sold, SUM(item_total) as total_sales
    FROM order_items
    GROUP BY item_name
    ORDER BY total_sold DESC
    LIMIT 5
  `).all();

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    activeOrders,
    completedOrders,
    popularItems
  };
}

module.exports = {
  db,
  initDatabase,
  getCategories,
  getFoodItems,
  getFoodItemById,
  validateCoupon,
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getStats
};
