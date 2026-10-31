/**
 * TasteCrave Menu Controller & Customizer Modal
 */

let allCategories = [];
let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'featured';
let activeFilters = {
  isVeg: false,
  isVegan: false,
  isSpicy: false,
  isBestseller: false
};
let currentItems = [];
let activeCustomizingItem = null;

// Initialize Menu
async function initMenu() {
  await loadCategories();
  await loadMenuItems();
  setupFilterListeners();
}

async function loadCategories() {
  try {
    const res = await apiGet('/api/categories');
    if (res.success && res.categories) {
      allCategories = res.categories;
      renderCategories();
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
    // Fallback categories if offline
    allCategories = [
      { id: 'burgers', name: 'Gourmet Burgers', icon: '🍔' },
      { id: 'pizzas', name: 'Woodfired Pizzas', icon: '🍕' },
      { id: 'asian', name: 'Bowls & Asian', icon: '🍜' },
      { id: 'mexican', name: 'Tacos & Mexican', icon: '🌮' },
      { id: 'healthy', name: 'Salads & Healthy', icon: '🥗' },
      { id: 'desserts', name: 'Sweet Treats', icon: '🍰' },
      { id: 'beverages', name: 'Craft Drinks', icon: '🥤' }
    ];
    renderCategories();
  }
}

function renderCategories() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  let html = `
    <button class="category-tab ${currentCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all')">
      <span class="icon">🌟</span>
      <span>All Dishes</span>
    </button>
  `;

  for (const cat of allCategories) {
    html += `
      <button class="category-tab ${currentCategory === cat.id ? 'active' : ''}" onclick="selectCategory('${cat.id}')">
        <span class="icon">${cat.icon}</span>
        <span>${cat.name}</span>
      </button>
    `;
  }

  container.innerHTML = html;
}

function selectCategory(catId) {
  currentCategory = catId;
  renderCategories();
  loadMenuItems();
}

async function loadMenuItems() {
  const grid = document.getElementById('food-grid');
  const countEl = document.getElementById('menu-count');
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--color-text-muted);">
        <div style="font-size: 2rem; margin-bottom: 12px; animation: spin 1s infinite linear;">⏳</div>
        <div>Loading delicious food items...</div>
      </div>
    `;
  }

  try {
    const params = {
      category: currentCategory,
      search: currentSearch,
      sortBy: currentSort
    };
    if (activeFilters.isVeg) params.isVeg = '1';
    if (activeFilters.isVegan) params.isVegan = '1';
    if (activeFilters.isSpicy) params.isSpicy = '1';
    if (activeFilters.isBestseller) params.isBestseller = '1';

    const res = await apiGet('/api/items', params);
    if (res.success && res.items) {
      currentItems = res.items;
      renderMenuCards();
      if (countEl) {
        countEl.textContent = `Showing ${res.items.length} ${res.items.length === 1 ? 'item' : 'items'}`;
      }
    }
  } catch (err) {
    console.error('Error fetching items:', err);
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-danger);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">⚠️</div>
          <h4>Could not load menu items</h4>
          <p>${err.message}</p>
          <button class="btn btn-secondary btn-sm" style="margin-top: 12px;" onclick="loadMenuItems()">Try Again</button>
        </div>
      `;
    }
  }
}

