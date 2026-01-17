#!/bin/bash

# Carbon Credit Marketplace Deployment Script
# For Aptos Testnet/Mainnet

set -e  # Exit on error

echo "=========================================="
echo "Carbon Credit Marketplace Deployment"
echo "=========================================="
echo ""

# Configuration
NETWORK="${1:-testnet}"  # Default to testnet
MODULE_ADDRESS="${2}"

if [ -z "$MODULE_ADDRESS" ]; then
    echo "Error: Module address required"
    echo "Usage: ./deploy.sh <network> <module_address>"
    echo "Example: ./deploy.sh testnet 0x1234...5678"
    exit 1
fi

echo "Network: $NETWORK"
echo "Module Address: $MODULE_ADDRESS"
echo ""

# Step 1: Compile Move modules
echo "Step 1: Compiling Move modules..."
aptos move compile \
    --named-addresses carbon_marketplace=$MODULE_ADDRESS \
    --save-metadata

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful"
else
    echo "❌ Compilation failed"
    exit 1
fi
echo ""

# Step 2: Run tests
echo "Step 2: Running tests..."
aptos move test \
    --named-addresses carbon_marketplace=$MODULE_ADDRESS

if [ $? -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi
echo ""

# Step 3: Deploy to network
echo "Step 3: Deploying to $NETWORK..."
aptos move publish \
    --named-addresses carbon_marketplace=$MODULE_ADDRESS \
    --network $NETWORK \
    --assume-yes

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful"
else
    echo "❌ Deployment failed"
    exit 1
fi
echo ""

# Step 4: Initialize contracts (optional - requires manual calling)
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Initialize carbon credit collection:"
echo "   aptos move run --function-id ${MODULE_ADDRESS}::carbon_credit_nft::initialize_collection \\"
echo "     --args string:'Verified Carbon Credits' string:'Carbon Collection' string:'https://...' \\"
echo "     --network $NETWORK"
echo ""
echo "2. Initialize marketplace:"
echo "   aptos move run --function-id ${MODULE_ADDRESS}::marketplace::initialize_marketplace \\"
echo "     --args u64:250 address:$MODULE_ADDRESS \\"
echo "     --network $NETWORK"
echo ""
echo "3. Initialize verification system:"
echo "   aptos move run --function-id ${MODULE_ADDRESS}::verification::initialize_verification_system \\"
echo "     --network $NETWORK"
echo ""
echo "Module deployed at: $MODULE_ADDRESS on $NETWORK"
echo "=========================================="
