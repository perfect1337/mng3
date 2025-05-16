# Restaurant Menu Application

A modern web application for restaurant menu management built with Next.js, MongoDB, and TypeScript.

## Features

- Menu management with categories
- Shopping cart functionality
- User authentication
- Admin panel for menu management
- Analytics for popular items
- Responsive design

## Tech Stack

- Next.js
- TypeScript
- MongoDB
- Tailwind CSS
- Next Auth

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
cd restaurant-menu
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file and add your environment variables:
```
MONGODB_URI=your_mongodb_uri
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/pages` - Next.js pages and API routes
- `/components` - React components
- `/models` - MongoDB models
- `/lib` - Utility functions and database connection
- `/types` - TypeScript type definitions

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. 