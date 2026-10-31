/**
 * TasteCrave Live Order Tracker & Order History
 */

let activeTrackingOrderId = null;
let trackerPollInterval = null;

async function openOrderTracker(orderId) {
  if (!orderId) {
    const recent = getRecentOrders();
    if (recent.length > 0) {
      orderId = recent[0];
    } else {
      showToast('No recent orders found to track.', 'info');
      return;
    }
  }

  activeTrackingOrderId = orderId;
  const overlay = document.getElementById('tracker-modal');
  if (overlay) overlay.classList.add('active');

  await refreshTrackerData();

  // Clear existing poll
  if (trackerPollInterval) clearInterval(trackerPollInterval);
  trackerPollInterval = setInterval(refreshTrackerData, 4000);
}

function closeOrderTracker() {
  const overlay = document.getElementById('tracker-modal');
  if (overlay) overlay.classList.remove('active');

  if (trackerPollInterval) {
    clearInterval(trackerPollInterval);
    trackerPollInterval = null;
  }
}

async function refreshTrackerData() {
  if (!activeTrackingOrderId) return;

  try {
    const res = await apiGet(`/api/orders/${activeTrackingOrderId}`);
    if (res.success && res.order) {
      renderTrackerUI(res.order);
    }
  } catch (err) {
    console.error('Failed to load tracking data:', err);
  }
}

