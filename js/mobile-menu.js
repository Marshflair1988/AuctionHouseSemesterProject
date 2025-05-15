// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileAuth = document.getElementById('mobile-auth');
  const mobileLogout = document.getElementById('mobile-logout');
  const userMenu = document.getElementById('user-menu');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (
        !mobileMenuButton.contains(e.target) &&
        !mobileMenu.contains(e.target)
      ) {
        mobileMenu.classList.add('hidden');
      }
    });
  }

  // Show/hide mobile auth menu based on user authentication state
  if (mobileAuth && userMenu) {
    if (userMenu.classList.contains('hidden')) {
      mobileAuth.classList.add('hidden');
    } else {
      mobileAuth.classList.remove('hidden');
    }
  }

  // Handle mobile logout
  if (mobileLogout) {
    mobileLogout.addEventListener('click', () => {
      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.click();
      }
    });
  }
});
