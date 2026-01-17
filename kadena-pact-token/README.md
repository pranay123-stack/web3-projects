# Kadena Fungible Token Smart Contract

A complete fungible token implementation written in Kadena's PACT smart contract language.

## Features

- **Token Metadata**: Name, symbol, decimals, and total supply tracking
- **Account Management**: Create accounts with customizable guards
- **Minting**: Admin-only token creation with supply tracking
- **Burning**: Admin-only token destruction with supply tracking
- **Transfers**: Secure peer-to-peer transfers with guard enforcement
- **Transfer-Create**: Transfer to new accounts (creates account if needed)
- **Guard Rotation**: Update account security keys

## Project Structure

```
kadena-token-contract/
├── token.pact      # Main smart contract
├── token.repl      # Test suite
└── README.md       # This file
```

## Contract Functions

### Token Info
- `init-token`: Initialize token metadata (admin only)
- `get-name`: Get token name
- `get-symbol`: Get token symbol
- `get-decimals`: Get decimal places
- `get-total-supply`: Get total circulating supply
- `get-token-info`: Get all token metadata

### Account Management
- `create-account`: Create a new account with a guard
- `get-balance`: Get account balance
- `account-exists`: Check if account exists
- `get-account-details`: Get full account details

### Transfers
- `transfer`: Transfer tokens between existing accounts
- `transfer-create`: Transfer tokens, creating recipient account if needed

### Admin Functions
- `mint`: Create new tokens (admin only)
- `mint-create`: Mint to new account (admin only)
- `burn`: Destroy tokens (admin only)

### Utilities
- `rotate-guard`: Update account security guard

## Running Tests

Install PACT and run:

```bash
pact token.repl
```

## Deployment

1. Set up your keyset in transaction data:
```json
{
  "token-admin-keyset": {
    "keys": ["your-public-key"],
    "pred": "keys-all"
  },
  "init": true
}
```

2. Deploy the contract to the Kadena blockchain

3. Initialize the token:
```pact
(free.simple-token.init-token "MyToken" "MTK" 18)
```

## Security

- Admin functions protected by keyset capability
- Transfer requires sender's guard signature
- Internal debit/credit functions protected by capabilities
- Guard rotation requires current guard authorization

## License

MIT
