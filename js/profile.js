import {
  getUser,
  getToken,
  updateUser,
  authFetch,
  updateUIForAuth,
} from './auth.js';

/**
 * Profile management functionality for BidHive Auction House
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    // Redirect to login page if not logged in
    window.location.href = 'login.html?redirect=profile.html';
    return;
  }

  // Initialize profile page
  initializeProfile();

  // Set up profile form
  setupProfileForm();

  // Set up create listing button and modal
  setupCreateListingModal();

  // Set up edit bio modal
  setupEditBioModal();
});

/**
 * Initialize the profile page with user data
 */
async function initializeProfile() {
  try {
    // Get user profile data (with listings and bids)
    const user = getUser();
    if (!user) throw new Error('User data not found');

    document.getElementById('profile-loading').classList.remove('hidden');
    document.getElementById('profile-content').classList.add('hidden');

    // Fetch updated user data from API (with listings and bids)
    const userResponse = await authFetch(
      `/auction/profiles/${user.name}?_listings=true&_bids=true`
    );
    const userData = userResponse.data;

    console.log('API bids array:', userData.bids);

    // Fetch each listing with its bids
    if (userData.listings && userData.listings.length > 0) {
      userData.listings = await Promise.all(
        userData.listings.map((listing) =>
          authFetch(`/auction/listings/${listing.id}?_bids=true`).then(
            (res) => res.data
          )
        )
      );
    }

    // Update stored user data with latest from API
    updateUser({
      ...user,
      avatar: userData.avatar,
      banner: userData.banner,
      credits: userData.credits,
    });
    updateUIForAuth();

    // Display user profile information
    displayUserProfile(userData);

    // Display user's listings
    displayUserListings(userData.listings || []);

    // --- Begin workaround for My Bids ---
    const myBidsContainer = document.getElementById('my-bids-container');
    if (myBidsContainer) {
      myBidsContainer.innerHTML = `<div class="text-center py-8 text-gray-500">Loading your bids...</div>`;
    }
    let allBids = [];
    try {
      // Fetch all listings (could be paginated for large datasets)
      let page = 1;
      let hasMore = true;
      const myName = user.name;
      while (hasMore) {
        const listingsResp = await authFetch(
          `/auction/listings?_bids=true&limit=100&page=${page}`
        );
        const listings = listingsResp.data || [];
        // For each listing, collect bids by this user
        listings.forEach((listing) => {
          if (listing.bids && listing.bids.length) {
            listing.bids.forEach((bid) => {
              if (bid.bidder && bid.bidder.name === myName) {
                allBids.push({ ...bid, listing });
              }
            });
          }
        });
        // Check if there are more pages
        hasMore = listings.length === 100;
        page++;
      }
    } catch (e) {
      console.error('Error fetching all listings for my bids:', e);
    }
    displayUserBids(allBids);
    // --- End workaround for My Bids ---

    document.getElementById('profile-loading').classList.add('hidden');
    document.getElementById('profile-content').classList.remove('hidden');
  } catch (error) {
    console.error('Error initializing profile:', error);
    showProfileError(error.message || 'Failed to load profile data');
  }
}

/**
 * Display user profile information
 * @param {Object} userData - The user profile data
 */
