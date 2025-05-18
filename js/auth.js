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
  const mobileAuth = document.getElementById('mobile-auth');
  const userAvatar = document.getElementById('user-avatar');
  const userCredits = document.getElementById('user-credits');
  const userName = document.getElementById('user-name');
  const mobileCredits = document.getElementById('mobile-credits');

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

  if (mobileAuth) mobileAuth.classList.remove('hidden');
  if (mobileCredits) {
    mobileCredits.textContent = `${currentUser?.credits || 0} credits`;
    mobileCredits.classList.remove('hidden');
  }
}

function updateUIForGuest() {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const mobileAuth = document.getElementById('mobile-auth');
  const mobileCredits = document.getElementById('mobile-credits');

  // Show auth buttons
  if (authButtons) {
    authButtons.classList.remove('hidden');
  }

  // Hide user menu
  if (userMenu) {
    userMenu.classList.add('hidden');
  }

  if (mobileAuth) mobileAuth.classList.add('hidden');
  if (mobileCredits) mobileCredits.classList.add('hidden');
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
    userMenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded =
        userMenuButton.getAttribute('aria-expanded') === 'true';
      userMenuButton.setAttribute('aria-expanded', !isExpanded);
      userDropdown.classList.toggle('hidden');
    });

    // Add keyboard support
    userMenuButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        userMenuButton.click();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (
        !userMenuButton.contains(e.target) &&
        !userDropdown.contains(e.target)
      ) {
        userMenuButton.setAttribute('aria-expanded', 'false');
        userDropdown.classList.add('hidden');
      }
    });

    // Trap focus in dropdown when open
    userDropdown.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        userMenuButton.setAttribute('aria-expanded', 'false');
        userDropdown.classList.add('hidden');
        userMenuButton.focus();
      }
    });
  }
});

function getUser() {
  return JSON.parse(localStorage.getItem('user'));
}

function getToken() {
  return localStorage.getItem('token');
}

// Add a function to update credits across all pages
function updateCreditsDisplay(credits) {
  const userCredits = document.getElementById('user-credits');
  const mobileCredits = document.getElementById('mobile-credits');

  if (userCredits) {
    userCredits.textContent = `${credits} credits`;
  }
  if (mobileCredits) {
    mobileCredits.textContent = `${credits} credits`;
  }
}

// Update the updateUser function to also update the UI
function updateUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
  currentUser = user;
  if (user.credits !== undefined) {
    updateCreditsDisplay(user.credits);
  }
}

async function authFetch(endpoint, options = {}) {
  const token = getToken();
  const base = API_BASE_URL;
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Noroff-API-Key': '7ae55a4b-8609-40fa-a8f6-a4967319e591',
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.errors?.[0]?.message || response.statusText);
  }
  return response.json();
}

// Fetch and render featured listings on the homepage
async function fetchFeaturedListings() {
  const container = document.getElementById('featured-listings');
  if (!container) return;
  try {
    const response = await fetch(
      `${API_BASE_URL}/auction/listings?_seller=true&_active=true&limit=3`,
      {
        headers: {
          'X-Noroff-API-Key': '7ae55a4b-8609-40fa-a8f6-a4967319e591',
        },
      }
    );
    const data = await response.json();
    const listings = data.data || [];
    container.innerHTML = '';
    listings.slice(0, 3).forEach((listing) => {
      const card = document.createElement('div');
      card.className =
        'bg-white rounded-lg shadow-md overflow-hidden flex flex-col cursor-pointer transition hover:shadow-lg';
      const imageUrl =
        listing.media && listing.media.length > 0 && listing.media[0].url
          ? listing.media[0].url
          : 'https://via.placeholder.com/400x250?text=No+Image';
      card.innerHTML = `
        <a href="pages/listing-details.html?id=${
          listing.id
        }" class="block h-full">
          <img src="${imageUrl}" alt="${
        listing.title
      }" class="w-full h-48 object-cover">
          <div class="p-4 flex flex-col flex-grow">
            <h3 class="font-semibold text-lg mb-2 line-clamp-1">${
              listing.title
            }</h3>
            <p class="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">${
              listing.description || 'No description provided.'
            }</p>
            <div class="flex items-center mt-auto">
              <img src="${
                listing.seller?.avatar?.url || 'assets/default-avatar.png'
              }" alt="${
        listing.seller?.name || 'User'
      }" class="w-8 h-8 rounded-full mr-2">
              <span class="text-gray-700 text-sm">${
                listing.seller?.name || 'Unknown'
              }</span>
            </div>
          </div>
        </a>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML =
      '<div class="text-red-600">Failed to load featured listings.</div>';
  }
}

// Only run featured listings on homepage
if (
  window.location.pathname.endsWith('index.html') ||
  window.location.pathname === '/' ||
  window.location.pathname === '/index.html'
) {
  document.addEventListener('DOMContentLoaded', fetchFeaturedListings);
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
  updateUIForAuth,
  updateCreditsDisplay,
};
