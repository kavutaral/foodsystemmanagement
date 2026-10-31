/**
 * TasteCrave Main Application Orchestrator
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Menu and categories
  initMenu();

  // 2. Initialize Cart UI badges and listeners
  cartManager.updateCartBadges();

  // 3. Restore or set default delivery address
  initDeliveryAddress();

  // 4. Setup keyboard and modal backdrop click dismiss
  setupGlobalModalDismiss();

  // 5. Check URL parameters for automated modal preview (e.g. ?open=cart)
  handleUrlPreviewParams();
});

function handleUrlPreviewParams() {
  const params = new URLSearchParams(window.location.search);
  const openParam = params.get('open');
  const filterParam = params.get('filter');
  const promoParam = params.get('promo');
  const scrollParam = params.get('scroll');

  setTimeout(async () => {
    if (filterParam === 'veg') {
      const chip = document.querySelector('.filter-chip[data-filter="isVeg"]');
      if (chip) chip.click();
    }
    if (scrollParam === 'menu') {
      window.scrollTo(0, 440);
    }
    if (openParam === 'admin') {
      toggleAdminView();
    } else if (openParam === 'customizer') {
      openCustomizerModal(1);
    } else if (openParam === 'cart') {
      if (cartManager.items.length === 0 && currentItems.length > 0) {
        cartManager.addItem(currentItems[0], {}, 2);
        cartManager.addItem(currentItems[4], {}, 1);
      }
      if (promoParam) {
        await cartManager.applyCouponCode(promoParam);
      }
      cartManager.openDrawer();
    } else if (openParam === 'checkout') {
      if (cartManager.items.length === 0 && currentItems.length > 0) {
        cartManager.addItem(currentItems[0], {}, 2);
        cartManager.addItem(currentItems[4], {}, 1);
      }
      if (promoParam) {
        await cartManager.applyCouponCode(promoParam);
      }
      openCheckoutModal();
    } else if (openParam === 'tracker') {
      const id = params.get('id') || 'ORD-83116';
      openOrderTracker(id);
    } else if (openParam === 'history') {
      openOrderHistoryModal();
    }
  }, 700);
}

function initDeliveryAddress() {
  const savedAddress = localStorage.getItem('tastecrave_user_address') || '742 Evergreen Terrace, Downtown';
  const labelEl = document.getElementById('current-address-label');
  if (labelEl) {
    labelEl.textContent = savedAddress;
  }
}

function promptChangeAddress() {
  const current = localStorage.getItem('tastecrave_user_address') || '742 Evergreen Terrace, Downtown';
  const newAddress = prompt('Enter your delivery street address:', current);
  if (newAddress && newAddress.trim()) {
    localStorage.setItem('tastecrave_user_address', newAddress.trim());
    initDeliveryAddress();
    showToast('Delivery address updated!', 'success');

    // Also populate in checkout form if open
    const checkoutAddr = document.getElementById('checkout-address');
    if (checkoutAddr) {
      checkoutAddr.value = newAddress.trim();
    }
  }
}

function setupGlobalModalDismiss() {
  // ESC key closes any active modal or drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cartManager.closeDrawer();
      closeCustomizerModal();
      closeCheckoutModal();
      closeOrderTracker();
      closeOrderHistoryModal();
    }
  });

  // Clicking modal backdrop
  const modalOverlays = [
    { id: 'customizer-modal', closeFn: closeCustomizerModal },
    { id: 'checkout-modal', closeFn: closeCheckoutModal },
    { id: 'tracker-modal', closeFn: closeOrderTracker },
    { id: 'history-modal', closeFn: closeOrderHistoryModal },
    { id: 'cart-drawer-overlay', closeFn: () => cartManager.closeDrawer() }
  ];

  modalOverlays.forEach(({ id, closeFn }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          closeFn();
        }
      });
    }
  });
}
