import { API_BASE_URL, isAuthenticated, currentUser } from './auth.js';
import config from './config.js';

// DOM Elements
const listingLoading = document.getElementById('listing-loading');
const listingError = document.getElementById('listing-error');
const listingDetails = document.getElementById('listing-details');
const mainImage = document.getElementById('main-image');
const thumbnailContainer = document.getElementById('thumbnail-container');
const prevImageBtn = document.getElementById('prev-image');
const nextImageBtn = document.getElementById('next-image');
const imageCounter = document.getElementById('image-counter');
const bidForm = document.getElementById('bid-form');
const bidAmount = document.getElementById('bid-amount');
const minBidInfo = document.getElementById('min-bid-info');
const currentBid = document.getElementById('current-bid');
const bidCount = document.getElementById('bid-count');
const timeLeft = document.getElementById('time-left');
const activeAuction = document.getElementById('active-auction');
const endedAuction = document.getElementById('ended-auction');
const endedInfo = document.getElementById('ended-info');
const bidHistory = document.getElementById('bid-history');
const noBids = document.getElementById('no-bids');
const bidFeedback = document.getElementById('bid-feedback');
const deleteListingBtn = document.getElementById('delete-listing-btn');

// State
let currentListing = null;
let currentImageIndex = 0;

// Get listing ID from URL
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get('id');

// Fetch listing details
async function fetchListingDetails() {
  if (!listingId) {
    showError('No listing ID provided');
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/auction/listings/${listingId}?_seller=true&_bids=true`
    );
    const data = await response.json();

    if (response.ok) {
      currentListing = data.data;
      displayListingDetails();
    } else {
      throw new Error(
        data.errors?.[0]?.message || 'Failed to fetch listing details'
      );
    }
  } catch (error) {
    showListingError(error.message || 'Failed to load listing details');
  }
}

// Display listing details
function displayListingDetails() {
  if (!currentListing) return;

  // Hide loading, show details
  if (listingLoading) listingLoading.classList.add('hidden');
  if (listingDetails) listingDetails.classList.remove('hidden');

  // Set title and description
  document.getElementById('listing-title').textContent = currentListing.title;
  document.getElementById('listing-description').textContent =
    currentListing.description;

  // Set seller info
  const sellerAvatar = document.getElementById('seller-avatar');
  const sellerName = document.getElementById('seller-name');
  if (sellerAvatar && currentListing.seller?.avatar) {
    sellerAvatar.src = currentListing.seller.avatar.url;
  }
  if (sellerName) {
    sellerName.textContent = currentListing.seller?.name || 'Unknown Seller';
  }

  // Set created date
  const createdAt = document.getElementById('created-at');
  if (createdAt) {
    createdAt.textContent = new Date(
      currentListing.created
    ).toLocaleDateString();
  }

  // Display tags
  const tagsContainer = document.getElementById('tags-container');
  if (tagsContainer && currentListing.tags) {
    tagsContainer.innerHTML = currentListing.tags
      .map(
        (tag) =>
          `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">${tag}</span>`
      )
      .join('');
  }

  // Display media
  displayMedia();

  // Display auction status
  displayAuctionStatus();

  // Display bid history
  displayBidHistory();

  // Show delete button if user is the owner
  if (currentUser && currentListing.seller?.name === currentUser.name) {
    deleteListingBtn.classList.remove('hidden');
    deleteListingBtn.addEventListener('click', () =>
      deleteListing(currentListing.id)
    );
  } else {
    deleteListingBtn.classList.add('hidden');
  }
}

// Display media gallery
function displayMedia() {
  if (!currentListing.media?.length) {
    if (mainImage) mainImage.src = '../assets/placeholder.jpg';
    if (thumbnailContainer) thumbnailContainer.innerHTML = '';
    return;
  }

  // Set main image
  if (mainImage) {
    mainImage.src = currentListing.media[currentImageIndex].url;
    mainImage.alt = currentListing.media[currentImageIndex].alt;
  }

  // Update image counter
  if (imageCounter) {
    imageCounter.textContent = `${currentImageIndex + 1}/${
      currentListing.media.length
    }`;
  }

  // Create thumbnails
  if (thumbnailContainer) {
    thumbnailContainer.innerHTML = currentListing.media
      .map(
        (media, index) => `
                <button 
                    class="w-full h-20 rounded overflow-hidden ${
                      index === currentImageIndex
                        ? 'ring-2 ring-indigo-500'
                        : ''
                    }"
                    onclick="currentImageIndex = ${index}; displayMedia();"
                >
                    <img 
                        src="${media.url}" 
                        alt="${media.alt}"
                        class="w-full h-full object-cover"
                    />
                </button>
            `
      )
      .join('');
  }
}

