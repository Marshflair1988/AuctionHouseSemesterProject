import { API_BASE_URL } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Noroff-API-Key': 'aa2b815e-2edb-4047-8ddd-2503d905bff6',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token and user data
          localStorage.setItem('token', data.data.accessToken);
          localStorage.setItem('user', JSON.stringify(data.data));

          // Show success message
          if (successMessage) {
            successMessage.textContent = 'Login successful! Redirecting...';
            successMessage.classList.remove('hidden');
          }

          // Redirect to listings page after a short delay
          setTimeout(() => {
            window.location.href = 'listings.html';
          }, 1500);
        } else {
          throw new Error(data.errors?.[0]?.message || 'Login failed');
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
