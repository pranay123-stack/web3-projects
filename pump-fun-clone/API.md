# API Documentation

This document provides comprehensive documentation for the Pump.Fun Clone REST API and WebSocket events.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Tokens](#token-endpoints)
  - [Trades](#trade-endpoints)
  - [Users](#user-endpoints)
- [WebSocket Events](#websocket-events)
- [Data Types](#data-types)

## Base URL

```
Development: http://localhost:3001/api
Production:  https://your-domain.com/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication combined with Solana wallet signature verification.

### Authentication Flow

1. **Request Nonce**: Get a unique nonce for signing
2. **Sign Message**: Sign the nonce with your Solana wallet
3. **Verify Signature**: Send the signature to verify and receive a JWT
4. **Use JWT**: Include the JWT in subsequent requests

### Using the JWT

Include the JWT in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### Example Authentication Flow

```javascript
// Step 1: Get nonce
const nonceResponse = await fetch('/api/auth/nonce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: 'YourWalletAddress...' })
});
const { nonce } = await nonceResponse.json();

// Step 2: Sign the nonce with wallet
const message = `Sign this message to authenticate with Pump.Fun Clone.\n\nNonce: ${nonce}`;
const encodedMessage = new TextEncoder().encode(message);
const signature = await wallet.signMessage(encodedMessage);

// Step 3: Verify and get JWT
const verifyResponse = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: 'YourWalletAddress...',
    signature: bs58.encode(signature),
    nonce
  })
});
const { token, user } = await verifyResponse.json();

// Step 4: Use JWT in requests
const protectedResponse = await fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid token symbol",
    "details": {
      "field": "symbol",
      "reason": "Symbol must be 2-10 uppercase letters or numbers"
    }
  }
}
```

## Rate Limiting

Default rate limits:
- **100 requests** per **15 minutes** per IP
- **Higher limits** for authenticated users

Rate limit headers in response:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
```

---

## Endpoints

### Authentication Endpoints

#### POST /api/auth/nonce

Get a unique nonce for wallet signature verification.

**Request Body:**
```json
{
  "walletAddress": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "expiresAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV"}'
```

---

#### POST /api/auth/verify

Verify wallet signature and receive JWT token.

**Request Body:**
```json
{
  "walletAddress": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
  "signature": "base58-encoded-signature",
  "nonce": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-01-22T10:30:00.000Z",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "walletAddress": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
      "username": null,
      "avatar": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

#### GET /api/auth/me

Get current authenticated user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "walletAddress": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
    "username": "cryptotrader",
    "avatar": "https://example.com/avatar.png",
    "bio": "Solana enthusiast",
    "tokensCreated": 5,
    "totalTrades": 150,
    "totalVolume": 1234.56,
    "followers": 42,
    "following": 18,
    "isVerified": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### POST /api/auth/logout

Invalidate current session.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

---

### Token Endpoints

#### GET /api/tokens

Get list of tokens with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `createdAt` | Sort field: `createdAt`, `marketCap`, `volume24h`, `price` |
| `order` | string | `desc` | Sort order: `asc`, `desc` |
| `search` | string | - | Search by name or symbol |
| `creator` | string | - | Filter by creator address |
| `graduated` | boolean | - | Filter by graduation status |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "address": "TokenMint1234567890abcdefghijklmnopqrstuvwxyz",
        "name": "Example Token",
        "symbol": "EXMP",
        "description": "An example token for demonstration",
        "image": "https://example.com/token-image.png",
        "creator": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "marketCap": 50000.00,
        "price": 0.0001,
        "priceChange24h": 15.5,
        "volume24h": 12500.00,
        "holders": 256,
        "bondingCurveProgress": 45.5,
        "isGraduated": false
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

**Example:**
```bash
curl "http://localhost:3001/api/tokens?page=1&limit=10&sort=marketCap&order=desc"
```

---

#### GET /api/tokens/:mint

Get token details by mint address.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `mint` | Token mint address |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "address": "TokenMint1234567890abcdefghijklmnopqrstuvwxyz",
    "name": "Example Token",
    "symbol": "EXMP",
    "description": "An example token for demonstration",
    "image": "https://example.com/token-image.png",
    "creator": {
      "walletAddress": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
      "username": "tokenmaster",
      "avatar": "https://example.com/avatar.png"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "marketCap": 50000.00,
    "price": 0.0001,
    "priceChange24h": 15.5,
    "priceChange1h": 2.3,
    "volume24h": 12500.00,
    "volumeTotal": 150000.00,
    "holders": 256,
    "totalSupply": 1000000000,
    "bondingCurve": {
      "progress": 45.5,
      "virtualSolReserves": 30.0,
      "virtualTokenReserves": 800000000,
      "realSolReserves": 15.0,
      "realTokenReserves": 550000000
    },
    "isGraduated": false,
    "socialLinks": {
      "twitter": "https://twitter.com/exampletoken",
      "telegram": "https://t.me/exampletoken",
      "website": "https://example.com"
    }
  }
}
```

