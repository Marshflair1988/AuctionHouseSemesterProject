/**
 * Main JavaScript file for BidHive Auction House
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedListings();
  });
  
  /**
   * Fetch featured listings from the API
   */
  async function fetchFeaturedListings() {
    const container = document.getElementById('featured-listings');
  
    if (!container) return;
  
    try {
      // API endpoint for listings with limit of 3 and sort by created
      const response = await fetch(
        'https://api.noroff.dev/api/v1/auction/listings?_active=true&limit=3&sort=created&sortOrder=desc&_bids=true&_seller=true'
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
  
      const data = await response.json();
  
      // Clear loading message
      container.innerHTML = '';
  
      if (data && data.length > 0) {
        data.forEach((listing) => {
          container.appendChild(createListingCard(listing));
        });
      } else {
        container.innerHTML =
          '<p class="col-span-full text-center text-gray-500">No listings found. Check back later!</p>';
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      container.innerHTML =
        '<p class="col-span-full text-center text-red-500">Error loading listings. Please try again later.</p>';
    }
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
  
    // Format current bid
    const currentBid = listing._count?.bids > 0 ? listing.bids[0].amount : 0;
  
    card.innerHTML = `
          <a href="pages/listing-details.html?id=${listing.id}" class="block">
              <div class="relative pb-[60%]">
                  <img src="${imageUrl}" alt="${listing.title}" 
                      class="absolute inset-0 w-full h-full object-cover" 
                      onerror="this.src='https://via.placeholder.com/300x200?text=Image+Error'">
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <div class="flex justify-between items-center">
                          <span class="text-white font-bold">${
                            currentBid > 0 ? '$' + currentBid : 'No bids yet'
                          }</span>
                          <span class="text-white text-sm bg-indigo-600 px-2 py-1 rounded">${
                            listing._count?.bids || 0
                          } bids</span>
                      </div>
                  </div>
              </div>
              <div class="p-4">
                  <h3 class="font-bold text-lg mb-1 truncate">${
                    listing.title
                  }</h3>
                  <div class="flex justify-between items-center mb-2">
                      <div class="flex items-center">
                          <img src="${
                            listing.seller?.avatar ||
                            '../assets/default-avatar.png'
                          }" 
                              alt="${listing.seller?.name || 'Seller'}" 
                              class="w-6 h-6 rounded-full mr-2"
                              onerror="this.src='../assets/default-avatar.png'">
                          <span class="text-sm text-gray-600">${
                            listing.seller?.name || 'Unknown'
                          }</span>
                      </div>
                  </div>
                  <div class="flex justify-between items-center">
                      <div class="text-sm text-gray-500">
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
  