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

// Export functions for use in other files
export { checkAuth, isAuthenticated, currentUser, API_BASE_URL };
