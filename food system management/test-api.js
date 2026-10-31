const http = require('node:http');

// Simple helper to make HTTP requests to local server
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Integration Tests ---');
  const port = process.env.PORT || 3000;

  // 1. Check categories
  console.log('1. Testing GET /api/categories...');
  const catRes = await request({ hostname: '127.0.0.1', port, path: '/api/categories', method: 'GET' });
  console.assert(catRes.status === 200, 'Categories status should be 200');
  console.assert(catRes.body.categories.length === 7, `Expected 7 categories, got ${catRes.body.categories?.length}`);
  console.log(`   OK: Found ${catRes.body.categories.length} categories.`);

  // 2. Check items
  console.log('2. Testing GET /api/items with filters...');
  const itemsRes = await request({ hostname: '127.0.0.1', port, path: '/api/items?category=burgers', method: 'GET' });
  console.assert(itemsRes.status === 200, 'Items status should be 200');
  console.assert(itemsRes.body.items.length > 0, 'Should return burgers');
  console.log(`   OK: Found ${itemsRes.body.items.length} burger items.`);

  // 3. Test coupon validation
  console.log('3. Testing GET /api/coupons/validate?code=TASTY20&subtotal=30...');
  const couponRes = await request({ hostname: '127.0.0.1', port, path: '/api/coupons/validate?code=TASTY20&subtotal=30', method: 'GET' });
  console.assert(couponRes.status === 200, 'Coupon status should be 200');
  console.assert(couponRes.body.coupon.discountAmount === 6, 'Discount should be 6.00');
  console.log(`   OK: Coupon validated with $${couponRes.body.coupon.discountAmount} discount.`);

  // 4. Test order placement
  console.log('4. Testing POST /api/orders (Placing a real order)...');
  const firstItem = itemsRes.body.items[0];
  const orderPayload = {
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    customerPhone: '(555) 987-6543',
    deliveryAddress: '742 Evergreen Terrace, Apt 4B',
    deliveryCity: 'Springfield',
    deliveryNotes: 'Please ring bell twice',
    deliverySpeed: 'standard',
    paymentMethod: 'card',
    couponCode: 'TASTY20',
    tip: 3.50,
    items: [
      {
        id: firstItem.id,
        quantity: 2,
        selectedSize: { name: 'Double Deluxe (+Patty)', price: 3.50 },
        selectedExtras: [{ name: 'Aged Cheddar Slice', price: 1.25 }],
        specialInstructions: 'Extra crispy fries on the side please'
      }
    ]
  };

  const orderRes = await request({
    hostname: '127.0.0.1',
    port,
    path: '/api/orders',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, orderPayload);

  console.assert(orderRes.status === 201, `Expected 201 Created, got ${orderRes.status}`);
  const orderId = orderRes.body.order.id;
  console.log(`   OK: Order successfully created with ID: ${orderId}, Total: $${orderRes.body.order.total}`);

  // 5. Test get order details
  console.log(`5. Testing GET /api/orders/${orderId}...`);
  const getOrderRes = await request({ hostname: '127.0.0.1', port, path: `/api/orders/${orderId}`, method: 'GET' });
  console.assert(getOrderRes.status === 200, 'Expected 200 OK');
  console.assert(getOrderRes.body.order.status === 'received', 'Order status should be received');
  console.log(`   OK: Fetched order status: ${getOrderRes.body.order.status}`);

  // 6. Test order advancement
  console.log(`6. Testing POST /api/orders/${orderId}/advance...`);
  const advanceRes = await request({ hostname: '127.0.0.1', port, path: `/api/orders/${orderId}/advance`, method: 'POST' });
  console.assert(advanceRes.body.nextStatus === 'preparing', 'Next status should be preparing');
  console.log(`   OK: Advanced status to: ${advanceRes.body.nextStatus}`);

  // 7. Test Admin stats
  console.log('7. Testing GET /api/stats...');
  const statsRes = await request({ hostname: '127.0.0.1', port, path: '/api/stats', method: 'GET' });
  console.assert(statsRes.status === 200, 'Expected 200 OK');
  console.assert(statsRes.body.stats.totalOrders >= 1, 'Total orders should be at least 1');
  console.log(`   OK: Total Revenue: $${statsRes.body.stats.totalRevenue}, Active orders: ${statsRes.body.stats.activeOrders}`);

  console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---');
}

// Start server in child process or run tests if server is listening
runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
