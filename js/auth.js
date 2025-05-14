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

// Fetch and render featured listings on the homepage
async function renderFeaturedListings() {
  const container = document.getElementById('featured-listings');
  if (!container) return;
  try {
    const response = await fetch(
      `${API_BASE_URL}/auction/listings?_seller=true&_active=true&limit=3`,
      {
        headers: {
          'X-Noroff-API-Key': 'aa2b815e-2edb-4047-8ddd-2503d905bff6',
        },
      }
    );
    console.log('Featured listings API response:', response);
    const data = await response.json();
    console.log('Featured listings parsed data:', data);
    const listings = data.data || [];
    console.log('Listings array:', listings);
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
    console.error('Error loading featured listings:', error);
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
  document.addEventListener('DOMContentLoaded', renderFeaturedListings);
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
};
