/**
 * TasteCrave Kitchen & Store Management Dashboard
 */

let adminPollInterval = null;

function toggleAdminView() {
  const customerView = document.getElementById('customer-view');
  const adminView = document.getElementById('admin-view');
  const navToggleBtn = document.getElementById('admin-toggle-btn');

  if (!adminView || !customerView) return;

  const isShowingAdmin = adminView.style.display === 'block';

  if (isShowingAdmin) {
    adminView.style.display = 'none';
    customerView.style.display = 'block';
    if (navToggleBtn) {
      navToggleBtn.innerHTML = '👨‍🍳 Kitchen Mode';
      navToggleBtn.classList.remove('btn-primary');
      navToggleBtn.classList.add('btn-secondary');
    }
    if (adminPollInterval) {
      clearInterval(adminPollInterval);
      adminPollInterval = null;
    }
  } else {
    customerView.style.display = 'none';
    adminView.style.display = 'block';
    if (navToggleBtn) {
      navToggleBtn.innerHTML = '🍔 Customer View';
      navToggleBtn.classList.remove('btn-secondary');
      navToggleBtn.classList.add('btn-primary');
    }
    refreshAdminDashboard();
    adminPollInterval = setInterval(refreshAdminDashboard, 5000);
  }
}

async function refreshAdminDashboard() {
  await Promise.all([loadAdminStats(), loadKitchenOrders()]);
}
window.refreshAdminDashboard = refreshAdminDashboard;

async function loadAdminStats() {
  try {
    const res = await apiGet('/api/stats');
    if (res.success && res.stats) {
      const { totalRevenue, totalOrders, activeOrders, popularItems } = res.stats;

      const revEl = document.getElementById('stat-revenue');
      const ordersEl = document.getElementById('stat-orders');
      const activeEl = document.getElementById('stat-active');
      const popularEl = document.getElementById('stat-popular');

      if (revEl) revEl.textContent = formatMoney(totalRevenue);
      if (ordersEl) ordersEl.textContent = totalOrders;
      if (activeEl) activeEl.textContent = activeOrders;

      if (popularEl && popularItems.length > 0) {
        popularEl.innerHTML = popularItems
          .slice(0, 3)
          .map(item => `<div>• ${item.item_name} (<strong>${item.total_sold} sold</strong>)</div>`)
          .join('');
      }
    }
  } catch (err) {
    console.error('Failed to load admin stats:', err);
  }
}

async function loadKitchenOrders() {
  try {
    const res = await apiGet('/api/orders');
    if (res.success && res.orders) {
      const orders = res.orders;

      const colReceived = document.getElementById('col-received-items');
      const colPreparing = document.getElementById('col-preparing-items');
      const colDelivery = document.getElementById('col-delivery-items');
      const colDelivered = document.getElementById('col-delivered-items');

      const countReceived = document.getElementById('count-received');
      const countPreparing = document.getElementById('count-preparing');
      const countDelivery = document.getElementById('count-delivery');
      const countDelivered = document.getElementById('count-delivered');

      const groups = {
        received: [],
        preparing: [],
        out_for_delivery: [],
        delivered: []
      };

      orders.forEach(order => {
        if (groups[order.status]) {
          groups[order.status].push(order);
        }
      });

      if (countReceived) countReceived.textContent = groups.received.length;
      if (countPreparing) countPreparing.textContent = groups.preparing.length;
      if (countDelivery) countDelivery.textContent = groups.out_for_delivery.length;
      if (countDelivered) countDelivered.textContent = groups.delivered.length;

      if (colReceived) colReceived.innerHTML = renderOrderCardsForStatus(groups.received, 'received');
      if (colPreparing) colPreparing.innerHTML = renderOrderCardsForStatus(groups.preparing, 'preparing');
      if (colDelivery) colDelivery.innerHTML = renderOrderCardsForStatus(groups.out_for_delivery, 'out_for_delivery');
      if (colDelivered) colDelivered.innerHTML = renderOrderCardsForStatus(groups.delivered, 'delivered');
    }
  } catch (err) {
    console.error('Failed to load kitchen orders:', err);
  }
}

function renderOrderCardsForStatus(ordersList, status) {
  if (ordersList.length === 0) {
    return `<div style="text-align: center; color: var(--color-text-subtle); font-size: 0.85rem; padding: 24px 8px;">No orders in this stage</div>`;
  }

  let html = '';
  for (const order of ordersList) {
    const timeAgo = getTimeAgo(order.created_at);
    let itemsListHtml = '';
    for (const item of order.items || []) {
      itemsListHtml += `<div>• <strong>${item.quantity}×</strong> ${item.item_name} ${item.selected_size ? `[${item.selected_size}]` : ''}</div>`;
      if (item.special_instructions) {
        itemsListHtml += `<div style="font-size: 0.75rem; color: #ea580c; margin-left: 10px;">⚠️ "${item.special_instructions}"</div>`;
      }
    }

    let nextActionBtn = '';
    if (status === 'received') {
      nextActionBtn = `<button class="btn btn-sm btn-primary" onclick="setOrderStatus('${order.id}', 'preparing')">Start Cooking 👨‍🍳</button>`;
    } else if (status === 'preparing') {
      nextActionBtn = `<button class="btn btn-sm btn-primary" onclick="setOrderStatus('${order.id}', 'out_for_delivery')">Hand to Driver 🛵</button>`;
    } else if (status === 'out_for_delivery') {
      nextActionBtn = `<button class="btn btn-sm" style="background: var(--color-success); color: #fff;" onclick="setOrderStatus('${order.id}', 'delivered')">Mark Delivered ✅</button>`;
    } else {
      nextActionBtn = `<span class="badge badge-veg">Completed</span>`;
    }

    html += `
      <div class="kitchen-card">
        <div class="kitchen-card-header">
          <strong>#${order.id}</strong>
          <span style="color: var(--color-text-muted);">${timeAgo}</span>
        </div>
        <div style="font-size: 0.8rem; margin-bottom: 6px;">
          <div><strong>${order.customer_name}</strong> (${order.customer_phone})</div>
          <div style="color: var(--color-text-muted);">${order.delivery_address}</div>
        </div>
        <div class="kitchen-card-items">
          ${itemsListHtml}
        </div>
        <div class="kitchen-card-footer">
          <span style="font-weight: 700; font-size: 0.9rem;">${formatMoney(order.total)}</span>
          ${nextActionBtn}
        </div>
      </div>
    `;
  }

  return html;
}

async function setOrderStatus(orderId, newStatus) {
  try {
    const res = await apiPatch(`/api/orders/${orderId}/status`, { status: newStatus });
    if (res.success) {
      showToast(`Order #${orderId} set to ${newStatus.replace('_', ' ')}`, 'success');
      refreshAdminDashboard();
    }
  } catch (err) {
    showToast('Failed to update status: ' + err.message, 'error');
  }
}

function getTimeAgo(dateStr) {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}
