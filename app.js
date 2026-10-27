const STORAGE_KEY_ITEMS = 'subzero_items';
const STORAGE_KEY_BUDGET = 'subzero_budget';
const STORAGE_KEY_THEME = 'subzero_theme';
const STORAGE_KEY_CURRENCY = 'subzero_currency';

const EXCHANGE_RATE = 85;

const DEFAULT_ITEMS = [
  {
    id: 'sub_copilot_01',
    name: 'GitHub Copilot',
    cost: 10,
    currency: 'USD',
    cycle: 'Monthly',
    category: 'Dev & Cloud',
    dueDate: getRelativeDateString(9)
  },
  {
    id: 'sub_spotify_02',
    name: 'Spotify Premium',
    cost: 119,
    currency: 'INR',
    cycle: 'Monthly',
    category: 'Streaming',
    dueDate: getRelativeDateString(14)
  },
  {
    id: 'sub_netflix_03',
    name: 'Netflix Standard',
    cost: 499,
    currency: 'INR',
    cycle: 'Monthly',
    category: 'Streaming',
    dueDate: getRelativeDateString(22)
  }
];

function getRelativeDateString(daysOffset) {
  const target = new Date();
  target.setDate(target.getDate() + daysOffset);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let items = [];
let activeCurrency = 'USD';
let budgetCap = 60;
let activeCategory = 'All';
let searchQuery = '';

const currencyToggleBtn = document.getElementById('currency-toggle');
const currencyLabel = document.getElementById('currency-label');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const addModalBtn = document.getElementById('btn-add-modal');
const emptyAddBtn = document.getElementById('btn-empty-add');

const statMonthlyBurn = document.getElementById('stat-monthly-burn');
const statYearlyProjected = document.getElementById('stat-yearly-projected');
const statActiveCount = document.getElementById('stat-active-count');

const budgetInput = document.getElementById('budget-input');
const budgetUsageText = document.getElementById('budget-usage-text');
const budgetPctText = document.getElementById('budget-pct-text');
const budgetProgressBar = document.getElementById('budget-progress-bar');
const currencySymbols = document.querySelectorAll('.currency-symbol');

const filterChips = document.querySelectorAll('.filter-chip');
const searchInput = document.getElementById('search-input');
const subGrid = document.getElementById('sub-grid');
const emptyState = document.getElementById('empty-state');

const exportBtn = document.getElementById('btn-export');
const importBtn = document.getElementById('btn-import');
const importFileInput = document.getElementById('import-file-input');

const subModal = document.getElementById('sub-modal');
const subForm = document.getElementById('sub-form');
const modalCancelBtn = document.getElementById('modal-cancel');
const modalCloseIcon = document.getElementById('modal-close-icon');
const subDateInput = document.getElementById('sub-date');

function init() {
  initTheme();
  initCurrency();
  initData();
  bindEvents();
  render();
}

function initTheme() {
  const storedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
  applyTheme(storedTheme);
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    themeIcon.textContent = '☾';
  } else {
    document.body.classList.remove('light-mode');
    themeIcon.textContent = '☀';
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-mode');
  const nextTheme = isLight ? 'dark' : 'light';
  applyTheme(nextTheme);
  localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
}

function initCurrency() {
  const storedCurrency = localStorage.getItem(STORAGE_KEY_CURRENCY);
  if (storedCurrency === 'USD' || storedCurrency === 'INR') {
    activeCurrency = storedCurrency;
  } else {
    activeCurrency = 'USD';
  }
  updateCurrencyUI();
}

function updateCurrencyUI() {
  const symbol = activeCurrency === 'INR' ? '₹' : '$';
  currencyLabel.textContent = activeCurrency === 'INR' ? '₹ INR' : '$ USD';
  currencySymbols.forEach(node => {
    node.textContent = symbol;
  });
}

function initData() {
  const rawItems = localStorage.getItem(STORAGE_KEY_ITEMS);
  if (!rawItems) {
    items = [...DEFAULT_ITEMS];
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } else {
    try {
      items = JSON.parse(rawItems);
      if (!Array.isArray(items)) items = [...DEFAULT_ITEMS];
    } catch {
      items = [...DEFAULT_ITEMS];
    }
  }

  const rawBudget = localStorage.getItem(STORAGE_KEY_BUDGET);
  if (rawBudget !== null && !isNaN(parseFloat(rawBudget))) {
    budgetCap = parseFloat(rawBudget);
  } else {
    budgetCap = activeCurrency === 'INR' ? 5000 : 60;
    localStorage.setItem(STORAGE_KEY_BUDGET, String(budgetCap));
  }

  budgetInput.value = budgetCap;
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
}

function saveBudget(value) {
  budgetCap = value;
  localStorage.setItem(STORAGE_KEY_BUDGET, String(budgetCap));
}

function convertValue(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    return amount * EXCHANGE_RATE;
  }
  if (fromCurrency === 'INR' && toCurrency === 'USD') {
    return amount / EXCHANGE_RATE;
  }
  return amount;
}

