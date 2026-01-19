# Pump.Fun Clone

A decentralized token launchpad built on Solana, inspired by pump.fun. This platform allows users to create and trade tokens using an automated bonding curve mechanism, enabling fair token launches without the need for liquidity pools.

## Features

- **Token Creation**: Launch new SPL tokens with custom metadata (name, symbol, image, description)
- **Bonding Curve Trading**: Automatic price discovery through constant product AMM formula
- **Real-time Updates**: Live price feeds and trade notifications via WebSocket
- **Wallet Integration**: Seamless connection with Phantom, Solflare, and other Solana wallets
- **User Profiles**: Track trading history, holdings, and created tokens
- **Leaderboards**: Top creators and traders rankings
- **Token Graduation**: Automatic migration to Raydium when bonding curve threshold is reached
- **Social Features**: Follow creators, receive notifications for token graduations
- **Responsive Design**: Mobile-friendly interface with dark mode support

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Wallet Adapter**: Solana Wallet Adapter

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JWT + Solana wallet signature verification
- **Validation**: express-validator

### Smart Contracts
- **Blockchain**: Solana
- **Framework**: Anchor 0.29.0
- **Language**: Rust
- **Token Standard**: SPL Token

## Architecture

```
+----------------------------------------------------------+
|                         FRONTEND                          |
|  +-----------------------------------------------------+  |
|  |              Next.js 14 (React + TypeScript)        |  |
|  |  +------------+  +------------+  +---------------+  |  |
|  |  |   Pages    |  | Components |  |    Hooks      |  |  |
|  |  | - Home     |  | - Trading  |  | - useTokens   |  |  |
|  |  | - Create   |  | - Profile  |  | - useWallet   |  |  |
|  |  | - Token    |  | - Charts   |  | - useSocket   |  |  |
|  |  | - Explore  |  | - Layout   |  | - useTrades   |  |  |
|  |  +------------+  +------------+  +---------------+  |  |
|  +-----------------------------------------------------+  |
|                           |                               |
|         Solana Wallet Adapter    |    Socket.IO Client    |
+---------------------------+-------------------------------+
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
+-------------+   +---------+---------+   +----------------+
|   SOLANA    |   |      BACKEND      |   |    MONGODB     |
|  BLOCKCHAIN |   |     (Node.js)     |   |    DATABASE    |
|             |   |                   |   |                |
| +---------+ |   | +---------------+ |   | +------------+ |
| | Program | |   | |  REST API     | |   | |   Users    | |
| | - Token | |   | |  - /auth      | |   | +------------+ |
| | - Curve | |   | |  - /tokens    | |   | |   Tokens   | |
| | - Trade | |   | |  - /trades    | |   | +------------+ |
| +---------+ |   | |  - /users     | |   | |   Trades   | |
|             |   | +---------------+ |   | +------------+ |
| +---------+ |   | +---------------+ |   |                |
| |  RPC    | |   | |  WebSocket    | |   |                |
| | Devnet  |<--->| |  Socket.IO    | |   |                |
| | Mainnet | |   | +---------------+ |   |                |
| +---------+ |   |                   |   |                |
+-------------+   +-------------------+   +----------------+
```

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- MongoDB 6.0+
- Solana CLI tools
- Anchor Framework 0.29.0
- A Solana wallet (Phantom recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pump_fun_clone.git
   cd pump_fun_clone
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install

   # Contracts (if building locally)
   cd ../contracts
   anchor build
   ```

3. **Configure environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6

   # Or start your local MongoDB service
   sudo systemctl start mongod
   ```

5. **Run the development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Open the application**
   Navigate to `http://localhost:3000` in your browser.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/pump_fun_clone` |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `SOLANA_NETWORK` | Network (devnet/mainnet-beta) | `devnet` |
| `PLATFORM_FEE_PERCENTAGE` | Trading fee percentage | `1` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

### Frontend

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Development Commands

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run start    # Start production server
npm run test     # Run tests
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Smart Contracts
```bash
anchor build     # Build the program
anchor test      # Run tests
anchor deploy    # Deploy to configured network
```

## Docker Deployment

### Using Docker Compose

1. **Create production environment files**
   ```bash
   cp backend/.env.example backend/.env.production
   # Edit with production values
   ```

2. **Build and start containers**
   ```bash
   docker-compose up -d --build
   ```

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

### Docker Compose Configuration

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: pump_fun_mongodb
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=pump_fun_clone

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: pump_fun_backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/pump_fun_clone
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: pump_fun_frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: pump_fun_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  mongodb_data:
```

## API Endpoints Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/nonce` | Get nonce for wallet signing |
| POST | `/api/auth/verify` | Verify signature and get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |

### Tokens
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tokens` | List all tokens |
| GET | `/api/tokens/:mint` | Get token by mint address |
| POST | `/api/tokens` | Create new token |
| GET | `/api/tokens/:mint/trades` | Get token trade history |
| GET | `/api/tokens/:mint/holders` | Get token holders |

### Trades
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trades/buy` | Execute buy order |
| POST | `/api/trades/sell` | Execute sell order |
| GET | `/api/trades/history` | Get user trade history |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:address` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/users/:address/tokens` | Get user created tokens |
| GET | `/api/users/:address/holdings` | Get user holdings |

For detailed API documentation, see [API.md](./API.md).

## Project Structure

```
pump_fun_clone/
├── backend/                    # Node.js backend service
│   ├── src/
│   │   ├── config/            # Configuration (database, solana)
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── index.js           # Entry point
│   ├── .env.example           # Environment template
│   └── package.json
│
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── api/           # API routes (BFF)
│   │   │   ├── create/        # Token creation page
│   │   │   ├── explore/       # Token exploration page
│   │   │   ├── leaderboard/   # Leaderboards page
│   │   │   ├── profile/       # User profile pages
│   │   │   ├── settings/      # User settings
│   │   │   └── token/         # Token detail pages
│   │   ├── components/        # React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── common/        # Shared components
│   │   │   ├── create/        # Token creation components
│   │   │   ├── explore/       # Exploration components
│   │   │   ├── home/          # Homepage components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── profile/       # Profile components
│   │   │   ├── realtime/      # Real-time components
│   │   │   ├── tokens/        # Token-related components
│   │   │   ├── trading/       # Trading components
│   │   │   └── ui/            # UI primitives
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── providers/         # React context providers
│   │   ├── services/          # API service layer
│   │   ├── store/             # Zustand stores
│   │   ├── styles/            # Global styles
│   │   └── types/             # TypeScript type definitions
│   ├── package.json
│   └── tailwind.config.js
│
├── contracts/                  # Solana smart contracts
│   ├── programs/
│   │   └── pump_fun/
│   │       ├── src/
│   │       │   └── state.rs   # Program state definitions
│   │       └── Cargo.toml
│   ├── tests/                 # Contract tests
│   ├── Anchor.toml            # Anchor configuration
│   └── Cargo.toml
│
├── shared/                     # Shared code between services
│   ├── constants/             # Shared constants
│   ├── types/                 # Shared type definitions
│   └── utils/                 # Shared utilities
│
├── nginx/                      # Nginx configuration
├── scripts/                    # Deployment and utility scripts
├── docker-compose.yml          # Docker composition
├── README.md                   # This file
├── SETUP.md                    # Detailed setup guide
└── API.md                      # API documentation
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues

### Code Style

- **TypeScript/JavaScript**: Follow ESLint configuration
- **Rust**: Follow `rustfmt` defaults
- **Commits**: Use conventional commits format
- **Documentation**: Update relevant docs with changes

### Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Contract tests
cd contracts && anchor test
```

## Security

- **Never commit secrets** or private keys
- **Report vulnerabilities** privately to maintainers
- **Smart contract audits** are recommended before mainnet deployment
- **Use environment variables** for all sensitive configuration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Support

- **Documentation**: [SETUP.md](./SETUP.md) | [API.md](./API.md)
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

---

Built with Solana, Next.js, and Node.js
