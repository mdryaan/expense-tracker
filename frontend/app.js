const API_BASE = 'http://localhost:5000';
const STORAGE_KEY = 'expenses_data';

let allExpenses = [];
let activeFilter = 'all';

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveToStorage(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  localStorage.setItem(STORAGE_KEY + '_updated', new Date().toISOString());
}

function getStorageAge() {
  const ts = localStorage.getItem(STORAGE_KEY + '_updated');
  if (!ts) return null;
  return new Date() - new Date(ts);
}

function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

function getCurrentMonthTotal(expenses) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return expenses
    .filter(e => {
      const [y, m] = e.date.split('-');
      return parseInt(y, 10) === year && parseInt(m, 10) === month;
    })
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
}

function updateSummary(expenses) {
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const monthly = getCurrentMonthTotal(expenses);

  document.getElementById('totalAmount').textContent = formatCurrency(total);
  document.getElementById('expenseCount').textContent = expenses.length;
  document.getElementById('monthlyAmount').textContent = formatCurrency(monthly);
}

function getFilteredExpenses() {
  if (activeFilter === 'all') return allExpenses;
  return allExpenses.filter(e => e.category === activeFilter);
}

function getCategoryColor(category) {
  const colors = {
    Food: '#f59e0b',
    Transport: '#3b82f6',
    Housing: '#8b5cf6',
    Entertainment: '#ec4899',
    Health: '#10b981',
    Shopping: '#f97316',
    Education: '#06b6d4',
    Other: '#6b7280'
  };
  return colors[category] || '#6b7280';
}

function renderTable(expenses) {
  const tbody = document.getElementById('expensesBody');
  const emptyState = document.getElementById('emptyState');

  tbody.innerHTML = '';

  if (expenses.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(expense => {
    const color = getCategoryColor(expense.category);
    const tr = document.createElement('tr');
    tr.dataset.id = expense.id;
    tr.innerHTML = `
      <td>${escapeHtml(expense.title)}</td>
      <td><span class="category-badge" style="--badge-color:${color}">${escapeHtml(expense.category)}</span></td>
      <td>${formatDate(expense.date)}</td>
      <td class="amount-cell">${formatCurrency(expense.amount)}</td>
      <td><button class="btn-delete" onclick="deleteExpense('${expense.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function refreshUI() {
  const filtered = getFilteredExpenses();
  renderTable(filtered);
  updateSummary(allExpenses);
}

function clearFieldErrors() {
  ['title', 'amount', 'category', 'date'].forEach(field => {
    document.getElementById(field).classList.remove('error');
    document.getElementById(field + 'Error').textContent = '';
  });
}

function showFieldError(fieldId, message) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById(fieldId + 'Error').textContent = message;
}

function validateForm(title, amount, category, date) {
  let valid = true;

  if (!title) {
    showFieldError('title', 'Title is required');
    valid = false;
  } else if (title.length > 100) {
    showFieldError('title', 'Title must be 100 characters or less');
    valid = false;
  }

  if (!amount) {
    showFieldError('amount', 'Amount is required');
    valid = false;
  } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    showFieldError('amount', 'Enter a valid positive amount');
    valid = false;
  } else if (parseFloat(amount) > 1000000) {
    showFieldError('amount', 'Amount seems too large');
    valid = false;
  }

  if (!category) {
    showFieldError('category', 'Select a category');
    valid = false;
  }

  if (!date) {
    showFieldError('date', 'Date is required');
    valid = false;
  }

  return valid;
}

function setFormMessage(text, type) {
  const el = document.getElementById('formMessage');
  el.textContent = text;
  el.className = 'form-message ' + type;
  if (text) {
    setTimeout(() => {
      el.textContent = '';
      el.className = 'form-message';
    }, 3000);
  }
}

async function addExpense(expense) {
  try {
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Server error');
    }

    const saved = await response.json();
    allExpenses.push(saved);
    saveToStorage(allExpenses);
    return { success: true };
  } catch (err) {
    const local = { ...expense, id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2) };
    allExpenses.push(local);
    saveToStorage(allExpenses);
    return { success: true, offline: true };
  }
}

async function deleteExpense(id) {
  try {
    await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
  } catch {
  }

  allExpenses = allExpenses.filter(e => e.id !== id);
  saveToStorage(allExpenses);
  refreshUI();
}

async function syncWithBackend() {
  try {
    const response = await fetch(`${API_BASE}/expenses`);
    if (!response.ok) throw new Error('Fetch failed');
    const serverExpenses = await response.json();

    const localExpenses = loadFromStorage();
    const localOnlyIds = new Set(localExpenses.map(e => e.id).filter(id => id.startsWith('local_')));

    const merged = [...serverExpenses];
    localExpenses.forEach(le => {
      if (le.id.startsWith('local_')) {
        merged.push(le);
      }
    });

    allExpenses = merged;
    saveToStorage(allExpenses);
  } catch {
    allExpenses = loadFromStorage();
  }
}

document.getElementById('expenseForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearFieldErrors();

  const title = document.getElementById('title').value.trim();
  const amount = document.getElementById('amount').value.trim();
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  if (!validateForm(title, amount, category, date)) return;

  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  submitBtn.disabled = true;
  btnText.textContent = 'Adding...';

  const result = await addExpense({ title, amount: parseFloat(amount), category, date });

  submitBtn.disabled = false;
  btnText.textContent = 'Add Expense';

  if (result.success) {
    this.reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    if (result.offline) {
      setFormMessage('Expense saved locally (API unavailable)', 'success');
    } else {
      setFormMessage('Expense added!', 'success');
    }
    refreshUI();
  }
});

document.getElementById('filterCategory').addEventListener('change', function () {
  activeFilter = this.value;
  refreshUI();
});

document.getElementById('date').value = new Date().toISOString().split('T')[0];

syncWithBackend().then(() => {
  refreshUI();
});
