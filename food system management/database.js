/**
 * TasteCrave Database & Data Layer
 * Resilient Dual-Engine:
 *  - SQLite engine (DatabaseSync) for persistent local development
 *  - Universal pure JavaScript in-memory engine for Vercel / Serverless / Cloud Lambda environments
 * 
 * Works 100% out-of-the-box with ZERO native compilation errors or read-only filesystem crashes.
 */

const path = require('node:path');

// Determine if running in a serverless read-only environment
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.FORCE_IN_MEMORY
);

let sqliteDb = null;
let useInMemory = false;

if (isServerless) {
  useInMemory = true;
} else {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const DB_PATH = path.join(__dirname, 'food_system.db');
    sqliteDb = new DatabaseSync(DB_PATH);
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    // Graceful fallback if node:sqlite is absent (Node <22.5) or if DB path is read-only
    console.warn('[Notice] SQLite unavailable or read-only environment. Using high-speed in-memory store:', err.message);
    useInMemory = true;
    sqliteDb = null;
  }
}

// ============================================================================
// SEED DATA DEFINITIONS (Universal across SQLite and In-Memory)
// ============================================================================

const CATEGORIES_DATA = [
  { id: 'burgers', name: 'Gourmet Burgers', icon: '🍔', display_order: 1 },
  { id: 'pizzas', name: 'Woodfired Pizzas', icon: '🍕', display_order: 2 },
  { id: 'asian', name: 'Bowls & Asian', icon: '🍜', display_order: 3 },
  { id: 'mexican', name: 'Tacos & Mexican', icon: '🌮', display_order: 4 },
  { id: 'healthy', name: 'Salads & Healthy', icon: '🥗', display_order: 5 },
  { id: 'desserts', name: 'Sweet Treats', icon: '🍰', display_order: 6 },
  { id: 'beverages', name: 'Craft Drinks', icon: '🥤', display_order: 7 }
];

const COUPONS_DATA = [
  { code: 'TASTY20', discount_type: 'percentage', discount_value: 20, min_order_amount: 25.0, description: '20% off on all orders over $25', is_active: 1 },
  { code: 'FIRSTBITE', discount_type: 'fixed', discount_value: 5.0, min_order_amount: 15.0, description: '$5 off on your order over $15', is_active: 1 },
  { code: 'FREESHIP', discount_type: 'free_shipping', discount_value: 3.99, min_order_amount: 20.0, description: 'Free delivery on orders over $20', is_active: 1 },
  { code: 'FEAST10', discount_type: 'percentage', discount_value: 10, min_order_amount: 10.0, description: '10% off storewide', is_active: 1 }
];

const standardBurgerCustomization = {
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
};

const standardPizzaCustomization = {
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
};

const standardBowlCustomization = {
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
};

const standardMexicanCustomization = {
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
};

const standardSweetCustomization = {
  sizes: [
    { name: 'Single Serving', price: 0 },
    { name: 'Sharing Duo', price: 3.99 }
  ],
  extras: [
    { name: 'Vanilla Bean Ice Cream Scoop', price: 1.95 },
    { name: 'Warm Belgian Chocolate Ganache', price: 1.50 },
    { name: 'Toasted Crushed Hazelnuts', price: 1.00 }
  ]
};

const standardDrinkCustomization = {
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
};

