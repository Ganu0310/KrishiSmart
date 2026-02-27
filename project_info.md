# Project Codebase Documentation

## Project Overview

This project is a comprehensive **Smart Agriculture Platform** designed to assist farmers with crop management, weather insights, market prices, and resource planning. It consists of a **Node.js/Express** backend and a **React/TypeScript** frontend.

---

## 1. Project File Structure

### Backend Structure (`/backend`)

```
backend/
├── config/                  # Configuration files
│   └── db.js                # MongoDB connection setup
├── controllers/             # Request handlers (Business logic)
│   ├── adminAdvisoryController.js
│   ├── adminController.js
│   ├── advisoryController.js
│   ├── authController.js
│   ├── fertilizerController.js
│   ├── irrigationController.js
│   ├── marketPriceController.js
│   └── weatherController.js
├── middleware/              # Custom middleware
│   └── authMiddleware.js    # Authentication & Role verification
├── models/                  # Mongoose Database Schemas
│   ├── AdminActivityLog.js
│   ├── CropAdvisory.js
│   ├── EmergencyAdvisory.js
│   ├── Fertilizer.js
│   ├── MarketPrice.js
│   └── User.js
├── routes/                  # API Route Definitions
│   ├── adminRoutes.js
│   ├── advisoryRoutes.js
│   ├── authRoutes.js
│   ├── fertilizerRoutes.js
│   ├── irrigationRoutes.js
│   ├── marketPriceRoutes.js
│   └── weatherRoutes.js
├── scripts/                 # Utility scripts (Seeding, Testing)
│   ├── seedAdmin.js
│   └── seedUsers.js
├── utils/                   # Helper functions
│   └── generateToken.js     # JWT generation
├── server.js                # Entry point (Express app setup)
├── .env                     # Environment variables
└── package.json             # Dependencies and scripts
```

