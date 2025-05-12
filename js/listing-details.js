/**
 * Listing details functionality for BidHive Auction House
 */

// Current listing data
let currentListing = null;
let currentImageIndex = 0;
let bidUpdateInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  // Get listing ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get('id');

  if (listingId) {
    fetchListingDetails(listingId);
  } else {
    showError('No listing ID provided. Please go back to the listings page.');
  }

  // Set up bid form submission
  setupBidForm();

  // Set up image gallery controls
  setupImageGalleryControls();
});

/**
 * Fetch listing details from the API
 * @param {string} listingId - The ID of the listing to fetch
 */
async function fetchListingDetails(listingId) {
  // Show loading state
  document.getElementById('listing-loading').classList.remove('hidden');
  document.getElementById('listing-error').classList.add('hidden');
  document.getElementById('listing-details').classList.add('hidden');

  try {
    // Fetch listing details with related data
    const response = await fetch(
      `https://api.noroff.dev/api/v1/auction/listings/${listingId}?_seller=true&_bids=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch listing details');
    }

    const listing = await response.json();
    currentListing = listing;

    // Hide loading, show details
    document.getElementById('listing-loading').classList.add('hidden');
    document.getElementById('listing-details').classList.remove('hidden');

    // Display listing details
    displayListingDetails(listing);

    // Start automatic updates for time remaining
    startTimeUpdates(listing);
  } catch (error) {
    console.error('Error fetching listing details:', error);
    document.getElementById('listing-loading').classList.add('hidden');
    document.getElementById('listing-error').classList.remove('hidden');
    document.getElementById('error-message').textContent =
      error.message || 'Failed to load listing details.';
  }
}

/**
 * Display listing details on the page
 * @param {Object} listing - The listing data
 */
function displayListingDetails(listing) {
  // Basic listing info
  document.getElementById('listing-title').textContent = listing.title;
  document.getElementById('listing-description').textContent =
    listing.description || 'No description provided.';

  // Seller info
  if (listing.seller) {
    document.getElementById('seller-name').textContent = listing.seller.name;
    if (listing.seller.avatar) {
      const sellerAvatar = document.getElementById('seller-avatar');
      sellerAvatar.src = listing.seller.avatar;
      sellerAvatar.onerror = () => {
        sellerAvatar.src = '../assets/default-avatar.png';
      };
    }
  }

  // Created at date
  const createdDate = new Date(listing.created);
  document.getElementById('created-at').textContent =
    createdDate.toLocaleDateString();

  // Tags
  const tagsContainer = document.getElementById('tags-container');
  tagsContainer.innerHTML = '';

  if (listing.tags && listing.tags.length > 0) {
    listing.tags.forEach((tag) => {
      const tagElement = document.createElement('span');
      tagElement.className =
        'bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded';
      tagElement.textContent = tag;
      tagsContainer.appendChild(tagElement);
    });
  } else {
    tagsContainer.innerHTML =
      '<span class="text-sm text-gray-500">No tags</span>';
  }

  // Media gallery
  displayMediaGallery(listing.media || []);

  // Auction status (active or ended)
  updateAuctionStatus(listing);

  // Bid history
  displayBidHistory(listing.bids || []);

  // Check if the current user can bid (not the seller and listing is active)
  const currentUser = getUser();
  const isActive = new Date() < new Date(listing.endsAt);
  const isSeller =
    currentUser && listing.seller && currentUser.name === listing.seller.name;

  if (currentUser && isActive && !isSeller) {
    document.getElementById('bid-section').classList.remove('hidden');

    // Set min bid value
    const highestBid = getHighestBid(listing.bids || []);
    const minBidInput = document.getElementById('bid-amount');
    const minBidAmount = highestBid > 0 ? highestBid + 1 : 1;

    minBidInput.min = minBidAmount;
    minBidInput.value = minBidAmount;

    document.getElementById(
      'min-bid-info'
    ).textContent = `Minimum bid: $${minBidAmount}`;
  }
}

/**
 * Display the media gallery for the listing
 * @param {Array} media - Array of media URLs
 */
function displayMediaGallery(media) {
  const mainImage = document.getElementById('main-image');
  const thumbnailContainer = document.getElementById('thumbnail-container');
  const imageCounter = document.getElementById('image-counter');
  const prevButton = document.getElementById('prev-image');
  const nextButton = document.getElementById('next-image');

  // Reset current image index
  currentImageIndex = 0;

  // If no images, show placeholder
  if (!media || media.length === 0) {
    mainImage.src =
      'https://via.placeholder.com/800x600?text=No+Image+Available';
    mainImage.alt = 'No image available';

    // Hide navigation buttons and thumbnails
    prevButton.classList.add('hidden');
    nextButton.classList.add('hidden');
    thumbnailContainer.classList.add('hidden');
    imageCounter.classList.add('hidden');
    return;
  }

  // Show first image
  mainImage.src = media[0];
  mainImage.alt = `Image 1 of ${media.length}`;
  mainImage.onerror = () => {
    mainImage.src = 'https://via.placeholder.com/800x600?text=Image+Error';
  };

  // Update counter
  imageCounter.textContent = `1/${media.length}`;

  // Show/hide navigation buttons based on image count
  if (media.length <= 1) {
    prevButton.classList.add('hidden');
    nextButton.classList.add('hidden');
  } else {
    prevButton.classList.remove('hidden');
    nextButton.classList.remove('hidden');
  }

  // Create thumbnails
  thumbnailContainer.innerHTML = '';
  media.forEach((url, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = `aspect-w-1 aspect-h-1 cursor-pointer ${
      index === 0 ? 'ring-2 ring-indigo-500' : ''
    }`;

    const img = document.createElement('img');
    img.src = url;
    img.alt = `Thumbnail ${index + 1}`;
    img.className = 'object-cover w-full h-full rounded';
    img.dataset.index = index;
    img.onerror = () => {
      img.src = 'https://via.placeholder.com/150?text=Error';
    };

    img.addEventListener('click', () => {
      currentImageIndex = index;
      updateMainImage();
    });

    thumbnail.appendChild(img);
    thumbnailContainer.appendChild(thumbnail);
  });
}

/**
 * Set up image gallery controls
 */
function setupImageGalleryControls() {
  const prevButton = document.getElementById('prev-image');
  const nextButton = document.getElementById('next-image');

  prevButton.addEventListener('click', () => {
    if (
      !currentListing ||
      !currentListing.media ||
      currentListing.media.length <= 1
    )
      return;

    currentImageIndex =
      (currentImageIndex - 1 + currentListing.media.length) %
      currentListing.media.length;
    updateMainImage();
  });

  nextButton.addEventListener('click', () => {
    if (
      !currentListing ||
      !currentListing.media ||
      currentListing.media.length <= 1
    )
      return;

    currentImageIndex = (currentImageIndex + 1) % currentListing.media.length;
    updateMainImage();
  });
}

/**
 * Update the main image based on the current index
 */
function updateMainImage() {
  if (
    !currentListing ||
    !currentListing.media ||
    currentListing.media.length === 0
  )
    return;

  const mainImage = document.getElementById('main-image');
  const imageCounter = document.getElementById('image-counter');
  const thumbnails = document.querySelectorAll('#thumbnail-container img');

  // Update main image
  mainImage.src = currentListing.media[currentImageIndex];
  mainImage.alt = `Image ${currentImageIndex + 1} of ${
    currentListing.media.length
  }`;

  // Update counter
  imageCounter.textContent = `${currentImageIndex + 1}/${
    currentListing.media.length
  }`;

  // Update thumbnails
  thumbnails.forEach((thumbnail, index) => {
    if (index === currentImageIndex) {
      thumbnail.parentElement.classList.add('ring-2', 'ring-indigo-500');
    } else {
      thumbnail.parentElement.classList.remove('ring-2', 'ring-indigo-500');
    }
  });
}

/**
 * Update the auction status display
 * @param {Object} listing - The listing data
 */
function updateAuctionStatus(listing) {
  const now = new Date();
  const endsAt = new Date(listing.endsAt);
  const isActive = now < endsAt;

  const activeAuction = document.getElementById('active-auction');
  const endedAuction = document.getElementById('ended-auction');

  if (isActive) {
    // Show active auction status
    activeAuction.classList.remove('hidden');
    endedAuction.classList.add('hidden');

    // Update current bid
    const highestBid = getHighestBid(listing.bids || []);
    const currentBidElement = document.getElementById('current-bid');

    if (highestBid > 0) {
      currentBidElement.textContent = `$${highestBid}`;
    } else {
      currentBidElement.textContent = 'No bids yet';
    }

    // Update bid count
    document.getElementById('bid-count').textContent = `${
      listing._count?.bids || 0
    }`;

    // Update time left
    updateTimeLeft(endsAt);
  } else {
    // Show ended auction status
    activeAuction.classList.add('hidden');
    endedAuction.classList.remove('hidden');

    // Update ended info
    const endedInfo = document.getElementById('ended-info');
    const highestBid = getHighestBid(listing.bids || []);

    if (highestBid > 0) {
      endedInfo.textContent = `This auction ended on ${endsAt.toLocaleDateString()} with a final bid of $${highestBid}.`;
    } else {
      endedInfo.textContent = `This auction ended on ${endsAt.toLocaleDateString()} with no bids.`;
    }

    // Hide bid section
    document.getElementById('bid-section').classList.add('hidden');
  }
}

/**
 * Update the time left display
 * @param {Date} endDate - The auction end date
 */
function updateTimeLeft(endDate) {
  const now = new Date();
  const timeLeftElement = document.getElementById('time-left');

  if (now >= endDate) {
    timeLeftElement.textContent = 'Auction ended';

    // Refresh the page to show ended status
    clearInterval(bidUpdateInterval);
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    return;
  }

  const diff = endDate - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let timeLeftText = '';

  if (days > 0) {
    timeLeftText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    timeLeftText = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    timeLeftText = `${minutes}m ${seconds}s`;
  } else {
    timeLeftText = `${seconds}s`;
  }

  timeLeftElement.textContent = timeLeftText;
}

/**
 * Start automatic updates for time remaining
 * @param {Object} listing - The listing data
 */
function startTimeUpdates(listing) {
  const endsAt = new Date(listing.endsAt);

  // Update immediately
  updateTimeLeft(endsAt);

  // Clear any existing interval
  if (bidUpdateInterval) {
    clearInterval(bidUpdateInterval);
  }

  // Update every second
  bidUpdateInterval = setInterval(() => {
    updateTimeLeft(endsAt);
  }, 1000);
}

/**
 * Display bid history for the listing
 * @param {Array} bids - The bids for the listing
 */
function displayBidHistory(bids) {
  const bidHistoryContainer = document.getElementById('bid-history');
  const noBidsMessage = document.getElementById('no-bids');

  if (!bids || bids.length === 0) {
    noBidsMessage.classList.remove('hidden');
    bidHistoryContainer.classList.add('hidden');
    return;
  }

  noBidsMessage.classList.add('hidden');
  bidHistoryContainer.classList.remove('hidden');
  bidHistoryContainer.innerHTML = '';

  // Sort bids by amount (highest first)
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);

  sortedBids.forEach((bid) => {
    const bidElement = document.createElement('div');
    bidElement.className = 'p-4';

    const bidDate = new Date(bid.created);
    const formattedDate =
      bidDate.toLocaleDateString() +
      ' ' +
      bidDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    bidElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <span class="font-medium text-indigo-600">$${bid.amount}</span>
                    <span class="mx-2 text-gray-400">by</span>
                    <span class="font-medium">${bid.bidderName}</span>
                </div>
                <span class="text-sm text-gray-500">${formattedDate}</span>
            </div>
        `;

    bidHistoryContainer.appendChild(bidElement);
  });
}

