/**
 * DevOps TaskFlow — Interactive Frontend Controller
 */

const API_BASE = '/api/v1';
let authToken = localStorage.getItem('taskflow_token') || null;
let currentUser = JSON.parse(localStorage.getItem('taskflow_user') || 'null');
let tasksData = [];

// ─── DOM Elements ─────────────────────────────────────────────────────────────
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const navUserArea = document.getElementById('navUserArea');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const tasksCountBadge = document.getElementById('tasksCountBadge');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const apiPing = document.getElementById('apiPing');

// ─── Initialization ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  startHealthPinger();
});

// ─── Authentication Flow ──────────────────────────────────────────────────────
function checkAuth() {
  if (authToken && currentUser) {
    showDashboard();
  } else {
    showAuth();
  }
}

function showAuth() {
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  renderNavUser(null);
}

function showDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  renderNavUser(currentUser);
  loadStats();
  loadTasks();
}

function switchAuthTab(tab) {
  if (tab === 'login') {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function renderNavUser(user) {
  if (!user) {
    navUserArea.innerHTML = `
      <div class="user-badge">
        <div class="user-avatar"><i class="fa-regular fa-user"></i></div>
        <div class="user-info">
          <span class="user-name">Guest</span>
          <span class="user-role">Not authenticated</span>
        </div>
      </div>
    `;
    return;
  }

  const initial = (user.name || 'User').charAt(0).toUpperCase();
  navUserArea.innerHTML = `
    <div class="user-badge">
      <div class="user-avatar">${initial}</div>
      <div class="user-info">
        <span class="user-name">${escapeHtml(user.name)}</span>
        <span class="user-role">${escapeHtml(user.role || 'user')}</span>
      </div>
      <button class="btn-logout" onclick="handleLogout()" title="Logout">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
      </button>
    </div>
  `;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginSubmitBtn');

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    authToken = data.data.token;
    currentUser = data.data.user;
    localStorage.setItem('taskflow_token', authToken);
    localStorage.setItem('taskflow_user', JSON.stringify(currentUser));

    showToast('Login berhasil! Selamat datang ' + currentUser.name, 'success');
    showDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Masuk ke Dashboard</span><i class="fa-solid fa-arrow-right"></i>`;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const btn = document.getElementById('registerSubmitBtn');

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || (data.errors && data.errors[0]?.message) || 'Registration failed');
    }

    authToken = data.data.token;
    currentUser = data.data.user;
    localStorage.setItem('taskflow_token', authToken);
    localStorage.setItem('taskflow_user', JSON.stringify(currentUser));

    showToast('Pendaftaran akun sukses!', 'success');
    showDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Buat Akun Baru</span><i class="fa-solid fa-check"></i>`;
  }
}

function handleLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('taskflow_token');
  localStorage.removeItem('taskflow_user');
  showToast('Anda telah keluar.', 'info');
  showAuth();
}

// ─── Task Data & Dashboard ────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/tasks/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const result = await res.json();
    if (res.ok && result.data) {
      const stats = result.data;
      const byStatus = stats.byStatus || {};
      const byPriority = stats.byPriority || {};

      document.getElementById('statTotal').textContent = stats.total || 0;
      document.getElementById('statInProgress').textContent = byStatus.in_progress || 0;
      document.getElementById('statCompleted').textContent = byStatus.done || 0;
      document.getElementById('statHighPriority').textContent = (byPriority.high || 0) + (byPriority.critical || 0);
    }
  } catch (err) {
    console.error('Failed to load stats', err);
  }
}

async function loadTasks() {
  taskList.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
      <i class="fa-solid fa-circle-notch fa-spin fa-2x"></i>
      <p style="margin-top: 0.5rem;">Fetching tasks from PostgreSQL...</p>
    </div>
  `;

  const status = document.getElementById('statusFilter').value;
  const priority = document.getElementById('priorityFilter').value;
  const search = document.getElementById('searchInput').value.trim();

  const params = new URLSearchParams({ limit: 50 });
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  if (search) params.append('search', search);

  try {
    const res = await fetch(`${API_BASE}/tasks?${params.toString()}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const result = await res.json();

    if (res.status === 401) {
      handleLogout();
      return;
    }

    if (!res.ok) throw new Error(result.message || 'Failed to load tasks');

    tasksData = result.data || [];
    renderTasks(tasksData);
    loadStats(); // keep stats in sync
  } catch (err) {
    showToast(err.message, 'error');
    taskList.innerHTML = '';
  }
}

function renderTasks(tasks) {
  tasksCountBadge.textContent = `Showing ${tasks.length} task${tasks.length === 1 ? '' : 's'}`;

  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  taskList.innerHTML = tasks.map((task) => createTaskCardHtml(task)).join('');
}

