// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Mobile Menu');

  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileAuth = document.getElementById('mobile-auth');
  const mobileLogout = document.getElementById('mobile-logout');
  const userMenu = document.getElementById('user-menu');
  const authButtons = document.getElementById('auth-buttons');

  console.log('Elements found:', {
    mobileMenuButton: !!mobileMenuButton,
    mobileMenu: !!mobileMenu,
    mobileAuth: !!mobileAuth,
    mobileLogout: !!mobileLogout,
    userMenu: !!userMenu,
    authButtons: !!authButtons,
  });

  if (mobileMenuButton && mobileMenu) {
    console.log('Setting up mobile menu button click handler');

    // Toggle mobile menu
    const toggleMobileMenu = () => {
      console.log('Mobile menu button clicked');
      const isExpanded =
        mobileMenuButton.getAttribute('aria-expanded') === 'true';
      console.log('Current expanded state:', isExpanded);
      mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden');
      console.log(
        'Mobile menu hidden state:',
        mobileMenu.classList.contains('hidden')
      );

      // Focus management
      if (!isExpanded) {
        // Menu is opening, focus first focusable element
        const firstFocusable = mobileMenu.querySelector('a, button');
        if (firstFocusable) {
          firstFocusable.focus();
        }
      } else {
        // Menu is closing, return focus to button
        mobileMenuButton.focus();
      }
    };

    mobileMenuButton.addEventListener('click', toggleMobileMenu);

    // Add keyboard support
    mobileMenuButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMobileMenu();
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      // Only handle clicks if the mobile menu is open
      if (!mobileMenu.classList.contains('hidden')) {
        // Check if the click is outside both the menu button and menu
        if (
          !mobileMenuButton.contains(e.target) &&
          !mobileMenu.contains(e.target)
        ) {
          console.log('Click outside detected, closing menu');
          mobileMenuButton.setAttribute('aria-expanded', 'false');
          mobileMenu.classList.add('hidden');
          mobileMenuButton.focus();
        }
      }
    });

    // Handle keyboard navigation in mobile menu
    mobileMenu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.add('hidden');
        mobileMenuButton.focus();
      }
    });
  }

  // Show/hide mobile auth menu based on user authentication state
  function updateMobileAuth() {
    console.log('Updating mobile auth state');
    console.log('User menu hidden:', userMenu?.classList.contains('hidden'));

    if (mobileAuth && userMenu && authButtons) {
      if (userMenu.classList.contains('hidden')) {
        console.log('User not logged in, showing auth buttons');
        mobileAuth.classList.add('hidden');
        authButtons.classList.remove('hidden');
      } else {
        console.log('User logged in, showing mobile auth menu');
        mobileAuth.classList.remove('hidden');
        authButtons.classList.add('hidden');
      }
    } else {
      console.log('Missing required elements for mobile auth:', {
        mobileAuth: !!mobileAuth,
        userMenu: !!userMenu,
        authButtons: !!authButtons,
      });
    }
  }

  // Initial update
  console.log('Performing initial mobile auth update');
  updateMobileAuth();

  // Update when auth state changes
  const observer = new MutationObserver((mutations) => {
    console.log('User menu mutation detected:', mutations);
    updateMobileAuth();
  });

  if (userMenu) {
    console.log('Setting up mutation observer for user menu');
    observer.observe(userMenu, {
      attributes: true,
      attributeFilter: ['class'],
    });
  } else {
    console.log('User menu element not found, cannot set up mutation observer');
  }

  // Handle mobile logout
  if (mobileLogout) {
    console.log('Setting up mobile logout handler');
    mobileLogout.addEventListener('click', () => {
      console.log('Mobile logout clicked');
      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        console.log('Triggering main logout button');
        logoutButton.click();
      } else {
        console.log('Main logout button not found');
      }
    });

    // Add keyboard support for mobile logout
    mobileLogout.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        mobileLogout.click();
      }
    });
  } else {
    console.log('Mobile logout button not found');
  }
});
