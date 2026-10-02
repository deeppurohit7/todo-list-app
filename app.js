/**
 * TaskPulse OS - Core Application Engine
 * Author: Deep Purohit
 * Concepts: CRUD, Event Delegation, LocalStorage, Array Filtering
 */

// ==========================================================================
// 1. Initial State & Seed Data
// ==========================================================================
const STORAGE_KEY = 'taskpulse_tasks_v1';

// Seed initial tasks if user has no existing saved state
const defaultTasks = [
  {
    id: 'task-1',
    title: 'Complete HTML/CSS foundations (Tier 1)',
    priority: 'high',
    category: 'Roadmap',
    completed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Build TaskPulse OS with LocalStorage (Project #4)',
    priority: 'high',
    category: 'Dev',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Review JavaScript Event Delegation and Array methods',
    priority: 'medium',
    category: 'Dev',
    completed: false,
    createdAt: new Date().toISOString()
  }
];

let tasks = loadTasksFromStorage();
let currentFilter = 'all';
let searchQuery = '';

// ==========================================================================
// 2. DOM Element Selectors
// ==========================================================================
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const categorySelect = document.getElementById('category-select');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const filterPills = document.querySelectorAll('.pill');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const exportBtn = document.getElementById('export-btn');

// Metrics DOM elements
const totalCountEl = document.getElementById('total-count');
const completedCountEl = document.getElementById('completed-count');
const pendingCountEl = document.getElementById('pending-count');
const progressPercentEl = document.getElementById('progress-percent');
const progressBarEl = document.getElementById('progress-bar');

// ==========================================================================
// 3. LocalStorage Persistence Functions
// ==========================================================================
function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultTasks;
  } catch (error) {
    console.error('Failed to parse tasks from localStorage:', error);
    return defaultTasks;
  }
}

function saveTasksToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ==========================================================================
// 4. Render & UI Updates
// ==========================================================================
function render() {
  // Filter by active pill (all, active, completed) and search keyword
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = 
      currentFilter === 'all' ? true :
      currentFilter === 'active' ? !task.completed :
      task.completed;

    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Toggle empty state visibility
  if (filteredTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    taskList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');
  }

  updateMetrics();
}

function createTaskHTML(task) {
  return `
    <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <input 
        type="checkbox" 
        class="task-checkbox" 
        ${task.completed ? 'checked' : ''} 
        aria-label="Mark task as complete"
      >
      <div class="task-body">
        <span class="task-text">${escapeHTML(task.title)}</span>
        <div class="task-meta">
          <span class="cat-tag">${task.category}</span>
          <span class="priority-tag priority-${task.priority}">${task.priority}</span>
        </div>
      </div>
      <button class="btn-del" title="Delete task" aria-label="Delete task">✕</button>
    </li>
  `;
}

// Security: Prevent XSS injection from task title input
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Recalculate dashboard telemetry
function updateMetrics() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  totalCountEl.textContent = total;
  completedCountEl.textContent = completed;
  pendingCountEl.textContent = pending;
  progressPercentEl.textContent = `${percent}%`;
  progressBarEl.style.width = `${percent}%`;
}

// ==========================================================================
// 5. Task Actions (CRUD)
// ==========================================================================
function addTask(title, priority, category) {
  const newTask = {
    id: 'task-' + Date.now(),
    title: title.trim(),
    priority: priority,
    category: category,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask); // Place newest at the top
  saveTasksToStorage();
  render();
}

function toggleTaskComplete(taskId) {
  tasks = tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveTasksToStorage();
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasksToStorage();
  render();
}

function clearCompleted() {
  tasks = tasks.filter(task => !task.completed);
  saveTasksToStorage();
  render();
}

// Export tasks as a downloadable .json file
function exportTasksAsJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `taskpulse_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// ==========================================================================
// 6. Event Listeners & Event Delegation
// ==========================================================================

// Handle Form Submission
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value;
  if (!text.trim()) return;

  addTask(text, prioritySelect.value, categorySelect.value);
  taskInput.value = '';
  taskInput.focus();
});

// Event Delegation for Task List (Single listener for all checkboxes and delete buttons)
taskList.addEventListener('click', (e) => {
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;
  const taskId = taskItem.dataset.id;

  // Checkbox clicked
  if (e.target.classList.contains('task-checkbox')) {
    toggleTaskComplete(taskId);
  }

  // Delete button clicked
  if (e.target.classList.contains('btn-del')) {
    deleteTask(taskId);
  }
});

// Search input debouncing
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
});

// Filter pill clicks
filterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    filterPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilter = pill.dataset.filter;
    render();
  });
});

// Clear finished tasks
clearCompletedBtn.addEventListener('click', () => {
  if (confirm('Clear all completed tasks?')) {
    clearCompleted();
  }
});

// Export JSON
exportBtn.addEventListener('click', exportTasksAsJSON);

// Initialize on page load
render();