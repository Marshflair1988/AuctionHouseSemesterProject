// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  // Get all required elements
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileAuthButtons = document.getElementById('mobile-auth-buttons');
  const mobileUserMenu = document.getElementById('mobile-user-menu');
  const mobileLogoutButton = document.getElementById('mobile-logout-button');
  const userMenu = document.getElementById('user-menu');
  const mainLogoutButton = document.getElementById('logout-button');

  // Track menu state
  let isExpanded = false;

  // Function to update mobile auth state
  function updateMobileAuthState() {
    if (!mobileAuthButtons || !mobileUserMenu) {
      return;
    }

    const isUserMenuHidden = userMenu?.classList.contains('hidden');

    if (isUserMenuHidden) {
      mobileAuthButtons.classList.remove('hidden');
      mobileUserMenu.classList.add('hidden');
    } else {
      mobileAuthButtons.classList.add('hidden');
      mobileUserMenu.classList.remove('hidden');
    }
  }

  // Set up mobile menu button click handler
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      isExpanded = !isExpanded;
      mobileMenuButton.setAttribute('aria-expanded', isExpanded);
      mobileMenu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (
        isExpanded &&
        !mobileMenu.contains(event.target) &&
        !mobileMenuButton.contains(event.target)
      ) {
        isExpanded = false;
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.add('hidden');
      }
    });
  }

  // Set up mutation observer for user menu
  if (userMenu) {
    const observer = new MutationObserver((mutations) => {
      updateMobileAuthState();
    });

    observer.observe(userMenu, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  // Set up mobile logout handler
  if (mobileLogoutButton && mainLogoutButton) {
    mobileLogoutButton.addEventListener('click', () => {
      if (mainLogoutButton) {
        mainLogoutButton.click();
      }
    });
  }

  // Initial mobile auth state update
  updateMobileAuthState();
});