function renderTrackerUI(order) {
  const container = document.getElementById('tracker-content');
  if (!container) return;

  // Status mapping
  const statuses = ['received', 'preparing', 'out_for_delivery', 'delivered'];
  const currentIndex = statuses.indexOf(order.status);

  // Status display titles
  const statusDetails = {
    received: {
      headline: 'Order Confirmed!',
      sub: 'The kitchen has accepted your order and is prepping ingredients.',
      eta: 'Approx. 25–35 mins',
      progressWidth: '15%'
    },
    preparing: {
      headline: 'Cooking in the Kitchen 👨‍🍳',
      sub: 'Our chef is preparing your meal with artisanal ingredients.',
      eta: 'Approx. 15–20 mins',
      progressWidth: '45%'
    },
    out_for_delivery: {
      headline: 'Rider is on the Way! 🛵',
      sub: `${order.driver_name || 'Your courier'} has picked up your food and is heading to your address.`,
      eta: 'Arriving in 5–10 mins',
      progressWidth: '78%'
    },
    delivered: {
      headline: 'Delivered! Bon Appétit 🎉',
      sub: 'Your meal has been delivered. Enjoy every bite!',
      eta: 'Delivered',
      progressWidth: '100%'
    },
    cancelled: {
      headline: 'Order Cancelled',
      sub: 'This order was cancelled.',
      eta: 'Cancelled',
      progressWidth: '0%'
    }
  };

  const currentDetail = statusDetails[order.status] || statusDetails.received;

  // Step 1: Placed
  const step1Class = currentIndex >= 0 ? (currentIndex === 0 ? 'active' : 'completed') : '';
  // Step 2: Kitchen
  const step2Class = currentIndex >= 1 ? (currentIndex === 1 ? 'active' : 'completed') : '';
  // Step 3: Out for Delivery
  const step3Class = currentIndex >= 2 ? (currentIndex === 2 ? 'active' : 'completed') : '';
  // Step 4: Delivered
  const step4Class = currentIndex >= 3 ? 'active completed' : '';

  let itemsReceiptHtml = '';
  for (const item of order.items || []) {
    itemsReceiptHtml += `
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
        <span>${item.quantity}× <strong>${item.item_name}</strong> ${item.selected_size ? `(${item.selected_size})` : ''}</span>
        <span style="font-weight: 600;">${formatMoney(item.item_total)}</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="tracker-status-banner">
      <div style="font-size: 0.9rem; font-weight: 600; opacity: 0.9;">Order #${order.id}</div>
      <div class="tracker-eta">${currentDetail.eta}</div>
      <div style="font-size: 1.15rem; font-weight: 700; margin-bottom: 4px;">${currentDetail.headline}</div>
      <div style="font-size: 0.85rem; opacity: 0.95;">${currentDetail.sub}</div>
    </div>

    <!-- Timeline Progress -->
    <div class="timeline">
      <div class="timeline-progress" style="width: ${currentDetail.progressWidth};"></div>

      <div class="timeline-step ${step1Class}">
        <div class="timeline-node">📋</div>
        <div class="timeline-label">Placed</div>
      </div>

      <div class="timeline-step ${step2Class}">
        <div class="timeline-node">👨‍🍳</div>
        <div class="timeline-label">Cooking</div>
      </div>

      <div class="timeline-step ${step3Class}">
        <div class="timeline-node">🛵</div>
        <div class="timeline-label">On Way</div>
      </div>

      <div class="timeline-step ${step4Class}">
        <div class="timeline-node">🏠</div>
        <div class="timeline-label">Delivered</div>
      </div>
    </div>

    <!-- Demo Simulation Helper -->
    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
      <div style="background: #fff7ed; border: 1px dashed #fdba74; padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 0.85rem; color: #9a3412;">⚡ <strong>Live Demo:</strong> Simulate next status transition</span>
        <button class="btn btn-sm btn-primary" onclick="advanceOrderStatus('${order.id}')">Advance Step →</button>
      </div>
    ` : ''}

    <!-- Driver Card -->
    <div class="driver-card">
      <div class="driver-avatar">🛵</div>
      <div class="driver-details">
        <div class="driver-name">${order.driver_name || 'Assigned Courier'}</div>
        <div class="driver-info">Delivery Courier • Rating 4.9 ★</div>
        <div class="driver-info" style="color: var(--color-primary); font-weight: 600;">${order.driver_phone || '(555) 019-2831'}</div>
      </div>
      <a href="tel:${order.driver_phone || ''}" class="btn btn-secondary btn-sm" style="border-radius: var(--radius-full);">📞 Call</a>
    </div>

    <!-- Delivery Destination -->
    <div style="background: var(--color-bg); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 20px; font-size: 0.85rem;">
      <div style="font-weight: 700; margin-bottom: 4px;">📍 Delivering to:</div>
      <div>${order.customer_name} • ${order.customer_phone}</div>
      <div style="color: var(--color-text-muted);">${order.delivery_address}, ${order.delivery_city}</div>
      ${order.delivery_notes ? `<div style="font-style: italic; color: var(--color-text-muted); margin-top: 4px;">Note: "${order.delivery_notes}"</div>` : ''}
    </div>

    <!-- Receipt Breakdown -->
    <div style="border-top: 1px solid var(--color-border); padding-top: 14px;">
      <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 10px;">Itemized Receipt</div>
      ${itemsReceiptHtml}
      <hr style="border: none; border-top: 1px dashed var(--color-border); margin: 8px 0;" />
      <div class="bill-row"><span>Subtotal</span><span>${formatMoney(order.subtotal)}</span></div>
      ${order.discount > 0 ? `<div class="bill-row discount"><span>Promo Savings (${order.coupon_code || ''})</span><span>−${formatMoney(order.discount)}</span></div>` : ''}
      <div class="bill-row"><span>Delivery Fee</span><span>${order.delivery_fee === 0 ? '<strong style="color: var(--color-success)">FREE</strong>' : formatMoney(order.delivery_fee)}</span></div>
      <div class="bill-row"><span>Tax</span><span>${formatMoney(order.tax)}</span></div>
      <div class="bill-row"><span>Driver Tip</span><span>${formatMoney(order.tip)}</span></div>
      <div class="bill-row total"><span>Total Paid</span><span>${formatMoney(order.total)}</span></div>
    </div>
  `;
}

// Fast simulation advance for demo
async function advanceOrderStatus(orderId) {
  try {
    const res = await apiPost(`/api/orders/${orderId}/advance`);
    if (res.success && res.order) {
      showToast(`Status updated to: ${res.order.status.replace('_', ' ').toUpperCase()}!`, 'success');
      renderTrackerUI(res.order);
      // Also update kitchen dashboard if active
      if (window.refreshAdminDashboard) window.refreshAdminDashboard();
    }
  } catch (err) {
    showToast('Failed to advance order status', 'error');
  }
}

// Order History Modal
async function openOrderHistoryModal() {
  const overlay = document.getElementById('history-modal');
  const content = document.getElementById('history-modal-content');
  if (!overlay || !content) return;

  overlay.classList.add('active');
  content.innerHTML = `<div style="text-align: center; padding: 40px;">⏳ Loading order history...</div>`;

  try {
    const res = await apiGet('/api/orders');
    if (res.success && res.orders) {
      if (res.orders.length === 0) {
        content.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">📋</div>
            <h4>No orders yet</h4>
            <p style="color: var(--color-text-muted); margin-bottom: 16px;">Place an order from our menu to track it here!</p>
            <button class="btn btn-primary btn-sm" onclick="closeOrderHistoryModal()">Browse Menu</button>
          </div>
        `;
        return;
      }

      let html = '<div style="display: flex; flex-direction: column; gap: 14px;">';
      for (const order of res.orders) {
        let statusBadge = '';
        if (order.status === 'delivered') statusBadge = '<span class="badge badge-veg">Delivered</span>';
        else if (order.status === 'out_for_delivery') statusBadge = '<span class="badge badge-spicy">🛵 Out for Delivery</span>';
        else if (order.status === 'preparing') statusBadge = '<span class="badge badge-bestseller">👨‍🍳 Cooking</span>';
        else statusBadge = '<span class="badge" style="background: #eff6ff; color: #2563eb;">Received</span>';

        const dateStr = new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
        const itemsSummary = (order.items || []).map(i => `${i.quantity}× ${i.item_name}`).join(', ');

        html += `
          <div style="background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>Order #${order.id}</strong>
                <div style="font-size: 0.75rem; color: var(--color-text-muted);">${dateStr}</div>
              </div>
              ${statusBadge}
            </div>
            <div style="font-size: 0.85rem; color: var(--color-text-main);">${itemsSummary}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border-subtle); padding-top: 8px; margin-top: 4px;">
              <span style="font-weight: 700; font-size: 0.95rem;">${formatMoney(order.total)}</span>
              <button class="btn btn-outline btn-sm" onclick="closeOrderHistoryModal(); openOrderTracker('${order.id}')">Track Order →</button>
            </div>
          </div>
        `;
      }
      html += '</div>';
      content.innerHTML = html;
    }
  } catch (err) {
    content.innerHTML = `<div style="color: var(--color-danger); text-align: center; padding: 20px;">Failed to load order history: ${err.message}</div>`;
  }
}

function closeOrderHistoryModal() {
  const overlay = document.getElementById('history-modal');
  if (overlay) overlay.classList.remove('active');
}