---

#### POST /api/tokens

Create a new token. Requires authentication.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Token name (2-32 chars) |
| `symbol` | string | Yes | Token symbol (2-10 chars) |
| `description` | string | Yes | Token description (10-500 chars) |
| `image` | file | Yes | Token image (JPG/PNG/GIF/WebP, max 5MB) |
| `twitter` | string | No | Twitter handle or URL |
| `telegram` | string | No | Telegram handle or URL |
| `website` | string | No | Website URL |

**Response:**
```json
{
  "success": true,
  "data": {
    "token": {
      "id": "507f1f77bcf86cd799439011",
      "address": "NewTokenMint1234567890abcdefghijklmnopqrst",
      "name": "My New Token",
      "symbol": "MNT",
      "description": "A brand new token",
      "image": "https://storage.example.com/tokens/mnt.png",
      "creator": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "transaction": {
      "signature": "transaction-signature-here",
      "status": "confirmed"
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/tokens \
  -H "Authorization: Bearer <token>" \
  -F "name=My New Token" \
  -F "symbol=MNT" \
  -F "description=A brand new token on Solana" \
  -F "image=@/path/to/image.png" \
  -F "twitter=@mynewtoken"
```

---

#### GET /api/tokens/:mint/trades

Get trade history for a specific token.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `mint` | Token mint address |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439012",
        "type": "buy",
        "user": {
          "walletAddress": "Buyer1234567890abcdefghijklmnopqrstuvwxyz",
          "username": "trader123"
        },
        "tokenAmount": 1000000,
        "solAmount": 0.1,
        "price": 0.0001,
        "timestamp": "2024-01-15T10:35:00.000Z",
        "txSignature": "tx-signature-here"
      }
    ],
    "total": 500,
    "page": 1,
    "pageSize": 50,
    "hasMore": true
  }
}
```

---

#### GET /api/tokens/:mint/holders

Get holder list for a specific token.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `mint` | Token mint address |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "rank": 1,
        "user": {
          "walletAddress": "Holder1234567890abcdefghijklmnopqrstuvwxyz",
          "username": "whale123"
        },
        "amount": 100000000,
        "percentage": 10.0,
        "value": 10000.00
      }
    ],
    "total": 256,
    "page": 1,
    "pageSize": 50,
    "hasMore": true
  }
}
```

---

### Trade Endpoints

#### POST /api/trades/buy

Execute a buy order. Requires authentication.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "tokenMint": "TokenMint1234567890abcdefghijklmnopqrstuvwxyz",
  "solAmount": 0.1,
  "slippageBps": 100,
  "signedTransaction": "base64-encoded-signed-transaction"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenMint` | string | Yes | Token mint address |
| `solAmount` | number | Yes | Amount of SOL to spend |
| `slippageBps` | number | No | Slippage tolerance in basis points (default: 100 = 1%) |
| `signedTransaction` | string | Yes | Base64 encoded signed transaction |

**Response:**
```json
{
  "success": true,
  "data": {
    "trade": {
      "id": "507f1f77bcf86cd799439013",
      "type": "buy",
      "tokenMint": "TokenMint1234567890abcdefghijklmnopqrstuvwxyz",
      "tokenAmount": 1000000,
      "solAmount": 0.1,
      "price": 0.0001,
      "priceImpact": 0.5,
      "fee": 0.001,
      "timestamp": "2024-01-15T10:40:00.000Z"
    },
    "transaction": {
      "signature": "tx-signature-here",
      "status": "confirmed"
    },
    "newBalance": 1000000
  }
}
```

---

#### POST /api/trades/sell

Execute a sell order. Requires authentication.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "tokenMint": "TokenMint1234567890abcdefghijklmnopqrstuvwxyz",
  "tokenAmount": 500000,
  "slippageBps": 100,
  "signedTransaction": "base64-encoded-signed-transaction"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenMint` | string | Yes | Token mint address |
| `tokenAmount` | number | Yes | Amount of tokens to sell |
| `slippageBps` | number | No | Slippage tolerance in basis points (default: 100 = 1%) |
| `signedTransaction` | string | Yes | Base64 encoded signed transaction |

**Response:**
```json
{
  "success": true,
  "data": {
    "trade": {
      "id": "507f1f77bcf86cd799439014",
      "type": "sell",
      "tokenMint": "TokenMint1234567890abcdefghijklmnopqrstuvwxyz",
      "tokenAmount": 500000,
      "solAmount": 0.055,
      "price": 0.00011,
      "priceImpact": 0.3,
      "fee": 0.00055,
      "timestamp": "2024-01-15T10:45:00.000Z"
    },
    "transaction": {
      "signature": "tx-signature-here",
      "status": "confirmed"
    },
    "newBalance": 500000
  }
}
```

