const db = require('./database.js');

function runUnitTests() {
  console.log('--- Running Comprehensive Food System Logic Tests ---');
  db.initDatabase();

  // Test 1: Categories
  const categories = db.getCategories();
  console.log(`✓ Categories loaded: ${categories.length} (Expected: 7)`);
  if (categories.length !== 7) throw new Error('Category count mismatch');

  // Test 2: Food Items
  const items = db.getFoodItems();
  console.log(`✓ Food items loaded: ${items.length} (Expected: 24)`);
  if (items.length !== 24) throw new Error('Food item count mismatch');

  // Test 3: Filter by category
  const pizzas = db.getFoodItems({ category: 'pizzas' });
  console.log(`✓ Pizzas category items: ${pizzas.length}`);
  if (pizzas.length < 4) throw new Error('Pizza count too low');

  // Test 4: Search filter
  const searchResults = db.getFoodItems({ search: 'truffle' });
  console.log(`✓ Search "truffle" returned: ${searchResults.length} items`);
  if (searchResults.length === 0) throw new Error('Search failed to find truffle');

  // Test 5: Veg filter
  const vegItems = db.getFoodItems({ isVeg: true });
  console.log(`✓ Pure Veg items: ${vegItems.length}`);
  if (vegItems.length === 0) throw new Error('No veg items found');

  // Test 6: Coupon validation
  const coupon20 = db.validateCoupon('TASTY20', 30.0);
  console.log(`✓ Coupon TASTY20 valid: ${coupon20.valid}, discount: $${coupon20.discountAmount}`);
  if (!coupon20.valid || coupon20.discountAmount !== 6) throw new Error('TASTY20 coupon calculation incorrect');

  const couponInvalid = db.validateCoupon('NONEXISTENT', 30.0);
  console.log(`✓ Invalid coupon rejected: ${!couponInvalid.valid}`);
  if (couponInvalid.valid) throw new Error('Invalid coupon was accepted');

  const couponUnderMin = db.validateCoupon('TASTY20', 10.0);
  console.log(`✓ Under-minimum coupon rejected: ${!couponUnderMin.valid}`);
  if (couponUnderMin.valid) throw new Error('Coupon under minimum was accepted');

  // Test 7: Create Order
  const sampleOrder = db.createOrder({
    customerName: 'Marcus Vance',
    customerEmail: 'marcus@example.com',
    customerPhone: '(555) 777-1234',
    deliveryAddress: '456 Ocean Boulevard, Suite 10',
    deliveryCity: 'Downtown',
    deliveryNotes: 'Leave on porch table please',
    deliverySpeed: 'standard',
    paymentMethod: 'card',
    couponCode: 'TASTY20',
    tip: 4.00,
    items: [
      {
        id: items[0].id,
        quantity: 2,
        selectedSize: { name: 'Regular', price: 0 },
        selectedExtras: [{ name: 'Aged Cheddar Slice', price: 1.25 }]
      },
      {
        id: items[4].id,
        quantity: 1,
        selectedSize: { name: 'Medium (10")', price: 0 }
      }
    ]
  });

  console.log(`✓ Order created successfully: ID=${sampleOrder.id}`);
  console.log(`  Subtotal: $${sampleOrder.subtotal}`);
  console.log(`  Discount: -$${sampleOrder.discount}`);
  console.log(`  Delivery Fee: $${sampleOrder.delivery_fee}`);
  console.log(`  Tax: $${sampleOrder.tax}`);
  console.log(`  Tip: $${sampleOrder.tip}`);
  console.log(`  Total: $${sampleOrder.total}`);
  console.log(`  Driver assigned: ${sampleOrder.driver_name} (${sampleOrder.driver_phone})`);

  if (!sampleOrder.id || sampleOrder.total <= 0) throw new Error('Invalid order total');
  if (sampleOrder.items.length !== 2) throw new Error('Order items count mismatch');

  // Test 8: Order status update
  const updatedStatus = db.updateOrderStatus(sampleOrder.id, 'preparing');
  console.log(`✓ Order status updated to: ${updatedStatus.status}`);
  if (updatedStatus.status !== 'preparing') throw new Error('Status update failed');

  // Test 9: Stats
  const stats = db.getStats();
  console.log(`✓ Stats verified: Total Orders=${stats.totalOrders}, Revenue=$${stats.totalRevenue}, Popular Items=${stats.popularItems.length}`);
  if (stats.totalOrders < 1) throw new Error('Stats order count is zero');

  console.log('--- ALL UNIT TESTS PASSED WITH 100% SUCCESS! ---');
}

runUnitTests();