### Frontend Structure (`/frontend`)

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/          # Layout components (Navbar, Sidebar)
│   │   │   ├── Navbar.tsx
│   │   │   └── AdminLayout.tsx
│   │   └── ui/              # Generic UI elements (Buttons, Inputs, Cards)
│   ├── context/             # React Contexts
│   │   ├── AuthContext.tsx  # Authentication state management
│   │   └── SocketContext.tsx# Real-time WebSocket connection
│   ├── hooks/               # Custom React Hooks
│   ├── pages/               # Application Pages
│   │   ├── admin/           # Admin-specific pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   └── ...
│   │   ├── CropAdvisoryPage.tsx
│   │   ├── FarmerDashboard.tsx
│   │   ├── FertilizerDetailPage.tsx
│   │   ├── FertilizersPage.tsx
│   │   ├── IrrigationPlannerPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── MarketPricesPage.tsx
│   ├── services/            # API Communication Services
│   │   └── api.ts           # Axios setup and API methods
│   ├── lib/                 # Utilities (cn, utils)
│   ├── App.tsx              # Main App component & Routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles (Tailwind)
├── index.html               # Main HTML file
├── tailwind.config.ts       # Tailwind CSS configuration
└── vite.config.ts           # Vite build configuration
```

---

## 2. Backend Functionality Details

### Entry Point

- **`server.js`**: Initializes the Express application, connects to MongoDB via `connectDB`, sets up Middleware (CORS, Helmet, Rate Limiting), initializes Socket.io for real-time features, and mounts all API routes under `/api`.

### Config

- **`config/db.js`**: Handles the connection logic to the MongoDB database using Mongoose.

### Models (Database Schemas)

- **`User.js`**: Stores user data (Farmers and Admins). Key fields: `name`, `email`, `mobile`, `role` (farmer/admin), `location`, `crops`, `status`, `isOnline`.
- **`Fertilizer.js`**: Stores fertilizer products. Key fields: `name`, `brand`, `nutrients` (N-P-K), `pricePerKg`, `suitableCrops`, `applicationMethod`.
- **`MarketPrice.js`**: Stores daily market prices for crops. Key fields: `crop`, `mandi`, `price`, `date`.
- **`CropAdvisory.js`**: Stores advisory content. Key fields: `crop`, `stage`, `advice`, `alerts`.
- **`AdminActivityLog.js`**: Records actions taken by admins for audit trails.
- **`EmergencyAdvisory.js`**: Critical alerts broadcasted to users.

### Controllers (Business Logic)

- **`authController.js`**: Handles user registration (`register`), login (`login`), and admin login (`adminLogin`). Includes password hashing (bcrypt) and JWT generation.
- **`adminController.js`**: dashboard stats (`getStats`), user management (get, update, delete users), broadcast messaging.
- **`fertilizerController.js`**: CRUD operations for fertilizers. Public read access, Admin write access.
- **`weatherController.js`**: Fetches weather data (likely from an external API) based on user location.
- **`marketPriceController.js`**: Manages market price data.
- **`advisoryController.js`**: Provides crop-specific advice based on growth stage and weather.
- **`irrigationController.js`**: Logic for irrigation planning (calculating water needs).

### Routes (API Endpoints)

- **`authRoutes.js`**: `/register`, `/login`.
- **`adminRoutes.js`**: Protected routes for admin dashboard and user management.
- **`fertilizerRoutes.js`**: `/` (list), `/:id` (details), `/admin/*` (management).
- **`weatherRoutes.js`**: GET weather data.
- **`irrigationRoutes.js`**: Endpoints for irrigation planner.
- **`marketPriceRoutes.js`**: Endpoints for market prices.

---

## 3. Frontend Component & Feature Details

### Core Application (`src`)

- **`App.tsx`**: Defines the application routing using `react-router-dom`. Implements `ProtectedRoute` to restrict access to authenticated users.
- **`main.tsx`**: Bootstraps the React app and mounts it to the DOM.

### Contexts

- **`AuthContext.tsx`**: Manages global authentication state (`user`, `isAuthenticated`, `token`, `login`, `logout`). Persists token in localStorage.
- **`SocketContext.tsx`**: Manages a global Socket.io connection for real-time updates (e.g., admin broadcasts, live user status).

### Services

- **`api.ts`**: Centralized Axios instance with interceptors for attaching the JWT token to requests. Exports typed API methods (`authApi`, `adminApi`, `weatherApi`, `fertilizerApi`, etc.) for use in components.

### Pages (Views)

#### Public

- **`LandingPage.tsx`**: The home page for unauthenticated visitors.
- **`LoginPage.tsx`**: User login form.

#### Farmer (Protected)

- **`FarmerDashboard.tsx`**: The main hub for farmers. Shows weather summary, quick links to tools, and recent advisories.
- **`CropAdvisoryPage.tsx`**: Interface to select crop and growth stage to get specific farming advice.
- **`MarketPricesPage.tsx`**: Displays current market prices for various crops in different mandis.
- **`IrrigationPlannerPage.tsx`**: Tool for calculating irrigation requirements.
- **`FertilizersPage.tsx`**: Product catalog for fertilizers.
- **`FertilizerDetailPage.tsx`**: Detailed view of a specific fertilizer product.

#### Admin (Protected)

- **`admin/AdminLogin.tsx`**: Dedicated login for administrators.
- **`admin/AdminDashboard.tsx`**: Overview of platform stats (total users, active users, alerts).
- **`admin/AdminUsers.tsx`**: Table view to manage registered users (view, suspend, delete).
- **`admin/AdminFertilizers.tsx`**: CRUD interface for managing the fertilizer catalog.
- **`admin/AdminContent.tsx`**: CMS for managing advisories and market prices.

### Components (`src/components`)

- **`layout/Navbar.tsx`**: Responsive navigation bar showing links based on user role.
- **`layout/AdminLayout.tsx`**: Layout wrapper for admin pages, likely including a sidebar.
- **`ui/`**: A library of reusable atomic components (Buttons, Cards, Inputs, Dialogs, Toasts). Ideally built with Shadcn UI or similar.

---
