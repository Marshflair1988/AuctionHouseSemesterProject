import { API_BASE_URL, isAuthenticated, currentUser } from './auth.js';

// DOM Elements
const profileContent = document.getElementById('profile-content');
const profileLoading = document.getElementById('profile-loading');
const updateProfileForm = document.getElementById('update-profile-form');
const avatarInput = document.getElementById('avatar');
const bannerInput = document.getElementById('banner');
const userAvatar = document.getElementById('user-avatar');
const userBanner = document.getElementById('user-banner');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userCredits = document.getElementById('user-credits');
const userBio = document.getElementById('user-bio');
const userListings = document.getElementById('user-listings');
const userBids = document.getElementById('user-bids');

// Fetch user profile
async function fetchUserProfile() {
  if (!isAuthenticated) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/auction/profiles/${currentUser.name}?_listings=true&_bids=true`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      displayProfile(data.data);
    } else {
      throw new Error(data.errors?.[0]?.message || 'Failed to fetch profile');
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    showError(error.message);
  }
}

// Display profile
function displayProfile(profile) {
  if (profileLoading) profileLoading.classList.add('hidden');
  if (profileContent) profileContent.classList.remove('hidden');

  // Set user info
  if (userName) userName.textContent = profile.name;
  if (userEmail) userEmail.textContent = profile.email;
  if (userCredits) userCredits.textContent = `${profile.credits || 0} credits`;
  if (userBio) userBio.textContent = profile.bio || 'No bio yet';

  // Set avatar and banner
  if (userAvatar) {
    userAvatar.src = profile.avatar?.url || '../assets/default-avatar.png';
  }
  if (userBanner) {
    userBanner.src = profile.banner?.url || '../assets/default-banner.jpg';
  }

  // Pre-fill form
  if (updateProfileForm) {
    if (avatarInput) avatarInput.value = profile.avatar?.url || '';
    if (bannerInput) bannerInput.value = profile.banner?.url || '';
  }

  // Display listings
  displayListings(profile.listings || []);

  // Display bids
  displayBids(profile.bids || []);
}

// Display listings
function displayListings(listings) {
  if (!userListings) return;

  if (listings.length === 0) {
    userListings.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No listings yet</p>
            </div>
        `;
    return;
  }

  userListings.innerHTML = listings
    .map(
      (listing) => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <a href="listing-details.html?id=${listing.id}" class="block">
                <div class="relative aspect-w-16 aspect-h-9">
                    <img 
                        src="${
                          listing.media?.[0]?.url || '../assets/placeholder.jpg'
                        }" 
                        alt="${listing.media?.[0]?.alt || listing.title}"
                        class="object-cover w-full h-full"
                    />
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-semibold mb-2">${listing.title}</h3>
                    <p class="text-gray-600 text-sm mb-2 line-clamp-2">${
                      listing.description || ''
                    }</p>
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">
                            ${listing._count.bids} bids
                        </div>
                        <div class="text-indigo-600 font-medium">
                            ${listing.bids?.[0]?.amount || 0} credits
                        </div>
                    </div>
                </div>
            </a>
        </div>
    `
    )
    .join('');
}

// Display bids
function displayBids(bids) {
  if (!userBids) return;

  if (bids.length === 0) {
    userBids.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No bids yet</p>
            </div>
        `;
    return;
  }

  userBids.innerHTML = bids
    .map(
      (bid) => `
        <div class="bg-white rounded-lg shadow-md p-4">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold">${bid.listing.title}</h3>
                    <p class="text-sm text-gray-500">
                        Bid placed: ${new Date(bid.created).toLocaleString()}
                    </p>
                </div>
                <div class="text-indigo-600 font-medium">
                    ${bid.amount} credits
                </div>
            </div>
            <div class="mt-2">
                <a 
                    href="listing-details.html?id=${bid.listing.id}"
                    class="text-indigo-600 hover:underline text-sm"
                >
                    View listing
                </a>
            </div>
        </div>
    `
    )
    .join('');
}

// Update profile
async function updateProfile(formData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/auction/profiles/${currentUser.name}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Update local storage
      const updatedUser = { ...currentUser, ...data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Refresh profile
      fetchUserProfile();
      return true;
    } else {
      throw new Error(data.errors?.[0]?.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

// Show error
function showError(message) {
  if (profileLoading) profileLoading.classList.add('hidden');
  if (profileContent) {
    profileContent.innerHTML = `
            <div class="text-center py-12">
                <div class="bg-red-100 text-red-700 p-6 rounded-lg mb-4">
                    <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">Error</h2>
                    <p>${message}</p>
                </div>
            </div>
        `;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchUserProfile();

  // Update profile form
  if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        bio: document.getElementById('bio').value,
      };

      // Add avatar if provided
      const avatarUrl = avatarInput.value.trim();
      if (avatarUrl) {
        formData.avatar = {
          url: avatarUrl,
          alt: `${currentUser.name}'s avatar`,
        };
      }

      // Add banner if provided
      const bannerUrl = bannerInput.value.trim();
      if (bannerUrl) {
        formData.banner = {
          url: bannerUrl,
          alt: `${currentUser.name}'s banner`,
        };
      }

      const success = await updateProfile(formData);
      if (success) {
        alert('Profile updated successfully!');
      }
    });
  }
});