// Display auction status
function displayAuctionStatus() {
  const now = new Date();
  const endDate = new Date(currentListing.endsAt);
  const isEnded = now > endDate;

  // Find the highest bid
  const highestBid =
    currentListing.bids && currentListing.bids.length
      ? Math.max(...currentListing.bids.map((bid) => bid.amount))
      : 0;
  const highestBidObj =
    currentListing.bids && currentListing.bids.length
      ? currentListing.bids.find((bid) => bid.amount === highestBid)
      : null;

  if (isEnded) {
    if (activeAuction) activeAuction.classList.add('hidden');
    if (endedAuction) {
      endedAuction.classList.remove('hidden');
      if (endedInfo) {
        endedInfo.textContent = highestBidObj
          ? `Sold for ${highestBidObj.amount} credits to ${highestBidObj.bidder.name}`
          : 'No bids were placed';
      }
    }
  } else {
    if (endedAuction) endedAuction.classList.add('hidden');
    if (activeAuction) {
      activeAuction.classList.remove('hidden');
      if (currentBid) {
        currentBid.textContent = `${highestBid} credits`;
      }
      if (bidCount) {
        bidCount.textContent = currentListing._count.bids;
      }
      if (timeLeft) {
        updateTimeLeft();
      }
    }
  }

  // Show/hide bid section and bid form
  const bidSection = document.getElementById('bid-section');
  if (bidSection) {
    if (
      isAuthenticated &&
      !isEnded &&
      currentUser &&
      currentListing.seller?.name !== currentUser.name
    ) {
      bidSection.classList.remove('hidden');
    } else {
      bidSection.classList.add('hidden');
    }
  }
  if (bidForm) {
    bidForm.classList.toggle(
      'hidden',
      !isAuthenticated ||
        isEnded ||
        (currentUser && currentListing.seller?.name === currentUser.name)
    );
  }
  if (minBidInfo) {
    const minBid = highestBid + 1;
    minBidInfo.textContent = `Minimum bid: ${minBid} credits`;
  }
}

// Update time left
function updateTimeLeft() {
  if (!timeLeft || !currentListing) return;

  const now = new Date();
  const endDate = new Date(currentListing.endsAt);
  const timeDiff = endDate - now;

  if (timeDiff <= 0) {
    timeLeft.textContent = 'Auction ended';
    displayAuctionStatus();
    return;
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  timeLeft.textContent = `${days}d ${hours}h ${minutes}m`;
}

// Display bid history
function displayBidHistory() {
  if (!bidHistory || !noBids) return;

  if (!currentListing.bids?.length) {
    bidHistory.classList.add('hidden');
    noBids.classList.remove('hidden');
    return;
  }

  bidHistory.classList.remove('hidden');
  noBids.classList.add('hidden');

  bidHistory.innerHTML = currentListing.bids
    .map(
      (bid) => `
            <div class="p-4 flex justify-between items-center">
                <div class="flex items-center">
                    <img 
                        src="${
                          bid.bidder.avatar?.url ||
                          '../assets/default-avatar.png'
                        }" 
                        alt="${bid.bidder.name}"
                        class="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                        <div class="font-medium">${bid.bidder.name}</div>
                        <div class="text-sm text-gray-500">
                            ${new Date(bid.created).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div class="text-indigo-600 font-medium">
                    ${bid.amount} credits
                </div>
            </div>
        `
    )
    .join('');
}

// Place bid
async function placeBid(amount) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/auction/listings/${listingId}/bids`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'X-Noroff-API-Key': config.API_KEY,
        },
        body: JSON.stringify({ amount }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Fetch fresh listing data to update the UI
      await fetchListingDetails();

      // Update user credits
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

      // Refresh profile if on profile page
      if (window.location.pathname.endsWith('profile.html')) {
        try {
          const { initializeProfile } = await import('./profile.js');
          initializeProfile();
        } catch (e) {
          // Optionally log error
        }
      }
      return true;
    } else {
      throw new Error(data.errors?.[0]?.message || 'Failed to place bid');
    }
  } catch (error) {
    showBidError(error.message || 'Failed to place bid');
    return false;
  }
}

// Show error
function showError(message) {
  if (listingLoading) listingLoading.classList.add('hidden');
  if (listingError) {
    listingError.classList.remove('hidden');
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }
}

// Add delete button functionality
async function deleteListing(listingId) {
  if (confirm('Are you sure you want to delete this listing?')) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auction/listings/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'X-Noroff-API-Key': config.API_KEY,
          },
        }
      );

      if (response.ok) {
        window.location.href = 'listings.html';
      } else {
        const data = await response.json();
        throw new Error(
          data.errors?.[0]?.message || 'Failed to delete listing'
        );
      }
    } catch (error) {
      showListingError(error.message || 'Failed to delete listing');
    }
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchListingDetails();

  // Image navigation
  if (prevImageBtn) {
    prevImageBtn.addEventListener('click', () => {
      if (currentListing?.media?.length) {
        currentImageIndex =
          (currentImageIndex - 1 + currentListing.media.length) %
          currentListing.media.length;
        displayMedia();
      }
    });
  }

  if (nextImageBtn) {
    nextImageBtn.addEventListener('click', () => {
      if (currentListing?.media?.length) {
        currentImageIndex =
          (currentImageIndex + 1) % currentListing.media.length;
        displayMedia();
      }
    });
  }

  // Bid form
  if (bidForm) {
    const submitBidBtn = document.getElementById('submit-bid');
    if (submitBidBtn) {
      submitBidBtn.addEventListener('click', async () => {
        if (!isAuthenticated) {
          window.location.href = 'login.html';
          return;
        }

        const amount = parseInt(bidAmount.value);
        if (isNaN(amount) || amount <= 0) {
          if (bidFeedback) {
            bidFeedback.textContent = 'Please enter a valid bid amount.';
            bidFeedback.className = 'mt-2 text-center text-sm text-red-600';
          }
          return;
        }

        const success = await placeBid(amount);
        if (success) {
          bidAmount.value = '';
          if (bidFeedback) {
            bidFeedback.textContent = 'Bid placed successfully!';
            bidFeedback.className = 'mt-2 text-center text-sm text-green-600';
            setTimeout(() => {
              bidFeedback.textContent = '';
            }, 2000);
          }
        } else {
          if (bidFeedback) {
            bidFeedback.textContent = 'Failed to place bid. Please try again.';
            bidFeedback.className = 'mt-2 text-center text-sm text-red-600';
          }
        }
      });
    }
  }

  // Update time left every minute
  setInterval(updateTimeLeft, 60000);
});