function getMonthlyEquivalent(cost, cycle) {
  return cycle === 'Yearly' ? cost / 12 : cost;
}

function formatMoney(amount, currencyCode) {
  const symbol = currencyCode === 'INR' ? '₹' : '$';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function calculateMetrics() {
  let monthlyBurn = 0;

  for (const item of items) {
    const rawMonthly = getMonthlyEquivalent(item.cost, item.cycle);
    const converted = convertValue(rawMonthly, item.currency, activeCurrency);
    monthlyBurn += converted;
  }

  const yearlyProjected = monthlyBurn * 12;
  const activeCount = items.length;

  return { monthlyBurn, yearlyProjected, activeCount };
}

function toggleCurrency() {
  const nextCurrency = activeCurrency === 'USD' ? 'INR' : 'USD';
  
  if (nextCurrency === 'INR') {
    budgetCap = Math.round(budgetCap * EXCHANGE_RATE);
  } else {
    budgetCap = Number((budgetCap / EXCHANGE_RATE).toFixed(2));
  }

  activeCurrency = nextCurrency;
  localStorage.setItem(STORAGE_KEY_CURRENCY, activeCurrency);
  localStorage.setItem(STORAGE_KEY_BUDGET, String(budgetCap));

  budgetInput.value = budgetCap;
  updateCurrencyUI();
  render();
}

function filterItems() {
  const query = searchQuery.trim().toLowerCase();

  return items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = !query || 
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
}

function render() {
  renderMetrics();
  renderListings();
}

function renderMetrics() {
  const { monthlyBurn, yearlyProjected, activeCount } = calculateMetrics();

  statMonthlyBurn.textContent = formatMoney(monthlyBurn, activeCurrency);
  statYearlyProjected.textContent = formatMoney(yearlyProjected, activeCurrency);
  statActiveCount.textContent = String(activeCount);

  const pct = budgetCap > 0 ? (monthlyBurn / budgetCap) * 100 : 0;
  const clampedPct = Math.min(Math.max(pct, 0), 100);

  budgetUsageText.textContent = `${formatMoney(monthlyBurn, activeCurrency)} of ${formatMoney(budgetCap, activeCurrency)} used`;
  budgetPctText.textContent = `${Math.round(pct)}%`;
  budgetProgressBar.style.width = `${clampedPct}%`;

  if (pct >= 90) {
    budgetProgressBar.classList.add('danger');
    budgetPctText.classList.add('danger');
  } else {
    budgetProgressBar.classList.remove('danger');
    budgetPctText.classList.remove('danger');
  }
}

function renderListings() {
  const visibleItems = filterItems();

  if (visibleItems.length === 0) {
    subGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  subGrid.innerHTML = visibleItems.map(item => {
    const rawMonthly = getMonthlyEquivalent(item.cost, item.cycle);
    const convertedMonthly = convertValue(rawMonthly, item.currency, activeCurrency);
    const hasDifferentCurrency = item.currency !== activeCurrency;

    const daysRemaining = calculateDaysRemaining(item.dueDate);
    const formattedDueDate = formatDisplayDate(item.dueDate);

    let dueTagClass = 'due-days-pill';
    let dueTagText = '';

    if (daysRemaining < 0) {
      dueTagClass += ' due-soon';
      dueTagText = `${Math.abs(daysRemaining)}d overdue`;
    } else if (daysRemaining === 0) {
      dueTagClass += ' due-soon';
      dueTagText = 'Due today';
    } else if (daysRemaining <= 3) {
      dueTagClass += ' due-soon';
      dueTagText = `${daysRemaining}d left`;
    } else {
      dueTagText = `${daysRemaining}d left`;
    }

    const secondaryPricing = hasDifferentCurrency
      ? `≈ ${formatMoney(convertedMonthly, activeCurrency)}/mo`
      : item.cycle === 'Yearly'
      ? `${formatMoney(rawMonthly, item.currency)}/mo`
      : '';

    return `
      <article class="sub-card" data-id="${escapeHtml(item.id)}">
        <div class="card-top">
          <div class="card-title-wrap">
            <h3 class="sub-name">${escapeHtml(item.name)}</h3>
            <span class="category-tag">${escapeHtml(item.category)}</span>
          </div>
          <button type="button" class="card-delete-btn" data-action="delete" aria-label="Delete ${escapeHtml(item.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
          </button>
        </div>

        <div class="card-pricing">
          <div class="price-main">
            <span class="price-amount">${formatMoney(item.cost, item.currency)}</span>
            <span class="price-cycle">/${item.cycle === 'Yearly' ? 'yr' : 'mo'}</span>
          </div>
          ${secondaryPricing ? `<span class="price-sub">${secondaryPricing}</span>` : ''}
        </div>

        <div class="card-footer">
          <div class="due-info">
            <span>Due ${formattedDueDate}</span>
          </div>
          <span class="${dueTagClass}">${dueTagText}</span>
        </div>
      </article>
    `;
  }).join('');
}

function calculateDaysRemaining(dateString) {
  if (!dateString) return 0;
  const target = new Date(dateString);
  const now = new Date();
  
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function formatDisplayDate(dateString) {
  if (!dateString) return '—';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, match => {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return match;
    }
  });
}

function openAddModal() {
  subForm.reset();
  subDateInput.value = getRelativeDateString(30);
  subModal.showModal();
}

function closeAddModal() {
  subModal.close();
}

function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(subForm);
  const name = formData.get('name')?.toString().trim();
  const cost = parseFloat(formData.get('cost')?.toString() || '0');
  const currency = formData.get('currency')?.toString() || activeCurrency;
  const cycle = formData.get('cycle')?.toString() || 'Monthly';
  const category = formData.get('category')?.toString() || 'Utilities';
  const dueDate = formData.get('dueDate')?.toString();

  if (!name || isNaN(cost) || cost <= 0 || !dueDate) {
    return;
  }

  const newItem = {
    id: `sub_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    cost,
    currency,
    cycle,
    category,
    dueDate
  };

  items.unshift(newItem);
  saveItems();
  render();
  closeAddModal();
}

function deleteItem(id) {
  items = items.filter(item => item.id !== id);
  saveItems();
  render();
}

function exportBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    currency: activeCurrency,
    budget: budgetCap,
    items
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'subzero-backup.json';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}

function handleImportFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    try {
      const data = JSON.parse(event.target?.result);
      let importedItems = [];
      let importedBudget = null;
      let importedCurrency = null;

      if (Array.isArray(data)) {
        importedItems = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.items)) {
          importedItems = data.items;
        }
        if (typeof data.budget === 'number' && !isNaN(data.budget)) {
          importedBudget = data.budget;
        }
        if (data.currency === 'USD' || data.currency === 'INR') {
          importedCurrency = data.currency;
        }
      }

      if (importedItems.length === 0 && !Array.isArray(data?.items)) {
        alert('Invalid backup structure: No valid subscription array found.');
        return;
      }

      items = importedItems;
      saveItems();

      if (importedCurrency) {
        activeCurrency = importedCurrency;
        localStorage.setItem(STORAGE_KEY_CURRENCY, activeCurrency);
        updateCurrencyUI();
      }

      if (importedBudget !== null) {
        saveBudget(importedBudget);
        budgetInput.value = importedBudget;
      }

      render();
    } catch {
      alert('Unable to parse JSON file. Please ensure the file is valid JSON.');
    } finally {
      importFileInput.value = '';
    }
  };

  reader.readAsText(file);
}

function bindEvents() {
  currencyToggleBtn.addEventListener('click', toggleCurrency);
  themeToggleBtn.addEventListener('click', toggleTheme);

  addModalBtn.addEventListener('click', openAddModal);
  emptyAddBtn.addEventListener('click', openAddModal);
  modalCancelBtn.addEventListener('click', closeAddModal);
  modalCloseIcon.addEventListener('click', closeAddModal);

  subModal.addEventListener('click', e => {
    if (e.target === subModal) {
      closeAddModal();
    }
  });

  subForm.addEventListener('submit', handleFormSubmit);

  budgetInput.addEventListener('change', e => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      saveBudget(val);
      renderMetrics();
    } else {
      e.target.value = budgetCap;
    }
  });

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
      activeCategory = chip.dataset.category || 'All';
      renderListings();
    });
  });

  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderListings();
  });

  subGrid.addEventListener('click', e => {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (!deleteBtn) return;
    const card = deleteBtn.closest('.sub-card');
    if (!card) return;
    const itemId = card.dataset.id;
    if (itemId) {
      deleteItem(itemId);
    }
  });

  exportBtn.addEventListener('click', exportBackup);
  importBtn.addEventListener('click', () => {
    importFileInput.click();
  });
  importFileInput.addEventListener('change', handleImportFile);
}

document.addEventListener('DOMContentLoaded', init);