function renderMenuCards() {
  const grid = document.getElementById('food-grid');
  if (!grid) return;

  if (currentItems.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3>No matching dishes found</h3>
        <p style="color: var(--color-text-muted); margin-bottom: 16px;">Try adjusting your filters or search keywords.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  let html = '';
  for (const item of currentItems) {
    const qtyInCart = cartManager.getItemQuantityInCart(item.id);
    const hasCustomization = item.customization_options && (
      (item.customization_options.sizes && item.customization_options.sizes.length > 1) ||
      (item.customization_options.extras && item.customization_options.extras.length > 0) ||
      (item.customization_options.sauces && item.customization_options.sauces.length > 0)
    );

    let spiceBadge = '';
    if (item.is_spicy === 1) spiceBadge = '<span class="badge badge-spicy">🌶️ Mild</span>';
    else if (item.is_spicy === 2) spiceBadge = '<span class="badge badge-spicy">🌶️🌶️ Medium</span>';
    else if (item.is_spicy >= 3) spiceBadge = '<span class="badge badge-spicy">🌶️🌶️🌶️ Extra Hot</span>';

    let dietaryBadge = '';
    if (item.is_vegan) {
      dietaryBadge = '<span class="dietary-tag badge-vegan">🌱 Vegan</span>';
    } else if (item.is_veg) {
      dietaryBadge = '<span class="dietary-tag badge-veg">🥦 Pure Veg</span>';
    } else {
      dietaryBadge = '<span class="dietary-tag badge-non-veg">🍗 Non-Veg</span>';
    }

    let actionBtnHtml = '';
    if (qtyInCart > 0 && !hasCustomization) {
      // Direct stepper for standard items
      actionBtnHtml = `
        <div class="qty-stepper">
          <button class="qty-btn" onclick="handleCardQtyChange(${item.id}, -1)">−</button>
          <span class="qty-val">${qtyInCart}</span>
          <button class="qty-btn" onclick="handleCardQtyChange(${item.id}, 1)">+</button>
        </div>
      `;
    } else if (hasCustomization) {
      actionBtnHtml = `
        <button class="add-btn" onclick="openCustomizerModal(${item.id})">
          ${qtyInCart > 0 ? `<span>(${qtyInCart})</span>` : ''}
          <span>Customise +</span>
        </button>
      `;
    } else {
      actionBtnHtml = `
        <button class="add-btn" onclick="quickAddItem(${item.id})">
          <span>+ Add</span>
        </button>
      `;
    }

    html += `
      <div class="food-card">
        <div class="food-img-wrapper">
          <img class="food-img" src="${item.image_url}" alt="${item.name}" loading="lazy" onerror="this.onerror=null; this.src=getFoodSvgFallback('${item.category_id}', '${item.name.replace(/'/g, "\\'")}')">
          <div class="food-badge-overlay">
            ${item.is_bestseller ? '<span class="badge badge-bestseller">⭐ Bestseller</span>' : ''}
            ${spiceBadge}
          </div>
          <div class="prep-badge">⏱️ ${item.prep_time_minutes} min</div>
        </div>
        <div class="food-body">
          <div class="food-meta">
            ${dietaryBadge}
            <div class="rating-badge">
              <span>★</span>
              <span>${item.rating.toFixed(1)}</span>
              <span style="color: var(--color-text-subtle); font-size: 0.75rem;">(${item.review_count})</span>
            </div>
          </div>
          <h4 class="food-title">${item.name}</h4>
          <p class="food-desc">${item.description}</p>
          <div class="food-footer">
            <div class="food-price">${formatMoney(item.price)} <small>• ${item.calories} kcal</small></div>
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;
}

window.renderMenuCards = renderMenuCards;

function quickAddItem(itemId) {
  const item = currentItems.find(i => i.id === itemId);
  if (!item) return;
  cartManager.addItem(item, {}, 1);
  renderMenuCards();
}

function handleCardQtyChange(itemId, delta) {
  const item = currentItems.find(i => i.id === itemId);
  if (!item) return;

  const key = cartManager.generateItemKey({
    id: item.id,
    selectedSize: null,
    selectedExtras: [],
    specialInstructions: ''
  });

  cartManager.updateQuantity(key, delta);
  renderMenuCards();
}

// Customizer Modal Logic
function openCustomizerModal(itemId) {
  const item = currentItems.find(i => i.id === itemId);
  if (!item) return;
  activeCustomizingItem = item;

  const overlay = document.getElementById('customizer-modal');
  const modalContent = document.getElementById('customizer-modal-content');
  if (!overlay || !modalContent) return;

  const opts = item.customization_options || {};
  let sectionsHtml = '';

  // 1. Sizes selection
  if (opts.sizes && opts.sizes.length > 0) {
    sectionsHtml += `
      <div class="opt-section">
        <div class="opt-section-title">
          <span>Choose Size</span>
          <span class="opt-section-desc">Required (1)</span>
        </div>
        <div class="opt-list">
    `;
    opts.sizes.forEach((size, idx) => {
      sectionsHtml += `
        <label class="opt-card ${idx === 0 ? 'selected' : ''}">
          <input type="radio" name="custom_size" value="${encodeURIComponent(JSON.stringify(size))}" ${idx === 0 ? 'checked' : ''} onchange="updateCustomizerSubtotal()">
          <span class="opt-label">${size.name}</span>
          <span class="opt-price">${size.price > 0 ? `+${formatMoney(size.price)}` : 'Included'}</span>
        </label>
      `;
    });
    sectionsHtml += `</div></div>`;
  }

  // 2. Crust / Bases selection (if pizzas or bowls)
  if (opts.crusts && opts.crusts.length > 0) {
    sectionsHtml += `
      <div class="opt-section">
        <div class="opt-section-title">
          <span>Select Crust Type</span>
          <span class="opt-section-desc">Required</span>
        </div>
        <div class="opt-list">
    `;
    opts.crusts.forEach((crust, idx) => {
      sectionsHtml += `
        <label class="opt-card ${idx === 0 ? 'selected' : ''}">
          <input type="radio" name="custom_crust" value="${encodeURIComponent(JSON.stringify(crust))}" ${idx === 0 ? 'checked' : ''} onchange="updateCustomizerSubtotal()">
          <span class="opt-label">${crust.name}</span>
          <span class="opt-price">${crust.price > 0 ? `+${formatMoney(crust.price)}` : 'Included'}</span>
        </label>
      `;
    });
    sectionsHtml += `</div></div>`;
  }

  // 3. Extras / Add-ons
  if (opts.extras && opts.extras.length > 0) {
    sectionsHtml += `
      <div class="opt-section">
        <div class="opt-section-title">
          <span>Add Extras & Toppings</span>
          <span class="opt-section-desc">Optional</span>
        </div>
        <div class="opt-list">
    `;
    opts.extras.forEach((extra) => {
      sectionsHtml += `
        <label class="opt-card">
          <input type="checkbox" name="custom_extras" value="${encodeURIComponent(JSON.stringify(extra))}" onchange="updateCustomizerSubtotal()">
          <span class="opt-label">${extra.name}</span>
          <span class="opt-price">+${formatMoney(extra.price)}</span>
        </label>
      `;
    });
    sectionsHtml += `</div></div>`;
  }

  // 4. Special Instructions
  sectionsHtml += `
    <div class="opt-section">
      <div class="opt-section-title">
        <span>Special Cooking Notes</span>
      </div>
      <textarea id="custom-notes" class="form-input" rows="2" placeholder="e.g. Dressing on side, no onions, extra crispy"></textarea>
    </div>
  `;

  modalContent.innerHTML = `
    <div style="margin-bottom: 20px;">
      <img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 14px;" onerror="this.onerror=null; this.src=getFoodSvgFallback('${item.category_id}', '${item.name.replace(/'/g, "\\'")}')">
      <h3 style="font-size: 1.35rem; margin-bottom: 6px;">${item.name}</h3>
      <p style="font-size: 0.9rem; color: var(--color-text-muted);">${item.description}</p>
    </div>
    ${sectionsHtml}
  `;

  overlay.classList.add('active');
  updateCustomizerSubtotal();
}

function closeCustomizerModal() {
  const overlay = document.getElementById('customizer-modal');
  if (overlay) {
    overlay.classList.remove('active');
  }
  activeCustomizingItem = null;
}

function updateCustomizerSubtotal() {
  if (!activeCustomizingItem) return;

  let total = Number(activeCustomizingItem.price);

  // Check selected size
  const sizeRadio = document.querySelector('input[name="custom_size"]:checked');
  if (sizeRadio) {
    try {
      const sizeObj = JSON.parse(decodeURIComponent(sizeRadio.value));
      total += Number(sizeObj.price || 0);
    } catch (e) {}
  }

  // Check crusts
  const crustRadio = document.querySelector('input[name="custom_crust"]:checked');
  if (crustRadio) {
    try {
      const crustObj = JSON.parse(decodeURIComponent(crustRadio.value));
      total += Number(crustObj.price || 0);
    } catch (e) {}
  }

  // Check extras
  const extraBoxes = document.querySelectorAll('input[name="custom_extras"]:checked');
  extraBoxes.forEach(box => {
    try {
      const extraObj = JSON.parse(decodeURIComponent(box.value));
      total += Number(extraObj.price || 0);
    } catch (e) {}
  });

  const btnEl = document.getElementById('add-custom-to-cart-btn');
  if (btnEl) {
    btnEl.innerHTML = `Add to Order • ${formatMoney(total)}`;
  }
}

function submitCustomizedItem() {
  if (!activeCustomizingItem) return;

  let selectedSize = null;
  const sizeRadio = document.querySelector('input[name="custom_size"]:checked');
  if (sizeRadio) {
    try {
      selectedSize = JSON.parse(decodeURIComponent(sizeRadio.value));
    } catch (e) {}
  }

  const selectedExtras = [];
  const extraBoxes = document.querySelectorAll('input[name="custom_extras"]:checked');
  extraBoxes.forEach(box => {
    try {
      selectedExtras.push(JSON.parse(decodeURIComponent(box.value)));
    } catch (e) {}
  });

  const crustRadio = document.querySelector('input[name="custom_crust"]:checked');
  if (crustRadio) {
    try {
      const crustObj = JSON.parse(decodeURIComponent(crustRadio.value));
      if (crustObj.price > 0) {
        selectedExtras.push(crustObj);
      }
    } catch (e) {}
  }

  const notesEl = document.getElementById('custom-notes');
  const specialInstructions = notesEl ? notesEl.value.trim() : '';

  cartManager.addItem(activeCustomizingItem, {
    selectedSize,
    selectedExtras,
    specialInstructions
  }, 1);

  closeCustomizerModal();
  renderMenuCards();
}

// Filter and Search Event Handlers
function setupFilterListeners() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  let debounceTimeout = null;

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        currentSearch = val.trim();
        loadMenuItems();
      }, 300);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearBtn.style.display = 'none';
      currentSearch = '';
      loadMenuItems();
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadMenuItems();
    });
  }

  // Dietary filter chips
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filterKey = chip.getAttribute('data-filter');
      activeFilters[filterKey] = !activeFilters[filterKey];
      chip.classList.toggle('active', activeFilters[filterKey]);
      loadMenuItems();
    });
  });
}

function resetFilters() {
  currentCategory = 'all';
  currentSearch = '';
  currentSort = 'featured';
  activeFilters = { isVeg: false, isVegan: false, isSpicy: false, isBestseller: false };

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'featured';

  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  renderCategories();
  loadMenuItems();
}