function displayUserProfile(userData) {
  console.log('Displaying user profile:', userData);
  document.getElementById('profile-name').textContent = userData.name;
  document.getElementById('profile-email').textContent = userData.email;
  document.getElementById('profile-credits').textContent = `${
    userData.credits || 0
  }`;

  // Insert bio under credits
  let bioElem = document.getElementById('profile-bio');
  if (!bioElem) {
    bioElem = document.createElement('div');
    bioElem.id = 'profile-bio';
    bioElem.className = 'text-gray-700 mt-2';
    const creditsElem = document.getElementById('profile-credits');
    if (creditsElem && creditsElem.parentNode) {
      creditsElem.parentNode.insertBefore(bioElem, creditsElem.nextSibling);
    }
  }
  bioElem.textContent = userData.bio || '';

  // Avatar
  const profileAvatar = document.getElementById('profile-avatar');
  if (userData.avatar && userData.avatar.url) {
    profileAvatar.src = userData.avatar.url;
    profileAvatar.alt = userData.avatar.alt || `${userData.name}'s avatar`;
    profileAvatar.onerror = () => {
      profileAvatar.src = '../assets/default-avatar.png';
    };
  } else {
    profileAvatar.src = '../assets/default-avatar.png';
    profileAvatar.alt = 'Default avatar';
  }

  // Banner
  const bannerImage = document.getElementById('banner-image');
  console.log('Banner object for rendering:', userData.banner);
  if (userData.banner && userData.banner.url) {
    bannerImage.src = userData.banner.url;
    bannerImage.alt = userData.banner.alt || `${userData.name}'s banner`;
    bannerImage.onerror = () => {
      bannerImage.src = '';
    };
  } else {
    bannerImage.src = '';
    bannerImage.alt = 'No banner';
  }

  // Pre-fill form fields
  document.getElementById('avatar').value = userData.avatar?.url || '';
  document.getElementById('banner').value = userData.banner?.url || '';
}

/**
 * Display user's listings
 * @param {Array} listings
 */
function displayUserListings(listings) {
  const container = document.getElementById('my-listings-container');
  if (!container) return;
  container.innerHTML = '';
  if (listings.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-gray-500">You haven't created any listings yet.</div>`;
    return;
  }
  listings.forEach((listing) => {
    container.appendChild(createUserListingItem(listing));
  });
}

/**
 * Display user's bids
 * @param {Array} bids
 */
function displayUserBids(bids) {
  const container = document.getElementById('my-bids-container');
  if (!container) return;
  container.innerHTML = '';
  if (bids.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-gray-500">You haven't placed any bids yet.</div>`;
    return;
  }
  bids.forEach((bid) => {
    container.appendChild(createUserBidItem(bid));
  });
}

/**
 * Set up profile update form
 */
function setupProfileForm() {
  const profileForm = document.getElementById('profile-form');
  const errorMessage = document.getElementById('profile-error');
  const successMessage = document.getElementById('profile-success');

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Hide messages
      errorMessage.classList.add('hidden');
      successMessage.classList.add('hidden');

      // Get form values
      const avatar = document.getElementById('avatar').value.trim();
      const banner = document.getElementById('banner').value.trim();

      // Validate URLs if provided
      if (avatar && !isValidUrl(avatar)) {
        showProfileError('Please enter a valid URL for the avatar');
        return;
      }

      if (banner && !isValidUrl(banner)) {
        showProfileError('Please enter a valid URL for the banner');
        return;
      }

      // Prepare update data
      const updateData = {};
      if (avatar) updateData.avatarUrl = avatar;
      if (banner) updateData.bannerUrl = banner;

      try {
        // Disable form during submission
        toggleFormState(profileForm, true);

        // Update profile using the correct function
        await updateProfileMedia(updateData);

        // Show success message
        showProfileSuccess('Profile updated successfully!');

        // Re-enable form
        toggleFormState(profileForm, false);
      } catch (error) {
        showProfileError(error.message || 'Failed to update profile');
        toggleFormState(profileForm, false);
      }
    });
  }
}

/**
 * Set up create listing modal
 */
