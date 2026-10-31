/**
 * TasteCrave Data and API Client Services
 */

const API_BASE = '';

// Simple toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Currency Formatter
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return '$' + num.toFixed(2);
}

// API Helper Methods
async function apiGet(endpoint, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  }
  const queryString = query.toString();
  const url = `${API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API GET error on ${endpoint}:`, err);
    throw err;
  }
}

async function apiPost(endpoint, data = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resData.error || `Request failed with status ${res.status}`);
    }
    return resData;
  } catch (err) {
    console.error(`API POST error on ${endpoint}:`, err);
    throw err;
  }
}

async function apiPatch(endpoint, data = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resData.error || `Request failed with status ${res.status}`);
    }
    return resData;
  } catch (err) {
    console.error(`API PATCH error on ${endpoint}:`, err);
    throw err;
  }
}

// Inline SVG generator for reliable food artwork offline
function getFoodSvgFallback(categoryId, name) {
  const categoryEmojis = {
    burgers: '🍔',
    pizzas: '🍕',
    asian: '🍜',
    mexican: '🌮',
    healthy: '🥗',
    desserts: '🍰',
    beverages: '🥤'
  };

  const gradients = {
    burgers: ['#ff7e5f', '#feb47b'],
    pizzas: ['#ff416c', '#ff4b2b'],
    asian: ['#f857a6', '#ff5858'],
    mexican: ['#f7971e', '#ffd200'],
    healthy: ['#56ab2f', '#a8e063'],
    desserts: ['#e1eec3', '#f05053'],
    beverages: ['#2193b0', '#6dd5ed']
  };

  const emoji = categoryEmojis[categoryId] || '🍽️';
  const [col1, col2] = gradients[categoryId] || ['#ff521a', '#ff8450'];
  const safeName = (name || 'Gourmet Dish').replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${col1}" />
        <stop offset="100%" stop-color="${col2}" />
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#grad)" />
    <circle cx="300" cy="180" r="100" fill="rgba(255,255,255,0.2)" />
    <text x="300" y="210" font-size="90" text-anchor="middle" font-family="system-ui, -apple-system">${emoji}</text>
    <text x="300" y="320" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${safeName}</text>
    <text x="300" y="350" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle" font-family="sans-serif">TasteCrave Artisanal Kitchen</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
