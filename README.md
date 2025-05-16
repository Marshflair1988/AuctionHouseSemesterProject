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
  - MongoDB (for data storage)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB

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
   MONGODB_URI=your_mongodb_connection_string
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

- All sensitive information (API keys, credentials) is stored in environment variables
- JWT-based authentication
- Input validation and sanitization
- XSS protection
- CSRF protection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Tailwind CSS for the utility-first CSS framework
- MongoDB for the database solution
- All contributors who have helped shape this project
