/**
 * Registration functionality for BidHive Auction House
 */

document.addEventListener('DOMContentLoaded', () => {
    setupRegisterForm();
  });
  
  /**
   * Set up the registration form with event handlers
   */
  function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
  
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        // Hide previous messages
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
  
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const avatar = document.getElementById('avatar').value.trim();
  
        // Validate name
        if (name.length < 2) {
          showError('Name must be at least 2 characters');
          return;
        }
  
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
  
        // Prepare user data
        const userData = {
          name,
          email,
          password,
        };
  
        // Add avatar if provided
        if (avatar) {
          userData.avatar = avatar;
        }
  
        try {
          // Disable form during submission
          toggleFormState(registerForm, true);
  
          // Attempt registration
          await register(userData);
  
          // Show success message
          showSuccess(
            'Registration successful! You can now log in with your credentials.'
          );
  
          // Clear the form
          registerForm.reset();
  
          // Re-enable form
          toggleFormState(registerForm, false);
  
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        } catch (error) {
          // Show error message
          showError(error.message || 'Failed to register. Please try again.');
  
          // Re-enable form
          toggleFormState(registerForm, false);
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
  
      // Scroll to the success message
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          '<i class="fas fa-spinner fa-spin mr-2"></i> Creating Account...';
      } else {
        submitButton.innerHTML = 'Create Account';
      }
    }
  }
  