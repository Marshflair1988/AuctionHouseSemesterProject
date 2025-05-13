import { API_BASE_URL, isAuthenticated, currentUser } from './auth.js';

// State
let currentPage = 1;
let totalPages = 1;
let currentSort = 'created';
let currentStatus = 'active';
let currentSearch = '';

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
    url += `_seller=true&_bids=true&_active=${currentStatus === 'active'}`;
    url += `&sort=${currentSort}&sortOrder=desc`;
    url += `&limit=12&page=${currentPage}`;

    if (currentSearch) {
      url += `&q=${encodeURIComponent(currentSearch)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      displayListings(data.data);
      updatePagination(data.meta);
      if (listingCount) {
        listingCount.textContent = data.meta.totalCount;
      }
    } else {
      throw new Error(data.errors?.[0]?.message || 'Failed to fetch listings');
    }
  } catch (error) {
    console.error('Error fetching listings:', error);
    if (listingsContainer) {
      listingsContainer.innerHTML = `
                <div class="col-span-full text-center py-8 text-red-500">
                    <p>Error loading listings. Please try again later.</p>
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
      <div class="col-span-full text-center py-8 text-gray-500">
        <p>No listings found.</p>
      </div>
    `;
    return;
  }

  // Create HTML string for all listings
  const listingsHTML = listings
    .map(
      (listing) => `
    <div class="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      <a href="listing-details.html?id=${
        listing.id
      }" class="block flex flex-col h-full">
        <div class="relative aspect-w-16 aspect-h-9 w-full">
          <img 
            src="${listing.media?.[0]?.url || '../assets/placeholder.jpg'}" 
            alt="${listing.media?.[0]?.alt || listing.title}"
            class="object-cover w-full h-full"
          />
        </div>
        <div class="p-4 flex flex-col flex-grow">
          <h3 class="text-lg font-semibold mb-2 line-clamp-1">${
            listing.title
          }</h3>
          <p class="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">${
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
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-500">
                ${listing._count.bids} bids
              </div>
              <div class="text-indigo-600 font-medium">
                ${listing.bids?.[0]?.amount || 0} credits
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  `
    )
    .join('');

  // Update the container's content
  listingsContainer.innerHTML = listingsHTML;
}

// Update pagination
function updatePagination(meta) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  let paginationHTML = '';

  if (meta.previousPage) {
    paginationHTML += `
            <button 
                class="px-3 py-1 border rounded hover:bg-gray-100"
                onclick="currentPage = ${meta.previousPage}; fetchListings();"
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
                class="px-3 py-1 border rounded hover:bg-gray-100"
                onclick="currentPage = ${meta.nextPage}; fetchListings();"
            >
                Next
            </button>
        `;
  }

  pagination.innerHTML = paginationHTML;
}

// Create listing
async function createListing(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auction/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      closeModal();
      fetchListings();
      return true;
    } else {
      throw new Error(data.errors?.[0]?.message || 'Failed to create listing');
    }
  } catch (error) {
    console.error('Error creating listing:', error);
    return false;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchListings();

  // Search
  if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      fetchListings();
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        fetchListings();
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
      listingModal.classList.remove('hidden');
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      listingModal.classList.add('hidden');
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
      }
    });
  }
});