const FOOD_ITEMS_DATA = [
  // BURGERS
  {
    id: 1,
    category_id: 'burgers',
    name: 'Signature Truffle Smash Burger',
    description: 'Double dry-aged Angus beef smashed patties, black truffle butter, caramelized sweet onions, smoked provolone, and brioche bun.',
    price: 13.99,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    rating: 4.9, review_count: 412, prep_time_minutes: 18, calories: 720,
    is_veg: 0, is_vegan: 0, is_spicy: 0, is_bestseller: 1, is_featured: 1,
    customization_options: standardBurgerCustomization
  },
  {
    id: 2,
    category_id: 'burgers',
    name: 'Nashville Hot Crispy Chicken',
    description: 'Buttermilk fried chicken breast drenched in fiery Nashville cayenne chili oil, cooling dill slaw, pickles, and brioche bun.',
    price: 12.49,
    image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 320, prep_time_minutes: 15, calories: 680,
    is_veg: 0, is_vegan: 0, is_spicy: 2, is_bestseller: 1, is_featured: 0,
    customization_options: standardBurgerCustomization
  },
  {
    id: 3,
    category_id: 'burgers',
    name: 'Smoked Bacon BBQ Double Cheddar',
    description: 'Two flame-grilled beef patties, applewood thick-cut bacon, sharp Vermont cheddar, crispy onion rings, and honey bourbon BBQ sauce.',
    price: 14.99,
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=700&q=80',
    rating: 4.7, review_count: 280, prep_time_minutes: 20, calories: 840,
    is_veg: 0, is_vegan: 0, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardBurgerCustomization
  },
  {
    id: 4,
    category_id: 'burgers',
    name: 'Portobello & Garlic Herb Vegan Burger',
    description: 'Balsamic-glazed roasted portobello cap, plant-based patty, avocado smash, wild arugula, and vegan roasted garlic mayo on whole grain bun.',
    price: 11.99,
    image_url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=700&q=80',
    rating: 4.7, review_count: 195, prep_time_minutes: 15, calories: 510,
    is_veg: 1, is_vegan: 1, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardBurgerCustomization
  },

  // PIZZAS
  {
    id: 5,
    category_id: 'pizzas',
    name: 'Artisanal Margherita Di Bufala',
    description: 'San Marzano tomato coulis, fresh mozzarella di bufala, fragrant sweet basil, extra virgin olive oil, and sea salt on sourdough crust.',
    price: 15.99,
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=700&q=80',
    rating: 4.9, review_count: 530, prep_time_minutes: 20, calories: 620,
    is_veg: 1, is_vegan: 0, is_spicy: 0, is_bestseller: 1, is_featured: 1,
    customization_options: standardPizzaCustomization
  },
  {
    id: 6,
    category_id: 'pizzas',
    name: 'Pepperoni & Mike’s Hot Honey',
    description: 'Crispy cupped pepperoni, whole-milk mozzarella, crushed red pepper, and sweet-heat artisanal hot honey drizzle.',
    price: 17.49,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=700&q=80',
    rating: 4.9, review_count: 610, prep_time_minutes: 22, calories: 780,
    is_veg: 0, is_vegan: 0, is_spicy: 1, is_bestseller: 1, is_featured: 0,
    customization_options: standardPizzaCustomization
  },
  {
    id: 7,
    category_id: 'pizzas',
    name: 'Quattro Formaggi White Truffle',
    description: 'Creamy garlic ricotta base, fontina, gorgonzola dolce, aged pecorino, cracked black pepper, and white truffle oil.',
    price: 16.99,
    image_url: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 240, prep_time_minutes: 20, calories: 710,
    is_veg: 1, is_vegan: 0, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardPizzaCustomization
  },
  {
    id: 8,
    category_id: 'pizzas',
    name: 'Rustic Wild Mushroom & Herb',
    description: 'Roasted cremini and shiitake mushrooms, fresh thyme, caramelized leeks, dairy-free cashew mozzarella, and balsamic reduction.',
    price: 16.50,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80',
    rating: 4.7, review_count: 180, prep_time_minutes: 18, calories: 560,
    is_veg: 1, is_vegan: 1, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardPizzaCustomization
  },

  // ASIAN & BOWLS
  {
    id: 9,
    category_id: 'asian',
    name: 'Tokyo Rich Tonkotsu Ramen',
    description: '18-hour simmered silky pork bone broth, hand-crafted springy noodles, chashu pork belly, marinated ajitsuke tamago egg, bamboo shoots, and scallions.',
    price: 14.99,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80',
    rating: 4.9, review_count: 470, prep_time_minutes: 15, calories: 690,
    is_veg: 0, is_vegan: 0, is_spicy: 1, is_bestseller: 1, is_featured: 1,
    customization_options: standardBowlCustomization
  },
  {
    id: 10,
    category_id: 'asian',
    name: 'Teriyaki Glazed Salmon Poke Bowl',
    description: 'Wild Atlantic grilled salmon, steamed sushi rice, edamame beans, hass avocado, pickled ginger, wakame seaweed, and toasted sesame teriyaki.',
    price: 16.50,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 350, prep_time_minutes: 14, calories: 590,
    is_veg: 0, is_vegan: 0, is_spicy: 0, is_bestseller: 1, is_featured: 0,
    customization_options: standardBowlCustomization
  },
  {
    id: 11,
    category_id: 'asian',
    name: 'Bangkok Royal Pad Thai Prawns',
    description: 'Wok-tossed rice noodles with succulent tiger prawns, pressed tofu, eggs, crushed peanuts, tamarind glaze, and fresh lime wedges.',
    price: 15.50,
    image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 290, prep_time_minutes: 16, calories: 640,
    is_veg: 0, is_vegan: 0, is_spicy: 1, is_bestseller: 0, is_featured: 0,
    customization_options: standardBowlCustomization
  },
  {
    id: 12,
    category_id: 'asian',
    name: 'Fiery Kung Pao Crispy Tofu',
    description: 'Golden pan-seared organic tofu, toasted Sichuan peppercorns, roasted peanuts, bell peppers, scallions, and sweet-tangy kung pao sauce with Jasmine rice.',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80',
    rating: 4.7, review_count: 215, prep_time_minutes: 14, calories: 490,
    is_veg: 1, is_vegan: 1, is_spicy: 2, is_bestseller: 0, is_featured: 0,
    customization_options: standardBowlCustomization
  },

  // MEXICAN & TACOS
  {
    id: 13,
    category_id: 'mexican',
    name: 'Jalisco Braised Beef Birria Tacos (3 pcs)',
    description: 'Slow-braised tender beef short rib folded in griddled corn tortillas with melted Oaxaca cheese, cilantro, onion, and rich consomé dipping broth.',
    price: 13.99,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=700&q=80',
    rating: 4.9, review_count: 620, prep_time_minutes: 15, calories: 750,
    is_veg: 0, is_vegan: 0, is_spicy: 1, is_bestseller: 1, is_featured: 1,
    customization_options: standardMexicanCustomization
  },
  {
    id: 14,
    category_id: 'mexican',
    name: 'California Carne Asada Burrito',
    description: 'Marinated charbroiled skirt steak, seasoned crispy french fries, melted cheese blend, pico de gallo, and creamy avocado salsa wrapped in a warm flour tortilla.',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 380, prep_time_minutes: 12, calories: 820,
    is_veg: 0, is_vegan: 0, is_spicy: 1, is_bestseller: 0, is_featured: 0,
    customization_options: standardMexicanCustomization
  },
  {
    id: 15,
    category_id: 'mexican',
    name: 'Baja Crispy Wild Cod Tacos (3 pcs)',
    description: 'Beer-battered golden cod fillets, purple cabbage slaw, chipotle crema, cotija cheese, and fresh pico in warm soft corn tortillas.',
    price: 13.50,
    image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=700&q=80',
    rating: 4.7, review_count: 260, prep_time_minutes: 14, calories: 580,
    is_veg: 0, is_vegan: 0, is_spicy: 1, is_bestseller: 0, is_featured: 0,
    customization_options: standardMexicanCustomization
  },

  // HEALTHY & SALADS
  {
    id: 16,
    category_id: 'healthy',
    name: 'Mediterranean Lemon Herb Chicken Salad',
    description: 'Herb-marinated grilled chicken strips, crisp romaine, Persian cucumbers, Kalamata olives, sheep’s milk feta, cherry tomatoes, and Greek lemon oregano vinaigrette.',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 310, prep_time_minutes: 12, calories: 420,
    is_veg: 0, is_vegan: 0, is_spicy: 0, is_bestseller: 1, is_featured: 0,
    customization_options: standardBowlCustomization
  },
  {
    id: 17,
    category_id: 'healthy',
    name: 'Superfood Roasted Sweet Potato Quinoa Bowl',
    description: 'Tri-color quinoa, baby spinach, spiced roasted sweet potatoes, edamame, toasted pumpkin seeds, sliced avocado, and creamy ginger tahini dressing.',
    price: 11.99,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 230, prep_time_minutes: 10, calories: 380,
    is_veg: 1, is_vegan: 1, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardBowlCustomization
  },
  {
    id: 18,
    category_id: 'healthy',
    name: 'Wild Acai Bowl with Chia & Fresh Berries',
    description: 'Pure organic Amazonian acai puree blended with banana, topped with organic granola, chia seeds, fresh strawberries, blueberries, and honey drizzle.',
    price: 9.99,
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=700&q=80',
    rating: 4.9, review_count: 190, prep_time_minutes: 8, calories: 310,
    is_veg: 1, is_vegan: 1, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardBowlCustomization
  },

  // DESSERTS
  {
    id: 19,
    category_id: 'desserts',
    name: 'Warm Belgian Chocolate Molten Lava Cake',
    description: 'Decadent dark chocolate soufflé cake with a rich liquid ganache center, dusted with powdered sugar, served with fresh raspberry.',
    price: 7.99,
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80',
    rating: 4.9, review_count: 580, prep_time_minutes: 10, calories: 480,
    is_veg: 1, is_vegan: 0, is_spicy: 0, is_bestseller: 1, is_featured: 1,
    customization_options: standardSweetCustomization
  },
  {
    id: 20,
    category_id: 'desserts',
    name: 'New York Creamy Cheesecake',
    description: 'Velvety smooth Philadelphia cream cheese filling on buttery graham cracker crust, topped with wild strawberry compote.',
    price: 6.99,
    image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 340, prep_time_minutes: 5, calories: 410,
    is_veg: 1, is_vegan: 0, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardSweetCustomization
  },
  {
    id: 21,
    category_id: 'desserts',
    name: 'Cinnamon Churros con Dulce de Leche',
    description: 'Six golden crispy fried pastry sticks rolled in fragrant cinnamon sugar, served with warm Mexican chocolate & dulce de leche dips.',
    price: 6.50,
    image_url: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 270, prep_time_minutes: 8, calories: 440,
    is_veg: 1, is_vegan: 0, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardSweetCustomization
  },

  // BEVERAGES
  {
    id: 22,
    category_id: 'beverages',
    name: 'Sparkling Passionfruit Mint Cooler',
    description: 'Freshly pressed tropical passionfruit puree, muddled spearmint leaves, cane sugar syrup, and effervescent sparkling soda.',
    price: 4.99,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80',
    rating: 4.8, review_count: 320, prep_time_minutes: 5, calories: 120,
    is_veg: 1, is_vegan: 1, is_spicy: 0, is_bestseller: 1, is_featured: 0,
    customization_options: standardDrinkCustomization
  },
  {
    id: 23,
    category_id: 'beverages',
    name: 'Madagascar Vanilla Sweet Cream Cold Brew',
    description: 'Slow-steeped 20-hour dark roast cold brew coffee topped with a thick layer of house-whipped Madagascar vanilla sweet cream.',
    price: 4.50,
    image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80',
    rating: 4.9, review_count: 410, prep_time_minutes: 5, calories: 140,
    is_veg: 1, is_vegan: 0, is_spicy: 0, is_bestseller: 1, is_featured: 0,
    customization_options: standardDrinkCustomization
  },
  {
    id: 24,
    category_id: 'beverages',
    name: 'Ceremonial Japanese Iced Matcha Latte',
    description: 'Single-origin Uji green tea matcha whisked with oat milk and a touch of organic agave nectar over crystalline ice cubes.',
    price: 5.25,
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=700&q=80',
    rating: 4.7, review_count: 260, prep_time_minutes: 5, calories: 110,
    is_veg: 1, is_vegan: 1, is_spicy: 0, is_bestseller: 0, is_featured: 0,
    customization_options: standardDrinkCustomization
  }
];