/**
 * Set up the bid form submission
 */
function setupBidForm() {
  const bidForm = document.getElementById('bid-form');

  if (bidForm) {
    bidForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!currentListing) {
        return;
      }

      const currentUser = getUser();
      if (!currentUser || !getToken()) {
        showError('You must be logged in to place a bid');

        // Redirect to login
        setTimeout(() => {
          window.location.href = `login.html?redirect=listing-details.html?id=${currentListing.id}`;
        }, 2000);

        return;
      }

      const bidAmount = parseInt(document.getElementById('bid-amount').value);
      const highestBid = getHighestBid(currentListing.bids || []);

      // Validate bid amount
      if (isNaN(bidAmount) || bidAmount <= 0) {
        showError('Please enter a valid bid amount');
        return;
      }

      if (bidAmount <= highestBid) {
        showError(
          `Your bid must be higher than the current highest bid ($${highestBid})`
        );
        return;
      }

      try {
        // Disable form during submission
        toggleBidFormState(true);

        // Place bid
        await authFetch(`/auction/listings/${currentListing.id}/bids`, {
          method: 'POST',
          body: JSON.stringify({ amount: bidAmount }),
        });

        // Show success message
        showSuccess(`Your bid of $${bidAmount} was placed successfully!`);

        // Refresh listing details after a short delay
        setTimeout(() => {
          fetchListingDetails(currentListing.id);
          toggleBidFormState(false);
        }, 1500);
      } catch (error) {
        showError(error.message || 'Failed to place bid. Please try again.');
        toggleBidFormState(false);
      }
    });
  }
}

