import { API_BASE_URL, isAuthenticated, currentUser } from './auth.js';

// State
let currentPage = 1;
let totalPages = 1;
let currentSort = 'created';
let currentStatus = 'active';
let currentSearch = '';
let currentBidListingId = null;

// DOM Elements
const listingsContainer = document.getElementById('listings-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortSelect = document.getElementById('sort-by');
const statusSelect = document.getElementById('active-only');
const createListingBtn = document.getElementById('create-listing-btn');
const listingModal = document.getElementById('listing-modal');
const closeModalBtn = document.getElementById('close-modal');
const createListingForm = document.getElementById('create-listing-form');
const listingCount = document.getElementById('listing-count');

// Fetch listings
async function fetchListings() {
  try {
    let url = `${API_BASE_URL}/auction/listings?`;
    url += `_seller=true&_bids=true`;
    // Handle status filter
    if (currentStatus === 'active') {
      url += `&_active=true`;
    } else if (currentStatus === 'ended') {
      url += `&_active=false`;
    }
    // Handle sort filter
    if (currentSort) {
      // For 'created' (newest), use descending order
      const sortOrder = currentSort === 'endsAt' ? 'asc' : 'desc';
      url += `&sort=${encodeURIComponent(currentSort)}&sortOrder=${sortOrder}`;
    }
    url += `&limit=12&page=${currentPage}`;

    // Add search query if it exists
    if (currentSearch && currentSearch.trim()) {
      url += `&search=${encodeURIComponent(currentSearch.trim())}`;
    }

    const response = await fetch(url, {
      headers: {
        'X-Noroff-API-Key': 'aa2b815e-2edb-4047-8ddd-2503d905bff6',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0]?.message || 'Failed to fetch listings'
      );
    }

    const data = await response.json();

    // Filter listings based on search term
    let filteredListings = data.data;
    if (currentSearch && currentSearch.trim()) {
      const searchTerm = currentSearch.trim().toLowerCase();
      filteredListings = data.data.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchTerm) ||
          listing.description.toLowerCase().includes(searchTerm) ||
          listing.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
          (listing.seller &&
            listing.seller.name.toLowerCase().includes(searchTerm))
      );
    }

    displayListings(filteredListings);

    // Calculate total pages based on total count from meta
    const totalPages = Math.ceil(data.meta.totalCount / 12);
    updatePagination({
      ...data.meta,
      totalCount: filteredListings.length,
      pageCount: totalPages,
    });
    if (listingCount) {
      listingCount.textContent = data.meta.totalCount;
    }
  } catch (error) {
    if (listingsContainer) {
      listingsContainer.innerHTML = `
        <div class="col-span-full text-center py-8 text-red-500">
          <p>Error loading listings: ${error.message}</p>
        </div>
      `;
    }
  }
}