function setupCreateListingModal() {
  const createListingBtn = document.getElementById('create-listing-btn');
  const listingModal = document.getElementById('listing-modal');
  const closeModal = document.getElementById('close-modal');
  const createListingForm = document.getElementById('create-listing-form');

  if (createListingBtn && listingModal) {
    // Open modal on button click
    createListingBtn.addEventListener('click', () => {
      // Set default end date to 7 days from now
      const endsAtInput = document.getElementById('ends-at');
      if (endsAtInput) {
        const defaultEndDate = new Date();
        defaultEndDate.setDate(defaultEndDate.getDate() + 7);

        // Format for datetime-local input
        const formattedDate = defaultEndDate.toISOString().slice(0, 16);
        endsAtInput.value = formattedDate;
      }

      listingModal.classList.remove('hidden');
    });

    // Close modal on close button click
    if (closeModal) {
      closeModal.addEventListener('click', () => {
        listingModal.classList.add('hidden');
      });
    }

    // Close modal when clicking outside
    listingModal.addEventListener('click', (e) => {
      if (e.target === listingModal) {
        listingModal.classList.add('hidden');
      }
    });

    // Handle form submission
    if (createListingForm) {
      createListingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!getToken()) {
          showModalError('You must be logged in to create a listing');
          return;
        }

        // Get form values
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const tagsInput = document.getElementById('tags').value.trim();
        const mediaInput = document.getElementById('media').value.trim();
        const endsAt = document.getElementById('ends-at').value;

        // Validate inputs
        if (!title || !description || !endsAt) {
          showModalError('Please fill in all required fields');
          return;
        }

        // Process tags (comma-separated)
        const tags = tagsInput
          ? tagsInput.split(',').map((tag) => tag.trim())
          : [];

        // Process media (one URL per line)
        const media = mediaInput
          ? mediaInput
              .split('\n')
              .map((url) => url.trim())
              .filter((url) => url)
              .map((url) => ({ url }))
          : [];

        // Create listing data
        const listingData = {
          title,
          description,
          endsAt: new Date(endsAt).toISOString(),
          tags,
          media,
        };

        try {
          // Disable form during submission
          toggleFormState(createListingForm, true);

          // Create listing
          await authFetch('/auction/listings', {
            method: 'POST',
            body: JSON.stringify(listingData),
          });

          // Show success message
          showModalSuccess('Listing created successfully!');

          // Reset form and refresh listings after a delay
          setTimeout(() => {
            createListingForm.reset();
            listingModal.classList.add('hidden');
            initializeProfile();
          }, 1500);
        } catch (error) {
          showModalError(
            error.message || 'Failed to create listing. Please try again.'
          );
          toggleFormState(createListingForm, false);
        }
      });
    }
  }
}

/**
 * Create a user listing item element
 * @param {Object} listing - The listing data
 * @returns {HTMLElement} The listing item element
 */
function createUserListingItem(listing) {
  const item = document.createElement('div');
  item.className = 'py-4';

  // Get the main image or use placeholder
  let imageUrl = 'https://via.placeholder.com/150x100?text=No+Image';
  if (listing.media && listing.media.length > 0 && listing.media[0].url) {
    imageUrl = listing.media[0].url;
  }

  // Format end date
  const endsAt = new Date(listing.endsAt);
  const now = new Date();
  const isActive = now < endsAt;
  const timeLeft = getTimeLeft(now, endsAt);

  // Debug logs
  console.log('Listing:', listing);
  console.log('Listing ID:', listing.id);
  console.log('Listing bids:', listing.bids);
  console.log('Listing _count:', listing._count);

  // Format bid information
  const bidCount = listing.bids ? listing.bids.length : 0;
  console.log('Calculated bidCount:', bidCount);
  const highestBid =
    bidCount > 0
      ? Math.max(...(listing.bids || []).map((bid) => bid.amount))
      : 0;
  console.log('Calculated highestBid:', highestBid);

  item.innerHTML = `
        <div class="flex flex-col sm:flex-row">
            <div class="sm:w-1/4 mb-2 sm:mb-0 sm:mr-4">
                <div>
                    <img src="${imageUrl}" alt="${
    listing.title
  }" class="w-32 h-20 object-cover rounded" onerror="this.src='https://via.placeholder.com/150x100?text=Image+Error'">
                </div>
            </div>
            <div class="flex-grow">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-medium text-lg">${listing.title}</h3>
                    <span class="ml-2 px-2 py-1 text-xs rounded ${
                      isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }">${isActive ? 'Active' : 'Ended'}</span>
                </div>
                    <p class="text-gray-600 text-sm mb-2 line-clamp-2">${
                      listing.description || 'No description provided.'
                    }</p>
                <div class="flex flex-wrap items-center text-sm text-gray-600">
                    <div class="mr-4">
                        <i class="far fa-clock mr-1"></i>
                        <span class="${
                          isActive ? 'text-gray-600' : 'text-red-500'
                        }">${timeLeft}</span>
                        </div>
                    <div class="mr-4">
                        <i class="fas fa-gavel mr-1"></i>
                        <span>${bidCount} bid${bidCount !== 1 ? 's' : ''}</span>
                        </div>
                    <div>
                        <i class="fas fa-money-bill-wave mr-1"></i>
                        <span>${
                          highestBid > 0 ? '$' + highestBid : 'No bids'
                        }</span>
                    </div>
                </div>
                <div class="mt-3">
                    <a href="listing-details.html?id=${
                      listing.id
                    }" class="text-indigo-600 hover:underline text-sm">View Details →</a>
                </div>
            </div>
        </div>
    `;

  return item;
}

