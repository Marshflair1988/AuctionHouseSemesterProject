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
  });
  
  /**
   * Initialize the profile page with user data
   */
  async function initializeProfile() {
    try {
      // Get user profile data
      const user = getUser();
  
      if (!user) {
        throw new Error('User data not found');
      }
  
      // Show loading state
      document.getElementById('profile-loading').classList.remove('hidden');
      document.getElementById('profile-content').classList.add('hidden');
  
      // Fetch updated user data from API
      const userData = await authFetch(`/auction/profiles/${user.name}`);
  
      // Update stored user data with latest from API
      updateUser({
        ...user,
        avatar: userData.avatar,
        banner: userData.banner,
        credits: userData.credits,
      });
  
      // Display user profile information
      displayUserProfile(userData);
  
      // Fetch user's listings and bids
      fetchUserListings();
      fetchUserBids();
  
      // Hide loading, show content
      document.getElementById('profile-loading').classList.add('hidden');
      document.getElementById('profile-content').classList.remove('hidden');
    } catch (error) {
      console.error('Error initializing profile:', error);
      showError(error.message || 'Failed to load profile data');
    }
  }
  
  /**
   * Display user profile information
   * @param {Object} userData - The user profile data
   */
  function displayUserProfile(userData) {
    // Profile name and email
    document.getElementById('profile-name').textContent = userData.name;
    document.getElementById('profile-email').textContent = userData.email;
  
    // Credits
    document.getElementById('profile-credits').textContent = `$${
      userData.credits || 0
    }`;
  
    // Member since date
    const createdDate = new Date(userData.created);
    document.getElementById('member-since').textContent =
      createdDate.toLocaleDateString();
  
    // Avatar
    const profileAvatar = document.getElementById('profile-avatar');
    if (userData.avatar) {
      profileAvatar.src = userData.avatar;
      profileAvatar.onerror = () => {
        profileAvatar.src = '../assets/default-avatar.png';
      };
    }
  
    // Banner
    const bannerImage = document.getElementById('banner-image');
    if (userData.banner) {
      bannerImage.src = userData.banner;
      bannerImage.onerror = () => {
        bannerImage.src = ''; // Use default background color
      };
    }
  
    // Pre-fill form fields
    document.getElementById('avatar').value = userData.avatar || '';
    document.getElementById('banner').value = userData.banner || '';
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
        if (avatar) updateData.avatar = avatar;
        if (banner) updateData.banner = banner;
  
        try {
          // Disable form during submission
          toggleFormState(profileForm, true);
  
          // Get current user
          const user = getUser();
  
          // Update profile
          const response = await authFetch(
            `/auction/profiles/${user.name}/media`,
            {
              method: 'PUT',
              body: JSON.stringify(updateData),
            }
          );
  
          // Update local user data
          updateUser({
            ...user,
            ...updateData,
          });
  
          // Update displayed profile
          displayUserProfile({
            ...user,
            ...response,
          });
  
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
              fetchUserListings();
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
   * Fetch the user's listings
   */
  async function fetchUserListings() {
    const container = document.getElementById('my-listings-container');
  
    if (!container) return;
  
    // Show loading state
    container.innerHTML = `
          <div class="text-center py-8 text-gray-500">
              <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
              <p>Loading your listings...</p>
          </div>
      `;
  
    try {
      const user = getUser();
  
      if (!user) {
        throw new Error('User data not found');
      }
  
      // Fetch user's listings
      const listings = await authFetch(
        `/auction/profiles/${user.name}/listings?_bids=true`
      );
  
      // Display listings
      container.innerHTML = '';
  
      if (listings && listings.length > 0) {
        listings.forEach((listing) => {
          container.appendChild(createUserListingItem(listing));
        });
      } else {
        container.innerHTML = `
                  <div class="text-center py-6 text-gray-500">
                      <p>You haven't created any listings yet.</p>
                      <button id="create-first-listing" class="mt-2 text-indigo-600 hover:underline">Create your first listing</button>
                  </div>
              `;
  
        // Add event listener to the "Create your first listing" button
        const createFirstListingBtn = document.getElementById(
          'create-first-listing'
        );
        if (createFirstListingBtn) {
          createFirstListingBtn.addEventListener('click', () => {
            document.getElementById('create-listing-btn').click();
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user listings:', error);
      container.innerHTML = `
              <div class="text-center py-6 text-red-500">
                  <p>Failed to load your listings. Please try again later.</p>
              </div>
          `;
    }
  }
  
  /**
   * Fetch the user's bids
   */
  async function fetchUserBids() {
    const container = document.getElementById('my-bids-container');
  
    if (!container) return;
  
    // Show loading state
    container.innerHTML = `
          <div class="text-center py-8 text-gray-500">
              <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
              <p>Loading your bids...</p>
          </div>
      `;
  
    try {
      const user = getUser();
  
      if (!user) {
        throw new Error('User data not found');
      }
  
      // Fetch user's bids
      const bids = await authFetch(
        `/auction/profiles/${user.name}/bids?_listings=true`
      );
  
      // Display bids
      container.innerHTML = '';
  
      if (bids && bids.length > 0) {
        bids.forEach((bid) => {
          container.appendChild(createUserBidItem(bid));
        });
      } else {
        container.innerHTML = `
                  <div class="text-center py-6 text-gray-500">
                      <p>You haven't placed any bids yet.</p>
                      <a href="listings.html" class="mt-2 text-indigo-600 hover:underline">Browse listings</a>
                  </div>
              `;
      }
    } catch (error) {
      console.error('Error fetching user bids:', error);
      container.innerHTML = `
              <div class="text-center py-6 text-red-500">
                  <p>Failed to load your bids. Please try again later.</p>
              </div>
          `;
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
    const imageUrl =
      listing.media && listing.media.length > 0
        ? listing.media[0]
        : 'https://via.placeholder.com/150x100?text=No+Image';
  
    // Format end date
    const endsAt = new Date(listing.endsAt);
    const now = new Date();
    const isActive = now < endsAt;
    const timeLeft = getTimeLeft(now, endsAt);
  
    // Format bid information
    const bidCount = listing._count?.bids || 0;
    const highestBid =
      bidCount > 0 ? Math.max(...listing.bids.map((bid) => bid.amount)) : 0;
  
    item.innerHTML = `
          <div class="flex flex-col sm:flex-row">
              <div class="sm:w-1/4 mb-2 sm:mb-0 sm:mr-4">
                  <div class="aspect-w-16 aspect-h-9">
                      <img src="${imageUrl}" alt="${
      listing.title
    }" class="object-cover rounded" onerror="this.src='https://via.placeholder.com/150x100?text=Image+Error'">
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
    const imageUrl =
      bid.listing.media && bid.listing.media.length > 0
        ? bid.listing.media[0]
        : 'https://via.placeholder.com/150x100?text=No+Image';
  
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
                  <div class="aspect-w-16 aspect-h-9">
                      <img src="${imageUrl}" alt="${
      bid.listing.title
    }" class="object-cover rounded" onerror="this.src='https://via.placeholder.com/150x100?text=Image+Error'">
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
  