// Display listings
function displayListings(listings) {
  if (!listingsContainer) return;

  if (listings.length === 0) {
    listingsContainer.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500" role="status">
        <p>No listings found.</p>
      </div>
    `;
    return;
  }

  // Create HTML string for all listings
  const listingsHTML = listings
    .map((listing) => {
      const highestBid =
        listing.bids && listing.bids.length
          ? Math.max(...listing.bids.map((bid) => bid.amount))
          : 0;
      // Calculate time left
      const endsAt = new Date(listing.endsAt);
      const now = new Date();
      let timeLeft = '';
      const diff = endsAt - now;
      if (diff <= 0) {
        timeLeft = 'Ended';
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0) {
          timeLeft = `${days}d ${hours}h left`;
        } else if (hours > 0) {
          timeLeft = `${hours}h ${minutes}m left`;
        } else if (minutes > 0) {
          timeLeft = `${minutes}m left`;
        } else {
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          timeLeft = `${seconds}s left`;
        }
      }
      const isOwner = currentUser && listing.seller?.name === currentUser.name;
      return `
    <div class="bg-white rounded-lg shadow-md overflow-hidden h-[32rem] flex flex-col" role="listitem">
      <a href="listing-details.html?id=${
        listing.id
      }" class="block flex flex-col h-full">
        <div class="relative w-full h-60 flex-shrink-0">
          <img 
            src="${listing.media?.[0]?.url || '../assets/placeholder.jpg'}" 
            alt="${listing.media?.[0]?.alt || listing.title}"
            class="object-cover w-full h-full"
          />
          ${isOwner ? '' : ''}
        </div>
        <div class="p-4 flex flex-col flex-grow min-h-0">
          <h3 class="text-lg font-semibold mb-2 line-clamp-1">${
            listing.title
          }</h3>
          <p class="text-gray-600 text-sm mb-2 line-clamp-1 flex-grow">${
            listing.description || ''
          }</p>
          <div class="mt-auto">
            <div class="flex items-center mb-2">
              <img 
                src="${
                  listing.seller?.avatar?.url || '../assets/default-avatar.png'
                }" 
                alt="${listing.seller?.name || 'Seller'}"
                class="w-6 h-6 rounded-full mr-2"
              />
              <span class="text-sm text-gray-600">${
                listing.seller?.name || 'Unknown Seller'
              }</span>
            </div>
            <div class="text-sm text-red-600 mb-2" aria-live="polite">
              <i class="far fa-clock mr-1" aria-hidden="true"></i>${timeLeft}
            </div>
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-500">
                ${listing._count.bids} bids
              </div>
              <div class="text-indigo-600 font-medium">
                ${highestBid} credits
              </div>
            </div>
            ${
              isAuthenticated
                ? isOwner
                  ? `<button 
                      class="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2 delete-listing-btn" 
                      data-listing-id="${listing.id}"
                      aria-label="Delete listing">
                      <i class="fas fa-trash" aria-hidden="true"></i>
                      Delete Listing
                    </button>`
                  : `<button 
                      class="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 place-bid-btn" 
                      data-listing-id="${listing.id}"
                      aria-label="Place bid on ${listing.title}">
                      Place Bid
                    </button>`
                : ''
            }
          </div>
        </div>
      </a>
    </div>
  `;
    })
    .join('');

  // Update the container's content
  listingsContainer.innerHTML = listingsHTML;

  // Add event listeners for all Place Bid buttons
  if (isAuthenticated) {
    document.querySelectorAll('.place-bid-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        currentBidListingId = btn.getAttribute('data-listing-id');
        openBidModal();
      });

      // Add keyboard support
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-listing-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const listingId = btn.getAttribute('data-listing-id');
        if (confirm('Are you sure you want to delete this listing?')) {
          try {
            const response = await fetch(
              `${API_BASE_URL}/auction/listings/${listingId}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                  'X-Noroff-API-Key': 'aa2b815e-2edb-4047-8ddd-2503d905bff6',
                },
              }
            );

            if (response.ok) {
              fetchListings(); // Refresh the listings
            } else {
              const data = await response.json();
              throw new Error(
                data.errors?.[0]?.message || 'Failed to delete listing'
              );
            }
          } catch (error) {
            alert('Failed to delete listing: ' + error.message);
          }
        }
      });

      // Add keyboard support
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }
}

// Update pagination
function updatePagination(meta) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  let paginationHTML = '';

  if (meta.previousPage) {
    paginationHTML += `
            <button 
                class="px-3 py-1 border rounded hover:bg-gray-100 pagination-btn"
                data-page="${meta.previousPage}"
            >
                Previous
            </button>
        `;
  }

  paginationHTML += `
        <span class="px-3 py-1">
            Page ${meta.currentPage} of ${meta.pageCount}
        </span>
    `;

  if (meta.nextPage) {
    paginationHTML += `
            <button 
                class="px-3 py-1 border rounded hover:bg-gray-100 pagination-btn"
                data-page="${meta.nextPage}"
            >
                Next
            </button>
        `;
  }

  pagination.innerHTML = paginationHTML;

  // Add event listeners for pagination buttons
  pagination.querySelectorAll('.pagination-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const page = parseInt(btn.getAttribute('data-page'), 10);
      if (!isNaN(page)) {
        currentPage = page;
        fetchListings();
      }
    });
  });
}

