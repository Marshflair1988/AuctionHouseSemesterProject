# Auction House

A modern, responsive web application for managing and participating in online auctions. Built with HTML, CSS (Tailwind), and JavaScript, this platform provides a seamless experience for both buyers and sellers.

## Features

- **User Authentication**

  - Secure login and registration system
  - User profile management
  - Session handling

- **Auction Listings**

  - Browse active auctions
  - Detailed listing views
  - Real-time bid updates
  - Search and filter functionality
  - Category-based navigation

- **Bidding System**

  - Real-time bid placement
  - Bid history tracking
  - Automatic bid validation
  - Current bid display

- **User Dashboard**

  - Active bids tracking
  - Won auctions history
  - User statistics
  - Profile management

- **Responsive Design**
  - Mobile-first approach
  - Responsive navigation
  - Optimized for all screen sizes
  - Touch-friendly interface

## Tech Stack

- **Frontend**

  - HTML5
  - CSS3 with Tailwind CSS
  - Vanilla JavaScript
  - Responsive Design

- **Backend**
  - Node.js
  - Express.js
  - RESTful API integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd auction-house
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up API credentials:

   - Copy `js/config.template.js` to `js/config.js`
   - Replace `YOUR_API_KEY_HERE` with your Noroff API key
   - Never commit `config.js` to version control

4. Create a `.env` file in the root directory and add your environment variables:

   ```
   JWT_SECRET=your_jwt_secret
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

### API Credentials

To get your Noroff API credentials:

1. Log in to your Noroff student account
2. Navigate to the API section
3. Generate a new API key
4. Copy the key and replace it in your `config.js` file

**Important Security Notes:**

- Never commit your `config.js` file to version control
- Keep your API key secure and don't share it publicly
- If you accidentally commit your API key, rotate it immediately
- Use environment variables for production deployments

## Project Structure

```
auction-house/
├── pages/              # HTML pages
├── js/                 # JavaScript files
├── css/               # CSS files
├── assets/            # Images and other static assets
├── config/            # Configuration files
└── public/            # Public assets
```

## Security

- JWT-based authentication for secure user sessions
- API key authentication for Noroff API access
- Basic input validation and sanitization
- Secure storage of authentication tokens
- Environment variable protection for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
