import { API_BASE_URL } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const avatarUrl = document.getElementById('avatar').value;

      // Validate email domain
      if (!email.endsWith('@stud.noroff.no')) {
        if (errorMessage) {
          errorMessage.textContent = 'Email must end with @stud.noroff.no';
          errorMessage.classList.remove('hidden');
        }
        return;
      }

      try {
        const userData = {
          name,
          email,
          password,
        };

        // Add avatar if provided
        if (avatarUrl) {
          userData.avatar = {
            url: avatarUrl,
            alt: `${name}'s avatar`,
          };
        }

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
          // Show success message
          if (successMessage) {
            successMessage.textContent =
              'Registration successful! Redirecting to login...';
            successMessage.classList.remove('hidden');
          }

          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1500);
        } else {
          throw new Error(data.errors?.[0]?.message || 'Registration failed');
        }
      } catch (error) {
        if (errorMessage) {
          errorMessage.textContent = error.message;
          errorMessage.classList.remove('hidden');
        }
      }
    });
  }
});
