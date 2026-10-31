/**
 * TasteCrave Checkout Modal & Order Submission Controller
 */

let selectedPaymentMethod = 'card';

function openCheckoutModal() {
  if (cartManager.items.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  // Close drawer if open
  cartManager.closeDrawer();

  const overlay = document.getElementById('checkout-modal');
  if (!overlay) return;

  renderCheckoutSummary();
  overlay.classList.add('active');
}

function closeCheckoutModal() {
  const overlay = document.getElementById('checkout-modal');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.payment-opt-card').forEach(card => {
    card.classList.toggle('selected', card.getAttribute('data-payment') === method);
  });

  const cardDetails = document.getElementById('card-payment-details');
  const upiDetails = document.getElementById('upi-payment-details');
  const codDetails = document.getElementById('cod-payment-details');

  if (cardDetails) cardDetails.style.display = method === 'card' ? 'block' : 'none';
  if (upiDetails) upiDetails.style.display = method === 'upi' ? 'block' : 'none';
  if (codDetails) codDetails.style.display = method === 'cod' ? 'block' : 'none';
}

function handleDeliverySpeedChange(speed) {
  cartManager.deliverySpeed = speed;
  renderCheckoutSummary();
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkout-summary-container');
  if (!container) return;

  const totals = cartManager.getTotals();

  let itemsSummaryHtml = '';
  for (const item of cartManager.items) {
    itemsSummaryHtml += `
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
        <span>${item.quantity}× ${item.name} ${item.selectedSize ? `(${item.selectedSize.name})` : ''}</span>
        <span style="font-weight: 600;">${formatMoney(item.unitPrice * item.quantity)}</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="background: var(--color-bg); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 16px;">
      <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: var(--color-text-main);">Order Items Summary</div>
      ${itemsSummaryHtml}
      <hr style="border: none; border-top: 1px dashed var(--color-border); margin: 8px 0;" />
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
        <span>Subtotal</span>
        <span>${formatMoney(totals.subtotal)}</span>
      </div>
      ${totals.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--color-success); margin-bottom: 4px;">
          <span>Coupon Discount (${cartManager.coupon?.code})</span>
          <span>−${formatMoney(totals.discount)}</span>
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
        <span>Delivery Fee</span>
        <span>${totals.deliveryFee === 0 ? '<strong style="color: var(--color-success);">FREE</strong>' : formatMoney(totals.deliveryFee)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
        <span>Estimated Tax</span>
        <span>${formatMoney(totals.tax)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
        <span>Driver Tip</span>
        <span>${formatMoney(totals.tip)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 800; border-top: 1px solid var(--color-border); padding-top: 6px;">
        <span>Total Payable</span>
        <span style="color: var(--color-primary);">${formatMoney(totals.total)}</span>
      </div>
    </div>
  `;

  const btn = document.getElementById('place-order-btn');
  if (btn) {
    btn.innerHTML = `Place Order • ${formatMoney(totals.total)}`;
  }
}

async function submitOrder() {
  const nameEl = document.getElementById('checkout-name');
  const phoneEl = document.getElementById('checkout-phone');
  const emailEl = document.getElementById('checkout-email');
  const addressEl = document.getElementById('checkout-address');
  const cityEl = document.getElementById('checkout-city');
  const notesEl = document.getElementById('checkout-notes');
  const speedRadio = document.querySelector('input[name="delivery_speed"]:checked');

  const customerName = nameEl ? nameEl.value.trim() : '';
  const customerPhone = phoneEl ? phoneEl.value.trim() : '';
  const customerEmail = emailEl ? emailEl.value.trim() : 'guest@example.com';
  const deliveryAddress = addressEl ? addressEl.value.trim() : '';
  const deliveryCity = cityEl ? cityEl.value.trim() : 'Downtown';
  const deliveryNotes = notesEl ? notesEl.value.trim() : '';
  const deliverySpeed = speedRadio ? speedRadio.value : cartManager.deliverySpeed;

  // Validation
  if (!customerName) {
    showToast('Please enter your full name', 'error');
    nameEl?.focus();
    return;
  }
  if (!customerPhone) {
    showToast('Please enter your phone number', 'error');
    phoneEl?.focus();
    return;
  }
  if (!deliveryAddress) {
    showToast('Please enter your delivery street address', 'error');
    addressEl?.focus();
    return;
  }

  const btn = document.getElementById('place-order-btn');
  const origBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `⏳ Placing Order...`;
  }

  try {
    const orderPayload = {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryCity,
      deliveryNotes,
      deliverySpeed,
      paymentMethod: selectedPaymentMethod,
      couponCode: cartManager.coupon ? cartManager.coupon.code : null,
      tip: cartManager.tipAmount,
      items: cartManager.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedExtras: item.selectedExtras,
        specialInstructions: item.specialInstructions
      }))
    };

    const res = await apiPost('/api/orders', orderPayload);

    if (res.success && res.order) {
      showToast('Order confirmed! Sending to kitchen...', 'success');
      
      // Save order to local order history
      saveToRecentOrders(res.order.id);

      // Clear cart
      cartManager.clear();

      // Close checkout modal
      closeCheckoutModal();

      // Trigger Confetti!
      triggerConfetti();

      // Open Live Order Tracker
      openOrderTracker(res.order.id);
    }
  } catch (err) {
    console.error('Order error:', err);
    showToast(err.message || 'Failed to place order. Please try again.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnText;
    }
  }
}

// Local storage list of recent order IDs for tracking
function saveToRecentOrders(orderId) {
  try {
    let recent = JSON.parse(localStorage.getItem('tastecrave_recent_orders') || '[]');
    if (!recent.includes(orderId)) {
      recent.unshift(orderId);
      recent = recent.slice(0, 20);
      localStorage.setItem('tastecrave_recent_orders', JSON.stringify(recent));
    }
  } catch (e) {}
}

function getRecentOrders() {
  try {
    return JSON.parse(localStorage.getItem('tastecrave_recent_orders') || '[]');
  } catch (e) {
    return [];
  }
}

// Lightweight Celebration Confetti
function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#ff521a', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 18,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let animationFrame;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravity
      p.rotation += p.vRot;
      p.opacity -= 0.012;

      if (p.opacity > 0) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    if (alive > 0) {
      animationFrame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrame);
      canvas.remove();
    }
  }

  render();
}