/**
 * Create a user bid item element
 * @param {Object} bid - The bid data
 * @returns {HTMLElement} The bid item element
 */
function createUserBidItem(bid) {
  const item = document.createElement('div');
  item.className = 'py-4';

  // Check if listing exists
  if (!bid.listing) {
    item.innerHTML = `
            <div class="p-4 bg-gray-100 rounded">
                <p class="text-gray-500">This bid is for a listing that no longer exists.</p>
            </div>
        `;
    return item;
  }

  // Get the main image or use placeholder
  let imageUrl = 'https://via.placeholder.com/150x100?text=No+Image';
  let imageAlt = bid.listing.title;
  if (bid.listing.media && bid.listing.media.length > 0) {
    if (typeof bid.listing.media[0] === 'string') {
      imageUrl = bid.listing.media[0];
    } else if (bid.listing.media[0].url) {
      imageUrl = bid.listing.media[0].url;
      imageAlt = bid.listing.media[0].alt || bid.listing.title;
    }
  }

  // Format bid date
  const bidDate = new Date(bid.created);
  const formattedBidDate =
    bidDate.toLocaleDateString() +
    ' ' +
    bidDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Format end date and status
  const endsAt = new Date(bid.listing.endsAt);
  const now = new Date();
  const isActive = now < endsAt;

  item.innerHTML = `
        <div class="flex flex-col sm:flex-row">
            <div class="sm:w-1/4 mb-2 sm:mb-0 sm:mr-4">
                <div>
                    <img src="${imageUrl}" alt="${imageAlt}" class="w-32 h-20 object-cover rounded" onerror="this.src='https://via.placeholder.com/150x100?text=Image+Error'">
                </div>
            </div>
            <div class="flex-grow">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-medium text-lg">${bid.listing.title}</h3>
                    <span class="ml-2 px-2 py-1 text-xs rounded ${
                      isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }">${isActive ? 'Active' : 'Ended'}</span>
                </div>
                <div class="flex justify-between items-center mb-2">
                    <div class="text-indigo-600 font-medium">Your bid: $${
                      bid.amount
                    }</div>
                    <div class="text-sm text-gray-500">${formattedBidDate}</div>
                </div>
                <div class="mt-3">
                    <a href="listing-details.html?id=${
                      bid.listing.id
                    }" class="text-indigo-600 hover:underline text-sm">View Listing →</a>
                </div>
            </div>
        </div>
    `;

  return item;
}

/**
 * Calculate and format time left for auction
 * @param {Date} now - Current date
 * @param {Date} end - End date
 * @returns {string} Formatted time left
 */
