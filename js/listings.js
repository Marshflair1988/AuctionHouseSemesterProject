/**
 * Listings functionality for BidHive Auction House
 */

// Pagination state
let currentPage = 1;
const itemsPerPage = 12;
let totalPages = 0;
let currentListings = [];

// Filter state
let searchQuery = '';
let sortBy = 'created';
let sortOrder = 'desc';
let activeOnly = true;
let allListings = []; // Keep all listings in memory for client-side filtering
let searchUsers = []; // Store search results for users

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  setupSearch();
  setupCreateListingButton();
  fetchListings();
});

/**
 * Set up the filter controls
 */
function setupFilters() {
  const sortBySelect = document.getElementById('sort-by');
  const activeOnlySelect = document.getElementById('active-only');
  const searchInput = document.getElementById('search-input');

  if (sortBySelect) {
    sortBySelect.addEventListener('change', () => {
      const value = sortBySelect.value;

      if (value === 'created') {
        sortBy = 'created';
        sortOrder = 'desc';
      } else if (value === 'ending') {
        sortBy = 'endsAt';
        sortOrder = 'asc';
      } else if (value === 'bids') {
        sortBy = '_count.bids';
        sortOrder = 'desc';
      }

      // Reset search when changing filters
      if (searchInput && searchQuery) {
        searchInput.value = '';
        searchQuery = '';
      }

      // Reset to first page and fetch listings
      currentPage = 1;
      fetchListings();
    });
  }

  if (activeOnlySelect) {
    activeOnlySelect.addEventListener('change', () => {
      const value = activeOnlySelect.value;

      if (value === 'all') {
        activeOnly = null;
      } else if (value === 'active') {
        activeOnly = true;
      } else if (value === 'ended') {
        activeOnly = false;
      }

      // Reset search when changing filters
      if (searchInput && searchQuery) {
        searchInput.value = '';
        searchQuery = '';
      }

      // Reset to first page and fetch listings
      currentPage = 1;
      fetchListings();
    });
  }
}

/**
 * Set up the search functionality
 */
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');

  if (searchInput && searchButton) {
    // Search on button click
    searchButton.addEventListener('click', () => {
      searchQuery = searchInput.value.trim();
      console.log('Search button clicked with query:', searchQuery);
      currentPage = 1;
      fetchListings();
    });

    // Search on Enter key (keypress)
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission if inside a form
        searchQuery = searchInput.value.trim();
        console.log('Enter key pressed with query:', searchQuery);
        currentPage = 1;
        fetchListings();
      }
    });

    // Search on Enter key (keydown) - for browser compatibility
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission if inside a form
        searchQuery = searchInput.value.trim();
        console.log('Enter keydown event with query:', searchQuery);
        currentPage = 1;
        fetchListings();
      }
    });
  } else {
    console.error('Search elements not found:', {
      searchInput: !!searchInput,
      searchButton: !!searchButton,
    });
  }
}

/**
 * Set up the create listing button and modal
 */
