# Delicious Bites RMS

Restaurant Management System with full menu, cart, reservations, and order management.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Language**: JavaScript

## Project Structure

```
DeliciousBites-RMS/
  backend/
    menuData.js        # Menu items data (migrated to database)
    db.js              # Database initialization and connection
    server.js          # Express server
    deliciousbites.db  # SQLite database (created automatically)
    package.json
  frontend/
    src/
      components/      # Reusable components
      pages/           # Page components
      context/         # React context providers
      services/        # API services
    package.json
    vite.config.js
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The backend server will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

- **Menu Page**: Browse menu items with categories, search, and filters
- **Order Type Selection**: Choose between Dine-In, Takeaway, or Delivery
- **Shopping Cart**: Add items, adjust quantities, view order summary with VAT
- **Reservations**: Make table reservations with calendar picker
- **My Orders**: View order history
- **Dashboard**: Overview of restaurant statistics
- **Role-Based Access Control (RBAC)**: Staff authentication with role-based dashboards

## Role-Based Access Control (RBAC)

The application includes a role-based authentication system for staff members with hardcoded email authentication.

### Staff Login

Navigate to `/staff-role-login` to access the staff login page.

### Test Emails

The following emails are configured for testing (no password required):

- `manager@example.com` → Redirects to `/admin/dashboard`
- `kitchen@example.com` → Redirects to `/kitchen-dashboard`
- `waiter@example.com` → Redirects to `/waiter-dashboard`
- `reception@example.com` → Redirects to `/reception-dashboard`

### Testing RBAC

1. **Login Flow**:
   - Go to `http://localhost:3000/staff-role-login`
   - Enter one of the test emails above
   - Click "Sign In"
   - You will be redirected to the appropriate dashboard based on your role

2. **Route Protection**:
   - Try accessing `/admin/dashboard` without logging in → Redirects to login
   - Login as `waiter@example.com`, then try accessing `/admin/dashboard` → Redirects to `/unauthorized` (unless waiter has admin access)
   - Each role can only access their own dashboard

3. **Persistence**:
   - After logging in, refresh the page → You remain logged in (uses localStorage)
   - Close and reopen the browser → You remain logged in

4. **Logout**:
   - Click the "Logout" button in any dashboard
   - You will be redirected to the login page
   - All authentication state is cleared

### Dashboard Routes

- `/admin/dashboard` - Admin/Manager dashboard (revenue, staff management, orders monitor)
- `/kitchen-dashboard` - Kitchen staff dashboard (active orders, order status)
- `/waiter-dashboard` - Waiter dashboard (table status, orders)
- `/reception-dashboard` - Reception dashboard (reservations, bookings)

**Note:** Manager role (`manager@example.com`) redirects to `/admin/dashboard` and has the same access as admin users.

### Unauthorized Access

If a user tries to access a route they don't have permission for, they will be redirected to `/unauthorized` with an error message.

## API Endpoints

### Menu
- `GET /api/menu` - Returns all menu items
- `GET /api/menu/:category` - Returns menu items by category

### Users
- `POST /api/users/signup` - Create a new user account
- `POST /api/users/login` - Login user

### Reservations
- `POST /api/reservations` - Create a new reservation
- `GET /api/reservations/:id` - Get reservation by ID

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/user/:userId` - Get all orders for a user

## Database

The application uses SQLite for data storage. The database file (`deliciousbites.db`) is automatically created in the backend directory when the server starts for the first time.

**Database Schema:**
- `menu_items` - Menu items with categories, prices, images
- `users` - User accounts (phone, name, password)
- `reservations` - Table reservations
- `orders` - Customer orders
- `order_items` - Individual items in each order

The menu data from `menuData.js` is automatically migrated to the database on first run.

## Notes

- VAT is calculated at 14% on all orders
- Cart state persists during session
- Order type selection affects the entire ordering flow
- Database file is automatically created - no manual setup required