const INITIAL_SAMPLE_ORDERS = [
  {
    id: 'ORD-92814',
    customer_name: 'Sophia Patel',
    customer_email: 'sophia.patel@example.com',
    customer_phone: '(555) 345-6789',
    delivery_address: '120 Market Street, Apt 5B',
    delivery_city: 'Downtown',
    delivery_notes: 'Leave at front desk with doorman',
    delivery_speed: 'standard',
    payment_method: 'card',
    payment_status: 'completed',
    status: 'delivered',
    subtotal: 42.48,
    tax: 2.80,
    delivery_fee: 0,
    tip: 5.00,
    discount: 8.50,
    total: 41.78,
    coupon_code: 'TASTY20',
    estimated_delivery_time: '12:15 PM',
    driver_name: 'Alex Rivera',
    driver_phone: '(555) 234-8891',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    items: [
      {
        id: 1,
        order_id: 'ORD-92814',
        food_item_id: 1,
        item_name: 'Signature Truffle Smash Burger',
        item_price: 13.99,
        quantity: 2,
        selected_size: 'Regular (Single Patty)',
        selected_extras: [{ name: 'Aged Cheddar Slice', price: 1.25 }],
        special_instructions: 'Extra napkins please',
        item_total: 30.48
      },
      {
        id: 2,
        order_id: 'ORD-92814',
        food_item_id: 22,
        item_name: 'Sparkling Passionfruit Mint Cooler',
        item_price: 4.99,
        quantity: 2,
        selected_size: 'Regular (16 oz)',
        selected_extras: [],
        special_instructions: '',
        item_total: 9.98
      }
    ]
  },
  {
    id: 'ORD-54128',
    customer_name: 'Liam Zhang',
    customer_email: 'liam.z@example.com',
    customer_phone: '(555) 892-1144',
    delivery_address: '884 Pine Hill Road',
    delivery_city: 'Metro Area',
    delivery_notes: 'Gate code #4491',
    delivery_speed: 'priority',
    payment_method: 'apple_pay',
    payment_status: 'completed',
    status: 'out_for_delivery',
    subtotal: 31.48,
    tax: 2.18,
    delivery_fee: 5.99,
    tip: 4.50,
    discount: 5.00,
    total: 39.15,
    coupon_code: 'FIRSTBITE',
    estimated_delivery_time: '12:45 PM',
    driver_name: 'Elena Gomez',
    driver_phone: '(555) 901-2244',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString(),
    items: [
      {
        id: 3,
        order_id: 'ORD-54128',
        food_item_id: 6,
        item_name: 'Pepperoni & Mike’s Hot Honey',
        item_price: 17.49,
        quantity: 1,
        selected_size: 'Medium (10")',
        selected_extras: [{ name: 'Extra Mozzarella Di Bufala', price: 2.00 }],
        special_instructions: 'Well done crust',
        item_total: 19.49
      },
      {
        id: 4,
        order_id: 'ORD-54128',
        food_item_id: 19,
        item_name: 'Warm Belgian Chocolate Molten Lava Cake',
        item_price: 7.99,
        quantity: 1,
        selected_size: 'Single Serving',
        selected_extras: [],
        special_instructions: '',
        item_total: 7.99
      }
    ]
  }
];