/**
 * Toggle the bid form interactive state
 * @param {boolean} disabled - Whether to disable the form
 */
function toggleBidFormState(disabled) {
  const bidForm = document.getElementById('bid-form');
  const bidButton = bidForm.querySelector('button[type="submit"]');
  const bidInput = document.getElementById('bid-amount');

  bidInput.disabled = disabled;
  bidButton.disabled = disabled;

  if (disabled) {
    bidButton.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i> Placing Bid...';
  } else {
    bidButton.innerHTML = 'Place Bid';
  }
}

/**
 * Get the highest bid amount from the bids array
 * @param {Array} bids - The bids array
 * @returns {number} The highest bid amount, or 0 if no bids
 */
function getHighestBid(bids) {
  if (!bids || bids.length === 0) {
    return 0;
  }

  return Math.max(...bids.map((bid) => bid.amount));
}

/**
 * Display an error message
 * @param {string} message - The error message
 */
function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className =
    'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50';
  errorElement.textContent = message;

  document.body.appendChild(errorElement);

  setTimeout(() => {
    errorElement.classList.add(
      'opacity-0',
      'transition-opacity',
      'duration-500'
    );
    setTimeout(() => {
      errorElement.remove();
    }, 500);
  }, 3000);
}

/**
 * Display a success message
 * @param {string} message - The success message
 */
function showSuccess(message) {
  const successElement = document.createElement('div');
  successElement.className =
    'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded z-50';
  successElement.textContent = message;

  document.body.appendChild(successElement);

  setTimeout(() => {
    successElement.classList.add(
      'opacity-0',
      'transition-opacity',
      'duration-500'
    );
    setTimeout(() => {
      successElement.remove();
    }, 500);
  }, 3000);
}