---

#### GET /api/trades/history

Get authenticated user's trade history.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |
| `tokenMint` | string | - | Filter by token |
| `type` | string | - | Filter by type: `buy`, `sell` |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439013",
        "type": "buy",
        "token": {
          "address": "TokenMint1234567890abcdefghijklmnopqrstuvwxyz",
          "name": "Example Token",
          "symbol": "EXMP",
          "image": "https://example.com/token.png"
        },
        "tokenAmount": 1000000,
        "solAmount": 0.1,
        "price": 0.0001,
        "timestamp": "2024-01-15T10:40:00.000Z",
        "txSignature": "tx-signature-here"
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 50,
    "hasMore": true
  }
}
```

---

#### GET /api/trades/quote

Get a price quote for a trade (no authentication required).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenMint` | string | Yes | Token mint address |
| `type` | string | Yes | Trade type: `buy`, `sell` |
| `amount` | number | Yes | Amount (SOL for buy, tokens for sell) |

**Response:**
```json
{
  "success": true,
  "data": {
    "quote": {
      "inputAmount": 0.1,
      "outputAmount": 980000,
      "price": 0.000102,
      "priceImpact": 0.5,
      "fee": 0.001,
      "minOutputAmount": 970200
    }
  }
}
```

---

### User Endpoints

#### GET /api/users/:address

Get user profile by wallet address.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `address` | Solana wallet address |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "walletAddress": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
    "username": "cryptotrader",
    "avatar": "https://example.com/avatar.png",
    "bio": "Solana enthusiast and token creator",
    "stats": {
      "tokensCreated": 5,
      "totalTrades": 150,
      "totalVolume": 1234.56,
      "totalPnL": 234.56,
      "followers": 42,
      "following": 18
    },
    "isVerified": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### PUT /api/users/profile

Update authenticated user's profile.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | No | Username (3-30 chars) |
| `bio` | string | No | Bio (max 500 chars) |
| `avatar` | file | No | Avatar image (max 2MB) |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "walletAddress": "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
    "username": "newusername",
    "avatar": "https://storage.example.com/avatars/newavatar.png",
    "bio": "Updated bio",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

#### GET /api/users/:address/tokens

Get tokens created by a user.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `address` | Solana wallet address |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "address": "TokenMint1234...",
        "name": "Example Token",
        "symbol": "EXMP",
        "image": "https://example.com/token.png",
        "marketCap": 50000.00,
        "price": 0.0001,
        "priceChange24h": 15.5,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

---

#### GET /api/users/:address/holdings

Get token holdings for a user.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `address` | Solana wallet address |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "holding-id",
        "token": {
          "address": "TokenMint1234...",
          "name": "Example Token",
          "symbol": "EXMP",
          "image": "https://example.com/token.png",
          "price": 0.0001
        },
        "amount": 1000000,
        "value": 100.00,
        "averageBuyPrice": 0.00008,
        "currentPrice": 0.0001,
        "pnl": 20.00,
        "pnlPercentage": 25.0
      }
    ],
    "total": 10,
    "totalValue": 1500.00,
    "totalPnL": 234.56,
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

---

#### GET /api/users/leaderboard

Get top users leaderboard.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `volume` | Leaderboard type: `volume`, `creators`, `pnl` |
| `period` | string | `all` | Time period: `24h`, `7d`, `30d`, `all` |
| `limit` | number | 10 | Number of users (max 100) |

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "volume",
    "period": "7d",
    "items": [
      {
        "rank": 1,
        "user": {
          "walletAddress": "TopTrader1234...",
          "username": "whalemaster",
          "avatar": "https://example.com/avatar.png"
        },
        "value": 50000.00,
        "trades": 250
      }
    ]
  }
}
```

---

## WebSocket Events

Connect to the WebSocket server for real-time updates.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token' // Optional for authenticated features
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});
```

### Subscribing to Channels

#### Subscribe to Token Updates

```javascript
// Subscribe to a specific token
socket.emit('subscribe:token', { tokenMint: 'TokenMint1234...' });

// Unsubscribe
socket.emit('unsubscribe:token', { tokenMint: 'TokenMint1234...' });
```

#### Subscribe to Global Feed

```javascript
// Subscribe to all new tokens and trades
socket.emit('subscribe:global');

// Unsubscribe
socket.emit('unsubscribe:global');
```

### Events

#### `token:created`

Emitted when a new token is created.

