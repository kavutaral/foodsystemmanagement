/**
 * TasteCrave Cart State & Drawer Controller
 */

class CartManager {
  constructor() {
    this.storageKey = 'tastecrave_cart_v1';
    this.items = this.loadCart();
    this.coupon = null;
    this.tipAmount = 2.0;
    this.deliverySpeed = 'standard'; // 'standard' or 'priority'
  }

  loadCart() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
    this.updateCartBadges();
    if (window.renderMenuCards) {
      window.renderMenuCards();
    }
  }

  generateItemKey(item) {
    const sizeName = item.selectedSize ? item.selectedSize.name : 'reg';
    const extrasNames = (item.selectedExtras || []).map(e => e.name).sort().join('|');
    const note = (item.specialInstructions || '').trim().toLowerCase();
    return `${item.id}_${sizeName}_${extrasNames}_${note}`;
  }

  addItem(foodItem, options = {}, quantity = 1) {
    const selectedSize = options.selectedSize || (foodItem.customization_options?.sizes ? foodItem.customization_options.sizes[0] : null);
    const selectedExtras = options.selectedExtras || [];
    const specialInstructions = options.specialInstructions || '';

    // Calculate unit price
    let unitPrice = Number(foodItem.price);
    if (selectedSize && selectedSize.price) {
      unitPrice += Number(selectedSize.price);
    }
    if (Array.isArray(selectedExtras)) {
      for (const extra of selectedExtras) {
        if (extra && extra.price) {
          unitPrice += Number(extra.price);
        }
      }
    }
    unitPrice = Math.round(unitPrice * 100) / 100;

    const candidate = {
      id: foodItem.id,
      name: foodItem.name,
      basePrice: foodItem.price,
      unitPrice: unitPrice,
      image_url: foodItem.image_url,
      category_id: foodItem.category_id,
      selectedSize,
      selectedExtras,
      specialInstructions,
      quantity: Math.max(1, quantity)
    };

    const key = this.generateItemKey(candidate);
    const existingIndex = this.items.findIndex(i => this.generateItemKey(i) === key);

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += candidate.quantity;
    } else {
      this.items.push(candidate);
    }

    this.saveCart();
    this.renderCartDrawer();
    showToast(`Added ${candidate.name} to cart!`, 'success');
  }

  updateQuantity(itemKey, delta) {
    const index = this.items.findIndex(i => this.generateItemKey(i) === itemKey);
    if (index === -1) return;

    const newQty = this.items[index].quantity + delta;
    if (newQty <= 0) {
      this.items.splice(index, 1);
      showToast('Item removed from cart', 'info');
    } else {
      this.items[index].quantity = newQty;
    }

    this.saveCart();
    this.renderCartDrawer();
  }

  removeItem(itemKey) {
    const index = this.items.findIndex(i => this.generateItemKey(i) === itemKey);
    if (index > -1) {
      this.items.splice(index, 1);
      this.saveCart();
      this.renderCartDrawer();
      showToast('Item removed', 'info');
    }
  }

  clear() {
    this.items = [];
    this.coupon = null;
    this.saveCart();
    this.renderCartDrawer();
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getItemQuantityInCart(foodItemId) {
    return this.items
      .filter(item => item.id === foodItemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotals() {
    let subtotal = 0;
    for (const item of this.items) {
      subtotal += item.unitPrice * item.quantity;
    }
    subtotal = Math.round(subtotal * 100) / 100;

    // Delivery fee ($3.99 standard, $5.99 priority; free over $35 or free shipping promo)
    let deliveryFee = this.deliverySpeed === 'priority' ? 5.99 : 3.99;
    if (subtotal >= 35.0 || (this.coupon && this.coupon.type === 'free_shipping')) {
      deliveryFee = 0;
    }

    let discount = 0;
    if (this.coupon) {
      if (this.coupon.type === 'percentage') {
        discount = Math.round((subtotal * this.coupon.discountValue) / 100 * 100) / 100;
      } else if (this.coupon.type === 'fixed') {
        discount = Math.min(this.coupon.discountValue, subtotal);
      } else if (this.coupon.type === 'free_shipping') {
        discount = 3.99;
      }
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.0825 * 100) / 100;
    const total = Math.round((taxableAmount + deliveryFee + tax + this.tipAmount) * 100) / 100;

    return {
      subtotal,
      deliveryFee,
      discount,
      tax,
      tip: this.tipAmount,
      total: Math.max(0, total)
    };
  }

  async applyCouponCode(code) {
    if (!code || !code.trim()) {
      showToast('Please enter a coupon code', 'error');
      return false;
    }

    const totals = this.getTotals();
    try {
      const res = await apiGet('/api/coupons/validate', {
        code: code.trim(),
        subtotal: totals.subtotal
      });

      if (res.success && res.coupon) {
        this.coupon = {
          code: res.coupon.code,
          type: res.coupon.type,
          discountValue: res.coupon.discountAmount,
          description: res.coupon.description
        };
        showToast(`Promo ${res.coupon.code} applied! Saved ${formatMoney(res.coupon.discountAmount)}`, 'success');
        this.renderCartDrawer();
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Invalid coupon code', 'error');
      return false;
    }
  }

  removeCoupon() {
    this.coupon = null;
    showToast('Coupon removed', 'info');
    this.renderCartDrawer();
  }

  setTip(amount) {
    this.tipAmount = Math.max(0, Number(amount) || 0);
    this.renderCartDrawer();
  }

  updateCartBadges() {
    const count = this.getItemCount();
    const totals = this.getTotals();

    const badgeEls = document.querySelectorAll('.cart-badge');
    badgeEls.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });

    const totalEls = document.querySelectorAll('.cart-header-total');
    totalEls.forEach(el => {
      el.textContent = count > 0 ? `• ${formatMoney(totals.total)}` : '';
    });
  }

  renderCartDrawer() {
    this.updateCartBadges();

    const bodyEl = document.getElementById('cart-drawer-items');
    const footerEl = document.getElementById('cart-drawer-footer');
    if (!bodyEl || !footerEl) return;

    if (this.items.length === 0) {
      bodyEl.innerHTML = `
        <div class="empty-cart-view">
          <div class="empty-cart-icon">🛒</div>
          <h3 class="empty-cart-title">Your cart is empty</h3>
          <p class="empty-cart-desc">Add delicious dishes from our menu to get started!</p>
          <button class="btn btn-primary" onclick="cartManager.closeDrawer()">Explore Menu</button>
        </div>
      `;
      footerEl.style.display = 'none';
      return;
    }

    footerEl.style.display = 'block';

    const totals = this.getTotals();
    const freeDeliveryThreshold = 35.0;
    const progressPercent = Math.min(100, Math.round((totals.subtotal / freeDeliveryThreshold) * 100));
    const neededForFree = Math.max(0, freeDeliveryThreshold - totals.subtotal);

    let progressHtml = '';
    if (totals.subtotal >= freeDeliveryThreshold || (this.coupon && this.coupon.type === 'free_shipping')) {
      progressHtml = `
        <div class="free-shipping-progress">
          🎉 <strong>Congratulations!</strong> You unlocked FREE Delivery!
          <div class="progress-bar"><div class="progress-fill" style="width: 100%"></div></div>
        </div>
      `;
    } else {
      progressHtml = `
        <div class="free-shipping-progress">
          🚚 Add <strong>${formatMoney(neededForFree)}</strong> more for <strong>FREE Delivery!</strong>
          <div class="progress-bar"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
        </div>
      `;
    }

    let itemsHtml = progressHtml + `<div class="cart-items-wrapper">`;
    for (const item of this.items) {
      const itemKey = this.generateItemKey(item);
      let optionsSummary = [];
      if (item.selectedSize && item.selectedSize.name) {
        optionsSummary.push(item.selectedSize.name);
      }
      if (Array.isArray(item.selectedExtras) && item.selectedExtras.length > 0) {
        optionsSummary.push(item.selectedExtras.map(e => e.name).join(', '));
      }
      if (item.specialInstructions) {
        optionsSummary.push(`"${item.specialInstructions}"`);
      }

      itemsHtml += `
        <div class="cart-item">
          <img class="cart-item-img" src="${item.image_url}" alt="${item.name}" onerror="this.onerror=null; this.src=getFoodSvgFallback('${item.category_id}', '${item.name.replace(/'/g, "\\'")}')">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            ${optionsSummary.length > 0 ? `<div class="cart-item-options">${optionsSummary.join(' • ')}</div>` : ''}
            <div class="cart-item-row">
              <span class="cart-item-price">${formatMoney(item.unitPrice * item.quantity)}</span>
              <div class="qty-stepper">
                <button class="qty-btn" onclick="cartManager.updateQuantity('${itemKey}', -1)">−</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="cartManager.updateQuantity('${itemKey}', 1)">+</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    itemsHtml += `</div>`;
    bodyEl.innerHTML = itemsHtml;

    // Render footer bill breakdown
    let couponBoxHtml = '';
    if (this.coupon) {
      couponBoxHtml = `
        <div class="applied-coupon">
          <span>🏷️ <strong>${this.coupon.code}</strong> (${this.coupon.description})</span>
          <button class="btn btn-sm btn-outline" style="padding: 2px 8px;" onclick="cartManager.removeCoupon()">Remove</button>
        </div>
      `;
    } else {
      couponBoxHtml = `
        <div class="coupon-box">
          <input type="text" id="coupon-input" class="coupon-input" placeholder="Promo Code (e.g. TASTY20)" />
          <button class="btn btn-secondary btn-sm" onclick="cartManager.handleApplyCoupon()">Apply</button>
        </div>
        <div style="display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;">
          <span class="badge" style="cursor: pointer; background: #fff7ed; color: #ea580c; border: 1px dashed #fdba74;" onclick="cartManager.quickApply('TASTY20')">TASTY20 (20% off)</span>
          <span class="badge" style="cursor: pointer; background: #ecfdf5; color: #059669; border: 1px dashed #86efac;" onclick="cartManager.quickApply('FIRSTBITE')">FIRSTBITE ($5 off)</span>
          <span class="badge" style="cursor: pointer; background: #eff6ff; color: #2563eb; border: 1px dashed #bfdbfe;" onclick="cartManager.quickApply('FREESHIP')">FREESHIP</span>
        </div>
      `;
    }

    footerEl.innerHTML = `
      ${couponBoxHtml}
      
      <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 6px;">Add Driver Tip</div>
      <div class="tip-selector">
        <button class="tip-pill ${this.tipAmount === 0 ? 'active' : ''}" onclick="cartManager.setTip(0)">$0</button>
        <button class="tip-pill ${this.tipAmount === 2 ? 'active' : ''}" onclick="cartManager.setTip(2)">$2</button>
        <button class="tip-pill ${this.tipAmount === 3 ? 'active' : ''}" onclick="cartManager.setTip(3)">$3</button>
        <button class="tip-pill ${this.tipAmount === 5 ? 'active' : ''}" onclick="cartManager.setTip(5)">$5</button>
      </div>

      <div class="bill-row">
        <span>Subtotal</span>
        <span>${formatMoney(totals.subtotal)}</span>
      </div>
      ${totals.discount > 0 ? `
        <div class="bill-row discount">
          <span>Promo Discount (${this.coupon?.code})</span>
          <span>−${formatMoney(totals.discount)}</span>
        </div>
      ` : ''}
      <div class="bill-row">
        <span>Delivery Fee</span>
        <span>${totals.deliveryFee === 0 ? '<span style="color: var(--color-success); font-weight: 700;">FREE</span>' : formatMoney(totals.deliveryFee)}</span>
      </div>
      <div class="bill-row">
        <span>Estimated Tax (8.25%)</span>
        <span>${formatMoney(totals.tax)}</span>
      </div>
      <div class="bill-row">
        <span>Driver Tip</span>
        <span>${formatMoney(totals.tip)}</span>
      </div>
      <div class="bill-row total">
        <span>Total Amount</span>
        <span>${formatMoney(totals.total)}</span>
      </div>

      <button class="btn btn-primary btn-block btn-lg" onclick="openCheckoutModal()">
        Proceed to Checkout (${formatMoney(totals.total)}) →
      </button>
    `;
  }

  handleApplyCoupon() {
    const input = document.getElementById('coupon-input');
    if (input) {
      this.applyCouponCode(input.value);
    }
  }

  quickApply(code) {
    this.applyCouponCode(code);
  }

  openDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
      overlay.classList.add('active');
      this.renderCartDrawer();
    }
  }

  closeDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
}

const cartManager = new CartManager();
window.cartManager = cartManager;
