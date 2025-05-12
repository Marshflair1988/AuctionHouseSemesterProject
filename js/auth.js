/**
 * Authentication Module for BidHive Auction House
 */

// API Base URL
const API_BASE_URL = 'https://api.noroff.dev/api/v1';

// Storage Keys
const TOKEN_KEY = 'bidhive_token';
const USER_KEY = 'bidhive_user';

/**
 * Initialize authentication on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  initializeAuth();
  setupLogoutHandler();
  setupUserDropdown();
  setupMobileMenu();
});

/**
 * Initialize authentication state
 */
function initializeAuth() {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    // User is logged in
    updateUIForLoggedInUser(user);
  } else {
    // User is not logged in
    updateUIForLoggedOutUser();
  }
}

/**
 * Update UI for logged in user
 * @param {Object} user - The user object
 */
function updateUIForLoggedInUser(user) {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const mobileMenu = document.getElementById('mobile-menu');

  if (authButtons) {
    authButtons.classList.add('hidden');
  }

  if (userMenu) {
    userMenu.classList.remove('hidden');
  }

  if (mobileMenu) {
    // Remove login/register links from mobile menu
    const authLinks = mobileMenu.querySelector('.border-t');
    if (authLinks) {
      authLinks.remove();
    }
  }

  // Update user avatar and credits
  const userAvatar = document.getElementById('user-avatar');
  const userCredits = document.getElementById('user-credits');

  if (userAvatar && user.avatar) {
    userAvatar.src = user.avatar;
    userAvatar.onerror = () => {
      userAvatar.src = 'assets/default-avatar.png';
    };
  }

  if (userCredits) {
    userCredits.textContent = `$${user.credits || 0}`;
  }

  // Show create listing button if on listings page
  const createListingBtn = document.getElementById('create-listing-btn');
  if (createListingBtn) {
    createListingBtn.classList.remove('hidden');
    createListingBtn.classList.add('flex');
  }

  // Redirect to login page if on restricted pages but no valid auth
  const restrictedPages = ['profile.html'];
  const currentPage = window.location.pathname.split('/').pop();

  if (restrictedPages.includes(currentPage) && (!getToken() || !getUser())) {
    window.location.href =
      'login.html?redirect=' + encodeURIComponent(currentPage);
  }
}

/**
 * Update UI for logged out user
 */
function updateUIForLoggedOutUser() {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const mobileMenu = document.getElementById('mobile-menu');

  if (authButtons) {
    authButtons.classList.remove('hidden');
  }

  if (userMenu) {
    userMenu.classList.add('hidden');
  }

  if (mobileMenu) {
    // Ensure login/register links are in mobile menu
    const authLinks = mobileMenu.querySelector('.border-t');
    if (!authLinks) {
      const authDiv = document.createElement('div');
      authDiv.className = 'pt-2 border-t';
      authDiv.innerHTML = `
        <a href="login.html" class="block py-2 text-gray-700">Login</a>
        <a href="register.html" class="block py-2 text-gray-700">Register</a>
      `;
      mobileMenu.appendChild(authDiv);
    }
  }

  // Hide create listing button
  const createListingBtn = document.getElementById('create-listing-btn');
  if (createListingBtn) {
    createListingBtn.classList.add('hidden');
    createListingBtn.classList.remove('flex');
  }

  // Redirect to login page if on restricted pages
  const restrictedPages = ['profile.html'];
  const currentPage = window.location.pathname.split('/').pop();

  if (restrictedPages.includes(currentPage)) {
    window.location.href =
      'login.html?redirect=' + encodeURIComponent(currentPage);
  }
}

/**
 * Set up logout handler
 */
function setupLogoutHandler() {
  const logoutButton = document.getElementById('logout-button');

  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise} Promise resolving to the API response
 */
async function register(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auction/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Log in a user
 * @param {Object} credentials - User login credentials
 * @returns {Promise} Promise resolving to the API response
 */
async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/auction/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.message || 'Login failed');
    }

    // Save token and user data
    saveToken(data.accessToken);
    saveUser(data);

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Log out the current user
 */
function logout() {
  // Clear stored data
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Update UI
  updateUIForLoggedOutUser();

  // Redirect to home page
  window.location.href = window.location.pathname.includes('/pages/')
    ? '../index.html'
    : 'index.html';
}

/**
 * Save authentication token to localStorage
 * @param {string} token - The authentication token
 */
function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get authentication token from localStorage
 * @returns {string|null} The authentication token or null
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Save user data to localStorage
 * @param {Object} user - The user object
 */
function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get user data from localStorage
 * @returns {Object|null} The user object or null
 */
function getUser() {
  const userJSON = localStorage.getItem(USER_KEY);
  return userJSON ? JSON.parse(userJSON) : null;
}

/**
 * Update user data in localStorage
 * @param {Object} userData - The updated user data
 */
function updateUser(userData) {
  const currentUser = getUser();
  if (currentUser) {
    const updatedUser = { ...currentUser, ...userData };
    saveUser(updatedUser);
    updateUIForLoggedInUser(updatedUser);
  }
}

/**
 * Make authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Promise resolving to the API response
 */
async function authFetch(endpoint, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error('Authentication token is missing');
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized by logging out
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }

      throw new Error(data.errors?.[0]?.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Set up user dropdown toggle functionality
 */
function setupUserDropdown() {
  const userMenuButton = document.getElementById('user-menu-button');
  const userDropdown = document.getElementById('user-dropdown');

  if (userMenuButton && userDropdown) {
    userMenuButton.addEventListener('click', () => {
      userDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (
        !userMenuButton.contains(e.target) &&
        !userDropdown.contains(e.target)
      ) {
        userDropdown.classList.add('hidden');
      }
    });
  }
}

/**
 * Set up mobile menu toggle functionality
 */
function setupMobileMenu() {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuButton && mobileMenu) {
    // Toggle mobile menu on button click
    mobileMenuButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (
        !mobileMenuButton.contains(e.target) &&
        !mobileMenu.contains(e.target)
      ) {
        mobileMenu.classList.add('hidden');
      }
    });

    // Close mobile menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}