```javascript
socket.on('token:created', (data) => {
  console.log('New token:', data);
});

// Data structure:
{
  "token": {
    "address": "NewTokenMint...",
    "name": "New Token",
    "symbol": "NEW",
    "image": "https://...",
    "creator": "CreatorAddress...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### `trade:executed`

Emitted when a trade occurs on a subscribed token.

```javascript
socket.on('trade:executed', (data) => {
  console.log('Trade:', data);
});

// Data structure:
{
  "tokenMint": "TokenMint1234...",
  "trade": {
    "type": "buy",
    "user": "TraderAddress...",
    "tokenAmount": 1000000,
    "solAmount": 0.1,
    "price": 0.0001,
    "timestamp": "2024-01-15T10:40:00.000Z",
    "txSignature": "tx-sig..."
  },
  "newPrice": 0.000102,
  "newMarketCap": 51000.00
}
```

#### `price:updated`

Emitted when token price changes (aggregated updates).

```javascript
socket.on('price:updated', (data) => {
  console.log('Price update:', data);
});

// Data structure:
{
  "tokenMint": "TokenMint1234...",
  "price": 0.000105,
  "priceChange1h": 5.0,
  "priceChange24h": 15.5,
  "marketCap": 52500.00,
  "volume24h": 13000.00
}
```

#### `token:graduated`

Emitted when a token graduates to Raydium.

```javascript
socket.on('token:graduated', (data) => {
  console.log('Token graduated:', data);
});

// Data structure:
{
  "tokenMint": "TokenMint1234...",
  "raydiumPoolAddress": "PoolAddress...",
  "finalPrice": 0.00015,
  "totalVolume": 85000.00,
  "graduatedAt": "2024-01-15T12:00:00.000Z"
}
```

---

## Data Types

### Token

```typescript
interface Token {
  id: string;
  address: string;              // Mint address
  name: string;                 // 2-32 characters
  symbol: string;               // 2-10 characters
  description?: string;         // Max 500 characters
  image?: string;               // URL
  creator: string;              // Creator wallet address
  createdAt: string;            // ISO 8601 timestamp
  marketCap: number;            // In SOL
  price: number;                // SOL per token
  priceChange24h: number;       // Percentage
  volume24h: number;            // In SOL
  holders: number;              // Number of holders
  bondingCurveProgress: number; // 0-100 percentage
  isGraduated: boolean;         // True if migrated to Raydium
}
```

### User

```typescript
interface User {
  id: string;
  walletAddress: string;
  username?: string;            // 3-30 characters
  avatar?: string;              // URL
  bio?: string;                 // Max 500 characters
  tokensCreated: number;
  totalTrades: number;
  totalVolume: number;          // In SOL
  followers: number;
  following: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Trade

```typescript
interface Trade {
  id: string;
  type: 'buy' | 'sell';
  tokenMint: string;
  user: string;                 // Wallet address
  tokenAmount: number;
  solAmount: number;
  price: number;                // SOL per token at trade time
  priceImpact: number;          // Percentage
  fee: number;                  // In SOL
  timestamp: string;
  txSignature: string;
}
```

### Holding

```typescript
interface Holding {
  token: Token;
  amount: number;
  value: number;                // Current value in SOL
  averageBuyPrice: number;
  currentPrice: number;
  pnl: number;                  // Profit/loss in SOL
  pnlPercentage: number;
}
```

---

## SDKs and Code Examples

### JavaScript/TypeScript SDK Example

```typescript
class PumpFunClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  async authenticate(walletAddress: string, signMessage: (msg: Uint8Array) => Promise<Uint8Array>) {
    // Get nonce
    const nonceRes = await fetch(`${this.baseUrl}/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    const { data: { nonce } } = await nonceRes.json();

    // Sign message
    const message = `Sign this message to authenticate with Pump.Fun Clone.\n\nNonce: ${nonce}`;
    const signature = await signMessage(new TextEncoder().encode(message));

    // Verify
    const verifyRes = await fetch(`${this.baseUrl}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        signature: Buffer.from(signature).toString('base64'),
        nonce
      })
    });
    const { data } = await verifyRes.json();
    this.token = data.token;
    return data;
  }

  async getTokens(params?: { page?: number; limit?: number; sort?: string }) {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${this.baseUrl}/tokens?${queryString}`);
    return res.json();
  }

  async getToken(mint: string) {
    const res = await fetch(`${this.baseUrl}/tokens/${mint}`);
    return res.json();
  }

  async createToken(formData: FormData) {
    const res = await fetch(`${this.baseUrl}/tokens`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });
    return res.json();
  }

  async buyToken(tokenMint: string, solAmount: number, signedTx: string) {
    const res = await fetch(`${this.baseUrl}/trades/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tokenMint, solAmount, signedTransaction: signedTx })
    });
    return res.json();
  }
}
```

---

For more examples and integration guides, see the [project repository](https://github.com/yourusername/pump_fun_clone).
