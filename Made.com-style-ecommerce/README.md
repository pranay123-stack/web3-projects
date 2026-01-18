# Made.com-Style E-commerce Platform

A modern, full-featured e-commerce platform inspired by Made.com, built with Next.js 16, TypeScript, and Tailwind CSS. Features traditional payment methods (Stripe) alongside Web3 cryptocurrency payments via MetaMask.

![Made E-commerce](https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=400&fit=crop)

## 🚀 Features

### Core E-commerce
- **Product Catalog** - Browse furniture, lighting, décor, and outdoor products
- **Product Filtering** - Filter by category, price range, and sort options
- **Product Details** - Detailed product pages with multiple images, dimensions, materials
- **Shopping Cart** - Persistent cart using localStorage (survives page refresh)
- **Wishlist** - Save favorite products for later
- **Search** - Search functionality in header

### User Authentication
- **Email/Password Login** - Traditional authentication system
- **User Registration** - Create new accounts
- **JWT Tokens** - Secure session management
- **Protected Routes** - Dashboard access for authenticated users

### Payment Integration
- **Stripe Checkout** - Credit/debit card payments
- **Crypto Payments** - Pay with ETH, USDT, or USDC
- **Multi-Network Support** - Ethereum, Polygon, BSC networks
- **MetaMask Integration** - Connect wallet, view balance, send transactions

### User Dashboard
- **Order History** - View past orders and status
- **Wallet Management** - Connect/disconnect MetaMask, view transactions
- **Profile Settings** - Update personal information
- **Saved Addresses** - Manage shipping addresses

### Admin Dashboard
- **Product Management** - Add, edit, delete products
- **Order Management** - View and update order status
- **Analytics Overview** - Revenue, orders, customers stats
- **Inventory Tracking** - Stock level monitoring

### UI/UX
- **Responsive Design** - Mobile-first, works on all devices
- **Skeleton Loaders** - Loading states for better UX
- **Toast Notifications** - Feedback for user actions
- **Smooth Animations** - Framer Motion transitions
- **Clean Typography** - Inter font family

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **State Management** | Zustand (with persistence) |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT + bcryptjs |
| **Payments** | Stripe |
| **Web3** | ethers.js v6 |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Notifications** | React Hot Toast |

## 📁 Project Structure

```
made-ecommerce/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (shop)/            # Shop pages (products, categories)
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── checkout/      # Payment endpoints
│   │   │   ├── orders/        # Order management
│   │   │   └── products/      # Product CRUD
│   │   ├── auth/              # Login/Register pages
│   │   ├── checkout/          # Checkout flow
│   │   ├── dashboard/         # User dashboard
│   │   └── wishlist/          # Wishlist page
│   ├── components/
│   │   ├── cart/              # Cart drawer component
│   │   ├── layout/            # Header, Footer
│   │   ├── product/           # Product card
│   │   ├── ui/                # Reusable UI components
│   │   └── wallet/            # MetaMask wallet button
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── db.ts              # MongoDB connection
│   │   └── models/            # Mongoose schemas
│   ├── store/                 # Zustand stores
│   │   ├── authStore.ts       # Authentication state
│   │   ├── cartStore.ts       # Shopping cart state
│   │   ├── walletStore.ts     # Web3 wallet state
│   │   └── wishlistStore.ts   # Wishlist state
│   └── types/                 # TypeScript definitions
├── .env.example               # Environment variables template
├── next.config.ts             # Next.js configuration
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (required for Next.js 16)
- MongoDB (local or Atlas)
- MetaMask browser extension (for crypto features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranay123-stack/web3-projects.git
   cd web3-projects/Made.com-style-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/made-ecommerce

   # JWT
   JWT_SECRET=your-super-secret-jwt-key

   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_KEY=pk_test_...

   # Crypto
   NEXT_PUBLIC_CRYPTO_WALLET=0xYourWalletAddress

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 💳 Payment Setup

### Stripe (Card Payments)

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Dashboard
3. Add keys to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_KEY=pk_test_...
   ```

### Crypto Payments

1. Install MetaMask browser extension
2. Set your receiving wallet address in `.env`:
   ```env
   NEXT_PUBLIC_CRYPTO_WALLET=0xYourWalletAddress
   ```

**Supported Cryptocurrencies:**
- ETH (Ethereum)
- USDT (Tether)
- USDC (USD Coin)

**Supported Networks:**
- Ethereum Mainnet
- Polygon
- BSC (Binance Smart Chain)
- Sepolia Testnet (for testing)

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | User login |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/[id]` | Get single product |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/[id]` | Update product (admin) |
| DELETE | `/api/products/[id]` | Delete product (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |

### Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout/stripe` | Create Stripe session |
| POST | `/api/checkout/crypto` | Initialize crypto payment |
| PUT | `/api/checkout/crypto` | Confirm crypto payment |

## 🎨 Key Components

### Cart Store (Zustand)
```typescript
// Persistent cart that survives page refresh
const { addItem, removeItem, getSubtotal } = useCartStore();
```

### Wallet Store (Web3)
```typescript
// MetaMask integration
const { connect, address, balance } = useWalletStore();
```

### Product Filters
```typescript
// Filter products by category, price, etc.
const filters: ProductFilters = {
  category: 'Furniture',
  minPrice: 100,
  maxPrice: 1000,
  sortBy: 'price-asc'
};
```

## 📱 Responsive Breakpoints

| Breakpoint | Width | Description |
|------------|-------|-------------|
| Mobile | < 768px | Single column, hamburger menu |
| Tablet | 768px - 1024px | 2-3 column grid |
| Desktop | > 1024px | Full layout, 4 column grid |

## 🧪 Demo Mode

The app works fully in demo mode without a database:
- Sample products are loaded client-side
- Cart persists in localStorage
- Wallet connects to real MetaMask
- Checkout flow is fully functional (Stripe in test mode)

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔮 Future Enhancements

- [ ] PayPal integration
- [ ] Product reviews and ratings
- [ ] Inventory management with low stock alerts
- [ ] Email notifications (order confirmation, shipping)
- [ ] Multi-language support (i18n)
- [ ] Advanced search with Algolia
- [ ] Real-time order tracking
- [ ] Discount codes and promotions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Pranay**
- GitHub: [@pranay123-stack](https://github.com/pranay123-stack)

---

Built with ❤️ using Next.js and Web3 technologies