function setupCreateListingButton() {
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

          // Reset form and close modal after a delay
          setTimeout(() => {
            createListingForm.reset();
            listingModal.classList.add('hidden');
            // Refresh listings
            fetchListings();
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
 * Fetch listings from the API based on current filters
 */
async function fetchListings() {
  const container = document.getElementById('listings-container');
  const listingCountElement = document.getElementById('listing-count');

  if (!container) return;

  // Show loading state
  container.innerHTML = `
        <div class="col-span-full text-center py-8 text-gray-500">
            <div class="animate-pulse inline-block w-16 h-16 bg-indigo-300 rounded-lg mb-4"></div>
            <p class="animate-pulse">Loading listings...</p>
        </div>
    `;

  try {
    // Build query parameters
    let queryParams = new URLSearchParams();

    // For initial load or when changing active status, get all items (without search)
    if (searchQuery === '' || allListings.length === 0) {
      // Pagination
      queryParams.append('offset', (currentPage - 1) * itemsPerPage);
      queryParams.append('limit', 100); // Get more items to allow for client-side filtering

      // Sorting
      queryParams.append('sort', sortBy);
      queryParams.append('sortOrder', sortOrder);

      // Include related data
      queryParams.append('_bids', 'true');
      queryParams.append('_seller', 'true');

      // Filtering by active state
      if (activeOnly !== null) {
        queryParams.append('_active', activeOnly);
      }

      let url = `https://api.noroff.dev/api/v1/auction/listings?${queryParams.toString()}`;
      console.log('Fetching all listings with URL:', url);

      // Fetch listings
      const response = await fetch(url);
      console.log('API response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }

      // Parse response
      let data = await response.json();
      console.log('API returned data count:', data.length);

      // Store all listings for client-side filtering
      allListings = data;
    }

    // Always search for users if we have a search query
    if (searchQuery) {
      await searchForUsers(searchQuery);
    } else {
      // Clear previous user search results
      searchUsers = [];
    }

    // Use client-side filtering when searching
    let filteredListings = [...allListings];

    // Apply client-side search if we have a query
    if (searchQuery) {
      console.log('Performing client-side search for:', searchQuery);
      const lowerSearch = searchQuery.toLowerCase();

      filteredListings = allListings.filter((listing) => {
        const titleMatch = listing.title.toLowerCase().includes(lowerSearch);
        const descMatch = listing.description
          .toLowerCase()
          .includes(lowerSearch);
        const tagMatch =
          listing.tags &&
          listing.tags.some((tag) => tag.toLowerCase().includes(lowerSearch));
        const sellerMatch =
          listing.seller &&
          listing.seller.name &&
          listing.seller.name.toLowerCase().includes(lowerSearch);

        return titleMatch || descMatch || tagMatch || sellerMatch;
      });

      console.log(
        `Client-side search found ${filteredListings.length} listing matches`
      );
    }

    // Apply client-side sorting
    filteredListings.sort((a, b) => {
      let valueA, valueB;

      if (sortBy === 'created') {
        valueA = new Date(a.created).getTime();
        valueB = new Date(b.created).getTime();
      } else if (sortBy === 'endsAt') {
        valueA = new Date(a.endsAt).getTime();
        valueB = new Date(b.endsAt).getTime();
      } else if (sortBy === '_count.bids') {
        valueA = a._count?.bids || 0;
        valueB = b._count?.bids || 0;
      } else {
        valueA = a[sortBy];
        valueB = b[sortBy];
      }

      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    // Apply pagination to filtered results
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedListings = filteredListings.slice(startIndex, endIndex);

    // Store for pagination
    currentListings = paginatedListings;

    // Update pagination info
    const totalCount = filteredListings.length;
    totalPages = Math.ceil(totalCount / itemsPerPage);
    console.log('Pagination:', { totalCount, totalPages, currentPage });

    // Update listing count
    if (listingCountElement) {
      listingCountElement.textContent = totalCount;
    }

    // Clear loading message and display content
    container.innerHTML = '';

    // Display user results if we have them
    if (searchUsers.length > 0) {
      container.appendChild(createUserResultsSection(searchUsers));
    }

    if (paginatedListings.length > 0) {
      if (searchUsers.length > 0) {
        // Add a heading for listings if we already displayed users
        const listingsHeading = document.createElement('h2');
        listingsHeading.className = 'col-span-full text-xl font-bold mt-6 mb-3';
        listingsHeading.textContent = 'Listing Results';
        container.appendChild(listingsHeading);
      }

      paginatedListings.forEach((listing) => {
        container.appendChild(createListingCard(listing));
      });

      // Create pagination controls
      updatePagination();
    } else if (searchUsers.length === 0) {
      // Only show no results message if we have neither users nor listings
      container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-search text-6xl mb-4 text-gray-300 animate-pulse"></i>
                    <h3 class="text-xl font-medium mb-2">No Results Found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;

      // Clear pagination
      document.getElementById('pagination').innerHTML = '';
    }
  } catch (error) {
    console.error('Error fetching listings:', error);
    container.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                <i class="fas fa-exclamation-circle text-6xl mb-4 animate-pulse"></i>
                <h3 class="text-xl font-medium mb-2">Error Loading Results</h3>
                <p>There was a problem with your search. Please try again later.</p>
            </div>
        `;
  }
}

/**
 * Search for users based on the query
 * @param {string} query - The search query
 */
async function searchForUsers(query) {
  try {
    // Search by name
    const queryParams = new URLSearchParams();
    queryParams.append('name', query);
    queryParams.append('limit', 8); // Limit to a reasonable number of user results

    const url = `https://api.noroff.dev/api/v1/auction/profiles?${queryParams.toString()}`;
    console.log('Searching for users with URL:', url);

    const response = await fetch(url);
    console.log('User search response status:', response.status);

    if (!response.ok) {
      throw new Error('Failed to search for users');
    }

    const data = await response.json();
    console.log('Found users:', data.length);
    searchUsers = data;
  } catch (error) {
    console.error('Error searching for users:', error);
    searchUsers = [];
  }
}

/**
 * Create the users search results section
 * @param {Array} users - The array of users to display
 * @returns {HTMLElement} The users section element
 */
function createUserResultsSection(users) {
  const section = document.createElement('div');
  section.className = 'col-span-full mb-6';

  const heading = document.createElement('h2');
  heading.className = 'text-xl font-bold mb-3';
  heading.textContent = 'User Results';
  section.appendChild(heading);

  const userGrid = document.createElement('div');
  userGrid.className =
    'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';

  users.forEach((user) => {
    userGrid.appendChild(createUserCard(user));
  });

  section.appendChild(userGrid);
  return section;
}

/**
 * Create a user card element
 * @param {Object} user - The user data
 * @returns {HTMLElement} The user card element
 */
function createUserCard(user) {
  const card = document.createElement('div');
  card.className =
    'bg-white rounded-lg shadow-md p-4 flex items-center hover:shadow-lg transition';

  // Avatar
  const avatar = user.avatar || 'https://via.placeholder.com/64x64?text=User';

  card.innerHTML = `
    <a href="profile.html?name=${user.name}" class="flex items-center w-full">
      <img 
        src="${avatar}" 
        alt="${user.name}" 
        class="w-12 h-12 rounded-full mr-4"
        onerror="this.src='https://via.placeholder.com/64x64?text=User'">
      <div>
        <h3 class="font-semibold text-gray-800">${user.name}</h3>
        <p class="text-sm text-gray-500">${
          user._count?.listings || 0
        } listings</p>
      </div>
    </a>
  `;

  return card;
}

/**
 * Create a listing card element
 * @param {Object} listing - The listing data
 * @returns {HTMLElement} The listing card element
 */
function createListingCard(listing) {
  const card = document.createElement('div');
  card.className =
    'bg-white rounded-lg shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg';

  // Get the main image or use placeholder
  const imageUrl =
    listing.media && listing.media.length > 0
      ? listing.media[0]
      : 'https://via.placeholder.com/300x200?text=No+Image';

  // Format end date
  const endsAt = new Date(listing.endsAt);
  const now = new Date();
  const timeLeft = getTimeLeft(now, endsAt);
  const isActive = now < endsAt;

  // Format current bid
  const bids = listing.bids || [];
  const bidCount = listing._count?.bids || 0;
  const highestBid =
    bids.length > 0 ? Math.max(...bids.map((bid) => bid.amount)) : 0;

  card.innerHTML = `
        <a href="listing-details.html?id=${listing.id}" class="block">
            <div class="relative pb-[60%]">
                <img src="${imageUrl}" alt="${listing.title}" 
                    class="absolute inset-0 w-full h-full object-cover" 
                    onerror="this.src='https://via.placeholder.com/300x200?text=Image+Error'">
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <div class="flex justify-between items-center">
                        <span class="text-white font-bold">${
                          highestBid > 0 ? '$' + highestBid : 'No bids yet'
                        }</span>
                        <span class="text-white text-sm bg-indigo-600 px-2 py-1 rounded">${bidCount} bid${
    bidCount !== 1 ? 's' : ''
  }</span>
                    </div>
                </div>
                ${
                  !isActive
                    ? `<div class="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs font-bold">ENDED</div>`
                    : ''
                }
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 truncate">${
                  listing.title
                }</h3>
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center">
                        <img src="${
                          listing.seller?.avatar ||
                          'https://via.placeholder.com/30x30?text=User'
                        }" 
                            alt="${listing.seller?.name || 'Seller'}" 
                            class="w-6 h-6 rounded-full mr-2"
                            onerror="this.src='https://via.placeholder.com/30x30?text=User'">
                        <span class="text-sm text-gray-600">${
                          listing.seller?.name || 'Unknown'
                        }</span>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-sm ${
                      isActive ? 'text-gray-500' : 'text-red-500'
                    }">
                        <i class="far fa-clock mr-1"></i> ${timeLeft}
                    </div>
                    <span class="text-indigo-600 text-sm font-medium">View Details →</span>
                </div>
            </div>
        </a>
    `;

  return card;
}

/**
 * Update pagination controls
 */
function updatePagination() {
  const paginationContainer = document.getElementById('pagination');

  if (!paginationContainer) return;

  paginationContainer.innerHTML = '';

  if (totalPages <= 1) {
    return;
  }

  // Previous button
  const prevButton = document.createElement('button');
  prevButton.className = `px-3 py-1 rounded ${
    currentPage === 1
      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  }`;
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchListings();
      window.scrollTo(0, 0);
    }
  });

  paginationContainer.appendChild(prevButton);

  // Page numbers
  const maxPageButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.className = `px-3 py-1 rounded ${
      i === currentPage
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`;
    pageButton.textContent = i;
    pageButton.addEventListener('click', () => {
      if (i !== currentPage) {
        currentPage = i;
        fetchListings();
        window.scrollTo(0, 0);
      }
    });

    paginationContainer.appendChild(pageButton);
  }

  // Next button
  const nextButton = document.createElement('button');
  nextButton.className = `px-3 py-1 rounded ${
    currentPage === totalPages
      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  }`;
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchListings();
      window.scrollTo(0, 0);
    }
  });

  paginationContainer.appendChild(nextButton);
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
 * Display an error message in the modal
 * @param {string} message - The error message to display
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
 * Display a success message in the modal
 * @param {string} message - The success message to display
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
        '<i class="fas fa-circle animate-pulse mr-2"></i> Creating Listing...';
    } else {
      submitButton.innerHTML = 'Create Listing';
    }
  }
}
