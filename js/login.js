/**
 * Login functionality for BidHive Auction House
 */

document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm();
  });
  
  /**
   * Set up the login form with event handlers
   */
  function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
  
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        // Hide previous messages
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
  
        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
  
        // Validate email domain
        if (!validateNoroffEmail(email)) {
          showError('Email must be a valid @stud.noroff.no address');
          return;
        }
  
        // Validate password
        if (password.length < 8) {
          showError('Password must be at least 8 characters');
          return;
        }
  
        try {
          // Disable form during submission
          toggleFormState(loginForm, true);
  
          // Attempt login
          await login({ email, password });
  
          // Show success message
          showSuccess('Login successful! Redirecting...');
  
          // Redirect after a short delay
          setTimeout(() => {
            // Check if there's a redirect parameter in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect');
  
            if (redirectTo) {
              window.location.href = redirectTo;
            } else {
              // Default redirect to the listings page
              window.location.href = 'listings.html';
            }
          }, 1000);
        } catch (error) {
          // Show error message
          showError(
            error.message ||
              'Failed to login. Please check your credentials and try again.'
          );
  
          // Re-enable form
          toggleFormState(loginForm, false);
        }
      });
    }
  }
  
  /**
   * Validate that the email is a Noroff student email
   * @param {string} email - The email to validate
   * @returns {boolean} True if the email is valid
   */
  function validateNoroffEmail(email) {
    return email.endsWith('@stud.noroff.no');
  }
  
  /**
   * Display an error message
   * @param {string} message - The error message to display
   */
  function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
  
      // Scroll to the error message
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  /**
   * Display a success message
   * @param {string} message - The success message to display
   */
  function showSuccess(message) {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
      successMessage.textContent = message;
      successMessage.classList.remove('hidden');
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
          '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';
      } else {
        submitButton.innerHTML = 'Login';
      }
    }
  }
  