function createTaskCardHtml(task) {
  const priorityClass = `priority-${task.priority || 'medium'}`;
  const statusLabel = formatStatus(task.status);
  const priorityLabel = (task.priority || 'medium').toUpperCase();

  const dueDateFormatted = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No due date';

  // Toggle button text based on status
  let nextStatusAction = '';
  if (task.status === 'todo') {
    nextStatusAction = `
      <button class="task-toggle-btn" onclick="quickUpdateStatus('${task.id}', 'in_progress')" title="Start Task">
        <i class="fa-solid fa-play"></i> Mulai
      </button>`;
  } else if (task.status === 'in_progress') {
    nextStatusAction = `
      <button class="task-toggle-btn" onclick="quickUpdateStatus('${task.id}', 'done')" title="Complete Task">
        <i class="fa-solid fa-check"></i> Selesai
      </button>`;
  } else if (task.status === 'done') {
    nextStatusAction = `
      <button class="task-toggle-btn" onclick="quickUpdateStatus('${task.id}', 'todo')" title="Reopen Task">
        <i class="fa-solid fa-arrow-rotate-left"></i> Reopen
      </button>`;
  }

  return `
    <div class="task-card ${priorityClass}">
      <div>
        <div class="task-card-header">
          <div class="task-badges">
            <span class="badge badge-status-${task.status}">
              <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${statusLabel}
            </span>
            <span class="badge badge-priority-${task.priority}">
              ${priorityLabel}
            </span>
          </div>
          <div class="task-actions">
            <button class="task-btn-action" onclick="openEditModal('${task.id}')" title="Edit Task">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button class="task-btn-action btn-del" onclick="deleteTask('${task.id}')" title="Delete Task">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>

        <h4 class="task-title">${escapeHtml(task.title)}</h4>
        <p class="task-desc">${escapeHtml(task.description || 'Tidak ada deskripsi.')}</p>
      </div>

      <div class="task-footer">
        <span class="task-due">
          <i class="fa-regular fa-calendar"></i> ${dueDateFormatted}
        </span>
        ${nextStatusAction}
      </div>
    </div>
  `;
}

function formatStatus(status) {
  switch (status) {
    case 'todo': return 'To Do';
    case 'in_progress': return 'In Progress';
    case 'done': return 'Done';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

// ─── Modal Actions (Create / Edit) ────────────────────────────────────────────
function openCreateModal() {
  document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-plus text-cyan"></i> Buat Task Baru';
  document.getElementById('taskId').value = '';
  taskForm.reset();
  document.getElementById('taskPriority').value = 'medium';
  document.getElementById('taskStatus').value = 'todo';
  taskModal.classList.remove('hidden');
  document.getElementById('taskTitle').focus();
}

function openEditModal(id) {
  const task = tasksData.find((t) => t.id === id);
  if (!task) return;

  document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-cyan"></i> Edit Task';
  document.getElementById('taskId').value = task.id;
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskPriority').value = task.priority || 'medium';
  document.getElementById('taskStatus').value = task.status || 'todo';

  if (task.dueDate) {
    const d = new Date(task.dueDate);
    document.getElementById('taskDueDate').value = d.toISOString().split('T')[0];
  } else {
    document.getElementById('taskDueDate').value = '';
  }

  taskModal.classList.remove('hidden');
}

function closeModal() {
  taskModal.classList.add('hidden');
}

function closeModalOnBackdrop(e) {
  if (e.target === taskModal) closeModal();
}

async function handleSaveTask(e) {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDescription').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const status = document.getElementById('taskStatus').value;
  const dueDateInput = document.getElementById('taskDueDate').value;

  const payload = {
    title,
    description,
    priority,
    status,
    dueDate: dueDateInput ? new Date(dueDateInput).toISOString() : null,
  };

  const btn = document.getElementById('saveTaskBtn');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

  try {
    const isEdit = Boolean(id);
    const url = isEdit ? `${API_BASE}/tasks/${id}` : `${API_BASE}/tasks`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || (result.errors && result.errors[0]?.message) || 'Failed to save task');
    }

    showToast(isEdit ? 'Task berhasil diupdate!' : 'Task baru berhasil dibuat!', 'success');
    closeModal();
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Task`;
  }
}

async function quickUpdateStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error('Gagal update status');
    showToast(`Status task diubah ke "${formatStatus(newStatus)}"`, 'info');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Yakin ingin menghapus task ini?')) return;

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error('Gagal menghapus task');
    showToast('Task berhasil dihapus.', 'info');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Search Debounce ──────────────────────────────────────────────────────────
let searchTimeout;
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadTasks();
  }, 300);
}

// ─── Live Health Pinger ───────────────────────────────────────────────────────
function startHealthPinger() {
  const ping = async () => {
    const start = performance.now();
    try {
      const res = await fetch('/health');
      const timeMs = Math.round(performance.now() - start);
      if (res.ok) {
        apiPing.innerHTML = `<span style="color: var(--accent-green);">Online (${timeMs}ms)</span>`;
      } else {
        apiPing.innerHTML = `<span style="color: var(--accent-red);">Degraded</span>`;
      }
    } catch {
      apiPing.innerHTML = `<span style="color: var(--accent-red);">Offline</span>`;
    }
  };

  ping();
  setInterval(ping, 15000);
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check text-green';
  if (type === 'error') icon = 'fa-triangle-exclamation text-red';
  if (type === 'info') icon = 'fa-circle-info text-cyan';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
