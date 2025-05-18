# BidHive Auction House

A modern, responsive web application for online auctions, built with HTML, CSS, and JavaScript. BidHive provides a platform for users to browse, bid on, and create auction listings.

## Features

- **User Authentication**

  - Secure login and registration system
  - Profile management
  - Credit system for bidding
  - JWT-based authentication

- **Auction Listings**

  - Browse active auctions
  - Featured listings on homepage
  - Detailed item views
  - Real-time bidding system
  - Search and filter functionality

- **User Dashboard**

  - View and manage personal listings
  - Track bids and auction status
  - Credit balance management
  - Active bids tracking

- **Responsive Design**
  - Mobile-first approach
  - Optimized for all device sizes
  - Modern UI with Tailwind CSS
  - Mobile navigation menu

## Tech Stack

- HTML5
- CSS3 (with Tailwind CSS)
- JavaScript (ES6+)
- Font Awesome for icons
- Noroff API for backend services
- Netlify for deployment

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Git installed on your system
- A Noroff student account for API access
- Basic understanding of web development

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/BidHive.git
cd BidHive
```

### 2. API Setup

1. Log in to your Noroff student account
2. Navigate to the API section
3. Generate a new API key
4. Create a `.env` file in the root directory with the following content:

```
NOROFF_API_KEY=your_api_key_here
```

### 3. Environment Configuration

1. Create a `js/config.js` file with the following content:

```javascript
const API_URL = 'https://api.noroff.dev/api/v1/auction';
const API_KEY = process.env.NOROFF_API_KEY;
```

### 4. Local Development

1. Install a local development server (if you don't have one):

```bash
npm install -g live-server
```

2. Start the development server:

```bash
live-server
```

3. Open your browser and navigate to `http://localhost:8080`

## Project Structure

```
BidHive/
├── assets/
│   ├── BidHive_Logo.png
│   ├── default-avatar.png
│   └── Goldwatch.png
├── css/
│   └── style.css
├── js/
│   ├── auth.js
│   └── mobile-menu.js
├── pages/
│   ├── about.html
│   ├── listings.html
│   ├── login.html
│   ├── profile.html
│   └── register.html
├── .env
├── js/
│   └── config.js
└── index.html
```

## Deployment

### Netlify Deployment

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure environment variables in Netlify:
   - Go to Site settings > Build & deploy > Environment
   - Add environment variable:
     - `NOROFF_API_KEY` = your Noroff API key
4. Deploy your site

### Cache Control

The application implements cache control headers to ensure fresh data:

- No-cache headers for dynamic content
- Cache-busting for static assets
- ETag support for conditional requests

## Common Issues and Solutions

1. **API Connection Issues**

   - Verify your API key is correct
   - Check your network connection
   - Ensure you're using a valid Noroff student email

2. **Authentication Problems**

   - Clear browser cache and cookies
   - Ensure JWT token is being stored correctly
   - Check browser console for error messages

3. **Caching Issues**
   - Hard refresh the page (Ctrl + F5)
   - Clear browser cache
   - Check if cache headers are properly set

## Testing

1. Create a test account using your Noroff student email
2. Test the following features:
   - User registration and login
   - Creating new listings
   - Placing bids
   - Profile management
   - Credit system

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security Notes

- Never commit your `.env` file or `config.js` with API keys
- Keep your API key secure and don't share it publicly
- If you accidentally commit sensitive data, rotate your API key immediately
- Use HTTPS for all API requests
- Implement proper input validation and sanitization

## Author

Marsh Woolgar

