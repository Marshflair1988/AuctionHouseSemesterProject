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

3. Create a `.env` file in the root directory and add your environment variables:

   ```
   JWT_SECRET=your_jwt_secret
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

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
