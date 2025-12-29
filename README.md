# Stackwise - Modern Banking App

A modern, full-stack banking application built with React and Node.js featuring a unique "Stacks" system for organizing and allocating money within checking and savings accounts.

## Features

### Core Banking
- **Multiple Accounts**: Create and manage checking and savings accounts
- **Transaction History**: View detailed transaction history for each account
- **Account Management**: Edit account names/types and delete accounts

### Stacks System
- **Virtual Envelopes**: Create stacks (virtual envelopes) within your accounts to organize money
- **Goal Tracking**: Set target amounts and track progress with visual indicators
- **Auto-Allocation**: Configure automatic allocation to stacks on payday
- **Money Management**: Easily allocate and deallocate funds between available balance and stacks
- **Customization**: Choose from 15 emoji icons and 10 colors for each stack

### Bank Integration
- **Plaid Integration**: Connect external bank accounts (requires Plaid API credentials)
- **Transfer Funds**: Transfer money from linked bank accounts to your Stackwise accounts

### Security
- **JWT Authentication**: Secure user authentication with JSON Web Tokens
- **Password Hashing**: Bcrypt password encryption
- **Rate Limiting**: Protection against brute force attacks
- **Helmet.js**: Security headers for API protection

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **date-fns** for date formatting

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** with SQLite database
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Zod** for validation
- **Helmet** and **CORS** for security

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/Stackwise.git
cd Stackwise
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up environment variables:
```bash
# Create .env file in backend directory
cp .env.example .env

# Edit .env with your configuration:
DATABASE_URL="file:./stackwise.db"
JWT_SECRET="your-secure-secret-key-change-in-production"
PORT=5000

# Optional: For Plaid integration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ENV=sandbox
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:5000

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:3000

3. Open http://localhost:3000 in your browser

## Usage

### Getting Started
1. Register a new account with your email and password
2. Create your first checking or savings account
3. Start creating stacks to organize your money

### Creating Stacks
1. Select an account
2. Click "Create Stack"
3. Configure:
   - Name and description
   - Target amount (optional)
   - Icon and color
   - Auto-allocation settings

### Managing Money
- **Allocate**: Move money from available balance to a stack
- **Deallocate**: Move money back from a stack to available balance
- **Edit**: Modify stack settings anytime
- **Delete**: Remove stacks you no longer need

### Account Operations
- **Edit Account**: Click an account, then use the "Edit Account" button
- **Delete Account**: Remove accounts (must delete all stacks first)
- **View History**: See all transactions for each account

## Project Structure

```
Stackwise/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Utilities (JWT, Prisma)
│   │   └── server.ts          # Express app setup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript types
│   │   └── main.tsx          # App entry point
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:id/transactions` - Get account transactions

### Stacks
- `GET /api/accounts/:accountId/stacks` - Get stacks for account
- `POST /api/accounts/:accountId/stacks` - Create stack
- `PUT /api/stacks/:id` - Update stack
- `DELETE /api/stacks/:id` - Delete stack
- `POST /api/stacks/:id/allocate` - Allocate funds to stack
- `POST /api/stacks/:id/deallocate` - Deallocate funds from stack
- `GET /api/stacks/:id/transactions` - Get stack transactions

### Plaid Integration
- `POST /api/plaid/create-link-token` - Create Plaid Link token
- `POST /api/plaid/exchange-public-token` - Exchange public token
- `GET /api/plaid/linked-banks` - Get linked banks
- `DELETE /api/plaid/linked-banks/:id` - Unlink bank
- `POST /api/plaid/transfer` - Transfer from linked bank

## Database Schema

The app uses Prisma with SQLite and includes:
- **User**: User accounts with authentication
- **Account**: Checking/savings accounts
- **Stack**: Virtual envelopes within accounts
- **Transaction**: All monetary transactions
- **LinkedBank**: Connected external bank accounts via Plaid

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with ❤️ using React, Node.js, and TypeScript
- Icons by Lucide
- Bank integration powered by Plaid (optional)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