// ============================================================================
// IN-MEMORY DATA STORE (For Vercel Serverless / Cloud Functions)
// ============================================================================

let memCategories = [];
let memCoupons = [];
let memFoodItems = [];
let memOrders = [];
let memOrderItemId = 10;

function initInMemory() {
  memCategories = JSON.parse(JSON.stringify(CATEGORIES_DATA));
  memCoupons = JSON.parse(JSON.stringify(COUPONS_DATA));
  memFoodItems = JSON.parse(JSON.stringify(FOOD_ITEMS_DATA));
  if (memOrders.length === 0) {
    memOrders = JSON.parse(JSON.stringify(INITIAL_SAMPLE_ORDERS));
  }
}

// ============================================================================
// SQLITE INITIALIZATION
// ============================================================================

function initSqlite() {
  if (!sqliteDb) return;

  sqliteDb.exec(`
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
      discount_type TEXT NOT NULL,
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
      status TEXT NOT NULL DEFAULT 'received',
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

  // Seed Categories if empty
  const catCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = sqliteDb.prepare('INSERT INTO categories (id, name, icon, display_order) VALUES (?, ?, ?, ?)');
    for (const cat of CATEGORIES_DATA) {
      insertCat.run(cat.id, cat.name, cat.icon, cat.display_order);
    }
  }

  // Seed Coupons if empty
  const couponCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM coupons').get().count;
  if (couponCount === 0) {
    const insertCoupon = sqliteDb.prepare('INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, description, is_active) VALUES (?, ?, ?, ?, ?, ?)');
    for (const cp of COUPONS_DATA) {
      insertCoupon.run(cp.code, cp.discount_type, cp.discount_value, cp.min_order_amount, cp.description, cp.is_active);
    }
  }

  // Seed Food Items if empty
  const itemCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM food_items').get().count;
  if (itemCount === 0) {
    const insertItem = sqliteDb.prepare(`
      INSERT INTO food_items (
        category_id, name, description, price, image_url, rating, review_count,
        prep_time_minutes, calories, is_veg, is_vegan, is_spicy, is_bestseller, is_featured,
        customization_options
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const it of FOOD_ITEMS_DATA) {
      insertItem.run(
        it.category_id,
        it.name,
        it.description,
        it.price,
        it.image_url,
        it.rating,
        it.review_count,
        it.prep_time_minutes,
        it.calories,
        it.is_veg,
        it.is_vegan,
        it.is_spicy,
        it.is_bestseller,
        it.is_featured,
        JSON.stringify(it.customization_options)
      );
    }
  }

  // Seed Sample Orders if empty so stats show healthy state
  const orderCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  if (orderCount === 0) {
    const insertOrder = sqliteDb.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, delivery_address,
        delivery_city, delivery_notes, delivery_speed, payment_method, payment_status,
        status, subtotal, tax, delivery_fee, tip, discount, total, coupon_code,
        estimated_delivery_time, driver_name, driver_phone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOrderItem = sqliteDb.prepare(`
      INSERT INTO order_items (
        order_id, food_item_id, item_name, item_price, quantity,
        selected_size, selected_extras, special_instructions, item_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const so of INITIAL_SAMPLE_ORDERS) {
      insertOrder.run(
        so.id, so.customer_name, so.customer_email, so.customer_phone, so.delivery_address,
        so.delivery_city, so.delivery_notes, so.delivery_speed, so.payment_method, so.payment_status,
        so.status, so.subtotal, so.tax, so.delivery_fee, so.tip, so.discount, so.total, so.coupon_code,
        so.estimated_delivery_time, so.driver_name, so.driver_phone, so.created_at, so.updated_at
      );
      for (const item of so.items) {
        insertOrderItem.run(
          so.id, item.food_item_id, item.item_name, item.item_price, item.quantity,
          item.selected_size, JSON.stringify(item.selected_extras || []), item.special_instructions, item.item_total
        );
      }
    }
  }
}

// ============================================================================
// MAIN INITIALIZATION FUNCTION
// ============================================================================

function initDatabase() {
  if (useInMemory || !sqliteDb) {
    initInMemory();
  } else {
    try {
      initSqlite();
    } catch (e) {
      console.warn('[Notice] SQLite init failed. Switching to in-memory mode:', e.message);
      useInMemory = true;
      sqliteDb = null;
      initInMemory();
    }
  }
}

// Auto-initialize memory structures immediately so module exports are always hot
initInMemory();

// ============================================================================
// PUBLIC API IMPLEMENTATIONS (Dual Engine)
// ============================================================================

function getCategories() {
  if (useInMemory || !sqliteDb) {
    return [...memCategories].sort((a, b) => a.display_order - b.display_order);
  }
  return sqliteDb.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
}

function getFoodItems(filter = {}) {
  if (useInMemory || !sqliteDb) {
    let result = [...memFoodItems];

    if (filter.category && filter.category !== 'all') {
      result = result.filter(item => item.category_id === filter.category);
    }

    if (filter.search) {
      const term = filter.search.toLowerCase().trim();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    }

    if (filter.isVeg) {
      result = result.filter(item => item.is_veg === 1);
    }

    if (filter.isVegan) {
      result = result.filter(item => item.is_vegan === 1);
    }

    if (filter.isSpicy) {
      result = result.filter(item => item.is_spicy > 0);
    }

    if (filter.isBestseller) {
      result = result.filter(item => item.is_bestseller === 1);
    }

    // Sorting
    if (filter.sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (filter.sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (filter.sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (filter.sortBy === 'prep_time') {
      result.sort((a, b) => a.prep_time_minutes - b.prep_time_minutes);
    } else {
      result.sort((a, b) => (b.is_featured - a.is_featured) || (b.is_bestseller - a.is_bestseller) || (a.id - b.id));
    }

    return result.map(item => ({
      ...item,
      customization_options: typeof item.customization_options === 'string'
        ? JSON.parse(item.customization_options)
        : item.customization_options
    }));
  }

  // SQLite implementation
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

  const items = sqliteDb.prepare(sql).all(...params);
  return items.map(item => ({
    ...item,
    customization_options: item.customization_options ? JSON.parse(item.customization_options) : null
  }));
}

function getFoodItemById(id) {
  const numericId = parseInt(id, 10);
  if (useInMemory || !sqliteDb) {
    const item = memFoodItems.find(it => it.id === numericId);
    if (!item) return null;
    return {
      ...item,
      customization_options: typeof item.customization_options === 'string'
        ? JSON.parse(item.customization_options)
        : item.customization_options
    };
  }

  const item = sqliteDb.prepare('SELECT * FROM food_items WHERE id = ?').get(numericId);
  if (!item) return null;
  return {
    ...item,
    customization_options: item.customization_options ? JSON.parse(item.customization_options) : null
  };
}

function validateCoupon(code, subtotal) {
  if (!code) return { valid: false, message: 'Coupon code required' };
  const cleanCode = String(code).trim().toUpperCase();

  let coupon = null;
  if (useInMemory || !sqliteDb) {
    coupon = memCoupons.find(c => c.code.toUpperCase() === cleanCode && c.is_active === 1);
  } else {
    coupon = sqliteDb.prepare('SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1').get(cleanCode);
  }

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

  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const dbItem = getFoodItemById(item.id);
    if (!dbItem) {
      throw new Error(`Item ID ${item.id} not found`);
    }

    let unitPrice = dbItem.price;
    if (item.selectedSize && item.selectedSize.price) {
      unitPrice += Number(item.selectedSize.price);
    }

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
      selectedExtras: item.selectedExtras || [],
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

  // Delivery fee logic ($3.99 standard, $5.99 priority; free over $35 or free_shipping coupon)
  let deliveryFee = deliverySpeed === 'priority' ? 5.99 : 3.99;
  if (subtotal >= 35.0 || (validatedCoupon && validatedCoupon.type === 'free_shipping')) {
    deliveryFee = 0;
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.0825 * 100) / 100;
  const tipAmount = Math.max(0, Number(tip) || 0);
  const total = Math.round((taxableAmount + tax + deliveryFee + tipAmount) * 100) / 100;

  const orderNumber = Math.floor(10000 + Math.random() * 90000);
  const orderId = `ORD-${orderNumber}`;

  const prepMinutes = deliverySpeed === 'priority' ? 20 : 35;
  const estTime = new Date(Date.now() + prepMinutes * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const drivers = [
    { name: 'Alex Rivera', phone: '(555) 234-8891' },
    { name: 'Marcus Chen', phone: '(555) 749-3320' },
    { name: 'Sarah Jenkins', phone: '(555) 812-4467' },
    { name: 'Elena Gomez', phone: '(555) 901-2244' }
  ];
  const driver = drivers[Math.floor(Math.random() * drivers.length)];

  if (useInMemory || !sqliteDb) {
    const newOrder = {
      id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      delivery_city: deliveryCity,
      delivery_notes: deliveryNotes,
      delivery_speed: deliverySpeed,
      payment_method: paymentMethod,
      payment_status: 'completed',
      status: 'received',
      subtotal,
      tax,
      delivery_fee: deliveryFee,
      tip: tipAmount,
      discount,
      total,
      coupon_code: couponCode || null,
      estimated_delivery_time: estTime,
      driver_name: driver.name,
      driver_phone: driver.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: processedItems.map(pi => ({
        id: memOrderItemId++,
        order_id: orderId,
        food_item_id: pi.foodItemId,
        item_name: pi.itemName,
        item_price: pi.itemPrice,
        quantity: pi.quantity,
        selected_size: pi.selectedSize,
        selected_extras: pi.selectedExtras,
        special_instructions: pi.specialInstructions,
        item_total: pi.itemTotal
      }))
    };

    memOrders.unshift(newOrder);
    return getOrderById(orderId);
  }

  // SQLite execution
  sqliteDb.exec('BEGIN TRANSACTION;');
  try {
    const insertOrder = sqliteDb.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, delivery_address,
        delivery_city, delivery_notes, delivery_speed, payment_method, payment_status,
        status, subtotal, tax, delivery_fee, tip, discount, total, coupon_code,
        estimated_delivery_time, driver_name, driver_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderId, customerName, customerEmail, customerPhone, deliveryAddress,
      deliveryCity, deliveryNotes, deliverySpeed, paymentMethod, 'completed',
      'received', subtotal, tax, deliveryFee, tipAmount, discount, total,
      couponCode || null, estTime, driver.name, driver.phone
    );

    const insertOrderItem = sqliteDb.prepare(`
      INSERT INTO order_items (
        order_id, food_item_id, item_name, item_price, quantity,
        selected_size, selected_extras, special_instructions, item_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of processedItems) {
      insertOrderItem.run(
        orderId, item.foodItemId, item.itemName, item.itemPrice, item.quantity,
        item.selectedSize, JSON.stringify(item.selectedExtras || []), item.specialInstructions, item.itemTotal
      );
    }

    sqliteDb.exec('COMMIT;');
  } catch (err) {
    sqliteDb.exec('ROLLBACK;');
    throw err;
  }

  return getOrderById(orderId);
}

function getOrderById(id) {
  if (useInMemory || !sqliteDb) {
    const order = memOrders.find(o => o.id === id);
    if (!order) return null;
    return JSON.parse(JSON.stringify(order));
  }

  const order = sqliteDb.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;

  const items = sqliteDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return {
    ...order,
    items: items.map(item => ({
      ...item,
      selected_extras: item.selected_extras ? JSON.parse(item.selected_extras) : []
    }))
  };
}

function getAllOrders(limit = 50) {
  if (useInMemory || !sqliteDb) {
    return JSON.parse(JSON.stringify(memOrders.slice(0, limit)));
  }

  const orders = sqliteDb.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?').all(limit);
  return orders.map(order => {
    const items = sqliteDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
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

  if (useInMemory || !sqliteDb) {
    const order = memOrders.find(o => o.id === id);
    if (!order) return null;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();
    return getOrderById(id);
  }

  const update = sqliteDb.prepare(`
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
  if (useInMemory || !sqliteDb) {
    const nonCancelled = memOrders.filter(o => o.status !== 'cancelled');
    const totalRevenue = nonCancelled.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = memOrders.length;
    const activeOrders = memOrders.filter(o => ['received', 'preparing', 'out_for_delivery'].includes(o.status)).length;
    const completedOrders = memOrders.filter(o => o.status === 'delivered').length;

    // Popular items
    const itemSalesMap = {};
    for (const order of memOrders) {
      if (!Array.isArray(order.items)) continue;
      for (const item of order.items) {
        if (!itemSalesMap[item.item_name]) {
          itemSalesMap[item.item_name] = { item_name: item.item_name, total_sold: 0, total_sales: 0 };
        }
        itemSalesMap[item.item_name].total_sold += (Number(item.quantity) || 1);
        itemSalesMap[item.item_name].total_sales += (Number(item.item_total) || 0);
      }
    }

    const popularItems = Object.values(itemSalesMap)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      activeOrders,
      completedOrders,
      popularItems
    };
  }

  const totalRevenue = sqliteDb.prepare("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != 'cancelled'").get().revenue;
  const totalOrders = sqliteDb.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const activeOrders = sqliteDb.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('received', 'preparing', 'out_for_delivery')").get().count;
  const completedOrders = sqliteDb.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'").get().count;

  const popularItems = sqliteDb.prepare(`
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

// Compatibility proxy for direct database access if ever requested
const dbProxy = sqliteDb || {
  exec: () => {},
  prepare: () => ({ run: () => ({ changes: 1 }), get: () => ({}), all: () => [] })
};

module.exports = {
  db: dbProxy,
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
