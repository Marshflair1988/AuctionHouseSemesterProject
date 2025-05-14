// Base API URL
const API_BASE_URL = 'https://v2.api.noroff.dev';

// Authentication state
let isAuthenticated = false;
let currentUser = null;

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    isAuthenticated = true;
    currentUser = JSON.parse(localStorage.getItem('user'));
    updateUIForAuth();
  } else {
    isAuthenticated = false;
    currentUser = null;
    updateUIForGuest();
  }
}

// Update UI based on authentication state
function updateUIForAuth() {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const userAvatar = document.getElementById('user-avatar');
  const userCredits = document.getElementById('user-credits');
  const userName = document.getElementById('user-name');

  // Hide auth buttons
  if (authButtons) {
    authButtons.classList.add('hidden');
  }

  // Show user menu
  if (userMenu) {
    userMenu.classList.remove('hidden');
    if (userAvatar && currentUser?.avatar) {
      userAvatar.src = currentUser.avatar.url || '../assets/default-avatar.png';
    }
    if (userCredits) {
      userCredits.textContent = `${currentUser?.credits || 0} credits`;
    }
    if (userName) {
      userName.textContent = currentUser?.name || 'User';
    }
  }
}

function updateUIForGuest() {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');

  // Show auth buttons
  if (authButtons) {
    authButtons.classList.remove('hidden');
  }

  // Hide user menu
  if (userMenu) {
    userMenu.classList.add('hidden');
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  isAuthenticated = false;
  currentUser = null;
  updateUIForGuest();
  window.location.href = 'login.html';
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  const userMenuButton = document.getElementById('user-menu-button');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuButton && userDropdown) {
    userMenuButton.addEventListener('click', () => {
      userDropdown.classList.toggle('hidden');
    });
  }
});

function getUser() {
  return JSON.parse(localStorage.getItem('user'));
}

function getToken() {
  return localStorage.getItem('token');
}

function updateUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function authFetch(endpoint, options = {}) {
  const token = getToken();
  const apiKey = 'aa2b815e-2edb-4047-8ddd-2503d905bff6';
  const base = API_BASE_URL;
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Noroff-API-Key': apiKey,
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.errors?.[0]?.message || response.statusText);
  }
  return response.json();
}

export {
  checkAuth,
  isAuthenticated,
  currentUser,
  API_BASE_URL,
  getUser,
  getToken,
  updateUser,
  authFetch,
};
