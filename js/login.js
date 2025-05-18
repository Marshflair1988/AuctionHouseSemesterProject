import { API_BASE_URL, updateUser, updateUIForAuth } from './auth.js';

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
            'X-Noroff-API-Key': 'aa2b815e-2edb-4047-8ddd-2503d905bff6',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token and user data
          localStorage.setItem('token', data.data.accessToken);

          // Fetch user profile to get complete user data including credits
          const profileResponse = await fetch(
            `${API_BASE_URL}/auction/profiles/${data.data.name}`,
            {
              headers: {
                Authorization: `Bearer ${data.data.accessToken}`,
                'X-Noroff-API-Key': 'aa2b815e-2edb-4047-8ddd-2503d905bff6',
              },
            }
          );

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const userData = {
              ...data.data,
              credits: profileData.data.credits,
              avatar: profileData.data.avatar,
            };
            localStorage.setItem('user', JSON.stringify(userData));
            updateUser(userData);
            updateUIForAuth();

            // Show success message
            if (successMessage) {
              successMessage.textContent = 'Login successful! Redirecting...';
              successMessage.classList.remove('hidden');
              if (errorMessage) errorMessage.classList.add('hidden');
            }

            // Redirect to home page after successful login
            setTimeout(() => {
              window.location.href = '../index.html';
            }, 1500);
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } else {
          throw new Error(data.errors?.[0]?.message || 'Login failed');
        }
      } catch (error) {
        showLoginError(error.message || 'Login failed. Please try again.');
      }
    });
  }
});