function getTimeLeft(now, end) {
  if (now > end) {
    return 'Ended';
  }

  const diff = end - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h left`;
  } else if (hours > 0) {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (minutes > 0) {
      return `${minutes}m left`;
    } else {
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `${seconds}s left`;
    }
  }
}

/**
 * Display a profile error message
 * @param {string} message - The error message
 */
function showProfileError(message) {
  const errorMessage = document.getElementById('profile-error');
  const successMessage = document.getElementById('profile-success');

  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');

    if (successMessage) {
      successMessage.classList.add('hidden');
    }
  }
}

/**
 * Display a profile success message
 * @param {string} message - The success message
 */
function showProfileSuccess(message) {
  const errorMessage = document.getElementById('profile-error');
  const successMessage = document.getElementById('profile-success');

  if (successMessage) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');

    if (errorMessage) {
      errorMessage.classList.add('hidden');
    }
  }
}

/**
 * Display a modal error message
 * @param {string} message - The error message
 */
function showModalError(message) {
  const errorMessage = document.getElementById('modal-error');
  const successMessage = document.getElementById('modal-success');

  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');

    if (successMessage) {
      successMessage.classList.add('hidden');
    }
  }
}

/**
 * Display a modal success message
 * @param {string} message - The success message
 */
function showModalSuccess(message) {
  const errorMessage = document.getElementById('modal-error');
  const successMessage = document.getElementById('modal-success');

  if (successMessage) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');

    if (errorMessage) {
      errorMessage.classList.add('hidden');
    }
  }
}

/**
 * Validate a URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Toggle the form's interactive state
 * @param {HTMLFormElement} form - The form element
 * @param {boolean} disabled - Whether to disable the form
 */
function toggleFormState(form, disabled) {
  // Disable/enable all form elements
  Array.from(form.elements).forEach((element) => {
    element.disabled = disabled;
  });

  // Change the submit button text
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    if (disabled) {
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    } else {
      // Set appropriate button text based on form ID
      if (form.id === 'profile-form') {
        submitButton.innerHTML = 'Update Profile';
      } else if (form.id === 'create-listing-form') {
        submitButton.innerHTML = 'Create Listing';
      } else {
        submitButton.innerHTML = 'Submit';
      }
    }
  }
}

// Update profile banner, avatar, or bio
async function updateProfileMedia({ bannerUrl, avatarUrl, bio }) {
  const user = getUser();
  if (!user) return;
  const body = {};
  if (bannerUrl) {
    body.banner = { url: bannerUrl, alt: `${user.name}'s banner` };
  }
  if (avatarUrl) {
    body.avatar = { url: avatarUrl, alt: `${user.name}'s avatar` };
  }
  if (bio !== undefined) {
    body.bio = bio;
  }
  try {
    const response = await authFetch(`/auction/profiles/${user.name}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    console.log('Profile update response:', response);
    if (response.errors) {
      throw new Error(
        response.errors[0]?.message || 'Failed to update profile'
      );
    }
    // Refresh profile after update
    initializeProfile();
  } catch (error) {
    alert('Error updating profile: ' + error.message);
  }
}

/**
 * Set up edit bio modal
 */
function setupEditBioModal() {
  const editBioBtn = document.getElementById('edit-bio-btn');
  const editBioModal = document.getElementById('edit-bio-modal');
  const closeEditBioModal = document.getElementById('close-edit-bio-modal');
  const cancelBioBtn = document.getElementById('cancel-bio-btn');
  const saveBioBtn = document.getElementById('save-bio-btn');
  const editBioInput = document.getElementById('edit-bio-input');
  const bioElem = document.getElementById('profile-bio');

  if (
    !editBioBtn ||
    !editBioModal ||
    !closeEditBioModal ||
    !cancelBioBtn ||
    !saveBioBtn ||
    !editBioInput
  )
    return;

  // Open modal
  editBioBtn.addEventListener('click', () => {
    editBioInput.value = bioElem ? bioElem.textContent : '';
    editBioModal.classList.remove('hidden');
    editBioInput.focus();
  });

  // Close modal
  function closeModal() {
    editBioModal.classList.add('hidden');
  }
  closeEditBioModal.addEventListener('click', closeModal);
  cancelBioBtn.addEventListener('click', closeModal);

  // Save bio
  saveBioBtn.addEventListener('click', async () => {
    const newBio = editBioInput.value.trim();
    if (!newBio) {
      alert('Bio cannot be empty.');
      return;
    }
    try {
      await updateProfileMedia({ bio: newBio });
      closeModal();
    } catch (error) {
      alert('Failed to update bio: ' + (error.message || error));
    }
  });
}