// Create listing
async function createListing(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auction/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'X-Noroff-API-Key': 'aa2b815e-2edb-4047-8ddd-2503d905bff6',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      if (listingModal) {
        listingModal.classList.add('hidden');
        listingModal.classList.remove('flex');
      }
      fetchListings();
      return true;
    } else {
      throw new Error(data.errors?.[0]?.message || 'Failed to create listing');
    }
  } catch (error) {
    return false;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchListings();

  // Search
  if (searchButton && searchInput) {
    const performSearch = () => {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      fetchListings();
    };

    searchButton.addEventListener('click', () => {
      performSearch();
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      fetchListings();
    });
  }

  // Status filter
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentStatus = e.target.value;
      currentPage = 1;
      fetchListings();
    });
  }

  // Create listing modal
  if (createListingBtn) {
    createListingBtn.addEventListener('click', () => {
      if (!isAuthenticated) {
        window.location.href = 'login.html';
        return;
      }
      openListingModal();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      closeListingModal();
    });
  }

  // Create listing form
  if (createListingForm) {
    createListingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        tags: document
          .getElementById('tags')
          .value.split(',')
          .map((tag) => tag.trim()),
        media: document
          .getElementById('media')
          .value.split('\n')
          .filter((url) => url.trim())
          .map((url) => ({
            url: url.trim(),
            alt: document.getElementById('title').value,
          })),
        endsAt: new Date(
          document.getElementById('ends-at').value
        ).toISOString(),
      };

      const success = await createListing(formData);
      if (success) {
        createListingForm.reset();
        closeListingModal();
      }
    });
  }

  // Add keyboard support for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const listingModal = document.getElementById('listing-modal');
      const bidModal = document.getElementById('bid-modal');

      if (!listingModal.classList.contains('hidden')) {
        closeListingModal();
      }
      if (!bidModal.classList.contains('hidden')) {
        closeBidModal();
      }
    }
  });
});

// Bid modal logic
const bidModal = document.getElementById('bid-modal');
const closeBidModalBtn = document.getElementById('close-bid-modal');
const bidForm = document.getElementById('bid-form');
const bidAmountInput = document.getElementById('bid-amount');
const bidModalError = document.getElementById('bid-modal-error');

function openBidModal() {
  if (bidModal) {
    bidModal.classList.remove('hidden');
    bidAmountInput.value = '';
    bidModalError.classList.add('hidden');
    bidModalError.textContent = '';
  }
}

function closeBidModal() {
  if (bidModal) {
    bidModal.classList.add('hidden');
  }
}

if (closeBidModalBtn) {
  closeBidModalBtn.addEventListener('click', closeBidModal);
}

if (bidModal) {
  bidModal.addEventListener('click', (e) => {
    if (e.target === bidModal) closeBidModal();
  });
}

if (bidForm) {
  bidForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseInt(bidAmountInput.value, 10);
    if (!amount || amount < 1) {
      bidModalError.textContent = 'Please enter a valid bid amount.';
      bidModalError.classList.remove('hidden');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to place a bid.');
      const response = await fetch(
        `${API_BASE_URL}/auction/listings/${currentBidListingId}/bids`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Noroff-API-Key': 'aa2b815e-2edb-4047-8ddd-2503d905bff6',
          },
          body: JSON.stringify({ amount }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'Failed to place bid');
      }
      closeBidModal();
      fetchListings(); // Refresh listings
      // --- Begin credits update ---
      const { getUser, updateUser, authFetch, updateUIForAuth } = await import(
        './auth.js'
      );
      const user = getUser();
      if (user) {
        try {
          const userResponse = await authFetch(
            `/auction/profiles/${user.name}`
          );
          updateUser({ ...user, credits: userResponse.data.credits });
          updateUIForAuth();
        } catch (e) {
          // Optionally log error
        }
      }
      // --- End credits update ---
      // --- Begin profile refresh if on profile page ---
      if (window.location.pathname.endsWith('profile.html')) {
        try {
          const { initializeProfile } = await import('./profile.js');
          initializeProfile();
        } catch (e) {
          // Optionally log error
        }
      }
      // --- End profile refresh ---
    } catch (error) {
      bidModalError.textContent = error.message || 'Failed to place bid.';
      bidModalError.classList.remove('hidden');
    }
  });
}

// Focus management for modals
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }
  });
}

// Update modal functions
function openListingModal() {
  const modal = document.getElementById('listing-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  // Focus first focusable element
  const firstInput = modal.querySelector('input, textarea, button');
  if (firstInput) {
    firstInput.focus();
  }

  // Trap focus
  trapFocus(modal);

  // Update ARIA attributes
  const userMenuButton = document.getElementById('user-menu-button');
  if (userMenuButton) {
    userMenuButton.setAttribute('aria-expanded', 'false');
  }
}

function closeListingModal() {
  const modal = document.getElementById('listing-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';

  // Return focus to trigger button
  const createListingBtn = document.getElementById('create-listing-btn');
  if (createListingBtn) {
    createListingBtn.focus();
  }
}
